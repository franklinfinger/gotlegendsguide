-- Preserve three visibly distinct historical variants rather than overwriting existing kits.
UPDATE knowledge.champion_variants SET display_name='Stannis Baratheon — Lord of Storm''s End' WHERE id='sqlite-champion-16';
UPDATE knowledge.champion_variants SET display_name='Criston Cole — Personal Escort' WHERE id='sqlite-champion-65';
UPDATE knowledge.champion_variants SET display_name='Jon Snow — King in the North' WHERE id='sqlite-champion-3';

INSERT INTO knowledge.champion_variants
  (id,character_id,display_name,rarity,gem_color,confidence,review_status,live_status)
VALUES
  ('audit-variant-stannis-one-true-king','sqlite-character-16','Stannis Baratheon — The One True King','Legendary','Purple',1,'complete','unverified'),
  ('audit-variant-criston-kingmaker','sqlite-character-65','Criston Cole — Kingmaker','Legendary','Red',1,'complete','unverified'),
  ('audit-variant-jon-battle-of-the-bastards','sqlite-character-3','Jon Snow — Battle of the Bastards','Legendary','Blue',1,'complete','unverified')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, rarity=EXCLUDED.rarity, gem_color=EXCLUDED.gem_color;

INSERT INTO knowledge.abilities
  (id,kind,name,variant_id,source_id,provenance,confidence,review_status,exact_visible_text)
VALUES
  ('audit-stannis-one-true-king-skill','skill','Come With Me And Take This City','audit-variant-stannis-one-true-king',102275,'Screenshot Verified',1,'complete','Stannis deals 155% ATK Physical Damage to a single enemy and spawns 1 random Power-Up. He then TAUNTS enemies with a +35% Durability Buff for 2 turns.'),
  ('audit-stannis-one-true-king-trait-1','trait','I Will Not Retreat II','audit-variant-stannis-one-true-king',102274,'Screenshot Verified',1,'complete','Stannis begins the battle with +50% Stamina. When any Power-Up is destroyed while he''s TAUNTING, he REMOVES 1 Buff from all enemies.'),
  ('audit-criston-kingmaker-skill','skill','For The True King','audit-variant-criston-kingmaker',102321,'Screenshot Verified',1,'complete','Criston gains a +2% DEF Buff for each BIRTHRIGHT he has, for 4 turns. He then strikes a single enemy for 80% DEF Physical Damage.'),
  ('audit-criston-kingmaker-trait-1','trait','The Kingmaker II','audit-variant-criston-kingmaker',102319,'Screenshot Verified',1,'complete','Anytime Criston is struck by an enemy Skill, he strikes that enemy for +100% ATK Physical Damage and grants all allies +2 BIRTHRIGHT.'),
  ('audit-criston-kingmaker-trait-2','trait','I Send You To Glory II','audit-variant-criston-kingmaker',102319,'Screenshot Verified',1,'complete','Criston begins combat with +8 BIRTHRIGHT and +75% Stamina. When an enemy is defeated, Criston TAUNTS the enemy team for 4 turns.'),
  ('audit-jon-battle-of-the-bastards-skill','skill','You Against Me','audit-variant-jon-battle-of-the-bastards',102414,'Screenshot Verified',1,'complete','Jon strikes an enemy for 25% ATK Physical Damage. He follows up this attack with 3 bonus strikes that each do 50% ATK Physical Damage and deal triple damage if the target is BRITTLE.'),
  ('audit-jon-battle-of-the-bastards-trait-1','trait','Charge The Enemy','audit-variant-jon-battle-of-the-bastards',102412,'Screenshot Verified',1,'complete','At the start of each turn, any BRITTLE enemy suffers an indefinite -5% ATK Debuff.'),
  ('audit-jon-battle-of-the-bastards-trait-2','trait','Avenge The Fallen','audit-variant-jon-battle-of-the-bastards',102412,'Screenshot Verified',1,'complete','When an ally is defeated, the enemy who dealt the final blow is afflicted with 1 ICE, and Jon gains +25% Stamina.')
ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text, source_id=EXCLUDED.source_id;

INSERT INTO knowledge.ability_effects (id,ability_id,effect_kind,exact_visible_text)
SELECT 'effect-' || id,id,'source_visible_text',exact_visible_text
FROM knowledge.abilities WHERE id LIKE 'audit-stannis-one-true-king-%' OR id LIKE 'audit-criston-kingmaker-%' OR id LIKE 'audit-jon-battle-of-the-bastards-%'
ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text;

DELETE FROM knowledge.record_evidence
WHERE record_kind='champion_variant' AND evidence_role='full_profile_screenshot_evidence'
  AND (record_id,source_id) IN (('sqlite-champion-16',102272),('sqlite-champion-65',102318),('sqlite-champion-3',102411));

INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES
  ('champion_variant','audit-variant-stannis-one-true-king',102272,'full_profile_screenshot_evidence','visually_verified_identity'),
  ('champion_variant','audit-variant-criston-kingmaker',102318,'full_profile_screenshot_evidence','visually_verified_identity'),
  ('champion_variant','audit-variant-jon-battle-of-the-bastards',102411,'full_profile_screenshot_evidence','visually_verified_identity'),
  ('ability','audit-stannis-one-true-king-skill',102275,'complete_visible_wording','visually_verified'),
  ('ability','audit-stannis-one-true-king-trait-1',102274,'complete_visible_wording','visually_verified'),
  ('ability','audit-criston-kingmaker-skill',102321,'complete_visible_wording','visually_verified'),
  ('ability','audit-criston-kingmaker-trait-1',102319,'complete_visible_wording','visually_verified'),
  ('ability','audit-criston-kingmaker-trait-2',102319,'complete_visible_wording','visually_verified'),
  ('ability','audit-criston-kingmaker-trait-2',102320,'visible_wording_continuation','visually_verified'),
  ('ability','audit-jon-battle-of-the-bastards-skill',102414,'complete_visible_wording','visually_verified'),
  ('ability','audit-jon-battle-of-the-bastards-trait-1',102412,'complete_visible_wording','visually_verified'),
  ('ability','audit-jon-battle-of-the-bastards-trait-2',102412,'complete_visible_wording','visually_verified'),
  ('ability','audit-jon-battle-of-the-bastards-trait-2',102413,'visible_upgrade_continuation','visually_verified')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.champion_variants WHERE id LIKE 'audit-variant-%' AND id IN ('audit-variant-stannis-one-true-king','audit-variant-criston-kingmaker','audit-variant-jon-battle-of-the-bastards')) <> 3 THEN
    RAISE EXCEPTION 'Expected three recovered variants';
  END IF;
  IF (SELECT count(*) FROM knowledge.abilities WHERE variant_id IN ('audit-variant-stannis-one-true-king','audit-variant-criston-kingmaker','audit-variant-jon-battle-of-the-bastards')) <> 8 THEN
    RAISE EXCEPTION 'Expected eight recovered variant abilities';
  END IF;
END $$;
