import test from 'node:test';
import assert from 'node:assert/strict';
import {gameService,gameFixture} from './fixtures/game.mjs';
import {embeddedEffectReferences} from '../../embedded-effect-definitions.js';
import {privateGuideModel} from '../src/guide-model.js';
import {buildTeamOptions,answerStrategyQuestion} from '../../conversation-engine.js';
import {answerGuideQuestion} from '../../knowledge-engine.js';
import {readinessMarkup} from '../../data-readiness.js';
import {mountPrivateGuideIfEnabled} from '../../guide-access.js';
const load=store=>store.readCollection({includeGameData:true,includeStrategy:true});
async function prepared(){const service=gameService(),first=service.device().store;const evidence=await first.prepareEvidence(service.fixture.handoff);await first.saveEvidence(evidence.snapshot,0);return {...service,first};}
test('actual private read path restores full strategy evidence and owned candidate pool across page/device instances',async()=>{
  const {first,device,remote}=await prepared();
  assert.equal(privateGuideModel(await load(first)).ready,false,'saved evidence alone never asserts current ownership');
  await first.addCapturedVariants(1);
  const second=device().store;
  await second.setOwned('v5',false);
  const collection=await load(first),model=privateGuideModel(collection);
  assert.equal(model.ready,true);assert.equal(collection.evidenceRevision,1);
  assert.deepEqual(new Set(model.guide.verifiedCollection.variantIds),new Set(['v0','v1','v2','v3','v4']));
  assert.equal(model.guide.verifiedCollection.reviewedGroups.length,6,'unowned source evidence is retained');
  assert.equal(model.guide.verifiedCollection.effectDefinitionUpdates[0].text,'Synthetic exact tooltip wording.');
  assert.ok(model.strategy.championFacts.some(row=>row.variantId==='v0'&&row.factText.includes('10%')));
  assert.equal(model.strategy.championFacts.some(row=>row.variantId==='v0'&&row.factText.includes('999%')),false,'old max-rank facts cannot return during persistence restore');
  const options=buildTeamOptions({guideData:model.guide,strategyData:model.strategy,targetId:'raid:defense'});
  assert.ok(options.length);for(const option of options)assert.deepEqual(new Set(option.team.map(row=>row.champion.id)),new Set(['v0','v1','v2','v3','v4']));
  const answer=answerStrategyQuestion({question:'Build a Raid Defense team.',guideData:model.guide,strategyData:model.strategy,context:{}});
  assert.equal(answer.status,'ready');assert.ok(answer.result.team.every(row=>remote.owned.has(row.champion.id)));
  assert.deepEqual(privateGuideModel(await load(device().store)).guide,model.guide,'fresh navigation restores the same complete view');
  const html=readinessMarkup({status:'ready',guide:model.guide,lastSuccess:null});
  assert.match(html,/Private saved collection: 5 owned exact variants/);assert.match(html,/Saved definition evidence/);assert.doesNotMatch(html,/Local page only|not yet imported/);
});
test('captured batch is additive, checks revision, never drops another saved variant, and missing evidence blocks',async()=>{
  const {first,remote}=await prepared();
  await first.setOwned('v6',true);
  await assert.rejects(first.addCapturedVariants(2),error=>error.code==='evidence_conflict');
  assert.deepEqual([...remote.owned],['v6']);
  await first.addCapturedVariants(1);assert.equal(remote.owned.size,7);
  const model=privateGuideModel(await load(first));assert.equal(model.ready,false);assert.match(model.reason,/no reviewed evidence/);
  await first.setOwned('v6',false);assert.equal(privateGuideModel(await load(first)).ready,true);
  assert.equal(remote.evidence.revision,1,'membership edits do not replace evidence');
});
test('each authenticated read-model failure blocks the full private guide without public fallback',async()=>{
  const {first,remote}=await prepared();await first.addCapturedVariants(1);
  for(const name of ['got_guide_data','got_raid_synergy_data','got_strategy_data']){remote.rpcFailure=name;await assert.rejects(load(first),error=>error.code==='read_failed');}
  remote.rpcFailure=null;assert.equal(privateGuideModel(await load(first)).ready,true);
  remote.allowed=false;const before=remote.events.length;await assert.rejects(load(first),error=>error.code==='not_owner');
  assert.equal(remote.events.slice(before).some(row=>row[0]==='rpc'),false);
});
test('late in-flight game data cannot survive a local signout',async()=>{
  const {first,remote}=await prepared();await first.addCapturedVariants(1);
  let release;remote.holdRpc=new Promise(resolve=>{release=resolve;});
  const pending=load(first);await new Promise(resolve=>setImmediate(resolve));await first.signOut();release();
  await assert.rejects(pending,error=>error.code==='session_changed');
});
test('actual guide switch is off by default and failure in an enabled runtime never takes the public branch',async()=>{
  let clears=0,loads=0;
  const anchor={textContent:'',hidden:true},content={replaceChildren(){clears++;}};
  const options={anchor,content,requiresStrategy:true,onClear(){clears++;},onReady(){throw Error('should not be ready');}};
  assert.equal(await mountPrivateGuideIfEnabled(options,{config:{},loadRuntime:async()=>{loads++;}}),false);assert.equal(loads,0);assert.equal(clears,0);
  assert.equal(await mountPrivateGuideIfEnabled(options,{config:{enabled:true},loadRuntime:async()=>{loads++;throw Error('Chunk unavailable');}}),true);
  assert.equal(loads,1);assert.match(anchor.textContent,/No public fallback/);assert.ok(clears>=2);
});
test('anonymous public client explicitly refuses calls when private mode is enabled',async()=>{
  const old=globalThis.GOT_PRIVATE_CONFIG;globalThis.GOT_PRIVATE_CONFIG={enabled:true};
  try{const {getGuideData,getStrategyData}=await import('../../supabase-client.js');await assert.rejects(getGuideData(),/Anonymous guide loading is disabled/);await assert.rejects(getStrategyData(),/Anonymous guide loading is disabled/);}
  finally{globalThis.GOT_PRIVATE_CONFIG=old;}
});

