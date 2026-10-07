import test from 'node:test';
import assert from 'node:assert/strict';
import { answerStrategyQuestion, buildTeamOptions, parseConversationRequest } from '../conversation-engine.js';
import { recommendDistinctTeams } from '../strategy-engine.js';

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

test('a supplied lineup with unresolved variants is shown without assigning guessed IDs',()=>{
  const partial={...curated,id:'viserion-first-party',targetId:'legendary-assault:viserion',reviewStatus:'partial',confidence:.8,
    leaderVariantId:'dany-yellow',members:[...curated.members.slice(0,2),{position:3,variantId:null,displayName:'Jon Snow',identityStatus:'unresolved',isLeader:false},...curated.members.slice(3)]};
  const answer=answerStrategyQuestion({question:'Best team for Viserion',guideData,strategyData:{...strategyData,curatedRecommendations:[curated,partial]}});
  assert.equal(answer.result.status,'partial_curated');
  assert.equal(answer.result.curatedRecommendation.members[2].variantId,null);
  assert.equal(answer.result.recommendationSource,'curated_partial');
});

test('a complete first-party Icy Viserion team may be shown while ability evidence remains insufficient',()=>{
  const icy=target('legendary-assault:icy-viserion','Icy Viserion');
  icy.evidenceState='insufficient';
  const recommendation={...curated,id:'icy-first-party',targetId:icy.id,leaderVariantId:'rhaenyra',members:curated.members};
  const answer=answerStrategyQuestion({question:'Best team for Icy Viserion',guideData,strategyData:{...strategyData,targets:[...targets,icy],curatedRecommendations:[curated,recommendation]}});
  assert.equal(answer.result.recommendationSource,'curated');
  assert.equal(answer.result.team.length,5);
  assert.match(answer.result.evidenceTier,/ability details incomplete/);
  assert.equal(answer.options.length,1);
});

test('public recommendations are multiple, stable, exact, and meaningfully different',()=>{
  const one=buildTeamOptions({guideData,strategyData,targetId:'legendary-assault:drogon'});
  const two=buildTeamOptions({guideData,strategyData,targetId:'legendary-assault:drogon'});
  assert.ok(one.length>=2);
  assert.equal(one[0].strategyLabel,'Official In-Game Recommendation');
  assert.equal(one[0].recommendationSource,'curated');
  assert.ok(one.slice(1).every(row=>row.recommendationSource==='engine'));
  assert.deepEqual(one.map(row=>row.team.map(member=>member.champion.id)),two.map(row=>row.team.map(member=>member.champion.id)));
  for(const row of one)assert.equal(new Set(row.team.map(member=>member.champion.id)).size,5);
  const engine=recommendDistinctTeams({guideData,strategyData,targetId:'raid:attack'});
  for(let i=0;i<engine.length;i++)for(let j=i+1;j<engine.length;j++)assert.ok(engine[i].team.filter(member=>engine[j].team.some(other=>other.champion.id===member.champion.id)).length<=2);
});

test('War and Raid Defense show several public teams without any account',()=>{
  assert.ok(buildTeamOptions({guideData,strategyData,targetId:'war:ravenous-pack'}).length>=2);
  assert.ok(buildTeamOptions({guideData,strategyData,targetId:'raid:defense'}).length>=2);
});

test('opposing Raid team input is accepted and answers remain deterministic without invented counters',()=>{
  const enemy=champions.slice(0,5).map(row=>row.id);
  const first=answerStrategyQuestion({question:'What should I use against this Raid team?',guideData,strategyData,enemyVariantIds:enemy});
  const second=answerStrategyQuestion({question:'What should I use against this Raid team?',guideData,strategyData,enemyVariantIds:enemy});
  assert.equal(first.request.targetId,'raid:attack');
  assert.deepEqual(first.context.enemyVariantIds,enemy);
  assert.deepEqual(first.options.map(row=>row.team.map(member=>member.champion.id)),second.options.map(row=>row.team.map(member=>member.champion.id)));
  assert.ok(first.enemyThreats.length>0);
});

test('another team follow-up selects a different supported lineup',()=>{
  const first=answerStrategyQuestion({question:'Give me teams for Drogon',guideData,strategyData});
  const next=answerStrategyQuestion({question:'Give me another Drogon team',guideData,strategyData,context:first.context});
  assert.equal(next.status,'ready');
  assert.notDeepEqual(next.result.team.map(row=>row.champion.id),first.result.team.map(row=>row.champion.id));
});
