import test from 'node:test';
import assert from 'node:assert/strict';
import { answerGuideQuestion,routeGuideQuestion } from '../knowledge-engine.js';

const champion=(id,name)=>({id,name,factions:[],releaseState:'live'});
function fixture(){
  const champions=[champion('brienne-true','Brienne Of Tarth — True Knight'),champion('brienne-other','Brienne Of Tarth — Lady Of The Sapphire Isles'),champion('ned-hand','Ned Stark — The Hand of the King'),champion('ned-other','Ned Stark — Warden Of The North'),champion('daemon','Daemon Targaryen — The Rogue Prince'),champion('ormund','Ormund Hightower — Beacon of the South')];
  const definitions=[['BRIGHTFLAME','Brightflame','ormund'],['HOLY PURPOSE','Holy Purpose','ormund'],['DRAGON FOLLOWER','Dragon Follower','ormund'],['RESURGENCE','Resurgence','ormund'],['ENDURING FIRE GEM','Enduring Fire Gem','daemon'],['CRIPPLING FIRE GEM','Crippling Fire Gem','daemon'],['CLEANSING FIRE Gem','Cleansing Fire Gem','daemon'],['ROARING FIRE GEM','Roaring Fire Gem','daemon'],['WARMONGER','Warmonger','daemon'],['BIDE','Bide','daemon'],['TRUE KNIGHT GEM','True Knight Gem','brienne-true'],['GOLDEN BASTION','Golden Bastion',null],['LOYALTY','Loyalty','ned-hand'],['Justice Gem','Justice','ned-hand']].map(([effectName,title,id],index)=>({effectName,title,text:`Synthetic exact tooltip ${index}.`,reviewStatus:'complete',definitionState:'captured_definition',sourceFilenames:[`synthetic-tooltip-${index}.png`],provenanceRef:'synthetic:tooltip:'+index,reviewCompletedDate:'2000-01-01',remainingRules:['Unshown caps and other rules are not supplied.'],scopes:id?[{variantId:id}]:[],observedChampion:id?null:'Standalone Example',contextNote:'Synthetic source context.'}));
  const roaring=definitions.find(row=>row.effectName==='ROARING FIRE GEM');
  const coverage=[{effectName:'CHARGE',variantId:'ormund',definitionState:'partial',known:'Fixed tier concept.',unresolved:'Rank-to-amount mapping is absent.',sourceRefs:['synthetic:charge.png']},{effectName:'SCOUT / SCOUTED',variantId:'brienne-other',definitionState:'absent',known:'Applications only.',unresolved:'Underlying debuff behavior.',sourceRefs:['synthetic:scout.png']},{effectName:'STUN',variantId:'daemon',definitionState:'absent',known:'Applications only.',unresolved:'Standalone control definition.',sourceRefs:[roaring.provenanceRef+':'+roaring.sourceFilenames[0]]}];
  return {guideData:{champions,abilities:[{variantId:'ormund',name:'Strength, Honour, Wisdom, and Justice',kind:'skill',text:'Synthetic Ormund Skill.',reviewStatus:'complete'}],traits:[],items:[],factions:[],statuses:[{name:'Holy Purpose',text:'Historical unmatched text.'}],mechanics:[],verifiedCollection:{effectDefinitionUpdates:definitions,effectDefinitions:coverage}},strategyData:{championFacts:[],mechanics:[],targets:[]}};
}
const ask=(question,f=fixture(),context={})=>answerGuideQuestion({...f,question,context});

test('all fourteen exact effect definitions return imported text, source, scope and separate caveats',()=>{
  const f=fixture(),before=JSON.stringify(f);
  for(const row of f.guideData.verifiedCollection.effectDefinitionUpdates){
    const result=ask(`What does ${row.title} do?`,f);
    assert.equal(result.intent,'private_effect_definition',row.title);
    assert.equal(result.facts[0].wording,row.text);
    assert.ok(result.facts.some(fact=>fact.title==='Source'&&fact.wording.includes(row.sourceFilenames[0])&&fact.wording.includes('2000-01-01')));
    assert.ok(result.facts.some(fact=>fact.title==='Separate rule questions'));
    assert.match(result.summary,/No unshown rules, cross-variant applicability/);
  }
  assert.equal(JSON.stringify(f),before);
});

