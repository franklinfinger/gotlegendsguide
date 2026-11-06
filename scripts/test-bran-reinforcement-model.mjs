import test from 'node:test';
import assert from 'node:assert/strict';
import {integrateVerifiedHandoff} from '../verified-handoff.js';
import {prepareRecoveredPortfolios,evaluateBranReinforcement,explainBranReinforcement} from '../bran-reinforcement-model.js';
import {recommendTeam,evaluateExactTeam} from '../strategy-engine.js';
import {buildTeamExplanation,teamExplanationMarkup} from '../team-explanation.js';
import {prepareEvidenceSnapshot,restoreEvidenceSnapshot} from '../private-access/src/evidence.js';

const id='sqlite-champion-53';
const bodies={skill:'Bran creates a Color Clear Power-Up, then Bran wargs into Summer, REINFORCING the battle with 52% HP and 65% Stamina.',leader:'Anytime an ally REINFORCES the battle, Bran afflicts all enemies with 1 ICE and gains +25% Stamina.',passive:'When a Stark team member uses their Skill or an Ally Gem is destroyed, Bran has a 60% chance to afflict a random enemy with 1 ICE. Bran then gains a 25% Hit Buff for 4 turns.',summer:'Summer strikes an enemy for 210% ATK Physical Damage. Summer then deals an additional 65% ATK Physical Damage for each ICE on the target.'};
function fixture(){
  const row=(text,extra={})=>({text,sources:['IMG_901.PNG'],...extra});
  const champions=[id,'filler-a','filler-b','filler-c','filler-d'].map(variantId=>({id:variantId,name:variantId===id?'Bran Stark — Fugitive Of Winterfell':variantId+' — Exact Variant',releaseState:'live',reviewStatus:'complete',factions:[],roles:[]}));
  const champion_capture_groups=champions.map((champion,index)=>({capture_group_id:'G'+index,champion:champion.name.split(' — ')[0],exact_variant:champion.name.split(' — ')[1],profile_anchor:`IMG_${100+index}.PNG`,group_source_filenames:[`IMG_${100+index}.PNG`],fields_as_recorded:index?{skill:`**Synthetic Strike** — level 1. “Example strikes an enemy for 25% ATK Physical Damage.” IMG_${100+index}.PNG`}:{profile:'Legendary; level 350 MAX; seven stars at maximum rank; power 200,000.'}}));
  const handoff={capture_date:'2000-01-01',review_completed_date:'2000-01-03',champion_capture_groups,all_reviewed_source_filenames:[...champion_capture_groups.flatMap(row=>row.group_source_filenames),'IMG_901.PNG'],review_updates:[{character:'Bran Stark',variant:'Fugitive Of Winterfell',rarity:'Legendary',capture_date:'2000-01-03',review_date:'2000-01-03',current_build:{level:350,stars:7,star_rank_max:true,champion_rating:200000,skill_level:9,traits_max:true},source_files:[{file_name:'IMG_100.PNG',library_file_id:'synthetic-profile'}]}],recovered_variant_portfolios:[{
    capture_group_id:'G0',champion:'Bran Stark',exact_variant:'Fugitive Of Winterfell',review_date:'2000-01-03',source_files:[{file_name:'IMG_901.PNG',library_file_id:'synthetic-earlier-source',evidence_date:'2000-01-01',local_path:'/private/synthetic-only'}],
    skill:row(bodies.skill,{name:'A Dream Of Summer',level:8,stamina_speed:'Slow'}),skill_upgrade:row('Level 9 Upgrade: +3% Summer starting HP'),
    traits:[row(bodies.leader,{name:'My Dreams Are Different II',max:true,badges:['Leader','All']}),row(bodies.passive,{name:'Follow The Raven III',max:true,badges:['1 Once']})],
    companion:{name:'Summer',exact_variant:"Bran's Direwolf",skill:row(bodies.summer,{name:"The Warg's Wolf",level:8,stamina_speed:'Fast'}),upgrade:row('Level 9 Upgrade: +20% ATK Physical Damage'),inheritance:row('Summer will inherit their Level, Star Rank, and Skill Level from Bran Stark.')},star_upgrade:row('+10% DEF',{rank:7,stat:'DEF',percent:10})
  }]};
  const guideData={version:'synthetic',champions,abilities:[{id:'old-skill',variantId:id,name:'Old Skill',text:'Old ability 999%',reviewStatus:'complete'}],traits:[],items:[],teams:[],factions:[],factionActivations:[],allyGems:[]};
  const target={id:'raid:test',name:'Synthetic Raid',battleMode:'raid',evidenceState:'verified',approach:'Synthetic',timing:'Synthetic',warning:'Synthetic'};
  const strategyData={targets:[target],mechanics:[{id:'physical_damage',name:'Physical Damage',category:'damage'},{id:'apply_ice',name:'ICE',category:'control'},{id:'stamina',name:'Stamina',category:'support'}],rules:[{id:'fit',kind:'target_fit',targetId:target.id,mechanicId:'physical_damage',score:1,rationale:'Synthetic fit',evidenceCategory:'strategy_inference',provenanceRef:'synthetic-rule',confidence:1}],championFacts:[{id:'old-bran',variantId:id,mechanicId:'apply_wound',context:'trait',factText:'Unsupported old WOUND tag',confidence:1,reviewStatus:'complete',provenanceRef:'synthetic-old'}],curatedRecommendations:[]};
  return {handoff,guideData,strategyData};
}
const imported=()=>integrateVerifiedHandoff(fixture());
const evaluate=(f,extra={})=>evaluateBranReinforcement({guideData:f.guideData,battleMode:'raid',variantIds:f.guideData.verifiedCollection.variantIds,...extra});

