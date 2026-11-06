import test from 'node:test';
import assert from 'node:assert/strict';
import { effectSpecFor, inspectEffectDefinitions, prepareEffectDefinitionUpdates, prepareEffectDefinitionExcerpts, definitionIsUnresolved } from '../effect-definition-status.js';
import { answerGuideQuestion, routeGuideQuestion } from '../knowledge-engine.js';
import { integrateVerifiedHandoff } from '../verified-handoff.js';
import { tooltipGlossaryEntries, tooltipEvidenceMarkup } from '../effect-definition-view.js';
import { readinessMarkup } from '../data-readiness.js';

// Public mechanic names only. Every body, identity, date and source is synthetic.
const titles=['Enraged','Charge',"The Khal's Dominance",'Scout','Pacify',"Tyrion's Defender",'Inspire','Taunt','Bleed','Poison','Raid','Ice','Deceive','Brittle','True Damage','Dodge Chance','Fire Resistance','Fire','Remove','Treasury','Wound','Blood Debt',"Viper's Bite",'Current HP','Wildling Horde','Fury',"Arya's List",'Revive','Ability','Physical Resistance','HP Guard','Durability','Gem Crit Chance','Counter','Depose','Accuracy',"Criston's Charge",'Sustained','Red Dragon Gem','Birthright'];
const repeated=new Set(['Pacify','True Damage','Dodge Chance','Physical Resistance']);
const source=(id)=>({file_name:`synthetic-source-${id}.png`,library_file_id:`synthetic-library-${id}`,message_id:`synthetic-message-${id}`,sent_at:'2000-01-01T12:00:00Z',sha256:'a'.repeat(64),champion_context:'Synthetic context',screen_context:'Synthetic source screen',notes:'Synthetic reviewed note',local_path:'/private/never-export'});
const tooltip=(title,id=0)=>({effect:effectSpecFor(title).effectName,title,definition:`Synthetic exact definition for ${title}.`,readability:'complete_popup_visually_readable',review_date:'2000-01-02',remaining:['Only the visible source wording is supported.'],applies_to:[],sources:[source(id)],reconciliation:{kind:'single_source',source_count:1}});
const batch=()=>titles.map((title,index)=>{const row=tooltip(title,index);if(repeated.has(title)){row.sources.push(source(index+'-repeat'));row.reconciliation={kind:'identical_definition_sources',source_count:2};}return row;});
const empty=()=>({guideData:{champions:[],abilities:[],traits:[],items:[],factions:[],statuses:[],mechanics:[]},strategyData:{championFacts:[],mechanics:[],targets:[]}});
const handoff=()=>({capture_date:'2000-01-01',all_reviewed_source_filenames:['IMG_1.PNG'],champion_capture_groups:[{capture_group_id:'G1',champion:'Example',exact_variant:'Exact',profile_anchor:'IMG_1.PNG',duplicate_of_group_id:null,group_source_filenames:['IMG_1.PNG'],fields_as_recorded:{profile:'Synthetic profile.',current_skill:'**Example skill** — “Grants ENRAGED, CHARGE II, SCOUT, PACIFY, ICE, DURABILITY and INSPIRATION.” IMG_1.PNG',traits:'**Example trait II** — “At 3 RUIN, the enemy loses Current HP.” IMG_1.PNG'}}]});
const excerpt=()=>({effect:'RUIN',title:'Ruin',definition:'Visible end of a sentence. At 3 RUIN, Current HP changes.',readability:'partial_trait_excerpt_visually_readable',review_date:'2000-01-02',remaining:[],applies_to:[{capture_group_id:'G1',champion:'Example',exact_variant:'Exact'}],sources:[source('excerpt')],evidence_kind:'trait_excerpt',ability_name:'Example trait II',excerpt_note:'Beginning above the scroll position; do not reconstruct it.'});
const integrate=(data=handoff())=>integrateVerifiedHandoff({...empty(),handoff:data});
const ask=(data,question)=>answerGuideQuestion({...data,question});

test('40 complete definitions and four reconciled repeat sources retain all identity fields without local paths',()=>{
  const input=batch(),original=JSON.stringify(input),rows=prepareEffectDefinitionUpdates(input,new Map(),[]);
  assert.equal(rows.length,40);assert.equal(new Set(rows.map(row=>row.effectName)).size,40);assert.equal(rows.flatMap(row=>row.sourceIdentities).length,44);
  for(const [index,row] of rows.entries()){
    assert.equal(row.text,input[index].definition);assert.equal(row.scoringContribution,0);
    for(const [j,identity] of row.sourceIdentities.entries()){
      const {local_path,...expected}=input[index].sources[j];assert.deepEqual(identity,expected);
    }
  }
  assert.equal(JSON.stringify(input),original);assert.doesNotMatch(JSON.stringify(rows),/never-export|local_path/);
});

