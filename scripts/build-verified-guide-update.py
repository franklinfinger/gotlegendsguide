#!/usr/bin/env python3
"""Generate the additive October 8 source-backed Supabase migration."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'data/source-images/guide-updates-2026-10-08/manifest.json'
PORTRAIT = ROOT / 'assets/champion-portraits/ned-stark-hand-of-the-king-red-source-crop.png'
OUTPUT = ROOT / 'supabase/migrations/20261008040000_ned_ormund_viserys_verified_update.sql'
NED = 'screenshot-variant-ned-stark-hand-of-the-king-red'
ORMUND = 'screenshot-variant-ormund-hightower-beacon-of-the-south'
VISERYS = 'sqlite-champion-41'

def q(value):
    return "'" + str(value).replace("'", "''") + "'"

images = json.loads(MANIFEST.read_text())['images']
assert len(images) == 12 and [x['source_id'] for x in images] == list(range(103879, 103891))
sql = ['-- New user-supplied game cards; existing normalized facts and old evidence are retained.']
for image in images:
    sid = image['source_id']
    sql += [
        f"INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES ({sid},{q(image['filename'])},{q('photos:'+image['filename'])},{q(image['archive_locator'])},'user_supplied_screenshot','visually_verified','Original screenshot exported from the user''s Photos library.') ON CONFLICT (source_id) DO NOTHING;",
        f"INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES ({sid},{q('photos:'+image['filename'])},{q(image['archive_locator'])},{q(image['filename'])},'visually_verified',1) ON CONFLICT (source_id) DO NOTHING;",
        f"INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES ({sid},{q(image['sha256'])},{image['byte_count']},{image['dimensions']['width']},{image['dimensions']['height']},'guide-update-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;",
    ]

sql += [
    "INSERT INTO knowledge.champion_variants (id,character_id,display_name,rarity,gem_color,confidence,review_status,live_status) VALUES "
    f"({q(NED)},'sqlite-character-2','Ned Stark — The Hand of the King','Legendary','Red',1,'complete','live') ON CONFLICT (id) DO NOTHING;",
    "UPDATE knowledge.champion_variants SET display_name='Viserys Targaryen III — The Usurped' WHERE id='sqlite-champion-41' AND display_name IN ('Viserys Targaryen III','Viserys Targaryen III — The Usurped');",
    "INSERT INTO knowledge.champion_portraits (id,variant_id,legacy_key,asset_path,source_script,sha256,source_image_id,attribution,review_state) VALUES "
    f"('source-crop-ned-stark-hand-of-the-king-red',{q(NED)},'photos:IMG_3880.PNG','assets/champion-portraits/ned-stark-hand-of-the-king-red-source-crop.png','sips 640x640 crop offset 570x310; resize 512x512',{q(hashlib.sha256(PORTRAIT.read_bytes()).hexdigest())},103880,'User supplied GOT: Legends game screenshot; game art remains with its rights holder.','source_profile_crop') ON CONFLICT (id) DO NOTHING;",
    "INSERT INTO knowledge.faction_memberships (variant_id,faction_id,live_status,confidence,source_id) VALUES "
    f"({q(NED)},'sqlite-faction-537461726b','live',1,103880),({q(ORMUND)},'sqlite-faction-477265656e73','live',1,103879) "
    "ON CONFLICT (variant_id,faction_id) DO UPDATE SET live_status='live',confidence=1,source_id=EXCLUDED.source_id;",
    "INSERT INTO knowledge.faction_rules (id,faction_id,exact_text,live_status,source_id,announced_update_id) VALUES "
    "('greens-how-to-play','sqlite-faction-477265656e73','The Greens start strong with BIRTHRIGHT. They must act quickly, as BIRTHRIGHT fades as the battle goes on.','live',103879,NULL) ON CONFLICT (id) DO NOTHING;",
    "INSERT INTO knowledge.faction_rule_sources (rule_id,source_id) VALUES ('greens-bonus',103879),('greens-how-to-play',103879),('stark-bonus',103881),('stark-how-to-play',103881) ON CONFLICT DO NOTHING;",
]

leader = ('The King Called On Me To Serve', 'Leader · Once. At the start of combat, Ned grants up to 2 random allies LOYALTY, 1 BLOCK and +8% Stamina and spawns 1 Justice Gem. When a Justice Gem hits a BRITTLE enemy, Ned strikes them for 75% ATK Physical Damage. 5-star locked upgrade shown: +7% Stamina and +1 Justice Gems.')
trait = ('You Think My Life Is Precious To Me? II', 'Per Turn. Whenever an enemy is afflicted with ICE, up to 3 times a turn, Ned HEALS himself for 8% of his ATK. If that ICE was applied by an ally with LOYALTY, that ally is also HEALED. 6-star locked upgrade shown: HEALING increased by 2% ATK, and can trigger 1 additional time per turn. Stats Bonus: +5% HP and +10% DEF. 5-star locked: +5% ATK. 7-star locked: +5% DEF.')
skill = ('I Will Not Have Their Blood On My Hands', 'Skill Level 5 · Normal Stamina Speed · ADD BUFF · SPAWN GEM. Ned grants a target ally LOYALTY, with a 45% chance to also grant BLOCK. He then spawns 1 Justice Gem. If Ned is targeted, he spawns 1 additional Justice Gem. Level 6 upgrade shown: +5% chance to give BLOCK.')
loyalty = 'If POISON, DECEIVE, or SCOUT is inflicted on this Champion, Ned gains the debuff instead for 3 turns. Ned has a 50% chance to cleanse it from himself immediately.'
abilities = [
    ('ned-hand-king-called-trait','trait',*leader,103882),
    ('ned-hand-life-precious-trait','trait',*trait,103886),
    ('ned-hand-blood-on-my-hands-skill','champion_skill',*skill,103887),
]
for aid, kind, name, wording, sid in abilities:
    sql.append(f"INSERT INTO knowledge.abilities (id,kind,name,variant_id,source_id,provenance,confidence,review_status,exact_visible_text) VALUES ({q(aid)},{q(kind)},{q(name)},{q(NED)},{sid},'Screenshot Verified',1,'complete',{q(wording)}) ON CONFLICT (id) DO NOTHING;")
    sql.append(f"INSERT INTO knowledge.ability_effects (id,ability_id,effect_kind,exact_visible_text) VALUES ({q(aid+'-effect')},{q(aid)},'source_verified_wording',{q(wording)}) ON CONFLICT (id) DO NOTHING;")
sql.append(f"INSERT INTO knowledge.status_definitions (status_id,status_name,exact_visible_definition,completion_state,source_id) VALUES (103888,'LOYALTY',{q(loyalty)},'complete',103888) ON CONFLICT (status_id) DO NOTHING;")
for mid, name, category in [
    ('loyalty','LOYALTY','buff'),('loyalty_redirect','LOYALTY debuff redirection','support'),
    ('block','BLOCK','buff'),('justice_gem','Justice Gem','gem'),('ice_synergy','ICE ally synergy','synergy'),
    ('self_fire','FIRE applied to self','self_status'),('fire_resistance','Fire Resistance','resistance'),
    ('ally_skill_trigger','Ally Skill trigger','trigger'),
]:
    sql.append(f"INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES ({q(mid)},{q(name)},{q(category)}) ON CONFLICT (id) DO NOTHING;")

facts = [
    ('leader-effect','leader_effect','leads','leader',leader[0]+': At the start of combat, Ned grants up to 2 random allies LOYALTY, 1 BLOCK and +8% Stamina and spawns 1 Justice Gem.',103882),
    ('leader-loyalty','loyalty','grants','leader',leader[0]+': Ned grants up to 2 random allies LOYALTY at the start of combat.',103882),
    ('leader-block','block','grants','leader',leader[0]+': Ned grants up to 2 random allies 1 BLOCK at the start of combat.',103882),
    ('leader-stamina','stamina','grants','leader',leader[0]+': Ned grants up to 2 random allies +8% Stamina at the start of combat.',103882),
    ('leader-justice','justice_gem','spawns','leader',leader[0]+': Ned spawns 1 Justice Gem at the start of combat.',103883),
    ('leader-brittle','brittle_payoff','strikes','leader',leader[0]+': When a Justice Gem hits a BRITTLE enemy, Ned strikes them for 75% ATK Physical Damage.',103884),
    ('leader-physical','physical_damage','deals','leader',leader[0]+': When a Justice Gem hits a BRITTLE enemy, Ned strikes them for 75% ATK Physical Damage.',103884),
    ('trait-healing','healing','heals','trait',trait[0]+': Whenever an enemy is afflicted with ICE, up to 3 times a turn, Ned HEALS himself for 8% of his ATK.',103882),
    ('trait-loyalty-heal','loyalty','heals','trait',trait[0]+': If ICE was applied by an ally with LOYALTY, that ally is also HEALED.',103886),
    ('trait-ice-trigger','ice_synergy','reacts','trait',trait[0]+': Ned HEALS when an enemy is afflicted with ICE; he does not apply ICE in this trait.',103882),
    ('skill-loyalty','loyalty','grants','skill',skill[0]+': Ned grants a target ally LOYALTY.',103887),
    ('skill-block','block','grants','skill',skill[0]+': Ned has a 45% chance to also grant BLOCK to the target ally.',103887),
    ('skill-justice','justice_gem','spawns','skill',skill[0]+': Ned spawns 1 Justice Gem and, if he is targeted, 1 additional Justice Gem.',103887),
    ('loyalty-redirect','loyalty_redirect','redirects','skill','LOYALTY: If POISON, DECEIVE, or SCOUT is inflicted on this Champion, Ned gains the debuff instead for 3 turns.',103888),
    ('loyalty-cleanse','cleanse','cleanses','skill','LOYALTY: Ned has a 50% chance to cleanse the redirected debuff from himself immediately.',103888),
    ('item-self-fire','self_fire','applies_to_self','item','I Am The Dragon IV: Once per turn when an ally uses their Skill, Viserys has a 60% chance to apply FIRE on himself.',103890),
    ('item-fire-resistance','fire_resistance','gains','item','I Am The Dragon IV: Viserys starts the battle with an indefinite 15% Fire Resistance Buff.',103890),
    ('item-ally-skill-trigger','ally_skill_trigger','reacts','item','I Am The Dragon IV: Once per turn when an ally uses their Skill, Viserys grants them 1 FURY and has a 60% chance to apply FIRE on himself.',103890),
]
for suffix, mechanic, role, context, wording, sid in facts:
    owner = VISERYS if suffix.startswith('item-') else NED
    fid = ('viserys-brooch-' if owner == VISERYS else 'ned-hand-') + suffix
    sql.append(f"INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ({q(fid)},{q(owner)},{q(mechanic)},{q(role)},{q(context)},{q(wording)},'verified_fact',{q('source:'+str(sid))},{sid},1,'complete') ON CONFLICT (id) DO NOTHING;")
    sql.append(f"INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact',{q(fid)},{sid},'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;")

# The existing item and ability are the correct IDs. Add newly available card
# evidence, improve provenance, and leave account-specific Level 17 stats out.
sql += [
    "-- Keep the original ability and item source IDs; attach the new originals as additional evidence.",
]
evidence = [
    ('champion_variant',NED,[103880]),('champion_portrait','source-crop-ned-stark-hand-of-the-king-red',[103880]),
    ('faction_membership',NED+'/Stark',[103880]),('faction_membership',ORMUND+'/Greens',[103879]),
    ('faction_rule','greens-bonus',[103879]),('faction_rule','greens-how-to-play',[103879]),
    ('faction_rule','stark-bonus',[103881]),('faction_rule','stark-how-to-play',[103881]),
    ('ability','ned-hand-king-called-trait',[103882,103883,103884]),
    ('ability','ned-hand-life-precious-trait',[103882,103885,103886]),
    ('ability','ned-hand-blood-on-my-hands-skill',[103887,103888]),
    ('status_definition','103888',[103888]),('champion_variant',VISERYS,[103889]),
    ('iconic_item','sqlite-iconic-item-22',[103889,103890]),
    ('ability','sqlite-iconic_abilities-22',[103890]),
]
for kind, rid, sids in evidence:
    for sid in sids:
        sql.append(f"INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ({q(kind)},{q(rid)},{sid},'current_game_screenshot','visually_verified') ON CONFLICT DO NOTHING;")

# The preview reads new records and Greens' newly verified 3-member threshold.
preview_source = (ROOT / 'supabase/migrations/20261008030000_ormund_preview_companion.sql').read_text()
preview = preview_source.split('CREATE OR REPLACE FUNCTION public.got_guide_data_preview()',1)[1].split('REVOKE ALL ON FUNCTION public.got_guide_data_preview()',1)[0]
preview = preview.replace("'provenance', a.provenance", "'provenance', CASE WHEN a.id='sqlite-iconic_abilities-22' THEN 'Screenshot Verified' ELSE a.provenance END")
sql += ['CREATE OR REPLACE FUNCTION public.got_guide_data_preview()'+preview,
        'REVOKE ALL ON FUNCTION public.got_guide_data_preview() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data_preview() TO anon, authenticated;']

# Preserve the deployed main build's read model while both branches use the
# same Supabase project. The new red Ned, Ormund membership, Greens play text,
# Viserys subtitle and LOYALTY definition are preview-only until release.
prod_source = (ROOT / 'supabase/migrations/20261008020000_ormund_preview_read_model.sql').read_text()
prod = 'CREATE OR REPLACE FUNCTION public.got_guide_data()' + prod_source.split('CREATE OR REPLACE FUNCTION public.got_guide_data()',1)[1].split('REVOKE ALL ON FUNCTION public.got_guide_data()',1)[0]
changes = [
    ("'name', v.display_name,", "'name', CASE WHEN v.id='sqlite-champion-41' THEN 'Viserys Targaryen III' ELSE v.display_name END,"),
    ("'ownerName', v.display_name,", "'ownerName', CASE WHEN v.id='sqlite-champion-41' THEN 'Viserys Targaryen III' ELSE v.display_name END,"),
    (f"AND v.id <> {q(ORMUND)})", f"AND v.id NOT IN ({q(ORMUND)},{q(NED)}))"),
    (f"WHERE a.variant_id IS NULL OR a.variant_id <> {q(ORMUND)}),", f"WHERE (a.variant_id IS NULL OR a.variant_id NOT IN ({q(ORMUND)},{q(NED)})) AND a.id <> 'loyalty-ned-hand-definition'),"),
    ("WHERE fm.faction_id=f.id AND fm.live_status='live'),", f"WHERE fm.faction_id=f.id AND fm.live_status='live' AND fm.variant_id NOT IN ({q(ORMUND)},{q(NED)})),"),
    ("WHERE r.faction_id=f.id AND r.live_status='live'),", "WHERE r.faction_id=f.id AND r.live_status='live' AND r.id <> 'greens-how-to-play'),"),
    ("FROM knowledge.status_definitions d),", "FROM knowledge.status_definitions d WHERE d.status_name <> 'LOYALTY'),"),
    ("WHERE a.kind='definition'),", "WHERE a.kind='definition' AND a.id <> 'loyalty-ned-hand-definition'),"),
]
for old,new in changes:
    assert old in prod, old
    prod = prod.replace(old,new)
sql += [prod,'REVOKE ALL ON FUNCTION public.got_guide_data() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data() TO anon, authenticated;']

raid_source = (ROOT / 'supabase/migrations/20261008000000_raid_synergy_read_model.sql').read_text()
raid = 'CREATE OR REPLACE FUNCTION public.got_raid_synergy_data()' + raid_source.split('CREATE OR REPLACE FUNCTION public.got_raid_synergy_data()',1)[1].split('REVOKE ALL ON FUNCTION public.got_raid_synergy_data()',1)[0]
raid = raid.replace('public.got_raid_synergy_data()', 'public.got_raid_synergy_data_preview()').replace("('audit-faction-bolton',102776)", "('audit-faction-bolton',102776),\n        ('sqlite-faction-477265656e73',103879)")
sql += [raid, 'REVOKE ALL ON FUNCTION public.got_raid_synergy_data_preview() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_raid_synergy_data_preview() TO anon, authenticated;']
strategy_source = (ROOT / 'supabase/migrations/20261007060000_first_party_assault_lineups.sql').read_text()
strategy = 'CREATE OR REPLACE FUNCTION public.got_strategy_data()' + strategy_source.split('CREATE OR REPLACE FUNCTION public.got_strategy_data()',1)[1].split('REVOKE ALL ON FUNCTION public.got_strategy_data()',1)[0]
sql += [strategy.replace('public.got_strategy_data()', 'public.got_strategy_data_preview()'),
        'REVOKE ALL ON FUNCTION public.got_strategy_data_preview() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_strategy_data_preview() TO anon, authenticated;']
legacy_strategy = strategy.replace('FROM knowledge.strategy_mechanics m)', "FROM knowledge.strategy_mechanics m WHERE m.id NOT IN ('loyalty','loyalty_redirect','block','justice_gem','ice_synergy','self_fire','fire_resistance','ally_skill_trigger'))")
legacy_strategy = legacy_strategy.replace('FROM knowledge.strategy_champion_facts f)', "FROM knowledge.strategy_champion_facts f WHERE f.id NOT LIKE 'ned-hand-%' AND f.id NOT LIKE 'viserys-brooch-%')")
assert legacy_strategy != strategy
sql += [legacy_strategy,
        'REVOKE ALL ON FUNCTION public.got_strategy_data() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_strategy_data() TO anon, authenticated;']
sql.append(f"DO $$ BEGIN IF (SELECT count(*) FROM knowledge.champion_variants WHERE display_name='Ned Stark — The Hand of the King' AND gem_color='Red') <> 1 THEN RAISE EXCEPTION 'Red Ned variant is not unique'; END IF; IF (SELECT count(*) FROM knowledge.abilities WHERE variant_id={q(NED)} AND review_status='complete') <> 3 THEN RAISE EXCEPTION 'Red Ned cards incomplete'; END IF; IF (SELECT count(*) FROM knowledge.faction_memberships WHERE variant_id={q(ORMUND)} AND live_status='live') <> 1 THEN RAISE EXCEPTION 'Ormund Greens membership incomplete'; END IF; IF (SELECT owner_variant_id FROM knowledge.iconic_item_catalog WHERE id='sqlite-iconic-item-22') <> 'sqlite-champion-41' THEN RAISE EXCEPTION 'Dragon Brooch owner changed'; END IF; IF jsonb_array_length(public.got_guide_data()->'champions') <> 108 THEN RAISE EXCEPTION 'Production guide champion count changed'; END IF; IF jsonb_array_length(public.got_guide_data_preview()->'champions') <> 110 THEN RAISE EXCEPTION 'Preview champion count incorrect'; END IF; IF jsonb_array_length(public.got_raid_synergy_data()->'factionActivations') <> 4 OR jsonb_array_length(public.got_raid_synergy_data_preview()->'factionActivations') <> 5 THEN RAISE EXCEPTION 'Raid faction activation isolation failed'; END IF; IF jsonb_array_length(public.got_strategy_data()->'mechanics') <> 61 OR jsonb_array_length(public.got_strategy_data_preview()->'mechanics') <> 69 THEN RAISE EXCEPTION 'Strategy isolation failed'; END IF; END $$;")
text = '\n'.join(sql)+'\n'
if '--check' in sys.argv:
    if OUTPUT.read_text() != text:
        raise SystemExit('Verified migration differs from source manifest or generator.')
    print(f'Validated source-backed migration: {len(images)} images, {len(facts)} strategy facts.')
else:
    OUTPUT.write_text(text)
    print(f'Generated {OUTPUT.name}: {len(images)} screenshots, {len(facts)} strategy facts.')
