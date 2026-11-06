import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalizeCapturedDevelopment, capturedDevelopment, capturedDevelopmentMarkup, describeTeamDevelopment, developmentNoticeMarkup } from '../captured-development.js';
import { integrateVerifiedHandoff } from '../verified-handoff.js';
import { recommendTeam } from '../strategy-engine.js';
import { buildTeamExplanation, teamExplanationMarkup } from '../team-explanation.js';

function input(profile='Legendary; level 53 with Level Up active; five of seven stars, 28/200 progress to six; power 41,257; ATK 10.2K. Skill level 1.') {
  return {variantId:'synthetic-0',handoff:{capture_date:'2026-11-01',review_completed_date:'2026-11-02'},group:{capture_group_id:'G0',profile_anchor:'IMG_100.PNG',fields_as_recorded:{profile}},conflicts:[]};
}
const champion = (observation=normalizeCapturedDevelopment(input()),id='synthetic-0') => ({id,name:'Synthetic Exact Variant',screenshotState:{development:observation}});
function fixture() {
  const champions=Array.from({length:6},(_,i)=>({id:'synthetic-'+i,name:`Synthetic ${i} — Exact Variant`,releaseState:'live',reviewStatus:'complete',factions:[],roles:[],gemColor:'Red'}));
  const champion_capture_groups=champions.map((row,i)=>({capture_group_id:'G'+i,champion:'Synthetic '+i,exact_variant:'Exact Variant',profile_anchor:`IMG_${100+i}.PNG`,group_source_filenames:[`IMG_${100+i}.PNG`],fields_as_recorded:{profile:`Legendary; level ${i?350:53}; ${i?7:5} stars; power ${i?200000:41257}; Skill level 1.`,current_skill:`**Strike** — level 1, Fast. “Synthetic strikes an enemy for 25% ATK Physical Damage.” IMG_${100+i}.PNG`}}));
  return {
    handoff:{capture_date:'2026-11-01',review_completed_date:'2026-11-02',champion_capture_groups,all_reviewed_source_filenames:champion_capture_groups.map(row=>row.profile_anchor)},
    guideData:{champions,abilities:[],traits:[],items:[],teams:[],factions:[],allyGems:[]},
    strategyData:{mechanics:[{id:'physical_damage',name:'Physical Damage',category:'damage'}],targets:[{id:'test',name:'Test battle',battleMode:'other',evidenceState:'verified',approach:'Use the modeled mechanics.',timing:'Choose a target.',warning:'Results not guaranteed.'}],rules:[{id:'r',kind:'target_fit',targetId:'test',mechanicId:'physical_damage',score:5,rationale:'Damage',evidenceCategory:'strategy_inference',provenanceRef:'synthetic:rule',confidence:1}],championFacts:[],curatedRecommendations:[]},
  };
}

test('normalizes exact profile level, earned stars and displayed power, not shard progress or Skill level',()=>{
  const f=input(),before=JSON.stringify(f),row=normalizeCapturedDevelopment(f);
  assert.deepEqual([row.level,row.stars,row.power],[53,5,41257]);assert.deepEqual(row.sourceFilenames,['IMG_100.PNG']);assert.equal(row.captureDate,'2026-11-01');assert.equal(row.reviewCompletedDate,'2026-11-02');assert.match(row.provenanceRef,/:G0:profile$/);assert.deepEqual(row.issues,[]);assert.equal(JSON.stringify(f),before);
});

test('supports captured MAX, comma-MAX, active level control, numeric stars and marked-up power',()=>{
  for(const text of ['level 350 MAX','level 200, MAX','level 296 (the level-up control is active)','level 52 with Level Up active']){
    const row=normalizeCapturedDevelopment(input(`Legendary; ${text}; seven stars at maximum rank; power **244,995**; skill level 10.`));
    assert.ok(row.level);assert.equal(row.stars,7);assert.equal(row.power,244995);
  }
  assert.equal(normalizeCapturedDevelopment(input('Level 1; 4 stars; power 17303')).stars,4);
});

test('missing profile values do not borrow skill, iconic, stats or max badges',()=>{
  const row=normalizeCapturedDevelopment(input('Legendary; skill level 9; iconic level 20; traits MAX; attack 50K; health 200K.'));
  assert.deepEqual([row.level,row.stars,row.power],[null,null,null]);
  assert.match(capturedDevelopmentMarkup(champion(row)),/Level unknown.*Stars unknown.*Power unknown/);
});

