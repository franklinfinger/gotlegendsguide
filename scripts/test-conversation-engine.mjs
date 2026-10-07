import test from 'node:test';
import assert from 'node:assert/strict';
import { answerStrategyQuestion, parseConversationRequest } from '../conversation-engine.js';

const target=(id,name,battleMode='legendary-assault')=>({id,name,battleMode,kind:'encounter',evidenceState:'verified',approach:`Use verified mechanics against ${name}.`,timing:'Set up, then use Skills.',warning:'Watch the encounter rules.',provenanceRef:`target:${id}`,reviewStatus:'reviewed'});
const targets=[target('legendary-assault:drogon','Drogon'),target('legendary-assault:viserion','Viserion'),target('raid:attack','Raid attack','raid'),target('raid:defense','Raid defense','raid'),target('war:ravenous-pack','Ravenous Pack','war')];
const champions=[
  ['dany-yellow','Daenerys Targaryen — Khaleesi','Yellow',['Free Cities','Sun\'s Dominion']],
  ['drogo','Khal Drogo','Red',['Free Cities']],
  ['dany-blue','Daenerys Targaryen — Conqueror Of Qarth','Blue',['Free Cities']],
  ['alicent','Alicent Hightower','Blue',['Greens']],
  ['rhaenyra','Rhaenyra Targaryen','Purple',['Blacks','Targaryen']],
  ['sub-one','Meryn Trant','Red',['Lannister']],
  ['sub-two','Arya Stark — The Water Dancer','Blue',['Stark']],
  ['sub-three','Ned Stark','Green',['Stark']],
  ['sub-four','Jon Snow','Yellow',["Night's Watch"]],
  ['sub-five','Brienne of Tarth','Purple',['Baratheon']],
  ['sub-six','Davos Seaworth','Red',['Baratheon']],
].map(([id,name,gemColor,factions])=>({id,name,gemColor,factions,rarity:'Legendary',reviewStatus:'complete',releaseState:'live',portrait:null,roles:[]}));
const mechanics=[{id:'physical_damage',name:'Physical damage',category:'damage'},{id:'fire_damage',name:'Fire damage',category:'damage'},{id:'leader_effect',name:'Leader effect',category:'leadership'}];
const championFacts=champions.flatMap((champion,index)=>[
  {id:`damage-${index}`,variantId:champion.id,mechanicId:'physical_damage',effectRole:'deals',context:'skill',factText:'Deals verified Physical Damage.',evidenceCategory:'verified_fact',provenanceRef:`ability:${champion.id}`,sourceId:index,confidence:1,reviewStatus:'complete'},
  ...(champion.id==='dany-yellow'?[{id:'leader-dany',variantId:champion.id,mechanicId:'leader_effect',effectRole:'leads',context:'leader',factText:'Verified Leader effect.',evidenceCategory:'verified_fact',provenanceRef:'trait:dany-yellow',sourceId:1,confidence:1,reviewStatus:'complete'}]:[]),
]);
const rules=targets.flatMap(row=>[
  {id:`physical-${row.id}`,kind:'target_fit',battleMode:row.battleMode,targetId:row.id,subjectVariantId:null,mechanicId:'physical_damage',pairedMechanicId:null,score:10,rationale:'Physical Damage has verified target value.',evidenceCategory:'strategy_inference',provenanceRef:`rule:${row.id}`,sourceId:null,confidence:1,reviewStatus:'reviewed'},
  ...(row.id==='legendary-assault:drogon'?[{id:'drogon-fire',kind:'target_fit',battleMode:row.battleMode,targetId:row.id,subjectVariantId:null,mechanicId:'fire_damage',pairedMechanicId:null,score:-20,rationale:'Drogon is immune to FIRE.',evidenceCategory:'strategy_inference',provenanceRef:'rule:drogon-fire',sourceId:null,confidence:1,reviewStatus:'reviewed'}]:[]),
]);
const curated={id:'drogon-best',targetId:'legendary-assault:drogon',title:'Best known Drogon team',recommendationType:'best_known',confidence:1,provenanceRef:'source:102791',sourceId:102791,notes:'Screenshot verified.',active:true,effectiveDate:'2026-10-07',gameVersion:'2026-10',reviewStatus:'reviewed',leaderVariantId:'dany-yellow',members:['dany-yellow','drogo','dany-blue','alicent','rhaenyra'].map((variantId,index)=>({position:index+1,variantId}))};
const guideData={champions,items:[],teams:[{id:'community',members:champions.slice(5,10).map(row=>({name:row.name}))}]};
const strategyData={version:'test',mechanics,targets,rules,championFacts,curatedRecommendations:[curated]};

