import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { integrateVerifiedHandoff, collectionExclusions, extractReviewedAbilities } from '../verified-handoff.js';
import { recommendTeam } from '../strategy-engine.js';
import { mountLocalHandoffControls, isLocalHandoffHost } from '../local-handoff-controls.js';

function fixture(count=5) {
  const champion_capture_groups=Array.from({length:count},(_,i)=>({capture_group_id:'G'+i,champion:'Example '+i,exact_variant:'Exact One',duplicate_of_group_id:null,profile_anchor:`IMG_${100+i}.PNG`,group_source_filenames:[`IMG_${100+i}.PNG`],fields_as_recorded:{profile:'Level 1; skill level 1.',traits:'**Current Leader** — Leader, Once. “When an ally is defeated, gain 1 Coin Gem.” Five-star locked upgrade: “All allies gain 80% Stamina.” IMG_'+(100+i)+'.PNG',current_skill:'**Current Strike** — level 1, Slow. “Example strikes an enemy for 25% ATK Physical Damage.” Next-level preview: “+5% ATK Physical Damage.” IMG_'+(100+i)+'.PNG'}}));
  const handoff={capture_date:'2026-11-04',review_completed_date:'2026-11-05',champion_capture_groups,all_reviewed_source_filenames:champion_capture_groups.flatMap(row=>row.group_source_filenames),faction_panels:[],material_conflicts_and_gaps:[],interpretation_rules:['Locked previews are not current effects.']};
  const champions=Array.from({length:count+1},(_,i)=>({id:'c'+i,name:'Example '+i+' — Exact One',rarity:'Legendary',gemColor:'Red',reviewStatus:'complete',releaseState:'live',factions:[],roles:[],portrait:null}));
  const guideData={version:'base',champions,abilities:champions.map(row=>({id:'old-'+row.id,variantId:row.id,kind:'skill',name:'Old Max Skill',text:'Old 999% ATK Physical Damage.',reviewStatus:'complete'})),traits:[],items:[],factions:[],factionActivations:[],teams:[],allyGems:[]};
  const strategyData={version:'base',mechanics:[{id:'physical_damage',name:'Physical Damage',category:'damage'},{id:'stamina',name:'Stamina',category:'support'},{id:'shield',name:'Shield',category:'support'},{id:'cleanse',name:'Cleanse',category:'support'}],targets:[{id:'test',name:'Test',battleMode:'other',evidenceState:'verified',approach:'test',timing:'test',warning:'test'}],rules:[{id:'r',kind:'target_fit',targetId:'test',mechanicId:'physical_damage',score:5,rationale:'Damage',evidenceCategory:'strategy_inference',provenanceRef:'test:r',confidence:1}],championFacts:champions.map(row=>({id:'f'+row.id,variantId:row.id,mechanicId:'physical_damage',context:'skill',factText:'Old 999% skill',provenanceRef:'old:'+row.id,confidence:1,reviewStatus:'complete'})),curatedRecommendations:[]};
  return {handoff,guideData,strategyData};
}

test('current quotes replace old mechanics without mutating inputs or including locked previews',()=>{
  const f=fixture(), before=JSON.stringify(f),r=integrateVerifiedHandoff(f);
  assert.equal(JSON.stringify(f),before);
  assert.equal(r.guideData.verifiedCollection.variantIds.length,5);
  assert.equal(r.strategyData.championFacts.filter(row=>row.captureDate).length,5);
  for(const row of r.strategyData.championFacts.filter(row=>row.captureDate)) {assert.match(row.factText,/25%/);assert.doesNotMatch(row.factText,/999|preview|80%/);assert.ok(row.sourceFilenames.length);assert.match(row.provenanceRef,/screenshot-handoff/);}
  assert.ok(!r.guideData.abilities.some(row=>row.variantId==='c0'&&row.name==='Old Max Skill'));
  assert.equal(r.guideData.verifiedCollection.records.find(row=>row.kind==='skill').displayedSkillLevel,1);
});

