#!/usr/bin/env python3
"""Build one evidence-bounded reconciliation row for each connected Drive PNG.

OCR is a search aid. It is never silently promoted to exact game wording.
Human decisions live in the small reviewed-overrides file and survive reruns.
"""

import argparse
from collections import Counter, defaultdict
from difflib import SequenceMatcher
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'data/source-images/drive-archive.json'
OCR = ROOT / 'data/source-images/ocr-unreviewed.json'
OVERRIDES = ROOT / 'data/source-images/reviewed-overrides.json'
OUTPUT = ROOT / 'data/source-images/reconciliation.jsonl'
SQLITE = Path.home() / 'Downloads/got_legends_verified_knowledge.db'


def normalize(value):
    return re.sub(r'[^a-z0-9]+', ' ', value.casefold()).strip()


def load_known_records(db):
    linked = defaultdict(list)
    old_sources = {row['filename']: row['source_id'] for row in db.execute('SELECT source_id, filename FROM sources')}
    for table, pk in (
        ('champion_skills', 'skill_id'), ('champion_traits', 'trait_id'),
        ('iconic_abilities', 'iconic_ability_id'), ('iconic_items', 'item_id'),
        ('champion_companions', 'companion_id'), ('status_definitions', 'status_id'),
        ('raid_mode_rules', 'raid_rule_id'), ('raid_team_examples', 'raid_team_example_id'),
        ('strategy_team_examples', 'strategy_team_example_id'),
        ('announced_game_updates', 'update_id'),
    ):
        columns = {row['name'] for row in db.execute(f'PRAGMA table_info({table})')}
        if 'source_id' not in columns:
            continue
        for row in db.execute(f'SELECT {pk} AS record_id, source_id FROM {table} WHERE source_id IS NOT NULL'):
            linked[row['source_id']].append({'table': table, 'id': str(row['record_id']), 'basis': 'original_source_id'})
    for row in db.execute('SELECT raid_boss_ability_id, source_id FROM raid_boss_ability_sources'):
        linked[row['source_id']].append({'table': 'raid_boss_abilities', 'id': str(row['raid_boss_ability_id']), 'basis': 'original_source_join'})

    by_file = defaultdict(list)
    for filename, sid in old_sources.items():
        by_file[filename].extend(linked[sid])
    for file_name, field, table in (
        ('recovered-champion-skills.json', 'skills', 'abilities'),
        ('recovered-champion-traits.json', 'traits', 'abilities'),
        ('recovered-iconic-items.json', 'items', 'iconic_item_catalog'),
    ):
        records = json.loads((ROOT / 'data/audit' / file_name).read_text())[field]
        for record in records:
            for filename in record['source_images']:
                by_file[filename].append({'table': table, 'id': record['id'], 'basis': 'reviewed_source_image'})
                if table == 'iconic_item_catalog':
                    by_file[filename].append({'table': 'abilities', 'id': record['ability_id'], 'basis': 'reviewed_source_image'})
    dragons = json.loads((ROOT / 'data/audit/legendary-assault-recovered.json').read_text())
    for encounter in dragons['encounters']:
        for filename in encounter['source_images']:
            by_file[filename].append({'table': 'legendary_assault_encounters', 'id': encounter['id'], 'basis': 'reviewed_source_image'})
    for ability in dragons['abilities']:
        for filename in ability['source_images']:
            by_file[filename].append({'table': 'legendary_assault_abilities', 'id': ability['id'], 'basis': 'reviewed_source_image'})
    profile_images = {
        'IMG_2302.PNG': 'aegonii', 'IMG_2292.PNG': 'aemond',
        'IMG_2296.PNG': 'caraxes', 'IMG_2182.PNG': 'theon',
        'IMG_2310.PNG': 'thoros', 'IMG_2236.PNG': 'tyland',
        'IMG_2314.PNG': 'wunwun', 'IMG_2276.PNG': 'yara',
    }
    for filename, key in profile_images.items():
        by_file[filename].append({'table': 'champion_variants', 'id': 'legacy-champion-' + key, 'basis': 'reviewed_profile_identity'})
    for card in json.loads((ROOT / 'data/audit/companion-ally-candidates.json').read_text())['cards']:
        filename = card['image']
        by_file[filename].append({'table': 'ally_gem_cards', 'id': 'ally-gem-' + filename[4:8], 'basis': 'ocr_candidate_imported'})
    recovered_cards = json.loads((ROOT / 'data/audit/recovered-drive-cards.json').read_text())
    for card in recovered_cards['cards']:
        by_file[card['source_image']].append({
            'table': 'recovered_drive_cards', 'id': card['id'], 'basis': 'visually_reviewed_source_image'
        })
    for ability in recovered_cards['abilities']:
        by_file[ability['source_image']].append({
            'table': 'recovered_drive_abilities', 'id': ability['id'], 'basis': 'visually_reviewed_source_image'
        })
    item_matches = json.loads((ROOT / 'data/audit/item-image-matches.json').read_text())['matches']
    for match in item_matches:
        by_file[match['filename']].append({
            'table': 'iconic_item_catalog', 'id': match['item_id'],
            'basis': 'unique_ocr_item_title_identity_only'
        })
    assault_matches = json.loads((ROOT / 'data/audit/legendary-assault-image-matches.json').read_text())['matches']
    for match in assault_matches:
        by_file[match['filename']].append({
            'table': 'legendary_assault_abilities', 'id': match['ability_id'],
            'basis': 'ocr_ability_identity_only'
        })
    skill_matches = json.loads((ROOT / 'data/audit/champion-skill-image-matches.json').read_text())['matches']
    for match in skill_matches:
        by_file[match['filename']].append({
            'table': 'abilities', 'id': match['ability_id'],
            'basis': 'unique_ocr_skill_title_identity_only'
        })
    trait_matches = json.loads((ROOT / 'data/audit/champion-trait-image-matches.json').read_text())['matches']
    for match in trait_matches:
        by_file[match['filename']].append({
            'table': 'champion_traits', 'id': str(match['trait_id']),
            'basis': 'globally_unique_ocr_trait_title_identity_only'
        })
    completed = json.loads((ROOT / 'data/audit/completed-partial-records.json').read_text())['records']
    for record in completed:
        table = 'champion_skills' if record['kind'] == 'champion_skill' else 'champion_traits'
        for filename in record['source_images']:
            by_file[filename].append({
                'table': table,
                'id': str(record['record_id']),
                'basis': 'visually_verified_wording_continuation',
            })
    for filename, links in by_file.items():
        by_file[filename] = sorted({(x['table'], x['id'], x['basis']) for x in links})
    return old_sources, by_file


