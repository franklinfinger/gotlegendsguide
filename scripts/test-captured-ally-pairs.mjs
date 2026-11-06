import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareCapturedAllyPairs,evaluateCapturedAllyPairs,capturedAllyPairsMarkup} from '../captured-ally-pairs.js';
import {integrateVerifiedHandoff} from '../verified-handoff.js';
import {evaluateExactTeam,recommendTeam} from '../strategy-engine.js';

const effect='When activated, this Gem grants the team Leader +10% Stamina and HEALS them for 5% Max HP.';
const popup=(ally='Example 1 — Exact One',text=effect)=>`**${ally}**, Owned. **Synthetic Pair** replaces Area Clear Power-Ups. **Synthetic Gem:** “${text}” [Source](/private/IMG_100.PNG).`;
function fixture(){
  const champions=Array.from({length:7},(_,index)=>({id:'c'+index,name:`Example ${index} — Exact One`,releaseState:'live',reviewStatus:'complete',factions:[],roles:[]}));
  const champion_capture_groups=champions.map((row,index)=>({capture_group_id:'G'+index,champion:'Example '+index,exact_variant:'Exact One',profile_anchor:'IMG_100.PNG',group_source_filenames:['IMG_100.PNG'],fields_as_recorded:{profile:'Level 1.',current_skill:'**Strike** — level 1. “Strikes an enemy for 20% ATK Physical Damage.” IMG_100.PNG'}}));
  champion_capture_groups[0].fields_as_recorded.linked_ally_popup=popup();
  champion_capture_groups[1].fields_as_recorded.ally=`Example 0 — Exact One, owned. “Synthetic Pair” replaces Area Clear Power-Ups. “Synthetic Gem”: “${effect}” IMG_101.PNG`;
  const handoff={capture_date:'2000-01-01',review_completed_date:'2000-01-02',champion_capture_groups,all_reviewed_source_filenames:['IMG_100.PNG','IMG_101.PNG']};
  const guideData={champions,abilities:[],traits:[],items:[],teams:[],factions:[],factionActivations:[],allyGems:[{id:'historical',ownerName:champions[0].name,allyName:champions[1].name,reviewState:'visually_verified',sourceId:1,effect:'Old historical effect.'}]};
  const strategyData={mechanics:[{id:'physical_damage',name:'Physical Damage',category:'damage'}],targets:[{id:'raid:test',name:'Synthetic Raid',battleMode:'raid',evidenceState:'verified',approach:'Test',timing:'Test',warning:'Test'},{id:'war:test',name:'Synthetic War',battleMode:'war',evidenceState:'verified',approach:'Test',timing:'Test',warning:'Test'}],championFacts:[],rules:[{id:'r',kind:'target_fit',targetId:null,mechanicId:'physical_damage',score:1,rationale:'Synthetic',evidenceCategory:'strategy_inference',provenanceRef:'synthetic',confidence:1}],curatedRecommendations:[]};
  return {handoff,guideData,strategyData,mappings:champions.map((row,index)=>({groupId:'G'+index,variantId:row.id,name:row.name}))};
}
const prepared=f=>prepareCapturedAllyPairs({handoff:f.handoff,mappings:f.mappings});
const integrated=f=>integrateVerifiedHandoff(f);
const evaluate=(f,variantIds=['c0','c1','c2','c3','c4'],battleMode='raid')=>evaluateCapturedAllyPairs({guideData:integrated(f).guideData,battleMode,variantIds});

