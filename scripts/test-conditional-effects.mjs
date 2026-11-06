import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateConditionalEffects } from '../conditional-effects.js';
import { reviewedEffects } from '../conditional-catalog.js';

const gregor='sqlite-champion-4',olenna='sqlite-champion-17',tyrion='sqlite-champion-12',halfman='sqlite-champion-74',gendry='sqlite-champion-57';
const base={variantIds:[gregor,olenna],itemStates:{[gregor]:'enabled'},itemRanks:{[gregor]:{rank:'V',level:20}},enemyStatuses:['renew'],effects:reviewedEffects};
const evaluate=overrides=>evaluateConditionalEffects({...base,...overrides});
const row=(result,id)=>{const found=result.effects.find(effect=>effect.id===id);assert.ok(found,`missing evaluated effect ${id}`);return found;};
const hasLink=(result,provider,consumer)=>result.links.some(link=>link.providerEffectId===provider&&link.consumerEffectId===consumer);
const source={table:'synthetic_test',recordId:1,sourceId:1,exactText:'Synthetic dependency fixture, not a game fact.',reviewStatus:'complete',currentness:'not_reverified'};
const effect=(id,variantId,outcomes,extra={})=>({id,variantId,name:id,source,trigger:{kind:'skill'},requirements:[],outcomes,...extra});

test('reviewed item dependencies distinguish disabled, unknown, and source rank applicability',()=>{
  const enabled=evaluate();
  assert.equal(row(enabled,'gregor-helm-critical').status,'supported_setup');
  assert.ok(hasLink(enabled,'olenna-critical','gregor-helm-critical'));
  assert.equal(row(enabled,'gregor-helm-critical').quantityApplicability,'confirmed_rank');
  const disabled=evaluate({itemStates:{[gregor]:'disabled'}});
  assert.equal(row(disabled,'gregor-helm-critical').status,'blocked');
  const unknown=evaluate({itemStates:{}});
  assert.notEqual(row(unknown,'gregor-helm-critical').status,'supported_setup');
  const rankUnknown=evaluate({itemRanks:{}});
  assert.notEqual(row(rankUnknown,'gregor-helm-critical').status,'supported_setup');
  assert.equal(row(rankUnknown,'gregor-helm-critical').quantityApplicability,'source_rank_only');
  const differentRank=evaluate({itemRanks:{[gregor]:{rank:'IV',level:15}}});
  assert.notEqual(row(differentRank,'gregor-helm-critical').quantityApplicability,'confirmed_rank');
});

test('critical setup respects team, self-only, and explicitly targeted ally effects',()=>{
  const helm=reviewedEffects.find(effect=>effect.id==='gregor-helm-critical');
  const buff=target=>effect('crit-provider',olenna,[{kind:'critical_chance',target,amount:45,unit:'percentage_points',durationTurns:3}]);
  const team=evaluate({effects:[helm,buff('team')]});
  assert.ok(hasLink(team,'crit-provider','gregor-helm-critical'));
  const self=evaluate({effects:[helm,buff('self')]});
  assert.equal(hasLink(self,'crit-provider','gregor-helm-critical'),false);
  assert.notEqual(row(self,'gregor-helm-critical').status,'supported_setup');
  const targeted=evaluate({effects:[helm,buff('target_ally')],targetAssignments:{'crit-provider':gregor}});
  assert.ok(hasLink(targeted,'crit-provider','gregor-helm-critical'));
  assert.equal(row(targeted,'gregor-helm-critical').status,'supported_setup');
  const unassigned=evaluate({effects:[helm,buff('target_ally')]});
  assert.notEqual(row(unassigned,'gregor-helm-critical').status,'supported_setup');
  const other=evaluate({effects:[helm,buff('target_ally')],targetAssignments:{'crit-provider':olenna}});
  assert.equal(hasLink(other,'crit-provider','gregor-helm-critical'),false);
});

test('reviewed Gendry target buff supports Gregor only when that target is selected',()=>{
  const result=evaluate({variantIds:[gregor,gendry],targetAssignments:{'gendry-critical':gregor}});
  assert.ok(hasLink(result,'gendry-critical','gregor-helm-critical'));
  assert.equal(row(result,'gregor-helm-critical').status,'supported_setup');
  const notTargeted=evaluate({variantIds:[gregor,gendry]});
  assert.notEqual(row(notTargeted,'gregor-helm-critical').status,'supported_setup');
});