test('snapshot collection limits recommendations and rejects required nonmembers',()=>{
  const r=integrateVerifiedHandoff(fixture());
  assert.deepEqual(collectionExclusions(r.guideData),['c5']);
  const result=recommendTeam({...r,targetId:'test'});
  assert.equal(result.status,'ready'); assert.equal(result.team.length,5); assert.ok(result.team.every(row=>row.champion.id!=='c5'));
  assert.match(result.missingDataWarnings.join(' '),/dated snapshot/);
  assert.equal(recommendTeam({...r,targetId:'test',requiredVariantIds:['c5']}).status,'no_feasible_team');
});

test('declared same-identity duplicate is explicit, undeclared or mismatched duplicate fails closed',()=>{
  const f=fixture(1),duplicate={...structuredClone(f.handoff.champion_capture_groups[0]),capture_group_id:'COPY',duplicate_of_group_id:'G0'};
  f.handoff.champion_capture_groups.push(duplicate);
  const r=integrateVerifiedHandoff(f);
  assert.equal(r.audit.duplicates.length,1);assert.equal(r.guideData.verifiedCollection.variantIds.length,1);
  duplicate.duplicate_of_group_id=null;
  assert.throws(()=>integrateVerifiedHandoff(f),/Undeclared duplicate/);
  duplicate.duplicate_of_group_id='G0';duplicate.exact_variant='Other';
  assert.throws(()=>integrateVerifiedHandoff(f),/Invalid declared duplicate/);
});

test('exact public identity registry preserves IDs; bare names do not merge variants',()=>{
  const f=fixture(1);f.guideData.champions[0].name='Example 0';
  const r=integrateVerifiedHandoff(f);
  assert.match(r.audit.mappings[0].variantId,/^local-verified:/);
  const mapped=integrateVerifiedHandoff({...f,identities:[{variantId:'c0',championName:'Example 0',exactVariant:'Exact One',provenanceRef:'existing-profile:0'}]});
  assert.equal(mapped.audit.mappings[0].variantId,'c0');
  assert.throws(()=>integrateVerifiedHandoff({...f,identities:['c0','c1'].map(variantId=>({variantId,championName:'Example 0',exactVariant:'Exact One'}))}),/Ambiguous canonical identity/);
});

test('source omissions are not invented and missing skills do not inherit old max skills',()=>{
  const f=fixture(1);delete f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill;
  const r=integrateVerifiedHandoff(f);
  assert.equal(r.audit.missingSkills.length,1);
  assert.equal(r.guideData.abilities.filter(row=>row.variantId==='c0').length,0);
  assert.equal(r.strategyData.championFacts.filter(row=>row.variantId==='c0').length,0);
  f.handoff.champion_capture_groups[0].fields_as_recorded.traits+=' IMG_999.PNG';
  assert.throws(()=>integrateVerifiedHandoff(f),/Unreviewed ability source/);
});

test('clipped trait remains partial and immunity, tags, costs, reactions give no provider credit',()=>{
  const f=fixture(1),g=f.handoff.champion_capture_groups[0];
  g.fields_as_recorded.traits='**Clipped** — Leader. “If the team member is a …” IMG_100.PNG';
  g.fields_as_recorded.current_skill='**Misleading** — level 1; FIRE / ICE / TAUNT. “When an enemy uses a Skill, this hero HEALS an ally. TREASURY (6): Grants 50% Stamina. He then grants 50% Stamina. The hero is immune to FIRE.” IMG_100.PNG';
  const r=integrateVerifiedHandoff(f);
  assert.equal(r.audit.extractionIssues.length,1);assert.equal(r.guideData.traits[0].reviewStatus,'partial');
  assert.equal(r.strategyData.championFacts.filter(row=>row.variantId==='c0').length,0);
});

