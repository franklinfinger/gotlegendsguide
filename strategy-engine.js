const DAMAGE_MECHANICS = new Set(['physical_damage','fire_damage','unnatural_damage','true_damage']);
const CONTROL_MECHANICS = new Set(['apply_bleed','apply_fire','apply_ice','apply_raid','apply_poison','apply_wound','stun','pacify','deceive','buff_removal']);
const SUPPORT_MECHANICS = new Set(['healing','shield','stamina','cleanse','taunt','defense','revive']);

const normalize = value => String(value || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const round = value => Math.round(value * 10) / 10;

/** Parse only targets explicitly supported by the deterministic catalog. */
export function parseStrategyQuestion(question, targets) {
  const text = normalize(question);
  if (!text) return null;
  const byId = new Map(targets.map(target => [target.id, target]));
  const encounterNames = ['icy viserion','drogon','rhaegal','viserion'];
  for (const name of encounterNames) {
    if (text.includes(name)) return byId.get(`legendary-assault:${name.replaceAll(' ','-')}`) || null;
  }
  if (text.includes('raid')) {
    if (text.includes('defense') || text.includes('defence') || text.includes('defensive')) return byId.get('raid:defense') || null;
    if (text.includes('attack') || text.includes('attacking') || text.includes('offense') || text.includes('offence')) return byId.get('raid:attack') || null;
    return null;
  }
  const warTargets = targets.filter(target => target.battleMode === 'war');
  return warTargets.find(target => text.includes(normalize(target.name))) || null;
}

function factIndex(strategyData) {
  const map = new Map();
  for (const fact of strategyData.championFacts) {
    if (!map.has(fact.variantId)) map.set(fact.variantId, []);
    map.get(fact.variantId).push(fact);
  }
  return map;
}

function uniqueObservedVariant(name, champions) {
  const exact = champions.filter(champion => normalize(champion.name) === normalize(name));
  if (exact.length === 1) return exact[0];
  const base = champions.filter(champion => normalize(champion.name.split(/\s+[—-]\s+/)[0]) === normalize(name));
  return base.length === 1 ? base[0] : null;
}

function observedPairIndex(teams, champions) {
  const pairs = new Map();
  for (const team of teams) {
    const resolved = team.members.map(member => uniqueObservedVariant(member.name, champions)).filter(Boolean);
    for (let left = 0; left < resolved.length; left += 1) {
      for (let right = left + 1; right < resolved.length; right += 1) {
        const ids = [resolved[left].id, resolved[right].id].sort();
        const key = ids.join('|');
        const entry = pairs.get(key) || {count: 0, examples: []};
        entry.count += 1;
        entry.examples.push(team.id);
        pairs.set(key, entry);
      }
    }
  }
  return pairs;
}

function championScore(champion, facts, rules) {
  const activeFacts = facts.filter(fact => fact.context !== 'leader');
  const leaderFacts = facts.filter(fact => fact.context === 'leader');
  const activeMechanics = new Set(activeFacts.map(fact => fact.mechanicId));
  const leaderMechanics = new Set(leaderFacts.map(fact => fact.mechanicId));
  const contributions = [];
  for (const rule of rules) {
    if (rule.subjectVariantId && rule.subjectVariantId !== champion.id) continue;
    if (!activeMechanics.has(rule.mechanicId)) continue;
    const fact = activeFacts.find(row => row.mechanicId === rule.mechanicId);
    contributions.push({score:Number(rule.score),rule,fact});
  }
  let leaderPotential = leaderFacts.some(fact => fact.mechanicId === 'leader_effect') ? 3 : 0;
  for (const rule of rules) if (leaderMechanics.has(rule.mechanicId)) leaderPotential += Number(rule.score) * 0.5;
  const directScore = contributions.reduce((sum, row) => sum + row.score, 0);
  return {
    champion,
    facts,
    mechanics: new Set(facts.map(fact => fact.mechanicId)),
    contributions,
    leaderFacts,
    leaderPotential,
    score: directScore + Math.max(0, leaderPotential) * 0.25,
  };
}

function teamEvaluation(team, synergyRules, observedPairs) {
  let score = team.reduce((sum, member) => sum + member.score, 0);
  const explanations = [];
  for (const rule of synergyRules) {
    const primary = team.filter(member => member.mechanics.has(rule.mechanicId));
    const secondary = rule.pairedMechanicId ? team.filter(member => member.mechanics.has(rule.pairedMechanicId)) : [];
    let applies = false;
    if (!rule.pairedMechanicId) applies = primary.length > 0;
    else if (rule.mechanicId === rule.pairedMechanicId) applies = primary.length > 1;
    else applies = primary.some(a => secondary.some(b => a.champion.id !== b.champion.id));
    if (!applies) continue;
    score += Number(rule.score);
    explanations.push({
      id: rule.id,
      text: rule.rationale,
      score: Number(rule.score),
      evidenceCategory: rule.evidenceCategory,
      provenanceRef: rule.provenanceRef,
      confidence: Number(rule.confidence),
    });
  }
  const factions = new Map();
  for (const member of team) for (const faction of member.champion.factions) {
    if (!factions.has(faction)) factions.set(faction, []);
    factions.get(faction).push(member.champion.name);
  }
  for (const [faction, names] of factions) if (names.length > 1) {
    const bonus = Math.min(4, names.length - 1);
    score += bonus;
    explanations.push({id:`shared-faction-${normalize(faction).replaceAll(' ','-')}`,text:`${names.length} ${faction} members share a verified current faction context.`,score:bonus,evidenceCategory:'strategy_inference',provenanceRef:`faction:${faction}`,confidence:0.7});
  }
  for (let left = 0; left < team.length; left += 1) for (let right = left + 1; right < team.length; right += 1) {
    const key = [team[left].champion.id,team[right].champion.id].sort().join('|');
    const observed = observedPairs.get(key);
    if (!observed) continue;
    const bonus = Math.min(1.5, observed.count * 0.5);
    score += bonus;
    explanations.push({id:`observed-${key}`,text:`${team[left].champion.name} and ${team[right].champion.name} appeared together in ${observed.count} observed composition${observed.count===1?'':'s'}; no outcome was shown.`,score:bonus,evidenceCategory:'community_observed',provenanceRef:`community_team:${observed.examples.join(',')}`,confidence:0.45});
  }
  const leader = [...team].filter(member => member.leaderFacts.some(fact => fact.mechanicId === 'leader_effect')).sort((a,b)=>b.leaderPotential-a.leaderPotential || a.champion.name.localeCompare(b.champion.name))[0] || null;
  if (leader && leader.leaderPotential > 0) score += leader.leaderPotential;
  return {score,explanations,leader};
}

function teamKey(team) { return team.map(member => member.champion.id).sort().join('|'); }

function selectTeam(candidates, synergyRules, observedPairs) {
  const pool = candidates.slice(0, 24);
  let beam = [{team:[],score:0,explanations:[],leader:null}];
  for (let size = 0; size < 5; size += 1) {
    const next = new Map();
    for (const state of beam) for (const candidate of pool) {
      if (state.team.some(member => member.champion.id === candidate.champion.id)) continue;
      const team = [...state.team,candidate].sort((a,b)=>a.champion.id.localeCompare(b.champion.id));
      const evaluation = teamEvaluation(team,synergyRules,observedPairs);
      const key = teamKey(team);
      if (!next.has(key) || next.get(key).score < evaluation.score) next.set(key,{team,...evaluation});
    }
    beam = [...next.values()].sort((a,b)=>b.score-a.score || teamKey(a.team).localeCompare(teamKey(b.team))).slice(0, 180);
  }
  return beam[0] || {team:[],score:0,explanations:[],leader:null};
}

function bestReason(member) {
  const positives = member.contributions.filter(row=>row.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  if (positives.length) return positives.map(row=>({text:row.rule.rationale,score:row.score,evidenceCategory:row.rule.evidenceCategory,provenanceRef:row.rule.provenanceRef,confidence:Number(row.rule.confidence),fact:row.fact.factText,factProvenanceRef:row.fact.provenanceRef,factEvidenceCategory:row.fact.evidenceCategory}));
  const useful = member.facts.find(fact=>[...DAMAGE_MECHANICS,...SUPPORT_MECHANICS,...CONTROL_MECHANICS].includes(fact.mechanicId));
  return useful ? [{text:`Provides ${useful.factText}`,score:0,evidenceCategory:useful.evidenceCategory,provenanceRef:useful.provenanceRef,confidence:Number(useful.confidence),fact:useful.factText,factProvenanceRef:useful.provenanceRef,factEvidenceCategory:useful.evidenceCategory}] : [];
}

/**
 * Rank exact variants and assemble a five-champion team from verified mechanics.
 * Account roster, stars, levels, gear, and power are deliberately excluded.
 */
export function recommendTeam({guideData,strategyData,targetId,excludeVariantIds=[]}) {
  const target = strategyData.targets.find(row=>row.id===targetId);
  if (!target) throw new Error(`Unsupported strategy target: ${targetId}`);
  const commonWarnings = ['Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.'];
  if (target.evidenceState === 'insufficient') return {
    status:'insufficient_evidence',target,team:[],leader:null,overallScore:0,teamSynergy:[],approach:target.approach,timing:target.timing,dangers:[target.warning],substitutes:[],confidence:'insufficient',evidenceSummary:{verifiedFacts:0,strategyInferences:0,communityObservations:0},missingDataWarnings:[...commonWarnings,target.warning],candidateStats:{considered:guideData.champions.length,eligible:0,pruned:0}
  };
  const factsByChampion = factIndex(strategyData);
  const exclusions = new Set(excludeVariantIds);
  const targetName = normalize(target.name);
  const targetRules = strategyData.rules.filter(rule=>rule.kind==='target_fit' && (rule.targetId===target.id || rule.targetId==null));
  const synergyRules = strategyData.rules.filter(rule=>rule.kind==='team_synergy');
  const candidates = [];
  let unavailable = 0;
  for (const champion of guideData.champions) {
    if (exclusions.has(champion.id)) continue;
    const facts = factsByChampion.get(champion.id) || [];
    if (champion.releaseState !== 'live' || facts.some(fact=>fact.mechanicId==='unverified_release')) { unavailable += 1; continue; }
    if (target.battleMode==='legendary-assault' && normalize(champion.name).includes(targetName)) continue;
    candidates.push(championScore(champion,facts,targetRules));
  }
  candidates.sort((a,b)=>b.score-a.score || a.champion.name.localeCompare(b.champion.name));
  const observedPairs = observedPairIndex(guideData.teams,guideData.champions);
  const selected = selectTeam(candidates,synergyRules,observedPairs);
  const selectedIds = new Set(selected.team.map(member=>member.champion.id));
  const team = selected.team.map(member=>({
    champion:member.champion,
    score:round(member.score),
    reasons:bestReason(member),
    dangers:member.contributions.filter(row=>row.score<0).sort((a,b)=>a.score-b.score).slice(0,2).map(row=>({text:row.rule.rationale,score:row.score,evidenceCategory:row.rule.evidenceCategory,provenanceRef:row.rule.provenanceRef,confidence:Number(row.rule.confidence)})),
    item:guideData.items.find(item=>item.ownerVariantId===member.champion.id) || null,
  }));
  const substitutes = candidates.filter(candidate=>!selectedIds.has(candidate.champion.id)).slice(0,3).map(candidate=>({champion:candidate.champion,score:round(candidate.score),reason:bestReason(candidate)[0]||null}));
  const evidence = [...team.flatMap(member=>member.reasons),...team.flatMap(member=>member.dangers),...selected.explanations];
  const incomplete = team.filter(member=>member.champion.reviewStatus!=='complete').map(member=>member.champion.name);
  const warnings = [...commonWarnings];
  if (unavailable) warnings.push(`${unavailable} exact variants with unverified current availability were considered and excluded from primary recommendations.`);
  if (incomplete.length) warnings.push(`Some selected profiles have incomplete non-strategy metadata: ${incomplete.join(', ')}.`);
  return {
    status:'ready',target,team,
    leader:selected.leader?{champion:selected.leader.champion,evidence:selected.leader.leaderFacts.find(fact=>fact.mechanicId==='leader_effect'),score:round(selected.leader.leaderPotential)}:null,
    overallScore:round(selected.score),
    teamSynergy:selected.explanations,
    approach:target.approach,
    timing:target.timing,
    dangers:[target.warning,...team.flatMap(member=>member.dangers.map(row=>`${member.champion.name}: ${row.text}`))].slice(0,6),
    substitutes,
    confidence:target.battleMode==='legendary-assault'?'medium-high':'medium',
    evidenceSummary:{
      verifiedFacts:new Set(team.flatMap(member=>member.reasons.map(reason=>reason.factProvenanceRef)).filter(Boolean)).size,
      strategyInferences:evidence.filter(row=>row.evidenceCategory==='strategy_inference').length,
      communityObservations:evidence.filter(row=>row.evidenceCategory==='community_observed').length,
    },
    missingDataWarnings:warnings,
    candidateStats:{considered:guideData.champions.length,eligible:candidates.length,pruned:Math.min(24,candidates.length)},
  };
}