test('reciprocal source forms become one exact pair, retaining both directional sources and verbatim effect',()=>{
  const f=fixture(),before=JSON.stringify(f),r=prepared(f);
  assert.deepEqual(r.audit,{popupRecords:2,completePairs:1,uncapturedPartners:0,blockedPairs:0,reciprocalPairs:1});assert.deepEqual(r.issues,[]);
  const pair=r.pairs[0];assert.equal(pair.effect,effect);assert.equal(pair.gemName,'Synthetic Gem');assert.equal(pair.replaces,'Area Clear Power-Ups');assert.deepEqual(pair.variantIds,['c0','c1']);assert.equal(pair.sources.length,2);assert.equal(pair.sourceRefs.length,2);
  assert.equal(pair.sources[0].captureDate,'2000-01-01');assert.equal(pair.sources[1].reviewCompletedDate,'2000-01-02');assert.doesNotMatch(JSON.stringify(pair),/\/private\//);assert.equal(JSON.stringify(f),before);
});

test('plain identities, bold labels, title commas and reciprocal capitalization are supported',()=>{
  const f=fixture();f.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup=popup().replaceAll('**','').replace('Synthetic Gem:','A Gem, With A Comma:');
  f.handoff.champion_capture_groups[1].fields_as_recorded.ally=`Example 0 — EXACT ONE, owned. **synthetic pair** replaces Area Clear Power-Ups. **A Gem, With A Comma:** “${effect}” IMG_101.PNG`;
  assert.equal(prepared(f).pairs[0].status,'captured_pair');assert.equal(prepared(f).pairs[0].gemName,'A Gem, With A Comma');
});

test('single complete popup is conditional evidence but never invents reciprocal confirmation',()=>{
  const f=fixture();delete f.handoff.champion_capture_groups[1].fields_as_recorded.ally;
  assert.equal(prepared(f).pairs[0].status,'captured_pair');assert.equal(prepared(f).audit.reciprocalPairs,0);assert.equal(evaluate(f).present.length,1);
});

test('popup-only partner and same-character wrong variant never become roster entries',()=>{
  const f=fixture();f.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup=popup('Example 1 — Other Variant');delete f.handoff.champion_capture_groups[1].fields_as_recorded.ally;
  const r=integrated(f),model=evaluateCapturedAllyPairs({guideData:r.guideData,battleMode:'raid',variantIds:['c0','c1','c2','c3','c4']});
  assert.equal(r.guideData.champions.length,7);assert.equal(r.guideData.verifiedCollection.variantIds.length,7);assert.equal(model.present.length,0);assert.equal(model.options.length,0);assert.equal(model.blocked[0].status,'partner_not_captured');assert.equal(model.blocked[0].allyVariantId,undefined);
});

test('one selected member exposes a captured partner option without changing the lineup',()=>{
  const f=fixture(),ids=['c0','c2','c3','c4','c5'],before=JSON.stringify(ids),model=evaluate(f,ids);
  assert.equal(model.present.length,0);assert.equal(model.options.length,1);assert.equal(model.options[0].missingVariantId,'c1');assert.equal(model.score,0);assert.equal(JSON.stringify(ids),before);assert.match(model.limitations.join(' '),/lose a faction threshold/);
  assert.equal(evaluate(f,['c2','c3','c4','c5','c6']).options.length,0);
});

test('duplicate, absent and non-live selected variants fail closed; unsupported modes remain untouched',()=>{
  assert.equal(evaluate(fixture(),['c0','c0']).status,'invalid_selection');assert.equal(evaluate(fixture(),['outside']).status,'invalid_selection');assert.equal(evaluate(fixture(),['c0','c1','c2','c3','c4','c5']).status,'invalid_selection');
  assert.equal(evaluate(fixture(),undefined,'war').present.length,1);for(const mode of ['legendary-assault','unknown',null])assert.equal(evaluate(fixture(),undefined,mode).status,'not_applicable');
  assert.equal(evaluateCapturedAllyPairs({guideData:fixture().guideData,battleMode:'raid',variantIds:['c0']}).status,'not_applicable');
  const r=integrated(fixture());r.guideData.champions[0].releaseState='unverified';assert.equal(evaluateCapturedAllyPairs({guideData:r.guideData,battleMode:'raid',variantIds:['c0']}).status,'invalid_selection');
});

test('clipped, unfinished, preview and extra-quotation evidence cannot silently use a matching reciprocal',()=>{
  for(const mutation of [value=>value.replace('5% Max HP.','5% Max HP…'),value=>value.replace('5% Max HP.','5% Max HP'),value=>value+' Locked preview: “Extra benefit.”',value=>value+' Partial popup.',value=>value+' “Second possible current effect.”',value=>value+' Current effect is unconfirmed.',value=>value+' Effect changed to 12%.',value=>value+' "Conflicting text."',value=>value.replace('Area Clear','Unrecognized Clear'),value=>value.replace(/\[Source\].*$/,'')]) {
    const f=fixture();f.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup=mutation(popup());
    const r=prepared(f);assert.equal(r.pairs[0].status,'source_incomplete');assert.ok(r.issues.length);assert.equal(evaluate(f).present.length,0);
  }
});

test('reciprocal disagreement in amount, sign, replacement or gem name blocks the pair',()=>{
  for(const [from,to] of [['5% Max HP','6% Max HP'],['+10% Stamina','-10% Stamina'],['Area Clear','Color Clear'],['Synthetic Gem','Other Gem'],['Synthetic Pair','Other Pair']]) {
    const f=fixture();f.handoff.champion_capture_groups[1].fields_as_recorded.ally=f.handoff.champion_capture_groups[1].fields_as_recorded.ally.replace(from,to);
    const r=prepared(f);assert.equal(r.pairs[0].status,'source_conflict');assert.equal(r.audit.blockedPairs,1);assert.equal(evaluate(f).present.length,0);assert.equal(r.pairs[0].sources.length,2);
  }
});

test('unknown sources fail import; missing exact ally or ambiguous identity stays unresolved',()=>{
  const f=fixture();f.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup=popup().replace('IMG_100','IMG_999');assert.throws(()=>integrated(f),/Unreviewed Ally Gem source/);
  const bare=fixture();bare.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup=popup('Example 1');assert.ok(prepared(bare).issues.some(row=>/exact variant/.test(row.reason)));
  const ambiguous=fixture();ambiguous.mappings.push({...ambiguous.mappings[1],variantId:'another-id'});assert.ok(prepared(ambiguous).issues.some(row=>/ambiguous/.test(row.reason)));
});

test('declared duplicate groups and linked minions cannot manufacture extra pair effects',()=>{
  const f=fixture();f.handoff.champion_capture_groups.push({...structuredClone(f.handoff.champion_capture_groups[0]),capture_group_id:'DUP',duplicate_of_group_id:'G0'});f.handoff.champion_capture_groups[2].fields_as_recorded.linked_minion=popup();f.handoff.champion_capture_groups[3].fields_as_recorded.traits='**Trait** — “Replaces Power-Ups.” IMG_100.PNG';
  assert.equal(prepared(f).audit.popupRecords,2);assert.equal(integrated(f).audit.capturedAllyPairs.completePairs,1);
});

test('self-links are invalid and a non-live missing partner is never suggested',()=>{
  const f=fixture();f.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup=popup('Example 0 — Exact One');delete f.handoff.champion_capture_groups[1].fields_as_recorded.ally;
  assert.equal(prepared(f).pairs[0].status,'invalid_pair');assert.equal(evaluate(f).present.length,0);
  const r=integrated(fixture());r.guideData.champions.find(row=>row.id==='c1').releaseState='unverified';assert.equal(evaluateCapturedAllyPairs({guideData:r.guideData,battleMode:'raid',variantIds:['c0']}).options.length,0);
});

test('conditional harmful and target-specific wording is retained without treating every effect as a benefit',()=>{
  const f=fixture(),conditional='When activated, this Gem PACIFIES an enemy and Example 0 for 2 turns. If the target is BRITTLE, reduce its Stamina by 50%. Otherwise, afflict 1 ICE.';
  f.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup=popup(undefined,conditional);delete f.handoff.champion_capture_groups[1].fields_as_recorded.ally;
  assert.equal(evaluate(f).present[0].effect,conditional);assert.equal(evaluate(f).score,0);assert.match(evaluate(f).limitations.join(' '),/Named statuses, targets, random choices/);
});

test('integration keeps old pair scoring empty and does not generate facts or providers',()=>{
  const f=fixture(),baseline=fixture();delete baseline.handoff.champion_capture_groups[0].fields_as_recorded.linked_ally_popup;delete baseline.handoff.champion_capture_groups[1].fields_as_recorded.ally;
  const r=integrated(f),old=integrated(baseline);assert.deepEqual(r.guideData.allyGems,[]);assert.equal(r.guideData.historicalAllyGems.length,1);assert.deepEqual(r.strategyData,old.strategyData);assert.equal(r.guideData.verifiedCollection.capturedAllyPairs.length,1);
});

test('Raid/War exact teams and automatic recommendations gain pair explanations with identical scores and ordering',()=>{
  const r=integrated(fixture()),old=structuredClone(r);old.guideData.verifiedCollection.capturedAllyPairs=[];
  for(const targetId of ['raid:test','war:test']) {
    const args={targetId,variantIds:['c0','c1','c2','c3','c4'],leaderVariantId:'c0'};
    const after=evaluateExactTeam({...r,...args}),before=evaluateExactTeam({...old,...args});assert.equal(after.capturedAllyPairs.present.length,1);assert.equal(before.capturedAllyPairs.present.length,0);assert.equal(after.overallScore,before.overallScore);assert.deepEqual(after.teamSynergy,before.teamSynergy);
    for(const requiredVariantIds of [[],['c0','c1']]){const current=recommendTeam({...r,targetId,requiredVariantIds}),previous=recommendTeam({...old,targetId,requiredVariantIds});assert.equal(current.capturedAllyPairs.present.length,1);assert.equal(current.overallScore,previous.overallScore);assert.deepEqual(current.team.map(row=>row.champion.id),previous.team.map(row=>row.champion.id));}
  }
});

test('HTML escapes sources and effects, retains caveats and renders in team and Ask follow-up views',()=>{
  const model=evaluate(fixture());for(const field of ['ownerName','allyName','gemName','pairName','replaces','effect'])model.present[0][field]='<script>bad</script>';model.present[0].sources[0].effect='<img src=x>';model.present[0].sources[0].provenanceRef='<script>';
  const html=capturedAllyPairsMarkup({capturedAllyPairs:model});assert.doesNotMatch(html,/<script|<img/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Pair presence does not mean/);assert.match(html,/Captured pair sources/);assert.match(html,/No additional score/);
  const guide=fs.readFileSync(new URL('../guide.js',import.meta.url),'utf8');assert.match(guide,/capturedAllyPairsMarkup\(result\)/);assert.match(guide,/capturedAllyPairsMarkup\(answer.result\)/);
  assert.equal(capturedAllyPairsMarkup({capturedAllyPairs:{status:'not_applicable'}}),'');assert.equal(capturedAllyPairsMarkup({capturedAllyPairs:evaluate(fixture(),['c2','c3','c4','c5','c6'])}),'');
});
