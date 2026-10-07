#!/usr/bin/env python3
"""Replace low-resolution legacy headshots with crops of matched game profiles."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MATCHES = ROOT / 'data/audit/champion-profile-image-matches.json'
MANIFEST = ROOT / 'data/audit/upgraded-portrait-manifest.json'
MIGRATION = ROOT / 'supabase/migrations/20261007170000_upgrade_legacy_portraits.sql'


def quote(value):
    return "'" + str(value).replace("'", "''") + "'"


def dimensions(path):
    result = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)], text=True)
    return tuple(int(result.split(f'{field}: ')[1].splitlines()[0]) for field in ('pixelWidth', 'pixelHeight'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--images', type=Path, default=Path('/private/tmp/got_audit_images'))
    parser.add_argument('--guide-snapshot', type=Path, required=True)
    args = parser.parse_args()
    champions = json.loads(args.guide_snapshot.read_text())['champions']
    matched = {}
    for row in json.loads(MATCHES.read_text())['matches']:
        matched.setdefault(row['variant_id'], []).append(row)
    results = []
    wide_creatures = {
        'sqlite-champion-31', 'sqlite-champion-33', 'sqlite-champion-26',
        'sqlite-champion-52', 'sqlite-champion-35', 'sqlite-champion-25',
        'sqlite-champion-56',
    }
    for champion in champions:
        original = champion.get('portrait')
        if not original or min(dimensions(ROOT / original)) >= 128:
            continue
        candidates = sorted(matched.get(champion['id'], []), key=lambda row: (
            row['review_state'] != 'visually_verified_identity', row['source_id']))
        if not candidates:
            raise SystemExit(f"No source profile for {champion['id']}")
        source = candidates[0]
        source_path = args.images / source['filename']
        if not source_path.exists():
            raise SystemExit(f'Missing screenshot: {source_path}')
        relative = f"assets/champion-portraits/upgraded-{champion['id']}.png"
        output = ROOT / relative
        crop = (500, 210, 840) if champion['id'] in wide_creatures else (520, 430, 420)
        subprocess.run(['sips', '--cropOffset', str(crop[0]), str(crop[1]), '--cropToHeightWidth', str(crop[2]), str(crop[2]), str(source_path), '--out', str(output)], check=True, stdout=subprocess.DEVNULL)
        subprocess.run(['sips', '--resampleHeightWidth', '512', '512', str(output)], check=True, stdout=subprocess.DEVNULL)
        results.append({
            'variant_id': champion['id'], 'name': champion['name'], 'previous_asset': original,
            'asset_path': relative, 'source_id': source['source_id'], 'source_filename': source['filename'],
            'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
            'crop': {'offset_y': crop[0], 'offset_x': crop[1], 'height': crop[2], 'width': crop[2], 'output_height': 512, 'output_width': 512},
        })
    MANIFEST.write_text(json.dumps({'method': 'Fixed crop of source-matched full game profile screenshots; no generated art.', 'portraits': results}, indent=2) + '\n')
    sql = ['-- Reproducible, attributed portrait crops of verified full profile screenshots.', '-- Retain the original 64px and 72px assets as historical sources.']
    for row in results:
        portrait_id = '0-upgraded-profile-' + row['variant_id']
        values = [portrait_id, row['variant_id'], 'upgraded:' + row['variant_id'], row['asset_path'],
                  'scripts/upgrade-legacy-portraits.py', row['sha256'], row['source_id'],
                  'User supplied GOT: Legends game image; game art remains with its rights holder.', 'derived_profile_center_crop']
        sql.append('INSERT INTO knowledge.champion_portraits (id,variant_id,legacy_key,asset_path,source_script,sha256,source_image_id,attribution,review_state) VALUES (' + ','.join(map(quote, values)) + ') ON CONFLICT (id) DO UPDATE SET asset_path=EXCLUDED.asset_path,sha256=EXCLUDED.sha256,source_image_id=EXCLUDED.source_image_id;')
        sql.append('INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES (' + ','.join(map(quote, ['champion_portrait', portrait_id, row['source_id'], 'derived_from_full_profile_screenshot', 'derived_profile_center_crop'])) + ') ON CONFLICT DO NOTHING;')
    sql += [
        'DO $$ BEGIN',
        f"IF (SELECT count(*) FROM knowledge.champion_portraits WHERE id LIKE '0-upgraded-profile-%') <> {len(results)} THEN RAISE EXCEPTION 'Upgraded portrait count mismatch'; END IF;",
        'END $$;',
    ]
    MIGRATION.write_text('\n'.join(sql) + '\n')
    print(f'Upgraded {len(results)} portraits from full profile screenshots.')


if __name__ == '__main__':
    main()
