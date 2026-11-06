// Local planning engines against existing public read-only data. No key persisted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { answerStrategyQuestion, buildTeamOptions } from '../conversation-engine.js';
import { evaluatePrebattlePlan } from '../prebattle-plan-engine.js';
import { routeGuideQuestion } from '../knowledge-engine.js';

const snapshotIndex=process.argv.indexOf('--snapshot');
let guideData,strategyData,validationMode;
if(snapshotIndex>=0) {
  const snapshot=JSON.parse(fs.readFileSync(process.argv[snapshotIndex+1],'utf8'));
  ({guideData,strategyData}=snapshot);
  validationMode='local engines against an earlier captured public RPC snapshot; not a fresh network check';
} else {
  const response=await fetch('https://www.gotlegendsguide.com/supabase-config.js');
  assert.ok(response.ok,'Public runtime configuration unavailable');
  const match=(await response.text()).match(/GOT_SUPABASE_CONFIG\s*=\s*(\{.*?\})\s*;/s);
  assert.ok(match,'Public runtime configuration JSON unavailable');
  globalThis.GOT_SUPABASE_CONFIG=JSON.parse(match[1]);
  const {getGuideData,getStrategyData}=await import('../supabase-client.js');
  [guideData,strategyData]=await Promise.all([getGuideData(),getStrategyData()]);
  validationMode='local engines against current public read-only RPC responses';
}
const args={guideData,strategyData,targetId:'legendary-assault:drogon'};
const question='Build a team for Drogon. Explain the opening and how the five champions work together.';
assert.equal(routeGuideQuestion(question,{guideData,strategyData}).intent,'battle_recommendation');
const started=performance.now();
const options=buildTeamOptions(args);
const durationMs=Math.round(performance.now()-started);
assert.ok(options.length>=3);
assert.ok(options.every(row=>row.prebattlePlan&&row.prebattlePlan.score===row.prebattlePlan.contributions.reduce((sum,part)=>sum+part.score,0)));
const reference=options.find(row=>row.referenceRecommendation);
assert.ok(reference,'Recorded exact lineup must remain available for comparison');
assert.equal(reference.leader.champion.id,'sqlite-champion-19');
assert.deepEqual(new Set(reference.team.map(row=>row.champion.id)),new Set(['sqlite-champion-19','sqlite-champion-5','sqlite-champion-6','sqlite-champion-58','sqlite-champion-9']));
assert.ok(reference.prebattlePlan.capabilities.some(row=>row.kind==='skill_damage'&&row.damageType==='fire'&&row.status==='feasible'));
const answer=answerStrategyQuestion({question,guideData,strategyData});
assert.equal(answer.status,'ready');
assert.ok(answer.result.prebattlePlan);
const noProvider=evaluatePrebattlePlan({...args,variantIds:['sqlite-champion-19','sqlite-champion-5','sqlite-champion-6','sqlite-champion-17','sqlite-champion-9'],leaderVariantId:'sqlite-champion-19'});
assert.ok(noProvider.score<reference.overallScore,'Removing controllable BIRTHRIGHT supply must remove its payoff, not just its name');
console.log(JSON.stringify({
  validationMode,
  catalog:{champions:guideData.champions.length,items:guideData.items.length,championFacts:strategyData.championFacts.length},
  sourceRules:'Reviewed historical encounter, no fresh game verification',durationMs,
  comparison:options[0].comparison,
  samples:[options[0],options[1],reference].map(row=>({
    label:row.strategyLabel,score:row.overallScore,leader:{id:row.leader.champion.id,name:row.leader.champion.name},
    team:row.team.map(member=>({id:member.champion.id,name:member.champion.name})),
    contributions:row.prebattlePlan.contributions.map(part=>({id:part.id,score:part.score,sourceRefs:part.sourceRefs})),
    dependencies:row.prebattlePlan.dependencies,steps:row.prebattlePlan.steps,
    tradeoffs:row.prebattlePlan.risks,unknowns:row.prebattlePlan.unknowns,
    factionEvidence:row.prebattlePlan.factions,allyEvidence:row.prebattlePlan.allyPairs,
  })),
  counterfactual:{referenceScore:reference.overallScore,withoutTeamBirthrightProviderScore:noProvider.score},
  limits:'No private inventory, power cutoff, levels, active-buff assumptions, win probability, production writes, or global-optimality claim.',
},null,2));