test('ambiguous, conflicting, partial, future and rounded profile values are withheld',()=>{
  for(const text of ['level 52 or 350','level 52; level 350','level 52 preview','level 52.5','level -52']) assert.equal(normalizeCapturedDevelopment(input(text)).level,null,text);
  for(const text of ['power 41.2K','power 41,25','power 41,257?','power 41,257 or 200,000','power 41,257; power 200,000','power 9007199254740992']) assert.equal(normalizeCapturedDevelopment(input(text)).power,null,text);
  for(const text of ['seven stars (locked)','five stars, six stars','seven stars upgrade arrow','eight of seven stars','7 of 6 stars']) assert.equal(normalizeCapturedDevelopment(input(text)).stars,null,text);
  const duplicate=normalizeCapturedDevelopment(input('level 52; level 52; power 41,257; power 41,257'));
  assert.equal(duplicate.level,52);assert.equal(duplicate.power,41257);
});

test('unresolved field conflicts withhold only disputed profile values',()=>{
  const f=input();f.conflicts=[{field:'Power',conflict:'Two values.'},{field:'skill level',conflict:'Skill disagreement.'},{field:'DEF',conflict:'Two DEF values.'}];
  const row=normalizeCapturedDevelopment(f);assert.equal(row.power,null);assert.equal(row.level,53);assert.equal(row.stars,5);assert.match(row.issues.join(' '),/unresolved source conflict/);
  f.conflicts[0].state='resolved_for_reviewed_build';assert.equal(normalizeCapturedDevelopment(f).power,41257);
});

test('later review replaces development as a whole and does not mislabel review date as capture',()=>{
  const f=input();f.update={review_date:'2026-11-05',current_build:{level:60,stars:6},source_files:[{file_name:'IMG_200.jpeg',library_file_id:'synthetic',local_path:'/private/not-for-display'}]};
  const row=normalizeCapturedDevelopment(f);assert.equal(row.level,60);assert.equal(row.power,null);assert.equal(row.captureDate,null);assert.equal(row.reviewCompletedDate,'2026-11-05');assert.deepEqual(row.sourceFilenames,['IMG_200.jpeg']);assert.match(row.provenanceRef,/:current_build$/);assert.doesNotMatch(JSON.stringify(row),/local_path|not-for-display/);
  const html=capturedDevelopmentMarkup(champion(row));assert.match(html,/Reviewed 2026-11-05; capture date not recorded/);assert.doesNotMatch(html,/Captured 2026-11-01/);
  f.update.capture_date='2026-11-04';assert.match(capturedDevelopmentMarkup(champion(normalizeCapturedDevelopment(f))),/Captured 2026-11-04; reviewed 2026-11-05/);
});

test('invalid structured values remain unknown instead of coercing strings, zeros or negatives',()=>{
  const f=input();f.update={review_date:'2026-11-05',current_build:{level:'350',stars:-1,champion_rating:0},source_files:[{file_name:'IMG_200.jpeg'}]};
  const row=normalizeCapturedDevelopment(f);assert.deepEqual([row.level,row.stars,row.power],[null,null,null]);assert.equal(row.issues.length,3);
});

test('display requires a dated, sourced observation bound to this exact variant',()=>{
  for(const change of [{variantId:'another'},{sourceFilenames:[]},{sourceFilenames:'not-an-array'},{provenanceRef:null},{captureDate:null,reviewCompletedDate:null}]){
    const c=champion({...normalizeCapturedDevelopment(input()),...change});assert.equal(capturedDevelopment(c),null);assert.match(capturedDevelopmentMarkup(c),/unavailable for this exact variant/);
  }
  assert.equal(capturedDevelopment({id:'synthetic-0',power:999999,screenshotState:{currentBuild:{level:350,champion_rating:999999}}}),null);
});

