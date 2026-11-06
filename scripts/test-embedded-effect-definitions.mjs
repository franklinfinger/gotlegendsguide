import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { answerGuideQuestion } from '../knowledge-engine.js';
import { embeddedEffectSpecs, collectEmbeddedEffectReferences } from '../embedded-effect-definitions.js';
import { historicalEmbeddedReferences } from '../historical-embedded-effect-references.js';
import { inspectEffectDefinitions, definitionIsUnresolved } from '../effect-definition-status.js';
import { integrateVerifiedHandoff } from '../verified-handoff.js';

const champion=(id,name)=>({id,name,releaseState:'live',factions:[]});
const empty=()=>({guideData:{champions:[],abilities:[],traits:[],items:[],factions:[],statuses:[],mechanics:[]},strategyData:{championFacts:[],mechanics:[],targets:[]}});
const ask=(question,f=empty())=>answerGuideQuestion({...f,question});
const asCaptured=(row,variantId,name,text=row.text)=>({...row,id:'synthetic:'+row.id,variantId,name,text,historicalReference:false,historicalSubject:undefined,historicalChampionId:undefined,sourceTable:undefined,sourceRecordId:undefined,sourceId:undefined,sourceState:undefined,captureDate:'2000-01-01',reviewCompletedDate:'2000-01-02',provenanceRef:'synthetic:captured',sourceFilenames:['synthetic.png']});

for(const spec of embeddedEffectSpecs)test(`${spec.effectName} retains historical embedded wording without a private handoff or popup`,()=>{
  const f=empty(),before=JSON.stringify(f),result=ask(`What does ${spec.effectName} do?`,f);
  assert.equal(result.definitionState,'embedded_definition');
  assert.ok(result.facts.some(row=>row.title.includes('historical')&&row.wording));
  assert.ok(result.facts.some(row=>row.title==='Embedded source and currentness'&&row.wording.includes('Historical SQLite')&&row.wording.includes('not newly verified')));
  assert.ok(result.facts.some(row=>row.title==='Separate rule questions'&&row.wording.includes('a standalone popup is not required')));
  assert.doesNotMatch(JSON.stringify(result),/Missing standalone definition|Application\/reference evidence only/);
  assert.deepEqual(result.entries,[]);assert.equal(JSON.stringify(f),before);
});

test('Walder rank I item text is byte-exact and cites iconic_abilities #30, source #512',()=>{
  const result=ask("What does Walder Frey's RESENTMENT do?");
  assert.equal(result.definitionState,'embedded_definition');
  assert.ok(result.facts.some(row=>row.wording==='When an enemy gains a buff, Walder gains a stack of RESENTMENT.  Each RESENTMENT grants Walder 5% Dodge.  Walder loses all RESENTMENT after Dodging a Skill.'));
  assert.ok(result.facts.some(row=>row.wording.includes('iconic_abilities #30, source #512')));
  assert.ok(result.facts.some(row=>row.title==='Embedded definition scope'&&row.wording.includes('historical level 1, ability rank I')&&row.wording.includes('No ownership')));
  assert.ok(result.sourceRefs.includes('sqlite:iconic_abilities:30:source:512'));
  assert.doesNotMatch(JSON.stringify(result),/owned|equipped|100% Dodge|stack cap is/i);
});

test('same-name catalog Walder does not hide or relink the historical-only item definition',()=>{
  for(const imported of [false,true]){
    const f=empty();f.guideData.champions=[champion('walder','Walder Frey'),champion('walder-other','Walder Frey — Other Variant')];
    if(imported)f.guideData.verifiedCollection={records:[],effectDefinitions:[],effectDefinitionUpdates:[]};
    const before=JSON.stringify(f);
    for(const question of ["What does Walder Frey's RESENTMENT do?",'Define RESENTMENT for Walder Frey']){
      const result=ask(question,f);
      assert.equal(result.definitionState,'embedded_definition');
      assert.ok(result.sourceRefs.includes('sqlite:iconic_abilities:30:source:512'));
      assert.ok(result.facts.some(row=>row.title==='Embedded definition scope'&&row.wording.includes('Historical source identity: Walder Frey')&&row.wording.includes('An exact current variant is not established')));
      assert.doesNotMatch(JSON.stringify(result),/Linked only to|captured item|owned|equipped/);
      assert.deepEqual(result.entries,[]);
    }
    assert.equal(ask('Define RESENTMENT for Walder Frey — Other Variant',f).definitionState,'scope_unverified');
    assert.equal(JSON.stringify(f),before);
  }
});

