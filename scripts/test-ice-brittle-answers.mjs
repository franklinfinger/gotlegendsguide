import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {answerGuideQuestion,routeGuideQuestion} from '../knowledge-engine.js';
import {iceBrittleCore,iceBrittleSynergyMarkup} from '../ice-brittle-synergy.js';
const [ned,brienne,rickard]=iceBrittleCore.map(row=>row.id);
const names=iceBrittleCore.map(row=>row.name);
const question='How do Ned Stark — Warden Of The North, Brienne Of Tarth — True Knight, and Rickard Karstark — Lord Of Karhold combine ICE and BRITTLE?';
const source=(variantId,kind,text,extra={})=>({id:'synthetic:'+variantId,variantId,kind,context:kind,name:'Synthetic source',text,reviewStatus:'complete',provenanceRef:'synthetic:'+variantId,sourceFilenames:['synthetic.png'],captureDate:'2000-01-01',reviewCompletedDate:'2000-01-02',...extra});
function fixture(){
  const champions=[...iceBrittleCore,{id:'other-ned',name:'Ned Stark — The Hand of the King'},{id:'other-brienne',name:'Brienne Of Tarth — Lady Of The Sapphire Isles'}].map(row=>({...row,releaseState:'live',reviewStatus:'complete',factions:[],roles:[]}));
  const records=[source(ned,'trait','At the start of combat and each new wave, all enemies are afflicted with 1 ICE. Ned is immune to BRITTLE.',{context:'leader'}),source(brienne,'skill','Brienne strikes an enemy for 225% ATK Physical Damage and strikes adjacent enemies for 120% ATK Physical Damage. Each of these enemies become afflicted with 2 ICE.'),source(rickard,'skill','Rickard afflicts an enemy with 2 ICE and 1 BLEED. If his target was already BRITTLE, they are afflicted with 3 BLEED instead. He then strikes them for 560% ATK Physical Damage. If Rickard defeats his target, he refunds 65% Stamina.')];
  const definition={...source(null,'tooltip','Applied when 5 ICE accumulate. BRITTLE targets take 2x damage from champion Skills and Traits. Cannot be REMOVED.'),effectName:'BRITTLE',title:'Brittle',scopes:[],sourceIdentities:[]};
  const guideData={champions,abilities:[],traits:[],items:[],factions:[],statuses:[],mechanics:[],verifiedCollection:{variantIds:champions.map(row=>row.id),records,effectDefinitionUpdates:[definition],effectDefinitions:[{effectName:'ICE'}]}};
  return {guideData,strategyData:{championFacts:[],targets:[],mechanics:[]}};
}
const ask=(text=question,f=fixture(),context={})=>answerGuideQuestion({...f,question:text,context});

test('exact natural-language trio question answers the source-validated setup in fresh, Raid and War context',()=>{
  for(const targetId of [null,'raid:attack','raid:defense','war:synthetic']) {
    const f=fixture(),context=targetId?{targetId,lastResult:{team:[],leader:{champion:{id:brienne}}}}:{},before=JSON.stringify({f,context});
    const result=ask(question,f,context);assert.equal(result.status,'ready');assert.equal(result.intent,'ice_brittle_setup');assert.equal(result.iceBrittleSynergy.status,'conditional_plan');assert.deepEqual(result.iceBrittleSynergy.steps.map(row=>row.ice),[1,2,2,0]);assert.equal(result.iceBrittleSynergy.score,0);assert.equal(result.iceBrittleSynergy.sourceEvidence.length,4);
    assert.match(result.facts[0].wording,/not an inferred selection/);assert.match(result.summary,/Raid\/War/);assert.match(result.summary,/not a selected five-champion team/);assert.doesNotMatch(JSON.stringify(result),/0 exact champion|No verified champion currently/);assert.equal(JSON.stringify({f,context}),before);assert.equal(result.context,undefined);
  }
});

test('explicit composition explanations precede compound-effect clarification, not just generic BRITTLE lookup',()=>{
  for(const text of ['Explain how '+names.join(', ')+' combine ICE and BRITTLE.','Explain how '+names.join(', ')+' use ICE and BRITTLE.','What is the ICE/BRITTLE setup with '+names.join(', ')+'?'])assert.equal(ask(text).iceBrittleSynergy.status,'conditional_plan');
  assert.equal(ask('Explain ICE and BRITTLE').status,'needs_clarification');
});

test('bare or wrong exact variants never silently substitute the supported core',()=>{
  for(const text of ['How do Ned, Brienne and Rickard combine ICE and BRITTLE?',question.replace('Warden Of The North','The Hand of the King'),question.replace('True Knight','Lady Of The Sapphire Isles')]){const result=ask(text);assert.equal(result.status,'needs_clarification');assert.match(result.message,/exact variants/);assert.equal(result.iceBrittleSynergy,undefined);}
});

