import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseStrategyQuestion, recommendTeam } from '../strategy-engine.js';

const root = path.resolve(import.meta.dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/strategy/strategy-catalog.json'), 'utf8'));
const strategyData = {
  version: catalog.version,
  mechanics: catalog.mechanics,
  targets: catalog.targets,
  rules: [
    ...catalog.rules.map(rule => ({...rule, kind:'target_fit', battleMode:rule.targetId?.split(':')[0] || 'all', subjectVariantId:null, pairedMechanicId:null, evidenceCategory:'strategy_inference', reviewStatus:'reviewed'})),
    ...catalog.synergies.map(rule => ({...rule, kind:'team_synergy', battleMode:'all', targetId:null, subjectVariantId:null, evidenceCategory:'strategy_inference', provenanceRef:`strategy:${rule.id}`, confidence:.8, reviewStatus:'reviewed'})),
  ],
  championFacts: [],
};

const mechanicIds = [...new Set([...catalog.rules.map(row=>row.mechanicId), ...catalog.synergies.flatMap(row=>[row.mechanicId,row.pairedMechanicId]).filter(Boolean)])];
const champions = mechanicIds.map((mechanicId,index)=>({id:`variant-${index}`,name:`Test Champion ${index} — ${mechanicId}`,legacyId:index,rarity:'Legendary',gemColor:['Red','Blue','Green','Purple','Yellow'][index%5],reviewStatus:'complete',releaseState:'live',portrait:null,factions:[`Faction ${index%4}`],roles:[]}));
strategyData.championFacts = champions.flatMap((champion,index)=>[
  {id:`fact-${index}`,variantId:champion.id,mechanicId:mechanicIds[index],effectRole:'provides',context:'skill',factText:`Verified ${mechanicIds[index]} effect.`,evidenceCategory:'verified_fact',provenanceRef:`ability:${index}`,sourceId:index,confidence:1,reviewStatus:'reviewed'},
  ...(index<5?[{id:`damage-${index}`,variantId:champion.id,mechanicId:'physical_damage',effectRole:'provides',context:'skill',factText:'Verified physical damage.',evidenceCategory:'verified_fact',provenanceRef:`ability:damage-${index}`,sourceId:1000+index,confidence:1,reviewStatus:'reviewed'}]:[]),
  ...(index===0?[{id:'leader-0',variantId:champion.id,mechanicId:'leader_effect',effectRole:'provides',context:'leader',factText:'Verified Leader effect.',evidenceCategory:'verified_fact',provenanceRef:'trait:leader-0',sourceId:2000,confidence:1,reviewStatus:'reviewed'}]:[]),
]);
const guideData = {champions,items:[],teams:[]};

test('local parser only returns explicit supported targets', () => {
  assert.equal(parseStrategyQuestion('What is the strongest team to fight Drogon?', strategyData.targets)?.id, 'legendary-assault:drogon');
  assert.equal(parseStrategyQuestion('What team should I use for Raid defense?', strategyData.targets)?.id, 'raid:defense');
  assert.equal(parseStrategyQuestion('Build a Raid attack team.', strategyData.targets)?.id, 'raid:attack');
  assert.equal(parseStrategyQuestion('Who works best under Ravenous Pack?', strategyData.targets)?.id, 'war:ravenous-pack');
  assert.equal(parseStrategyQuestion("Build for Maester's Sigil.", strategyData.targets)?.id, 'war:maesters-sigil');
  assert.equal(parseStrategyQuestion("What works at Scout's Post?", strategyData.targets)?.id, 'war:scouts-post');
  assert.equal(parseStrategyQuestion('Build a Raid team', strategyData.targets), null);
});

test('Icy Viserion refuses to invent a recommendation', () => {
  const result = recommendTeam({guideData,strategyData,targetId:'legendary-assault:icy-viserion'});
  assert.equal(result.status, 'insufficient_evidence');
  assert.equal(result.team.length, 0);
  assert.match(result.missingDataWarnings.join(' '), /unavailable|insufficient/i);
});

test('every verified target returns five exact variants with traceable reasons', () => {
  for (const target of strategyData.targets.filter(row=>row.evidenceState==='verified')) {
    const result = recommendTeam({guideData,strategyData,targetId:target.id});
    assert.equal(result.status, 'ready', target.id);
    assert.equal(result.team.length, 5, target.id);
    assert.equal(new Set(result.team.map(row=>row.champion.id)).size, 5, target.id);
    for (const member of result.team) for (const reason of member.reasons) {
      assert.ok(reason.provenanceRef, `${target.id} missing rule provenance`);
      assert.ok(reason.factProvenanceRef, `${target.id} missing fact provenance`);
    }
  }
});

test('encounter mechanics receive their required rewards and penalties', () => {
  const check = (targetId, mechanicId, sign) => {
    const rule = strategyData.rules.find(row=>row.targetId===targetId && row.mechanicId===mechanicId);
    assert.ok(rule, `${targetId}/${mechanicId}`);
    assert.equal(Math.sign(Number(rule.score)), sign, `${targetId}/${mechanicId}`);
  };
  check('legendary-assault:drogon','birthright',1); check('legendary-assault:drogon','fire_damage',-1);
  for (const mechanic of ['apply_bleed','apply_fire','healing']) check('legendary-assault:rhaegal',mechanic,1);
  check('legendary-assault:rhaegal','reinforce',-1);
  assert.match(strategyData.rules.find(row=>row.id==='rhaegal-healing').rationale, /TAUNT/i);
  assert.ok(strategyData.rules.filter(row=>row.targetId==='legendary-assault:rhaegal').some(row=>/GRUDGE/i.test(row.rationale)));
  for (const mechanic of ['apply_raid','apply_ice','brittle_payoff']) check('legendary-assault:viserion',mechanic,1);
  for (const mechanic of ['fire_damage','apply_poison','reinforce']) check('legendary-assault:viserion',mechanic,-1);
  const viserion = strategyData.targets.find(row=>row.id==='legendary-assault:viserion');
  assert.match(`${viserion.approach} ${viserion.timing}`, /sleep/i);
  assert.match(`${viserion.approach} ${viserion.timing}`, /PACIFY/i);
  assert.match(`${viserion.approach} ${viserion.timing}`, /Patience/i);
});

test('Raid attack, Raid defense, and every War rule have distinct scoring rules', () => {
  const attack = strategyData.rules.filter(row=>row.targetId==='raid:attack').map(row=>`${row.mechanicId}:${row.score}`).sort();
  const defense = strategyData.rules.filter(row=>row.targetId==='raid:defense').map(row=>`${row.mechanicId}:${row.score}`).sort();
  assert.notDeepEqual(attack, defense);
  for (const target of strategyData.targets.filter(row=>row.battleMode==='war')) assert.ok(strategyData.rules.some(rule=>rule.targetId===target.id), target.id);
});

test('an ambiguous observed name is never silently assigned to an exact variant', () => {
  const duplicate = {...champions[0], id:'variant-duplicate', name:champions[0].name};
  const observedGuide = {...guideData, champions:[...champions,duplicate], teams:[{id:'observed-1',members:[{name:champions[0].name},{name:champions[1].name}]}]};
  const result = recommendTeam({guideData:observedGuide,strategyData,targetId:'raid:attack'});
  assert.equal(result.evidenceSummary.communityObservations, 0);
});

function compositionFixture() {
  const target = {id:'raid:composition-test',battleMode:'raid',name:'Composition test',evidenceState:'verified',approach:'Test complementary mechanics.',timing:'Use setup before payoff.',warning:'Test only.'};
  const rows = [
    ['a','ICE setup','apply_ice',10], ['b','Raw damage one','physical_damage',9], ['c','Raw damage two','physical_damage',8],
    ['d','Raw damage three','physical_damage',7], ['e','Redundant ICE','apply_ice',6], ['f','BRITTLE payoff','brittle_payoff',5.5],
    ['g','Backup BRITTLE','brittle_payoff',4.5],
  ];
  const fixtureChampions = rows.map(([id,name])=>({id,name,rarity:id==='f'?'Common':'Legendary',gemColor:'Blue',reviewStatus:'complete',releaseState:'live',portrait:null,factions:[],roles:[],rawPower:id==='e'?999999:1,stars:id==='e'?7:1}));
  const fixtureStrategy = {
    version:'test', mechanics:[{id:'apply_ice',name:'Apply ICE',category:'status'},{id:'brittle_payoff',name:'BRITTLE payoff',category:'synergy'},{id:'physical_damage',name:'Physical damage',category:'damage'}], targets:[target],
    rules:[
      ...rows.map(([id,,mechanic,score])=>({id:`rule-${id}`,kind:'target_fit',targetId:target.id,subjectVariantId:id,mechanicId:mechanic,pairedMechanicId:null,score,rationale:`${nameFor(mechanic)} fit.`,evidenceCategory:'strategy_inference',provenanceRef:`target:${mechanic}`,confidence:1,reviewStatus:'reviewed'})),
      {id:'ice-brittle',kind:'team_synergy',targetId:null,subjectVariantId:null,mechanicId:'apply_ice',pairedMechanicId:'brittle_payoff',score:6,rationale:'ICE enables BRITTLE payoff.',evidenceCategory:'strategy_inference',provenanceRef:'derived:test',confidence:1,reviewStatus:'reviewed'},
    ],
    championFacts:rows.map(([id,,mechanic])=>({id:`fact-${id}`,variantId:id,mechanicId:mechanic,effectRole:'provides',context:'skill',factText:`Verified ${mechanic}.`,evidenceCategory:'verified_fact',provenanceRef:`ability:${id}`,sourceId:null,confidence:1,reviewStatus:'complete'})),
  };
  return {guideData:{champions:fixtureChampions,items:[],teams:[]},strategyData:fixtureStrategy,target};
}
const nameFor = id => id.replaceAll('_',' ');

test('beam search chooses complementary mechanics over the fifth individual score', () => {
  const fixture = compositionFixture();
  const result = recommendTeam({...fixture,targetId:fixture.target.id});
  assert.ok(result.team.some(row=>row.champion.id==='f'), 'lower-ranked BRITTLE payoff should enter the team');
  assert.ok(!result.team.some(row=>row.champion.id==='e'), 'redundant ICE should lose its place to the complementary payoff');
  assert.ok(result.teamSynergy.some(row=>row.id==='ice-brittle'));
});

test('excluding a specialist selects a role-preserving replacement', () => {
  const fixture = compositionFixture();
  const original = recommendTeam({...fixture,targetId:fixture.target.id});
  const specialist = original.team.find(row=>row.champion.id==='f');
  assert.equal(specialist.substitute.champion.id, 'g');
  assert.deepEqual(specialist.substitute.mechanics, ['brittle_payoff']);
  const replaced = recommendTeam({...fixture,targetId:fixture.target.id,excludeVariantIds:['f']});
  assert.ok(replaced.team.some(row=>row.champion.id==='g'));
});

test('deterministic tie-breaking returns the same exact variants and leader repeatedly', () => {
  const fixture = compositionFixture();
  const signatures = Array.from({length:12},()=>{const result=recommendTeam({...fixture,targetId:fixture.target.id});return `${result.team.map(row=>row.champion.id).join(',')}|${result.leader?.champion.id||''}`;});
  assert.equal(new Set(signatures).size, 1);
});

test('strongest means verified target fit, independent of rarity, stars, raw power, or popularity', () => {
  const fixture = compositionFixture();
  fixture.guideData.teams = Array.from({length:20},(_,index)=>({id:`popular-${index}`,members:[{name:'Redundant ICE'},{name:'Raw damage one'}]}));
  const result = recommendTeam({...fixture,targetId:fixture.target.id});
  const common = result.team.find(row=>row.champion.id==='f');
  assert.ok(common, 'the Common specialist with verified complementary fit must be selected');
  assert.ok(!result.team.some(row=>row.champion.id==='e'), 'raw power, stars, rarity, and observations must not override mechanics');
  assert.equal(result.teamSynergy.filter(row=>row.evidenceCategory==='community_observed').every(row=>row.score===0), true);
});

test('only the selected leader contributes leadership score', () => {
  const fixture = compositionFixture();
  const direct = fixture.strategyData.rules.filter(row=>row.kind==='target_fit');
  for (const id of ['a','b']) {
    fixture.strategyData.championFacts.push(
      {id:`leader-${id}`,variantId:id,mechanicId:'leader_effect',effectRole:'leads',context:'leader',factText:'Verified Leader effect.',evidenceCategory:'verified_fact',provenanceRef:`trait:leader-${id}`,sourceId:null,confidence:1,reviewStatus:'complete'},
      {id:`leader-physical-${id}`,variantId:id,mechanicId:'physical_damage',effectRole:'provides',context:'leader',factText:'Verified leader Physical Damage effect.',evidenceCategory:'verified_fact',provenanceRef:`trait:leader-${id}`,sourceId:null,confidence:1,reviewStatus:'complete'},
    );
  }
  const result = recommendTeam({...fixture,targetId:fixture.target.id});
  const selectedLeader = result.leader;
  assert.ok(selectedLeader);
  const nonLeader = result.team.find(row=>row.champion.id==='b');
  const physicalRule = direct.find(row=>row.subjectVariantId==='b');
  assert.equal(nonLeader.score, physicalRule.score, 'non-selected leader potential must not inflate individual fit');
});

test('inactive leader traits cannot trigger team synergy', () => {
  const fixture = compositionFixture();
  fixture.guideData.champions = fixture.guideData.champions.filter(row=>!['f','g'].includes(row.id));
  fixture.strategyData.championFacts = fixture.strategyData.championFacts.filter(row=>!['f','g'].includes(row.variantId));
  fixture.strategyData.championFacts.push(
    {id:'leader-a',variantId:'a',mechanicId:'leader_effect',effectRole:'leads',context:'leader',factText:'Verified Leader effect.',evidenceCategory:'verified_fact',provenanceRef:'trait:leader-a',sourceId:null,confidence:1,reviewStatus:'complete'},
    {id:'inactive-payoff',variantId:'b',mechanicId:'brittle_payoff',effectRole:'provides',context:'leader',factText:'Leader-only BRITTLE payoff.',evidenceCategory:'verified_fact',provenanceRef:'trait:inactive-payoff',sourceId:null,confidence:1,reviewStatus:'complete'},
  );
  const result = recommendTeam({...fixture,targetId:fixture.target.id});
  assert.equal(result.leader.champion.id, 'a');
  const inactive = result.team.find(row=>row.champion.id==='b');
  assert.ok(inactive);
  assert.equal(result.teamSynergy.some(row=>row.id==='ice-brittle'), false, 'synergy must not come from an inactive leader trait');
});

test('variant facts and exclusions never leak to another variant of the same character', () => {
  const fixture = compositionFixture();
  fixture.guideData.champions.find(row=>row.id==='a').name='Arya Stark — ICE variant';
  fixture.guideData.champions.find(row=>row.id==='e').name='Arya Stark — other variant';
  const result = recommendTeam({...fixture,targetId:fixture.target.id});
  assert.ok(result.team.some(row=>row.champion.id==='a'));
  const excluded = recommendTeam({...fixture,targetId:fixture.target.id,excludeVariantIds:['a']});
  const other = excluded.team.find(row=>row.champion.id==='e');
  assert.ok(other);
  assert.equal(other.scoringContributions.some(row=>row.factProvenanceRef==='ability:a'), false);
});
