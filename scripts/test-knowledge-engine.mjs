import test from 'node:test';
import assert from 'node:assert/strict';
import {answerGuideQuestion,routeGuideQuestion} from '../knowledge-engine.js';

const champion=(id,name,factions=[])=>({id,name,gemColor:'Red',rarity:'Legendary',portrait:`assets/champion-portraits/${id}.png`,factions,releaseState:'live'});
const champions=[champion('olenna','Olenna Tyrell'),champion('meryn','Meryn Trant',['Lannister']),champion('alicent','Alicent Hightower',['Greens','Targaryen']),champion('jon','Jon Snow — King in the North',['Stark']),champion('drogon','Adolescent Drogon',['Free Cities'])];
const fact=(id,variantId,mechanicId,factText,context='skill')=>({id,variantId,mechanicId,factText,context,evidenceCategory:'verified_fact',provenanceRef:`source:${id}`,reviewStatus:'complete'});
const guideData={champions,
  abilities:[{id:'meryn-skill',variantId:'meryn',kind:'champion_skill',name:'No One Threatens His Grace',text:'Meryn TAUNTS enemies.',reviewStatus:'complete',provenance:'source:meryn'}],
  traits:[],items:[{id:'catspaw',name:'CatsPaw Dagger',ownerVariantId:'alicent',ownerName:'Alicent Hightower',abilities:[{id:'fox',name:'How Sweetly The Fox Speaks III',text:'Alicent grants BIRTHRIGHT.',reviewStatus:'complete'}]}],
  factions:[{id:'stark',name:'Stark',memberVariantIds:['jon'],rules:[{kind:'current_bonus',text:'Verified Stark bonus.'}]}],statuses:[],mechanics:[]};
const strategyData={championFacts:[
  fact('poison','olenna','apply_poison','I Want It Served Now: Olenna afflicts all enemies with POISON for 3 turns.'),
  fact('fire','drogon','apply_fire','Ember Storm: Drogon afflicts a target with FIRE.'),
  fact('stun','meryn','stun','Mind Your Place: Meryn STUNS an enemy.'),
  fact('immunity','drogon','stun','Dragon Skin: Drogon is immune to STUN.','trait'),
  fact('unverified','jon','apply_poison','Rumor: Jon afflicts an enemy with POISON.','skill')
],mechanics:[],targets:[]};
strategyData.championFacts.at(-1).reviewStatus='partial';
const answer=question=>answerGuideQuestion({question,guideData,strategyData});

test('Who can use poison? returns only exact source-backed owners',()=>{
  const result=answer('Who can use poison?');
  assert.equal(result.intent,'mechanic_lookup');
  assert.equal(result.title,'POISON');
  assert.deepEqual(result.entries.map(row=>row.champion.id),['olenna']);
  assert.equal(result.entries[0].facts[0].title,'I Want It Served Now');
});
test('Who applies FIRE? routes to mechanic facts',()=>assert.deepEqual(answer('Who applies FIRE?').entries.map(row=>row.champion.id),['drogon']));
test('Who can STUN? excludes immunity-only text',()=>assert.deepEqual(answer('Who can STUN?').entries.map(row=>row.champion.id),['meryn']));
test('What faction is Alicent Hightower? uses current variant memberships',()=>assert.deepEqual(answer('What faction is Alicent Hightower?').entries[0].champion.factions,['Greens','Targaryen']));
test('Who is in the Stark faction? returns current members',()=>assert.deepEqual(answer('Who is in the Stark faction?').entries.map(row=>row.champion.id),['jon']));
test('What does CatsPaw Dagger do? returns owner and complete ability wording',()=>{
  const result=answer('What does CatsPaw Dagger do?');
  assert.equal(result.intent,'item_lookup');
  assert.equal(result.entries[0].champion.id,'alicent');
  assert.match(result.entries[0].facts[0].wording,/BIRTHRIGHT/);
});
test('What does Meryn Trant do? returns complete skill',()=>assert.equal(answer('What does Meryn Trant do?').entries[0].facts[0].title,'No One Threatens His Grace'));
test("a possessive champion name routes to that champion's skill",()=>assert.equal(answer("What is Jon Snow's skill?").intent,'skill_trait_lookup'));
test('a base character question keeps exact variants separate',()=>assert.deepEqual(answer('Which versions of Jon Snow are in the game?').entries.map(row=>row.champion.id),['jon']));
test('Strongest team for Drogon? retains battle strategy routing',()=>assert.equal(answer('Strongest team for Drogon?').status,'battle'));
test('unknown question asks one concise clarification instead of choosing a battle',()=>assert.equal(answer('Tell me more').intent,'clarification'));
test('battle follow-ups retain their target context',()=>assert.equal(routeGuideQuestion("I don't have Alicent. Who should I use?",{guideData,strategyData,context:{targetId:'legendary-assault:drogon'}}).intent,'battle_recommendation'));
