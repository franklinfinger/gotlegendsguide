import test from 'node:test';
import assert from 'node:assert/strict';
import {answerStrategyQuestion,parseConversationRequest,buildTeamOptions} from '../conversation-engine.js';
import {evaluateExactTeam} from '../strategy-engine.js';

const arya='Arya Stark — Winterfell Returned',sansa='Sansa Stark — Lady Of Winterfell';
const question=`Build a Raid Defense team with ${arya} but without ${sansa}.`;
function fixture(){
  const names=[arya,sansa,'Sansa Stark — Queen In The North','Bronn — Sellsword For Hire','Cersei Lannister — Queen Of The Andals And The First Men',...Array.from({length:8},(_,i)=>'Synthetic Ally '+i)];
  const champions=names.map((name,i)=>({id:'c'+i,name,releaseState:'live',reviewStatus:'complete',factions:[],roles:[]}));
  const targets=[{id:'raid:defense',name:'Raid defense',battleMode:'raid',evidenceState:'verified',approach:'Synthetic',timing:'Synthetic',warning:'Synthetic'}];
  const championFacts=champions.map(row=>({id:'fact:'+row.id,variantId:row.id,mechanicId:'physical_damage',context:'skill',factText:'Synthetic direct damage.',evidenceCategory:'verified_fact',reviewStatus:'complete',provenanceRef:'synthetic:'+row.id,confidence:1}));
  const rules=[{id:'r',kind:'target_fit',targetId:'raid:defense',mechanicId:'physical_damage',score:10,rationale:'Synthetic fit.',evidenceCategory:'strategy_inference',provenanceRef:'synthetic',confidence:1},{id:'prefer-excluded',kind:'target_fit',targetId:'raid:defense',subjectVariantId:'c1',mechanicId:'physical_damage',score:1,rationale:'Synthetic stronger candidate.',evidenceCategory:'strategy_inference',provenanceRef:'synthetic',confidence:1}];
  const guideData={champions,items:[{id:'synthetic-sword',name:'Synthetic Sword',ownerVariantId:'c0',abilities:[]}],abilities:[],traits:[],teams:[],factions:[],factionActivations:[],allyGems:[],verifiedCollection:{variantIds:champions.map(row=>row.id),captureDate:'2000-01-01',records:[],effectDefinitions:[],capturedAllyPairs:[{id:'synthetic-pair',status:'captured_pair',variantIds:['c0','c1'],ownerName:arya,allyName:sansa,gemName:'Synthetic Gem',sources:[],sourceRefs:[]}]}};
  return {guideData,strategyData:{targets,championFacts,rules,mechanics:[{id:'physical_damage',name:'Physical Damage',category:'damage'}],curatedRecommendations:[]}};
}
const parse=(q,f=fixture(),context={})=>parseConversationRequest(q,{guideData:f.guideData,targets:f.strategyData.targets,context});
const ask=(q=question,f=fixture(),context={})=>answerStrategyQuestion({...f,question:q,context});
function respects(result,{required=['c0'],excluded=['c1']}={}) {
  const ids=result.team.map(row=>row.champion.id);
  assert.ok(required.every(id=>ids.includes(id)));assert.ok(excluded.every(id=>!ids.includes(id)));
  assert.ok(result.team.every(row=>!row.substitute||!excluded.includes(row.substitute.champion.id)));
  assert.ok(result.substitutes.every(row=>!excluded.includes(row.champion.id)));
  assert.ok(['present','options'].every(key=>(result.capturedAllyPairs?.[key]||[]).every(pair=>!pair.variantIds.some(id=>excluded.includes(id)))));
}

test('exact browser question resolves the required Arya and excluded Sansa independently',()=>{
  const f=fixture(),before=JSON.stringify(f),request=parse(question,f),answer=ask(question,f);
  assert.equal(request.status,'ready');assert.equal(request.intent,'recommendation');assert.deepEqual(request.requiredVariantIds,['c0']);assert.deepEqual(request.excludedVariantIds,['c1']);assert.equal(request.subjectVariantId,null);
  assert.equal(answer.status,'ready');assert.ok(answer.options.length);for(const result of answer.options)respects(result);assert.equal(answer.replacementPlan,null);assert.equal(JSON.stringify(f),before);
});

test('comma and and lists preserve full subtitles containing conjunctions and for',()=>{
  const f=fixture(),bronn=f.guideData.champions[3].name,cersei=f.guideData.champions[4].name;
  for(const q of [`Build a Raid Defense team with ${arya}, ${bronn}, and ${cersei} but without ${sansa}.`,`Build a team around ${arya} and ${bronn} and ${cersei} for Raid Defense without ${sansa}.`]){
    const r=parse(q,f);assert.equal(r.status,'ready',r.message);assert.deepEqual(r.requiredVariantIds,['c0','c3','c4']);assert.deepEqual(r.excludedVariantIds,['c1']);
  }
});