test('Treasury threshold is exact and future Coin Gems are not banked coins',()=>{
  assert.equal(row(evaluate({treasuryCoins:5}),'gregor-revive').status,'blocked');
  assert.notEqual(row(evaluate({treasuryCoins:6}),'gregor-revive').status,'blocked');
  const onlyHelm=evaluate({variantIds:[gregor],treasuryCoins:null,leaderVariantId:null});
  assert.equal(hasLink(onlyHelm,'gregor-helm-critical','gregor-revive'),false);
  assert.notEqual(row(onlyHelm,'gregor-revive').status,'supported_setup');
  assert.equal(reviewedEffects.find(effect=>effect.id==='gregor-helm-critical').outcomes.some(outcome=>outcome.kind==='resource'&&outcome.resource==='treasury_coins'),false);
});

test('only the selected exact Leader supplies opening Treasury; future triggers are not opening resources',()=>{
  const original=evaluate({variantIds:[gregor,tyrion,halfman],leaderVariantId:tyrion,treasuryCoins:null});
  assert.equal(row(original,'gregor-opening').status,'blocked');
  assert.ok(hasLink(original,'tyrion-opening','gregor-revive'));
  assert.equal(row(original,'gregor-revive').status,'supported_setup');
  const gregorLeader=evaluate({variantIds:[gregor,tyrion,halfman],leaderVariantId:gregor,treasuryCoins:null});
  assert.equal(row(gregorLeader,'tyrion-opening').status,'blocked');
  assert.notEqual(row(gregorLeader,'gregor-revive').status,'supported_setup');
  assert.equal(hasLink(gregorLeader,'halfman-guard','gregor-revive'),false);
  assert.equal(hasLink(gregorLeader,'tyrion-reapply','gregor-revive'),false);
  const exactVariant=evaluate({variantIds:[gregor,halfman],leaderVariantId:halfman,treasuryCoins:null});
  assert.equal(exactVariant.effects.some(effect=>effect.id==='tyrion-opening'),false);
  assert.notEqual(row(exactVariant,'gregor-revive').status,'supported_setup');
});

test('enemy RENEW relevance does not treat an unrelated enemy buff as RENEW',()=>{
  const withRenew=evaluate({enemyStatuses:['renew']});
  const unrelated=evaluate({enemyStatuses:['shield']});
  assert.equal(row(withRenew,'gregor-helm-renew').status,'supported_setup');
  assert.notEqual(row(unrelated,'gregor-helm-renew').status,'supported_setup');
  assert.ok(row(unrelated,'gregor-helm-renew').reasons.some(reason=>/renew/i.test(reason)));
});

test('all reviewed outputs remain zero-score opportunities with provenance and honest source coverage',()=>{
  const result=evaluate({variantIds:[gregor,olenna,'not-modeled-variant']});
  for(const effect of result.effects) {
    assert.equal(effect.scoringContribution,0);
    assert.ok(effect.reasons.length);
  }
  assert.ok(result.coverage);
  for(const effect of reviewedEffects) {
    assert.ok(effect.source.exactText);
    assert.ok(effect.source.sourceId);
    assert.ok(effect.source.reviewStatus);
    assert.notEqual(effect.source.currentness,'official_current');
  }
});

test('temporary setup cannot be credited outside its known active turn window',()=>{
  const helm=reviewedEffects.find(effect=>effect.id==='gregor-helm-critical');
  const provider=effect('temporary-crit',olenna,[{kind:'critical_chance',target:'team',amount:45,unit:'percentage_points',durationTurns:3}]);
  const active=evaluate({effects:[helm,provider],turn:2,buffAppliedTurns:{'temporary-crit':1}});
  assert.ok(hasLink(active,'temporary-crit','gregor-helm-critical'));
  const expired=evaluate({effects:[helm,provider],turn:5,buffAppliedTurns:{'temporary-crit':1}});
  assert.equal(hasLink(expired,'temporary-crit','gregor-helm-critical'),false);
  assert.notEqual(row(expired,'gregor-helm-critical').status,'supported_setup');
});

