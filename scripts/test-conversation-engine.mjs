import test from 'node:test';
import assert from 'node:assert/strict';
import { answerStrategyQuestion, compareCuratedRoster, parseConversationRequest } from '../conversation-engine.js';

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
});

const fullRoster=curated.members.map(row=>row.variantId);
test('roster questions require a verified signed-in roster instead of guessed ownership',()=>{
  const answer=answerStrategyQuestion({question:'What is my best team for Drogon?',guideData,strategyData});
  assert.equal(answer.status,'roster_required');
});

test('all five owned exact variants preserve the first-party Drogon team and leader',()=>{
  const answer=answerStrategyQuestion({question:'What is my best team for Drogon?',guideData,strategyData,roster:{ownedVariantIds:fullRoster}});
  assert.equal(answer.result.recommendationSource,'roster_curated');
  assert.deepEqual(answer.result.team.map(row=>row.champion.id),fullRoster);
  assert.equal(answer.result.leader.champion.id,curated.leaderVariantId);
  assert.equal(answer.result.rosterComparison.ownedCount,5);
});

test('missing one official variant retains four and chooses an owned deterministic replacement',()=>{
  const owned=[...fullRoster.filter(id=>id!=='alicent'),'sub-one'];
  const answer=answerStrategyQuestion({question:'Best Drogon team from my roster?',guideData,strategyData,roster:{ownedVariantIds:owned}});
  assert.equal(answer.result.recommendationSource,'roster_engine');
  assert.equal(answer.result.rosterComparison.knownMissing[0].variantId,'alicent');
  assert.deepEqual(new Set(answer.result.team.map(row=>row.champion.id)),new Set(owned));
  assert.deepEqual(answer.result.rosterReplacements.map(row=>row.id),['sub-one']);
});

test('roster eligibility uses exact IDs and never leaks an unowned variant of the same character',()=>{
  const owned=['dany-yellow','drogo','alicent','rhaenyra','sub-one','sub-two'];
  const answer=answerStrategyQuestion({question:'What Raid attack team can I make?',guideData,strategyData,roster:{ownedVariantIds:owned}});
  assert.equal(answer.result.team.every(row=>owned.includes(row.champion.id)),true);
  assert.equal(answer.result.team.some(row=>row.champion.id==='dany-blue'),false);
});

test('an insufficient owned roster is reported without inserting unowned champions',()=>{
  const answer=answerStrategyQuestion({question:'My best team for Drogon',guideData,strategyData,roster:{ownedVariantIds:['drogo','alicent','rhaenyra']}});
  assert.equal(answer.result.status,'insufficient_roster');
  assert.equal(answer.result.team.length,0);
});

test('ambiguous first-party positions never become exact roster matches',()=>{
  const partial={...curated,id:'viserion-first-party',targetId:'legendary-assault:viserion',reviewStatus:'partial',confidence:.8,
    members:[...curated.members.slice(0,2),{position:3,variantId:null,displayName:'Jon Snow',identityStatus:'unresolved',isLeader:false},...curated.members.slice(3)]};
  const comparison=compareCuratedRoster(partial,[...fullRoster,'sub-four']);
  assert.equal(comparison.knownOwned.length,4);
  assert.equal(comparison.unresolved.length,1);
  assert.equal(comparison.exact,false);
});

test('roster follow-ups keep target and explain missing exact official variants',()=>{
  const roster={ownedVariantIds:[...fullRoster.filter(id=>id!=='alicent'),'sub-one']};
  const first=answerStrategyQuestion({question:"What's my best team for Drogon?",guideData,strategyData,roster});
  const missing=answerStrategyQuestion({question:'Who am I missing?',guideData,strategyData,roster,context:first.context});
  assert.equal(missing.status,'roster_analysis');
  assert.equal(missing.analysis.comparison.knownMissing[0].variantId,'alicent');
  const instead=answerStrategyQuestion({question:'Who should I use instead?',guideData,strategyData,roster,context:first.context});
  assert.equal(instead.request.targetId,'legendary-assault:drogon');
  assert.equal(instead.result.team.every(row=>roster.ownedVariantIds.includes(row.champion.id)),true);
});

test('a new ordinary battle question returns to the best known public team',()=>{
  const roster={ownedVariantIds:[...fullRoster.filter(id=>id!=='alicent'),'sub-one']};
  const first=answerStrategyQuestion({question:"What's my best team for Drogon?",guideData,strategyData,roster});
  const next=answerStrategyQuestion({question:'Best team for Drogon',guideData,strategyData,context:first.context});
  assert.equal(next.result.recommendationSource,'curated');
  assert.equal(next.request.rosterMode,false);
});

test('level and stars are retained in request data but do not change team ordering',()=>{
  const owned=[...fullRoster.filter(id=>id!=='alicent'),'sub-one','sub-two'];
  const question='Best Drogon team from my roster';
  const first=answerStrategyQuestion({question,guideData,strategyData,roster:{ownedVariantIds:owned,levels:{'sub-one':1,'sub-two':100},stars:{'sub-one':0,'sub-two':7}}});
  const second=answerStrategyQuestion({question,guideData,strategyData,roster:{ownedVariantIds:owned,levels:{'sub-one':100,'sub-two':1},stars:{'sub-one':7,'sub-two':0}}});
  assert.deepEqual(first.result.team.map(row=>row.champion.id),second.result.team.map(row=>row.champion.id));
  assert.equal(first.request.roster.levels['sub-one'],1);
});
