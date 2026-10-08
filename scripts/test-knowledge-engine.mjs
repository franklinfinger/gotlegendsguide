import test from 'node:test';
import assert from 'node:assert/strict';
import {answerGuideQuestion,routeGuideQuestion} from '../knowledge-engine.js';

const champion=(id,name,factions=[])=>({id,name,gemColor:'Red',rarity:'Legendary',portrait:`assets/champion-portraits/${id}.png`,factions,releaseState:'live'});
const champions=[champion('olenna','Olenna Tyrell'),champion('meryn','Meryn Trant',['Lannister']),champion('alicent','Alicent Hightower',['Greens','Targaryen']),champion('jon','Jon Snow — King in the North',['Stark']),champion('drogon','Adolescent Drogon',['Free Cities']),champion('ormund','Ormund Hightower — Beacon of the South',['Greens']),champion('red-ned','Ned Stark — The Hand of the King',['Stark']),champion('blue-ned','Ned Stark',['Stark']),champion('viserys','Viserys Targaryen III — The Usurped',['Targaryen']),champion('other-viserys','Viserys Targaryen I',['Targaryen'])];
const fact=(id,variantId,mechanicId,factText,context='skill')=>({id,variantId,mechanicId,factText,context,evidenceCategory:'verified_fact',provenanceRef:`source:${id}`,reviewStatus:'complete'});
const guideData={champions,
  abilities:[{id:'meryn-skill',variantId:'meryn',kind:'champion_skill',name:'No One Threatens His Grace',text:'Meryn TAUNTS enemies.',reviewStatus:'complete',provenance:'source:meryn'},{id:'red-ned-skill',variantId:'red-ned',kind:'champion_skill',name:'I Will Not Have Their Blood On My Hands',text:'Ned grants a target ally LOYALTY.',reviewStatus:'complete',provenance:'Screenshot Verified'}],
  traits:[],companions:[{id:'guard',variantId:'ormund',name:'Hightower Guardsman',skillName:'Never Apologize For Victory',skillText:'The Guardsman deals Physical Damage to one enemy.',traitName:'We Must Keep A Firm Grip III',traitText:'The Guardsman TAUNTS.',inheritanceText:'Inherits Level, Star Rank, and Skill Level from Ormund.',reviewStatus:'complete'}],items:[{id:'catspaw',name:'CatsPaw Dagger',ownerVariantId:'alicent',ownerName:'Alicent Hightower',abilities:[{id:'fox',name:'How Sweetly The Fox Speaks III',text:'Alicent grants BIRTHRIGHT.',reviewStatus:'complete'}]},{id:'dragon-brooch',name:'Dragon Brooch',ownerVariantId:'viserys',ownerName:'Viserys Targaryen III',abilities:[{id:'dragon-ability',name:'I Am The Dragon IV',text:'Once per turn when an ally uses their Skill, Viserys grants them 1 FURY and has a 60% chance to apply FIRE on himself.',reviewStatus:'complete'}]}],
  factions:[{id:'stark',name:'Stark',memberVariantIds:['jon','red-ned','blue-ned'],rules:[{kind:'current_bonus',text:'All team members gain +20% Gem Damage and +25% DEF.'}]},{id:'greens',name:'Greens',memberVariantIds:['alicent','ormund'],rules:[{kind:'current_bonus',text:'All team members gain +20% Gem Damage and +25% Power.'},{kind:'how_to_play',text:'The Greens start strong with BIRTHRIGHT. They must act quickly, as BIRTHRIGHT fades as the battle goes on.'}]}],statuses:[{id:1,name:'LOYALTY',text:'If POISON, DECEIVE, or SCOUT is inflicted on this Champion, Ned gains the debuff instead for 3 turns. Ned has a 50% chance to cleanse it from himself immediately.',reviewStatus:'complete'}],mechanics:[]};