test('the same status dependency evaluator links verified Rickard BLEED to Rhaegal payoff',()=>{
  const selected=evaluate({variantIds:['sqlite-champion-38'],targetId:'legendary-assault:rhaegal',enemyStatuses:[]});
  assert.ok(hasLink(selected,'rickard-bleed','rhaegal-bleed-payoff'));
  assert.equal(row(selected,'rhaegal-bleed-payoff').status,'supported_setup');
  const missing=evaluate({variantIds:[gregor],targetId:'legendary-assault:rhaegal',enemyStatuses:[]});
  assert.equal(hasLink(missing,'rickard-bleed','rhaegal-bleed-payoff'),false);
  assert.notEqual(row(missing,'rhaegal-bleed-payoff').status,'supported_setup');
  const otherDragon=evaluate({variantIds:['sqlite-champion-38'],targetId:'legendary-assault:drogon'});
  assert.equal(otherDragon.effects.some(effect=>effect.id==='rhaegal-bleed-payoff'),false);
});

test('Raid immunity counter is personal and requires the enabled item',()=>{
  const result=evaluate({targetId:'raid:defense',enemyMechanics:['apply_poison']});
  const immunity=row(result,'gregor-helm-immunity');
  assert.ok(immunity.reasons.some(reason=>/poison/i.test(reason)));
  assert.ok(immunity.reasons.some(reason=>/personal|owner|self|Gregor/i.test(reason)));
  const sourceEffect=reviewedEffects.find(effect=>effect.id==='gregor-helm-immunity');
  assert.ok(sourceEffect.outcomes.every(outcome=>outcome.target==='self'));
  const disabled=evaluate({targetId:'raid:defense',enemyMechanics:['apply_poison'],itemStates:{[gregor]:'disabled'}});
  assert.equal(row(disabled,'gregor-helm-immunity').status,'blocked');
});

test('War opening duration expires and does not impersonate a champion-applied WOUND trigger',()=>{
  const opening=evaluate({variantIds:[gregor],targetId:'war:harpys-pit',warPhase:3,winningAlliance:true,turn:1,leaderVariantId:gregor});
  assert.notEqual(row(opening,'harpys-opening').status,'blocked');
  assert.equal(hasLink(opening,'harpys-opening','gregor-wound-coins'),false);
  const expired=evaluate({variantIds:[gregor],targetId:'war:harpys-pit',warPhase:3,winningAlliance:true,turn:4});
  assert.equal(row(expired,'harpys-opening').status,'blocked');
  const wrongPhase=evaluate({variantIds:[gregor],targetId:'war:harpys-pit',warPhase:1,winningAlliance:true,turn:1});
  assert.equal(row(wrongPhase,'harpys-opening').status,'blocked');
});

test('an unavailable provider cannot unlock a downstream setup and unsupported prerequisites remain explicit',()=>{
  const helm=reviewedEffects.find(effect=>effect.id==='gregor-helm-critical');
  const gated=effect('gated-critical',olenna,[{kind:'critical_chance',target:'team',amount:45,unit:'percentage_points',durationTurns:3}],{requirements:[{kind:'leader'}]});
  const result=evaluate({effects:[helm,gated],leaderVariantId:gregor});
  assert.equal(row(result,'gated-critical').status,'blocked');
  assert.equal(hasLink(result,'gated-critical','gregor-helm-critical'),false);
  assert.notEqual(row(result,'gregor-helm-critical').status,'supported_setup');
  const notModeled=effect('unmodeled-precondition',gregor,[{kind:'revive',target:'self',amount:80,unit:'percent_hp'}],{requirements:[{kind:'unsupported_future_requirement'}]});
  const unknown=evaluate({effects:[notModeled]});
  assert.notEqual(row(unknown,'unmodeled-precondition').status,'supported_setup');
  assert.ok(row(unknown,'unmodeled-precondition').reasons.some(reason=>/unsupported|unmodeled|unknown|not modeled/i.test(reason)));
});

test('critical setup does not resolve an unknown enemy RENEW prerequisite',()=>{
  const result=evaluate({enemyStatuses:null});
  assert.equal(row(result,'gregor-helm-renew').status,'conditional_opportunity');
  assert.ok(row(result,'gregor-helm-renew').reasons.some(reason=>/renew/i.test(reason)));
});