test('faction panel updates its bonus but never infers membership from the background name',()=>{
  const f=fixture(1);f.guideData.factions=[{id:'free',name:'Free Cities',memberVariantIds:['c1'],rules:[{kind:'current_bonus',text:'stamina cost reduced 35%'}]}];
  f.handoff.faction_panels=[{Faction:'Free Cities','Three-member bonus':'Stamina cost reduced 25%','How-to-play wording':'Faster Skills','Visible background name':'Example 0',source_filenames:['IMG_100.PNG']}];
  const r=integrateVerifiedHandoff(f);
  assert.deepEqual(r.guideData.factions[0].memberVariantIds,['c1']);assert.match(r.guideData.factions[0].rules[0].text,/25%/);assert.equal(r.audit.factionMembershipsInferred,0);
});

test('later structured reviews resolve build-specific conflicts and preserve inactive upgrades separately',()=>{
  const f=fixture(1);f.handoff.material_conflicts_and_gaps=[{group:'G0',field:'DEF',conflict:'Earlier discrepancy'}];
  f.handoff.review_updates=[{character:'Example 0',variant:'Exact One',review_date:'2026-11-05',current_build:{level:1,defense_display:'5.5K'},resolved_fields:['DEF'],resolved_issue:'Both newer panels agree for this build.',source_files:[{file_name:'IMG_200.jpeg',library_file_id:'synthetic-reviewed-file'}],skill:{name:'New Shield',level:1,text:'Example grants a team member a 75% DEF SHIELD and REMOVES 1 Debuffs from them.',next_level_upgrade:'+5% SHIELD power',sources:['IMG_200.jpeg']},traits:[{name:'Complete Leader',badges:['Leader'],current_text:'When an ally uses a Skill, spawn 1 Coin Gem.',sources:['IMG_200.jpeg'],locked_upgrades:[{star_rank:5,text:'Gain 80% Stamina.'}]}]}];
  const r=integrateVerifiedHandoff(f),record=r.guideData.verifiedCollection.records.find(row=>row.kind==='skill');
  assert.equal(record.displayedSkillLevel,1);assert.equal(record.lockedPreview,'+5% SHIELD power');assert.doesNotMatch(record.text,/\+5%/);
  assert.match(record.provenanceRef,/screenshot-review:2026-11-05/);assert.equal(record.sourceIdentities[0].library_file_id,'synthetic-reviewed-file');
  assert.equal(r.audit.conflicts[0].state,'resolved_for_reviewed_build');
  assert.equal(r.guideData.champions[0].screenshotState.currentBuild.defense_display,'5.5K');
  assert.deepEqual(r.strategyData.championFacts.filter(row=>row.variantId==='c0').map(row=>row.mechanicId).sort(),['cleanse','shield']);
});

