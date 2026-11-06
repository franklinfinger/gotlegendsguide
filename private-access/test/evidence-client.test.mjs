import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerStore, OWNER_TABLE, ROSTER_TABLE, EVIDENCE_TABLE, VARIANT_TABLE } from '../src/client.js';
import { evidenceFixture } from './fixtures/evidence.mjs';
function service(guide) {
  const remote={evidence:null,variants:new Map(),owned:new Set(),allowed:true};
  const sdk={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},rpc:async()=>({data:structuredClone(guide)}),from(table){
    const filters={};let action='read',values;
    const run=()=>{
      if(table===OWNER_TABLE)return {data:remote.allowed?{user_id:'owner'}:null};
      if(table===EVIDENCE_TABLE){
        if(action==='insert'){if(remote.evidence)return {error:{code:'23505'}};remote.evidence=structuredClone(values);}
        if(action==='update'){if(remote.evidence?.revision!==filters.revision)return {data:null};remote.evidence={...remote.evidence,...structuredClone(values)};}
        return {data:structuredClone(remote.evidence)};
      }
      if(table===VARIANT_TABLE){if(action==='upsert'&&!remote.variants.has(values.variant_id))remote.variants.set(values.variant_id,structuredClone(values));return {data:[...remote.variants.values()]};}
      if(table===ROSTER_TABLE){if(action==='upsert')remote.owned.add(values.variant_id);if(action==='delete')remote.owned.delete(filters.variant_id);return {data:filters.variant_id?(remote.owned.has(filters.variant_id)?{variant_id:filters.variant_id}:null):[...remote.owned].map(variant_id=>({variant_id}))};}
      throw Error('Unexpected table');
    };
    const chain={select(){return chain;},eq(key,value){filters[key]=value;return chain;},order(){return chain;},maybeSingle(){return Promise.resolve(run());},insert(value){action='insert';values=value;return chain;},update(value){action='update';values=value;return chain;},upsert(value){action='upsert';values=value;return chain;},delete(){action='delete';return chain;},then(resolve,reject){return Promise.resolve(run()).then(resolve,reject);}};return chain;
  }};
  const create=()=>createOwnerStore({config:{enabled:true,url:'http://localhost:54321',publishableKey:'sb_publishable_mock'},createClient:()=>sdk});
  return {remote,create};
}
test('two independent adapters restore complete evidence/local roster and reject stale evidence saves',async()=>{
  const fixture=evidenceFixture(),{remote,create}=service(fixture.guideData);
  const first=create(),second=create();
  const prepared=await first.prepareEvidence(fixture.handoff);
  assert.equal(remote.evidence,null,'preparing a selected file never uploads it');
  await first.saveEvidence(prepared.snapshot,0);
  const loaded=await second.readCollection();
  assert.equal(loaded.evidenceRevision,1);
  const local=loaded.champions.find(row=>row.id.startsWith('local-verified:'));
  assert.ok(local);assert.equal(local.screenshotState.currentBuild.stars,3);
  assert.equal(loaded.guideData.verifiedCollection.effectDefinitionUpdates[0].text,'Synthetic exact tooltip wording.');
  await second.setOwned(local.id,true);
  assert.equal(remote.variants.get(local.id).canonical_variant_id,null);
  assert.equal((await first.readCollection()).variantIds.includes(local.id),true);
  const replacement=structuredClone(prepared.snapshot);replacement.handoff.interpretation_rules.push('Explicit later review note.');
  await second.saveEvidence(replacement,1);
  await assert.rejects(first.saveEvidence(prepared.snapshot,1),error=>error.code==='evidence_conflict');
  assert.equal((await first.readCollection()).evidenceRevision,2);
  assert.ok(remote.evidence.payload.handoff.interpretation_rules.includes('Explicit later review note.'));
  assert.equal(remote.evidence.payload.handoff.review_updates[0].source_files[0].local_path,undefined);
});


test('identity conflict has owner-only unchanged recovery and explicit local-ID-preserving reconciliation',async()=>{
  const fixture=evidenceFixture(),{remote,create}=service(fixture.guideData),store=create();
  const initial=await store.prepareEvidence(fixture.handoff);
  await store.saveEvidence(initial.snapshot,0);
  const localId=initial.snapshot.identityMap[0].variantId;
  await store.setOwned(localId,true);
  const before=structuredClone(remote.evidence);
  fixture.guideData.champions.push({id:'new-canonical',name:'Private Example — Exact Local Variant',factions:[],roles:[]});
  await assert.rejects(store.readCollection(),error=>error.code==='evidence_reconciliation_required');
  assert.deepEqual(await store.readEvidenceForRecovery(),before,'recovery exports the exact saved envelope despite restore conflict');
  const proposal=await store.proposeEvidenceReconciliation(1);
  assert.deepEqual(remote.evidence,before,'review preparation does not write');
  assert.deepEqual(proposal.snapshot.handoff,before.payload.handoff,'source text and provenance unchanged');
  assert.deepEqual(proposal.snapshot.identityMap,before.payload.identityMap,'saved local IDs are never reassigned');
  assert.equal(proposal.changes[0].canonicalVariantId,'new-canonical');
  await store.saveEvidence(proposal.snapshot,1);
  const restored=await store.readCollection();
  assert.equal(restored.evidenceRevision,2);
  assert.ok(restored.variantIds.includes(localId));
  assert.ok(restored.champions.some(row=>row.id===localId));
  assert.equal(restored.champions.some(row=>row.id==='new-canonical'),false,'reviewed duplicate is excluded only from private overlay');
  assert.ok(fixture.guideData.champions.some(row=>row.id==='new-canonical'),'base catalog is untouched');
  assert.deepEqual(remote.evidence.payload.handoff,before.payload.handoff);
  assert.deepEqual(remote.evidence.payload.identityMap,before.payload.identityMap);
  const reimport = await store.prepareEvidence(fixture.handoff);
  assert.equal(reimport.snapshot.identityMap[0].variantId,localId,'later imports keep the explicitly retained local identity');
  assert.deepEqual(reimport.snapshot.identityLinks,proposal.snapshot.identityLinks);
  await assert.rejects(store.saveEvidence(proposal.snapshot,1),error=>error.code==='evidence_conflict');
  remote.allowed=false;
  await assert.rejects(store.readEvidenceForRecovery(),error=>error.code==='not_owner');
  await assert.rejects(store.proposeEvidenceReconciliation(2),error=>error.code==='not_owner');
});
test('owned variants omitted by a replacement snapshot retain ownership but block recommendations visibly',async()=>{
  const fixture=evidenceFixture(),{remote,create}=service(fixture.guideData),store=create();
  await store.setOwned('v1',true);
  const prepared=await store.prepareEvidence(fixture.handoff);await store.saveEvidence(prepared.snapshot,0);
  const loaded=await store.readCollection();
  assert.ok(loaded.variantIds.includes('v1'));
  assert.equal(loaded.champions.find(row=>row.id==='v1').evidenceUnavailable,true);
  assert.equal(loaded.recommendationsBlocked,true);
  assert.deepEqual(loaded.unavailableOwnedVariantIds,['v1']);
  assert.deepEqual([...remote.owned],['v1']);
});