test('scoped historical archive is enriched and replaces only its identical unscoped duplicate',()=>{
  const f=empty(),old=historicalEmbeddedReferences.find(row=>row.id==='legacy-trait-30');
  f.guideData.champions=[champion('tywin','Tywin Lannister — The Hand')];
  const bare={id:old.id,name:old.name,kind:old.kind,text:old.text,reviewStatus:old.reviewStatus,variantId:'tywin',historicalReference:true};
  f.guideData.historicalEffectReferences=[bare];
  f.guideData.traits=[asCaptured(old,'tywin','The Rains of Castamere II')];
  const before=JSON.stringify(f);
  for(const question of ['Define RUIN','Define RUIN for Tywin Lannister — The Hand']){
    const result=ask(question,f),historical=result.facts.filter(row=>row.title.includes('historical trait wording'));
    assert.equal(historical.length,1);assert.equal(historical[0].wording,old.text);
    assert.equal(historical[0].provenance,'sqlite:champion_traits:30:source:71');
    assert.equal(result.facts.filter(row=>row.title.includes('captured trait wording')).length,1);
    assert.ok(result.facts.some(row=>row.wording.includes('Historical SQLite champion_traits #30, source #71')));
    assert.ok(result.facts.some(row=>row.title==='Embedded definition scope'&&row.wording.startsWith('Linked only to Tywin Lannister — The Hand.')));
    assert.doesNotMatch(JSON.stringify(result),/catalog:legacy-trait-30/);
  }
  assert.equal(JSON.stringify(f),before);
  f.guideData.champions.push(champion('tywin-other','Tywin Lannister — Other Variant'));
  f.guideData.historicalEffectReferences.push({...bare,variantId:'tywin-other'});
  assert.equal(ask('Define RUIN',f).facts.filter(row=>row.title.includes('historical trait wording')).length,2);
  assert.equal(ask('Define RUIN for Tywin Lannister — Other Variant',f).facts.filter(row=>row.title.includes('historical trait wording')).length,1);
  f.guideData.historicalEffectReferences.push({...bare,text:old.text+' Different captured wording.'});
  const changed=ask('Define RUIN',f);
  assert.equal(changed.facts.filter(row=>row.title.includes('historical trait wording')).length,3);
  assert.ok(changed.facts.some(row=>row.wording.endsWith('Different captured wording.')&&row.provenance==='catalog:legacy-trait-30'));
});

test('captured Joffrey rank III and historical rank II never blend values or variants',()=>{
  const f=empty(),old=historicalEmbeddedReferences.find(row=>row.id==='legacy-trait-139');
  f.guideData.champions=[champion('protector','Joffrey Baratheon — Protector of the Realm'),champion('future','Joffrey Baratheon — The Future King')];
  const row=asCaptured(old,'protector','Defend Your King III',old.text.replace('+10%','+15%'));
  f.guideData.traits=[row];f.guideData.verifiedCollection={records:[row],effectDefinitions:[],effectDefinitionUpdates:[]};
  const unqualified=ask("Define Joffrey's Scorn",f);
  assert.ok(unqualified.facts.some(row=>row.title.includes('Defend Your King III · captured trait')&&row.wording.includes('+15%')));
  assert.ok(unqualified.facts.some(row=>row.title.includes('Defend Your King II · historical trait')&&row.wording.includes('+10%')));
  const exact=ask("Define Joffrey's Scorn for Joffrey Baratheon — Protector of the Realm",f);
  assert.match(JSON.stringify(exact),/\+15%/);assert.doesNotMatch(JSON.stringify(exact),/\+10%/);
  const wrong=ask("Define Joffrey's Scorn for Joffrey Baratheon — The Future King",f);
  assert.equal(wrong.definitionState,'scope_unverified');assert.doesNotMatch(JSON.stringify(wrong),/\+15%|\+10%/);
});

test('both Seasmoke source names and rank-specific numbers stay intact',()=>{
  const f=empty(),skill=historicalEmbeddedReferences.find(row=>row.id==='sqlite-champion_skills-70'),trait=historicalEmbeddedReferences.find(row=>row.id==='legacy-trait-152');
  f.guideData.champions=[champion('seasmoke','Seasmoke — The Silver Velaryon')];
  f.guideData.abilities=[asCaptured(skill,'seasmoke',skill.name,skill.text.replace('210%','220%').replace('40%','45%'))];
  f.guideData.traits=[asCaptured(trait,'seasmoke',trait.name)];
  for(const question of ["Define Seasmoke's Favor for Seasmoke — The Silver Velaryon","Define Seasmoke's Favored for Seasmoke — The Silver Velaryon"]){
    const result=ask(question,f);assert.equal(result.definitionState,'embedded_definition');
    assert.ok(result.facts.some(row=>row.wording===f.guideData.abilities[0].text));
    assert.ok(result.facts.some(row=>row.wording===f.guideData.traits[0].text));
    assert.doesNotMatch(JSON.stringify(result),/210%|40%|125%/);
    assert.match(result.facts.find(row=>row.title==='Separate rule questions').wording,/Skill says FAVOR and the trait says FAVORED/);
  }
});

