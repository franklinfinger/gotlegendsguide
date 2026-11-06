import test from 'node:test';
import assert from 'node:assert/strict';
import {integrateVerifiedHandoff} from '../verified-handoff.js';
import {abilityDisplayName,unconditionalSkillClauses} from '../reviewed-ability-sections.js';
import {prepareEvidenceSnapshot,restoreEvidenceSnapshot} from '../private-access/src/evidence.js';
import {privateGuideModel} from '../private-access/src/guide-model.js';
import {answerGuideQuestion} from '../knowledge-engine.js';

function fixture(){
 const source={file_name:'IMG_9001.jpeg',library_file_id:'synthetic-file',source_message_id:'synthetic-message',uploaded_at:'2026-01-01T00:00:00Z'};
 const sections=[{section_id:'skill',kind:'skill',context:'skill',name:null,name_limit:'Name covered; not reconstructed.',text:'Example afflicts an enemy with 1 BLEED then strikes them for 10% ATK Physical Damage for each BLEED. She then gains a +20% Dodge Buff and grants all allies STEALTH for 3 turns.',body_status:'complete',sources:[source.file_name],inferred_skill_level:2,level_inference_basis:'Next Level 3 shown; current label hidden.',next_level_preview:{text:'Level 3: +5% Dodge Buff',current:false},limits:['Damage varies with BLEED; no fixed total inferred.']},
 {section_id:'leader',kind:'trait',context:'leader',name:'Visible Leader',text:'All team members start the battle with a 10% Dodge Buff. When a',body_status:'partial',completeness_note:'Ending covered.',sources:[source.file_name]}];
 const handoff={capture_date:'2026-01-01',all_reviewed_source_filenames:['IMG_9000.jpeg'],champion_capture_groups:[{capture_group_id:'G1',champion:'Example',exact_variant:'Exact One',profile_anchor:'IMG_9000.jpeg',group_source_filenames:['IMG_9000.jpeg'],fields_as_recorded:{profile:'Level 20; 2 stars; power 999.'}}],ability_section_reviews:[{capture_group_id:'G1',champion:'Example',exact_variant:'Exact One',capture_date:null,review_date:'2026-01-02',policy:'fill_missing_sections_only',source_files:[source],sections}]};
 const guideData={version:'test',champions:[{id:'c1',name:'Example — Exact One',factions:[],roles:[],releaseState:'live'}],abilities:[{id:'old',variantId:'c1',name:'Old Skill',text:'Forbidden 999% body',kind:'skill',reviewStatus:'complete'}],traits:[],items:[],factions:[],statuses:[],mechanics:[],allyGems:[]};
 const strategyData={version:'test',championFacts:[],curatedRecommendations:[],rules:[],targets:[],mechanics:['physical_damage','apply_bleed','shield','stealth'].map(id=>({id,name:id}))};
 return {handoff,guideData,strategyData};
}

test('unnamed complete body and partial trait integrate without altering profiles or borrowing titles',()=>{
 const f=fixture(),before=JSON.stringify(f),r=integrateVerifiedHandoff(f),skill=r.guideData.abilities[0];
 assert.equal(JSON.stringify(f),before);assert.equal(skill.name,null);assert.equal(abilityDisplayName(skill),'Skill (name not visible)');
 assert.equal(skill.displayedSkillLevel,null);assert.equal(skill.inferredSkillLevel,2);assert.equal(skill.captureDate,null);assert.equal(skill.reviewCompletedDate,'2026-01-02');
 assert.equal(skill.sourceIdentities[0].library_file_id,'synthetic-file');assert.doesNotMatch(skill.text,/\+5%|Forbidden/);
 assert.equal(r.guideData.champions[0].screenshotState.profileText,'Level 20; 2 stars; power 999.');
 assert.equal(r.guideData.champions[0].reviewStatus,'partial');assert.equal(r.guideData.traits[0].reviewStatus,'partial');
 assert.deepEqual(r.audit.abilitySectionReviews,{groups:1,records:2,completeBodies:1,partialBodies:1});
 assert.deepEqual(r.strategyData.championFacts.map(row=>row.mechanicId).sort(),['apply_bleed','stealth']);
 assert.ok(r.strategyData.championFacts.every(row=>row.captureDate===null&&row.reviewCompletedDate==='2026-01-02'));
});

