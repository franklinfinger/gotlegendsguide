#!/usr/bin/env python3
"""Match item-card screenshots to known item names by unique OCR title.

This establishes a review candidate for item identity only. It does not
validate an ability's rank or wording, which can differ across screenshots.
"""

import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
SQLITE = Path.home() / 'Downloads/got_legends_verified_knowledge.db'


def compact(value):
    return re.sub(r'[^a-z0-9]', '', value.casefold())


def main():
    db = sqlite3.connect(f'file:{SQLITE}?mode=ro', uri=True)
    names = [(row[0], row[1]) for row in db.execute(
        'SELECT iconic_ability_id, item_name FROM iconic_abilities'
    )]
    transcripts = json.loads((ROOT / 'data/source-images/ocr-unreviewed.json').read_text())['transcripts']
    manifest = [json.loads(line) for line in (ROOT / 'data/source-images/reconciliation.jsonl').read_text().splitlines()]
    matches = []
    for image in manifest:
        if image['image_category'] not in ('iconic_item_ability', 'iconic_item_detail'):
            continue
        filename = image['filename']
        if filename in ('IMG_2188.PNG', 'IMG_2072.PNG'):
            continue  # Theon's reviewed item; Brienne trait misclassified by OCR.
        title_region = compact(transcripts[filename][:250])
        first_line = compact(transcripts[filename].splitlines()[0])
        candidates = [(item_id, name) for item_id, name in names if (
            len(compact(name)) >= 5 and compact(name) in title_region
        ) or (len(compact(name)) < 5 and first_line == compact(name))]
        partial_titles = {'IMG_2484.PNG': 'redqueensbattle', 'IMG_2497.PNG': 'valyriansteel'}
        if filename in partial_titles:
            candidates = [(item_id, name) for item_id, name in names if compact(name).startswith(partial_titles[filename])]
        if len(candidates) != 1:
            raise SystemExit(f'No unique item title in {filename}: {candidates}')
        item_id, name = candidates[0]
        matches.append({
            'filename': filename,
            'source_id': image['source_id'],
            'item_id': f'sqlite-iconic-item-{item_id}',
            'item_name': name,
            'basis': 'unique_ocr_item_title_prefix' if filename in partial_titles else 'unique_normalized_item_title_in_machine_ocr',
            'review_state': 'identity_ocr_pending_visual_review',
        })
    if len(matches) != 46:
        raise SystemExit(f'Expected 46 other item-card images; got {len(matches)}')
    output = ROOT / 'data/audit/item-image-matches.json'
    output.write_text(json.dumps({'matches': matches}, indent=2) + '\n')
    print(f'Wrote {len(matches)} unique OCR item-title matches to {output}')


if __name__ == '__main__':
    main()