test('range comparison is exact with no gap threshold, score or strength verdict',()=>{
  const first=champion(),second=champion({...normalizeCapturedDevelopment(input()),variantId:'synthetic-1',level:54,power:41258},'synthetic-1');
  const model=describeTeamDevelopment([first,second]),html=developmentNoticeMarkup(model);
  assert.deepEqual(model.ranges[0],{field:'level',min:53,max:54,known:2,total:2});assert.match(html,/Captured level 53 to 54/);assert.match(html,/Captured power 41,257 to 41,258/);assert.match(html,/may be a weak point/);assert.match(html,/not a battle-strength estimate/);assert.match(html,/Rankings do not yet consider level, stars or displayed power/);
  assert.match(html,/Moving legendary gear/);assert.match(html,/do not assume gear stays equipped or plan its allocation across teams/);assert.doesNotMatch(html,/large gap|power-adjusted|strength score|weakest|strongest team|recommended gear transfer/i);
});

test('power-only differences are not labeled inherent development weakness',()=>{
  const first=champion(),second=champion({...normalizeCapturedDevelopment(input()),variantId:'synthetic-1',power:300000},'synthetic-1');
  const html=developmentNoticeMarkup(describeTeamDevelopment([first,second]));assert.doesNotMatch(html,/weak point/);assert.match(html,/power alone does not establish which champion is stronger/);
});

test('unknown members remain unknown and do not become zero or a known full-lineup range',()=>{
  const summary=describeTeamDevelopment([champion(),{id:'missing'},undefined]);assert.equal(summary.missingCount,2);assert.equal(summary.ranges[0].known,1);assert.equal(summary.ranges[0].total,3);assert.equal(summary.ranges[0].min,53);
  const html=developmentNoticeMarkup(summary);assert.match(html,/1\/3 members recorded/);assert.match(html,/unverified for 2 members; missing values are not zero/);
});

test('profile rendering escapes all source metadata and issues',()=>{
  const row={...normalizeCapturedDevelopment(input()),provenanceRef:'<script>unsafe</script>',sourceFilenames:['<img src=x onerror=alert(1)>'],issues:['<svg onload=alert(1)>']};
  const html=capturedDevelopmentMarkup(champion(row));assert.doesNotMatch(html,/<script>|<img |<svg /);assert.match(html,/&lt;script&gt;/);assert.match(html,/Power 41,257/);
});

test('handoff integration normalizes profiles without adding combat facts or changing recommendations',()=>{
  const f=fixture(),before=JSON.stringify(f),data=integrateVerifiedHandoff(f),result=recommendTeam({...data,targetId:'test'});
  assert.equal(JSON.stringify(f),before);assert.equal(data.guideData.champions.length,6);assert.equal(data.strategyData.championFacts.length,6);assert.equal(data.guideData.champions[0].screenshotState.development.level,53);
  const changed=structuredClone(f);changed.handoff.champion_capture_groups[0].fields_as_recorded.profile='Legendary; level 350; 7 stars; power 999999; skill level 1.';
  const changedData=integrateVerifiedHandoff(changed),changedResult=recommendTeam({...changedData,targetId:'test'});
  assert.deepEqual(changedResult.team.map(row=>row.champion.id),result.team.map(row=>row.champion.id));assert.equal(changedResult.overallScore,result.overallScore);assert.deepEqual(changedData.strategyData.championFacts,data.strategyData.championFacts);assert.equal(changedResult.leader?.champion.id,result.leader?.champion.id);
  const resultBefore=JSON.stringify(result);developmentNoticeMarkup(describeTeamDevelopment(result.team.map(row=>row.champion)));for(const member of result.team)capturedDevelopmentMarkup(member.champion);assert.equal(JSON.stringify(result),resultBefore);
});

test('new build profile is independent of incomplete ability coverage',()=>{
  const f=fixture();delete f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill;
  const data=integrateVerifiedHandoff(f),c=data.guideData.champions[0];assert.equal(c.screenshotState.development.power,41257);assert.equal(c.reviewStatus,'partial');assert.equal(data.strategyData.championFacts.filter(row=>row.variantId===c.id).length,0);
});

