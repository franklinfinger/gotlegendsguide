import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateIceBrittleSynergy, iceBrittleSynergyMarkup } from '../ice-brittle-synergy.js';
import { evaluateExactTeam, recommendTeam } from '../strategy-engine.js';
const ned='sqlite-champion-2',brienne='sqlite-champion-51',rickard='sqlite-champion-38';
const core=[ned,brienne,rickard],lineup=[...core,'filler-a','filler-b'];
const source=(variantId,kind,text,extra={})=>({id:'synthetic:'+variantId,variantId,kind,context:kind,name:'Synthetic source',text,reviewStatus:'complete',provenanceRef:'synthetic:'+variantId,sourceFilenames:['synthetic.png'],captureDate:'2000-01-01',reviewCompletedDate:'2000-01-02',...extra});
function fixture(){
  const champions=[{id:ned,name:'Ned Stark — Warden Of The North'},{id:brienne,name:'Brienne Of Tarth — True Knight'},{id:rickard,name:'Rickard Karstark — Lord Of Karhold'},...['filler-a','filler-b','other-ned','other-brienne'].map(id=>({id,name:id}))].map(row=>({...row,releaseState:'live',reviewStatus:'complete',factions:[],roles:[]}));
  const records=[source(ned,'trait','At the start of combat and each new wave, all enemies are afflicted with 1 ICE. Ned is immune to BRITTLE.',{context:'leader'}),source(brienne,'skill','Brienne strikes an enemy for 225% ATK Physical Damage and strikes adjacent enemies for 120% ATK Physical Damage. Each of these enemies become afflicted with 2 ICE.'),source(rickard,'skill','Rickard afflicts an enemy with 2 ICE and 1 BLEED. If his target was already BRITTLE, they are afflicted with 3 BLEED instead. He then strikes them for 560% ATK Physical Damage. If Rickard defeats his target, he refunds 65% Stamina.')];
  const definition={...source(null,'tooltip','Applied when 5 ICE accumulate. BRITTLE targets take 2x damage from champion Skills and Traits. Cannot be REMOVED.'),effectName:'BRITTLE',title:'Brittle'};
  const guideData={champions,abilities:[],traits:[],items:[],teams:[],factions:[],factionActivations:[],allyGems:[],verifiedCollection:{captureDate:'2000-01-01',variantIds:champions.map(row=>row.id),records,effectDefinitionUpdates:[definition],effectDefinitions:[],definitionGaps:[]}};
  const strategyData={mechanics:[{id:'physical_damage',name:'Physical Damage',category:'damage'}],targets:[{id:'raid:test',name:'Synthetic Raid',battleMode:'raid',evidenceState:'verified',approach:'Synthetic',timing:'Synthetic',warning:'Synthetic'}],rules:[{id:'synthetic',kind:'target_fit',targetId:'raid:test',mechanicId:'physical_damage',score:1,rationale:'Synthetic baseline',evidenceCategory:'strategy_inference',provenanceRef:'synthetic',confidence:1}],championFacts:champions.map(row=>({id:'fact:'+row.id,variantId:row.id,mechanicId:'physical_damage',context:'skill',factText:'Synthetic direct source',evidenceCategory:'verified_fact',provenanceRef:'synthetic:'+row.id,reviewStatus:'complete',confidence:1})),curatedRecommendations:[]};
  return {guideData,strategyData};
}
const evaluate=(f,extra={})=>evaluateIceBrittleSynergy({guideData:f.guideData,battleMode:'raid',variantIds:lineup,leaderVariantId:ned,...extra});

test('exact three-champion core yields an ordered conditional 1 + 2 + 2 setup with no points',()=>{
  const f=fixture(),before=JSON.stringify(f),result=evaluate(f);
  assert.equal(result.status,'conditional_plan');assert.equal(result.score,0);assert.equal(result.setupIce,5);assert.equal(result.thresholdIce,5);assert.deepEqual(result.coreVariantIds,core);
  assert.deepEqual(result.steps.map(row=>row.variantId),[ned,brienne,rickard,null]);assert.deepEqual(result.steps.map(row=>row.ice),[1,2,2,0]);assert.equal(result.sourceEvidence.length,4);assert.equal(result.sourceRefs.length,4);
  assert.ok(result.steps.every(row=>row.sourceRefs.length));assert.equal(JSON.stringify(f),before);
  assert.match(result.limitations.join(' '),/not a best-team claim/);assert.match(result.limitations.join(' '),/No starting Stamina/);assert.match(result.limitations.join(' '),/no ICE before/);assert.match(result.limitations.join(' '),/immunity/);assert.match(result.limitations.join(' '),/No damage totals or compounded multipliers/);
  assert.match(result.steps[2].text,/does not resolve intra-Skill trigger ordering/);assert.match(result.steps[3].text,/Confirm.*BRITTLE/);
});

