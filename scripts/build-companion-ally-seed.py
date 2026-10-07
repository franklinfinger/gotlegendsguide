#!/usr/bin/env python3
"""Generate private, visually verified ally-card mechanics from 20 images."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARDS = ROOT / 'data/audit/companion-ally-candidates.json'
IMAGES = ROOT / 'data/source-images/reconciliation.jsonl'
OUTPUT = ROOT / 'supabase/migrations/20261006130000_verified_ally_gem_mechanics.sql'


def lit(value):
    return "'" + value.replace("'", "''") + "'"


def main():
    cards = json.loads(CARDS.read_text())['cards']
    images = {r['filename']: r for r in (json.loads(s) for s in IMAGES.read_text().splitlines())}
    if len(cards) != 20 or {r['image'] for r in cards} != {f'IMG_{n}.PNG' for n in range(2537, 2557)}:
        raise SystemExit('Expected exactly the 20 consecutive ally card screenshots')
    sql = ['''-- Exact mechanics visually transcribed from the 20 original ally-card PNGs.
-- Historical screenshots do not establish current release state.
ALTER TABLE knowledge.ally_gem_cards
  ADD COLUMN IF NOT EXISTS relationship text,
  ADD COLUMN IF NOT EXISTS replaces_power_up text,
  ADD COLUMN IF NOT EXISTS exact_visible_effect text,
  ADD COLUMN IF NOT EXISTS currentness_state text;
''']
    for card in cards:
        image = images[card['image']]
        if image['image_category'] != 'companion_ally_card':
            raise SystemExit(f'Image not classified as an ally card: {card["image"]}')
        key = 'ally-gem-' + card['image'][4:8]
        sql.append('UPDATE knowledge.ally_gem_cards SET ' + ', '.join((
            'owner_name_candidate=' + lit(card['owner']),
            'ally_name_candidate=' + lit(card['ally']),
            'gem_title_candidate=' + lit(card['gem_title']),
            'relationship=' + lit(card['relationship']),
            'replaces_power_up=' + lit(card['replaces_power_up']),
            'exact_visible_effect=' + lit(card['exact_visible_effect']),
            'review_state=' + lit('visually_verified'),
            'currentness_state=' + lit('historical_currentness_unknown'),
        )) + ' WHERE id=' + lit(key) + ';')
        sql.append('UPDATE knowledge.record_evidence SET review_state=' + lit('visually_verified') +
                   ' WHERE record_kind=' + lit('ally_gem_card') + ' AND record_id=' + lit(key) +
                   ' AND source_id=' + str(image['source_id']) + ';')
    sql.append('ALTER TABLE knowledge.ally_gem_cards ALTER COLUMN relationship SET NOT NULL, '
               'ALTER COLUMN replaces_power_up SET NOT NULL, ALTER COLUMN exact_visible_effect SET NOT NULL, '
               'ALTER COLUMN currentness_state SET NOT NULL;')
    OUTPUT.write_text('\n'.join(sql) + '\n')
    print('Wrote', OUTPUT, 'with', len(cards), 'visually verified ally cards')


if __name__ == '__main__':
    main()