test('user shorthand routes only exact definition subjects, not battle or skill requests',()=>{
  for(const q of ["Explain Hound's Protect",'Define Hounds Protect',"What is Hound's Protection?",'Define Joffrey Scorn','Define Seasmoke Favor'])assert.equal(ask(q).definitionState,'embedded_definition');
  assert.equal(ask("Best team using Hound's Protection").status,'battle');
  assert.notEqual(ask("Who uses Joffrey's Scorn?").definitionState,'embedded_definition');
});

test('embedded coverage recognizes a recorded definition but retains separate rules and zero scoring',()=>{
  for(const spec of embeddedEffectSpecs){
    const rows=collectEmbeddedEffectReferences({abilities:historicalEmbeddedReferences}).filter(row=>row.effectName===spec.effectName);
    const coverage=inspectEffectDefinitions(rows).find(row=>row.effectName===spec.effectName);
    assert.equal(coverage.definitionState,'embedded_definition',spec.effectName);
    assert.equal(definitionIsUnresolved(coverage),false);assert.ok(coverage.remainingRules.length);assert.equal(coverage.scoringContribution,0);assert.equal(coverage.intrinsicPayoffAssumed,false);
  }
  const mention=inspectEffectDefinitions([{text:'Applies RUIN.',reviewStatus:'complete',provenanceRef:'synthetic',sourceFilenames:['synthetic.png']}]).find(row=>row.effectName==='RUIN');
  assert.equal(mention.definitionState,'partial');
});

test('a scoped clipped body is preserved as partial, not completed from another historical source',()=>{
  const f=empty();f.guideData.champions=[champion('tywin','Tywin Lannister — The Hand')];
  f.guideData.traits=[{id:'clipped',variantId:'tywin',name:'The Rains of Castamere II',text:'At 3 RUIN, the enemy will have their Current HP…',reviewStatus:'partial',captureDate:'2000-01-01',provenanceRef:'synthetic',sourceFilenames:['synthetic.png']}];
  const result=ask('Define RUIN for Tywin Lannister — The Hand',f);
  assert.equal(result.definitionState,'partial_embedded_evidence');assert.ok(result.facts.some(row=>row.wording===f.guideData.traits[0].text));assert.doesNotMatch(JSON.stringify(result),/75%|25%|Does not affect Dragons/);
});

test('overlay replacement retains old effect rows only in a reference archive, never abilities or scoring',()=>{
  const f=empty(),old={id:'old',variantId:'same',kind:'skill',name:'Old Skill',text:"THE HOUND'S PROTECTION grants a SHIELD for 99% Max HP.",reviewStatus:'complete',provenance:'synthetic:old'};
  f.guideData.champions=[champion('same','Example — Exact')];f.guideData.abilities=[old];
  const handoff={capture_date:'2000-01-01',all_reviewed_source_filenames:['IMG_1.PNG'],champion_capture_groups:[{capture_group_id:'G1',champion:'Example',exact_variant:'Exact',duplicate_of_group_id:null,profile_anchor:'IMG_1.PNG',group_source_filenames:['IMG_1.PNG'],fields_as_recorded:{profile:'Example.',current_skill:'**New Skill** — “Deal 1% ATK Physical Damage.” IMG_1.PNG'}}]};
  const result=integrateVerifiedHandoff({...f,handoff});
  assert.ok(result.guideData.historicalEffectReferences.some(row=>row.text===old.text&&row.historicalReference));
  assert.ok(!result.guideData.abilities.some(row=>row.id==='old'));
  assert.doesNotMatch(JSON.stringify(result.strategyData),/99%|synthetic:old/);
  assert.equal(result.guideData.champions.length,1);
});

test('bounded historical export matches the checked-in SQLite text and relational sources exactly',()=>{
  const result=JSON.parse(execFileSync('python3',['-c',`import sqlite3,json
c=sqlite3.connect('file:data/audit/reconciled-knowledge.sqlite?mode=ro',uri=True);c.row_factory=sqlite3.Row
out=[]
for table,pk,ids in [('champion_skills','skill_id',[7,64,70]),('champion_traits','trait_id',[18,19,30,139,152]),('iconic_abilities','iconic_ability_id',[30])]:
 for id in ids:
  r=dict(c.execute('select * from '+table+' where '+pk+'=?',[id]).fetchone());s=dict(c.execute('select * from sources where source_id=?',[r['source_id']]).fetchone())
  out.append({'table':table,'id':id,'text':r['exact_visible_text'],'sourceId':r['source_id'],'filename':s['filename'],'championId':r['champion_id']})
print(json.dumps(out))`],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
  assert.equal(result.length,historicalEmbeddedReferences.length);
  for(const row of historicalEmbeddedReferences){const source=result.find(other=>other.table===row.sourceTable&&other.id===row.sourceRecordId);assert.ok(source);assert.equal(row.text,source.text);assert.equal(row.sourceId,source.sourceId);assert.deepEqual(row.sourceFilenames,[]);assert.equal(row.historicalChampionId,source.championId);assert.equal(row.variantId,null);}
});
