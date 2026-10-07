#!/usr/bin/env python3
"""Preserve the verified SQLite snapshot and add a reproducible audit catalog.

The output is a copy of the pinned original with additive reconciliation tables.
No original fact row or source reference is changed.
"""

import hashlib
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / 'Downloads/got_legends_verified_knowledge.db'
OUTPUT = ROOT / 'data/audit/reconciled-knowledge.sqlite'
MANIFEST = ROOT / 'data/source-images/reconciliation.jsonl'
HISTORY = ROOT / 'data/source-images/historical-reference-reconciliation.jsonl'
RECOVERED = ROOT / 'data/source-images/recovered'
ALLY_CARDS = ROOT / 'data/audit/companion-ally-candidates.json'
DRIVE_CARDS = ROOT / 'data/audit/recovered-drive-cards.json'
ITEM_MATCHES = ROOT / 'data/audit/item-image-matches.json'
ASSAULT_MATCHES = ROOT / 'data/audit/legendary-assault-image-matches.json'
SKILL_MATCHES = ROOT / 'data/audit/champion-skill-image-matches.json'
TRAIT_MATCHES = ROOT / 'data/audit/champion-trait-image-matches.json'
LOCAL_ARCHIVE = ROOT / 'data/source-images/local-archive-reconciliation.jsonl'
WAR_RULES = ROOT / 'data/audit/recovered-war-outpost-rules.json'
COMMUNITY_TEAMS = ROOT / 'data/audit/recovered-community-teams.json'


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def main():
    expected = json.loads((ROOT / 'supabase/source-manifest.json').read_text())['sha256']
    if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != expected:
        raise SystemExit('Pinned SQLite snapshot hash changed')
    images = rows(MANIFEST)
    history = rows(HISTORY)
    allies = json.loads(ALLY_CARDS.read_text())['cards']
    drive_cards = json.loads(DRIVE_CARDS.read_text())
    item_matches = json.loads(ITEM_MATCHES.read_text())['matches']
    assault_matches = json.loads(ASSAULT_MATCHES.read_text())['matches']
    skill_matches = json.loads(SKILL_MATCHES.read_text())['matches']
    trait_matches = json.loads(TRAIT_MATCHES.read_text())['matches']
    local_archive = rows(LOCAL_ARCHIVE)
    war_rules = json.loads(WAR_RULES.read_text())['rules']
    community_teams = json.loads(COMMUNITY_TEAMS.read_text())['examples']
    if len(images) != 833 or len(history) != 615 or len(local_archive) != 101:
        raise SystemExit('Reconciliation input cardinality differs from source audit')
    temporary = OUTPUT.with_suffix('.sqlite.tmp')
    if temporary.exists():
        temporary.unlink()
    original = sqlite3.connect(f'file:{SOURCE}?mode=ro', uri=True)
    out = sqlite3.connect(temporary)
    original.backup(out)
    original.close()
    out.execute('PRAGMA foreign_keys=ON')
    out.executescript('''
        CREATE TABLE source_image_reconciliation (
            filename TEXT PRIMARY KEY,
            source_id INTEGER NOT NULL UNIQUE,
            drive_id TEXT NOT NULL UNIQUE,
            sha256 TEXT NOT NULL,
            image_category TEXT NOT NULL,
            subjects_shown_json TEXT NOT NULL,
            extracted_text TEXT NOT NULL,
            database_records_connected_json TEXT NOT NULL,
            contributes_new_information TEXT NOT NULL,
            information_imported TEXT NOT NULL,
            unresolved_text_or_identity_json TEXT NOT NULL,
            review_status TEXT NOT NULL,
            confidence REAL NOT NULL
        );
        CREATE TABLE historical_source_reconciliation (
            source_id INTEGER PRIMARY KEY REFERENCES sources(source_id),
            filename TEXT NOT NULL,
            locator_kind TEXT NOT NULL,
            status TEXT NOT NULL,
            sha256 TEXT,
            byte_count INTEGER,
            library_search_status TEXT NOT NULL
        );
        CREATE TABLE ally_gem_cards (
            id TEXT PRIMARY KEY,
            source_id INTEGER NOT NULL UNIQUE REFERENCES source_image_reconciliation(source_id),
            owner_name TEXT NOT NULL,
            ally_name TEXT NOT NULL,
            relationship TEXT NOT NULL,
            replaces_power_up TEXT NOT NULL,
            gem_title TEXT NOT NULL,
            exact_visible_effect TEXT NOT NULL,
            raw_ocr TEXT NOT NULL,
            review_state TEXT NOT NULL,
            currentness_state TEXT NOT NULL,
            source_sha256 TEXT NOT NULL
        );
        CREATE TABLE recovered_drive_cards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            rarity TEXT,
            gem_color TEXT,
            relationship_text TEXT,
            source_id INTEGER NOT NULL REFERENCES source_image_reconciliation(source_id),
            review_state TEXT NOT NULL
        );
        CREATE TABLE recovered_drive_abilities (
            id TEXT PRIMARY KEY,
            card_id TEXT NOT NULL REFERENCES recovered_drive_cards(id),
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            exact_visible_text TEXT NOT NULL,
            source_id INTEGER NOT NULL REFERENCES source_image_reconciliation(source_id),
            review_state TEXT NOT NULL
        );
        CREATE TABLE item_image_matches (
            source_id INTEGER PRIMARY KEY REFERENCES source_image_reconciliation(source_id),
            iconic_ability_id INTEGER NOT NULL REFERENCES iconic_abilities(iconic_ability_id),
            match_basis TEXT NOT NULL,
            review_state TEXT NOT NULL
        );
        CREATE TABLE legendary_assault_image_matches (
            source_id INTEGER PRIMARY KEY REFERENCES source_image_reconciliation(source_id),
            ability_id TEXT NOT NULL,
            match_basis TEXT NOT NULL,
            review_state TEXT NOT NULL
        );
        CREATE TABLE champion_skill_image_matches (
            source_id INTEGER PRIMARY KEY REFERENCES source_image_reconciliation(source_id),
            skill_id INTEGER NOT NULL REFERENCES champion_skills(skill_id),
            match_basis TEXT NOT NULL,
            review_state TEXT NOT NULL
        );
        CREATE TABLE champion_trait_image_matches (
            source_id INTEGER NOT NULL REFERENCES source_image_reconciliation(source_id),
            trait_id INTEGER NOT NULL REFERENCES champion_traits(trait_id),
            match_basis TEXT NOT NULL,
            review_state TEXT NOT NULL,
            PRIMARY KEY (source_id, trait_id)
        );
        CREATE TABLE local_archive_reconciliation (
            source_id INTEGER PRIMARY KEY,
            filename TEXT NOT NULL UNIQUE,
            archive_name TEXT NOT NULL,
            archive_sha256 TEXT NOT NULL,
            sha256 TEXT NOT NULL,
            byte_count INTEGER NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            same_stem_as_drive_png INTEGER NOT NULL,
            image_category TEXT NOT NULL,
            extracted_text TEXT NOT NULL,
            review_status TEXT NOT NULL
        );
        CREATE TABLE war_outpost_rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            outpost_victory_points INTEGER NOT NULL,
            exact_visible_effect TEXT NOT NULL,
            exact_visible_phase_rule TEXT NOT NULL,
            source_id INTEGER NOT NULL REFERENCES local_archive_reconciliation(source_id),
            review_state TEXT NOT NULL
        );
        CREATE TABLE community_team_examples (
            id TEXT PRIMARY KEY,
            mode TEXT NOT NULL,
            displayed_team_power INTEGER,
            leader_position INTEGER,
            outcome TEXT NOT NULL,
            source_id INTEGER NOT NULL REFERENCES local_archive_reconciliation(source_id),
            review_state TEXT NOT NULL
        );
        CREATE TABLE community_team_members (
            example_id TEXT NOT NULL REFERENCES community_team_examples(id),
            position INTEGER NOT NULL,
            observed_name TEXT NOT NULL,
            PRIMARY KEY (example_id, position)
        );
    ''')
    out.executemany('''INSERT INTO source_image_reconciliation VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''', [
        (r['filename'], r['source_id'], r['drive_id'], r['sha256'], r['image_category'],
         json.dumps(r['subjects_shown']), r['extracted_text'], json.dumps(r['database_records_connected']),
         json.dumps(r['contributes_new_information']), json.dumps(r['information_imported']),
         json.dumps(r['unresolved_text_or_identity']), r['review_status'], r['confidence'])
        for r in images
    ])
    image_by_file = {r['filename']: r for r in images}
    if len(allies) != 20 or len({r['image'] for r in allies}) != 20:
        raise SystemExit('Expected 20 unique ally card candidates')
    out.executemany('INSERT INTO ally_gem_cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [
        ('ally-gem-' + r['image'][4:8], image_by_file[r['image']]['source_id'],
         r['owner'], r['ally'], r['relationship'], r['replaces_power_up'], r['gem_title'],
         r['exact_visible_effect'], image_by_file[r['image']]['extracted_text'],
         'visually_verified', 'historical_currentness_unknown', image_by_file[r['image']]['sha256'])
        for r in allies
    ])
    out.executemany('INSERT INTO recovered_drive_cards VALUES (?,?,?,?,?,?,?,?)', [
        (r['id'], r['name'], r['kind'], r['rarity'], r['gem_color'], r['relationship'],
         image_by_file[r['source_image']]['source_id'], r['review_state'])
        for r in drive_cards['cards']
    ])
    out.executemany('INSERT INTO recovered_drive_abilities VALUES (?,?,?,?,?,?,?)', [
        (r['id'], r['card_id'], r['name'], r['kind'], r['exact_visible_text'],
         image_by_file[r['source_image']]['source_id'], r['review_state'])
        for r in drive_cards['abilities']
    ])
    if len(item_matches) != 46:
        raise SystemExit('Expected 46 OCR matched item images')
    out.executemany('INSERT INTO item_image_matches VALUES (?,?,?,?)', [
        (r['source_id'], int(r['item_id'].split('-')[-1]), r['basis'], r['review_state'])
        for r in item_matches
    ])
    known_assault_ids = {r['id'] for r in json.loads(
        (ROOT / 'data/audit/legendary-assault-recovered.json').read_text()
    )['abilities']} | {f'rhaegal-sqlite-{i}' for i in range(1, 7)}
    if len(assault_matches) != 25 or any(r['ability_id'] not in known_assault_ids for r in assault_matches):
        raise SystemExit('Expected 25 links to existing Legendary Assault abilities')
    out.executemany('INSERT INTO legendary_assault_image_matches VALUES (?,?,?,?)', [
        (r['source_id'], r['ability_id'], r['basis'], r['review_state'])
        for r in assault_matches
    ])
    if len(skill_matches) != 93:
        raise SystemExit('Expected 93 unique champion skill title matches')
    out.executemany('INSERT INTO champion_skill_image_matches VALUES (?,?,?,?)', [
        (r['source_id'], int(r['ability_id'].split('-')[-1]), r['basis'], r['review_state'])
        for r in skill_matches
    ])
    if len(trait_matches) != 309:
        raise SystemExit('Expected 309 unique trait title image links')
    out.executemany('INSERT INTO champion_trait_image_matches VALUES (?,?,?,?)', [
        (r['source_id'], r['trait_id'], r['basis'], r['review_state'])
        for r in trait_matches
    ])
    out.executemany('INSERT INTO local_archive_reconciliation VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [
        (r['source_id'], r['filename'], r['archive'], r['archive_sha256'], r['sha256'],
         r['bytes'], r['width'], r['height'], int(r['same_stem_as_drive_png']),
         r['image_category'], r['extracted_text'], r['review_status'])
        for r in local_archive
    ])
    archive_by_file = {r['filename']: r for r in local_archive}
    if len(war_rules) != 4:
        raise SystemExit('Expected four visually reviewed War outpost rules')
    out.executemany('INSERT INTO war_outpost_rules VALUES (?,?,?,?,?,?,?)', [
        (r['id'], r['name'], r['outpost_victory_points'], r['exact_visible_effect'],
         r['exact_visible_phase_rule'], archive_by_file[r['source_image']]['source_id'], r['review_state'])
        for r in war_rules
    ])
    if len(community_teams) != 2 or any(len(r['observed_members']) != 5 for r in community_teams):
        raise SystemExit('Expected two five-member community Attack lineups')
    out.executemany('INSERT INTO community_team_examples VALUES (?,?,?,?,?,?,?)', [
        (r['id'], r['mode'], r['displayed_team_power'], r['leader_position'], r['outcome'],
         archive_by_file[r['source_image']]['source_id'], r['review_state'])
        for r in community_teams
    ])
    out.executemany('INSERT INTO community_team_members VALUES (?,?,?)', [
        (r['id'], position, name)
        for r in community_teams
        for position, name in enumerate(r['observed_members'], start=1)
    ])
    historic_values = []
    for r in history:
        fp = r['local_exact_name_matches'][0] if r['local_exact_name_matches'] else None
        if fp:
            path = RECOVERED / r['filename']
            if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest() != fp['sha256']:
                raise SystemExit(f'Recovered source bytes do not match manifest: {r["filename"]}')
        historic_values.append((r['source_id'], r['filename'], r['locator_kind'], r['status'],
                                fp['sha256'] if fp else None, fp['byte_count'] if fp else None,
                                r['chatgpt_library_exact_search']))
    out.executemany('INSERT INTO historical_source_reconciliation VALUES (?,?,?,?,?,?,?)', historic_values)
    if out.execute('PRAGMA foreign_key_check').fetchall():
        raise SystemExit('Reconciled SQLite foreign key check failed')
    if out.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
        raise SystemExit('Reconciled SQLite integrity check failed')
    out.commit()
    out.close()
    temporary.replace(OUTPUT)
    print('Built', OUTPUT, 'from pinned snapshot: 833 Drive images, 615 historical references')


if __name__ == '__main__':
    main()