test('every new title routes to its exact complete definition, independently of previous battle context',()=>{
  const data=empty();data.guideData.verifiedCollection={effectDefinitionUpdates:prepareEffectDefinitionUpdates(batch(),new Map(),[]),effectDefinitions:[]};
  for(const title of titles){
    const result=answerGuideQuestion({...data,question:`What does ${title} do?`,context:{targetId:'raid:attack'}});
    assert.equal(result.intent,'private_effect_definition',title);assert.equal(result.definitionState,'source_bounded_definition',title);assert.equal(result.facts[0].wording,`Synthetic exact definition for ${title}.`);assert.deepEqual(result.entries,[]);
    if(repeated.has(title))assert.equal(result.facts.filter(row=>row.title==='Source identity').length,2);
  }
  for(const name of ['CHARGE I','CHARGE II','CHARGE III','CHARGE IV','CHARGE V','CHARGE 2','CHARGE 5','SCOUTED','INSPIRATION'])assert.equal(ask(data,`Define ${name}`).definitionState,'source_bounded_definition');
  assert.equal(ask(data,'Define Criston\'s Charge').title,"CRISTON'S CHARGE");
  assert.equal(ask(data,'Define Fire Resistance').title,'FIRE RESISTANCE');
  assert.equal(ask(data,'Define Red Dragon Gem').title,'RED DRAGON GEM');
  assert.equal(ask(data,'Explain Charge and Pacify').status,'needs_clarification');
  assert.equal(routeGuideQuestion('Best team using Pacify',data).intent,'battle_recommendation');
});

test('Charge remains a complete qualitative definition without inferred rank values',()=>{
  const data=empty(),row=tooltip('Charge');row.definition='Fixed Stamina, scaling qualitatively from CHARGE I to CHARGE V.';row.remaining=['No numerical tier amounts are shown.'];
  data.guideData.verifiedCollection={effectDefinitionUpdates:prepareEffectDefinitionUpdates([row],new Map(),[])};
  for(const rank of ['I','II','III','IV','V']){const result=ask(data,`What does CHARGE ${rank} do?`);assert.equal(result.definitionState,'source_bounded_definition');assert.equal(result.facts[0].wording,row.definition);assert.doesNotMatch(result.facts.map(row=>row.wording).join(' '),/\d+(?:\.\d+)?\s*(?:%|Stamina)/);}
});

test('fresh definition coverage closes only named evidence gaps and never changes strategy facts or source ability bodies',()=>{
  const input=handoff(),before=integrate(input);input.effect_definition_updates=batch();
  for(const row of input.effect_definition_updates.filter(row=>['ENRAGED','CHARGE','SCOUT / SCOUTED','PACIFY','ICE','Durability','INSPIRATION'].includes(row.effect)))row.applies_to=[{capture_group_id:'G1',champion:'Example',exact_variant:'Exact'}];
  input.effect_definition_excerpts=[excerpt()];const after=integrate(input);
  assert.deepEqual(after.strategyData,before.strategyData);assert.deepEqual(after.guideData.verifiedCollection.records,before.guideData.verifiedCollection.records);
  const audit=after.audit.effectDefinitionUpdates;assert.equal(audit.uniqueDefinitions,40);assert.equal(audit.tooltipSources,44);assert.equal(audit.duplicateSourcesRetained,4);assert.equal(audit.traitExcerpts,1);
  const coverage=after.guideData.verifiedCollection.effectDefinitions;
  for(const name of ['ENRAGED','CHARGE','SCOUT / SCOUTED','PACIFY','ICE','Durability','INSPIRATION']){const row=coverage.find(row=>row.effectName===name);assert.equal(row.definitionState,'captured_definition',name);assert.equal(definitionIsUnresolved(row),false);assert.equal(row.scoringContribution,0);assert.equal(row.intrinsicPayoffAssumed,false);}
  const html=readinessMarkup({status:'ready',guide:after.guideData,strategy:after.strategyData,lastSuccess:null,error:''});assert.match(html,/40 unique complete tooltips from 44 screenshots/);assert.match(html,/4 repeat sources retained; 1 partial trait excerpts/);
});

test('a separate Ruin excerpt is always partial, quoted unchanged, never spliced into a complete source',()=>{
  const input=handoff();input.effect_definition_excerpts=[excerpt()];const data=integrate(input),row=data.guideData.verifiedCollection.effectDefinitionExcerpts[0];
  assert.equal(row.reviewStatus,'partial');assert.equal(row.evidenceKind,'trait_excerpt');assert.equal(row.text,excerpt().definition);assert.equal(row.scoringContribution,0);
  const result=ask(data,'Define RUIN for Example — Exact');assert.equal(result.definitionState,'embedded_definition');
  assert.ok(result.facts.some(fact=>fact.title.includes('trait excerpt')&&fact.title.includes('(partial)')&&fact.wording===excerpt().definition));
  assert.ok(result.facts.some(fact=>fact.title==='Partial excerpt boundary'&&fact.wording===excerpt().excerpt_note));
  assert.ok(result.facts.some(fact=>fact.title.includes('captured trait wording')&&fact.wording==='At 3 RUIN, the enemy loses Current HP.'));
  const glossary=tooltipGlossaryEntries(data.guideData),entry=glossary.find(row=>row.group==='Local trait excerpt');assert.equal(entry.text,excerpt().definition);assert.equal(entry.reviewStatus,'partial');assert.match(tooltipEvidenceMarkup(entry.tooltip),/Partial trait excerpt/);assert.doesNotMatch(tooltipEvidenceMarkup(entry.tooltip),/Complete tooltip/);
  assert.equal(data.guideData.verifiedCollection.effectDefinitionUpdates.length,0);assert.equal(data.guideData.verifiedCollection.records.length,2);
  const withoutComplete=structuredClone(data);withoutComplete.guideData.traits=[];const onlyExcerpt=ask(withoutComplete,'Define RUIN for Example — Exact');assert.equal(onlyExcerpt.definitionState,'partial_embedded_evidence');
});

