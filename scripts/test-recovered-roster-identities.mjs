import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogIdentities } from '../champion-identities.js';
import { integrateVerifiedHandoff } from '../verified-handoff.js';

test('recovered historical exact subtitles preserve both existing legacy IDs without importing old profile stats',()=>{
  for(const [id,name,subtitle,source] of [['legacy-champion-aegonii','Aegon II Targaryen','The True King','source_id=102302'],['legacy-champion-yara','Yara Greyjoy','Yara Greyjoy','source_id=102276']]) {
    const identity=catalogIdentities.filter(row=>row.championName===name&&row.exactVariant===subtitle);
    assert.equal(identity.length,1);assert.equal(identity[0].variantId,id);assert.match(identity[0].provenanceRef,new RegExp(source.replace('.','\\.')));
    assert.ok(!Object.hasOwn(identity[0],'level'));assert.ok(!Object.hasOwn(identity[0],'stars'));
    const handoff={capture_date:'2026-11-04',review_completed_date:'2026-11-06',champion_capture_groups:[{capture_group_id:'SyntheticG1',champion:name,exact_variant:subtitle,profile_anchor:'synthetic-overview.mov',group_source_filenames:['synthetic-overview.mov'],fields_as_recorded:{profile:'Dated overview only.'}}],all_reviewed_source_filenames:['synthetic-overview.mov'],review_updates:[{character:name,variant:subtitle,capture_date:'2026-11-02',review_date:'2026-11-06',current_build:{level:123,stars:4,champion_rating:12345},source_files:[{file_name:'synthetic-overview.mov',library_file_id:'synthetic-video'}]}]};
    const guideData={champions:[{id,name,releaseState:'live',rarity:'Legendary',gemColor:'Yellow',factions:[]}],abilities:[{id:'old-max',variantId:id,kind:'skill',text:'Old 999% damage.'}],traits:[],items:[],factions:[],allyGems:[]};
    const r=integrateVerifiedHandoff({handoff,guideData,identities:catalogIdentities});
    assert.deepEqual(r.guideData.verifiedCollection.variantIds,[id]);assert.equal(r.guideData.champions.length,1);
    const state=r.guideData.champions[0].screenshotState;
    assert.equal(state.captureDate,'2026-11-02');assert.equal(state.development.captureDate,'2026-11-02');
    assert.equal(state.development.level,123);assert.equal(state.development.stars,4);
    assert.equal(r.guideData.abilities.length,0);assert.equal(r.audit.missingSkills.length,1);
    assert.equal(r.guideData.verifiedCollection.records.length,0);
  }
});
