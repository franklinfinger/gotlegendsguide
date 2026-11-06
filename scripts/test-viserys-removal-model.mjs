import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateViserysRemoval,explainViserysRemoval,hasViserysRemovalTradeoff} from '../viserys-removal-model.js';
import {integrateVerifiedHandoff} from '../verified-handoff.js';
import {recommendTeam,evaluateExactTeam} from '../strategy-engine.js';
import {buildTeamExplanation,teamExplanationMarkup} from '../team-explanation.js';

const id='sqlite-champion-68';
const skill='Viserys PACIFIES himself for 3 turns, then removes 1 Buff from each enemy and 1 Debuff from each team member. Each Buff and Debuff Viserys removes is replaced with FIRE. He then HEALS each team member for 25% ATK with a bonus 6.5% ATK HEALING for each FIRE on them.';
const defs={FIRE:'Marks the target to receive Fire Damage which greatly increases with more stacks.',PACIFY:'Renders the target unable to deal damage or use any abilities until they are struck by an enemy Skill.',REMOVE:'Eliminates Buffs from enemies or Debuffs from allies.'};
const source=(text,extra={})=>({text,reviewStatus:'complete',captureDate:'2000-01-01',reviewCompletedDate:'2000-01-02',provenanceRef:'synthetic:source',sourceFilenames:['synthetic.png'],...extra});
function fixture(){
  const champions=[id,'filler-a','filler-b','filler-c','filler-d'].map(variantId=>({id:variantId,name:variantId===id?'Viserys Targaryen I — The Peaceful King':variantId+' — Exact Variant',releaseState:'live',reviewStatus:'complete',factions:[],roles:[]}));
  const records=[source(skill,{id:'synthetic:skill',variantId:id,kind:'skill',context:'skill',name:'Set Aside Your Grievances',displayedSkillLevel:5})];
  const effectDefinitionUpdates=Object.entries(defs).map(([effectName,text])=>source(text,{effectName,title:effectName,scopes:[{variantId:id}],provenanceRef:'synthetic:'+effectName}));
  const guideData={champions,abilities:[],traits:[],items:[],teams:[],factions:[],factionActivations:[],allyGems:[],verifiedCollection:{captureDate:'2000-01-01',variantIds:champions.map(row=>row.id),records,effectDefinitionUpdates,effectDefinitions:[],definitionGaps:[]}};
  const target={id:'raid:test',name:'Synthetic Raid',battleMode:'raid',evidenceState:'verified',approach:'Synthetic',timing:'Synthetic',warning:'Synthetic'};
  const mechanics=['physical_damage','buff_removal','cleanse','healing','apply_fire'].map(id=>({id,name:id,category:'support'}));
  const strategyData={targets:[target],mechanics,rules:mechanics.map(row=>({id:'fit:'+row.id,kind:'target_fit',targetId:target.id,mechanicId:row.id,score:row.id==='physical_damage'?1:50,rationale:'Synthetic fit.',evidenceCategory:'strategy_inference',provenanceRef:'synthetic:fit',confidence:1})),championFacts:champions.slice(1).map(row=>({id:'fact:'+row.id,variantId:row.id,mechanicId:'physical_damage',context:'skill',factText:'Synthetic strikes an enemy for 25% ATK Physical Damage.',reviewStatus:'complete',confidence:1,provenanceRef:'synthetic:fact:'+row.id})),curatedRecommendations:[]};
  return {guideData,strategyData};
}
const evaluate=(f,extra={})=>evaluateViserysRemoval({guideData:f.guideData,battleMode:'raid',variantIds:f.guideData.champions.map(row=>row.id),...extra});
function imported({skillText=skill,skillName='Set Aside Your Grievances'}={}){
  const f=fixture();
  const champion_capture_groups=f.guideData.champions.map((champion,index)=>({capture_group_id:'G'+index,champion:champion.name.split(' — ')[0],exact_variant:champion.name.split(' — ')[1],profile_anchor:`IMG_${100+index}.PNG`,group_source_filenames:[`IMG_${100+index}.PNG`],fields_as_recorded:{current_skill:`**${index===0?skillName:'Synthetic Strike'}** — level 5. “${index===0?skillText:'Example strikes an enemy for 25% ATK Physical Damage.'}” IMG_${100+index}.PNG`}}));
  const handoff={capture_date:'2000-01-01',review_completed_date:'2000-01-02',champion_capture_groups,all_reviewed_source_filenames:champion_capture_groups.flatMap(row=>row.group_source_filenames),effect_definition_updates:Object.entries(defs).map(([effect,definition])=>({effect,title:effect,definition,remaining:[],readability:'complete_popup_visually_readable',review_date:'2000-01-02',applies_to:[{capture_group_id:'G0',champion:'Viserys Targaryen I',exact_variant:'The Peaceful King'}],screenshot:'synthetic-'+effect+'.png',source:{file_name:'synthetic-'+effect+'.png',library_file_id:'synthetic-'+effect}}))};
  delete f.guideData.verifiedCollection;
  return integrateVerifiedHandoff({...f,handoff});
}

