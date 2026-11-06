import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectEffectDefinitions } from '../effect-definition-status.js';
const inspect=text=>inspectEffectDefinitions([{text,reviewStatus:'complete',provenanceRef:'synthetic:ability',sourceFilenames:['synthetic.png']}]);

test('missing, partially explained, and defined-with-quantitative-gaps remain distinct',()=>{
  const result=inspect('Grant BRIGHTFLAME, HOLY PURPOSE, WRATH and BIRTHRIGHT.');
  const state=name=>result.find(row=>row.effectName===name)?.definitionState;
  assert.equal(state('BRIGHTFLAME'),'absent');assert.equal(state('HOLY PURPOSE'),'absent');
  assert.equal(state('WRATH'),'partial');assert.equal(state('BIRTHRIGHT'),'defined_quantitative_limits');
  assert.ok(result.every(row=>row.scoringContribution===0&&!row.intrinsicPayoffAssumed));
});

test('known named effects are not mislabeled as missing or silently aliased',()=>{
  assert.equal(inspect("WILDLING HORDE, BIDE, THE KHAL'S DOMINANCE, CRISTON'S CHARGE, Inspire, R'hollor's Purpose").length,0);
  assert.equal(inspect('INSPIRATION')[0].definitionState,'alias_unconfirmed');
  assert.equal(inspect('CHARGE II')[0].effectName,'CHARGE');
});

test('quoted source and curly apostrophe names retain evidence without inventing definitions',()=>{
  const result=inspect('THE HOUND’S PROTECTION and SEASMOKE’S FAVORED.');
  assert.equal(result.length,2);assert.ok(result.every(row=>row.sourceRefs[0]==='synthetic:ability:synthetic.png'));
  assert.ok(result.every(row=>row.definitionState==='partial'));
});

import { prepareEffectDefinitionUpdates, definitionIsUnresolved } from '../effect-definition-status.js';
import { effectCoverageMarkup, tooltipEvidenceMarkup, tooltipGlossaryEntries } from '../effect-definition-view.js';
function evidence(effect,definition='Exact reviewed definition.',extra={}) {
  return {effect,title:effect,definition,readability:'complete_popup_visually_readable',review_date:'2000-01-01',remaining:[],applies_to:[{capture_group_id:'EXAMPLE',champion:'Example',exact_variant:'Exact'}],screenshot:'synthetic-tooltip.png',source:{file_name:'synthetic-tooltip.png',library_file_id:'synthetic-tooltip',local_path:'/private/synthetic.png',version:0},...extra};
}
const groups=new Map([['EXAMPLE',{capture_group_id:'EXAMPLE',champion:'Example',exact_variant:'Exact'}]]);
const records=text=>[{text,captureGroupId:'EXAMPLE',variantId:'example',reviewStatus:'complete',provenanceRef:'synthetic:ability',sourceFilenames:['synthetic-ability.png']}];
const prepare=(updates,text)=>prepareEffectDefinitionUpdates(updates,groups,records(text));

test('complete definitions resolve absent/partial states without claiming all rule details are known',()=>{
  const updates=prepare([evidence('BRIGHTFLAME','Grants an indefinite +5% POWER Buff',{remaining:['Stack cap and removal rules are not supplied.']}),evidence('JUSTICE','This Seeker Gem deals 75% ATK Physical Damage and applies 1 ICE to the enemy it hits.')],'Grant BRIGHTFLAME and spawn Justice Gems.');
  const coverage=inspectEffectDefinitions(records('Grant BRIGHTFLAME and spawn Justice Gems.'),updates);
  const bright=coverage.find(row=>row.effectName==='BRIGHTFLAME'),justice=coverage.find(row=>row.effectName==='Justice Gem');
  assert.equal(bright.definitionState,'captured_definition');assert.equal(justice.definitionReviewStatus,'complete');
  assert.equal(bright.known,'Grants an indefinite +5% POWER Buff');assert.match(bright.unresolved,/cap and removal/);
  assert.equal(definitionIsUnresolved(bright),false);assert.equal(bright.intrinsicPayoffAssumed,false);assert.equal(bright.scoringContribution,0);
  assert.ok(bright.definitionSourceRefs[0].includes('synthetic-tooltip.png'));
  assert.equal(updates[0].sourceIdentities[0].local_path,undefined);
});

test('references inside complete definitions do not resolve nested mechanics or establish ability applications',()=>{
  const text='Grant LOYALTY, RESURGENCE, TRUE KNIGHT Gems and ROARING FIRE.';
  const updates=prepare([evidence('LOYALTY','If SCOUT is inflicted, transfer it.'),evidence('RESURGENCE','When triggered, gains 10 BIRTHRIGHT.'),evidence('TRUE KNIGHT GEM','Requires ICE.'),evidence('ROARING FIRE GEM','Afflict STUN.')],text);
  const coverage=inspectEffectDefinitions(records(text),updates);
  for(const [effect,state]of [['SCOUT / SCOUTED','absent'],['STUN','absent'],['ICE','partial'],['BIRTHRIGHT','defined_quantitative_limits']]) {
    const row=coverage.find(row=>row.effectName===effect);assert.equal(row.definitionState,state);assert.equal(row.referenceOnly,true);assert.equal(row.applicationTextState,'not_established');
  }
});

