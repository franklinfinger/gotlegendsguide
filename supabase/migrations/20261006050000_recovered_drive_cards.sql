-- Historical screenshot-backed candidate records, kept private until
-- identity/currentness and every linked ability are reconciled.
CREATE TABLE IF NOT EXISTS knowledge.recovered_drive_cards (
  id text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('champion_candidate', 'summoned_companion')),
  rarity text,
  gem_color text,
  relationship_text text,
  source_id bigint NOT NULL REFERENCES knowledge.sources(source_id),
  review_state text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.recovered_drive_abilities (
  id text PRIMARY KEY,
  card_id text NOT NULL REFERENCES knowledge.recovered_drive_cards(id),
  name text NOT NULL,
  kind text NOT NULL,
  exact_visible_text text NOT NULL,
  source_id bigint NOT NULL REFERENCES knowledge.sources(source_id),
  review_state text NOT NULL
);
ALTER TABLE knowledge.recovered_drive_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.recovered_drive_abilities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.recovered_drive_cards, knowledge.recovered_drive_abilities FROM PUBLIC, anon, authenticated;

INSERT INTO knowledge.recovered_drive_cards
  (id, name, kind, rarity, gem_color, relationship_text, source_id, review_state)
VALUES
  ('drive-card-grey-wind', 'Grey Wind', 'champion_candidate', 'Legendary', 'Purple', 'Robb Stark''s direwolf', 102440, 'historical_screenshot_currentness_unknown'),
  ('drive-card-summer', 'Summer', 'summoned_companion', 'Legendary', 'Green', 'Bran Stark''s direwolf', 102204, 'historical_screenshot_currentness_unknown')
ON CONFLICT (id) DO UPDATE SET source_id=EXCLUDED.source_id, review_state=EXCLUDED.review_state;

INSERT INTO knowledge.recovered_drive_abilities
  (id, card_id, name, kind, exact_visible_text, source_id, review_state)
VALUES
  ('drive-ability-grey-wind-unseen-hunter', 'drive-card-grey-wind', 'Unseen Hunter', 'skill', 'Grey Wind strikes an enemy for 200% ATK Physical Damage and afflicts them with 1 ICE, with a 75% chance to afflict them with 1 bonus ICE. Grey Wind then gains STEALTH for 3 turns.', 102443, 'visually_checked_historical_level_1'),
  ('drive-ability-grey-wind-death-from-shadows', 'drive-card-grey-wind', 'Death from the Shadows', 'trait', 'When a BRITTLE enemy uses their Skill, if Grey Wind is STEALTHED, he will exit STEALTH to strike them for 600% ATK Physical Damage.', 102441, 'visually_checked_locked_2_star_preview'),
  ('drive-ability-summer-wargs-wolf', 'drive-card-summer', 'The Warg''s Wolf', 'summoned_companion_skill', 'Summer strikes an enemy for 210% ATK Physical Damage. Summer then deals an additional 65% ATK Physical Damage for each ICE on the target.', 102204, 'visually_checked_historical_level_8')
ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text, review_state=EXCLUDED.review_state;

INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state)
VALUES
  ('recovered_drive_card', 'drive-card-grey-wind', 102440, 'visible_identity', 'screenshot_checked'),
  ('recovered_drive_card', 'drive-card-summer', 102204, 'visible_identity', 'screenshot_checked'),
  ('recovered_drive_ability', 'drive-ability-grey-wind-unseen-hunter', 102443, 'visible_wording', 'screenshot_checked'),
  ('recovered_drive_ability', 'drive-ability-grey-wind-death-from-shadows', 102441, 'locked_preview_wording', 'screenshot_checked'),
  ('recovered_drive_ability', 'drive-ability-summer-wargs-wolf', 102204, 'visible_wording', 'screenshot_checked')
ON CONFLICT DO NOTHING;