def known_subjects(db):
    names = {row['name'] for row in db.execute('SELECT name FROM champions')}
    for filename in ('champions-part1.json', 'champions-part2.json'):
        names.update(row['name'] for row in json.loads((ROOT / filename).read_text())['champions'])
    names.update(name.split(' - ', 1)[0] for name in list(names) if ' - ' in name)
    return sorted(names)


def subject_from_lines(lines, names):
    # A modal's second line is usually the champion. Require a strong,
    # unambiguous match; the raw OCR and rejected candidates stay in the row.
    candidates = []
    for line in lines[1:5]:
        text = normalize(line)
        if not 3 <= len(text) <= 55:
            continue
        for name in names:
            target = normalize(name)
            score = SequenceMatcher(None, text, target).ratio()
            if score >= 0.88:
                candidates.append((score, name))
    candidates.sort(reverse=True)
    if not candidates:
        return None, 0.0
    best_score, best_name = candidates[0]
    alternatives = [name for score, name in candidates if name != best_name and best_score - score < 0.09]
    if alternatives:
        return None, best_score
    return best_name, best_score


def classify(ocr_text, names, item_names, filename):
    lines = [line.strip() for line in ocr_text.splitlines() if line.strip()]
    start = normalize(' '.join(lines[:7]))
    first = normalize(lines[0]) if lines else ''
    all_text = normalize(ocr_text)
    subject, subject_conf = subject_from_lines(lines, names)
    start_compact = re.sub(r'[^a-z0-9]', '', ' '.join(lines[:8]).casefold())
    item_match = next((name for name in item_names if len(re.sub(r'[^a-z0-9]', '', name.casefold())) >= 5 and
                       re.sub(r'[^a-z0-9]', '', name.casefold()) in start_compact[:180]), None)
    profile_match = next((name for name in names if len(re.sub(r'[^a-z0-9]', '', name.casefold())) >= 8 and
                          re.sub(r'[^a-z0-9]', '', name.casefold()) in start_compact[:180]), None)
    if filename in ('IMG_2791.PNG', 'IMG_2792.PNG'):
        return 'device_gallery_reference', None, 0.92
    if filename == 'IMG_1838.PNG':
        return 'community_video_battle', None, 0.85
    if filename in ('IMG_2651.PNG', 'IMG_2652.PNG', 'IMG_2653.PNG', 'IMG_2654.PNG'):
        return 'team_composition', None, 0.65
    if filename in ('IMG_2658.PNG', 'IMG_2661.PNG'):
        return 'legendary_assault_ability', 'Rhaegal', 0.80
    second = normalize(lines[1]) if len(lines) > 1 else ''
    if (('skeletal wight' in second or 'free folk raider' in second) and first != 'skill' and first != 'traits'):
        return 'summoned_companion_profile', None, 0.86
    if 'the warg s wolf' in start:
        return 'summoned_companion_skill', 'Summer', 0.75
    if re.search(r"\bALLY\b", ocr_text[:180], re.I) and ('replaces' in all_text or 'power ups' in all_text):
        return 'companion_ally_card', subject, 0.92
    if 'battle log' in start and 'alliances' in start:
        return 'war_battle_log', None, 0.88
    if 'war of the three banners' in all_text or 'phase 1 ends in' in all_text:
        return 'war_mode', None, 0.82
    if 'old peeps on porches' in start:
        return 'alliance_profile', None, 0.94
    if 'chapter 40' in start:
        return 'campaign_battle', None, 0.85
    if 'your team' in all_text or 'edit team' in all_text[:500]:
        return 'team_composition', subject, 0.72
    if any(term in all_text[:350] for term in ('visi erion strikes', 'viserion strikes', 'rhaegal uses his stamina', 'rhaegal bites a single')) or (
        any(name in all_text[:160] for name in ('viserion', 'rhaegal', 'drogon')) and
        any(term in all_text for term in ('patience meter', 'durability', 'opening salvo', 'fuel to the flames', 'high and mighty', 'unchained dragon', 'wrathful gaze', 'claw swipe'))
    ):
        return 'legendary_assault_ability', None, 0.88
    if 'iconic ability' in all_text:
        return 'iconic_item_ability', subject, max(0.72, subject_conf)
    if item_match:
        return 'iconic_item_detail', item_match, 0.78
    if first == 'traits' or (first.startswith('traits ') and len(first) < 30) or ('traits' in start and 'enhance star rank' in all_text):
        return 'champion_trait', subject, max(0.72, subject_conf)
    if ('skill' in start and 'enhance star rank' in all_text) or (first == 'skill' and 'stamina speed' in all_text):
        return 'champion_skill', subject, max(0.76, subject_conf)
    if first == 'faction' or ('faction ' in start and 'targaryen' in start):
        return 'faction_information', None, 0.78
    if 'champion roster' in start:
        return 'champion_roster', None, 0.95
    if first.startswith('team bonuses') or first == 'factions':
        return 'faction_or_team_bonus', None, 0.84
    if first.startswith('your teams') or first.startswith('edit defensive') or 'raid team defense' in start:
        return 'team_composition', None, 0.80
    if 'tips and tricks' in start:
        return 'battle_tips', subject, 0.76
    if 'legendary' in start and subject:
        return 'champion_profile', subject, min(0.94, subject_conf)
    if subject and subject_conf >= 0.90:
        return 'champion_profile', subject, min(0.88, subject_conf)
    if profile_match and any(word in all_text[:700] for word in ('legendary', 'max', 'star rank', 'level up', 'skill traits')):
        return 'champion_profile', profile_match, 0.72
    if 'raid' in start and ('game mode' in start or 'attack' in start):
        return 'raid_mode', None, 0.72
    if 'war' in start and 'game mode' in start:
        return 'war_mode', None, 0.72
    if first == 'profile' and 'alliance' in all_text:
        return 'player_profile_or_team', None, 0.70
    return 'unclassified', subject, 0.0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sqlite', type=Path, default=SQLITE)
    args = parser.parse_args()
    db = sqlite3.connect(f'file:{args.sqlite}?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    archive = json.loads(ARCHIVE.read_text())['files']
    ocr = json.loads(OCR.read_text())['transcripts']
    overrides = json.loads(OVERRIDES.read_text()) if OVERRIDES.exists() else {}
    ally_cards = {
        card['image']: card
        for card in json.loads((ROOT / 'data/audit/companion-ally-candidates.json').read_text())['cards']
    }
    completed_images = {
        filename
        for record in json.loads((ROOT / 'data/audit/completed-partial-records.json').read_text())['records']
        for filename in record['source_images']
    }
    old_sources, linked = load_known_records(db)
    names = known_subjects(db)
    item_names = sorted({row['item_name'] for row in db.execute('SELECT item_name FROM iconic_abilities')}, key=len, reverse=True)
    rows = []
    for image in sorted(archive, key=lambda row: row['filename']):
        filename = image['filename']
        text = ocr.get(filename, '')
        category, subject, confidence = classify(text, names, item_names, filename)
        sid = old_sources.get(filename, 100000 + int(re.search(r'IMG_(\d+)', filename).group(1)))
        data_records = [{'table': table, 'id': key, 'basis': basis} for table, key, basis in linked.get(filename, [])]
        if any(record['table'] == 'legendary_assault_abilities' and record['basis'] == 'reviewed_source_image'
               for record in data_records):
            category = 'legendary_assault_ability'
            confidence = 1.0
        elif any(record['table'] == 'legendary_assault_encounters' for record in data_records):
            category = 'legendary_assault_encounter'
            confidence = max(confidence, 0.95)
        elif any(record['table'] == 'champion_variants' for record in data_records):
            category = 'champion_profile'
            confidence = max(confidence, 0.95)
        records = [{'table': 'sources', 'id': str(sid), 'basis': 'image_registry'}] + data_records
        row = {
            'filename': filename,
            'drive_id': image['drive_id'],
            'drive_url': image['drive_url'],
            'sha256': image['sha256'],
            'image_category': category,
            'subjects_shown': [subject] if subject else [],
            'extracted_text': text,
            'text_review_status': 'machine_ocr_unverified',
            'source_id': sid,
            'database_records_connected': records,
            'contributes_new_information': True if category == 'companion_ally_card' or any(
                record['table'] in ('recovered_drive_cards', 'recovered_drive_abilities') for record in data_records
            ) else (False if data_records else 'unresolved'),
            'information_imported': True if data_records else 'unresolved',
            'unresolved_text_or_identity': ['exact text remains machine OCR, not visual transcription'] + (
                ['champion identity not reliably resolved from OCR'] if not subject and category in ('champion_trait', 'champion_skill', 'champion_profile') else []
            ),
            'review_status': 'image_identity_ocr_pending_visual_review' if category == 'companion_ally_card' else 'deterministic_classification_unreviewed',
            'confidence': round(confidence, 3),
        }
        if filename in overrides:
            row.update(overrides[filename])
        if filename in ally_cards:
            row.update({
                'text_review_status': 'human_transcription_verified',
                'contributes_new_information': True,
                'information_imported': True,
                'unresolved_text_or_identity': ['historical card; current release state unverified'],
                'review_status': 'visual_card_checked_currentness_unknown',
                'confidence': 1.0,
            })
        if filename in completed_images:
            row.update({
                'text_review_status': 'human_transcription_verified',
                'contributes_new_information': True,
                'information_imported': True,
                'unresolved_text_or_identity': [],
                'review_status': 'visual_wording_continuation_checked',
                'confidence': 1.0,
            })
        rows.append(row)
    if len(rows) != 833 or len({row['filename'] for row in rows}) != 833:
        raise SystemExit('Expected exactly one reconciliation row for each of 833 images')
    OUTPUT.write_text(''.join(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n' for row in rows))
    counts = Counter(row['image_category'] for row in rows)
    print(f'Wrote {len(rows)} rows: ' + ', '.join(f'{key}={counts[key]}' for key in sorted(counts)))
    print(f"Unclassified: {counts['unclassified']}; explicit override rows: {len(overrides)}")


if __name__ == '__main__':
    main()
