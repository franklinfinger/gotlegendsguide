import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReviewedAbilities, integrateVerifiedHandoff } from '../verified-handoff.js';

// Synthetic evidence only. Production regressions are reproduced by structure,
// never by committing the owner's collection or private screenshot identities.
function fixture(field, raw) {
  const group = {capture_group_id:'SYNTHETIC',champion:'Example',exact_variant:'Boundary Test',profile_anchor:'IMG_901.PNG',group_source_filenames:['IMG_901.PNG','IMG_902.PNG'],fields_as_recorded:{[field]:raw}};
  const handoff = {capture_date:'2000-01-01',champion_capture_groups:[group],all_reviewed_source_filenames:group.group_source_filenames};
  return {group,handoff};
}

for (const [field,heading] of [['traits','**Example Trait III** — Once, MAX'],['current_skill','**Example Skill** — level 3, Slow'],['current_iconic','**Example Item**, level 5. **Example Item Ability II:**']]) {
  test(`quoted upgrade badge cannot replace current ${field} wording`, () => {
    const text = 'When an enemy uses a Skill, the Example gains 1 Coin Gem.';
    const {handoff,group} = fixture(field, `${heading}, marked “Upgraded.” “${text}” IMG_901.PNG. Next-level preview: “Grants every ally 90% Stamina and a 100% Max HP SHIELD.” IMG_902.PNG`);
    const before = JSON.stringify(handoff), result = extractReviewedAbilities(handoff,group);
    assert.equal(result.records.length,1);
    assert.equal(result.records[0].text,text);
    assert.equal(result.records[0].reviewStatus,'complete');
    assert.deepEqual(result.records[0].ignoredUiLabels,['Upgraded.']);
    assert.match(result.records[0].sourceBadgeText,/Upgraded/);
    assert.deepEqual(result.records[0].sourceFilenames,['IMG_901.PNG','IMG_902.PNG']);
    assert.equal(result.records[0].provenanceRef,`screenshot-handoff:2000-01-01:SYNTHETIC:${field}`);
    assert.deepEqual(result.issues,[]);
    assert.equal(JSON.stringify(handoff),before);
  });
}

test('consecutive UI labels are retained as metadata and clipped body stays partial', () => {
  const {handoff,group} = fixture('traits','**Example Trait** — Leader, “New!” marked “Upgraded.” “When an ally gains a SHIELD …” IMG_901.PNG');
  const {records,issues} = extractReviewedAbilities(handoff,group);
  assert.equal(records[0].text,'When an ally gains a SHIELD …');
  assert.equal(records[0].reviewStatus,'partial');
  assert.equal(records[0].context,'leader');
  assert.deepEqual(records[0].ignoredUiLabels,['New!','Upgraded.']);
  assert.equal(issues.length,1);
});

for (const suffix of ['', ' Next-level preview: “The Example grants all allies 90% Stamina.”', ' Locked upgrade: “The Example grants all allies 90% Stamina.”']) {
  test(`UI-only evidence cannot acquire current ability wording from ${suffix || 'an absent body'}`, () => {
    const {handoff,group} = fixture('current_skill',`**Example Skill** — level 1, marked “Upgraded.”${suffix} IMG_901.PNG`);
    const {records,issues} = extractReviewedAbilities(handoff,group);
    assert.deepEqual(records,[]);
    assert.equal(issues.length,1);
    assert.match(issues[0].reason,/no (?:current )?ability or score inferred/);
  });
}

test('unknown quoted UI labels are not silently treated as ability bodies', () => {
  const {handoff,group} = fixture('current_skill','**Example Skill** — marked “Available Soon!” “The Example grants an ally 40% Stamina.” IMG_901.PNG');
  const {records,issues} = extractReviewedAbilities(handoff,group);
  assert.deepEqual(records,[]);
  assert.match(issues[0].reason,/Unrecognized quoted UI annotation/);
});

