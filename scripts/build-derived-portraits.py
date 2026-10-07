#!/usr/bin/env python3
"""Build attributed portrait crops for variants missing a valid portrait asset.

The crop rectangle is fixed and reproducible for the 1260x2736 profile-screen
layout. Original screenshots remain unchanged and are linked by source ID.
"""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MATCHES = ROOT / 'data/audit/champion-profile-image-matches.json'
OUTPUT_DIR = ROOT / 'assets/champion-portraits'
MANIFEST = ROOT / 'data/audit/derived-portrait-manifest.json'
MIGRATION = ROOT / 'supabase/migrations/20261006200000_derived_profile_portraits.sql'

TARGETS = {
    'sqlite-champion-78', 'sqlite-champion-54', 'sqlite-champion-24',
    'sqlite-champion-29', 'sqlite-champion-51', 'legacy-champion-caraxes',
    'sqlite-champion-70', 'sqlite-champion-75', 'audit-variant-criston-kingmaker',
    'sqlite-champion-65', 'sqlite-champion-6', 'sqlite-champion-19',
    'sqlite-champion-11', 'sqlite-champion-66',
    'audit-variant-jon-battle-of-the-bastards', 'sqlite-champion-20',
    'sqlite-champion-17', 'sqlite-champion-80', 'sqlite-champion-18',
    'sqlite-champion-72', 'audit-variant-stannis-one-true-king',
    'sqlite-champion-74', 'sqlite-champion-68', 'sqlite-champion-41',
    'legacy-champion-wunwun',
}


def lit(value):
    return "'" + str(value).replace("'", "''") + "'"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--images', type=Path, default=Path('/private/tmp/got_audit_images'))
    args = parser.parse_args()
    matches = json.loads(MATCHES.read_text())['matches']
    by_variant = {}
    for row in matches:
        if row['variant_id'] in TARGETS:
            by_variant.setdefault(row['variant_id'], []).append(row)
    if set(by_variant) != TARGETS:
        raise SystemExit(f'Missing source profile matches for: {sorted(TARGETS - set(by_variant))}')

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for variant_id in sorted(TARGETS):
        candidates = sorted(by_variant[variant_id], key=lambda row: (
            row['review_state'] != 'visually_verified_identity', row['source_id']))
        source = candidates[0]
        source_path = args.images / source['filename']
        output_name = 'derived-' + variant_id.replace('_', '-').replace(':', '-') + '.png'
        output_path = OUTPUT_DIR / output_name
        subprocess.run([
            'sips', '--cropOffset', '500', '210', '--cropToHeightWidth', '840', '840',
            str(source_path), '--out', str(output_path),
        ], check=True, stdout=subprocess.DEVNULL)
        subprocess.run([
            'sips', '--resampleHeightWidth', '512', '512', str(output_path),
        ], check=True, stdout=subprocess.DEVNULL)
        sha256 = hashlib.sha256(output_path.read_bytes()).hexdigest()
        results.append({
            'id': 'derived-profile-' + variant_id.replace('_', '-'),
            'variant_id': variant_id,
            'asset_path': output_path.relative_to(ROOT).as_posix(),
            'sha256': sha256,
            'source_id': source['source_id'],
            'source_filename': source['filename'],
            'crop': {'offset_y': 500, 'offset_x': 210, 'height': 840, 'width': 840,
                     'output_height': 512, 'output_width': 512},
            'review_state': 'derived_profile_center_crop',
            'attribution': 'User supplied GOT: Legends game image; game art remains with its rights holder.',
        })

    MANIFEST.write_text(json.dumps({
        'method': 'Fixed crop of byte-verified profile screenshots; no generative image processing.',
        'portraits': results,
    }, indent=2) + '\n')

    sql = [
        '-- Deterministic portrait crops from byte-verified full profile screenshots.',
        '-- Original screenshots and direct evidence links remain preserved.',
    ]
    for row in results:
        sql.append(
            'INSERT INTO knowledge.champion_portraits '
            '(id,variant_id,legacy_key,asset_path,source_script,sha256,source_image_id,attribution,review_state) VALUES ('
            + ', '.join(lit(value) for value in (
                row['id'], row['variant_id'], 'derived:' + row['variant_id'], row['asset_path'],
                'scripts/build-derived-portraits.py', row['sha256'], row['source_id'],
                row['attribution'], row['review_state']))
            + ') ON CONFLICT (id) DO UPDATE SET variant_id=EXCLUDED.variant_id, asset_path=EXCLUDED.asset_path, '
              'sha256=EXCLUDED.sha256, source_image_id=EXCLUDED.source_image_id, review_state=EXCLUDED.review_state;'
        )
        sql.append(
            'INSERT INTO knowledge.record_evidence '
            '(record_kind,record_id,source_id,evidence_role,review_state) VALUES ('
            + ', '.join(lit(value) for value in (
                'champion_portrait', row['id'], row['source_id'],
                'derived_from_full_profile_screenshot', row['review_state']))
            + ') ON CONFLICT DO NOTHING;'
        )
    sql.extend([
        'DO $$', 'BEGIN',
        "  IF (SELECT count(*) FROM knowledge.champion_portraits WHERE review_state='derived_profile_center_crop') <> 25 THEN",
        "    RAISE EXCEPTION 'Expected 25 derived profile portraits';",
        '  END IF;', 'END $$;',
    ])
    MIGRATION.write_text('\n'.join(sql) + '\n')
    print(f'Built {len(results)} attributed 512x512 portrait crops')


if __name__ == '__main__':
    main()
