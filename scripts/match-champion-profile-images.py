#!/usr/bin/env python3
"""Match reviewed champion profile screenshots to stable variant IDs.

Unique champion names are resolved from the pinned SQLite snapshot and the
legacy-only champion files. Only the small set of names with multiple variants
uses visually reviewed filename overrides. Full profile screenshots remain
source evidence; they are not represented as clean portrait crops.
"""

import argparse
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / 'Downloads/got_legends_verified_knowledge.db'
MANIFEST = ROOT / 'data/source-images/reconciliation.jsonl'
OUTPUT = ROOT / 'data/audit/champion-profile-image-matches.json'
MIGRATION = ROOT / 'supabase/migrations/20261006150000_champion_profile_image_evidence.sql'

# These rows were initially classified as profiles because they name a
# champion, but the image itself is a trait panel rather than a profile screen.
NON_PROFILE_IMAGES = {
    'IMG_2215.PNG', 'IMG_2334.PNG', 'IMG_2357.PNG', 'IMG_2364.PNG',
    'IMG_2409.PNG', 'IMG_2422.PNG', 'IMG_2439.PNG',
    'IMG_2440.PNG',  # Grey Wind companion profile, not a champion variant
}

LEGACY_ONLY_NAMES = {
    'Aegon II Targaryen', 'Aemond Targaryen', 'Baela Targaryen',
    'Balon Greyjoy', 'Caraxes', 'Doran Martell', 'Ellaria Sand',
    'Harwin Strong', 'Helaena Targaryen', 'Hizdahr zo Loraq',
    'Illyrio Mopatis', 'Jeor Mormont', 'Larys Strong', 'Loras Tyrell',
    'Theon Greyjoy', 'Thoros of Myr', 'Tyland Lannister', 'Wun Wun',
    'Yara Greyjoy',
}

# Each exception was read directly from the subtitle visible in the named PNG.
VISUALLY_REVIEWED_VARIANTS = {
    'IMG_1906.PNG': 'sqlite-champion-6',   # Conqueror Of Qarth
    'IMG_1944.PNG': 'sqlite-champion-11',  # Mother Of Dragons
    'IMG_1992.PNG': 'sqlite-champion-19',  # Khaleesi of the Great Grass Sea
    'IMG_2690.PNG': 'sqlite-champion-19',
    'IMG_2693.PNG': 'sqlite-champion-19',
    'IMG_1928.PNG': 'sqlite-champion-9',   # The Black Queen
    'IMG_1982.PNG': 'sqlite-champion-18',  # The King's Chosen Heir
    'IMG_2009.PNG': 'sqlite-champion-22',  # The Future King
    'IMG_2322.PNG': 'sqlite-champion-66',  # Protector of the Realm
    'IMG_2071.PNG': 'sqlite-champion-29',  # Lady Of The Sapphire Isles
    'IMG_2435.PNG': 'sqlite-champion-51',  # True Knight
    'IMG_2767.PNG': 'sqlite-champion-51',
    'IMG_2343.PNG': 'sqlite-champion-70',  # Queen of the Andals and First Men
    'IMG_2367.PNG': 'sqlite-champion-75',  # Queen of the Seven Kingdoms
    'IMG_1950.PNG': 'sqlite-champion-12',  # Lord of Casterly Rock
    'IMG_2360.PNG': 'sqlite-champion-74',  # The Half Man
    'IMG_2260.PNG': 'sqlite-champion-58',  # base Alicent
    'IMG_2424.PNG': 'sqlite-champion-78',  # Queen Dowager
    'IMG_2160.PNG': 'sqlite-champion-41',  # Viserys Targaryen III
    'IMG_2336.PNG': 'sqlite-champion-68',  # Viserys Targaryen I / The Peace King
}

# OCR did not return a subject for these two fully visible, reviewed profiles.
VISIBLE_IDENTITY_OVERRIDES = {
    'IMG_2296.PNG': 'legacy-champion-caraxes',
    'IMG_2314.PNG': 'legacy-champion-wunwun',
}