test('multiple explicit exclusions and reversed clauses cannot be silently dropped',()=>{
  for(const q of [`Build a Raid Defense team with ${arya} without ${sansa} and Synthetic Ally 0.`,`Build a Raid Defense team without ${sansa}, Synthetic Ally 0, and Synthetic Ally 1 using ${arya}.`,`Build a Raid Defense team around ${arya} excluding ${sansa} exclude Synthetic Ally 0.`,`Explain a Raid Defense team with ${arya} but without ${sansa} and Synthetic Ally 0.`]) {
    const r=parse(q);assert.equal(r.status,'ready',r.message);assert.ok(r.requiredVariantIds.includes('c0'));assert.ok(r.excludedVariantIds.includes('c1'));assert.ok(r.excludedVariantIds.includes('c5'));
  }
  const answer=ask(`Build a Raid Defense team without ${sansa} and Synthetic Ally 0.`);assert.equal(answer.status,'ready');for(const result of answer.options)respects(result,{required:[],excluded:['c1','c5']});
  for(const connector of ['but without','but not','and not','except','avoid','leave out','do not include',"don't include",'do not use',"don't use",'not including']) {
    for(const q of [`Build a team with ${arya} for Raid Defense ${connector} ${sansa}.`,`Build a Raid Defense team with ${arya}, ${connector} ${sansa}.`]) {const r=parse(q);assert.equal(r.status,'ready',r.message);assert.deepEqual(r.requiredVariantIds,['c0']);assert.deepEqual(r.excludedVariantIds,['c1']);}
  }
});

test('unknown, ambiguous, incomplete and unsupported constraints clarify rather than omit anything',()=>{
  for(const q of [`Build a Raid Defense team with ${arya} but without Sansa Stark.`,`Build a Raid Defense team with ${arya} but without Sansa Stark — Imagined Variant.`,`Build a Raid Defense team with ${arya} but without Unknown Person.`,`Build a Raid Defense team with ${arya} but without`,`Build a Raid Defense team with ${arya} without ${sansa} and Unknown Person.`])assert.notEqual(parse(q).status,'ready',q);
});

test('an exact exclusion does not remove the sibling variant or borrow it to fulfill a different required version',()=>{
  const f=fixture(),other=f.guideData.champions[2].name,answer=ask(`Build a Raid Defense team with ${arya} and ${other} but without ${sansa}.`,f);
  assert.equal(answer.status,'ready');for(const result of answer.options)respects(result,{required:['c0','c2'],excluded:['c1']});
  assert.equal(ask(`Build a Raid Defense team with ${sansa} but without ${sansa}.`).status,'no_feasible_team');
});

test('item disable is separate from champion exclusion, and enabled items preserve their exact owner',()=>{
  const answer=ask(`Build a Raid Defense team with ${arya} but without Synthetic Sword and ${sansa}.`);
  assert.equal(answer.status,'ready');assert.deepEqual(answer.request.excludedVariantIds,['c1']);assert.equal(answer.request.itemStates.c0,'disabled');for(const result of answer.options)respects(result);
  const enabled=ask(`Build a Raid Defense team around ${arya} with Synthetic Sword but without ${sansa}.`);assert.equal(enabled.status,'ready');assert.equal(enabled.request.itemStates.c0,'enabled');
  assert.equal(parse(`Explain a Raid Defense team around ${arya} with Synthetic Sword but without ${sansa}.`).itemStates.c0,'enabled');
  assert.notEqual(ask(`Build a Raid Defense team with Synthetic Sword but without ${arya}.`).status,'ready');
  assert.notEqual(ask(`Build a Raid Defense team around ${arya} with Synthetic Sword but without Synthetic Sword.`).status,'ready');
});

test('single exclusion follow-up preserves the other four but an explicit new build may recompute',()=>{
  const f=fixture(),first=ask(`Build a Raid Defense team with ${sansa}.`,f),before=JSON.stringify(first.context);
  const follow=ask(`Without ${sansa}.`,f,first.context);assert.equal(follow.status,'ready');assert.equal(follow.request.subjectVariantId,'c1');assert.equal(follow.replacementPlan.preservedVariantIds.length,4);assert.ok(follow.replacementPlan.preservedVariantIds.every(id=>follow.result.team.some(row=>row.champion.id===id)));respects(follow.result,{required:[],excluded:['c1']});assert.equal(JSON.stringify(first.context),before);
  for(const q of [`I do not have ${sansa}.`,`I don't have ${sansa}. Who should I use?`]) {const next=ask(q,f,first.context);assert.equal(next.status,'ready');assert.equal(next.request.subjectVariantId,'c1');assert.equal(next.replacementPlan.preservedVariantIds.length,4);respects(next.result,{required:[],excluded:['c1']});}
  const rebuild=ask(`Build a new Raid Defense team with ${arya} but without ${sansa}.`,f,first.context);assert.equal(rebuild.status,'ready');assert.equal(rebuild.replacementPlan,null);for(const result of rebuild.options)respects(result);
});