test('recovered portfolio is preserved separately from current-rank Skill facts',()=>{
  const f=fixture(),before=JSON.stringify(f),r=integrateVerifiedHandoff(f),champion=r.guideData.champions.find(row=>row.id===id);
  assert.equal(JSON.stringify(f),before);assert.equal(r.guideData.verifiedCollection.variantIds.length,5);
  assert.equal(r.audit.missingSkills.length,0);assert.equal(r.audit.priorRankSkills[0].observedSkillLevel,8);
  assert.equal(champion.screenshotState.development.stars,7);assert.equal(champion.screenshotState.currentBuild.skill_level,9);
  assert.equal(r.guideData.verifiedCollection.recoveredPortfolios[0].skill.level,8);
  assert.equal(r.guideData.abilities.filter(row=>row.variantId===id).length,0);
  assert.equal(r.strategyData.championFacts.filter(row=>row.variantId===id).length,0);
  assert.equal(r.guideData.champions.filter(row=>row.name==='Summer').length,0);
  assert.doesNotMatch(JSON.stringify(r.guideData.verifiedCollection.recoveredPortfolios),/local_path|private\/synthetic/);
});

test('rank-9 HP and seven-star DEF are derived, never relabeled observed',()=>{
  const r=evaluate(imported());assert.equal(r.status,'conditional_recovered_portfolio');assert.equal(r.score,0);
  const hp=r.derivedValues.find(row=>row.field==='summer_starting_hp_percent');assert.equal(hp.value,55);assert.equal(hp.evidenceClass,'derived_from_observed_upgrade');assert.match(hp.assumption,/unchanged/);
  assert.equal(r.derivedValues.find(row=>row.field==='rank_7_def_bonus_percent').value,10);
  assert.ok(r.sourceEvidence.some(row=>row.text===bodies.skill));assert.ok(r.sourceEvidence.every(row=>row.evidenceClass==='observed_prior_snapshot'));
  assert.match(r.steps.map(row=>row.text).join(' '),/not a newly observed.*55%/);assert.match(r.steps.map(row=>row.text).join(' '),/do not add another 10%/);
  assert.ok(!r.sourceEvidence.some(row=>/55%/.test(row.text)));
});

test('Leader is only interpreted when explicitly selected; no self-reinforcement loop',()=>{
  const f=imported(),without=evaluate(f),withLeader=evaluate(f,{leaderVariantId:id});
  assert.ok(!without.sourceEvidence.some(row=>row.text===bodies.leader));assert.match(without.steps.at(3).text,/not activated/);
  assert.ok(withLeader.sourceEvidence.some(row=>row.text===bodies.leader));assert.match(withLeader.steps.at(3).text,/Whether Bran’s own warg.*unestablished/);
  assert.match(withLeader.steps.map(row=>row.text).join(' '),/60% chance.*random enemy.*1 Once/);
  assert.match(withLeader.steps.map(row=>row.text).join(' '),/per ICE actually.*Do not assume ICE/);
  assert.equal(withLeader.score,without.score);
});

test('missing, stale, conflicting or changed progression cannot activate upgrades',()=>{
  for(const mutate of [c=>{delete c.screenshotState.development;},c=>{c.screenshotState.development.captureDate='1999-01-01';},c=>{c.screenshotState.currentBuild.skill_level=10;}]){
    const f=imported();mutate(f.guideData.champions.find(row=>row.id===id));assert.ok(!evaluate(f).derivedValues.some(row=>row.field==='summer_starting_hp_percent'));
  }
  const f=imported(),c=f.guideData.champions.find(row=>row.id===id);c.screenshotState.conflicts=[{field:'Skill level',state:'unresolved'}];c.screenshotState.development.stars=null;
  assert.equal(evaluate(f).derivedValues.length,0);
});