def load_rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def sql_literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sqlite', type=Path, default=SOURCE)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--migration', type=Path, default=MIGRATION)
    args = parser.parse_args()

    db = sqlite3.connect(f'file:{args.sqlite}?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    by_subject = {}
    for row in db.execute('SELECT champion_id, name, canonical_name FROM champions'):
        variant = f"sqlite-champion-{row['champion_id']}"
        names = {row['name'], row['canonical_name'] or row['name']}
        for name in names:
            by_subject.setdefault(name, set()).add(variant)

    for filename in ('champions-part1.json', 'champions-part2.json'):
        for card in json.loads((ROOT / filename).read_text())['champions']:
            if card['name'] in LEGACY_ONLY_NAMES:
                by_subject.setdefault(card['name'], set()).add('legacy-champion-' + card['id'])

    manifest = load_rows(MANIFEST)
    variants = {value for values in by_subject.values() for value in values}
    matches = []
    unresolved = []
    for row in manifest:
        if row['image_category'] != 'champion_profile' or row['filename'] in NON_PROFILE_IMAGES:
            continue
        filename = row['filename']
        subject = row['subjects_shown'][0] if len(row['subjects_shown']) == 1 else None
        if filename in VISUALLY_REVIEWED_VARIANTS:
            variant_id = VISUALLY_REVIEWED_VARIANTS[filename]
            basis = 'visible_profile_name_and_subtitle'
            review_state = 'visually_verified_identity'
        elif filename in VISIBLE_IDENTITY_OVERRIDES:
            variant_id = VISIBLE_IDENTITY_OVERRIDES[filename]
            basis = 'visible_profile_name'
            review_state = 'visually_verified_identity'
        elif subject and len(by_subject.get(subject, ())) == 1:
            variant_id = next(iter(by_subject[subject]))
            basis = 'unique_profile_subject_identity'
            review_state = 'identity_ocr_with_profile_layout'
        else:
            unresolved.append({'filename': filename, 'subject': subject})
            continue
        if variant_id not in variants:
            raise SystemExit(f'Unknown variant target: {filename} -> {variant_id}')
        matches.append({
            'filename': filename,
            'source_id': row['source_id'],
            'variant_id': variant_id,
            'basis': basis,
            'review_state': review_state,
            'image_role': 'full_profile_screenshot_evidence',
        })

    matches.sort(key=lambda row: (row['source_id'], row['variant_id']))
    if unresolved:
        raise SystemExit(f'Unresolved profile identities: {unresolved}')
    if len({row['source_id'] for row in matches}) != len(matches):
        raise SystemExit('A profile source was matched more than once')

    payload = {
        'method': 'unique local identity matching plus visually reviewed subtitle overrides',
        'scope_note': 'Full profile screenshots are evidence and are not clean portrait assets.',
        'excluded_non_profile_images': sorted(NON_PROFILE_IMAGES),
        'matches': matches,
    }
    args.output.write_text(json.dumps(payload, indent=2) + '\n')
    sql = [
        '-- Full champion profile screenshots linked as identity and image evidence.',
        '-- These are not clean portrait crops and do not replace champion_portraits.',
    ]
    for row in matches:
        sql.append(
            'INSERT INTO knowledge.record_evidence '
            '(record_kind, record_id, source_id, evidence_role, review_state) VALUES ('
            + ', '.join(sql_literal(value) for value in (
                'champion_variant', row['variant_id'], row['source_id'],
                row['image_role'], row['review_state']))
            + ') ON CONFLICT DO NOTHING;'
        )
    args.migration.write_text('\n'.join(sql) + '\n')
    print(f'Wrote {len(matches)} profile image matches covering '
          f'{len({row["variant_id"] for row in matches})} variants')


if __name__ == '__main__':
    main()