test('wrong or absent Leader never turns two Skills into a five-ICE route',()=>{
  for(const leaderVariantId of [null,brienne,rickard,'filler-a']){const result=evaluate(fixture(),{leaderVariantId});assert.equal(result.status,'leader_not_selected');assert.equal(result.score,0);assert.deepEqual(result.steps,[]);assert.equal(result.setupIce,undefined);assert.match(result.limitations[0],/only four from zero/);}
});

test('only exact captured live variants qualify; duplicate selections and outside-roster records fail closed',()=>{
  for(const mutate of [f=>{f.guideData.champions.find(row=>row.id===ned).name='Ned Stark — The Hand of the King';},f=>{f.guideData.champions.find(row=>row.id===brienne).name='Brienne Of Tarth — Lady Of The Sapphire Isles';}]){const f=fixture();mutate(f);assert.equal(evaluate(f).status,'source_incomplete');}
  for(const mutate of [f=>{f.guideData.verifiedCollection.variantIds=f.guideData.verifiedCollection.variantIds.filter(id=>id!==ned);},f=>{f.guideData.champions.find(row=>row.id===ned).releaseState='unverified';}]){const f=fixture();mutate(f);assert.equal(evaluate(f).status,'invalid_selection');}
  assert.equal(evaluate(fixture(),{variantIds:[...core,ned]}).status,'invalid_selection');assert.equal(evaluate(fixture(),{leaderVariantId:'not-in-team'}).status,'invalid_selection');
  assert.equal(evaluate(fixture(),{variantIds:lineup.map(id=>id===ned?'other-ned':id)}).status,'not_applicable');assert.equal(evaluate(fixture(),{variantIds:lineup.map(id=>id===brienne?'other-brienne':id)}).status,'not_applicable');
});

test('partial, clipped, changed, chance-qualified and conflicting source bodies cannot establish the plan',()=>{
  for(const index of [0,1,2])for(const mutate of [row=>{row.reviewStatus='partial';},row=>{row.text+='…';},row=>{row.text='If a coin flip succeeds, '+row.text;},row=>{row.sourceFilenames=[];},row=>{row.provenanceRef='';},row=>{row.kind='item';},row=>{row.historicalReference=true;},row=>{delete row.captureDate;delete row.reviewCompletedDate;},row=>{row.text=row.text.replace('1 ICE','2 ICE').replace('2 ICE','3 ICE');}]){const f=fixture();mutate(f.guideData.verifiedCollection.records[index]);const result=evaluate(f);assert.equal(result.status,'source_incomplete');assert.deepEqual(result.steps,[]);}
  const f=fixture();f.guideData.verifiedCollection.records.push({...f.guideData.verifiedCollection.records[1],id:'duplicate'});assert.equal(evaluate(f).status,'source_incomplete');
});

test('new captured five-ICE BRITTLE definition is mandatory; historical fallback cannot activate a plan',()=>{
  for(const mutate of [f=>{f.guideData.verifiedCollection.effectDefinitionUpdates=[];},f=>{f.guideData.verifiedCollection.effectDefinitionUpdates[0].reviewStatus='partial';},f=>{f.guideData.verifiedCollection.effectDefinitionUpdates[0].text+='…';},f=>{f.guideData.verifiedCollection.effectDefinitionUpdates[0].text=f.guideData.verifiedCollection.effectDefinitionUpdates[0].text.replace('5 ICE','4 ICE');},f=>{delete f.guideData.verifiedCollection.effectDefinitionUpdates[0].reviewCompletedDate;}]){const f=fixture();mutate(f);f.guideData.statuses=[{name:'Brittle',text:'Historical threshold.'}];assert.equal(evaluate(f).status,'definition_unverified');}
});

test('no item, locked upgrade, random ICE or missing-core substitute silently completes the setup',()=>{
  const f=fixture();f.guideData.verifiedCollection.records.push(source('filler-a','skill','Randomly afflict 1 ICE with a 99% chance.'));
  const baseline=evaluate(f);assert.equal(baseline.status,'conditional_plan');assert.equal(baseline.sourceEvidence.length,4);
  assert.deepEqual(evaluate(f,{itemStates:{[ned]:'enabled'},itemRanks:{[ned]:{rank:'V',level:20}}}),baseline);
  f.guideData.verifiedCollection.records=f.guideData.verifiedCollection.records.filter(row=>row.variantId!==brienne);assert.equal(evaluate(f).status,'source_incomplete');
});