test('only an explicitly requested Warden Leader or hypothetical requirement establishes the fifth ICE',()=>{
  const base=question.slice(0,-1);
  assert.equal(ask(base+' with Ned as Leader?').iceBrittleSynergy.status,'conditional_plan');
  for(const leader of ['Brienne','Rickard',names[1],names[2]]){const result=ask(base+' with '+leader+' as Leader?');assert.equal(result.iceBrittleSynergy.status,'leader_not_selected');assert.deepEqual(result.iceBrittleSynergy.steps,[]);assert.match(result.iceBrittleSynergy.limitations.join(' '),/only four from zero/);}
  for(const suffix of ['if Brienne leads?','with Brienne leading?','when Brienne is leading?','when led by Brienne?'])assert.equal(ask(base+' '+suffix).iceBrittleSynergy.status,'leader_not_selected');
  for(const suffix of ['with no Leader?','with Ned not as Leader?','with a different Leader?'])assert.equal(ask(base+' '+suffix).status,'needs_clarification');
});

test('source, threshold and roster guards remain authoritative through the new Ask route',()=>{
  for(const mutate of [f=>{f.guideData.verifiedCollection.records[1].reviewStatus='partial';},f=>{f.guideData.verifiedCollection.records[0].historicalReference=true;},f=>{f.guideData.verifiedCollection.records.push({...f.guideData.verifiedCollection.records[2],text:'Conflicting wording.'});},f=>{f.guideData.verifiedCollection.effectDefinitionUpdates=[];},f=>{f.guideData.verifiedCollection.effectDefinitionUpdates[0].text='Applied when 6 ICE accumulate.';},f=>{f.guideData.verifiedCollection.variantIds=f.guideData.verifiedCollection.variantIds.filter(id=>id!==ned);}]) {
    const f=fixture();mutate(f);const result=ask(question,f);assert.notEqual(result.iceBrittleSynergy.status,'conditional_plan');assert.deepEqual(result.iceBrittleSynergy.steps,[]);assert.match(result.summary,/not established/);
  }
});

test('dragon context cannot borrow the setup; an explicit Raid/War scope can switch the explanation only',()=>{
  assert.equal(ask(question,fixture(),{targetId:'legendary-assault:drogon'}).status,'needs_clarification');
  assert.equal(ask(question.slice(0,-1)+' against Drogon?').status,'needs_clarification');
  assert.equal(ask(question.slice(0,-1)+' for Raid attack?',fixture(),{targetId:'legendary-assault:drogon'}).iceBrittleSynergy.status,'conditional_plan');
});

test('definitions, providers and actual team/replacement requests keep their established routes',()=>{
  assert.equal(ask('What does BRITTLE do?').intent,'private_effect_definition');assert.equal(ask('Who applies BRITTLE?').intent,'mechanic_lookup');
  for(const text of ['Build a team using '+names.join(' and ')+' for Raid attack.','How does this team combine ICE and BRITTLE?','Replace '+names[0]+' in the '+names.slice(1).join(' and ')+' ICE/BRITTLE setup.'])assert.equal(routeGuideQuestion(text,{...fixture(),context:{targetId:'raid:attack'}}).intent,'battle_recommendation');
  const f=fixture();delete f.guideData.verifiedCollection;assert.notEqual(ask(question,f).intent,'ice_brittle_setup');
});

test('zero direct-provider entries describe the index limitation rather than claim no verified champions',()=>{
  const result=ask('Who applies BRITTLE?');assert.equal(result.entries.length,0);assert.match(result.summary,/No direct BRITTLE-application wording/);assert.match(result.summary,/lookup limit/);assert.doesNotMatch(JSON.stringify(result),/0 exact champion|No verified champion currently matches/);assert.equal(result.showEmpty,false);assert.match(result.facts.find(row=>row.title==='Lookup scope').wording,/does not count ICE setup sequences/);
  const poison=ask('Who applies POISON?');assert.match(poison.summary,/indexed facts/);assert.match(poison.facts[0].wording,/not a complete ability catalog/);
});

test('the knowledge view renders the shared setup source evidence, caveats and escaped text',()=>{
  const result=ask(),source=result.iceBrittleSynergy.sourceEvidence[0];source.text='<script>bad</script>';source.provenanceRef='<img src=x>';
  const html=iceBrittleSynergyMarkup(result);assert.match(html,/Exact setup sources/);assert.match(html,/No additional score/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script|<img/);
  assert.match(fs.readFileSync(new URL('../guide.js',import.meta.url),'utf8'),/iceBrittleSynergyMarkup\(answer\)/);
});
