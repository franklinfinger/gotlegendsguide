import { explainBranReinforcement } from './bran-reinforcement-model.js';
import { capturedDevelopment } from './captured-development.js';
import { canPreferSevenStar, isPreferenceCombatFact, isPreferenceRule, sevenStarContributors, compareModeTeams, rankingPolicy, usesSevenStarPreference } from './mode-ranking.js';
import { evaluateCapturedAllyPairs } from './captured-ally-pairs.js';
import { explainViserysRemoval } from './viserys-removal-model.js';
import { evaluateIceBrittleSynergy } from './ice-brittle-synergy.js';
import { evaluateWrathSynergy } from './wrath-synergy.js';
import { collectionExclusions, collectionWarnings } from './verified-handoff.js';
import { supportsPrebattleTarget, recommendPrebattleTeams, evaluatePrebattlePlan, prebattleResult } from './prebattle-plan-engine.js';
import { evaluateConditionalEffects } from './conditional-effects.js';
import { raidTeamEvaluation } from './raid-engine.js';
import { mechanicCurrentnessIssue, factionCurrentnessIssue } from './mechanics-currentness.js';

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

function championScore(champion, facts, rules, itemStates = {}) {
  const itemState = itemStates[champion.id] || 'unknown';
  const currentnessIssues = [...new Set(facts.map(mechanicCurrentnessIssue).filter(Boolean))];
  facts = facts.filter(fact => !mechanicCurrentnessIssue(fact));
  facts = facts.filter(fact => fact.context !== 'item' || itemState === 'enabled');
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
  const eligibleLeaderFacts = leaderFacts.filter(fact=>fact.reviewStatus==='complete' && Number(fact.confidence)>=0.8);
  const eligibleLeaderMechanics = new Set(eligibleLeaderFacts.map(fact=>fact.mechanicId));
  let leaderPotential = eligibleLeaderFacts.some(fact => fact.mechanicId === 'leader_effect') ? 3 : 0;
  for (const rule of rules) if (eligibleLeaderMechanics.has(rule.mechanicId)) leaderPotential += Number(rule.score) * 0.5;
  const directScore = contributions.reduce((sum, row) => sum + row.score, 0);
  return {
    champion,
    development:capturedDevelopment(champion),
    currentnessIssues,
    itemState,
    facts,
    mechanics: activeMechanics,
    leaderMechanics: eligibleLeaderMechanics,
    contributions,
    leaderFacts,
    leaderPotential,
    // Leadership can affect the team only once. Keep it out of every
    // candidate's individual score and award it to the selected leader below.
    score: directScore,
  };
}

// The numeric evaluator may retain partial legacy facts. Preference credit
// separately proves the actual synergy with complete/current supporting facts;
// an unrelated complete fact cannot launder a partial provider or consumer.
function preferenceSynergyContributors(team, rule, leader) {
  if (!isPreferenceRule(rule)) return [];
  const supplies=(member,id)=>member.facts.some(fact=>fact.mechanicId===id && isPreferenceCombatFact(fact) && (fact.context!=='leader'||member===leader));
  const primary=team.filter(member=>supplies(member,rule.mechanicId));
  const secondary=rule.pairedMechanicId?team.filter(member=>supplies(member,rule.pairedMechanicId)):[];
  const active=!rule.pairedMechanicId?primary.length>0:rule.mechanicId===rule.pairedMechanicId?primary.length>1:primary.some(a=>secondary.some(b=>a!==b));
  return active?[...new Set([...primary,...secondary].map(member=>member.champion.id))]:[];
}

