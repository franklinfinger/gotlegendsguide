import test from 'node:test';
import assert from 'node:assert/strict';
import {activeFactionBonuses,analyzeRaidDefense,raidSelectionTransition,raidTeamEvaluation,resetRaidSelection,verifiedAllyPairs} from '../raid-engine.js';
import {recommendTeam} from '../strategy-engine.js';

const names=['Arya Stark - Winterfell Returned','Tywin Lannister','Ned Stark','Olenna Tyrell','Sansa Stark','Jon Snow','Catelyn Stark','Benjen Stark','Meryn Trant','Petyr Baelish'];
const champions=names.map((name,index)=>({id:`c${index}`,name,gemColor:'Blue',factions:[0,2,4,5,6,7].includes(index)?['Stark']:['Other'],releaseState:'live',reviewStatus:'complete'}));
const stark={id:'stark',name:'Stark',memberVariantIds:champions.filter(row=>row.factions.includes('Stark')).map(row=>row.id),rules:[{kind:'current_bonus',text:'All team members gain +20% Gem Damage and +25% DEF.'}]};
const guideData={champions,factions:[stark],factionActivations:[{factionId:'stark',factionName:'Stark',requiredMembers:3,sourceId:102772}],allyGems:[{id:'sisters',ownerName:'Arya Stark',allyName:'Sansa Stark - Lady of Winterfell',gemName:'Sisters Reunited Gem',effect:'When activated, this Gem grants all allies +25% Tenacity for 3 turns, and marks the enemy struck with ARYA\'S LIST for 3 turns.',reviewState:'visually_verified',currentnessState:'historical_currentness_unknown',sourceId:102546}],items:[],teams:[]};
const enemyIds=champions.slice(0,5).map(row=>row.id);
const fact=(variantId,mechanicId,context,factText)=>({id:`${variantId}-${mechanicId}-${context}`,variantId,mechanicId,context,factText,reviewStatus:'complete',confidence:1,provenanceRef:`source:${variantId}`});
const championFacts=[fact('c2','apply_ice','leader','Winter is Coming II: At the start of combat all enemies are afflicted with ICE.'),fact('c2','apply_ice','skill','Ned TAUNTS and afflicts attackers with ICE.'),fact('c3','apply_poison','skill','Olenna HEALS all team members and afflicts all enemies with POISON.'),fact('c3','cleanse','trait','Olenna REMOVES 3 Debuffs from that team member.'),fact('c4','apply_ice','trait','Sansa afflicts the attacker with ICE.'),fact('c0','brittle_payoff','trait','Arya strikes BRITTLE enemies for double damage.'),fact('c3','apply_poison','leader','Olenna extends POISON when allies use Skills.')];
const strategyData={championFacts,mechanics:[],targets:[{id:'raid:attack',battleMode:'raid',name:'Raid attack',evidenceState:'verified',approach:'Attack the defense.',timing:'Use Skills.',warning:'No guaranteed outcome.'}],rules:[{id:'damage',kind:'target_fit',targetId:'raid:attack',mechanicId:'physical_damage',score:5,rationale:'Direct damage.',evidenceCategory:'strategy_inference',provenanceRef:'test',confidence:1}],curatedRecommendations:[]};

test('enemy Leader selection activates only that Leader wording',()=>{
  const ned=analyzeRaidDefense({guideData,strategyData,enemyVariantIds:enemyIds,leaderVariantId:'c2'});
  const olenna=analyzeRaidDefense({guideData,strategyData,enemyVariantIds:enemyIds,leaderVariantId:'c3'});
  assert.match(ned.leaderFact.factText,/Winter is Coming/);
  assert.match(olenna.leaderFact.factText,/extends POISON/);
  assert.ok(!ned.facts.some(row=>row.context==='leader'&&row.variantId==='c3'));
  assert.notEqual(ned.signature,olenna.signature);
});

test('three exact Stark members activate the sourced bonus, including dual-faction Arya',()=>{
  const bonus=activeFactionBonuses(champions.slice(0,5),guideData)[0];
  assert.equal(bonus.factionName,'Stark');
  assert.deepEqual(bonus.contributors.map(row=>row.id),['c0','c2','c4']);
  assert.equal(activeFactionBonuses(champions.slice(1,5),guideData).length,0);
});

test('only the verified Arya and Sansa ally card is detected',()=>{
  const pair=verifiedAllyPairs(champions.slice(0,5),guideData)[0];
  assert.equal(pair.gemName,'Sisters Reunited Gem');
  assert.match(pair.effect,/Tenacity/);
  assert.equal(verifiedAllyPairs(champions.slice(1,5),guideData).length,0);
});