const strategyData={championFacts:[
  fact('poison','olenna','apply_poison','I Want It Served Now: Olenna afflicts all enemies with POISON for 3 turns.'),
  fact('fire','drogon','apply_fire','Ember Storm: Drogon afflicts a target with FIRE.'),
  fact('stun','meryn','stun','Mind Your Place: Meryn STUNS an enemy.'),
  fact('immunity','drogon','stun','Dragon Skin: Drogon is immune to STUN.','trait'),
  fact('unverified','jon','apply_poison','Rumor: Jon afflicts an enemy with POISON.','skill'),
  fact('ormund-birthright','ormund','birthright','To Restore The Rightful Line III: All team members gain 8 BIRTHRIGHT.','trait'),
  fact('ormund-remove','ormund','buff_removal','To Restore The Rightful Line III: Ormund REMOVES 2 Buffs from each enemy.','trait'),
  fact('red-ned-loyalty','red-ned','loyalty','The King Called On Me To Serve: Ned grants allies LOYALTY.','leader'),
  fact('red-ned-redirect','red-ned','loyalty_redirect','LOYALTY: If POISON, DECEIVE, or SCOUT is inflicted on this Champion, Ned gains the debuff instead for 3 turns.','trait'),
  fact('viserys-fury','viserys','fury','I Am The Dragon IV: Viserys grants an ally 1 FURY when they use their Skill.','item'),
  fact('viserys-self-fire','viserys','apply_fire','I Am The Dragon IV: Viserys has a 60% chance to apply FIRE on himself.','item')
],mechanics:[],targets:[]};
strategyData.championFacts.find(row=>row.id==='unverified').reviewStatus='partial';
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
test('exact red Ned lookup does not merge the Blue Ned variant',()=>{
  const entries=answer('What does Ned Stark — The Hand of the King do?').entries;
  assert.deepEqual(entries.map(row=>row.champion.id),['red-ned']);
  assert.equal(entries[0].facts[0].title,'I Will Not Have Their Blood On My Hands');
});
test('LOYALTY and POISON redirect remain distinct from POISON application',()=>{
  assert.deepEqual(answer('Who uses LOYALTY?').entries.map(row=>row.champion.id),['red-ned']);
  assert.deepEqual(answer('Who can redirect POISON?').entries.map(row=>row.champion.id),['red-ned']);
  assert.deepEqual(answer('Who can use poison?').entries.map(row=>row.champion.id),['olenna']);
  assert.match(answer('What is LOYALTY?').facts[0].wording,/50% chance to cleanse/);
});
test('current Stark and Greens rules and Ormund membership answer directly',()=>{
  assert.equal(answer('What is the Stark faction bonus?').facts[0].wording,'All team members gain +20% Gem Damage and +25% DEF.');
  assert.equal(answer('What is the Greens faction bonus?').facts[0].wording,'All team members gain +20% Gem Damage and +25% Power.');
  assert.deepEqual(answer('What faction is Ormund Hightower?').entries[0].champion.factions,['Greens']);
});
test('Dragon Brooch routes to the existing Viserys and self-FIRE is not enemy application',()=>{
  assert.equal(answer('What does Dragon Brooch do?').entries[0].champion.id,'viserys');
  assert.deepEqual(answer('What is Viserys Targaryen III\'s iconic item?').entries.map(row=>row.champion.id),['viserys']);
  assert.equal(answer('What is Viserys Targaryen III\'s iconic item?').entries[0].facts[0].title,'Dragon Brooch');
  assert.deepEqual(answer('Who grants FURY?').entries.map(row=>row.champion.id),['viserys']);
  assert.deepEqual(answer('Who applies FIRE?').entries.map(row=>row.champion.id),['drogon']);
});
test('Ormund knowledge includes his associated unit and verified Greens membership',()=>{
  const entry=answer('What does Ormund Hightower do?').entries[0];
  assert.deepEqual(entry.champion.factions,['Greens']);
  assert.ok(entry.facts.some(row=>row.title==='Hightower Guardsman: Never Apologize For Victory'));
});
test('BIRTHRIGHT and buff removal queries resolve Ormund from verified wording',()=>{
  assert.ok(answer('Who grants BIRTHRIGHT?').entries.some(row=>row.champion.id==='ormund'));
  assert.ok(answer('Who removes buffs?').entries.some(row=>row.champion.id==='ormund'));
});
test('What faction is Alicent Hightower? uses current variant memberships',()=>assert.deepEqual(answer('What faction is Alicent Hightower?').entries[0].champion.factions,['Greens','Targaryen']));
test('Who is in the Stark faction? returns current exact variants',()=>assert.deepEqual(answer('Who is in the Stark faction?').entries.map(row=>row.champion.id),['jon','blue-ned','red-ned']));
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
