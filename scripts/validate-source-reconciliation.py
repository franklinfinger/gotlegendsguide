#!/usr/bin/env python3
"""Verify source bytes and one-row-per-image reconciliation invariants."""

import argparse
import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'data/source-images/drive-archive.json'
MANIFEST = ROOT / 'data/source-images/reconciliation.jsonl'
HISTORY = ROOT / 'data/source-images/historical-reference-reconciliation.jsonl'
RECOVERED = ROOT / 'data/source-images/recovered'
LOCAL_ARCHIVE = ROOT / 'data/source-images/local-archive-reconciliation.jsonl'
FINAL_REVIEW = ROOT / 'data/audit/final-accessible-source-review.json'
MATERIALITY = ROOT / 'data/audit/historical-source-materiality.jsonl'


def json_lines(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--images', type=Path, default=Path('/private/tmp/got_audit_images'),
                        help='Directory containing the 833 original Drive PNG downloads')
    args = parser.parse_args()
    archive = json.loads(ARCHIVE.read_text())['files']
    manifest = json_lines(MANIFEST)
    history = json_lines(HISTORY)
    local_archive = json_lines(LOCAL_ARCHIVE)
    final_review = json.loads(FINAL_REVIEW.read_text())
    materiality = json_lines(MATERIALITY)
    if len(archive) != 833 or len(manifest) != 833 or len(history) != 615:
        raise SystemExit('Archive, manifest, or historical-reference count mismatch')
    by_file = {row['filename']: row for row in manifest}
    if len(by_file) != 833 or len({row['drive_id'] for row in manifest}) != 833:
        raise SystemExit('Duplicate filename or Drive ID in reconciliation manifest')
    for source in archive:
        filename = source['filename']
        row = by_file.get(filename)
        if row is None or row['drive_id'] != source['drive_id'] or row['sha256'] != source['sha256']:
            raise SystemExit(f'Manifest identity mismatch: {filename}')
        path = args.images / filename
        data = path.read_bytes()
        if len(data) != source['bytes'] or hashlib.sha256(data).hexdigest() != source['sha256']:
            raise SystemExit(f'Original image byte/hash mismatch: {filename}')
        if data[:16] != b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR':
            raise SystemExit(f'Invalid PNG header: {filename}')
        if struct.unpack('>II', data[16:24]) != (source['width'], source['height']):
            raise SystemExit(f'Original image dimensions mismatch: {filename}')
        if not row['image_category'] or not row['database_records_connected']:
            raise SystemExit(f'Incomplete manifest classification or source link: {filename}')
    recovered = 0
    for source in history:
        if source['status'] != 'recovered':
            continue
        recovered += 1
        path = RECOVERED / source['filename']
        data = path.read_bytes()
        expected = source['local_exact_name_matches'][0]
        if len(data) != expected['byte_count'] or hashlib.sha256(data).hexdigest() != expected['sha256']:
            raise SystemExit(f'Recovered Library image byte/hash mismatch: {source["filename"]}')
    if len(local_archive) != 101 or len(final_review['records']) != 345:
        raise SystemExit('Local archive or final visual-review cardinality mismatch')
    if sum(row.get('review_status') == 'individually_visually_reviewed' for row in local_archive) != 95:
        raise SystemExit('Expected all 95 formerly pending archive images to have individual review')
    reviewed_drive = [row for row in manifest if row.get('review_status') == 'individually_visually_reviewed']
    if len(reviewed_drive) != 250:
        raise SystemExit('Expected all 250 formerly unresolved Drive images to have individual review')
    if len(materiality) != 612 or sum(row['disposition'] == 'material_resupply_needed' for row in materiality) != 5:
        raise SystemExit('Historical materiality analysis must cover 612 references with five material resupply files')
    print(f'Validated {len(archive)} original Drive PNG byte hashes, sizes, and dimensions; '
          f'{recovered} recovered Library image hashes; {len(history)} historical-reference statuses; '
          '345 final visual reviews; 5 material historical resupply files.')


if __name__ == '__main__':
    main()