function teamEvaluation(team, synergyRules, observedPairs, preferredLeaderId = null, guideData = null, raidDefense = null, conditionalContext = null) {
  let score = team.reduce((sum, member) => sum + member.score, 0);
  const explanations = [];
  const eligibleLeaders = [...team].filter(member => member.leaderFacts.some(fact => fact.mechanicId === 'leader_effect' && fact.reviewStatus === 'complete' && Number(fact.confidence) >= 0.8));
  const leader = (preferredLeaderId ? team.find(member=>member.champion.id===preferredLeaderId) : null) || eligibleLeaders.sort((a,b)=>b.leaderPotential-a.leaderPotential || a.champion.name.localeCompare(b.champion.name))[0] || null;
  const hasMechanic = (member, mechanicId) => member.mechanics.has(mechanicId) || (member === leader && member.leaderMechanics.has(mechanicId));
  for (const rule of synergyRules) {
    const primary = team.filter(member => hasMechanic(member, rule.mechanicId));
    const secondary = rule.pairedMechanicId ? team.filter(member => hasMechanic(member, rule.pairedMechanicId)) : [];
    let applies = false;
    if (!rule.pairedMechanicId) applies = primary.length > 0;
    else if (rule.mechanicId === rule.pairedMechanicId) applies = primary.length > 1;
    else applies = primary.some(a => secondary.some(b => a.champion.id !== b.champion.id));
    if (!applies) continue;
    score += Number(rule.score);
    explanations.push({
      id: rule.id,
      text: `${primary.map(row=>row.champion.name).join(', ')}${secondary.length ? ' + ' + secondary.map(row=>row.champion.name).join(', ') : ''}: ${rule.rationale}`,
      contributors: [...new Set([...primary,...secondary].map(row=>row.champion.id))],
      preferenceContributorIds:usesSevenStarPreference(conditionalContext?.battleMode)?preferenceSynergyContributors(team,rule,leader):[],
      score: Number(rule.score),
      evidenceCategory: rule.evidenceCategory,
      provenanceRef: rule.provenanceRef,
      confidence: Number(rule.confidence),
    });
  }
  for (let left = 0; left < team.length; left += 1) for (let right = left + 1; right < team.length; right += 1) {
    const key = [team[left].champion.id,team[right].champion.id].sort().join('|');
    const observed = observedPairs.get(key);
    if (!observed) continue;
    explanations.push({id:`observed-${key}`,text:`${team[left].champion.name} and ${team[right].champion.name} appeared together in ${observed.count} observed composition${observed.count===1?'':'s'}; no outcome was shown and this does not change the score.`,score:0,evidenceCategory:'community_observed',provenanceRef:`community_team:${observed.examples.join(',')}`,confidence:0.45});
  }
  if (leader && leader.leaderPotential > 0) score += leader.leaderPotential;
  const raidSynergy=raidDefense&&guideData?raidTeamEvaluation(team,guideData,raidDefense,leader?.champion.id):null;
  if(raidSynergy){
    score+=raidSynergy.score;
    for(const [index,faction] of raidSynergy.factionBonuses.entries())explanations.push({id:`faction-${faction.factionName}`,text:`${faction.contributors.map(row=>row.name).join(', ')} (${faction.factionName}) activate: ${faction.bonusText}`,contributors:faction.contributors.map(row=>row.id),preferenceContributorIds:faction.sourceId?faction.contributors.map(row=>row.id):[],score:(index===0?(raidDefense.mode==='war'?35:55):18)+Math.max(0,faction.contributors.length-faction.requiredMembers)*4,evidenceCategory:'verified_fact',provenanceRef:`source:${faction.sourceId}`,confidence:1});
    for(const pair of raidSynergy.allyPairs)explanations.push({id:pair.id,text:`${pair.owner.name} + ${pair.ally.name}: ${pair.gemName}. ${pair.effect}`,contributors:[pair.owner.id,pair.ally.id],preferenceContributorIds:isPreferenceRule({...pair,provenanceRef:pair.sourceId})?[pair.owner.id,pair.ally.id]:[],score:8,evidenceCategory:'verified_fact',provenanceRef:`source:${pair.sourceId}`,confidence:1});
    for(const match of raidSynergy.matchup)explanations.push({id:`matchup-${match.text}`,text:match.text,score:match.score,evidenceCategory:'strategy_inference',provenanceRef:'verified-opponent-mechanics',confidence:.8});
  }
  if(conditionalContext?.effectContext?.currentnessAssumptionSourceIds?.length) {
    const effects=evaluateConditionalEffects({...conditionalContext.effectContext,variantIds:team.map(row=>row.champion.id),leaderVariantId:leader?.champion.id||null,targetId:conditionalContext.targetId,itemStates:conditionalContext.itemStates,itemRanks:conditionalContext.itemRanks,flatMechanicIds:[...team.flatMap(row=>row.contributions.filter(part=>part.score!==0).map(part=>part.rule.mechanicId)),...synergyRules.filter(rule=>explanations.some(row=>row.id===rule.id&&row.score!==0)).flatMap(rule=>[rule.mechanicId,rule.pairedMechanicId])]});
    score+=effects.scoringContribution;
    for(const contribution of effects.rankingContributions)explanations.push({id:contribution.id,text:contribution.reason,contributors:[contribution.providerEffectId,contribution.consumerEffectId].map(id=>effects.effects.find(effect=>effect.id===id)?.variantId).filter(Boolean),preferenceContributorIds:[],score:contribution.score,evidenceCategory:'strategy_inference',provenanceRef:'source:'+contribution.sourceIds.join(','),confidence:null});
  }
  const wrathSynergy=guideData&&['raid','war'].includes(conditionalContext?.battleMode)?evaluateWrathSynergy({guideData,variantIds:team.map(row=>row.champion.id),leaderVariantId:leader?.champion.id||null,itemStates:conditionalContext.itemStates,itemRanks:conditionalContext.itemRanks,enemyVariantIds:(raidDefense?.members||[]).map(row=>row.id)}):null;
  if(wrathSynergy){
    score+=wrathSynergy.score;
    for(const contribution of wrathSynergy.contributions)explanations.push({...contribution,preferenceContributorIds:contribution.contributors,evidenceCategory:'strategy_inference',provenanceRef:contribution.sourceRefs.join(','),confidence:null});
  }
  const evaluation = {score,explanations,leader,raidSynergy,wrathSynergy};
  return {...evaluation,sevenStarContributorIds:usesSevenStarPreference(conditionalContext?.battleMode)?sevenStarContributors(team,evaluation):[]};
}

function teamKey(team) { return team.map(member => member.champion.id).sort().join('|'); }