test('faction synergy can outweigh a modest individual score gap',()=>{
  const member=champion=>({champion,mechanics:new Set(),facts:[]});
  const core=champions.slice(0,5).map(member);
  const loose=[champions[1],champions[3],champions[8],champions[9],champions[5]].map(member);
  assert.ok(raidTeamEvaluation(core,guideData).score>raidTeamEvaluation(loose,guideData).score+20);
});

test('the actual Raid team search prefers a sourced faction core over five higher individual scores',()=>{
  const roster=[...champions.slice(5,8),...champions.slice(1,4),...champions.slice(8,10)];
  const testGuide={...guideData,champions:roster,factions:[{...stark,memberVariantIds:roster.filter(row=>row.factions.includes('Stark')).map(row=>row.id)}],allyGems:[]};
  const facts=roster.map(row=>fact(row.id,'physical_damage','skill','Deals verified Physical Damage.'));
  const rules=roster.map(row=>({id:`fit-${row.id}`,kind:'target_fit',targetId:'raid:attack',subjectVariantId:row.id,mechanicId:'physical_damage',score:row.factions.includes('Stark')?4:10,rationale:'Physical pressure.',evidenceCategory:'strategy_inference',provenanceRef:'test',confidence:1}));
  const testStrategy={...strategyData,championFacts:facts,rules};
  const without=recommendTeam({guideData:{...testGuide,factionActivations:[]},strategyData:testStrategy,targetId:'raid:attack'});
  const withCore=recommendTeam({guideData:testGuide,strategyData:testStrategy,targetId:'raid:attack',raidDefense:{status:'ready',mechanics:[],leader:null}});
  assert.ok(without.team.filter(row=>row.champion.factions.includes('Stark')).length<3);
  assert.equal(withCore.factionBonuses[0].factionName,'Stark');
  assert.ok(withCore.team.filter(row=>row.champion.factions.includes('Stark')).length>=3);
});

test('verified opponent mechanics still affect team ranking',()=>{
  const base=champions.slice(0,5).map(champion=>({champion,mechanics:new Set(),facts:[]}));
  const fast=base.map((row,index)=>({...row,facts:index===0?[fact(row.champion.id,'stamina','skill','Grants Stamina.'),fact(row.champion.id,'cleanse','skill','Removes Debuffs.')]:[]}));
  const defense=analyzeRaidDefense({guideData,strategyData,enemyVariantIds:enemyIds,leaderVariantId:'c2'});
  assert.ok(raidTeamEvaluation(fast,guideData,defense).score>raidTeamEvaluation(base,guideData,defense).score);
});

test('changing a defender or Leader drops old analysis and recommendations; Reset clears all',()=>{
  const first=raidSelectionTransition(resetRaidSelection(),{enemyVariantIds:enemyIds,leaderVariantId:'c2'});
  first.analysis={status:'ready'};first.recommendations=[{team:['old']}];
  const replaced=raidSelectionTransition(first,{enemyVariantIds:[...enemyIds.slice(0,4),'c5'],leaderVariantId:'c2'});
  assert.equal(replaced.analysis,null);assert.deepEqual(replaced.recommendations,[]);
  const leaderChanged=raidSelectionTransition(first,{enemyVariantIds:enemyIds,leaderVariantId:'c3'});
  assert.equal(leaderChanged.analysis,null);assert.deepEqual(leaderChanged.recommendations,[]);
  const removed=raidSelectionTransition(first,{enemyVariantIds:[...enemyIds.slice(0,4),''],leaderVariantId:'c2'});
  assert.deepEqual(removed.recommendations,[]);
  const reset=resetRaidSelection();
  assert.deepEqual(reset.enemyVariantIds,['','','','','']);assert.equal(reset.leaderVariantId,null);assert.equal(reset.analysis,null);assert.deepEqual(reset.recommendations,[]);
});

test('Raid analysis and recommendation need no account or roster state',()=>{
  const defense=analyzeRaidDefense({guideData,strategyData,enemyVariantIds:enemyIds,leaderVariantId:'c2'});
  const result=recommendTeam({guideData,strategyData,targetId:'raid:attack',raidDefense:defense});
  assert.equal(result.team.length,5);
  assert.ok(result.factionBonuses.length);
  assert.equal(defense.status,'ready');
});