test('personal provider lookup uses saved ownership, while general reference is explicitly labeled',async()=>{
  const {first}=await prepared();await first.addCapturedVariants(1);await first.setOwned('v5',false);
  const model=privateGuideModel(await load(first)),before=JSON.stringify(model.guide.verifiedCollection);
  for(const question of ['Which of my champions heal?','Which of mine heal?','Who do I have that heals?']) {
    const answer=answerGuideQuestion({question,guideData:model.guide,strategyData:model.strategy});
    assert.equal(answer.status,'ready');assert.deepEqual(answer.entries.map(row=>row.champion.id),['v0','v1','v2','v3','v4']);
    assert.match(answer.summary,/your saved owned collection/);
  }
  const general=answerGuideQuestion({question:'Which champions heal in the catalog?',guideData:model.guide,strategyData:model.strategy});
  assert.ok(general.entries.some(row=>row.champion.id==='v5'));
  assert.match(general.facts.find(row=>row.title==='Collection scope').wording,/general reference lookup, not a list of your owned/);
  assert.equal(JSON.stringify(model.guide.verifiedCollection),before,'personal query does not alter saved full evidence');
});

test('private reference views and answers never substitute old unmapped skills, traits, items or effect archives',async()=>{
  const fixture=gameFixture();
  fixture.guide.traits.push({id:'old-trait',variantId:'v6',name:'Retired Trait',text:'OLD TRAIT WORDING',reviewStatus:'complete'});
  fixture.guide.items.push({id:'old-item',ownerVariantId:'v6',name:'Retired Iconic',abilities:[{id:'old-iconic',name:'Retired Power',text:'OLD ICONIC WORDING',reviewStatus:'complete'}]});
  fixture.guide.historicalEffectReferences=[{id:'old-mark',name:'Retired Mark',text:"Sandor marks a target with THE HOUND'S PROTECTION, granting a SHIELD for 999% Max HP.",reviewStatus:'complete'}];
  fixture.strategy.rules.push({...fixture.strategy.rules[0],id:'old-subject-rule',subjectVariantId:'v0',rationale:'OLD SKILL-SPECIFIC RULE'});
  const service=gameService(fixture),store=service.device().store;
  const preparedEvidence=await store.prepareEvidence(fixture.handoff);await store.saveEvidence(preparedEvidence.snapshot,0);await store.addCapturedVariants(1);
  const collection=await load(store);
  collection.strategyData.curatedRecommendations=[{id:'old-lineup',members:[{variantId:'v0'}],notes:'OLD ABILITY-BASED ADVICE'}];
  const before=JSON.stringify(collection),model=privateGuideModel(collection);
  assert.equal(model.ready,true);assert.equal(model.guide.privateCollection.latestEvidenceOnly,true);
  assert.equal(model.guide.champions.some(row=>row.id==='v6'),true,'catalog identity remains available without catalog ability claims');
  assert.equal(model.guide.abilities.some(row=>row.variantId==='v6'),false);
  assert.equal(model.guide.traits.some(row=>row.id==='old-trait'),false);
  assert.equal(model.guide.items.length,0);
  assert.equal(model.strategy.championFacts.some(row=>row.factText.includes('999%')),false);
  assert.equal(model.strategy.rules.some(row=>row.id==='old-subject-rule'),false);
  assert.deepEqual(model.strategy.curatedRecommendations,[]);
  assert.deepEqual(embeddedEffectReferences(model.guide),[],'static embedded-reference export cannot reintroduce retired wording');
  for(const question of ['Which champions heal in the catalog?','Fixture Champion 6 skill','Fixture Champion 6 traits','Fixture Champion 6 iconic items',"What is THE HOUND'S PROTECTION?"]){
    const answer=JSON.stringify(answerGuideQuestion({question,guideData:model.guide,strategyData:model.strategy}));
    assert.doesNotMatch(answer,/999%|OLD TRAIT|OLD ICONIC|Retired Mark|grants them a SHIELD/);
  }
  assert.equal(JSON.stringify(collection),before,'saved envelope and original source history stay unchanged');
  const html=readinessMarkup({status:'ready',guide:model.guide,lastSuccess:null});
  assert.match(html,/latest saved evidence/);assert.match(html,/review incomplete/);assert.match(html,/older catalog records are not substituted/);
});