function selectTeam(candidates, synergyRules, observedPairs, guideData=null, raidDefense=null, requiredVariantIds=[], conditionalContext=null) {
  // Keep the historical mechanics shortlist and every sourced seven-star
  // candidate that could qualify after team synergy activates. Stars alone
  // cannot qualify a member; the evaluated team supplies the final check.
  const preferenceAvailable = usesSevenStarPreference(conditionalContext?.battleMode) && candidates.some(canPreferSevenStar);
  const pool = candidates.slice(0, 24);
  if (preferenceAvailable) for (const candidate of candidates.filter(canPreferSevenStar)) if (!pool.includes(candidate)) pool.push(candidate);
  if(raidDefense&&guideData){
    const present=new Set(pool.map(row=>row.champion.id));
    for(const activation of guideData.factionActivations||[]){
      const faction=guideData.factions.find(row=>row.id===activation.factionId);
      for(const candidate of candidates.filter(row=>faction?.memberVariantIds.includes(row.champion.id)).slice(0,6))if(!present.has(candidate.champion.id)){pool.push(candidate);present.add(candidate.champion.id);}
    }
  }
  if(conditionalContext?.effectContext?.currentnessAssumptionSourceIds?.length) {
    const available=evaluateConditionalEffects({...conditionalContext.effectContext,variantIds:candidates.map(row=>row.champion.id),targetId:conditionalContext.targetId,itemStates:conditionalContext.itemStates,itemRanks:conditionalContext.itemRanks});
    const providers=new Set(available.rankingContributions.map(link=>available.effects.find(effect=>effect.id===link.providerEffectId)?.variantId));
    for(const candidate of candidates)if(providers.has(candidate.champion.id)&&!pool.includes(candidate))pool.push(candidate);
  }
  const required = candidates.filter(row=>requiredVariantIds.includes(row.champion.id));
  for (const member of required) if (!pool.includes(member)) pool.push(member);
  let beam = [{team:required,...teamEvaluation(required,synergyRules,observedPairs,null,guideData,raidDefense,conditionalContext)}];
  for (let size = required.length; size < 5; size += 1) {
    const next = new Map();
    for (const state of beam) for (const candidate of pool) {
      if (state.team.some(member => member.champion.id === candidate.champion.id)) continue;
      const team = [...state.team,candidate].sort((a,b)=>a.champion.id.localeCompare(b.champion.id));
      const evaluation = teamEvaluation(team,synergyRules,observedPairs,null,guideData,raidDefense,conditionalContext);
      const key = teamKey(team);
      if (!next.has(key) || next.get(key).score < evaluation.score) next.set(key,{team,...evaluation});
    }
    const ranked=[...next.values()].sort((a,b)=>compareModeTeams(a,b,conditionalContext?.battleMode) || teamKey(a.team).localeCompare(teamKey(b.team)));
    if(!raidDefense){beam=ranked.slice(0,180);continue;}
    const retained=new Map(ranked.slice(0,90).map(row=>[teamKey(row.team),row]));
    // Keep mechanics-leading partial states too, so a multi-member synergy is
    // not lost before its threshold activates the preference eligibility.
    if (preferenceAvailable) for (const row of [...next.values()].sort((a,b)=>b.score-a.score || teamKey(a.team).localeCompare(teamKey(b.team))).slice(0,90)) retained.set(teamKey(row.team),row);
    for(const activation of guideData.factionActivations||[]){
      const faction=guideData.factions.find(row=>row.id===activation.factionId);
      const focused=ranked.map(row=>({row,count:row.team.filter(member=>faction?.memberVariantIds.includes(member.champion.id)).length}))
        .filter(row=>row.count>0).sort((a,b)=>b.count-a.count||b.row.score-a.row.score).slice(0,8);
      for(const {row} of focused)retained.set(teamKey(row.team),row);
    }
    beam=[...retained.values()];
  }
  return {...(beam[0] || {team:[],score:0,explanations:[],leader:null}),candidatePoolSize:pool.length};
}

