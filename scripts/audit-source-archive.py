#!/usr/bin/env python3
"""Inventory original Drive screenshots without treating OCR as verified facts.

The input index contains stable Drive IDs and links. Original PNG bytes and OCR
text live outside Git; this script records byte hashes, dimensions, and a
searchable unreviewed OCR transcript for source reconciliation.
"""

import argparse
import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'data/source-images/drive-archive.json'
OCR_INDEX = ROOT / 'data/source-images/ocr-unreviewed.json'


def png_dimensions(path):
    with path.open('rb') as stream:
        header = stream.read(24)
    if header[:8] != b'\x89PNG\r\n\x1a\n' or header[12:16] != b'IHDR':
        raise ValueError(f'Invalid PNG: {path.name}')
    return struct.unpack('>II', header[16:24])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--images', type=Path, default=Path('/private/tmp/got_audit_images'))
    parser.add_argument('--ocr', type=Path, default=Path('/private/tmp/got_audit_ocr'))
    args = parser.parse_args()
    manifest = json.loads(INDEX.read_text())
    transcripts = {}
    missing = []
    for entry in manifest['files']:
        path = args.images / entry['filename']
        if not path.is_file():
            missing.append(entry['filename'])
            continue
        width, height = png_dimensions(path)
        digest = hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(block)
        entry['sha256'] = digest.hexdigest()
        entry['width'] = width
        entry['height'] = height
        entry['downloaded_bytes'] = path.stat().st_size
        entry['byte_count_match'] = entry['downloaded_bytes'] == entry['bytes']
        text_path = args.ocr / (entry['filename'] + '.txt')
        if text_path.is_file():
            transcripts[entry['filename']] = text_path.read_text(errors='replace').strip()
    if missing:
        raise SystemExit(f'Missing {len(missing)} original files: {missing}')
    bad_sizes = [entry['filename'] for entry in manifest['files'] if not entry['byte_count_match']]
    if bad_sizes:
        raise SystemExit(f'{len(bad_sizes)} byte count mismatches: {bad_sizes}')
    manifest['review_state'] = 'bytes_verified_content_unreviewed'
    INDEX.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    OCR_INDEX.write_text(json.dumps({
        'warning': 'Machine OCR is an unreviewed search index, not verified game text.',
        'transcripts': transcripts,
    }, indent=2, ensure_ascii=False) + '\n')
    print(f"Indexed {len(manifest['files'])} PNGs, {len(transcripts)} OCR transcripts; all sizes match Drive metadata.")


if __name__ == '__main__':
    main()