test('exclusions persist through alternatives and explanations; required locks remain enforced',()=>{
  const f=fixture(),first=ask(question,f);
  for(const q of ['Another option','Why this team?','How do I play this team?']) {
    const next=ask(q,f,first.context);assert.equal(next.status,'ready',q);respects(next.result);assert.ok(next.context.excludedVariantIds.includes('c1'));
  }
  assert.equal(ask(`Build a Raid Defense team with ${sansa}.`,f,first.context).status,'no_feasible_team');
});

test('stale cached results and alternatives with excluded members or suggestions are not reused',()=>{
  const f=fixture(),first=ask('Build a Raid Defense team.',f);
  const stale=structuredClone(first.context);stale.requiredVariantIds=[];stale.excludedVariantIds=['c1'];stale.options=stale.options.map(row=>({...row,overallScore:-999}));stale.lastResult={...stale.lastResult,overallScore:-999};
  for(const q of ['Another option','Why this team?']) {const answer=ask(q,f,stale);assert.equal(answer.status,'ready');assert.notEqual(answer.result.overallScore,-999);respects(answer.result,{required:[],excluded:['c1']});}
  const safe=ask(question,f),suggestions=structuredClone(safe.context);suggestions.lastResult.substitutes=[{champion:f.guideData.champions[1]}];suggestions.lastResult.overallScore=-999;const answer=ask('Why this team?',f,suggestions);assert.equal(answer.status,'ready');assert.notEqual(answer.result.overallScore,-999);respects(answer.result);
  const unsafeOption=structuredClone(safe.context);unsafeOption.options.push({...structuredClone(safe.result),substitutes:[{champion:f.guideData.champions[1]}]});
  const explained=ask('Why this team?',f,unsafeOption);assert.equal(explained.status,'ready');for(const result of explained.options)respects(result);
  const removed=safe.result.team.find(row=>row.champion.id!=='c0').champion.id,changed=structuredClone(f);changed.guideData.verifiedCollection.variantIds=changed.guideData.verifiedCollection.variantIds.filter(id=>id!==removed);
  for(const q of ['Why this team?','Another option']){const next=ask(q,changed,safe.context);assert.equal(next.status,'ready');for(const result of next.options)respects(result,{required:['c0'],excluded:['c1',removed]});}
});

test('curated lineups apply exclusions to substitute candidates and captured partner options too',()=>{
  const f=fixture(),variantIds=['c0','c3','c4','c5','c6'];
  f.strategyData.curatedRecommendations=[{id:'synthetic-curated',targetId:'raid:defense',active:true,reviewStatus:'reviewed',confidence:1,leaderVariantId:'c0',members:variantIds.map(variantId=>({variantId}))}];
  const baseline=buildTeamOptions({...f,targetId:'raid:defense'});assert.equal(baseline[0].recommendationSource,'curated');assert.ok(baseline[0].substitutes.some(row=>row.champion.id==='c1'));
  const answer=ask(question,f);assert.equal(answer.result.recommendationSource,'curated');for(const result of answer.options)respects(result);
  assert.throws(()=>evaluateExactTeam({...f,targetId:'raid:defense',variantIds,leaderVariantId:'c0',excludeVariantIds:['c0']}),/excluded variant/);
});

test('unresolved curated positions cannot be presented as verified to obey an explicit exclusion',()=>{
  const f=fixture();f.strategyData.curatedRecommendations=[{id:'partial',targetId:'raid:defense',active:true,reviewStatus:'partial',confidence:.8,leaderVariantId:'c0',members:[{variantId:'c0'},{variantId:null,displayName:'Unresolved Champion'},{variantId:'c3'},{variantId:'c4'},{variantId:'c5'}]}];
  assert.equal(buildTeamOptions({...f,targetId:'raid:defense'})[0].status,'partial_curated');
  const options=buildTeamOptions({...f,targetId:'raid:defense',excludeVariantIds:['c1']});assert.ok(options.length);assert.ok(options.every(row=>row.status!=='partial_curated'));for(const result of options)respects(result,{required:[],excluded:['c1']});
});

test('exclusions leaving fewer than five candidates never produce a partial or silently expanded team',()=>{
  const f=fixture();const exclude=f.guideData.champions.slice(4).map(row=>row.name).join(' and ');const answer=ask('Build a Raid Defense team without '+exclude,f);assert.notEqual(answer.status,'ready');
});