function bestReason(member) {
  const positives = member.contributions.filter(row=>row.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  if (positives.length) return positives.map(row=>({text:row.rule.rationale,score:row.score,evidenceCategory:row.rule.evidenceCategory,provenanceRef:row.rule.provenanceRef,confidence:Number(row.rule.confidence),fact:row.fact.factText,factProvenanceRef:row.fact.provenanceRef,factEvidenceCategory:row.fact.evidenceCategory}));
  const useful = member.facts.find(fact=>fact.context!=='leader' && [...DAMAGE_MECHANICS,...SUPPORT_MECHANICS,...CONTROL_MECHANICS].includes(fact.mechanicId));
  return useful ? [{text:`Provides ${useful.factText}`,score:0,evidenceCategory:useful.evidenceCategory,provenanceRef:useful.provenanceRef,confidence:Number(useful.confidence),fact:useful.factText,factProvenanceRef:useful.provenanceRef,factEvidenceCategory:useful.evidenceCategory}] : [];
}

const ROLE_LABELS = {
  damage:'Damage dealer', status:'Status setup', synergy:'Status payoff', support:'Support', economy:'Treasury enabler', summon:'Reinforcement specialist', survivability:'Protector', control:'Control', buff:'Buff enabler', board:'Board control', tempo:'Tempo control', leadership:'Leader', identity:'Battlefield specialist', faction:'Faction specialist', availability:'Availability limit'
};

function memberRoles(member, mechanicById) {
  const categories = [];
  for (const row of member.contributions.filter(row=>row.score>0).sort((a,b)=>b.score-a.score)) {
    const category = mechanicById.get(row.rule.mechanicId)?.category;
    const label = ROLE_LABELS[category];
    if (label && !categories.includes(label)) categories.push(label);
  }
  return categories.slice(0,2).length ? categories.slice(0,2) : ['Team support'];
}

function positiveMechanicScores(member) {
  return new Map(member.contributions.filter(row=>row.score>0).map(row=>[row.rule.mechanicId,row.score]));
}

function primarySubstitute(member, selectedTeam, candidates, synergyRules, observedPairs, guideData=null, raidDefense=null, conditionalContext=null) {
  const selectedIds = new Set(selectedTeam.map(row=>row.champion.id));
  const desired = positiveMechanicScores(member);
  const preferDevelopment = usesSevenStarPreference(conditionalContext?.battleMode) && [...candidates,...selectedTeam].some(canPreferSevenStar);
  const alternatives = candidates.filter(row=>!selectedIds.has(row.champion.id)).map(candidate=>{
    const supplied = [...positiveMechanicScores(candidate).keys()].filter(mechanic=>desired.has(mechanic));
    const roleMatchScore = supplied.reduce((sum,mechanic)=>sum + desired.get(mechanic),0);
    const replacement = selectedTeam.map(row=>row.champion.id===member.champion.id?candidate:row);
    const evaluation=teamEvaluation(replacement,synergyRules,observedPairs,null,guideData,raidDefense,conditionalContext);
    return {candidate,supplied,roleMatchScore,teamScore:evaluation.score,evaluation,replacement};
  }).sort((a,b)=>(preferDevelopment?compareModeTeams(a.evaluation,b.evaluation,conditionalContext.battleMode):0)||(raidDefense?b.teamScore-a.teamScore:0)||b.roleMatchScore-a.roleMatchScore || b.teamScore-a.teamScore || b.candidate.score-a.candidate.score || a.candidate.champion.name.localeCompare(b.candidate.champion.name));
  const best = alternatives[0];
  if (!best) return null;
  const reason = best.supplied.length
    ? `Preserves ${best.supplied.map(id=>id.replaceAll('_',' ').toUpperCase()).join(' and ')}, the main verified function supplied by ${member.champion.name}.`
    : usesSevenStarPreference(conditionalContext?.battleMode)
      ? `Ranks first under the same seven-star contributor and modeled team-fit policy when ${member.champion.name} is unavailable; no exact primary-mechanic match is verified.`
      : `Provides the closest deterministic team score when ${member.champion.name} is unavailable, but no exact primary-mechanic match is verified.`;
  return {champion:best.candidate.champion,score:round(best.candidate.score),reason,mechanics:best.supplied,projectedTeamScore:round(best.teamScore),rankingPolicy:rankingPolicy({battleMode:conditionalContext?.battleMode,team:best.replacement,sevenStarContributorIds:best.evaluation.sevenStarContributorIds})};
}

/**
 * Rank exact variants and assemble a five-champion team from verified mechanics.
 * Optional exact-variant constraints do not require a stored player roster.
 */
/** Public team entrypoint: reviewed Drogon source is mandatory, never a
 * silent fallback to broad legacy mechanic tags. */
export function recommendTeam(args) {
  args = {...args, excludeVariantIds:[...new Set([...(args.excludeVariantIds || []),...collectionExclusions(args.guideData)])]};
  if(args.targetId!=='legendary-assault:drogon')return recommendMechanicTeam(args);
  const {guideData,strategyData,targetId,requiredVariantIds=[],excludeVariantIds=[],itemStates={},itemRanks={}}=args;
  const target=strategyData.targets.find(row=>row.id===targetId);
  if(!target)throw new Error(`Unsupported strategy target: ${targetId}`);
  const fail=(status,message)=>({status,message,target,team:[],leader:null,overallScore:0,teamSynergy:[],missingDataWarnings:[message]});
  if(requiredVariantIds.some(id=>!guideData.champions.some(row=>row.id===id)))return fail('needs_clarification','A required exact variant is unknown.');
  if(new Set(requiredVariantIds).size>5||requiredVariantIds.some(id=>excludeVariantIds.includes(id)))return fail('no_feasible_team','Required variants conflict with exclusions or exceed five slots.');
  if(Object.values(itemStates).some(state=>!['enabled','disabled','unknown'].includes(state)))return fail('needs_clarification','Item state must be enabled, disabled, or unknown.');
  if(!supportsPrebattleTarget(guideData,targetId))return fail('insufficient_evidence','Reviewed Drogon source wording is missing, changed or incomplete; no legacy fallback is allowed.');
  const result=recommendPrebattleTeams({guideData,strategyData,targetId,excludeVariantIds,requiredVariantIds,itemStates,itemRanks,limit:1})[0];
  return result?{...result,rankingPolicy:rankingPolicy({battleMode:target.battleMode,team:result.team})}:fail('no_feasible_team','No source-covered five-person plan can preserve these exact constraints.');
}

/** Lower-level legacy mechanic evaluator for unmodeled encounters and isolated
 * rule tests. Public Drogon requests must use recommendTeam instead. */
export function recommendMechanicTeam({guideData,strategyData,targetId,excludeVariantIds=[],raidDefense=null,requiredVariantIds=[],itemStates={},itemRanks={},effectContext={}}) {
  excludeVariantIds = [...new Set([...excludeVariantIds,...collectionExclusions(guideData)])];
  if (guideData.verifiedCollection) effectContext = {...effectContext,effects:[]};
  const target = strategyData.targets.find(row=>row.id===targetId);
  if (!target) throw new Error(`Unsupported strategy target: ${targetId}`);
  const required = [...new Set(requiredVariantIds)];
  const fail = (status,message) => ({status,message,target,team:[],leader:null,overallScore:0,teamSynergy:[],missingDataWarnings:[message]});
  if (required.some(id=>!guideData.champions.some(row=>row.id===id))) return fail('needs_clarification','A required exact variant is unknown. Specify its full verified variant name.');
  if (required.length>5 || required.some(id=>excludeVariantIds.includes(id))) return fail('no_feasible_team','Required variants conflict with exclusions or exceed five slots.');
  if (Object.values(itemStates).some(state=>!['enabled','disabled','unknown'].includes(state))) return fail('needs_clarification','Item state must be enabled, disabled, or unknown.');
  if(required.some(id=>guideData.champions.find(row=>row.id===id)?.releaseState!=='live'||strategyData.championFacts.some(fact=>fact.variantId===id&&fact.mechanicId==='unverified_release'))) return fail('no_feasible_team','A required exact variant is not verified as available.');
  const teamContext=['raid','war'].includes(target.battleMode)?raidDefense||{mode:target.battleMode,mechanics:[],leader:null}:null;
  const commonWarnings = ['Strategic fit uses verified mechanics; compare these options with your own in-game collection.',...collectionWarnings(guideData)];
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
    candidates.push(championScore(champion,facts,targetRules,itemStates));
  }
  candidates.sort((a,b)=>b.score-a.score || a.champion.name.localeCompare(b.champion.name));
  const observedPairs = observedPairIndex(guideData.teams,guideData.champions);
  if (candidates.length<5 || required.some(id=>!candidates.some(row=>row.champion.id===id))) return fail('no_feasible_team','No eligible five-person team can preserve all required variants.');
  const conditionalContext={targetId,battleMode:target.battleMode,itemStates,itemRanks,effectContext};
  const selected = selectTeam(candidates,synergyRules,observedPairs,guideData,teamContext,required,conditionalContext);
  const mechanicById = new Map(strategyData.mechanics.map(mechanic=>[mechanic.id,mechanic]));
  const team = selected.team.map(member=>({
    champion:member.champion,
    score:round(member.score),
    itemState:member.itemState,
    roles:memberRoles(member,mechanicById),
    reasons:bestReason(member),
    scoringContributions:member.contributions.sort((a,b)=>b.score-a.score).map(row=>({mechanicId:row.rule.mechanicId,mechanicName:mechanicById.get(row.rule.mechanicId)?.name||row.rule.mechanicId,score:row.score,fact:row.fact.factText,factProvenanceRef:row.fact.provenanceRef,ruleId:row.rule.id,ruleProvenanceRef:row.rule.provenanceRef})),
    dangers:member.contributions.filter(row=>row.score<0).sort((a,b)=>a.score-b.score).slice(0,2).map(row=>({text:row.rule.rationale,score:row.score,evidenceCategory:row.rule.evidenceCategory,provenanceRef:row.rule.provenanceRef,confidence:Number(row.rule.confidence)})),
    item:guideData.items.find(item=>item.ownerVariantId===member.champion.id) || null,
    substitute:required.includes(member.champion.id)?null:primarySubstitute(member,selected.team,candidates,synergyRules,observedPairs,guideData,teamContext,conditionalContext),
  }));
  const substitutes = team.map(member=>member.substitute).filter(Boolean).filter((row,index,rows)=>rows.findIndex(other=>other.champion.id===row.champion.id)===index).slice(0,3);
  const evidence = [...team.flatMap(member=>member.reasons),...team.flatMap(member=>member.dangers),...selected.explanations];
  const incomplete = team.filter(member=>member.champion.reviewStatus!=='complete').map(member=>member.champion.name);
  const warnings = [...commonWarnings, 'Iconic effects are counted only for explicitly enabled items; unknown and disabled items contribute no effects. Enabled item wording remains conditional on its stated in-battle triggers.'];
  warnings.push(...new Set(selected.team.flatMap(member=>member.currentnessIssues.map(issue=>issue.message))));
  warnings.push(...(guideData.factions||[]).filter(faction=>selected.team.some(member=>faction.memberVariantIds.includes(member.champion.id))).map(factionCurrentnessIssue).filter(Boolean).map(issue=>issue.message));
  if(selected.raidSynergy?.factionBonuses.length>1)warnings.push('Multiple faction bonuses are present, but the September diminishing-return rules are not modeled; do not sum full-strength bonus quantities.');
  if(teamContext)warnings.push(selected.raidSynergy?.factionBonuses.length?'This team is designed to compete through faction and champion synergy rather than raw displayed power alone.':'This lineup relies heavily on individual champion strength. If these champions are not highly developed, prefer a faction-core alternative.');
  if (unavailable) warnings.push(`${unavailable} exact variants with unverified current availability were considered and excluded from primary recommendations.`);
  if (incomplete.length) warnings.push(`Some selected profiles have incomplete non-strategy metadata: ${incomplete.join(', ')}.`);
  const partialFacts = selected.team.flatMap(member=>member.facts.filter(fact=>fact.reviewStatus==='partial' && fact.context!=='metadata').map(fact=>({champion:member.champion.name,fact})));
  for (const {champion,fact} of partialFacts) {
    const usedByScore = selected.team.find(member=>member.champion.name===champion)?.contributions.some(row=>row.fact.id===fact.id);
    const usedBySynergy = selected.explanations.some(row=>row.evidenceCategory==='strategy_inference' && row.id.includes(fact.mechanicId));
    if (usedByScore || usedBySynergy) warnings.push(`${champion} has partial source wording for ${fact.factText.split(':')[0]}; only the visible verified mechanic was used.`);
  }
  return explainBranReinforcement(explainViserysRemoval({
    status:'ready',target,team,requiredVariantIds:required,itemStates,
    rankingPolicy:rankingPolicy({battleMode:target.battleMode,team,sevenStarContributorIds:selected.sevenStarContributorIds}),
    conditionalEffects:evaluateConditionalEffects({...effectContext,variantIds:team.map(row=>row.champion.id),targetId,leaderVariantId:selected.leader?.champion.id||null,itemStates,itemRanks,enemyMechanics:raidDefense?.mechanics||effectContext.enemyMechanics||[],flatMechanicIds:[...team.flatMap(row=>row.scoringContributions.filter(part=>part.score!==0).map(part=>part.mechanicId)),...synergyRules.filter(rule=>selected.explanations.some(row=>row.id===rule.id&&row.score!==0)).flatMap(rule=>[rule.mechanicId,rule.pairedMechanicId])]}),recommendationSource:'engine',evidenceTier:'Engine-derived recommendation',
    leader:selected.leader?{champion:selected.leader.champion,evidence:selected.leader.leaderFacts.find(fact=>fact.mechanicId==='leader_effect'),score:round(selected.leader.leaderPotential)}:null,
    capturedAllyPairs:evaluateCapturedAllyPairs({guideData,battleMode:target.battleMode,variantIds:team.map(row=>row.champion.id),excludeVariantIds}),
    iceBrittleSynergy:evaluateIceBrittleSynergy({guideData,battleMode:target.battleMode,variantIds:team.map(row=>row.champion.id),leaderVariantId:selected.leader?.champion.id||null}),wrathSynergy:selected.wrathSynergy,overallScore:round(selected.score),
    teamSynergy:selected.explanations,
    factionBonuses:selected.raidSynergy?.factionBonuses||[],allyPairs:selected.raidSynergy?.allyPairs||[],matchupReasons:selected.raidSynergy?.matchup||[],
    approach:raidDefense?`${selected.raidSynergy?.factionBonuses.length?`${selected.raidSynergy.factionBonuses[0].factionName} members activate a verified faction bonus. `:''}${selected.raidSynergy?.matchup.length?selected.raidSynergy.matchup.map(row=>row.text).join(' '):target.approach}`:target.approach,
    timing:raidDefense&&selected.raidSynergy?.matchup.some(row=>row.text.startsWith('Fast Skill'))?'Use early Skills before the enemy ICE / BRITTLE cycle develops. Follow the verified timing of your selected Skills for the remaining turns.':target.timing,
    dangers:[raidDefense?'This is a source-backed matchup plan, not a verified victory. Champion development and the opponent\'s exact build can change the outcome.':target.warning,...team.flatMap(member=>member.dangers.map(row=>`${member.champion.name}: ${row.text}`))].slice(0,6),
    substitutes,
    confidence:target.battleMode==='legendary-assault'?'medium-high':'medium',
    evidenceSummary:{
      verifiedFacts:new Set(team.flatMap(member=>member.reasons.map(reason=>reason.factProvenanceRef)).filter(Boolean)).size,
      strategyInferences:evidence.filter(row=>row.evidenceCategory==='strategy_inference').length,
      communityObservations:evidence.filter(row=>row.evidenceCategory==='community_observed').length,
    },
    missingDataWarnings:warnings,
    candidateStats:{considered:guideData.champions.length,eligible:candidates.length,pruned:selected.candidatePoolSize},
  },guideData),guideData);
}