for (const [field,heading] of [['traits','**Example Trait III** — Once'],['current_skill','**Example Skill** — level 3'],['current_iconic','**Example Item**, level 5. **Example Item Ability II:**']]) {
  test(`known badges cannot authorize a following unknown UI label in ${field}`, () => {
    for (const prefix of ['“New!” marked', 'marked “Upgraded.” badge:', '“New!” “MAX” indicator =']) {
      const {handoff,group} = fixture(field, `${heading} ${prefix} “Available Soon!” “The Example grants an ally 40% Stamina.” IMG_901.PNG`);
      const {records,issues} = extractReviewedAbilities(handoff,group);
      assert.deepEqual(records,[]);
      assert.equal(issues.length,1);
      assert.match(issues[0].reason,/Unrecognized quoted UI annotation/);
      const result=integrateVerifiedHandoff({handoff,guideData:{champions:[],abilities:[],traits:[],items:[],factions:[]},strategyData:{mechanics:[{id:'stamina'}],championFacts:[],curatedRecommendations:[]}});
      assert.equal(result.guideData.champions[0].reviewStatus,'partial');
      assert.deepEqual(result.guideData.verifiedCollection.records,[]);
      assert.deepEqual(result.strategyData.championFacts,[]);
    }
  });
}

test('an omitted trait prevents complete champion coverage even when its skill is complete', () => {
  const {handoff,group} = fixture('traits','**Example Trait** — marked “Upgraded.” IMG_901.PNG');
  group.fields_as_recorded.current_skill='**Example Skill** — level 1. “The Example strikes an enemy for 10% ATK Physical Damage.” IMG_901.PNG';
  const result=integrateVerifiedHandoff({handoff,guideData:{champions:[],abilities:[],traits:[],items:[],factions:[]},strategyData:null});
  assert.equal(result.guideData.champions[0].reviewStatus,'partial');
  assert.equal(result.audit.extractionIssues.length,1);
});

test('separate beginning and ending remain verbatim partial fragments without invented connectors', () => {
  const beginning='The Example strikes an enemy for 10% ATK Physical Damage. If the target';
  const ending='has a Buff, the Example gains 1 Coin Gem.';
  const {handoff,group} = fixture('current_skill',`**Example Skill** — level 1. Visible beginning: “${beginning}” IMG_901.PNG. Visible ending: “${ending}” IMG_902.PNG. The connection between “target” and “has” is clipped; do not join these fragments.`);
  const {records,issues} = extractReviewedAbilities(handoff,group);
  assert.equal(records[0].text,beginning);
  assert.equal(records[0].reviewStatus,'partial');
  assert.deepEqual(records[0].textFragments,[{text:beginning,sourceFilenames:['IMG_901.PNG']},{text:ending,sourceFilenames:['IMG_902.PNG']}]);
  assert.match(records[0].reviewNotes[0],/unverified connection/);
  assert.match(issues[0].reason,/partial fragments/);
  assert.deepEqual(issues[0].sourceFilenames,['IMG_901.PNG','IMG_902.PNG']);
  const result=integrateVerifiedHandoff({handoff,guideData:{champions:[],abilities:[],traits:[],items:[],factions:[]},strategyData:{mechanics:[{id:'physical_damage'}],championFacts:[],curatedRecommendations:[]}});
  assert.deepEqual(result.strategyData.championFacts,[]);
  assert.equal(result.guideData.champions[0].reviewStatus,'partial');
});

test('an isolated visible beginning is partial even without ellipses or an ending', () => {
  const {handoff,group} = fixture('traits','**Example Trait** — Once. Visible beginning: “When the Example gains a Buff” IMG_901.PNG');
  const {records} = extractReviewedAbilities(handoff,group);
  assert.equal(records[0].reviewStatus,'partial');
  assert.equal(records[0].textFragments.length,1);
});

test('later editorial quotations and locked upgrades do not replace or join current text', () => {
  const text='The Example gains 1 Buff, with an 50% chance to gain another.';
  const {handoff,group} = fixture('traits',`**Example Trait** — Once. “${text}” The “an 50%” wording is as displayed. Six-star “Gains 5 Buffs.” is locked. IMG_901.PNG`);
  const {records,issues} = extractReviewedAbilities(handoff,group);
  assert.equal(records[0].text,text);
  assert.equal(records[0].reviewStatus,'complete');
  assert.equal(records[0].textFragments,undefined);
  assert.deepEqual(issues,[]);
});

test('clipped titles and lower stats rows do not mark readable ability text as clipped', () => {
  const {handoff,group} = fixture('traits','**[clipped] Example** — the beginning of the title is clipped. “When an ally uses a Skill, gain 1 Coin Gem.” **Stats Bonus:** bottom locked row is clipped. IMG_901.PNG');
  const {records,issues} = extractReviewedAbilities(handoff,group);
  assert.equal(records[0].reviewStatus,'complete');
  assert.deepEqual(issues,[]);
});