function ui(data) {
  const source=fs.readFileSync(new URL('../guide.js',import.meta.url),'utf8');
  const recommendation=source.slice(source.indexOf('function recommendationMarkup('),source.indexOf('\nfunction prebattlePlanMarkup('));
  const partial=source.slice(source.indexOf('function partialRecommendationMarkup('),source.indexOf('\nfunction knowledgeMarkup('));
  const sandbox={snapshot:data.guideData,capturedDevelopmentMarkup,describeTeamDevelopment,developmentNoticeMarkup,esc:value=>String(value??''),portrait:()=>'',badge:()=>'',prebattlePlanMarkup:()=>'',wrathSynergyMarkup:()=>'',iceBrittleSynergyMarkup:()=>'',capturedAllyPairsMarkup:()=>'',conditionalEffectsMarkup:()=>''};
  vm.createContext(sandbox);vm.runInContext(recommendation+'\n'+partial,sandbox);return sandbox;
}

test('actual recommendation rendering places the limit before team cards and shows each member and substitute',()=>{
  const data=integrateVerifiedHandoff(fixture()),result=recommendTeam({...data,targetId:'test'}),sandbox=ui(data),html=sandbox.recommendationMarkup(result);
  assert.ok(html.indexOf('Ranking limits')<html.indexOf('recommendation-team'));assert.match(html,/Level 53 · 5 stars · Power 41,257/);assert.match(html,/Level 350 · 7 stars · Power 200,000/);assert.match(html,/Captured 2026-11-01; reviewed 2026-11-02/);assert.ok((html.match(/Captured build:/g)||[]).length>=result.team.length);
  assert.match(html,/Partial collection coverage:<\/strong> 6 imported exact variants/);assert.match(html,/Full-roster coverage is not established/);assert.ok(html.indexOf('Partial collection coverage')<html.indexOf('recommendation-team'));
  if(result.substitutes.length)assert.match(html.slice(html.indexOf('Substitutes and alternatives')),/Captured build:/);
});

test('partial official recommendation keeps unresolved variants unknown and explains the same ranking limit',()=>{
  const data=integrateVerifiedHandoff(fixture()),result=recommendTeam({...data,targetId:'test'});result.status='partial_curated';result.curatedRecommendation={notes:'Synthetic',members:[{position:1,variantId:'synthetic-0',displayName:'Synthetic known',isLeader:true},{position:2,variantId:null,displayName:'Synthetic unresolved',identityStatus:'unresolved'}]};
  const html=ui(data).recommendationMarkup(result);assert.match(html,/Fixed lineup/);assert.match(html,/not reranked for captured development/);assert.match(html,/Level 53/);assert.match(html,/unavailable for this exact variant/);assert.match(html,/1\/2 members recorded/);
});

test('Why this team carries source-bound profile observations without changing the selected team',()=>{
  const data=integrateVerifiedHandoff(fixture()),result=recommendTeam({...data,targetId:'test'}),before=JSON.stringify(result);
  const model=buildTeamExplanation({result,request:{intent:'explanation'},guideData:data.guideData}),html=teamExplanationMarkup({teamExplanation:model});
  assert.match(html,/Level 53 · 5 stars · Power 41,257/);assert.match(html,/without a stars, level or displayed-power preference/);assert.ok(model.sourceRefs.includes('screenshot-handoff:2026-11-01:G0:profile'));assert.equal(JSON.stringify(result),before);
  assert.match(html,/Partial collection coverage/);assert.match(html,/missing champions or ability details can change them/);
});

test('active mode policy replaces the old stars-excluded notice in cards and explanations',()=>{
  const data=integrateVerifiedHandoff(fixture()),result=recommendTeam({...data,targetId:'test'});
  result.rankingPolicy={id:'synthetic-mode-policy',active:true,summary:'Prefer source-confirmed seven-star contributors, then modeled team fit.',scoreMeaning:'Mechanics score, not battle strength.',limitations:['No power weighting.','<script>Do not render</script>'],sourceRefs:['synthetic:preference']};
  const model=buildTeamExplanation({result,request:{intent:'explanation'},guideData:data.guideData});
  for(const html of [ui(data).recommendationMarkup(result),teamExplanationMarkup({teamExplanation:model})]){
    assert.match(html,/Mode-specific ranking/);assert.match(html,/Prefer source-confirmed seven-star contributors/);assert.doesNotMatch(html,/Rankings do not yet consider level, stars|Development is not ranked|<script>/);assert.match(html,/Mechanics score, not battle strength/);assert.match(html,/&lt;script&gt;/);
  }
  assert.ok(model.sourceRefs.includes('synthetic:preference'));
});