function lineupIds(result) { return result.team.map(member=>member.champion.id).sort(); }
function overlap(left,right) { const ids=new Set(lineupIds(left)); return lineupIds(right).filter(id=>ids.has(id)).length; }
function mechanicIds(result) { return new Set(result.team.flatMap(member=>member.scoringContributions.filter(row=>row.score>0).map(row=>row.mechanicId))); }

/** A label is derived only from positive, source-linked mechanics in this lineup. */
export function strategyLabel(result) {
  if (result.recommendationSource==='prebattle_plan') return result.strategyLabel;
  if (result.recommendationSource==='curated' || result.recommendationSource==='curated_partial') return 'Official In-Game Recommendation';
  const mechanics=mechanicIds(result);
  const count=id=>result.team.filter(member=>member.scoringContributions.some(row=>row.mechanicId===id&&row.score>0)).length;
  if(result.factionBonuses?.length)return `${result.factionBonuses[0].factionName} faction core${count('stamina')>=2?' · Fast Skills':''}`;
  if (count('birthright')>=2) return 'BIRTHRIGHT Core';
  if (mechanics.has('apply_fire') && mechanics.has('fire_damage')) return 'FIRE Setup and Payoff';
  if (mechanics.has('apply_ice') && mechanics.has('brittle')) return 'ICE / BRITTLE Control';
  if (count('healing')+count('shield')>=3) return 'Defensive Sustain';
  if (count('stamina')>=2) return 'Fast Skill Rotation';
  if (count('fast_start')>=2) return 'Fast Opening';
  if (count('stun')+count('pacify')+count('deceive')>=2) return 'Control Core';
  const contribution=result.team.flatMap(member=>member.scoringContributions).filter(row=>row.score>0).sort((a,b)=>b.score-a.score || a.mechanicId.localeCompare(b.mechanicId))[0];
  const names={wound_payoff:'WOUND Payoff',scouted_payoff:'SCOUTED Payoff',fire_payoff:'FIRE Payoff',physical_damage:'Physical Pressure',apply_raid:'RAID Pressure',faction_baratheon:'Baratheon Core'};
  return contribution ? names[contribution.mechanicId]||`${contribution.mechanicName} Core` : 'Verified Battle Fit';
}

