#!/usr/bin/env python3
"""Build the source manifest and additive SQL for the October 2026 Ormund cards."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'data/source-images/ormund-2026-10-08'
MIGRATION = ROOT / 'supabase/migrations/20261008010000_ormund_hightower.sql'
ISOLATION = ROOT / 'supabase/migrations/20261008020000_ormund_preview_read_model.sql'
PREVIEW_FIX = ROOT / 'supabase/migrations/20261008030000_ormund_preview_companion.sql'
PORTRAIT = ROOT / 'assets/champion-portraits/ormund-hightower-source-crop.png'
VARIANT = 'screenshot-variant-ormund-hightower-beacon-of-the-south'

leader = ('When Dealing With Those Beneath You II', 'Leader · Once. When combat starts, Ormund grants 1 HOLY PURPOSE to 3 allies at random. Ormund grants his team 1 BIRTHRIGHT every time Treasury Coins are spent by the enemy team.')
trait = ('To Restore The Rightful Line III', 'Once. For the first 10 turns of combat, Ormund grants all team members a +20% Critical Strike Chance and +15% Critical Strike Damage Buff. When Ormund drops to his HP Guard at 50% HP, all team members gain 8 BIRTHRIGHT, he deals 250% ATK Physical Damage to all enemies and REMOVES 2 Buffs from each enemy. Stats Bonus: +10% DEF, +5% HP, +10% ATK. Rank 7 locked bonus: +5% HP.')
guard_trait = ('We Must Keep A Firm Grip III', 'Once. The Hightower Guardsman TAUNTS for 5 turns, has 5 BIRTHRIGHT, and 75% Stamina. The Guardsman grants all allies 2 BIRTHRIGHT every time he drops to a lower HP Guards at 75%, 50% and 25% each. Stats Bonus: +10% ATK, +5% Dodge. Rank 7 locked bonus: +5% Dodge.')
skill = ('Strength, Honour, Wisdom, and Justice', 'Skill Level 9 · Slow · PHYSICAL DAMAGE · AoE · ADD DEBUFF · ADD BUFF. Ormund deals 225% ATK Physical Damage to all enemies. During the first 10 turns of combat, all enemies are dealt a -20% DEF Debuff for 3 turns. From turn 11 onwards, all allies gain a +20% DEF Buff for 3 turns. Level 10 upgrade shown: -10% DEF Debuff.')
guard_skill = ('Never Apologize For Victory', 'Skill Level 9 · Fast · PHYSICAL DAMAGE · AoE · ADD DEBUFF · ADD BUFF. The Guardsman deals 185% Physical Damage to one enemy and gains a 20% Dodge Chance Buff for 3 turns. Level 10 upgrade shown: +2% Dodge Chance.')
inheritance = 'Hightower Guardsman will inherit their Level, Star Rank, and Skill Level from Ormund Hightower.'

# Each row records only the text visible on that specific card; combined text is
# attached to normalized records below, with every contributing source linked.
images = [
    ('champion profile', 'Ormund Hightower; Beacon of the South; LEGENDARY; Yellow; Level 325; 179,159 displayed power; ATK 46.3K; DEF 55.7K; HP 130.1K; 6 stars; rank 7 locked; Skill Lvl. 9', ['champion_variant', 'champion_portrait']),
    ('leader trait', 'When Dealing With Those Beneath You II; Leader; Once; When combat starts, Ormund grants 1 HOLY PURPOSE to 3 allies at random.', ['champion_trait', 'strategy_fact']),
    ('leader trait continuation', 'Ormund grants his team 1 BIRTHRIGHT every time Treasury Coins are spent by the enemy team.', ['champion_trait', 'strategy_fact']),
    ('champion trait', 'To Restore The Rightful Line III; Once; For the first 10 turns of combat, Ormund grants all team members a +20% Critical Strike Chance and +15% Critical Strike Damage Buff.', ['champion_trait', 'strategy_fact']),
    ('champion trait continuation', 'When Ormund drops to his HP Guard at 50% HP, all team members gain 8 BIRTHRIGHT, he deals 250% ATK Physical Damage to all enemies and REMOVES 2 Buffs from each enemy.', ['champion_trait', 'strategy_fact']),
    ('champion trait bonuses', 'Stats Bonus: +10% DEF; +5% HP; +10% ATK. Rank 7 locked bonus: +5% HP.', ['champion_trait']),
    ('associated unit trait', 'We Must Keep A Firm Grip III; Once; The Hightower Guardsman TAUNTS for 5 turns, has 5 BIRTHRIGHT, and 75% Stamina.', ['associated_unit', 'strategy_fact']),
    ('associated unit trait continuation', 'The Guardsman grants all allies 2 BIRTHRIGHT every time he drops to a lower HP Guards at 75%, 50% and 25% each. Stats Bonus: +10% ATK; +5% Dodge. Rank 7 locked bonus: +5% Dodge.', ['associated_unit', 'strategy_fact']),
    ('champion skill', 'Strength, Honour, Wisdom, and Justice; Skill Level 9; Slow; PHYSICAL DAMAGE; AoE; ADD DEBUFF; ADD BUFF. Ormund deals 225% ATK Physical Damage to all enemies. During the first 10 turns of combat, all enemies are dealt a -20% DEF Debuff for 3 turns. From turn 11 onwards, all allies gain a +20% DEF Buff for 3 turns. Level 10 upgrade: -10% DEF Debuff.', ['champion_skill', 'strategy_fact']),
    ('associated unit skill', 'Never Apologize For Victory; Skill Level 9; Fast; PHYSICAL DAMAGE; AoE; ADD DEBUFF; ADD BUFF. The Guardsman deals 185% Physical Damage to one enemy and gains a 20% Dodge Chance Buff for 3 turns. Level 10 upgrade: +2% Dodge Chance. Hightower Guardsman will inherit their Level, Star Rank, and Skill Level from Ormund Hightower.', ['associated_unit', 'strategy_fact']),
]

def quote(value):
    return "'" + str(value).replace("'", "''") + "'"

manifest = []
for number, (category, visible, records) in enumerate(images, 3869):
    file = SOURCES / f'IMG_{number}.PNG'
    manifest.append(dict(filename=file.name, source_id=100000 + number,
        archive_locator=f'data/source-images/ormund-2026-10-08/{file.name}',
        sha256=hashlib.sha256(file.read_bytes()).hexdigest(), byte_count=file.stat().st_size,
        dimensions=dict(width=1260, height=2736), category=category,
        subjects=['Ormund Hightower'] if number < 3875 or number == 3877 else ['Ormund Hightower', 'Hightower Guardsman'],
        exact_visible_text=visible, connected_record_types=records,
        contributes_new_information=True, imported=True, review_status='visually_verified', confidence=1,
        unresolved='Screenshot uses “HP Guards” plural; Guardsman skill tags include AoE and ADD DEBUFF while effect text describes one enemy and a Dodge buff.' if number in (3876, 3878) else None))
manifest_text = json.dumps({'corpus':'Photos originals supplied by user','images':manifest}, indent=2) + '\n'

sql = ["-- Source-backed supplement. The older verified baseline and raw screenshots are preserved.",
"CREATE TABLE IF NOT EXISTS knowledge.champion_associated_units (id text PRIMARY KEY, owner_variant_id text NOT NULL REFERENCES knowledge.champion_variants(id), name text NOT NULL, trait_name text NOT NULL, trait_text text NOT NULL, skill_name text NOT NULL, skill_text text NOT NULL, inheritance_text text NOT NULL, review_status text NOT NULL, source_id bigint NOT NULL REFERENCES knowledge.sources(source_id));",
"ALTER TABLE knowledge.champion_associated_units ENABLE ROW LEVEL SECURITY;",
"REVOKE ALL ON knowledge.champion_associated_units FROM PUBLIC, anon, authenticated;"]
for row in manifest:
    sid = row['source_id']
    sql += [f"INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES ({sid},{quote(row['filename'])},{quote('photos:'+row['filename'])},{quote(row['archive_locator'])},'user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;",
            f"INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES ({sid},{quote('photos:'+row['filename'])},{quote(row['archive_locator'])},{quote(row['filename'])},'visually_verified',1) ON CONFLICT (source_id) DO NOTHING;",
            f"INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES ({sid},{quote(row['sha256'])},{row['byte_count']},1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;"]
sql += ["INSERT INTO knowledge.characters (id,display_name) VALUES ('ormund-hightower','Ormund Hightower') ON CONFLICT (id) DO NOTHING;",
        f"INSERT INTO knowledge.champion_variants (id,character_id,display_name,rarity,gem_color,confidence,review_status,live_status) VALUES ({quote(VARIANT)},'ormund-hightower','Ormund Hightower — Beacon of the South','Legendary','Yellow',1,'complete','live') ON CONFLICT (id) DO NOTHING;",
        f"INSERT INTO knowledge.champion_portraits (id,variant_id,legacy_key,asset_path,source_script,sha256,source_image_id,attribution,review_state) VALUES ('source-crop-ormund-hightower',{quote(VARIANT)},'photos:IMG_3869.PNG','assets/champion-portraits/ormund-hightower-source-crop.png','sips crop 540x540 offset 595x515; resize 512x512',{quote(hashlib.sha256(PORTRAIT.read_bytes()).hexdigest())},103869,'User supplied GOT: Legends game screenshot; game art remains with its rights holder.','source_profile_crop') ON CONFLICT (id) DO NOTHING;"]
for aid, kind, name, wording, sid in [
    ('ormund-leader-trait','trait',*leader,103870),
    ('ormund-rightful-line-trait','trait',*trait,103872),
    ('ormund-strength-honour-skill','champion_skill',*skill,103877)]:
    sql.append(f"INSERT INTO knowledge.abilities (id,kind,name,variant_id,source_id,provenance,confidence,review_status,exact_visible_text) VALUES ({quote(aid)},{quote(kind)},{quote(name)},{quote(VARIANT)},{sid},'Screenshot Verified',1,'complete',{quote(wording)}) ON CONFLICT (id) DO NOTHING;")
sql.append(f"INSERT INTO knowledge.champion_associated_units (id,owner_variant_id,name,trait_name,trait_text,skill_name,skill_text,inheritance_text,review_status,source_id) VALUES ('ormund-hightower-guardsman',{quote(VARIANT)},'Hightower Guardsman',{quote(guard_trait[0])},{quote(guard_trait[1])},{quote(guard_skill[0])},{quote(guard_skill[1])},{quote(inheritance)},'complete',103875) ON CONFLICT (id) DO NOTHING;")
for id, name, category in [('holy_purpose','HOLY PURPOSE','identity'),('dodge','Dodge Chance','survivability'),('hp_guard','HP Guard threshold','survivability'),('aoe','Area damage','damage')]:
    sql.append(f"INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES ({quote(id)},{quote(name)},{quote(category)}) ON CONFLICT (id) DO NOTHING;")

facts = [
 ('leader-effect','leader_effect','grants','leader',leader[0]+': When combat starts, Ormund grants 1 HOLY PURPOSE to 3 allies at random; when the enemy team spends Treasury Coins, his team gains 1 BIRTHRIGHT.',103870),
 ('holy-purpose','holy_purpose','grants','leader',leader[0]+': When combat starts, Ormund grants 1 HOLY PURPOSE to 3 allies at random.',103870),
 ('leader-birthright','birthright','grants','leader',leader[0]+': Ormund grants his team 1 BIRTHRIGHT every time Treasury Coins are spent by the enemy team.',103871),
 ('treasury-trigger','treasury','reacts','leader',leader[0]+': Ormund grants his team 1 BIRTHRIGHT every time Treasury Coins are spent by the enemy team.',103871),
 ('critical','critical','supports','trait',trait[0]+': For the first 10 turns of combat, Ormund grants all team members a +20% Critical Strike Chance and +15% Critical Strike Damage Buff.',103872),
 ('birthright','birthright','grants','trait',trait[0]+': When Ormund drops to his HP Guard at 50% HP, all team members gain 8 BIRTHRIGHT.',103873),
 ('hp-guard','hp_guard','triggers','trait',trait[0]+': When Ormund drops to his HP Guard at 50% HP, all team members gain 8 BIRTHRIGHT.',103873),
 ('trait-physical','physical_damage','damages','trait',trait[0]+': At his 50% HP Guard, Ormund deals 250% ATK Physical Damage to all enemies.',103873),
 ('trait-buff-removal','buff_removal','controls','trait',trait[0]+': At his 50% HP Guard, Ormund REMOVES 2 Buffs from each enemy.',103873),
 ('skill-physical','physical_damage','damages','skill',skill[0]+': Ormund deals 225% ATK Physical Damage to all enemies.',103877),
 ('skill-aoe','aoe','damages','skill',skill[0]+': Ormund deals 225% ATK Physical Damage to all enemies.',103877),
 ('skill-defense','defense','controls','skill',skill[0]+': During the first 10 turns all enemies are dealt a -20% DEF Debuff for 3 turns; from turn 11 all allies gain a +20% DEF Buff for 3 turns.',103877),
 ('guard-taunt','taunt','uses','associated_unit',guard_trait[0]+': The Hightower Guardsman TAUNTS for 5 turns.',103875),
 ('guard-birthright','birthright','grants','associated_unit',guard_trait[0]+': The Guardsman grants all allies 2 BIRTHRIGHT at lower HP Guards of 75%, 50%, and 25%.',103876),
 ('guard-stamina','stamina','starts','associated_unit',guard_trait[0]+': The Hightower Guardsman has 75% Stamina.',103875),
 ('guard-hp-guard','hp_guard','triggers','associated_unit',guard_trait[0]+': The Guardsman grants all allies 2 BIRTHRIGHT at lower HP Guards of 75%, 50%, and 25%.',103876),
 ('guard-dodge','dodge','gains','associated_unit',guard_skill[0]+': The Guardsman gains a 20% Dodge Chance Buff for 3 turns.',103878),
 ('guard-physical','physical_damage','damages','associated_unit',guard_skill[0]+': The Guardsman deals 185% Physical Damage to one enemy.',103878),
]
for suffix, mechanic, role, context, text, sid in facts:
    sql.append(f"INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ({quote('ormund-'+suffix)},{quote(VARIANT)},{quote(mechanic)},{quote(role)},{quote(context)},{quote(text)},'verified_fact',{quote('source:'+str(sid))},{sid},1,'complete') ON CONFLICT (id) DO NOTHING;")
for kind, record, sources in [('champion_variant',VARIANT,[103869]),('champion_portrait','source-crop-ormund-hightower',[103869]),('ability','ormund-leader-trait',[103870,103871]),('ability','ormund-rightful-line-trait',[103872,103873,103874]),('ability','ormund-strength-honour-skill',[103877]),('associated_unit','ormund-hightower-guardsman',[103875,103876,103878])]:
    for sid in sources:
        sql.append(f"INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ({quote(kind)},{quote(record)},{sid},'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;")
for suffix, *_, sid in facts:
    sql.append(f"INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact',{quote('ormund-'+suffix)},{sid},'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;")

# Keep the existing public read model exactly as it was, adding only the new
# associated-unit array elements. The legacy companion rows remain unchanged.
read_model = (ROOT / 'supabase/migrations/20261007010000_restored_application_read_model.sql').read_text()
function = read_model.split('CREATE OR REPLACE FUNCTION public.got_guide_data()',1)[1].split('REVOKE ALL ON FUNCTION public.got_guide_data()',1)[0]
function = 'CREATE OR REPLACE FUNCTION public.got_guide_data()' + function
old = "    ) ORDER BY cp.companion_id), '[]'::jsonb) FROM knowledge.champion_companions cp),"
new = "    ) ORDER BY cp.companion_id), '[]'::jsonb) FROM knowledge.champion_companions cp) ||\n      (SELECT coalesce(jsonb_agg(jsonb_build_object(\n        'id',u.id,'variantId',u.owner_variant_id,'name',u.name,\n        'traitName',u.trait_name,'traitText',u.trait_text,\n        'skillName',u.skill_name,'skillText',u.skill_text,\n        'inheritanceText',u.inheritance_text,'reviewStatus',u.review_status\n      ) ORDER BY u.id),'[]'::jsonb) FROM knowledge.champion_associated_units u),"
assert old in function
sql.append(function.replace(old,new))
sql.append('REVOKE ALL ON FUNCTION public.got_guide_data() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data() TO anon, authenticated;')
sql.append(f"DO $$ BEGIN IF (SELECT count(*) FROM knowledge.champion_variants WHERE id={quote(VARIANT)}) <> 1 THEN RAISE EXCEPTION 'Ormund variant missing'; END IF; IF (SELECT count(*) FROM knowledge.strategy_champion_facts WHERE variant_id={quote(VARIANT)}) <> {len(facts)} THEN RAISE EXCEPTION 'Ormund strategy facts incomplete'; END IF; IF (SELECT count(*) FROM knowledge.faction_memberships WHERE variant_id={quote(VARIANT)}) <> 0 THEN RAISE EXCEPTION 'Unverified Ormund faction was assigned'; END IF; IF jsonb_array_length(public.got_guide_data()->'champions') <> 109 THEN RAISE EXCEPTION 'Expected 109 champion variants'; END IF; END $$;")
migration_text = '\n'.join(sql)+'\n'
preview_function = function.replace('public.got_guide_data()', 'public.got_guide_data_preview()')
base_function = 'CREATE OR REPLACE FUNCTION public.got_guide_data()' + read_model.split('CREATE OR REPLACE FUNCTION public.got_guide_data()',1)[1].split('REVOKE ALL ON FUNCTION public.got_guide_data()',1)[0]
base_function = base_function.replace("WHERE v.live_status IN ('live','unverified'))", f"WHERE v.live_status IN ('live','unverified') AND v.id <> {quote(VARIANT)})")
base_function = base_function.replace('LEFT JOIN knowledge.champion_variants v ON v.id = a.variant_id),', f'LEFT JOIN knowledge.champion_variants v ON v.id = a.variant_id WHERE a.variant_id IS NULL OR a.variant_id <> {quote(VARIANT)}),')
isolation_text = '\n'.join([
    '-- Preserve the released Raid production read model; expose new facts to preview builds only.',
    preview_function,
    'REVOKE ALL ON FUNCTION public.got_guide_data_preview() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data_preview() TO anon, authenticated;',
    base_function,
    'REVOKE ALL ON FUNCTION public.got_guide_data() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data() TO anon, authenticated;',
    "DO $$ BEGIN IF jsonb_array_length(public.got_guide_data()->'champions') <> 108 THEN RAISE EXCEPTION 'Production guide changed'; END IF; IF jsonb_array_length(public.got_guide_data_preview()->'champions') <> 109 THEN RAISE EXCEPTION 'Preview guide incomplete'; END IF; END $$;",
]) + '\n'
preview_fix_text = '\n'.join([
    '-- Include Ormund’s associated Guardsman in the preview read model.',
    function.replace(old,new).replace('public.got_guide_data()', 'public.got_guide_data_preview()'),
    'REVOKE ALL ON FUNCTION public.got_guide_data_preview() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data_preview() TO anon, authenticated;',
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(public.got_guide_data_preview()->'companions') unit WHERE unit->>'id'='ormund-hightower-guardsman') THEN RAISE EXCEPTION 'Preview associated unit missing'; END IF; END $$;",
]) + '\n'
if '--check' in sys.argv:
    assert (SOURCES / 'manifest.json').read_text() == manifest_text, 'Ormund source manifest differs from original screenshots'
    assert MIGRATION.read_text() == migration_text, 'Ormund migration differs from verified source manifest'
    assert ISOLATION.read_text() == isolation_text, 'Preview isolation migration differs from source-backed read model'
    assert PREVIEW_FIX.read_text() == preview_fix_text, 'Preview companion migration differs from source-backed read model'
    print(f'Validated {len(manifest)} screenshot hashes, portrait hash, and {len(facts)} source-backed strategy facts')
else:
    (SOURCES / 'manifest.json').write_text(manifest_text)
    MIGRATION.write_text(migration_text)
    ISOLATION.write_text(isolation_text)
    PREVIEW_FIX.write_text(preview_fix_text)
    print(f'Built {MIGRATION.name}: {len(manifest)} screenshots, {len(facts)} source-backed strategy facts')