test('complete captured Skill and definitions yield the whole zero-score tradeoff',()=>{
  const f=fixture(),before=JSON.stringify(f),r=evaluate(f);
  assert.equal(r.status,'conditional_tradeoff');assert.equal(r.score,0);assert.equal(r.sourceLevel,5);assert.equal(r.sourceEvidence.length,4);assert.equal(r.steps.length,4);
  assert.match(r.summary,/not a clean status reset/);assert.ok(r.steps.every(row=>row.sourceRefs.length));
  assert.match(r.steps[0].text,/3 turns.*enemy Skill/);assert.match(r.steps[1].text,/1 Buff.*1 Debuff/);
  assert.match(r.steps[2].text,/affected ally with FIRE/);assert.match(r.steps[3].text,/25%.*6.5%.*prevent a net-healing/);
  assert.equal(r.sourceEvidence[0].text,skill);assert.equal(JSON.stringify(f),before);
});

test('missing state and intra-Skill order are explicit, never fabricated into a safe loop',()=>{
  const r=evaluate(fixture()),limits=r.limitations.join(' ');
  assert.match(limits,/own removal selects PACIFY/);assert.match(limits,/immunity, prevention, healing restrictions/);
  assert.match(limits,/No added FIRE count.*cast cadence/);assert.match(limits,/Leader and passive are separate/);
  assert.match(r.steps[0].text,/ordinary damage/);assert.match(r.steps[1].text,/no particular effect/);
  assert.equal(r.netHealing,undefined);assert.equal(r.damage,undefined);assert.equal(r.fireStacks,undefined);
});

test('exact captured live variant and Raid or War context are mandatory',()=>{
  assert.equal(evaluate(fixture(),{battleMode:'war'}).status,'conditional_tradeoff');
  assert.equal(evaluate(fixture(),{battleMode:'legendary-assault'}).status,'not_applicable');
  assert.equal(evaluate(fixture(),{variantIds:['other-viserys']}).status,'not_applicable');
  for(const mutate of [f=>{f.guideData.verifiedCollection.variantIds=[];},f=>{f.guideData.champions[0].releaseState='unverified';}]){const f=fixture();mutate(f);assert.equal(evaluate(f).status,'invalid_selection');}
  const f=fixture();f.guideData.champions[0].name='Viserys Targaryen — Beggar King';assert.equal(evaluate(f).status,'source_incomplete');
  assert.equal(evaluate(fixture(),{variantIds:[id,id]}).status,'invalid_selection');
  const noCollection=fixture();delete noCollection.guideData.verifiedCollection;assert.equal(evaluate(noCollection).status,'not_applicable');
});

test('partial, changed, duplicate, historical or unsigned Skill sources fail closed',()=>{
  for(const mutate of [row=>{row.reviewStatus='partial';},row=>{row.text+='…';},row=>{row.text+=' Extra unknown clause.';},row=>{row.text=row.text.replace('replaced with FIRE','replaced with ICE');},row=>{row.text=row.text.replace('3 turns','0 turns');},row=>{row.name='Other Skill';},row=>{row.kind='item';},row=>{row.historicalReference=true;},row=>{row.sourceFilenames=[];},row=>{row.provenanceRef='';},row=>{delete row.captureDate;delete row.reviewCompletedDate;}]){const f=fixture();mutate(f.guideData.verifiedCollection.records[0]);assert.equal(evaluate(f).status,'source_incomplete');assert.deepEqual(evaluate(f).steps,[]);}
  const f=fixture();f.guideData.verifiedCollection.records.push({...f.guideData.verifiedCollection.records[0],id:'duplicate'});assert.equal(evaluate(f).status,'source_incomplete');
});

test('all three definitions require complete current matching wording and exact scope',()=>{
  for(const index of [0,1,2])for(const mutate of [row=>{row.reviewStatus='partial';},row=>{row.text+=' Unknown exception.';},row=>{row.scopes=[];},row=>{row.scopes=[{variantId:'other-viserys'}];},row=>{row.historicalReference=true;},row=>{row.sourceFilenames=[];},row=>{delete row.reviewCompletedDate;}]){const f=fixture();mutate(f.guideData.verifiedCollection.effectDefinitionUpdates[index]);const r=evaluate(f);assert.equal(r.status,'definition_unverified');assert.deepEqual(r.steps,[]);assert.equal(r.sourceEvidence[0].text,skill);}
  const missing=fixture();missing.guideData.verifiedCollection.effectDefinitionUpdates=[];assert.equal(evaluate(missing).status,'definition_unverified');
  const conflict=fixture();conflict.guideData.verifiedCollection.effectDefinitionUpdates.push({...conflict.guideData.verifiedCollection.effectDefinitionUpdates[0],text:'Contradictory source.'});assert.equal(evaluate(conflict).status,'definition_unverified');
});

