import test from 'node:test';
import assert from 'node:assert/strict';
import { answerGuideQuestion, routeGuideQuestion } from '../knowledge-engine.js';

function fixture() {
  return {guideData:{champions:[{id:'example',name:'Example — Exact Variant',releaseState:'live'}],abilities:[],traits:[],items:[{id:'item',name:'Synthetic Sword',ownerVariantId:'example',abilities:[]}],factions:[],statuses:[{name:'GOLDEN BASTION',text:'Synthetic historical wording.'}],mechanics:[],verifiedCollection:{effectDefinitionUpdates:[{effectName:'GOLDEN BASTION',title:'Golden Bastion',text:'Synthetic tooltip wording.',reviewStatus:'complete',sourceFilenames:['synthetic.png'],provenanceRef:'synthetic:tooltip',scopes:[],observedChampion:'Example'}],effectDefinitions:[]}},strategyData:{championFacts:[],targets:[],mechanics:[]}};
}
const ask=(question,f=fixture())=>answerGuideQuestion({question,...f});

test('standalone tooltip ownership questions state uncertainty before source evidence',()=>{
  const f=fixture(),before=JSON.stringify(f);
  for(const question of ['Who owns GOLDEN BASTION?','Which champion owns Golden Bastion?','What champion owns Golden Bastion?','Who is the owner of Golden Bastion?','Owner of Golden Bastion','Who does Golden Bastion belong to?']) {
    const result=ask(question,f);
    assert.equal(result.intent,'effect_ownership');
    assert.equal(result.ownershipState,'unverified');
    assert.match(result.summary,/owner.*not established/i);
    assert.match(result.summary,/standalone tooltip or source scope does not prove ownership/i);
    assert.ok(result.facts.some(row=>row.wording==='Synthetic tooltip wording.'));
    assert.ok(result.facts.some(row=>/Standalone tooltip observed with Example/.test(row.wording)));
    assert.deepEqual(result.entries,[]);
  }
  assert.equal(JSON.stringify(f),before);
});

test('exact variant scope is reference evidence and never promoted to ownership',()=>{
  const f=fixture();f.guideData.verifiedCollection.effectDefinitionUpdates[0].scopes=[{variantId:'example'}];
  const result=ask('Who owns Golden Bastion?',f);
  assert.equal(result.ownershipState,'unverified');
  assert.ok(result.facts.some(row=>/Linked only to Example — Exact Variant/.test(row.wording)));
  assert.match(result.facts[0].wording,/linked variant.*not treated as an owner/);
  assert.deepEqual(result.entries,[]);
});

test('catalog-only ownership lookup does not leak imported evidence or call definition ownership',()=>{
  const f=fixture();delete f.guideData.verifiedCollection;
  const result=ask('Who owns GOLDEN BASTION?',f);
  assert.equal(result.intent,'effect_ownership');
  assert.match(result.summary,/not established/);
  assert.doesNotMatch(JSON.stringify(result),/synthetic.png|Synthetic tooltip wording/);
  assert.ok(result.facts.some(row=>row.wording==='Synthetic historical wording.'));
});

test('definition, battle, item owner and provider routes remain unchanged',()=>{
  const f=fixture();
  assert.equal(ask('Define Golden Bastion',f).intent,'private_effect_definition');
  assert.equal(ask('Who owns Synthetic Sword?',f).intent,'item_lookup');
  assert.equal(routeGuideQuestion('Who applies FIRE?',f).intent,'mechanic_lookup');
  assert.equal(routeGuideQuestion('Who owns Golden Bastion for my team?',f).intent,'battle_recommendation');
  assert.notEqual(routeGuideQuestion('Who owns Golden Bastion and another effect?',f).intent,'effect_ownership');
});
