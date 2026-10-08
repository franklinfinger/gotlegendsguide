#!/usr/bin/env python3
"""Hash and index the individually reviewed October 8 game screenshots."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / 'data/source-images/guide-updates-2026-10-08'
MANIFEST = SOURCE_DIR / 'manifest.json'

# This transcription is limited to words visible in each original image. A
# cropped continuation is not completed from context or the player's summary.
REVIEWED = {
    'IMG_3879.PNG': ('faction', ['Greens', 'Ormund Hightower'],
        'GREENS. The faction which supports Aegon II Targaryen during the Targaryen civil war. '
        '3 MEMBER FACTION BONUS: All team members gain +20% Gem Damage and +25% Power. '
        'HOW TO PLAY GREENS: The Greens start strong with BIRTHRIGHT. They must act quickly, as BIRTHRIGHT fades as the battle goes on.',
        ['faction_rule:greens-bonus', 'faction_rule:greens-how-to-play',
         'faction_membership:screenshot-variant-ormund-hightower-beacon-of-the-south/Greens']),
    'IMG_3880.PNG': ('champion main card', ['Ned Stark — The Hand of the King'],
        'LEGENDARY. NED STARK. The Hand of the King. Red gem. Stark faction icon. Skill Lvl. 5. '
        'Displayed account stats and star rank are not universal champion properties.',
        ['champion_variant:screenshot-variant-ned-stark-hand-of-the-king-red',
         'champion_portrait:source-crop-ned-stark-hand-of-the-king-red']),
    'IMG_3881.PNG': ('faction', ['Stark'],
        'STARK. Not only a great House of Westeros, but also the rulers of The North. '
        '3 MEMBER FACTION BONUS: All team members gain +20% Gem Damage and +25% DEF. '
        'HOW TO PLAY STARK: Starks win with ICE. They build up ICE on enemies until they become BRITTLE, then exploit that advantage.',
        ['faction_rule:stark-bonus', 'faction_rule:stark-how-to-play']),
    'IMG_3882.PNG': ('champion traits', ['Ned Stark — The Hand of the King'],
        'THE KING CALLED ON ME TO SERVE. At the start of combat, Ned grants up to 2 random allies '
        'LOYALTY, 1 BLOCK and +8% Stamina and spawns 1 <style=Justice>Justice [cropped]. '
        '5-star locked: +7% Stamina and +1 Justice Gems. '
        'YOU THINK MY LIFE IS PRECIOUS TO ME? II. Whenever an enemy is afflicted with ICE, up to 3 times a turn, '
        'Ned HEALS himself for 8% of his ATK. If that ICE was applied by an ally with LOYALTY, [cropped]. '
        '6-star locked: HEALING increased by 2% ATK, and can trigger 1 additional time per turn.',
        ['ability:ned-hand-king-called-trait', 'ability:ned-hand-life-precious-trait']),
    'IMG_3883.PNG': ('champion trait continuation', ['Ned Stark — The Hand of the King'],
        'THE KING CALLED ON ME TO SERVE. [previous sentence cropped] BLOCK and +8% Stamina and '
        'spawns 1 <style=Justice>Justice Gems. When a <style=Justice>Justice Gem [cropped]. '
        '5-star locked: +7% Stamina and +1 Justice Gems. '
        'YOU THINK MY LIFE IS PRECIOUS TO ME? II. Whenever an enemy is afflicted with ICE, up to 3 times a turn, '
        'Ned HEALS himself for 8% of his ATK. If that ICE was applied by an ally with LOYALTY, [cropped].',
        ['ability:ned-hand-king-called-trait', 'ability:ned-hand-life-precious-trait']),
    'IMG_3884.PNG': ('champion trait continuation', ['Ned Stark — The Hand of the King'],
        'THE KING CALLED ON ME TO SERVE. When a <style=Justice>Justice Gem hits a BRITTLE enemy, '
        'Ned strikes them for 75% ATK Physical Damage. 5-star locked: +7% Stamina and +1 Justice Gems. '
        'YOU THINK MY LIFE IS PRECIOUS TO ME? II. Whenever an enemy is afflicted with ICE, up to 3 times a turn, '
        'Ned HEALS himself for 8% of his ATK. If that ICE was applied by an ally with LOYALTY, [cropped].',
        ['ability:ned-hand-king-called-trait', 'ability:ned-hand-life-precious-trait']),
    'IMG_3885.PNG': ('champion trait stats', ['Ned Stark — The Hand of the King'],
        'YOU THINK MY LIFE IS PRECIOUS TO ME? II. Whenever an enemy is afflicted with ICE, up to 3 times a turn, Ned HEALS himself for 8% of his ATK. If that ICE was applied by an ally with LOYALTY, [cropped]. '
        '6-star locked: HEALING increased by 2% ATK, and can trigger 1 additional time per turn. STATS BONUS: +5% HP; +10% DEF. 5-star locked: +5% ATK. 7-star locked: +5% DEF.',
        ['ability:ned-hand-life-precious-trait']),
    'IMG_3886.PNG': ('champion trait continuation', ['Ned Stark — The Hand of the King'],
        'YOU THINK MY LIFE IS PRECIOUS TO ME? II. [Previous words cropped] ICE, up to 3 times a turn, Ned HEALS himself for 8% of his ATK. If that ICE was applied by an ally with LOYALTY, that ally is also HEALED. '
        '6-star locked: HEALING increased by 2% ATK, and can trigger 1 additional time per turn. STATS BONUS: +5% HP; +10% DEF. 5-star locked: +5% ATK. 7-star locked: +5% DEF.',
        ['ability:ned-hand-life-precious-trait']),
    'IMG_3887.PNG': ('champion skill', ['Ned Stark — The Hand of the King'],
        'I WILL NOT HAVE THEIR BLOOD ON MY HANDS. Skill Lvl. 5. Stamina Speed: Normal. ADD BUFF. SPAWN GEM. Ned grants a target ally LOYALTY, with a 45% chance to also grant BLOCK. He then spawns 1 <style=Justice>Justice gem. If Ned is targeted, he spawns 1 additional <style=Justice>Justice gems. Level 6 Upgrade: +5% chance to give BLOCK.',
        ['ability:ned-hand-blood-on-my-hands-skill']),
    'IMG_3888.PNG': ('status tooltip', ['LOYALTY', 'Ned Stark — The Hand of the King'],
        'LOYALTY. If POISON, DECEIVE, or SCOUT is inflicted on this Champion, Ned gains the debuff instead for 3 turns. Ned has a 50% chance to cleanse it from himself immediately.',
        ['ability:loyalty-ned-hand-definition', 'strategy_fact:ned-hand-loyalty-redirect']),
    'IMG_3889.PNG': ('champion main card', ['Viserys Targaryen III — The Usurped'],
        'LEGENDARY. VISERYS TARGARYEN III. The Usurped. ICONIC Lvl. 17. Displayed account level, power, star rank, and stats are not universal champion properties.',
        ['champion_variant:sqlite-champion-41', 'iconic_item:sqlite-iconic-item-22']),
    'IMG_3890.PNG': ('iconic item detail', ['Dragon Brooch', 'Viserys Targaryen III — The Usurped'],
        'DRAGON BROOCH. Lvl 17. ICONIC ABILITY: I AM THE DRAGON IV. Viserys starts the battle with 50% Stamina and an indefinite 15% Fire Resistance Buff. Once per turn when an ally uses their Skill, Viserys grants them 1 FURY and has a 60% chance to apply FIRE on himself. STAT INCREASE at displayed level: 3.4K ATK; 13% fire/resistance-related icon; 850 DEF.',
        ['iconic_item:sqlite-iconic-item-22', 'ability:sqlite-iconic_abilities-22']),
}

def image_dimensions(path):
    output = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)], text=True)
    lines = output.splitlines()
    return {'width': int(next(line.split(':')[1] for line in lines if 'pixelWidth:' in line)),
            'height': int(next(line.split(':')[1] for line in lines if 'pixelHeight:' in line))}

rows = []
for filename, (category, subjects, visible, connected) in REVIEWED.items():
    path = SOURCE_DIR / filename
    rows.append({
        'filename': filename, 'source_id': 100000 + int(path.stem.split('_')[1]),
        'archive_locator': path.relative_to(ROOT).as_posix(),
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'byte_count': path.stat().st_size,
        'dimensions': image_dimensions(path), 'category': category,
        'subjects': subjects, 'exact_visible_text': visible,
        'connected_records': connected, 'review_status': 'visually_verified',
        'confidence': 1, 'unresolved': 'Continuation cropped in this image; use adjacent screenshots for the full effect.' if filename in ('IMG_3882.PNG', 'IMG_3883.PNG', 'IMG_3884.PNG', 'IMG_3885.PNG', 'IMG_3886.PNG') else None,
    })
if set(path.name for path in SOURCE_DIR.glob('*.PNG')) != set(REVIEWED):
    raise SystemExit('Source files and reviewed transcription differ; review each new image before regenerating.')
payload = json.dumps({'corpus': 'User-supplied Photos originals, October 8, 2026', 'images': rows}, indent=2) + '\n'
if '--check' in sys.argv:
    if MANIFEST.read_text() != payload:
        raise SystemExit('Source manifest, image hashes, or visible transcription differs.')
    print(f'Validated {len(rows)} individually reviewed screenshot hashes and transcription records.')
else:
    MANIFEST.write_text(payload)
    print(f'Indexed {len(rows)} source images.')
