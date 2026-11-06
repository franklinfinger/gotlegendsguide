import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEvidenceSnapshot, restoreEvidenceSnapshot, sanitizeEvidence, prepareIdentityReconciliation } from '../src/evidence.js';
import { evidenceFixture } from './fixtures/evidence.mjs';
test('full structured evidence and local-only exact identity survive independent-device JSON round trip',()=>{
  const f=evidenceFixture(); const original=JSON.stringify(f.handoff);
  const prepared=prepareEvidenceSnapshot(f);
  assert.equal(JSON.stringify(f.handoff),original,'preparation never mutates the source');
  assert.match(prepared.snapshot.identityMap[0].variantId,/^local-verified:/);
  assert.equal(prepared.snapshot.handoff.review_updates[0].source_files[0].local_path,undefined);
  assert.equal(prepared.snapshot.handoff.review_updates[0].source_files[0].library_file_id,'synthetic-reviewed-file');
  const second=restoreEvidenceSnapshot({snapshot:JSON.parse(JSON.stringify(prepared.snapshot)),guideData:structuredClone(f.guideData)});
  const champion=second.guideData.champions.find(row=>row.id===prepared.snapshot.identityMap[0].variantId);
  assert.equal(champion.screenshotState.currentBuild.stars,3);
  assert.equal(champion.screenshotState.currentBuild.defense_display,'5.5K');
  const skill=second.guideData.abilities.find(row=>row.variantId===champion.id);
  assert.equal(skill.text,f.handoff.review_updates[0].skill.text);
  assert.equal(skill.lockedPreview,'+5% SHIELD power');
  assert.equal(skill.sourceIdentities[0].library_file_id,'synthetic-reviewed-file');
  assert.equal(second.guideData.verifiedCollection.effectDefinitionUpdates[0].text,'Synthetic exact tooltip wording.');
  assert.equal(second.guideData.verifiedCollection.effectDefinitionUpdates[0].sourceIdentities[0].library_file_id,'synthetic-tooltip-file');
  assert.deepEqual(second.guideData.verifiedCollection.reviewedGroups,f.handoff.champion_capture_groups);
  assert.deepEqual(second.guideData.verifiedCollection.supplementalPanels,f.handoff.supplemental_panels);
  assert.deepEqual(second.audit.mappings,prepared.result.audit.mappings.map(row=>({...row,state:'existing_exact_identity',identityProvenance:[`saved-evidence:${row.groupId}`]})));
});
test('credential keys, malformed identities and silently remapped source identities fail closed',()=>{
  assert.throws(()=>sanitizeEvidence({password:'do-not-store'}),/credential/);
  assert.throws(()=>sanitizeEvidence(JSON.parse('{"__proto__":{}}')),/object-control/);
  const f=evidenceFixture(),{snapshot}=prepareEvidenceSnapshot(f);
  const bad=structuredClone(snapshot);bad.identityMap.push({...bad.identityMap[0]});
  assert.throws(()=>restoreEvidenceSnapshot({snapshot:bad,guideData:f.guideData}),/identities|identity/i);
  const missing=structuredClone(snapshot);delete missing.identityMap[0].exactVariant;
  assert.throws(()=>restoreEvidenceSnapshot({snapshot:missing,guideData:f.guideData}),/mapping is incomplete/);
  const changed=structuredClone(f.guideData);changed.champions.push({id:'new-canonical',name:'Private Example — Exact Local Variant'});
  assert.throws(()=>restoreEvidenceSnapshot({snapshot,guideData:changed}),/Ambiguous canonical identity/);
});


test('reviewed exact catalog link keeps local identity and source text, and rejects changed or ambiguous targets',()=>{
  const fixture=evidenceFixture(),{snapshot}=prepareEvidenceSnapshot(fixture);
  const current=structuredClone(fixture.guideData);current.champions.push({id:'new-canonical',name:'Private Example — Exact Local Variant'});
  const original=JSON.stringify(snapshot);
  const proposal=prepareIdentityReconciliation({snapshot,guideData:current,expectedRevision:1});
  assert.equal(JSON.stringify(snapshot),original);
  assert.deepEqual(proposal.snapshot.identityMap,snapshot.identityMap);
  assert.deepEqual(proposal.snapshot.handoff,snapshot.handoff);
  const restored=restoreEvidenceSnapshot({snapshot:proposal.snapshot,guideData:current});
  assert.equal(restored.guideData.verifiedCollection.variantIds[0],snapshot.identityMap[0].variantId);
  assert.equal(restored.guideData.abilities.find(row=>row.variantId===snapshot.identityMap[0].variantId).text,fixture.handoff.review_updates[0].skill.text);
  const wrong=structuredClone(current);wrong.champions.find(row=>row.id==='new-canonical').name='Another variant';
  assert.throws(()=>restoreEvidenceSnapshot({snapshot:proposal.snapshot,guideData:wrong}),/exact catalog match/);
  const duplicate=structuredClone(current);duplicate.champions.push({id:'other-canonical',name:'Private Example — Exact Local Variant'});
  assert.throws(()=>prepareIdentityReconciliation({snapshot,guideData:duplicate,expectedRevision:1}),/More than one exact/);
});