test('active high-confidence curated recommendation takes precedence and preserves exact variants',()=>{
  const answer=answerStrategyQuestion({question:'What is the strongest team to fight Drogon?',guideData,strategyData});
  assert.equal(answer.result.recommendationSource,'curated');
  assert.deepEqual(answer.result.team.map(row=>row.champion.id),curated.members.map(row=>row.variantId));
  assert.equal(answer.result.leader.champion.id,'dany-yellow');
});

test('engine is used when no curated recommendation exists',()=>{
  const answer=answerStrategyQuestion({question:'Best team for Viserion?',guideData,strategyData});
  assert.equal(answer.result.recommendationSource,'engine');
  assert.equal(answer.result.team.length,5);
});

test('community observations never override curated or engine selection',()=>{
  const curatedAnswer=answerStrategyQuestion({question:'Strongest team for Drogon',guideData,strategyData});
  assert.equal(curatedAnswer.result.recommendationSource,'curated');
  const engineAnswer=answerStrategyQuestion({question:'Best team for Viserion',guideData,strategyData});
  assert.equal(engineAnswer.result.teamSynergy.filter(row=>row.evidenceCategory==='community_observed').every(row=>row.score===0),true);
});

test('follow-up substitution maintains target context and excludes the exact prior member',()=>{
  const first=answerStrategyQuestion({question:'Strongest team for Drogon',guideData,strategyData});
  const follow=answerStrategyQuestion({question:"I don't have Alicent. Who should I use?",guideData,strategyData,context:first.context});
  assert.equal(follow.request.targetId,'legendary-assault:drogon');
  assert.equal(follow.request.subjectVariantId,'alicent');
  assert.equal(follow.result.recommendationSource,'engine_alternative');
  assert.equal(follow.result.team.some(row=>row.champion.id==='alicent'),false);
});

test('dual-faction champion data stays intact on recommendation cards',()=>{
  const answer=answerStrategyQuestion({question:'Strongest team for Drogon',guideData,strategyData});
  assert.deepEqual(answer.result.team[0].champion.factions,['Free Cities',"Sun's Dominion"]);
});

test('ambiguous base names are not silently resolved',()=>{
  const first=answerStrategyQuestion({question:'Strongest team for Drogon',guideData,strategyData});
  const follow=answerStrategyQuestion({question:"I don't have Daenerys",guideData,strategyData,context:first.context});
  assert.equal(follow.status,'ambiguous_variant');
});

test('natural language routes to deterministic targets and follow-up intents',()=>{
  assert.equal(parseConversationRequest('Who should I use for Raid attack?',{targets,guideData}).targetId,'raid:attack');
  assert.equal(parseConversationRequest("What's a good defense team?",{targets,guideData}).targetId,'raid:defense');
  assert.equal(parseConversationRequest('What should I use for Ravenous Pack?',{targets,guideData}).targetId,'war:ravenous-pack');
});

test('conversation responses can only return curated or deterministic teams',()=>{
  for(const question of ['Strongest team for Drogon','Best team for Viserion','Who should I use for Raid attack?']){
    const answer=answerStrategyQuestion({question,guideData,strategyData});
    assert.ok(['curated','engine'].includes(answer.result.recommendationSource));
    assert.equal(answer.result.team.every(row=>champions.some(champion=>champion.id===row.champion.id)),true);
  }
});