/** Find distinct, evidence-backed public lineups. The exclusion search opens
 * other mechanic packages without random seeds or fabricated champions. */
export function recommendDistinctTeams({guideData,strategyData,targetId,excludeVariantIds=[],limit=5,raidDefense=null,requiredVariantIds=[],itemStates={},itemRanks={},effectContext={}}) {
  if(targetId==='legendary-assault:drogon')return recommendPrebattleTeams({guideData,strategyData,targetId,excludeVariantIds,requiredVariantIds,itemStates,itemRanks,limit}).map(result=>({...result,rankingPolicy:rankingPolicy({battleMode:'legendary-assault',team:result.team})}));
  const first=recommendTeam({guideData,strategyData,targetId,excludeVariantIds,raidDefense,requiredVariantIds,itemStates,itemRanks,effectContext});
  if (first.status!=='ready' || first.team.length!==5 || first.overallScore<=0 || first.evidenceSummary.verifiedFacts===0) return [];
  const chosen=[first], seen=new Set([lineupIds(first).join('|')]), tried=new Set();
  const queue=[first];
  let attempts=0;
  const teamMode=['raid','war'].includes(strategyData.targets.find(row=>row.id===targetId)?.battleMode);
  const preferenceAvailable=teamMode && guideData.champions.some(row=>capturedDevelopment(row)?.stars===7);
  const maxAttempts=teamMode?5:12;
  while (queue.length && chosen.length<limit && attempts<maxAttempts) {
    const parent=queue.shift();
    const ids=lineupIds(parent);
    const candidates=[];
    for (let a=0;a<ids.length-2;a++) for(let b=a+1;b<ids.length-1;b++) for(let c=b+1;c<ids.length;c++) {
      if(attempts>=maxAttempts) break;
      const bans=[...new Set([...excludeVariantIds,ids[a],ids[b],ids[c]])].sort();
      if(bans.some(id=>requiredVariantIds.includes(id)))continue;
      const banKey=bans.join('|');if(tried.has(banKey))continue;tried.add(banKey);attempts++;
      const result=recommendTeam({guideData,strategyData,targetId,excludeVariantIds:bans,raidDefense,requiredVariantIds,itemStates,itemRanks,effectContext});
      if(result.status!=='ready' || result.team.length!==5 || result.overallScore<=0 || result.evidenceSummary.verifiedFacts===0)continue;
      const key=lineupIds(result).join('|');if(seen.has(key))continue;seen.add(key);
      // A distinct option must change at least three exact variants. A lower
      // bound against the primary score suppresses unsupported filler teams.
      if(result.overallScore<first.overallScore*0.55 || chosen.some(row=>overlap(row,result)>2))continue;
      candidates.push(result);
    }
    candidates.sort((a,b)=>{
      const novel=row=>[...mechanicIds(row)].filter(id=>!chosen.some(other=>mechanicIds(other).has(id))).length;
      const newFaction=row=>row.factionBonuses?.some(faction=>!chosen.some(other=>other.factionBonuses?.some(existing=>existing.factionName===faction.factionName)))?1:0;
      return (preferenceAvailable?compareModeTeams({score:a.overallScore,sevenStarContributorIds:a.rankingPolicy?.sevenStarContributorIds},{score:b.overallScore,sevenStarContributorIds:b.rankingPolicy?.sevenStarContributorIds},'raid'):0) || (raidDefense?newFaction(b)-newFaction(a):0) || novel(b)-novel(a) || b.overallScore-a.overallScore || lineupIds(a).join('|').localeCompare(lineupIds(b).join('|'));
    });
    for(const candidate of candidates) {
      if(chosen.length>=limit)break;
      if(chosen.some(row=>overlap(row,candidate)>2))continue;
      chosen.push(candidate);queue.push(candidate);
    }
  }
  if(preferenceAvailable)chosen.sort((a,b)=>compareModeTeams({score:a.overallScore,sevenStarContributorIds:a.rankingPolicy?.sevenStarContributorIds},{score:b.overallScore,sevenStarContributorIds:b.rankingPolicy?.sevenStarContributorIds},'raid') || lineupIds(a).join('|').localeCompare(lineupIds(b).join('|')));
  return chosen.map(row=>({...row,strategyLabel:strategyLabel(row)}));
}

