#!/usr/bin/env python3
"""Index globally unique original trait titles visible in trait-screen OCR.

Ambiguous shared titles and OCR misses are deliberately left unresolved.
These links establish identity candidates, not exact ability wording.
"""

from collections import defaultdict
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
    title_index = defaultdict(list)
    for trait_id, title in db.execute('SELECT trait_id, trait_name FROM champion_traits'):
        title_index[compact(title)].append((trait_id, title))
    ocr = json.loads((ROOT / 'data/source-images/ocr-unreviewed.json').read_text())['transcripts']
    images = [json.loads(line) for line in (ROOT / 'data/source-images/reconciliation.jsonl').read_text().splitlines()]
    matches = []
    for image in images:
        if image['image_category'] != 'champion_trait':
            continue
        title_region = compact(ocr[image['filename']][:1000])
        for title_key, records in title_index.items():
            if len(title_key) < 9 or len(records) != 1 or title_key not in title_region:
                continue
            trait_id, title = records[0]
            matches.append({
                'filename': image['filename'],
                'source_id': image['source_id'],
                'trait_id': trait_id,
                'trait_name': title,
                'basis': 'globally_unique_trait_title_in_machine_ocr',
                'review_state': 'identity_ocr_pending_visual_review',
            })
    if len(matches) != 309:
        raise SystemExit(f'Expected 309 unique-title trait links; got {len(matches)}')
    output = ROOT / 'data/audit/champion-trait-image-matches.json'
    output.write_text(json.dumps({'matches': matches}, indent=2) + '\n')
    print(f'Wrote {len(matches)} trait title links across {len({r["filename"] for r in matches})} images')


if __name__ == '__main__':
    main()