test('conditioned damage is never an unconditional total or a shield provider',()=>{
 const f=fixture(),section=f.handoff.ability_section_reviews[0].sections[0];
 section.name='Visible Strike';section.text='Example deals 35% Depose ATK Physical Damage to an enemy. If he has a SHIELD, Example deals 40% SHIELD bonus damage.';
 const r=integrateVerifiedHandoff(f);assert.deepEqual(r.strategyData.championFacts.map(row=>row.mechanicId),['physical_damage']);
 assert.doesNotMatch(r.strategyData.championFacts[0].supportingClause,/40%|SHIELD/);
 assert.match(r.guideData.abilities[0].text,/If he has a SHIELD/);
});

test('strict source/identity/completeness validation fails closed',()=>{
 for(const mutate of [r=>r.exact_variant='Other',r=>r.source_files[0].source_message_id=null,r=>r.sections[0].sources=['missing'],r=>r.sections[0].displayed_skill_level=2,r=>r.sections[0].next_level_preview.current=true,r=>r.sections[1].completeness_note=null,r=>r.sections[0].text+='…',r=>r.sections[0].name_limit=null,r=>r.sections.push({...r.sections[0]})]){
  const f=fixture();mutate(f.handoff.ability_section_reviews[0]);assert.throws(()=>integrateVerifiedHandoff(f),/Ability section review/);
 }
 const f=fixture();f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill='**Current** — “Example strikes an enemy for 1% ATK Physical Damage.” IMG_9000.jpeg';
 assert.throws(()=>integrateVerifiedHandoff(f),/already has that ability category/);
});

test('generic count grammar cannot strip trigger, cost, chance or continuation conditions',()=>{
 const body=fixture().handoff.ability_section_reviews[0].sections[0].text;
 assert.equal(unconditionalSkillClauses(body).length,2);
 for(const prefix of ['If a team member falls, ','When an ally attacks, ','Example consumes 1 token. ','There is a 50% chance. ', 'If ', 'When '])assert.equal(unconditionalSkillClauses(prefix+body).length,0);
 assert.equal(unconditionalSkillClauses('Example strikes an enemy for 10% ATK Physical Damage for each BLEED. She then gains STEALTH.').length,0);
 assert.equal(unconditionalSkillClauses('Example afflicts an enemy with 1 BLEED then strikes them for 10% ATK Physical Damage for each FIRE. She then gains STEALTH.').length,0);
});

test('saved snapshot and private projection retain section provenance and expose complete unnamed skill answers',()=>{
 const f=fixture(),saved=prepareEvidenceSnapshot(f).snapshot;
 const r=restoreEvidenceSnapshot({snapshot:JSON.parse(JSON.stringify(saved)),guideData:f.guideData,strategyData:f.strategyData});
 const model=privateGuideModel({...r,variantIds:['c1'],evidenceRevision:2});
 assert.equal(model.ready,true);assert.equal(model.guide.abilities[0].name,null);assert.equal(model.guide.traits[0].reviewStatus,'partial');
 assert.equal(model.guide.verifiedCollection.reviewedAbilitySections.length,1);assert.deepEqual(model.guide.verifiedCollection.reviewDates,['2026-01-02']);
 const answer=answerGuideQuestion({question:'Example skill',guideData:model.guide,strategyData:model.strategy});
 assert.equal(answer.entries[0].facts[0].title,'Skill (name not visible)');assert.match(answer.entries[0].facts[0].wording,/Name covered/);
 const partial=answerGuideQuestion({question:'Example traits',guideData:model.guide,strategyData:model.strategy});
 assert.equal(partial.entries[0].facts[0].kind,'Trait (partial excerpt)');assert.match(partial.entries[0].facts[0].wording,/Ending covered/);
 assert.equal(model.guide.historicalEffectReferences.length,0);
});

test('combined skill and trait queries include both categories',()=>{
 const f=fixture(),r=integrateVerifiedHandoff(f);
 for(const question of ['Example skill and trait','Example skills and traits']){
 const answer=answerGuideQuestion({question,guideData:r.guideData,strategyData:r.strategyData});
 assert.deepEqual(answer.entries[0].facts.map(row=>row.kind),['Skill','Trait (partial excerpt)']);
 }
});