test('raid and war are supported, dragons and unloaded collection are deliberately excluded',()=>{
  assert.equal(evaluate(fixture(),{battleMode:'war'}).status,'conditional_plan');for(const battleMode of ['legendary-assault','unknown',null])assert.equal(evaluate(fixture(),{battleMode}).status,'not_applicable');
  const f=fixture();delete f.guideData.verifiedCollection;assert.equal(evaluate(f).status,'not_applicable');
});

test('comparative exact-team evaluations gain usable sequence evidence but no ranking score',()=>{
  const f=fixture(),withPlan=evaluateExactTeam({...f,targetId:'raid:test',variantIds:lineup,leaderVariantId:ned});
  assert.equal(withPlan.iceBrittleSynergy.status,'conditional_plan');assert.equal(withPlan.overallScore,5);
  const noTooltip=structuredClone(f);noTooltip.guideData.verifiedCollection.effectDefinitionUpdates=[];
  const before=evaluateExactTeam({...noTooltip,targetId:'raid:test',variantIds:lineup,leaderVariantId:ned});assert.equal(before.iceBrittleSynergy.status,'definition_unverified');assert.equal(before.overallScore,withPlan.overallScore);assert.deepEqual(before.teamSynergy,withPlan.teamSynergy);
  const alternate=evaluateExactTeam({...f,targetId:'raid:test',variantIds:lineup,leaderVariantId:brienne});assert.equal(alternate.iceBrittleSynergy.status,'leader_not_selected');assert.equal(alternate.overallScore,withPlan.overallScore);
  const replaced=evaluateExactTeam({...f,targetId:'raid:test',variantIds:lineup.map(id=>id===brienne?'other-brienne':id),leaderVariantId:ned});assert.equal(replaced.iceBrittleSynergy.status,'not_applicable');assert.equal(replaced.overallScore,withPlan.overallScore);
});

test('automatic team recommendations are score-identical with and without the new source definition',()=>{
  const f=fixture(),without=structuredClone(f);without.guideData.verifiedCollection.effectDefinitionUpdates=[];
  const options={targetId:'raid:test',requiredVariantIds:core};const after=recommendTeam({...f,...options}),before=recommendTeam({...without,...options});
  assert.equal(after.overallScore,before.overallScore);assert.deepEqual(after.team.map(row=>row.champion.id),before.team.map(row=>row.champion.id));assert.deepEqual(after.teamSynergy,before.teamSynergy);
  assert.equal(after.iceBrittleSynergy.status,'leader_not_selected');
});

test('setup and blocked-plan HTML escapes all source text and exposes caveats',()=>{
  const model=evaluate(fixture());model.sourceEvidence[0].name='<img src=x>';model.sourceEvidence[0].text='<script>bad</script>';model.sourceEvidence[0].provenanceRef='<img src=x>';
  const html=iceBrittleSynergyMarkup({iceBrittleSynergy:model});assert.doesNotMatch(html,/<img|<script/);assert.match(html,/&lt;script&gt;/);assert.match(html,/conditional setup/);assert.match(html,/No additional score/);assert.match(html,/Exact setup sources/);
  assert.match(iceBrittleSynergyMarkup({iceBrittleSynergy:evaluate(fixture(),{leaderVariantId:brienne})}),/only four from zero/);
  assert.equal(iceBrittleSynergyMarkup({iceBrittleSynergy:{status:'not_applicable'}}),'');
});

test('Ask follow-up views and full team cards both render the setup evidence',()=>{
  const guide=fs.readFileSync(new URL('../guide.js',import.meta.url),'utf8');assert.match(guide,/iceBrittleSynergyMarkup\(result\)/);assert.match(guide,/iceBrittleSynergyMarkup\(answer.result\)/);
});

test('contradictory or incomplete additional current sources are rejected before matching expected wording',()=>{
  for(const variantId of core){const f=fixture(),row=f.guideData.verifiedCollection.records.find(row=>row.variantId===variantId);f.guideData.verifiedCollection.records.push({...row,id:'conflict',text:row.text.replace(/\b[12] ICE\b/,'3 ICE')});assert.equal(evaluate(f).status,'source_incomplete');}
  for(const text of ['Applied when 6 ICE accumulate. BRITTLE targets take 2x damage from champion Skills and Traits. Cannot be REMOVED.','Unreviewed partial threshold…']){const f=fixture();f.guideData.verifiedCollection.effectDefinitionUpdates.push({...f.guideData.verifiedCollection.effectDefinitionUpdates[0],text});assert.equal(evaluate(f).status,'definition_unverified');}
  const f=fixture();f.guideData.verifiedCollection.effectDefinitionUpdates.push({...f.guideData.verifiedCollection.effectDefinitionUpdates[0],sourceFilenames:['synthetic-repeat.png']});assert.equal(evaluate(f).status,'conditional_plan');assert.ok(evaluate(f).sourceRefs.some(ref=>ref.endsWith('synthetic-repeat.png')));
});
