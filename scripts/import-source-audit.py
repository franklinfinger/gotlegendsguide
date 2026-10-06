#!/usr/bin/env python3
"""Generate an idempotent, evidence-bounded correction seed for live Supabase.

The original SQLite mirror remains immutable. This script reads the pinned
snapshot and committed audit data, then writes SQL for the authenticated CLI.
It never reads credentials or modifies a database itself.
"""

import argparse
import hashlib
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SQLITE = Path.home() / 'Downloads/got_legends_verified_knowledge.db'


def lit(value):
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def values(*items):
    return ', '.join(lit(item) for item in items)


def slug(value):
    return ''.join(c.lower() if c.isalnum() else '-' for c in value).strip('-')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sqlite', type=Path, default=DEFAULT_SQLITE)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    expected = json.loads((ROOT / 'supabase/source-manifest.json').read_text())['sha256']
    actual = hashlib.sha256(args.sqlite.read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit('SQLite snapshot differs from the pinned source manifest')
    db = sqlite3.connect(f'file:{args.sqlite}?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    archive = json.loads((ROOT / 'data/source-images/drive-archive.json').read_text())['files']
    portraits = json.loads((ROOT / 'data/source-images/legacy-portraits.json').read_text())['definitions']
    dragons = json.loads((ROOT / 'data/audit/legendary-assault-recovered.json').read_text())
    recovered_skills = json.loads((ROOT / 'data/audit/recovered-champion-skills.json').read_text())['skills']
    recovered_traits = json.loads((ROOT / 'data/audit/recovered-champion-traits.json').read_text())['traits']
    recovered_items = json.loads((ROOT / 'data/audit/recovered-iconic-items.json').read_text())['items']
    legacy = []
    for filename in ('champions-part1.json', 'champions-part2.json'):
        for card in json.loads((ROOT / filename).read_text())['champions']:
            legacy.append((filename, card))
    source_rows = {row['filename']: row for row in db.execute('SELECT * FROM sources')}
    source_id = {}
    sql = ['BEGIN;', 'SET LOCAL statement_timeout = 0;']

    # Register all original image bytes with stable, independently checked IDs.
    for image in archive:
        filename = image['filename']
        if image.get('byte_count_match') is not True or not image.get('sha256'):
            raise SystemExit(f'Unverified image bytes: {filename}')
        old = source_rows.get(filename)
        sid = old['source_id'] if old else 100000 + int(filename.split('_')[1].split('.')[0])
        source_id[filename] = sid
        if not old:
            sql.append('INSERT INTO knowledge.sources(source_id, filename, drive_file_id, drive_url, source_type, verification_state, notes) VALUES (' +
                       values(sid, filename, image['drive_id'], image['drive_url'], 'original_drive_archive', 'unreviewed', 'Original supplied PNG; bytes SHA-256 checked; content not yet individually reviewed') +
                       ') ON CONFLICT (source_id) DO UPDATE SET filename=EXCLUDED.filename, drive_file_id=EXCLUDED.drive_file_id, drive_url=EXCLUDED.drive_url;')
            sql.append('INSERT INTO knowledge.source_images(source_id, external_id, source_url, original_filename, review_status) VALUES (' +
                       values(sid, image['drive_id'], image['drive_url'], filename, 'unreviewed') +
                       ') ON CONFLICT (source_id) DO UPDATE SET external_id=EXCLUDED.external_id, source_url=EXCLUDED.source_url, original_filename=EXCLUDED.original_filename;')
        sql.append('INSERT INTO knowledge.source_image_fingerprints(source_id, sha256, byte_count, width, height, corpus, content_review_state) VALUES (' +
                   values(sid, image['sha256'], image['downloaded_bytes'], image['width'], image['height'], 'connected_original_drive_folder', 'indexed_unreviewed') +
                   ') ON CONFLICT (source_id) DO UPDATE SET sha256=EXCLUDED.sha256, byte_count=EXCLUDED.byte_count, width=EXCLUDED.width, height=EXCLUDED.height;')

    sqlite_names = {row['name'] for row in db.execute('SELECT name FROM champions')}
    missing_names = {
        'Aegon II Targaryen', 'Aemond Targaryen', 'Baela Targaryen', 'Balon Greyjoy',
        'Caraxes', 'Doran Martell', 'Ellaria Sand', 'Harwin Strong',
        'Helaena Targaryen', 'Hizdahr zo Loraq', 'Illyrio Mopatis', 'Jeor Mormont',
        'Larys Strong', 'Loras Tyrell', 'Theon Greyjoy', 'Thoros of Myr',
        'Tyland Lannister', 'Wun Wun', 'Yara Greyjoy',
    }
    if missing_names & sqlite_names:
        raise SystemExit('A legacy gap name is already an exact SQLite identity')
    screenshot_cards = {
        'Aegon II Targaryen': 'IMG_2302.PNG',
        'Aemond Targaryen': 'IMG_2292.PNG',
        'Caraxes': 'IMG_2296.PNG',
        'Theon Greyjoy': 'IMG_2182.PNG',
        'Thoros of Myr': 'IMG_2310.PNG',
        'Tyland Lannister': 'IMG_2236.PNG',
        'Wun Wun': 'IMG_2314.PNG',
        'Yara Greyjoy': 'IMG_2276.PNG',
    }
    candidates = [(filename, card) for filename, card in legacy if card['name'] in missing_names]
    if {card['name'] for _, card in candidates} != missing_names or len(candidates) != 19:
        raise SystemExit('Legacy candidate identities are not unique and complete')
    legacy_by_key = {card['id']: card for _, card in legacy}
    variant_by_name = {row['name']: f"sqlite-champion-{row['champion_id']}" for row in db.execute('SELECT champion_id, name FROM champions')}
    for filename, card in candidates:
        key = card['id']
        character_id = f'legacy-character-{key}'
        variant_id = f'legacy-champion-{key}'
        variant_by_name[card['name']] = variant_id
        sql.append('INSERT INTO knowledge.characters(id, display_name) VALUES (' + values(character_id, card['name']) +
                   ') ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name;')
        sql.append('INSERT INTO knowledge.champion_variants(id, character_id, display_name, rarity, review_status, live_status) VALUES (' +
                   values(variant_id, character_id, card['name'], card.get('rarity'), 'partial', 'unverified') +
                   ') ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, rarity=EXCLUDED.rarity, review_status=EXCLUDED.review_status, live_status=EXCLUDED.live_status;')
        state = 'screenshot_identity_legacy_metadata_unreviewed' if card['name'] in screenshot_cards else 'legacy_only_unverified'
        # Legacy tags are retained as claims, not promoted to current facts.
        sql.append('INSERT INTO knowledge.legacy_champion_metadata(variant_id, legacy_id, source_path, legacy_rarity, legacy_factions, legacy_roles, legacy_tags, legacy_why, review_state) VALUES (' +
                   values(variant_id, key, filename, card.get('rarity')) + ', ' +
                   ', '.join(lit(json.dumps(card.get(field, []))) + '::jsonb' for field in ('factions', 'roles', 'tags')) + ', ' +
                   values(card.get('why'), state) + ') ON CONFLICT (variant_id) DO UPDATE SET review_state=EXCLUDED.review_state;')
        if card['name'] in screenshot_cards:
            sid = source_id[screenshot_cards[card['name']]]
            sql.append('INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) VALUES (' +
                       values('champion_variant', variant_id, sid, 'visible_identity', 'screenshot_checked') + ') ON CONFLICT DO NOTHING;')

    # Preserve every valid legacy portrait. Ambiguous keys keep all variants.
    # A full JPEG decode rejected these two assets after the initial marker-only
    # import. Their original embedded definitions remain in the legacy scripts.
    sql.append("DELETE FROM knowledge.champion_portraits WHERE id IN ('caraxes--p-caraxes', 'cersei--portraits-lan-5');")
    from collections import Counter
    portrait_counts = Counter(row['legacy_key'] for row in portraits)
    portrait_exact_names = {
        'adolescentdrogon': 'Adolescent Drogon',
        'craghas': 'Craghas Drahar',
        'craster': 'Craster',
        'icyviserion': 'Icy Viserion',
        'meryn': 'Meryn Trant',
        'osha': 'Osha',
    }
    for row in portraits:
        key = row['legacy_key']
        card = legacy_by_key.get(key)
        variant = variant_by_name.get(card['name']) if card else variant_by_name.get(portrait_exact_names.get(key))
        screenshot = screenshot_cards.get(card['name']) if card else None
        sid = source_id.get(screenshot) if screenshot else None
        portrait_id = row['path'].rsplit('/', 1)[-1].removesuffix('.jpg')
        state = 'variant_conflict_unresolved' if portrait_counts[key] > 1 else 'legacy_portrait_source_screenshot_unlinked'
        sql.append('INSERT INTO knowledge.champion_portraits(id, variant_id, legacy_key, asset_path, source_script, sha256, source_image_id, attribution, review_state) VALUES (' +
                   values(portrait_id, variant, key, row['path'], row['source_script'], row['sha256'], sid,
                          'User supplied GOT: Legends game image; game art remains with its rights holder.', state) +
                   ') ON CONFLICT (id) DO UPDATE SET variant_id=EXCLUDED.variant_id, source_image_id=EXCLUDED.source_image_id, review_state=EXCLUDED.review_state;')

    # Materialize the 30 named items and their already verified ability rows.
    item_rows = list(db.execute('SELECT * FROM iconic_abilities ORDER BY iconic_ability_id'))
    if len(item_rows) != 30 or len({row['item_name'] for row in item_rows}) != 30:
        raise SystemExit('Iconic item names are not the expected 30 distinct values')
    item_detail = {'Ice': 1, 'Oathkeeper': 2}
    for row in item_rows:
        item_id = f"sqlite-iconic-item-{row['iconic_ability_id']}"
        variant = f"sqlite-champion-{row['champion_id']}"
        ability = f"sqlite-iconic_abilities-{row['iconic_ability_id']}"
        sql.append('INSERT INTO knowledge.iconic_item_catalog(id, display_name, owner_variant_id, legacy_item_id, source_id, review_state) VALUES (' +
                   values(item_id, row['item_name'], variant, item_detail.get(row['item_name']), row['source_id'], 'screenshot_verified_name_and_owner') +
                   ') ON CONFLICT (id) DO UPDATE SET owner_variant_id=EXCLUDED.owner_variant_id, legacy_item_id=EXCLUDED.legacy_item_id, source_id=EXCLUDED.source_id;')
        sql.append('INSERT INTO knowledge.iconic_item_ability_links(item_id, ability_id, source_id) VALUES (' +
                   values(item_id, ability, row['source_id']) + ') ON CONFLICT (item_id, ability_id) DO NOTHING;')

    # Retain raw faction strings as superseded aliases; add normalized memberships.
    raw_map = {
        'Baratheon (stag icon)': ['Baratheon'],
        'Free Cities (icon)': ['Free Cities'],
        'Lannister (lion icon)': ['Lannister'],
        'Baratheon; Brotherhood': ['Baratheon', 'Brotherhood'],
        'Blacks and Targaryen': ['Blacks', 'Targaryen'],
        'Lannister and Baratheon': ['Lannister', 'Baratheon'],
        'Lannister; Baratheon': ['Lannister', 'Baratheon'],
    }
    raw_factions = sorted({row['faction'] for row in db.execute("SELECT faction FROM champions WHERE faction IS NOT NULL AND trim(faction) <> ''")})
    new_faction_id = {'Blacks': 'audit-faction-blacks', 'Brotherhood': 'audit-faction-brotherhood'}
    def fid(name):
        return new_faction_id.get(name, 'sqlite-faction-' + name.encode().hex())
    for name, faction_id in new_faction_id.items():
        sql.append('INSERT INTO knowledge.factions(id, name, live_status) VALUES (' + values(faction_id, name, 'live') +
                   ') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, live_status=EXCLUDED.live_status;')
    for raw in raw_factions:
        if raw not in raw_map:
            continue
        for canonical in raw_map[raw]:
            sql.append('INSERT INTO knowledge.faction_aliases(raw_name, canonical_faction_id, normalization_kind, review_state) VALUES (' +
                       values(raw, fid(canonical), 'icon_or_combined_label', 'derived_from_legacy_label') + ') ON CONFLICT DO NOTHING;')
        sql.append('UPDATE knowledge.factions SET live_status = \'superseded\' WHERE id = ' + lit(fid(raw)) + ';')
    for row in db.execute("SELECT champion_id, faction FROM champions WHERE faction IS NOT NULL AND trim(faction) <> ''"):
        variant = f"sqlite-champion-{row['champion_id']}"
        raw = row['faction']
        if raw in raw_map:
            sql.append('UPDATE knowledge.faction_memberships SET live_status = \'superseded\' WHERE variant_id = ' + lit(variant) + ' AND faction_id = ' + lit(fid(raw)) + ';')
        for canonical in raw_map.get(raw, [raw]):
            sql.append('INSERT INTO knowledge.faction_memberships(variant_id, faction_id, live_status) VALUES (' +
                       values(variant, fid(canonical), 'live') +
                       ') ON CONFLICT (variant_id, faction_id) DO UPDATE SET live_status=EXCLUDED.live_status;')

    # Legendary Assault is the canonical encounter category; the old raid_boss
    # rows remain for backwards compatibility and source traceability.
    for encounter in dragons['encounters']:
        old_id = 1 if encounter['id'] == 'rhaegal' else None
        sid = source_id[encounter['source_images'][0]] if encounter['source_images'] else None
        sql.append('INSERT INTO knowledge.legendary_assault_encounters(id, name, subtitle, legacy_raid_boss_id, source_id, review_state) VALUES (' +
                   values(encounter['id'], encounter['name'], encounter['subtitle'], old_id, sid, encounter['review_status']) +
                   ') ON CONFLICT (id) DO UPDATE SET subtitle=EXCLUDED.subtitle, source_id=EXCLUDED.source_id, review_state=EXCLUDED.review_state;')
        for filename in encounter['source_images']:
            sql.append('INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) VALUES (' +
                       values('legendary_assault_encounter', encounter['id'], source_id[filename], 'visible_identity', 'screenshot_checked') + ') ON CONFLICT DO NOTHING;')
    for row in db.execute('SELECT * FROM raid_boss_abilities ORDER BY raid_boss_ability_id'):
        aid = f"rhaegal-sqlite-{row['raid_boss_ability_id']}"
        sql.append('INSERT INTO knowledge.legendary_assault_abilities(id, encounter_id, ability_name, scope, exact_visible_text, completion_state, legacy_raid_boss_ability_id) VALUES (' +
                   values(aid, 'rhaegal', row['ability_name'], row['scope'], row['exact_visible_text'], row['completion_state'], row['raid_boss_ability_id']) +
                   ') ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text;')
        for link in db.execute('SELECT source_id FROM raid_boss_ability_sources WHERE raid_boss_ability_id=?', (row['raid_boss_ability_id'],)):
            sql.append('INSERT INTO knowledge.legendary_assault_ability_sources(ability_id, source_id) VALUES (' + values(aid, link['source_id']) + ') ON CONFLICT DO NOTHING;')
    for ability in dragons['abilities']:
        sql.append('INSERT INTO knowledge.legendary_assault_abilities(id, encounter_id, ability_name, scope, exact_visible_text, completion_state) VALUES (' +
                   values(ability['id'], ability['encounter_id'], ability['name'], ability['scope'], ability['exact_visible_text'], ability['completion_state']) +
                   ') ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text, completion_state=EXCLUDED.completion_state;')
        for filename in ability['source_images']:
            sql.append('INSERT INTO knowledge.legendary_assault_ability_sources(ability_id, source_id) VALUES (' +
                       values(ability['id'], source_id[filename]) + ') ON CONFLICT DO NOTHING;')

    for skill in recovered_skills:
        if 'champion_id' in skill:
            champion = db.execute('SELECT name FROM champions WHERE champion_id=?', (skill['champion_id'],)).fetchone()
            if champion is None or db.execute('SELECT 1 FROM champion_skills WHERE champion_id=?', (skill['champion_id'],)).fetchone():
                raise SystemExit(f"Recovered skill has an invalid or already populated champion: {skill['id']}")
            variant = f"sqlite-champion-{skill['champion_id']}"
        else:
            variant = skill['variant_id']
            if variant not in variant_by_name.values():
                raise SystemExit(f"Recovered skill has no champion variant: {skill['id']}")
        sid = source_id[skill['source_images'][0]]
        sql.append('INSERT INTO knowledge.abilities(id, kind, name, variant_id, source_id, provenance, review_status, exact_visible_text) VALUES (' +
                   values(skill['id'], 'champion_skill', skill['name'], variant, sid, 'Screenshot Verified', skill['completion_state'], skill['exact_visible_text']) +
                   ') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, source_id=EXCLUDED.source_id, exact_visible_text=EXCLUDED.exact_visible_text;')
        sql.append('INSERT INTO knowledge.ability_effects(id, ability_id, effect_kind, exact_visible_text) VALUES (' +
                   values(skill['id'] + '-visible-text', skill['id'], 'unparsed_visible_text', skill['exact_visible_text']) +
                   ') ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text;')
        for filename in skill['source_images']:
            sql.append('INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) VALUES (' +
                       values('champion_skill', skill['id'], source_id[filename], 'visible_wording', 'screenshot_checked') + ') ON CONFLICT DO NOTHING;')

    for trait in recovered_traits:
        if trait['variant_id'] not in variant_by_name.values():
            raise SystemExit(f"Recovered trait has no champion variant: {trait['id']}")
        sid = source_id[trait['source_images'][0]]
        review = 'partial' if trait['completion_state'].startswith('partial') else 'complete'
        sql.append('INSERT INTO knowledge.abilities(id, kind, name, variant_id, source_id, provenance, review_status, exact_visible_text) VALUES (' +
                   values(trait['id'], 'champion_trait', trait['name'], trait['variant_id'], sid, 'Screenshot Verified', review, trait['exact_visible_text']) +
                   ') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, source_id=EXCLUDED.source_id, review_status=EXCLUDED.review_status, exact_visible_text=EXCLUDED.exact_visible_text;')
        sql.append('INSERT INTO knowledge.ability_effects(id, ability_id, effect_kind, exact_visible_text) VALUES (' +
                   values(trait['id'] + '-visible-text', trait['id'], 'unparsed_visible_text', trait['exact_visible_text']) +
                   ') ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text;')
        for filename in trait['source_images']:
            sql.append('INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) VALUES (' +
                       values('champion_trait', trait['id'], source_id[filename], 'visible_wording', 'screenshot_checked') + ') ON CONFLICT DO NOTHING;')

    for item in recovered_items:
        if item['owner_variant_id'] not in variant_by_name.values():
            raise SystemExit(f"Recovered item has no champion variant: {item['id']}")
        sid = source_id[item['source_images'][0]]
        sql.append('INSERT INTO knowledge.abilities(id, kind, name, variant_id, source_id, provenance, review_status, exact_visible_text) VALUES (' +
                   values(item['ability_id'], 'iconic', item['ability_name'], item['owner_variant_id'], sid, 'Screenshot Verified', item['completion_state'], item['exact_visible_text']) +
                   ') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, source_id=EXCLUDED.source_id, exact_visible_text=EXCLUDED.exact_visible_text;')
        sql.append('INSERT INTO knowledge.ability_effects(id, ability_id, effect_kind, exact_visible_text) VALUES (' +
                   values(item['ability_id'] + '-visible-text', item['ability_id'], 'unparsed_visible_text', item['exact_visible_text']) +
                   ') ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text;')
        sql.append('INSERT INTO knowledge.iconic_item_catalog(id, display_name, owner_variant_id, source_id, review_state) VALUES (' +
                   values(item['id'], item['name'], item['owner_variant_id'], sid, 'screenshot_verified_name_and_owner') +
                   ') ON CONFLICT (id) DO UPDATE SET owner_variant_id=EXCLUDED.owner_variant_id, source_id=EXCLUDED.source_id;')
        sql.append('INSERT INTO knowledge.iconic_item_ability_links(item_id, ability_id, source_id) VALUES (' +
                   values(item['id'], item['ability_id'], sid) + ') ON CONFLICT DO NOTHING;')
        for filename in item['source_images']:
            sql.append('INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) VALUES (' +
                       values('iconic_item', item['id'], source_id[filename], 'visible_item_and_ability', 'screenshot_checked') + ') ON CONFLICT DO NOTHING;')

    # Team screenshots establish observed composition, never a winning outcome.
    # Resolve only exact, unique champion names to existing card identities.
    casefold_variants = {}
    for name, variant in variant_by_name.items():
        folded = name.casefold()
        casefold_variants[folded] = variant if folded not in casefold_variants else None
    for kind in ('strategy', 'raid'):
        table = f'{kind}_team_members'
        example = f'{kind}_team_examples'
        id_col = f'{kind}_team_member_id'
        example_col = f'{kind}_team_example_id'
        for row in db.execute(f'SELECT m.{id_col} AS member_id, m.champion_name, t.source_id FROM {table} m JOIN {example} t ON t.{example_col}=m.{example_col}'):
            variant = casefold_variants.get(row['champion_name'].casefold())
            state = 'exact_name' if variant else 'unresolved_name'
            sql.append('INSERT INTO knowledge.team_member_variant_links(member_kind, member_id, original_champion_name, variant_id, resolution_state, source_id) VALUES (' +
                       values(kind, row['member_id'], row['champion_name'], variant, state, row['source_id']) +
                       ') ON CONFLICT (member_kind, member_id) DO UPDATE SET variant_id=EXCLUDED.variant_id, resolution_state=EXCLUDED.resolution_state;')

    # Direct provenance for existing structured records. Inherited team-member
    # links are labeled so they are not confused with individually reviewed cards.
    provenance_specs = [
        ('champion_skill', 'champion_skills', 'skill_id'),
        ('champion_trait', 'champion_traits', 'trait_id'),
        ('iconic_ability', 'iconic_abilities', 'iconic_ability_id'),
        ('iconic_item_detail', 'iconic_items', 'item_id'),
        ('status_definition', 'status_definitions', 'status_id'),
        ('companion', 'champion_companions', 'companion_id'),
        ('raid_team', 'raid_team_examples', 'raid_team_example_id'),
        ('strategy_team', 'strategy_team_examples', 'strategy_team_example_id'),
        ('announced_update', 'announced_game_updates', 'update_id'),
    ]
    for kind, table, pk in provenance_specs:
        sql.append(f"INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) SELECT {lit(kind)}, {pk}::text, source_id, 'direct_source_field', 'inherited_review_state' FROM knowledge.{table} WHERE source_id IS NOT NULL ON CONFLICT DO NOTHING;")
    sql.append("INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) SELECT 'champion_variant', 'sqlite-champion-' || c.champion_id::text, coalesce(s.source_id, t.source_id, a.source_id), 'subject_on_related_card', 'inherited_review_state' FROM knowledge.champions c LEFT JOIN LATERAL (SELECT source_id FROM knowledge.champion_skills WHERE champion_id=c.champion_id ORDER BY skill_id LIMIT 1) s ON true LEFT JOIN LATERAL (SELECT source_id FROM knowledge.champion_traits WHERE champion_id=c.champion_id ORDER BY trait_id LIMIT 1) t ON true LEFT JOIN LATERAL (SELECT source_id FROM knowledge.iconic_abilities WHERE champion_id=c.champion_id ORDER BY iconic_ability_id LIMIT 1) a ON true WHERE coalesce(s.source_id,t.source_id,a.source_id) IS NOT NULL ON CONFLICT DO NOTHING;")
    sql.append("INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) SELECT 'strategy_team_member', m.strategy_team_member_id::text, t.source_id, 'team_screenshot_inherited', 'unreviewed_member_identity' FROM knowledge.strategy_team_members m JOIN knowledge.strategy_team_examples t ON t.strategy_team_example_id=m.strategy_team_example_id ON CONFLICT DO NOTHING;")
    sql.append("INSERT INTO knowledge.record_evidence(record_kind, record_id, source_id, evidence_role, review_state) SELECT 'raid_team_member', m.raid_team_member_id::text, t.source_id, 'team_screenshot_inherited', 'unreviewed_member_identity' FROM knowledge.raid_team_members m JOIN knowledge.raid_team_examples t ON t.raid_team_example_id=m.raid_team_example_id ON CONFLICT DO NOTHING;")

    # This gate checks relationships and intended additions. It does not claim
    # complete extraction from every screenshot.
    expected_counts = {
        'source_image_fingerprints': 833,
        'legacy_champion_metadata': 19,
        'champion_portraits': len(portraits),
        'iconic_item_catalog': 31,
        'iconic_item_ability_links': 31,
        'legendary_assault_encounters': 4,
        'legendary_assault_abilities': 18,
        'abilities': 215,
        'ability_effects': 215,
        'team_member_variant_links': 80,
    }
    for table, count in expected_counts.items():
        sql.append(f"DO $$ BEGIN IF (SELECT count(*) FROM knowledge.{table}) <> {count} THEN RAISE EXCEPTION 'Audit count mismatch: {table}'; END IF; END $$;")
    sql.append("DO $$ BEGIN IF EXISTS (SELECT 1 FROM knowledge.legendary_assault_abilities a LEFT JOIN knowledge.legendary_assault_ability_sources s ON s.ability_id=a.id WHERE s.source_id IS NULL) THEN RAISE EXCEPTION 'Legendary Assault ability without source'; END IF; END $$;")
    sql.append("DO $$ BEGIN IF EXISTS (SELECT 1 FROM knowledge.iconic_item_catalog i LEFT JOIN knowledge.iconic_item_ability_links l ON l.item_id=i.id WHERE l.ability_id IS NULL) THEN RAISE EXCEPTION 'Item without ability link'; END IF; END $$;")
    sql.append('COMMIT;')
    args.output.write_text('\n'.join(sql) + '\n')
    print(f'Generated {len(sql)} statements; {len(archive)} original images, 19 legacy candidates, {len(portraits)} valid portraits, 31 items, 4 encounters, 18 encounter abilities, {len(recovered_skills)} champion skills, {len(recovered_traits)} traits.')


if __name__ == '__main__':
    main()
