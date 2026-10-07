#!/usr/bin/env python3
"""Verify and OCR the three preserved original-upload archives.

The ZIP index's subject column is a search aid, not verified game data.
Same filename stems as Drive PNGs are possible duplicates, not proof of one.
"""

import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_DIR = Path.home() / 'Downloads/GOT Legends V2 Grok batch 1'
OUTPUT = ROOT / 'data/source-images/local-archive-reconciliation.jsonl'
DRIVE = ROOT / 'data/source-images/drive-archive.json'
WAR_RULES = ROOT / 'data/audit/recovered-war-outpost-rules.json'
COMMUNITY_TEAMS = ROOT / 'data/audit/recovered-community-teams.json'


def unique_archive_category(filename):
    if filename in ('IMG_1387.jpg', 'IMG_1391.jpg'):
        return 'community_team_example'
    if filename == 'IMG_1611.jpg':
        return 'battle_log'
    if filename in ('IMG_2637.jpg', 'IMG_2638.jpg', 'IMG_2639.jpg', 'IMG_2640.jpg'):
        return 'war_outpost_rule'
    if filename == 'IMG_2675.jpg':
        return 'alliance_chat'
    return 'legacy_application_screenshot'


def main():
    drive_categories = {Path(r['filename']).stem: r['image_category'] for r in
                        (json.loads(line) for line in (ROOT / 'data/source-images/reconciliation.jsonl').read_text().splitlines())}
    drive_stems = set(drive_categories)
    paths = sorted(ARCHIVE_DIR.glob('GOT_Legends_original_uploads_part*of3.zip'))
    if len(paths) != 3:
        raise SystemExit('Expected the three original-upload ZIP archives')
    rows = []
    with tempfile.TemporaryDirectory(prefix='got-archive-ocr-') as temporary:
        work = Path(temporary)
        for path in paths:
            archive_sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
            with zipfile.ZipFile(path) as archive:
                index = {r['filename']: r for r in csv.DictReader(io.StringIO(
                    archive.read('_index.csv').decode('utf-8-sig')))}
                for filename in archive.namelist():
                    if filename.startswith('_') or filename.endswith('/'):
                        continue
                    if '/' in filename or '\\' in filename:
                        raise SystemExit(f'Unexpected ZIP entry path: {filename}')
                    source = index.get(filename)
                    if source is None:
                        raise SystemExit(f'Missing ZIP index entry: {filename}')
                    data = archive.read(filename)
                    sha = hashlib.sha256(data).hexdigest()
                    if sha != source['sha256'] or len(data) != int(source['bytes']):
                        raise SystemExit(f'ZIP index byte/hash mismatch: {filename}')
                    image = work / filename
                    image.write_bytes(data)
                    ocr = subprocess.run(['tesseract', str(image), 'stdout'],
                                         capture_output=True, text=True, check=True).stdout.strip()
                    dimensions = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(image)],
                                                capture_output=True, text=True, check=True).stdout
                    width = int(next(line.split(':', 1)[1] for line in dimensions.splitlines()
                                     if line.strip().startswith('pixelWidth:')))
                    height = int(next(line.split(':', 1)[1] for line in dimensions.splitlines()
                                      if line.strip().startswith('pixelHeight:')))
                    stem = Path(filename).stem
                    source_id = 200000 + int(stem.split('_')[1]) if stem.startswith('IMG_') else None
                    rows.append({
                        'filename': filename,
                        'source_id': source_id,
                        'archive': path.name,
                        'archive_sha256': archive_sha256,
                        'sha256': sha,
                        'bytes': len(data),
                        'width': width,
                        'height': height,
                        'same_stem_as_drive_png': stem in drive_stems,
                        'image_category': drive_categories.get(stem, unique_archive_category(filename)),
                        'approximate_subject_from_zip_index': source['approximate_subject'],
                        'index_champion_hint': source['champion_name_if_applicable'],
                        'index_game_mode_hint': source['game_mode_if_applicable'],
                        'extracted_text': ocr,
                        'text_review_status': 'machine_ocr_unverified',
                        'database_records_connected': [],
                        'contributes_new_information': 'unresolved',
                        'information_imported': False,
                        'unresolved_text_or_identity': ['source image requires fact comparison'],
                        'review_status': 'archive_bytes_verified_content_unreviewed',
                        'confidence': 0.0,
                    })
    if len(rows) != 101 or len({r['filename'] for r in rows}) != 101:
        raise SystemExit(f'Expected 101 unique archived images; got {len(rows)}')
    rows.sort(key=lambda r: r['filename'])
    for index, row in enumerate(r for r in rows if r['source_id'] is None):
        row['source_id'] = 300001 + index
    if len({r['source_id'] for r in rows}) != 101:
        raise SystemExit('Archive source IDs are not unique')
    rules = {r['source_image']: r for r in json.loads(WAR_RULES.read_text())['rules']}
    teams = {r['source_image']: r for r in json.loads(COMMUNITY_TEAMS.read_text())['examples']}
    for row in rows:
        if row['filename'] in rules:
            rule = rules[row['filename']]
            row['database_records_connected'] = [
                {'table': 'war_outpost_rules', 'id': rule['id'], 'basis': 'visually_reviewed_archived_original'}
            ]
            row['contributes_new_information'] = True
            row['information_imported'] = True
            row['unresolved_text_or_identity'] = ['historical rule; current release state unverified']
            row['review_status'] = 'visible_rule_wording_checked_currentness_unknown'
            row['confidence'] = 1.0
        elif row['filename'] in teams:
            team = teams[row['filename']]
            row['database_records_connected'] = [
                {'table': 'community_team_examples', 'id': team['id'], 'basis': 'visually_reviewed_composition_only'}
            ]
            row['contributes_new_information'] = True
            row['information_imported'] = True
            row['unresolved_text_or_identity'] = ['champion variants and battle outcome not shown']
            row['review_status'] = 'visible_composition_checked_outcome_unknown'
            row['confidence'] = 1.0
    OUTPUT.write_text(''.join(json.dumps(r, ensure_ascii=False, sort_keys=True) + '\n' for r in rows))
    print(f'Verified and OCR-indexed {len(rows)} archived images: '
          f'{sum(r["same_stem_as_drive_png"] for r in rows)} share a Drive filename stem, '
          f'{sum(not r["same_stem_as_drive_png"] for r in rows)} do not.')


if __name__ == '__main__':
    main()