test('blocked provider eligibility is independent of effect order',()=>{
  const helm=reviewedEffects.find(effect=>effect.id==='gregor-helm-critical');
  const gated=effect('status-gated-critical',olenna,[{kind:'critical_chance',target:'team',amount:45,unit:'percentage_points',durationTurns:3}],{requirements:[{kind:'enemy_status',status:'renew'}]});
  for(const effects of [[gated,helm],[helm,gated]]) {
    const result=evaluate({effects,enemyStatuses:[]});
    assert.equal(row(result,'status-gated-critical').status,'blocked');
    assert.equal(hasLink(result,'status-gated-critical','gregor-helm-critical'),false);
    assert.notEqual(row(result,'gregor-helm-critical').status,'supported_setup');
  }
});

test('conditional ranking requires explicit current sources, matching item rank, and active buff timing',()=>{
  const confirmed={currentnessAssumptionSourceIds:[10,83],turn:1,buffAppliedTurns:{'olenna-critical':1}};
  const supported=evaluate(confirmed);
  assert.equal(supported.scoringContribution,2);
  assert.equal(supported.rankingContributions.length,1);
  assert.equal(supported.rankingContributions[0].score,2);
  assert.deepEqual([...supported.rankingContributions[0].sourceIds].sort((a,b)=>a-b),[10,83]);
  for(const overrides of [
    {currentnessAssumptionSourceIds:[]},
    {currentnessAssumptionSourceIds:[10]},
    {currentnessAssumptionSourceIds:[83]},
    {turn:null},
    {buffAppliedTurns:{}},
    {buffAppliedTurns:{'olenna-critical':2}},
    {turn:4},
    {itemStates:{[gregor]:'disabled'}},
    {itemRanks:{}},
  ]) {
    const result=evaluate({...confirmed,...overrides});
    assert.equal(result.scoringContribution,0,JSON.stringify(overrides));
    assert.equal(result.rankingContributions.length,0);
  }
  // The catalog's historical transcription completeness never self-certifies
  // source freshness; callers must supply a separately reviewed confirmation.
  assert.equal(evaluate({turn:1,buffAppliedTurns:{'olenna-critical':1}}).scoringContribution,0);
});

test('bounded ranking does not double-count split outputs or overlapping flat mechanic credit',()=>{
  const confirmed={currentnessAssumptionSourceIds:[10,83],turn:1,buffAppliedTurns:{'olenna-critical':1}};
  const result=evaluate(confirmed);
  assert.equal(row(result,'gregor-helm-critical').status,'supported_setup');
  assert.equal(row(result,'gregor-helm-renew').status,'supported_setup');
  assert.equal(result.scoringContribution,2,'two Helm output rows must not yield four points');
  for(const mechanic of ['critical','treasury','coin_gems','spawn_coin_gems']) {
    const duplicate=evaluate({...confirmed,flatMechanicIds:[mechanic]});
    assert.equal(duplicate.scoringContribution,0,mechanic);
  }
  const helm=reviewedEffects.find(effect=>effect.id==='gregor-helm-critical');
  const selfBuff={...reviewedEffects.find(effect=>effect.id==='olenna-critical'),outcomes:[{kind:'critical_chance',target:'self',amount:45,unit:'percentage_points',durationTurns:3}]};
  const unrelated=evaluate({...confirmed,effects:[helm,selfBuff]});
  assert.equal(unrelated.scoringContribution,0);
});

test('conditional ranking remains capped across multiple independently eligible consumers',()=>{
  const template=reviewedEffects.find(effect=>effect.id==='gregor-helm-critical');
  const consumers=Array.from({length:4},(_,index)=>({...template,id:`synthetic-consumer-${index}`,variantId:`synthetic-owner-${index}`}));
  const provider=reviewedEffects.find(effect=>effect.id==='olenna-critical');
  const variantIds=[olenna,...consumers.map(effect=>effect.variantId)];
  const itemStates=Object.fromEntries(consumers.map(effect=>[effect.variantId,'enabled']));
  const itemRanks=Object.fromEntries(consumers.map(effect=>[effect.variantId,{rank:'V',level:20}]));
  const result=evaluate({effects:[provider,...consumers],variantIds,itemStates,itemRanks,currentnessAssumptionSourceIds:[10,83],turn:1,buffAppliedTurns:{'olenna-critical':1}});
  assert.equal(result.scoringContribution,6);
  assert.equal(result.rankingContributions.length,3);
});
