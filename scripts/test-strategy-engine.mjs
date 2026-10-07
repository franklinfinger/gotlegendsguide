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
  assert.equal(parseStrategyQuestion('Who works best under Ravenous Pack?', strategyData.targets)?.id, 'war:ravenous-pack');
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
