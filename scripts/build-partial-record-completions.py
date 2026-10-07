#!/usr/bin/env python3
"""Generate source-backed corrections for records completed by continuation images."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORRECTIONS = ROOT / 'data/audit/completed-partial-records.json'
MANIFEST = ROOT / 'data/source-images/reconciliation.jsonl'
OUTPUT = ROOT / 'supabase/migrations/20261006140000_complete_partial_abilities.sql'


def lit(value):
    return "'" + value.replace("'", "''") + "'"


def main():
    records = json.loads(CORRECTIONS.read_text())['records']
    images = {row['filename']: row for row in (json.loads(line) for line in MANIFEST.read_text().splitlines())}
    if len(records) != 9 or sum(row['kind'] == 'champion_skill' for row in records) != 1:
        raise SystemExit('Expected one skill and eight trait completions')
    sql = ['-- Complete only wording visible across the cited original screenshots.']
    for row in records:
        table = 'champion_skills' if row['kind'] == 'champion_skill' else 'champion_traits'
        key = 'skill_id' if row['kind'] == 'champion_skill' else 'trait_id'
        sql.append(f'UPDATE knowledge.{table} SET exact_visible_text={lit(row["exact_visible_text"])}, completion_state=\'complete\' WHERE {key}={row["record_id"]};')
        if row['kind'] == 'champion_skill':
            normalized_id = f'sqlite-champion_skills-{row["record_id"]}'
            sql.append('UPDATE knowledge.abilities SET exact_visible_text=' + lit(row['exact_visible_text']) +
                       ", review_status='complete', provenance='Screenshot Verified' WHERE id=" + lit(normalized_id) + ';')
            sql.append('UPDATE knowledge.ability_effects SET exact_visible_text=' + lit(row['exact_visible_text']) +
                       ' WHERE ability_id=' + lit(normalized_id) + ';')
        for filename in row['source_images']:
            source_id = images[filename]['source_id']
            sql.append('INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES (' +
                       ','.join((lit(row['kind']), lit(str(row['record_id'])), str(source_id),
                                 lit('visible_wording_continuation'), lit('visually_verified'))) + ') ON CONFLICT DO NOTHING;')
    OUTPUT.write_text('\n'.join(sql) + '\n')
    print(f'Wrote {OUTPUT} with {len(records)} completed records')


if __name__ == '__main__':
    main()
