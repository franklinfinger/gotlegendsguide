import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { recommendTeam } from '../strategy-engine.js';
import { answerStrategyQuestion, buildTeamOptions } from '../conversation-engine.js';
import { answerGuideQuestion } from '../knowledge-engine.js';
import { analyzeRaidDefense } from '../raid-engine.js';

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
const [guideResponse,strategyResponse,raidResponse] = await Promise.all([
  fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/got_guide_data`, {headers}),
  fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/got_strategy_data`, {headers}),
  fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/got_raid_synergy_data`, {headers}),
]);
if (!guideResponse.ok) throw new Error(`Live guide RPC failed: ${guideResponse.status}`);
if (!strategyResponse.ok) throw new Error(`Live strategy RPC failed: ${strategyResponse.status}`);
if (!raidResponse.ok) throw new Error(`Live Raid synergy RPC failed: ${raidResponse.status}`);
const [baseData,strategy,raidSynergy] = await Promise.all([guideResponse.json(),strategyResponse.json(),raidResponse.json()]);
const data={...baseData,...raidSynergy};
assert.equal(data.factionActivations.length,4);
assert.equal(data.allyGems.length,20);
const defense=analyzeRaidDefense({guideData:data,strategyData:strategy,enemyVariantIds:['sqlite-champion-24','sqlite-champion-15','sqlite-champion-2','sqlite-champion-17','sqlite-champion-60'],leaderVariantId:'sqlite-champion-2'});
assert.equal(defense.factionBonuses[0]?.factionName,'Stark');
assert.equal(defense.allyPairs[0]?.gemName,'Sisters Reunited Gem');
assert.equal(defense.leader?.name,'Ned Stark');
assert.match(defense.leaderFact?.factText||'',/At the start of combat.*ICE/);
assert.ok(defense.highlights.some(row=>row.title==='POISON pressure'));
const counters=buildTeamOptions({guideData:data,strategyData:strategy,targetId:'raid:attack',raidDefense:defense,limit:3});
assert.ok(counters.length>=2&&counters.every(row=>row.factionBonuses?.length));
const ask=question=>answerGuideQuestion({question,guideData:data,strategyData:strategy});
const poison=ask('Who can use poison?');
assert.equal(poison.intent,'mechanic_lookup');
assert.deepEqual(poison.entries.map(row=>row.champion.name),['Nymeria Sand','Oberyn Martell','Olenna Tyrell']);
assert.ok(poison.entries.every(row=>row.facts.every(fact=>fact.provenance&&/POISON/i.test(fact.wording))));
const fire=ask('Who applies FIRE?');
assert.equal(fire.intent,'mechanic_lookup');
assert.ok(fire.entries.some(row=>row.champion.name==='Daenerys Targaryen - Mother Of Dragons'));
const stun=ask('Who can STUN?');
assert.equal(stun.intent,'mechanic_lookup');
assert.ok(stun.entries.some(row=>row.champion.name==='Meryn Trant'));
assert.ok(!stun.entries.some(row=>['Adolescent Rhaegal','Lyanna Mormont'].includes(row.champion.name)));
assert.deepEqual(ask('What faction is Alicent Hightower?').entries[0].champion.factions,['Greens','Targaryen']);
assert.ok(ask('Who is in the Stark faction?').entries.some(row=>row.champion.name==='Jon Snow — King in the North'));
const catspaw=ask('What does CatsPaw Dagger do?');
assert.equal(catspaw.entries[0].champion.name,'Alicent Hightower');
assert.equal(catspaw.entries[0].facts[0].title,'How Sweetly The Fox Speaks III');
assert.ok(ask('What does Meryn Trant do?').entries[0].facts.some(row=>row.title==='No One Threatens His Grace'));
assert.equal(ask('Strongest team for Drogon?').status,'battle');
assert.equal(answerStrategyQuestion({question:'Strongest team for Drogon?',guideData:data,strategyData:strategy}).result.target.name,'Drogon');
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
  currentFactions: data.factions?.filter(row=>row.rules.some(rule=>rule.kind==='current_bonus')||row.memberVariantIds.length).length,
  currentMemberships: data.factions?.reduce((sum,row)=>sum+row.memberVariantIds.length,0),
  dualFactionVariants: data.champions?.filter(row=>row.factions.length===2).length,
  upgradedPortraits: data.champions?.filter(row=>row.portrait?.startsWith('assets/champion-portraits/upgraded-')).length,
};
const expected = {championVariants:108,portraits:96,items:31,connectedItems:31,legendaryAssault:4,warRules:9,currentFactionBonuses:17,factionPlayDescriptions:9,observedTeams:40,observedTeamsWithClaimedOutcome:0,raidRules:8,strategyTeams:15,currentFactions:17,currentMemberships:129,dualFactionVariants:35,upgradedPortraits:70};
for (const [name,value] of Object.entries(expected)) if (checks[name] !== value) throw new Error(`${name}: expected ${value}, received ${checks[name]}`);
if (!checks.raidAttackExamples || !checks.raidDefenseExamples) throw new Error('Raid attack and defense examples must remain separately available.');
if (data.announcements.find(row=>row.id===1)?.status!=='live') throw new Error('The current faction update is still labeled as future.');
if (data.champions.filter(row=>row.factions.length===2).length < 35) throw new Error('Current dual-faction memberships are incomplete.');
const byId=new Map(data.champions.map(row=>[row.id,row]));
const requiredMemberships = new Map([
  ['audit-faction-bolton',['sqlite-champion-38','sqlite-champion-64','sqlite-champion-69','sqlite-champion-85']],
  ['audit-faction-greyjoy',['sqlite-champion-36','legacy-champion-theon','legacy-champion-yara']],
  ['sqlite-faction-4672656520466f6c6b',['sqlite-champion-63']],
]);
for (const [factionId,members] of requiredMemberships) {
  const faction=data.factions.find(row=>row.id===factionId);
  if (!faction || members.some(id=>!faction.memberVariantIds.includes(id))) throw new Error(`Profile-backed faction members missing: ${factionId}`);
}
if (data.factions.some(row=>['Martell','Tyrell','Wildling'].includes(row.name))) throw new Error('Superseded icon-description factions remain live.');
for (const faction of data.factions) for (const id of faction.memberVariantIds) {
  const champion=byId.get(id);
  if (!champion || !champion.factions.includes(faction.name)) throw new Error(`Faction read model mismatch: ${faction.name} / ${id}`);
}
for (const champion of data.champions) {
  if (champion.factions.length>2) throw new Error(`Champion exceeds the two-faction limit: ${champion.id}`);
  for (const name of champion.factions) if (!data.factions.some(faction=>faction.name===name && faction.memberVariantIds.includes(champion.id))) throw new Error(`Reverse faction read model mismatch: ${champion.id} / ${name}`);
}
for (const champion of data.champions) {
  if (!champion.portrait) continue;
  if (!/^assets\/champion-portraits\/[a-z0-9-]+\.(png|jpg)$/.test(champion.portrait) || !fs.existsSync(path.join(root,champion.portrait))) {
    throw new Error(`Missing or invalid portrait asset for ${champion.id}: ${champion.portrait}`);
  }
}
if (byId.get('sqlite-champion-49')?.portrait !== 'assets/champion-portraits/derived-sqlite-champion-49.png') throw new Error('Meryn Trant is not using the repaired, source-backed portrait.');
if (byId.get('sqlite-champion-84')?.portrait !== 'assets/champion-portraits/upgraded-sqlite-champion-84.png') throw new Error('Talisa Stark is not using her source-backed portrait.');
const icy = data.legendaryAssault.find(row=>row.name==='Icy Viserion');
if (!icy || icy.abilities.length !== 0 || icy.tips.length !== 3) throw new Error('Icy Viserion must have three verified tips and no invented ability cards.');
if (strategy.mechanics?.length !== 57 || strategy.targets?.length !== 15 || strategy.rules?.length !== 92 || strategy.championFacts?.length < 500) throw new Error('Live strategy RPC counts are incomplete.');
const curatedDrogon=strategy.curatedRecommendations?.find(row=>row.id==='curated-drogon-best-2026-10');
if (!curatedDrogon || !curatedDrogon.active || Number(curatedDrogon.confidence)<.9 || curatedDrogon.leaderVariantId!=='sqlite-champion-19') throw new Error('Curated Drogon recommendation metadata is incomplete.');
if (curatedDrogon.members.map(row=>row.variantId).join(',')!=='sqlite-champion-19,sqlite-champion-5,sqlite-champion-6,sqlite-champion-58,sqlite-champion-9') throw new Error('Curated Drogon exact variants do not match the verified screenshot.');
const expectedCurated = new Map([
  ['legendary-assault:drogon',{leader:'sqlite-champion-19',unresolved:0}],
  ['legendary-assault:viserion',{leader:'sqlite-champion-48',unresolved:1}],
  ['legendary-assault:rhaegal',{leader:null,unresolved:3}],
  ['legendary-assault:icy-viserion',{leader:'sqlite-champion-21',unresolved:0}],
]);
for (const [targetId,expectedRow] of expectedCurated) {
  const row=strategy.curatedRecommendations.find(candidate=>candidate.targetId===targetId && candidate.active);
  if (!row || row.members.length!==5 || row.leaderVariantId!==expectedRow.leader || row.members.filter(member=>member.isLeader).length!==1 || row.members.filter(member=>member.identityStatus==='unresolved').length!==expectedRow.unresolved) throw new Error(`First-party lineup incomplete: ${targetId}`);
  for (const member of row.members) if (member.variantId && !data.champions.some(champion=>champion.id===member.variantId)) throw new Error(`Unknown curated variant: ${member.variantId}`);
}
if (strategy.curatedRecommendations.length!==4) throw new Error('Expected four distinct Legendary Assault first-party lineups.');
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
  for (const option of buildTeamOptions({guideData:data,strategyData:strategy,targetId:target.id})) {
    if (!option.team) continue;
    for (const member of option.team) {
      const canonical=byId.get(member.champion.id);
      if (!canonical || member.champion.portrait !== canonical.portrait) throw new Error(`Recommendation portrait does not match exact variant ${member.champion.id}`);
    }
  }
}
checks.strategyMechanics = strategy.mechanics.length;
checks.strategyTargets = strategy.targets.length;
checks.strategyRules = strategy.rules.length;
checks.strategyChampionFacts = strategy.championFacts.length;
checks.curatedLegendaryAssault = strategy.curatedRecommendations.length;
checks.unresolvedCuratedPositions = strategy.curatedRecommendations.flatMap(row=>row.members).filter(member=>member.identityStatus==='unresolved').length;
console.log(JSON.stringify(checks, null, 2));
