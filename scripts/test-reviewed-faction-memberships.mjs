import test from 'node:test';
import assert from 'node:assert/strict';
import { applyReviewedFactionMemberships } from '../reviewed-faction-memberships.js';
import { integrateVerifiedHandoff } from '../verified-handoff.js';

function fixture() {
  const champions = ['a', 'b'].map(id => ({id, name: `Example ${id} — Exact`, factions: ['Blacks', 'Targaryen'], rarity: 'Legendary', roles: []}));
  const factions = ['Blacks', 'Targaryen', 'The Way Of Whispers'].map((name, i) => ({id: `f${i}`, name, memberVariantIds: i === 2 ? [] : ['a', 'b'], rules: [{kind: 'current_bonus', text: 'unchanged'}]}));
  const facts = champions.flatMap(champion => ['blacks', 'targaryen'].map(name => ({id: champion.id + name, variantId: champion.id, mechanicId: 'faction_' + name, effectRole: 'member', context: 'metadata', provenanceRef: 'synthetic:historical'})));
  const mappings = champions.map(champion => ({groupId: champion.id, variantId: champion.id, name: champion.name}));
  return {guide: {champions, factions, abilities: [], traits: [], items: []}, strategy: {mechanics: [], championFacts: [...facts, {id: 'skill', variantId: 'a', mechanicId: 'damage', context: 'skill'}], curatedRecommendations: []}, mappings, baseMembershipEvidence: facts, reviews: [{review_id: 'synthetic-a', capture_group_id: 'a', variant_id: 'a', champion: 'Example a', exact_variant: 'Exact', review_date: '2000-01-01', membership_scope: 'complete_exact_variant', factions: ['Blacks'], evidence: [{kind: 'screenshot', file_name: 'synthetic.png', library_file_id: 'synthetic-file', local_path: '/not-for-runtime', claim: 'Complete exact-variant profile has one banner.'}]}]};
}

test('complete exact-variant correction updates all membership surfaces and preserves unrelated data', () => {
  const f = fixture(), before = structuredClone(f);
  const result = applyReviewedFactionMemberships(f);
  assert.deepEqual(f.guide.champions[0].factions, ['Blacks']);
  assert.deepEqual(f.guide.champions[1], before.guide.champions[1]);
  assert.deepEqual(f.guide.factions[1].memberVariantIds, ['b']);
  assert.deepEqual(f.guide.factions.map(row => row.rules), before.guide.factions.map(row => row.rules));
  assert.deepEqual(f.strategy.championFacts.filter(row => row.variantId === 'a' && row.effectRole === 'member').map(row => row.mechanicId), ['faction_blacks']);
  assert.ok(f.strategy.championFacts.some(row => row.id === 'skill'));
  assert.deepEqual(result.evidence.filter(row => row.variantId === 'a').map(row => row.mechanicId), ['faction_blacks']);
  assert.equal(result.reviews[0].historicalMembershipEvidence.length, 2);
  assert.deepEqual(result.reviews[0].removed, ['Targaryen']);
  assert.ok(!JSON.stringify(result).includes('/not-for-runtime'));
});

test('explicit second faction resolves optional The prefix and keeps mechanic identities consistent', () => {
  const f = fixture(); f.reviews[0].factions = ['Blacks', 'Way of Whispers'];
  const result = applyReviewedFactionMemberships(f);
  assert.deepEqual(f.guide.champions[0].factions, ['Blacks', 'The Way Of Whispers']);
  assert.deepEqual(f.guide.factions[2].memberVariantIds, ['a']);
  assert.ok(f.strategy.mechanics.some(row => row.id === 'faction_way_of_whispers'));
  assert.ok(result.evidence.some(row => row.variantId === 'a' && row.mechanicId === 'faction_way_of_whispers'));
  applyReviewedFactionMemberships({...f, baseMembershipEvidence: result.evidence});
  assert.equal(f.guide.factions[2].memberVariantIds.length, 1);
  assert.equal(f.strategy.championFacts.filter(row => row.variantId === 'a' && row.effectRole === 'member').length, 2);
});

test('reject malformed, ambiguous, partial, duplicate and unsupported correction evidence atomically', () => {
  for (const mutate of [
    f => {f.reviews[0].exact_variant = 'Wrong';},
    f => {f.reviews[0].variant_id = 'b';},
    f => {f.reviews[0].membership_scope = 'visible_first_banner_only';},
    f => {f.reviews[0].factions = [];},
    f => {f.reviews[0].factions = ['Blacks', 'Blacks'];},
    f => {f.reviews[0].factions = ['Unknown'];},
    f => {f.reviews[0].factions = ['Blacks', 'Targaryen', 'Way of Whispers'];},
    f => {f.guide.factions.push({...f.guide.factions[0], id: 'duplicate'});},
    f => {f.reviews[0].evidence = [{kind: 'user_confirmation', message_id: 'synthetic', claim: 'Approved'}];},
    f => {f.reviews[0].evidence[0].library_file_id = '';},
    f => {f.reviews.push({...f.reviews[0], review_id: 'duplicate-variant'});},
    f => {f.reviews.push({...f.reviews[0], review_id: 'later', variant_id: 'missing'});},
  ]) {
    const f = fixture(); mutate(f); const before = JSON.stringify(f);
    assert.throws(() => applyReviewedFactionMemberships(f));
    assert.equal(JSON.stringify(f), before);
  }
});

test('absent reviews preserve the original catalog and membership evidence', () => {
  const f = fixture(); delete f.reviews; const before = JSON.stringify(f);
  assert.deepEqual(applyReviewedFactionMemberships(f).evidence, f.baseMembershipEvidence);
  assert.equal(JSON.stringify(f), before);
});

test('handoff integration applies only explicit reviews without mutating input or inferring from panels', () => {
  const f = fixture();
  const handoff = {capture_date: '2000-01-01', all_reviewed_source_filenames: ['IMG_100.PNG', 'IMG_101.PNG'], champion_capture_groups: f.mappings.map((row, i) => ({capture_group_id: row.groupId, champion: `Example ${row.variantId}`, exact_variant: 'Exact', profile_anchor: `IMG_${100 + i}.PNG`, group_source_filenames: [`IMG_${100 + i}.PNG`], fields_as_recorded: {profile: 'Synthetic profile'}})), faction_panels: [], faction_membership_reviews: f.reviews};
  const input = {handoff, guideData: f.guide, strategyData: f.strategy}, before = JSON.stringify(input);
  const result = integrateVerifiedHandoff(input);
  assert.equal(JSON.stringify(input), before);
  assert.equal(result.audit.factionMembershipsInferred, 0);
  assert.equal(result.audit.factionMembershipReviews.length, 1);
  assert.deepEqual(result.guideData.champions[0].factions, ['Blacks']);
  assert.deepEqual(result.guideData.identityChampions.find(row => row.id === 'a').factions, ['Blacks']);
  assert.deepEqual(result.guideData.verifiedCollection.factionMembershipEvidence.filter(row => row.variantId === 'a').map(row => row.mechanicId), ['faction_blacks']);
  assert.deepEqual(integrateVerifiedHandoff({...input, strategyData: null}).guideData.champions[0].factions, ['Blacks']);
  assert.equal(integrateVerifiedHandoff({...input, strategyData: null}).strategyData, null);
});
