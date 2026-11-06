// Read-only smoke: local engines, live public catalog, no persisted config/key.
import assert from 'node:assert/strict';
import { answerStrategyQuestion } from '../conversation-engine.js';
import { routeGuideQuestion } from '../knowledge-engine.js';

const response=await fetch('https://www.gotlegendsguide.com/supabase-config.js');
assert.ok(response.ok,'Public runtime config must be readable');
const match=(await response.text()).match(/GOT_SUPABASE_CONFIG\s*=\s*(\{.*?\})\s*;/s);
assert.ok(match,'Expected runtime config JSON');
globalThis.GOT_SUPABASE_CONFIG=JSON.parse(match[1]);
const {getGuideData,getStrategyData}=await import('../supabase-client.js');
const [guideData,strategyData]=await Promise.all([getGuideData(),getStrategyData()]);
const question='Build a Raid defense team around Gregor Clegane with Enshrouding Helm. Explain how his iconic item works with the other four champions.';
const answer=answerStrategyQuestion({question,guideData,strategyData});
assert.equal(routeGuideQuestion(question,{guideData,strategyData}).intent,'battle_recommendation');
const helm=answer.result.conditionalEffects.effects.find(row=>row.id==='gregor-helm-critical');
assert.equal(helm.status,'conditional_opportunity');
assert.equal(helm.quantityApplicability,'source_rank_only');
assert.equal(answer.result.conditionalEffects.scoringContribution,0);
assert.ok(answer.options.every(row=>row.team.some(member=>member.champion.id==='sqlite-champion-4')));
console.log(JSON.stringify({check:'original prompt with unknown rank/currentness/timing',catalog:{champions:guideData.champions.length,items:guideData.items.length,facts:strategyData.championFacts.length},status:answer.status,options:answer.options.length,allKeepGregor:true,helmStatus:helm.status,quantityApplicability:helm.quantityApplicability,scoreAdded:0,coverage:answer.result.conditionalEffects.coverage}));
const paired=answerStrategyQuestion({
  question:'Build a Raid defense team around Gregor Clegane and Olenna Tyrell with Enshrouding Helm.',
  guideData,strategyData,itemRanks:{'sqlite-champion-4':{rank:'V',level:20}},
  effectContext:{enemyStatuses:['renew'],currentnessAssumptionSourceIds:[10,83],turn:1,buffAppliedTurns:{'olenna-critical':1}},
});
const dependency=paired.result.conditionalEffects.links.find(link=>link.providerEffectId==='olenna-critical'&&link.consumerEffectId==='gregor-helm-critical');
assert.ok(dependency);
assert.equal(paired.result.conditionalEffects.effects.find(row=>row.id==='gregor-helm-critical').status,'supported_setup');
assert.equal(paired.result.conditionalEffects.effects.find(row=>row.id==='gregor-helm-critical').source.currentness,'not_reverified');
console.log(JSON.stringify({check:'explicit hypothetical rank/currentness/timing/RENEW scenario, not actual user equipment or battle state',status:paired.status,dependency,scoreAdded:paired.result.conditionalEffects.scoringContribution,rankingContributions:paired.result.conditionalEffects.rankingContributions}));
const disabled=answerStrategyQuestion({question:'Disable Enshrouding Helm',guideData,strategyData,context:paired.context});
assert.equal(disabled.result.conditionalEffects.effects.find(row=>row.id==='gregor-helm-critical').status,'blocked');
assert.equal(disabled.result.conditionalEffects.scoringContribution,0);
console.log(JSON.stringify({check:'disabled follow-up',status:disabled.status,helmStatus:'blocked',scoreAdded:0}));
console.log('PASS: local patched engines with live public read-only catalog; no production writes, no browser visual QA, no new source-currentness verification.');