test('changed, partial, unsigned or duplicate recovered evidence fails closed',()=>{
  for(const mutate of [p=>{p.skill.text+=' Changed.';},p=>{p.traits[0].max=false;},p=>{p.skill.sourceIdentities=[];},p=>{p.companion.skill.level=9;},p=>{p.companion.skill.reviewStatus='partial';},p=>{p.starUpgrade.percent=99;},p=>{p.skillUpgrade.text='Unsupported upgrade';}]){
    const f=imported();mutate(f.guideData.verifiedCollection.recoveredPortfolios[0]);const result=evaluate(f);assert.equal(result.status,'source_incomplete');assert.deepEqual(result.derivedValues,[]);assert.equal(result.score,0);
  }
  const f=imported();f.guideData.verifiedCollection.recoveredPortfolios.push(structuredClone(f.guideData.verifiedCollection.recoveredPortfolios[0]));assert.equal(evaluate(f).status,'source_incomplete');
});

test('source registry and exact-identity errors reject import rather than silently dropping evidence',()=>{
  for(const mutate of [p=>{p.exact_variant='Different variant';},p=>{p.source_files[0].evidence_date='unknown';},p=>{p.skill.sources=['missing.png'];},p=>{p.source_files.push({...p.source_files[0]});},p=>{p.skill.text+='…';}]){
    const f=fixture();mutate(f.handoff.recovered_variant_portfolios[0]);assert.throws(()=>integrateVerifiedHandoff(f),/Recovered portfolio/);
  }
  assert.throws(()=>prepareRecoveredPortfolios({recovered_variant_portfolios:{}},[]),/array/);
});

test('context, ownership and exact identity gates prevent borrowing Bran or Summer',()=>{
  assert.equal(evaluate(imported(),{battleMode:'legendary-assault'}).status,'not_applicable');
  assert.equal(evaluate(imported(),{variantIds:[]}).status,'not_applicable');
  assert.equal(evaluate(imported(),{variantIds:[id,id]}).status,'invalid_selection');
  const f=imported();f.guideData.verifiedCollection.variantIds=f.guideData.verifiedCollection.variantIds.filter(x=>x!==id);assert.equal(evaluate(f,{variantIds:[id]}).status,'invalid_selection');
  const wrong=imported();wrong.guideData.champions.find(row=>row.id===id).name='Bran Stark — Different variant';assert.equal(evaluate(wrong).status,'source_incomplete');
});

test('explanation is pure and preserves all combat scores, lineup and Leader',()=>{
  const f=imported(),result={target:f.strategyData.targets[0],team:f.guideData.champions.map(champion=>({champion,reasons:[],score:1})),overallScore:5,leader:null,missingDataWarnings:[]};const before=JSON.stringify(result);
  const r=explainBranReinforcement(result,f.guideData);assert.equal(JSON.stringify(result),before);assert.equal(r.overallScore,5);assert.equal(r.leader,null);assert.deepEqual(r.team.map(row=>row.score),result.team.map(row=>row.score));assert.ok(r.team.find(row=>row.champion.id===id).reasons.some(row=>/Earlier observed Skill/.test(row.fact)));
});

test('private snapshot round trip retains source history, profile rank and strict separation',()=>{
  const f=fixture(),prepared=prepareEvidenceSnapshot({...f}),saved=JSON.parse(JSON.stringify(prepared.snapshot));
  assert.doesNotMatch(JSON.stringify(saved),/local_path|private\/synthetic/);
  const restored=restoreEvidenceSnapshot({snapshot:saved,guideData:f.guideData,strategyData:f.strategyData});
  assert.equal(evaluate(restored).status,'conditional_recovered_portfolio');assert.equal(restored.guideData.verifiedCollection.recoveredPortfolios[0].skill.text,bodies.skill);assert.equal(restored.strategyData.championFacts.filter(row=>row.variantId===id).length,0);
});

test('actual team routes and Why explanation expose dated sources and derived values without score inflation',()=>{
  const f=imported(),r=recommendTeam({...f,targetId:'raid:test',requiredVariantIds:[id]});assert.equal(r.status,'ready');assert.equal(r.branReinforcement.status,'conditional_recovered_portfolio');assert.equal(r.team.find(row=>row.champion.id===id).score,0);
  const exact=evaluateExactTeam({...f,targetId:'raid:test',variantIds:f.guideData.verifiedCollection.variantIds,leaderVariantId:id});assert.equal(exact.branReinforcement.status,'conditional_recovered_portfolio');assert.equal(exact.overallScore,r.overallScore);
  const html=teamExplanationMarkup({teamExplanation:buildTeamExplanation({result:exact,request:{intent:'explanation'},guideData:f.guideData})});
  assert.match(html,/Earlier observed Skill, level 8/);assert.match(html,/Derived, not a newly observed/);assert.match(html,/55% starting HP/);assert.match(html,/60% chance/);
  exact.team.find(row=>row.champion.id===id).reasons.push({fact:'<script>inert</script>',factProvenanceRef:'<svg>',score:0});
  assert.doesNotMatch(teamExplanationMarkup({teamExplanation:buildTeamExplanation({result:exact,request:{intent:'explanation'},guideData:f.guideData})}),/<script>|<svg>/);
});