test('duplicate corroborating definitions retain every reference without multiplying effects',()=>{
  const f=fixture();f.guideData.verifiedCollection.effectDefinitionUpdates.push({...f.guideData.verifiedCollection.effectDefinitionUpdates[0],sourceFilenames:['second-synthetic.png']});
  const r=evaluate(f);assert.equal(r.status,'conditional_tradeoff');assert.equal(r.score,0);assert.equal(r.steps.length,4);assert.ok(r.sourceRefs.some(ref=>ref.includes('second-synthetic.png')));
});

test('the imported coupled Skill cannot earn isolated removal, cleanse, FIRE or healing points',()=>{
  const r=imported();assert.equal(r.strategyData.championFacts.filter(row=>row.variantId===id).length,0);
  assert.equal(r.guideData.verifiedCollection.records.find(row=>row.variantId===id).text,skill);
  assert.equal(hasViserysRemovalTradeoff({variantId:id,kind:'skill',name:'Set Aside Your Grievances',text:'Changed wording.'}),true);
  assert.equal(hasViserysRemovalTradeoff({variantId:'other-viserys',kind:'skill',name:'Set Aside Your Grievances'}),false);
  const team=recommendTeam({...r,targetId:'raid:test',requiredVariantIds:[id]});assert.equal(team.status,'ready');assert.equal(team.overallScore,4);assert.equal(team.viserysRemoval.status,'conditional_tradeoff');
  const member=team.team.find(row=>row.champion.id===id);assert.equal(member.score,0);assert.deepEqual(member.scoringContributions,[]);assert.ok(member.reasons.some(row=>row.fact===skill));assert.ok(member.reasons.some(row=>/not a clean status reset/.test(row.text)));
});

test('exact lineup and missing-definition results preserve selection, score and honest source limits',()=>{
  const f=imported(),options={targetId:'raid:test',variantIds:f.guideData.champions.map(row=>row.id),leaderVariantId:'filler-a'};
  const exact=evaluateExactTeam({...f,...options});assert.equal(exact.overallScore,4);assert.equal(exact.viserysRemoval.status,'conditional_tradeoff');assert.equal(exact.leader.champion.id,'filler-a');
  f.guideData.verifiedCollection.effectDefinitionUpdates=[];const without=evaluateExactTeam({...f,...options});assert.equal(without.overallScore,exact.overallScore);assert.equal(without.viserysRemoval.status,'definition_unverified');assert.deepEqual(without.team.map(row=>row.champion.id),exact.team.map(row=>row.champion.id));
});

test('changed Skill title or body cannot silently restore flat scoring before review',()=>{
  for(const options of [{skillName:'Changed Skill Title'},{skillText:skill+' Extra unmodeled clause.'}]){
    const f=imported(options);assert.equal(f.strategyData.championFacts.filter(row=>row.variantId===id).length,0);
    const result=recommendTeam({...f,targetId:'raid:test',requiredVariantIds:[id]});assert.equal(result.overallScore,4);assert.equal(result.viserysRemoval.status,'source_incomplete');assert.equal(result.team.find(row=>row.champion.id===id).score,0);
  }
});

test('selected-team explanation displays the exact Skill, drawback, uncertainties and sources',()=>{
  const f=imported(),result=recommendTeam({...f,targetId:'raid:test',requiredVariantIds:[id]});
  const model=buildTeamExplanation({result,request:{intent:'explanation',requiredVariantIds:[id]},guideData:f.guideData});const html=teamExplanationMarkup({teamExplanation:model});
  assert.ok(html.includes(skill));assert.match(html,/Conditional Skill tradeoff/);assert.match(html,/affected ally with FIRE/);assert.match(html,/own removal selects PACIFY/);assert.match(html,/screenshot-tooltip:2000-01-02:PACIFY/);assert.match(html,/no flat removal, cleanse, healing or FIRE points/);
  assert.equal(model.members.find(row=>row.variantId===id).tradeoff.score,0);
});

test('tradeoff text and source labels are escaped in explanations',()=>{
  const f=imported(),result=recommendTeam({...f,targetId:'raid:test',requiredVariantIds:[id]});const tradeoff=result.team.find(row=>row.champion.id===id).skillTradeoff;
  tradeoff.summary='<script>inert</script>';tradeoff.steps[0].text='<img src=x>';tradeoff.sourceRefs.push('<svg onload=inert>');
  const html=teamExplanationMarkup({teamExplanation:buildTeamExplanation({result,request:{intent:'explanation'},guideData:f.guideData})});
  assert.doesNotMatch(html,/<script>|<img |<svg /);assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);assert.match(html,/&lt;svg/);
});

test('adding explanation is pure and does not select a leader or change scores',()=>{
  const f=fixture(),result={target:f.strategyData.targets[0],team:f.guideData.champions.map(champion=>({champion,reasons:[],score:1})),overallScore:5,leader:null,missingDataWarnings:[]};const before=JSON.stringify(result);
  const explained=explainViserysRemoval(result,f.guideData);assert.equal(JSON.stringify(result),before);assert.equal(explained.overallScore,5);assert.equal(explained.leader,null);assert.deepEqual(explained.team.map(row=>row.champion.id),result.team.map(row=>row.champion.id));
});