test('explicit scope may cite a separately preserved visible fragment without joining or completing it',()=>{
  const groups=new Map([['G1',{capture_group_id:'G1',champion:'Example',exact_variant:'Exact'}]]);
  const records=[{variantId:'example',captureGroupId:'G1',text:'Visible beginning.',textFragments:[{text:'An ally is PACIFIED.'}],reviewStatus:'partial',provenanceRef:'synthetic',sourceFilenames:['synthetic.png']}];
  const input=tooltip('Pacify');input.applies_to=[{capture_group_id:'G1',champion:'Example',exact_variant:'Exact'}];
  const original=JSON.stringify(records),rows=prepareEffectDefinitionUpdates([input],groups,records),coverage=inspectEffectDefinitions(records,rows);
  assert.equal(coverage[0].definitionState,'captured_definition');assert.equal(coverage[0].applicationTextState,'partial');assert.equal(JSON.stringify(records),original);
});

test('both old and new definitions remain separately sourced in Ask and the glossary',()=>{
  const data=empty(),row=tooltip('Fury');data.guideData.statuses=[{id:'old',name:'Fury',text:'Old exact wording with  7% and original spacing.',reviewStatus:'complete',provenanceRef:'synthetic:old'}];data.guideData.verifiedCollection={effectDefinitionUpdates:prepareEffectDefinitionUpdates([row],new Map(),[])};
  const result=ask(data,'Define Fury');assert.equal(result.facts[0].wording,row.definition);assert.ok(result.facts.some(fact=>fact.title.includes('historical catalog wording')&&fact.wording===data.guideData.statuses[0].text));assert.ok(result.sourceRefs.includes('synthetic:old'));
  const glossary=tooltipGlossaryEntries(data.guideData);assert.equal(glossary.length,1);assert.equal(glossary[0].tooltip.historicalDefinitions[0].text,data.guideData.statuses[0].text);assert.match(tooltipEvidenceMarkup(glossary[0].tooltip),/Historical source: synthetic:old/);
});

test('unreconciled duplicates, contradictory source containers and malformed provenance fail visibly',()=>{
  const valid=batch().find(row=>row.title==='Pacify');
  for(const edit of [row=>delete row.reconciliation,row=>row.reconciliation.source_count=1,row=>row.sources[1].library_file_id=row.sources[0].library_file_id,row=>row.sources[1].file_name=row.sources[0].file_name,row=>row.sources[0].sha256='bad',row=>row.sources[0].version=-1,row=>row.sources=[],row=>{row.source=source('ambiguous');row.screenshot=row.source.file_name;}] ){const row=structuredClone(valid);edit(row);assert.throws(()=>prepareEffectDefinitionUpdates([row],new Map(),[]));}
  assert.throws(()=>prepareEffectDefinitionUpdates([tooltip('Ice'),tooltip('Ice',2)],new Map(),[]),/Duplicate effect/);
  assert.throws(()=>prepareEffectDefinitionUpdates([excerpt()],new Map(),[]));
  assert.throws(()=>prepareEffectDefinitionExcerpts([{...excerpt(),excerpt_note:''}],new Map(),[]));
});

test('standalone evidence and absent overlays never create variants, ownership or private evidence',()=>{
  const data=empty();data.guideData.verifiedCollection={effectDefinitionUpdates:prepareEffectDefinitionUpdates([tooltip('Depose')],new Map(),[])};
  const result=ask(data,'Define Depose');assert.match(JSON.stringify(result),/No exact variant or ownership is inferred/);assert.deepEqual(data.guideData.champions,[]);
  delete data.guideData.verifiedCollection;assert.doesNotMatch(JSON.stringify(ask(data,'Define Depose')),/synthetic-library|Synthetic exact definition/);
});

test('historical definitions and partial excerpt notes render only as escaped text',()=>{
  const payload='<img src=x onerror=alert(1)>';
  const html=tooltipEvidenceMarkup({evidenceKind:'trait_excerpt',reviewStatus:'partial',text:payload,excerptNote:payload,sourceFilenames:[payload],historicalDefinitions:[{name:payload,text:payload,provenanceRef:payload}]});
  assert.doesNotMatch(html,/<img|<script/);assert.match(html,/&lt;img/);assert.match(html,/Partial trait excerpt/);
});
