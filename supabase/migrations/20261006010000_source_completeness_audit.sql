-- Add evidence-bounded corrections beside the immutable verified SQLite mirror.
-- The raw mirror, source IDs, announced records, and legacy files remain intact.

ALTER TABLE knowledge.champion_variants
  DROP CONSTRAINT IF EXISTS champion_variants_live_status_check;
ALTER TABLE knowledge.champion_variants
  ADD CONSTRAINT champion_variants_live_status_check
  CHECK (live_status IN ('live', 'announced', 'superseded', 'unverified'));

CREATE TABLE IF NOT EXISTS knowledge.source_image_fingerprints (
  source_id bigint PRIMARY KEY REFERENCES knowledge.sources(source_id),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  byte_count bigint NOT NULL CHECK (byte_count > 0),
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  corpus text NOT NULL,
  content_review_state text NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge.record_evidence (
  record_kind text NOT NULL,
  record_id text NOT NULL,
  source_id bigint NOT NULL REFERENCES knowledge.sources(source_id),
  evidence_role text NOT NULL,
  review_state text NOT NULL,
  PRIMARY KEY (record_kind, record_id, source_id, evidence_role)
);

CREATE TABLE IF NOT EXISTS knowledge.legacy_champion_metadata (
  variant_id text PRIMARY KEY REFERENCES knowledge.champion_variants(id),
  legacy_id text NOT NULL UNIQUE,
  source_path text NOT NULL,
  legacy_rarity text,
  legacy_factions jsonb NOT NULL,
  legacy_roles jsonb NOT NULL,
  legacy_tags jsonb NOT NULL,
  legacy_why text,
  review_state text NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge.champion_portraits (
  id text PRIMARY KEY,
  variant_id text REFERENCES knowledge.champion_variants(id),
  legacy_key text NOT NULL,
  asset_path text NOT NULL UNIQUE,
  source_script text NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  source_image_id bigint REFERENCES knowledge.sources(source_id),
  attribution text NOT NULL,
  review_state text NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge.iconic_item_catalog (
  id text PRIMARY KEY,
  display_name text NOT NULL UNIQUE,
  owner_variant_id text REFERENCES knowledge.champion_variants(id),
  legacy_item_id bigint UNIQUE REFERENCES knowledge.iconic_items(item_id),
  source_id bigint REFERENCES knowledge.sources(source_id),
  review_state text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.iconic_item_ability_links (
  item_id text NOT NULL REFERENCES knowledge.iconic_item_catalog(id),
  ability_id text NOT NULL UNIQUE REFERENCES knowledge.abilities(id),
  source_id bigint NOT NULL REFERENCES knowledge.sources(source_id),
  PRIMARY KEY (item_id, ability_id)
);

CREATE TABLE IF NOT EXISTS knowledge.faction_aliases (
  raw_name text NOT NULL,
  canonical_faction_id text NOT NULL REFERENCES knowledge.factions(id),
  normalization_kind text NOT NULL,
  review_state text NOT NULL,
  PRIMARY KEY (raw_name, canonical_faction_id)
);

CREATE TABLE IF NOT EXISTS knowledge.legendary_assault_encounters (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  subtitle text,
  legacy_raid_boss_id bigint UNIQUE REFERENCES knowledge.raid_bosses(raid_boss_id),
  source_id bigint REFERENCES knowledge.sources(source_id),
  review_state text NOT NULL,
  release_state text NOT NULL DEFAULT 'historical_screenshot_unconfirmed_current'
);
CREATE TABLE IF NOT EXISTS knowledge.legendary_assault_abilities (
  id text PRIMARY KEY,
  encounter_id text NOT NULL REFERENCES knowledge.legendary_assault_encounters(id),
  ability_name text NOT NULL,
  scope text,
  exact_visible_text text NOT NULL,
  completion_state text NOT NULL,
  legacy_raid_boss_ability_id bigint UNIQUE REFERENCES knowledge.raid_boss_abilities(raid_boss_ability_id),
  UNIQUE (encounter_id, ability_name)
);
CREATE TABLE IF NOT EXISTS knowledge.legendary_assault_ability_sources (
  ability_id text NOT NULL REFERENCES knowledge.legendary_assault_abilities(id),
  source_id bigint NOT NULL REFERENCES knowledge.sources(source_id),
  PRIMARY KEY (ability_id, source_id)
);

DO $$
DECLARE tab text;
BEGIN
  FOREACH tab IN ARRAY ARRAY[
    'source_image_fingerprints', 'record_evidence', 'legacy_champion_metadata',
    'champion_portraits', 'iconic_item_catalog', 'iconic_item_ability_links',
    'faction_aliases', 'legendary_assault_encounters',
    'legendary_assault_abilities', 'legendary_assault_ability_sources'
  ] LOOP
    EXECUTE format('ALTER TABLE knowledge.%I ENABLE ROW LEVEL SECURITY', tab);
    EXECUTE format('REVOKE ALL ON knowledge.%I FROM PUBLIC, anon, authenticated', tab);
  END LOOP;
END $$;
