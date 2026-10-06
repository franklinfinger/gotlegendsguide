#!/usr/bin/env python3
"""Inventory the 615 historical source references without guessing content.

Only exact filenames and actual bytes count as a recovery. Library locators are
retained for later authenticated retrieval; a locator is not an image.
"""

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'data/source-images/drive-archive.json'
OUTPUT = ROOT / 'data/source-images/historical-reference-reconciliation.jsonl'
SQLITE = Path.home() / 'Downloads/got_legends_verified_knowledge.db'
DEFAULT_ROOTS = [
    ROOT,
    Path.home() / 'Downloads',
    Path.home() / 'Documents',
    Path.home() / 'Desktop',
    Path.home() / 'Library/Application Support/Codex',
]
LIBRARY_EXACT_MATCHES = {
    '04945F19-6B74-4A85-86B3-06493EF6B6F0_1_105_c.jpeg',
    '92FBD173-E019-455B-B04E-70D73DB14310_1_105_c.jpeg',
    'B4DCFA2C-C4E3-49F4-9E2C-0E85F9280F79_1_105_c.jpeg',
}


def digest(path):
    sha = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            sha.update(block)
    return sha.hexdigest()


def discover_exact_files(names, roots):
    found = defaultdict(list)
    skipped = {'node_modules', '.git', '.next', 'dist', 'build', '.venv', 'venv'}
    for root in roots:
        if not root.exists():
            continue
        for folder, dirs, files in __import__('os').walk(root):
            dirs[:] = [name for name in dirs if name not in skipped]
            for name in files:
                if name in names:
                    found[name].append(Path(folder) / name)
    return found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sqlite', type=Path, default=SQLITE)
    parser.add_argument('--root', type=Path, action='append', dest='roots')
    args = parser.parse_args()
    db = sqlite3.connect(f'file:{args.sqlite}?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    archive = json.loads(ARCHIVE.read_text())['files']
    drive_names = {row['filename'] for row in archive}
    drive_hashes = {row['sha256'] for row in archive}
    refs = [dict(row) for row in db.execute('SELECT source_id, filename, drive_file_id, drive_url, source_type FROM sources ORDER BY source_id') if row['filename'] not in drive_names]
    if len(refs) != 615:
        raise SystemExit(f'Expected 615 external references, found {len(refs)}')
    local = discover_exact_files({row['filename'] for row in refs}, args.roots or DEFAULT_ROOTS)
    git_paths = subprocess.run(['git', 'log', '--all', '--name-only', '--pretty=format:'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.splitlines()
    historic_names = {Path(path).name for path in git_paths if path}
    rows = []
    for ref in refs:
        matches = local.get(ref['filename'], [])
        readable = [path for path in matches if path.is_file()]
        hashes = [{'path': str(path), 'sha256': digest(path), 'byte_count': path.stat().st_size} for path in readable]
        if hashes:
            status = 'duplicate' if any(item['sha256'] in drive_hashes for item in hashes) else 'recovered'
        else:
            # A Library locator is not proof of bytes, and a missing local file
            # is not proof that the authenticated Library cannot retrieve it.
            status = 'unresolved'
        rows.append({
            'source_id': ref['source_id'],
            'filename': ref['filename'],
            'source_type': ref['source_type'],
            'source_locator': ref['drive_url'],
            'locator_kind': 'chatgpt_library' if ref['drive_url'].startswith('library_file_id:') else ('chatgpt_file_url' if ref['drive_url'].startswith('https://files.chatgpt.com/') else 'other'),
            'status': status,
            'local_exact_name_matches': hashes,
            'appears_in_git_history_by_name': ref['filename'] in historic_names,
            'content_inferred_from_filename': False,
            'chatgpt_library_exact_search': 'found' if ref['filename'] in LIBRARY_EXACT_MATCHES else 'not_checked_individually',
            'attempts': ['connected_drive_archive_exact_name', 'local_project_downloads_documents_desktop_codex_cache_exact_name', 'repository_history_filename'] +
                (['chatgpt_library_exact_search_and_download'] if ref['filename'] in LIBRARY_EXACT_MATCHES else []),
        })
    OUTPUT.write_text(''.join(json.dumps(row, sort_keys=True, ensure_ascii=False) + '\n' for row in rows))
    print('Wrote', len(rows), 'historical references:', dict(Counter(row['status'] for row in rows)))
    for row in rows:
        if row['status'] in ('recovered', 'duplicate'):
            print(row['source_id'], row['filename'], row['status'])


if __name__ == '__main__':
    main()