test('all supported tooltip concepts can be retained without guessed quantitative rules',()=>{
  const effects=['BRIGHTFLAME','DRAGON FOLLOWER','RESURGENCE','ENDURING FIRE GEM','CRIPPLING FIRE GEM','CLEANSING FIRE GEM','ROARING FIRE GEM','WARMONGER','BIDE','HOLY PURPOSE','TRUE KNIGHT GEM','GOLDEN BASTION','LOYALTY','JUSTICE'];
  const source=effects.join(', ')+', Justice Gem';
  const input=effects.map(effect=>evidence(effect,'Synthetic body: '+effect+'.'));
  const before=JSON.stringify(input),updates=prepare(input,source),coverage=inspectEffectDefinitions(records(source),updates);
  assert.equal(updates.length,14);assert.equal(coverage.filter(row=>row.definitionState==='captured_definition').length,14);assert.equal(JSON.stringify(input),before);
  assert.ok(coverage.every(row=>row.scoringContribution===0&&!row.intrinsicPayoffAssumed));
  assert.ok(updates.every(row=>!('cap'in row)&&!('duration'in row)&&!('stacking'in row)));
});

test('clipped, unresolved, wrong-scope and duplicate tooltip updates fail visibly',()=>{
  for(const change of [row=>{row.definition+='…';},row=>{row.readability='partial';},row=>{row.source.file_name='other.png';},row=>{row.source.library_file_id='';},row=>{row.applies_to[0].exact_variant='Other';},row=>{row.review_date=null;},row=>{row.remaining='not an array';},row=>{row.source.version=-1;}]) {
    const row=evidence('BRIGHTFLAME');change(row);assert.throws(()=>prepare([row],'BRIGHTFLAME'));
  }
  assert.throws(()=>prepare([evidence('BRIGHTFLAME')],'Unrelated ability.'),/no matching current ability/);
  assert.throws(()=>prepare([evidence('BRIGHTFLAME'),evidence('BRIGHTFLAME')],'BRIGHTFLAME'),/Duplicate effect/);
  assert.throws(()=>prepare([evidence('UNKNOWN NEW ALIAS')],'UNKNOWN NEW ALIAS'),/supported name/);
});

test('standalone definition creates no champion scope and glossary replaces only matching definitions',()=>{
  const updates=prepare([evidence('GOLDEN BASTION',"Grants a +35% DEF Buff for 3 Turns, its durations is refreshed every time its re-applied.",{applies_to:[]})],'Unrelated ability.');
  assert.deepEqual(updates[0].scopes,[]);assert.equal(updates[0].scopeState,'standalone_reference');
  const entries=tooltipGlossaryEntries({statuses:[{name:'Golden Bastion',text:'Older wording'},{name:'STUN',text:'Unchanged'}],verifiedCollection:{effectDefinitionUpdates:updates}});
  assert.equal(entries.length,2);assert.equal(entries[0].name,'GOLDEN BASTION');assert.match(entries[0].text,/its durations is/);assert.equal(entries[1].text,'Unchanged');
  assert.match(tooltipEvidenceMarkup(updates[0]),/No exact captured variant or ownership is inferred/);
});

test('tooltip text, notes and source metadata are inert escaped HTML in both views',()=>{
  const payload='<img data-test="inert">';
  const updates=prepare([evidence('BRIGHTFLAME',payload,{remaining:[payload],match:payload})],'BRIGHTFLAME');
  const row=updates[0];row.sourceFilenames=[payload];row.reviewCompletedDate=payload;
  const coverage=inspectEffectDefinitions(records('BRIGHTFLAME'),updates);
  for(const html of [tooltipEvidenceMarkup(row),effectCoverageMarkup(coverage)]) {
    assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img data-test=&quot;inert&quot;&gt;/);
  }
});

test('Fire Damage, Fire Resistance and named Fire Gems alone are not FIRE status references',()=>{
  for(const text of ['Deal 100% ATK Fire Damage.','Grant +30% Fire Resistance.','Create ENDURING FIRE, CRIPPLING FIRE, CLEANSING FIRE and ROARING FIRE Gems.'])assert.ok(!inspect(text).some(row=>row.effectName==='FIRE'));
  const mixed=inspect('Deal 100% ATK Fire Damage and afflict the enemy with 1 FIRE.');
  assert.equal(mixed.find(row=>row.effectName==='FIRE').applicationTextState,'captured');
  const updates=prepare([evidence('ENDURING FIRE GEM','Adds 1 FIRE to the enemy this Gem damages.')],'Create ENDURING FIRE Gem.');
  const coverage=inspectEffectDefinitions(records('Create ENDURING FIRE Gem.'),updates),fire=coverage.find(row=>row.effectName==='FIRE');
  assert.equal(fire.referenceOnly,true);assert.equal(fire.applicationTextState,'not_established');
  assert.ok(!inspectEffectDefinitions(records('Deal Fire Damage.'),[]).some(row=>row.effectName==='FIRE'));
});