test('compound Fire Gems and Justice alias win over embedded FIRE and champion names',()=>{
  for(const question of ['Define Cleansing Fire Gem','How does Crippling Fire Gem work?','Enduring Fire Gem definition','Explain Roaring Fire Gem','What is True Knight Gem?','What does Justice do?','Define Justice Gem'])assert.equal(ask(question).intent,'private_effect_definition');
  assert.equal(ask('What does Brienne Of Tarth — True Knight do?').intent,'champion_lookup');
  assert.notEqual(ask("Explain Ormund's Strength, Honour, Wisdom, and Justice skill").intent,'private_effect_definition');
  assert.equal(ask("Explain Ormund's Strength, Honour, Wisdom, and Justice skill").entries[0].facts[0].wording,'Synthetic Ormund Skill.');
});

test('an explicit wrong exact variant never borrows a tooltip from the other version',()=>{
  for(const question of ['What does True Knight Gem do for Brienne Of Tarth — Lady Of The Sapphire Isles?','What does LOYALTY do for Ned Stark — Warden Of The North?','What does Justice Gem do for Ned Stark — Warden Of The North?']){
    const result=ask(question);assert.equal(result.definitionState,'scope_unverified');assert.doesNotMatch(JSON.stringify(result),/Synthetic exact tooltip/);assert.match(result.facts[0].wording,/Do not transfer/);
  }
  assert.equal(ask('What does True Knight Gem do for Brienne Of Tarth?').status,'needs_clarification');
  assert.equal(ask('What does Justice Gem do for Ned Stark — The Hand of the King?').definitionState,'source_bounded_definition');
});

test('standalone evidence does not imply ownership, a build or an exact variant',()=>{
  const result=ask('What does Golden Bastion do?');
  assert.match(result.facts.find(row=>row.title==='Source scope').wording,/Standalone tooltip.*No exact variant or ownership/);
  assert.equal(ask('What is Golden Bastion for Standalone Example?').definitionState,'source_bounded_definition');
  assert.equal(ask('What is Golden Bastion for Standalone Example — Imagined Variant?').status,'needs_clarification');
});

test('missing and partial definitions return explicit limits and application sources, never inferred numbers',()=>{
  const charge=ask('What does CHARGE II do?');
  assert.equal(charge.definitionState,'incomplete_definition');assert.match(charge.facts[0].title,/Partial/);assert.match(JSON.stringify(charge),/Rank-to-amount mapping is absent/);assert.doesNotMatch(JSON.stringify(charge),/\d+%/);
  const scout=ask('Define SCOUT');assert.equal(scout.definitionState,'incomplete_definition');assert.match(scout.facts[0].title,/Missing standalone/);assert.ok(scout.sourceRefs.includes('synthetic:scout.png'));
  assert.ok(ask('What does Roaring Fire Gem do?').facts.some(row=>row.title==='Related mechanic: STUN'&&row.wording.includes('Missing standalone definition')));
});

test('explicit definition questions ignore battle context while real battle/provider requests retain routing',()=>{
  const context={targetId:'raid:test',lastResult:{team:[{champion:{name:'Daemon Targaryen — The Rogue Prince'}}]}};
  for(const question of ['Explain Cleansing Fire Gem','What does HOLY PURPOSE do in battle?','What does CHARGE II do?'])assert.equal(ask(question,fixture(),context).intent,'private_effect_definition');
  assert.equal(ask("Explain Daemon's Cleansing Fire Gem",fixture(),context).status,'needs_clarification');
  assert.equal(ask('Best team using Cleansing Fire Gem',fixture(),context).status,'battle');
  assert.equal(ask('Who applies FIRE?',fixture(),context).intent,'mechanic_lookup');
});

test('multiple effects ask for one target instead of selecting the first match',()=>{
  const result=ask('Explain BRIGHTFLAME and HOLY PURPOSE');assert.equal(result.status,'needs_clarification');assert.match(result.message,/Which one effect/);
  assert.equal(ask('Define Cleansing Fire Gem and Justice Gem').status,'needs_clarification');
});

test('without an imported overlay neither the route nor answer exposes private definition evidence',()=>{
  const f=fixture();delete f.guideData.verifiedCollection;
  const result=ask('What does HOLY PURPOSE do?',f);assert.notEqual(result.intent,'private_effect_definition');assert.doesNotMatch(JSON.stringify(result),/synthetic-tooltip|Synthetic exact tooltip|Synthetic source context/);
  assert.notEqual(routeGuideQuestion('Define SCOUT',f).intent,'private_effect_definition');
});