test('all-public builds have no personal handoff fixture or runtime storage/network import',()=>{
  for(const host of ['localhost','127.0.0.1','[::1]'])assert.equal(isLocalHandoffHost(host),true);
  for(const host of ['example.com','localhost.example.com','192.168.1.1',''])assert.equal(isLocalHandoffHost(host),false);
  const source=fs.readFileSync(new URL('../local-handoff-controls.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
  assert.match(source,/request !== generation/);
  assert.match(source,/generation\+\+; panel.remove/);
});

function fakeDOM(){
  const elements=Object.fromEntries(['input','button','[role="status"]'].map(key=>[key,{handlers:{},value:'',addEventListener(type,callback){this.handlers[type]=callback;}}]));
  const panel={querySelector:key=>elements[key],remove(){this.removed=true;}};
  return {elements,panel,document:{createElement:()=>panel},anchor:{after(value){assert.equal(value,panel);}}};
}

test('local import clear cancels an in-flight file read and never reapplies after navigation',async()=>{
  const original=globalThis.document,dom=fakeDOM(),f=fixture();globalThis.document=dom.document;
  let resolve,applies=0,resets=0;
  try {
    const destroy=mountLocalHandoffControls({...f,anchor:dom.anchor,hostname:'localhost',onApply:()=>applies++,onReset:()=>resets++});
    dom.elements.input.files=[{size:100,text:()=>new Promise(done=>resolve=done)}];
    const pending=dom.elements.input.handlers.change();dom.elements.button.handlers.click();resolve(JSON.stringify(f.handoff));await pending;
    assert.equal(applies,0);assert.equal(resets,2);
    dom.elements.input.files=[{size:100,text:()=>new Promise(done=>resolve=done)}];
    const pending2=dom.elements.input.handlers.change();destroy();resolve(JSON.stringify(f.handoff));await pending2;
    assert.equal(applies,0);assert.equal(dom.panel.removed,true);
  } finally {globalThis.document=original;}
});

test('malformed local import clears prior advice and reports failure without applying',async()=>{
  const original=globalThis.document,dom=fakeDOM(),f=fixture();globalThis.document=dom.document;
  let applies=0,resets=0;
  try {
    mountLocalHandoffControls({...f,anchor:dom.anchor,hostname:'localhost',onApply:()=>applies++,onReset:()=>resets++});
    dom.elements.input.files=[{size:2,text:async()=>'{!'}];await dom.elements.input.handlers.change();
    assert.equal(applies,0);assert.equal(resets,2);assert.match(dom.elements['[role="status"]'].textContent,/Import not applied/);
  } finally {globalThis.document=original;}
});

test('catalog-only import exposes captured builds and abilities without fabricating strategy data',()=>{
  const f=fixture(1);
  const r=integrateVerifiedHandoff({...f,strategyData:null});
  assert.equal(r.strategyData,null);
  assert.equal(r.guideData.verifiedCollection.variantIds.length,1);
  assert.equal(r.guideData.champions.find(row=>row.id==='c0').screenshotState.profileText,'Level 1; skill level 1.');
  assert.equal(r.guideData.abilities.find(row=>row.variantId==='c0').name,'Current Strike');
  assert.equal(r.guideData.traits.find(row=>row.variantId==='c0').name,'Current Leader');
});

test('catalog-only page mounts the file picker and applies a guide-only overlay',async()=>{
  const original=globalThis.document,dom=fakeDOM(),f=fixture(1);globalThis.document=dom.document;
  let applied=null;
  try {
    const destroy=mountLocalHandoffControls({...f,strategyData:null,anchor:dom.anchor,hostname:'localhost',onApply:value=>{applied=value;},onReset:()=>{}});
    assert.equal(typeof dom.elements.input.handlers.change,'function');
    dom.elements.input.files=[{size:100,text:async()=>JSON.stringify(f.handoff)}];
    await dom.elements.input.handlers.change();
    assert.ok(applied);
    assert.equal(applied.strategyData,null);
    assert.equal(applied.guideData.champions.find(row=>row.id==='c0').screenshotState.captureDate,'2026-11-04');
    assert.match(dom.elements['[role="status"]'].textContent,/1 exact variants/);
    destroy();
  } finally {globalThis.document=original;}
});

test('friendly True Damage is a skill cost, never offensive True Damage',()=>{
  const f=fixture(1);
  f.guideData.champions[0].name='Example 0 — Exact One';
  f.strategyData.mechanics.push({id:'true_damage',name:'True Damage',category:'damage'});
  f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill='**Sacrifice And Shield** — level 1. “Alliser deals 10% Current HP True Damage to the Strongest team member, then grants a target team member a SHIELD equal to 90% ATK.” IMG_100.PNG';
  const r=integrateVerifiedHandoff(f);
  assert.deepEqual(r.strategyData.championFacts.filter(row=>row.variantId==='c0').map(row=>row.mechanicId),['shield']);
  assert.match(r.guideData.abilities.find(row=>row.variantId==='c0').text,/10% Current HP True Damage to the Strongest team member/);
});

test('unestablished resource consumption blocks both initial and continuation effects',()=>{
  const f=fixture(1);
  f.strategyData.mechanics.push({id:'stealth',name:'Stealth',category:'survivability'});
  f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill='**Conditional Reinforcement** — level 1. “Mance consumes 1 WILDLING HORDE, to gain STEALTH for 3 turns and replace his allies with Free Folk Raiders; each with 35% HP and 75% Stamina. Then Mance and his allies strike an enemy for 100% ATK Physical Damage.” IMG_100.PNG';
  const r=integrateVerifiedHandoff(f);
  assert.equal(r.strategyData.championFacts.filter(row=>row.variantId==='c0').length,0);
  assert.match(r.guideData.abilities.find(row=>row.variantId==='c0').text,/consumes 1 WILDLING HORDE/);
});

test('explicit enemy damage remains scoreable when a different clause grants allies a buff',()=>{
  const f=fixture(1);
  f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill='**Buff Then Strike** — level 1. “Tyrion grants his allies a +5% Power Buff for 3 turns, then strikes an enemy for 150% ATK Physical Damage.” IMG_100.PNG';
  const r=integrateVerifiedHandoff(f);
  assert.deepEqual(r.strategyData.championFacts.filter(row=>row.variantId==='c0').map(row=>row.mechanicId),['physical_damage']);
});

function statusFixture(text,count=1) {
  const f=fixture(count);
  f.strategyData.mechanics.push(...['ice','wound','fire'].map(status=>({id:'apply_'+status,name:status.toUpperCase(),category:'status'})));
  f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill=`**Status Strike** — level 1. “${text}” IMG_100.PNG`;
  return f;
}
const statusFacts=result=>result.strategyData.championFacts.filter(row=>row.variantId==='c0'&&row.mechanicId.startsWith('apply_'));

test('explicit passive enemy ICE application is a provider, with the complete source retained',()=>{
  const text='Example strikes an enemy for 225% ATK Physical Damage and strikes adjacent enemies for 120% ATK Physical Damage. Each of these enemies become afflicted with 2 ICE.';
  const result=integrateVerifiedHandoff(statusFixture(text));
  assert.deepEqual(statusFacts(result).map(row=>row.mechanicId),['apply_ice']);
  assert.equal(statusFacts(result)[0].supportingClause,'Each of these enemies become afflicted with 2 ICE.');
  assert.equal(statusFacts(result)[0].fullSourceText,text);
  assert.match(statusFacts(result)[0].provenanceRef,/G0:current_skill:IMG_100.PNG/);
});

test('WOUNDS applies WOUND without needing a duplicate status noun or conditional extension',()=>{
  const text='Example deals 125% ATK Physical Damage to all enemies and WOUNDS them for 2 turns. Enemies who were HEALED during their last turn will take 375% ATK Bonus Physical Damage and are WOUNDED for an additional 3 turns.';
  const result=integrateVerifiedHandoff(statusFixture(text));
  assert.deepEqual(statusFacts(result).map(row=>row.mechanicId),['apply_wound']);
  assert.equal(statusFacts(result)[0].supportingClause,text.split('. ')[0]+'.');
  assert.doesNotMatch(statusFacts(result)[0].factText,/375%|additional 3/);
  assert.equal(statusFacts(result)[0].fullSourceText,text);
});

test('an earlier allied buff does not hide a later explicitly enemy-targeted FIRE clause',()=>{
  const text='Example grants all team members 1 FURY, then deals 300% ATK Fire Damage to an enemy, and afflicts them with 1 FIRE. When ENRAGED, she deals an additional 400% ATK Fire Damage to all enemies, and afflicts them with 1 FIRE.';
  const result=integrateVerifiedHandoff(statusFixture(text));
  assert.deepEqual(statusFacts(result).map(row=>row.mechanicId),['apply_fire']);
  assert.doesNotMatch(statusFacts(result)[0].factText,/When ENRAGED|400%/);
  assert.equal(statusFacts(result)[0].fullSourceText,text);
});

test('recovered status providers participate in the existing team rules, with no new weight',()=>{
  const f=statusFixture('Example strikes an enemy for 25% ATK Physical Damage. Each of these enemies become afflicted with 2 ICE.',5);
  f.strategyData.rules.push({id:'synthetic-ice-fit',kind:'target_fit',targetId:'test',mechanicId:'apply_ice',score:2,rationale:'Synthetic ICE fit.',evidenceCategory:'strategy_inference',provenanceRef:'synthetic:rule',confidence:1});
  const r=integrateVerifiedHandoff(f),result=recommendTeam({...r,targetId:'test'});
  const member=result.team.find(row=>row.champion.id==='c0');
  assert.equal(member.score,7);
  assert.equal(member.scoringContributions.find(row=>row.mechanicId==='apply_ice').score,2);
  assert.match(member.scoringContributions.find(row=>row.mechanicId==='apply_ice').factProvenanceRef,/screenshot-handoff/);
});

test('status grammar does not create providers from friendly targets, state, negation or missing antecedents',()=>{
  for(const text of [
    'Each of these allies become afflicted with 2 ICE.',
    'Each of these enemies are afflicted with 2 ICE.',
    'Each of these enemies do not become afflicted with 2 ICE.',
    'Example WOUNDS a team member for 2 turns.',
    'Example WOUNDS them for 2 turns.',
    'An enemy WOUNDS them for 2 turns.',
    'Example deals 10% ATK Physical Damage to a team member and WOUNDS them for 2 turns.',
    'Example grants all allies 1 FURY, then afflicts them with 1 FIRE.',
    'Example does not afflict an enemy with FIRE.',
    'Example strikes an enemy for 25% ATK Physical Damage. Enemies who were HEALED are WOUNDED for an additional 3 turns.',
  ])assert.deepEqual(statusFacts(integrateVerifiedHandoff(statusFixture(text))),[],text);
});

test('conditional, partial and locked status wording still earns no provider credit',()=>{
  for(const text of [
    'If a target is BRITTLE, each of these enemies become afflicted with 2 ICE.',
    'Example consumes 1 TOKEN. Each of these enemies become afflicted with 2 ICE.',
    'When an enemy is HEALED, Example WOUNDS that enemy for 2 turns.',
    'Example deals 125% ATK Physical Damage to all enemies and WOUNDS them for 2 turns…',
  ])assert.deepEqual(statusFacts(integrateVerifiedHandoff(statusFixture(text))),[],text);
  const f=statusFixture('Example strikes an enemy for 25% ATK Physical Damage.');
  f.handoff.champion_capture_groups[0].fields_as_recorded.current_skill+=' Locked preview: “Each of these enemies become afflicted with 2 ICE.” IMG_100.PNG';
  assert.deepEqual(statusFacts(integrateVerifiedHandoff(f)),[]);
});

test('later clipped skill and iconic reviews remain partial and cannot score',()=>{
  const f=fixture(1);
  f.handoff.review_updates=[{character:'Example 0',variant:'Exact One',review_date:'2026-11-05',current_build:{level:1},source_files:[{file_name:'IMG_200.jpeg',library_file_id:'synthetic-reviewed-file'}],skill:{name:'Clipped Strike',level:1,text:'Example strikes an enemy for 25% ATK Physical Damage…',sources:['IMG_200.jpeg']},iconic:{name:'Clipped Item',ability_name:'Item Ability I',level:1,text:'Whenever an ally uses their skill…',sources:['IMG_200.jpeg']}}];
  const r=integrateVerifiedHandoff(f);
  assert.equal(r.guideData.abilities.find(row=>row.variantId==='c0').reviewStatus,'partial');
  assert.equal(r.guideData.items.find(row=>row.ownerVariantId==='c0').abilities[0].reviewStatus,'partial');
  assert.equal(r.strategyData.championFacts.filter(row=>row.variantId==='c0').length,0);
  assert.equal(r.audit.extractionIssues.filter(row=>row.reason.startsWith('Clipped later-review')).length,2);
});

for (const kind of ['skill','iconic']) test(`reviewed ${kind} level rejects inert markup instead of reaching innerHTML`,()=>{
  const f=fixture(1);
  const update={character:'Example 0',variant:'Exact One',review_date:'2026-11-05',current_build:{level:1},source_files:[{file_name:'IMG_200.jpeg',library_file_id:'synthetic-reviewed-file'}]};
  update[kind]={name:'Example ability',ability_name:'Example item I',level:'<img data-test="inert">',text:'Example strikes an enemy for 25% ATK Physical Damage.',sources:['IMG_200.jpeg']};
  f.handoff.review_updates=[update];
  assert.throws(()=>integrateVerifiedHandoff(f),new RegExp(`Reviewed ${kind} level must be a positive integer`));
  for(const level of [-1,0,1.5,NaN,'1']){update[kind].level=level;assert.throws(()=>integrateVerifiedHandoff(f),/level must be a positive integer/);}
  update[kind].level=1;
  assert.doesNotThrow(()=>integrateVerifiedHandoff(f));
});

test('ability metadata renderer escapes level values even if supplied outside the importer',()=>{
  const source=fs.readFileSync(new URL('../guide.js',import.meta.url),'utf8');
  assert.match(source,/'Shown skill level '\+esc\(ability\.displayedSkillLevel\)/);
  assert.match(source,/'Shown item level '\+esc\(ability\.itemLevel\)/);
  assert.doesNotMatch(source,/'Shown (?:skill|item) level '\+ability\./);
});

test('unverified named effects remain explicit zero-score definition gaps',()=>{
  const f=fixture(1),group=f.handoff.champion_capture_groups[0];
  group.fields_as_recorded.traits='**Unknown Mark** — Leader. “All allies start with 1 BRIGHTFLAME and 1 HOLY PURPOSE.” IMG_100.PNG';
  group.fields_as_recorded.current_skill='**Independent Strike** — level 1. “Example strikes an enemy for 25% ATK Physical Damage and afflicts them with DRAGON FOLLOWER.” IMG_100.PNG';
  const r=integrateVerifiedHandoff(f);
  assert.deepEqual(r.guideData.verifiedCollection.definitionGaps.map(row=>row.effectName).sort(),['BRIGHTFLAME','DRAGON FOLLOWER','HOLY PURPOSE']);
  assert.ok(r.guideData.verifiedCollection.definitionGaps.every(row=>row.status==='definition_unverified'&&row.scoringContribution===0&&row.sourceRefs.length));
  assert.equal(r.guideData.champions.find(row=>row.id==='c0').screenshotState.definitionGaps.length,3);
  assert.deepEqual(r.strategyData.championFacts.filter(row=>row.variantId==='c0').map(row=>row.mechanicId),['physical_damage']);
});

test('source-linked tooltip updates remove missing-definition warnings without changing facts or unimplemented support gates',()=>{
  const f=fixture(1),g=f.handoff.champion_capture_groups[0];
  g.fields_as_recorded.traits='**Unknown Marks** — Leader. “All allies start with BRIGHTFLAME and HOLY PURPOSE.” IMG_100.PNG';
  g.fields_as_recorded.current_skill='**Marked Strike** — level 1. “Example strikes an enemy for 25% ATK Physical Damage and afflicts them with DRAGON FOLLOWER.” IMG_100.PNG';
  const before=integrateVerifiedHandoff(f);
  f.handoff.effect_definition_updates=['BRIGHTFLAME','HOLY PURPOSE','DRAGON FOLLOWER'].map(effect=>({effect,title:effect,definition:'Synthetic reviewed definition of '+effect+'.',remaining:['Additional rules are not supplied.'],readability:'complete_popup_visually_readable',review_date:'2000-01-01',applies_to:[{capture_group_id:g.capture_group_id,champion:g.champion,exact_variant:g.exact_variant}],screenshot:'synthetic-tooltip.png',source:{file_name:'synthetic-tooltip.png',library_file_id:'synthetic-tooltip'}}));
  const after=integrateVerifiedHandoff(f);
  assert.equal(after.guideData.verifiedCollection.definitionGaps.length,0);
  assert.ok(after.guideData.verifiedCollection.supportModelGaps.every(row=>row.status==='support_model_unimplemented'));
  assert.deepEqual(after.strategyData.championFacts,before.strategyData.championFacts);
  assert.deepEqual(after.guideData.verifiedCollection.variantIds,before.guideData.verifiedCollection.variantIds);
  assert.equal(after.audit.effectDefinitionUpdates.captured,3);
  assert.equal(after.guideData.champions[0].strategyInterpretationStatus,'partial');
});