/**
 * Explain a source-backed exact lineup with the same verified rules used by the
 * team search. The caller supplies the variants; this function never fills a
 * missing curated slot or changes the supplied leader.
 */
export function evaluateExactTeam({guideData,strategyData,targetId,variantIds,leaderVariantId,itemStates={},requiredVariantIds=[],excludeVariantIds=[],itemRanks={},effectContext={}}) {
  if (guideData.verifiedCollection && variantIds.some(id=>collectionExclusions(guideData).includes(id))) throw new Error('The exact lineup includes a variant outside the imported screenshot collection.');
  if (guideData.verifiedCollection) effectContext = {...effectContext,effects:[]};
  const target = strategyData.targets.find(row=>row.id===targetId);
  if (!target) throw new Error(`Unsupported strategy target: ${targetId}`);
  if (!Array.isArray(variantIds) || variantIds.length!==5 || new Set(variantIds).size!==5) throw new Error('A curated team must contain five distinct exact variants.');
  if(variantIds.some(id=>excludeVariantIds.includes(id)))throw new Error('The exact lineup contains an explicitly excluded variant.');
  if(requiredVariantIds.some(id=>!variantIds.includes(id)))throw new Error('The exact lineup does not preserve every required variant.');
  const champions = variantIds.map(id=>guideData.champions.find(row=>row.id===id));
  if (champions.some(row=>!row)) throw new Error('A curated team references an unavailable exact variant.');
  if (!variantIds.includes(leaderVariantId)) throw new Error('The curated leader must be a member of the exact team.');
  if(targetId==='legendary-assault:drogon') {
    const plan=evaluatePrebattlePlan({guideData,strategyData,targetId,variantIds,leaderVariantId,itemStates,itemRanks});
    if(plan.status!=='ready')return {...plan,target,team:[],overallScore:0,missingDataWarnings:[plan.message]};
    const result=prebattleResult({plan,guideData,strategyData,itemStates});
    return {...result,rankingPolicy:rankingPolicy({battleMode:target.battleMode,team:result.team,suppliedLineupKeptExact:true})};
  }
  const factsByChampion = factIndex(strategyData);
  const targetRules = strategyData.rules.filter(rule=>rule.kind==='target_fit' && (rule.targetId===target.id || rule.targetId==null));
  const synergyRules = strategyData.rules.filter(rule=>rule.kind==='team_synergy');
  const observedPairs = observedPairIndex(guideData.teams,guideData.champions);
  const exactMembers = champions.map(champion=>championScore(champion,factsByChampion.get(champion.id)||[],targetRules,itemStates));
  const evaluation = teamEvaluation(exactMembers,synergyRules,observedPairs,leaderVariantId,guideData,null,{targetId,battleMode:target.battleMode,itemStates,itemRanks,effectContext});
  const allCandidates = guideData.champions.filter(champion=>champion.releaseState==='live' && !variantIds.includes(champion.id) && !excludeVariantIds.includes(champion.id) && !collectionExclusions(guideData).includes(champion.id))
    .map(champion=>championScore(champion,factsByChampion.get(champion.id)||[],targetRules,itemStates))
    .sort((a,b)=>b.score-a.score || a.champion.name.localeCompare(b.champion.name));
  const mechanicById = new Map(strategyData.mechanics.map(mechanic=>[mechanic.id,mechanic]));
  const team = exactMembers.map(member=>({
    champion:member.champion,
    score:round(member.score),
    itemState:member.itemState,
    roles:memberRoles(member,mechanicById),
    reasons:bestReason(member),
    scoringContributions:member.contributions.sort((a,b)=>b.score-a.score).map(row=>({mechanicId:row.rule.mechanicId,mechanicName:mechanicById.get(row.rule.mechanicId)?.name||row.rule.mechanicId,score:row.score,fact:row.fact.factText,factProvenanceRef:row.fact.provenanceRef,ruleId:row.rule.id,ruleProvenanceRef:row.rule.provenanceRef})),
    dangers:member.contributions.filter(row=>row.score<0).sort((a,b)=>a.score-b.score).slice(0,2).map(row=>({text:row.rule.rationale,score:row.score,evidenceCategory:row.rule.evidenceCategory,provenanceRef:row.rule.provenanceRef,confidence:Number(row.rule.confidence)})),
    item:guideData.items.find(item=>item.ownerVariantId===member.champion.id)||null,
    substitute:requiredVariantIds.includes(member.champion.id)?null:primarySubstitute(member,exactMembers,allCandidates,synergyRules,observedPairs,guideData,null,{targetId,battleMode:target.battleMode,itemStates,itemRanks,effectContext}),
  }));
  const substitutes = team.map(member=>member.substitute).filter(Boolean).filter((row,index,rows)=>rows.findIndex(other=>other.champion.id===row.champion.id)===index).slice(0,5);
  return explainBranReinforcement(explainViserysRemoval({
    status:'ready',target,team,
    rankingPolicy:rankingPolicy({battleMode:target.battleMode,team,sevenStarContributorIds:evaluation.sevenStarContributorIds,suppliedLineupKeptExact:true}),
    conditionalEffects:evaluateConditionalEffects({...effectContext,variantIds,targetId,leaderVariantId,itemStates,itemRanks,flatMechanicIds:[...team.flatMap(row=>row.scoringContributions.filter(part=>part.score!==0).map(part=>part.mechanicId)),...synergyRules.filter(rule=>evaluation.explanations.some(row=>row.id===rule.id&&row.score!==0)).flatMap(rule=>[rule.mechanicId,rule.pairedMechanicId])]}),recommendationSource:'curated',evidenceTier:'Best known / verified team',
    leader:{champion:champions[variantIds.indexOf(leaderVariantId)],evidence:null,score:round(evaluation.leader?.leaderPotential||0)},
    capturedAllyPairs:evaluateCapturedAllyPairs({guideData,battleMode:target.battleMode,variantIds,excludeVariantIds}),
    iceBrittleSynergy:evaluateIceBrittleSynergy({guideData,battleMode:target.battleMode,variantIds,leaderVariantId}),wrathSynergy:evaluation.wrathSynergy,overallScore:round(evaluation.score),teamSynergy:evaluation.explanations,
    approach:target.approach,timing:target.timing,
    dangers:[target.warning,...team.flatMap(member=>member.dangers.map(row=>`${member.champion.name}: ${row.text}`))].slice(0,6),
    substitutes,confidence:'high',
    evidenceSummary:{
      verifiedFacts:new Set(team.flatMap(member=>member.reasons.map(reason=>reason.factProvenanceRef)).filter(Boolean)).size,
      strategyInferences:[...team.flatMap(member=>member.reasons),...evaluation.explanations].filter(row=>row.evidenceCategory==='strategy_inference').length,
      communityObservations:evaluation.explanations.filter(row=>row.evidenceCategory==='community_observed').length,
    },
    missingDataWarnings:['Strategic explanation uses verified mechanics; compare this lineup with your collection in the game.',...collectionWarnings(guideData),...new Set(exactMembers.flatMap(member=>member.currentnessIssues.map(issue=>issue.message)))],
    candidateStats:{considered:guideData.champions.length,eligible:allCandidates.length+5,pruned:5},
  },guideData),guideData);
}