test('partial source wording is labeled partial rather than silently filled or treated as complete',()=>{
  const f=fixture(),row=f.guideData.verifiedCollection.effectDefinitionUpdates[0];row.reviewStatus='partial';row.text='Synthetic clipped body…';
  const result=ask('What does BRIGHTFLAME do?',f);assert.equal(result.definitionState,'partial_definition');assert.match(result.facts[0].title,/partial or unverified/);assert.equal(result.facts[0].wording,row.text);assert.ok(result.facts.some(row=>row.title==='Missing evidence'));
});


test('same-name definitions from separate variants stay scoped rather than selecting the first body',()=>{
  const f=fixture(),original=f.guideData.verifiedCollection.effectDefinitionUpdates.find(row=>row.effectName==='Justice Gem');
  f.guideData.verifiedCollection.effectDefinitionUpdates.push({...original,text:'Different synthetic scoped definition.',scopes:[{variantId:'ned-other'}],sourceFilenames:['synthetic-alternate.png'],provenanceRef:'synthetic:alternate'});
  const scoped=ask('Define Justice Gem for Ned Stark — Warden Of The North',f);
  assert.equal(scoped.facts[0].wording,'Different synthetic scoped definition.');assert.doesNotMatch(JSON.stringify(scoped),/Synthetic exact tooltip/);
  const unqualified=ask('Define Justice Gem',f);
  assert.equal(unqualified.facts.filter(row=>/tooltip verbatim/.test(row.title)).length,2);
  assert.ok(unqualified.facts.some(row=>row.title==='Source scope'&&row.wording.includes('The Hand of the King')));
});

for(const effectName of ['FIRE','BLEED','BIRTHRIGHT'])test(`${effectName} keeps exact existing glossary wording with historical and quantitative caveats`,()=>{
  const f=fixture(),text=`Synthetic historical ${effectName} definition,  with original spacing and punctuation.`;
  f.guideData.statuses.push({id:'synthetic-historical-'+effectName,name:effectName,text,reviewStatus:'complete'});
  f.guideData.verifiedCollection.effectDefinitions.push({effectName,variantId:'ormund',definitionState:'defined_quantitative_limits',known:'A definition exists.',unresolved:'Quantitative limits are not supplied.',sourceRefs:['synthetic:application']});
  const base=structuredClone(f);delete base.guideData.verifiedCollection;
  assert.ok(ask(`What is ${effectName}?`,base).facts.some(row=>row.wording===text));
  const result=ask(`What is ${effectName}?`,f);
  assert.equal(result.definitionState,'historical_definition_with_gaps');
  assert.ok(result.facts.some(row=>row.wording===text&&row.title.includes('historical catalog wording')));
  assert.ok(result.facts.some(row=>row.title==='Historical source and currentness'&&row.wording.includes('Not newly verified')));
  assert.ok(result.facts.some(row=>row.wording.includes('Quantitative limits are not supplied')&&row.wording.includes('No complete current tooltip')));
  assert.ok(result.sourceRefs.includes('catalog:synthetic-historical-'+effectName));
  assert.ok(!result.facts.some(row=>row.title.includes('tooltip verbatim')));
});

test('historical fallback is exact-name only and does not resolve missing/alias-unconfirmed definitions',()=>{
  const f=fixture();
  f.guideData.statuses.push({name:'SCOUT',text:'Unmatched historical claim.',reviewStatus:'complete'});
  const result=ask('Define SCOUT',f);
  assert.equal(result.definitionState,'incomplete_definition');assert.doesNotMatch(JSON.stringify(result),/Unmatched historical claim/);
});


test('FURY retains the exact historical definition without treating its old amount as current',()=>{
  const f=fixture(),text='Synthetic historical FURY amount: 3%.';
  f.guideData.mechanics.push({id:'synthetic-fury',name:'Fury',text,reviewStatus:'complete'});
  f.guideData.verifiedCollection.effectDefinitions.push({effectName:'FURY',variantId:'daemon',definitionState:'partial',known:'Historical definition exists.',unresolved:'Current threshold and consumption are unverified.',sourceRefs:['synthetic:current-fury-mention']});
  const result=ask('What is FURY?',f);
  assert.equal(result.definitionState,'historical_definition_with_gaps');assert.ok(result.facts.some(row=>row.wording===text));
  assert.ok(result.facts.some(row=>row.wording.includes('Not newly verified')));
  assert.ok(result.facts.some(row=>row.wording.includes('Current threshold and consumption are unverified')));
});
