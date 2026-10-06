#!/usr/bin/env python3
"""Preserve every legacy portrait definition, including conflicting variants."""

import base64
from collections import Counter
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/champion-portraits'
MANIFEST = ROOT / 'data/source-images/legacy-portraits.json'
PATTERN = re.compile(r'"([^"]+)":\s*"([A-Za-z0-9+/=]+)"')


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    records = []
    invalid = []
    scripts = sorted(ROOT.glob('p-*.js')) + sorted(ROOT.glob('portraits-*.js'))
    for script in scripts:
        for key, encoded in PATTERN.findall(script.read_text()):
            if len(encoded) < 300:
                continue
            try:
                image = base64.b64decode(encoded, validate=True)
            except ValueError as error:
                invalid.append({'legacy_key': key, 'source_script': script.name, 'reason': str(error)})
                continue
            if not image.startswith(b'\xff\xd8\xff') or not image.endswith(b'\xff\xd9'):
                invalid.append({'legacy_key': key, 'source_script': script.name, 'reason': 'JPEG marker missing'})
                continue
            try:
                with Image.open(BytesIO(image)) as decoded:
                    decoded.load()
            except Exception as error:
                invalid.append({'legacy_key': key, 'source_script': script.name, 'reason': f'JPEG decoder rejected image: {error}'})
                continue
            digest = hashlib.sha256(image).hexdigest()
            filename = f'{key}--{script.stem}.jpg'
            (DEST / filename).write_bytes(image)
            records.append({
                'legacy_key': key,
                'path': f'assets/champion-portraits/{filename}',
                'source_script': script.name,
                'sha256': digest,
                'bytes': len(image),
                'review_state': 'legacy_embedded_portrait_source_screenshot_unlinked',
            })
    counts = Counter(row['legacy_key'] for row in records)
    MANIFEST.write_text(json.dumps({
        'attribution': 'User supplied GOT: Legends game screenshots embedded in the legacy guide; game art remains with its rights holder.',
        'warning': 'Multiple definitions for a key are preserved. A portrait does not prove current champion metadata.',
        'definitions': records,
        'invalid_definitions': invalid,
        'conflicting_keys': sorted(key for key, count in counts.items() if count > 1),
    }, indent=2) + '\n')
    print(f'Preserved {len(records)} valid definitions for {len(counts)} keys; {len(invalid)} invalid definitions retained in scripts; {sum(x > 1 for x in counts.values())} keys have variants.')


if __name__ == '__main__':
    main()
