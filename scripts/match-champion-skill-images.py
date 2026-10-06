#!/usr/bin/env python3
"""Index unambiguous OCR skill-title matches as identity-only evidence."""

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
    skills = db.execute('SELECT skill_id, skill_name FROM champion_skills').fetchall()
    ocr = json.loads((ROOT / 'data/source-images/ocr-unreviewed.json').read_text())['transcripts']
    images = [json.loads(line) for line in (ROOT / 'data/source-images/reconciliation.jsonl').read_text().splitlines()]
    matches = []
    for image in images:
        if image['image_category'] != 'champion_skill':
            continue
        title_region = compact(ocr[image['filename']][:400])
        candidates = [(skill_id, name) for skill_id, name in skills
                      if len(compact(name)) >= 7 and compact(name) in title_region]
        if len(candidates) != 1:
            continue  # Preserve ambiguous and OCR-missed images for review.
        skill_id, name = candidates[0]
        matches.append({
            'filename': image['filename'],
            'source_id': image['source_id'],
            'ability_id': f'sqlite-champion_skills-{skill_id}',
            'ability_name': name,
            'basis': 'unique_skill_title_in_machine_ocr',
            'review_state': 'identity_ocr_pending_visual_review',
        })
    if len(matches) != 93:
        raise SystemExit(f'Expected 93 unique skill title matches; got {len(matches)}')
    output = ROOT / 'data/audit/champion-skill-image-matches.json'
    output.write_text(json.dumps({'matches': matches}, indent=2) + '\n')
    print(f'Wrote {len(matches)} OCR skill-title matches to {output}')


if __name__ == '__main__':
    main()
