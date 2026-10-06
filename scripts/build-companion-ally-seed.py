#!/usr/bin/env python3
"""Generate private, OCR-pending ally-card evidence from 20 original images."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARDS = ROOT / 'data/audit/companion-ally-candidates.json'
IMAGES = ROOT / 'data/source-images/reconciliation.jsonl'
OUTPUT = ROOT / 'supabase/migrations/20261006040000_ally_gem_evidence.sql'


def lit(value):
    return "'" + value.replace("'", "''") + "'"


def main():
    cards = json.loads(CARDS.read_text())['cards']
    images = {r['filename']: r for r in (json.loads(s) for s in IMAGES.read_text().splitlines())}
    if len(cards) != 20 or {r['image'] for r in cards} != {f'IMG_{n}.PNG' for n in range(2537, 2557)}:
        raise SystemExit('Expected exactly the 20 consecutive ally card screenshots')
    sql = ['''-- Private source-backed ally gem candidates. Raw OCR is not confirmed game wording.
-- Summoned champion companions remain a separate game mechanic.
CREATE TABLE IF NOT EXISTS knowledge.ally_gem_cards (
  id text PRIMARY KEY,
  source_id bigint NOT NULL UNIQUE REFERENCES knowledge.sources(source_id),
  owner_name_candidate text NOT NULL,
  ally_name_candidate text NOT NULL,
  gem_title_candidate text NOT NULL,
  raw_ocr text NOT NULL,
  review_state text NOT NULL CHECK (review_state IN ('image_identified_ocr_wording_unverified', 'visually_verified')),
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$')
);
ALTER TABLE knowledge.ally_gem_cards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.ally_gem_cards FROM PUBLIC, anon, authenticated;
''']
    for card in cards:
        image = images[card['image']]
        if image['image_category'] != 'companion_ally_card':
            raise SystemExit(f'Image not classified as an ally card: {card["image"]}')
        key = 'ally-gem-' + card['image'][4:8]
        sql.append('INSERT INTO knowledge.ally_gem_cards '
                   '(id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES (' +
                   ', '.join((lit(key), str(image['source_id']), lit(card['owner']), lit(card['ally']),
                              lit(card['gem_title_candidate']), lit(image['extracted_text']),
                              lit('image_identified_ocr_wording_unverified'), lit(image['sha256']))) +
                   ') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;')
        sql.append('INSERT INTO knowledge.record_evidence '
                   '(record_kind, record_id, source_id, evidence_role, review_state) VALUES (' +
                   ', '.join((lit('ally_gem_card'), lit(key), str(image['source_id']),
                              lit('original_card_visible'), lit('image_identified_ocr_wording_unverified'))) +
                   ') ON CONFLICT DO NOTHING;')
    OUTPUT.write_text('\n'.join(sql) + '\n')
    print('Wrote', OUTPUT, 'with', len(cards), 'private OCR-pending ally cards')


if __name__ == '__main__':
    main()
