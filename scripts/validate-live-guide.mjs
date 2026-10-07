import fs from 'node:fs';
import path from 'node:path';
import { recommendTeam } from '../strategy-engine.js';

const root = path.resolve(import.meta.dirname, '..');
const env = {};
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Missing local publishable Supabase configuration.');
const headers = {apikey:key,Accept:'application/json'};
const [guideResponse,strategyResponse] = await Promise.all([
  fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/got_guide_data`, {headers}),
  fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/got_strategy_data`, {headers}),
]);
if (!guideResponse.ok) throw new Error(`Live guide RPC failed: ${guideResponse.status}`);
if (!strategyResponse.ok) throw new Error(`Live strategy RPC failed: ${strategyResponse.status}`);
const [data,strategy] = await Promise.all([guideResponse.json(),strategyResponse.json()]);
const checks = {
  championVariants: data.champions?.length,
  portraits: data.champions?.filter(row=>row.portrait).length,
  items: data.items?.length,
  connectedItems: data.items?.filter(row=>row.ownerVariantId && row.abilities.length).length,
  legendaryAssault: data.legendaryAssault?.length,
  warRules: data.warRules?.length,
  currentFactionBonuses: data.factions?.flatMap(row=>row.rules).filter(row=>row.kind==='current_bonus').length,
  factionPlayDescriptions: data.factions?.flatMap(row=>row.rules).filter(row=>row.kind==='how_to_play').length,
  observedTeams: data.teams?.length,
  observedTeamsWithClaimedOutcome: data.teams?.filter(row=>row.outcome!=='not_shown').length,
  raidRules: data.raidRules?.length,
  strategyTeams: data.strategyTeams?.length,
  raidAttackExamples: data.strategyTeams?.filter(row=>/attack/i.test(row.role||'')).length,
  raidDefenseExamples: data.strategyTeams?.filter(row=>/defen/i.test(row.role||'')).length,
};
const expected = {championVariants:108,portraits:96,items:31,connectedItems:31,legendaryAssault:4,warRules:9,currentFactionBonuses:17,factionPlayDescriptions:9,observedTeams:40,observedTeamsWithClaimedOutcome:0,raidRules:8,strategyTeams:15};
for (const [name,value] of Object.entries(expected)) if (checks[name] !== value) throw new Error(`${name}: expected ${value}, received ${checks[name]}`);
if (!checks.raidAttackExamples || !checks.raidDefenseExamples) throw new Error('Raid attack and defense examples must remain separately available.');
if (data.announcements.find(row=>row.id===1)?.status!=='live') throw new Error('The current faction update is still labeled as future.');
if (data.champions.filter(row=>row.factions.length===2).length < 13) throw new Error('Current dual-faction memberships are incomplete.');
const icy = data.legendaryAssault.find(row=>row.name==='Icy Viserion');
if (!icy || icy.abilities.length !== 0) throw new Error('Icy Viserion must be present without invented ability cards.');
if (strategy.mechanics?.length !== 57 || strategy.targets?.length !== 15 || strategy.rules?.length !== 92 || strategy.championFacts?.length < 500) throw new Error('Live strategy RPC counts are incomplete.');
const curatedDrogon=strategy.curatedRecommendations?.find(row=>row.id==='curated-drogon-best-2026-10');
if (!curatedDrogon || !curatedDrogon.active || Number(curatedDrogon.confidence)<.9 || curatedDrogon.leaderVariantId!=='sqlite-champion-19') throw new Error('Curated Drogon recommendation metadata is incomplete.');
if (curatedDrogon.members.map(row=>row.variantId).join(',')!=='sqlite-champion-19,sqlite-champion-5,sqlite-champion-6,sqlite-champion-58,sqlite-champion-9') throw new Error('Curated Drogon exact variants do not match the verified screenshot.');
for (const target of strategy.targets) {
  const result = recommendTeam({guideData:data,strategyData:strategy,targetId:target.id});
  if (target.evidenceState === 'insufficient') {
    if (result.team.length || result.status !== 'insufficient_evidence') throw new Error(`${target.id} invented a team.`);
  } else if (result.team.length !== 5 || result.team.some(member=>member.reasons.some(reason=>!reason.provenanceRef || !reason.factProvenanceRef))) {
    throw new Error(`${target.id} did not return five traceable exact variants.`);
  }
  if (result.status === 'ready' && result.team.some(member=>!member.roles.length || !member.scoringContributions.length || !member.substitute?.champion?.id)) throw new Error(`${target.id} lacks roles, scoring contributions, or member substitutes.`);
  if (result.teamSynergy.some(row=>row.evidenceCategory==='community_observed' && Number(row.score)!==0)) throw new Error(`${target.id} lets community observations change the score.`);
  if (result.leader && (result.leader.evidence.reviewStatus!=='complete' || Number(result.leader.evidence.confidence)<0.8)) throw new Error(`${target.id} selected an insufficiently reviewed leader.`);
}
checks.strategyMechanics = strategy.mechanics.length;
checks.strategyTargets = strategy.targets.length;
checks.strategyRules = strategy.rules.length;
checks.strategyChampionFacts = strategy.championFacts.length;
console.log(JSON.stringify(checks, null, 2));
