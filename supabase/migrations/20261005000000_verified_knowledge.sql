-- Verified SQLite mirror. Generated from the attached source schema; preserve IDs and raw fields.
CREATE SCHEMA IF NOT EXISTS knowledge;
REVOKE ALL ON SCHEMA knowledge FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS knowledge."ability_definitions" (
  "ability_id" bigint,
  "ability_name" text NOT NULL,
  "exact_visible_text" text NOT NULL,
  "completion_state" text NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("ability_id")
);
CREATE TABLE IF NOT EXISTS knowledge."announced_faction_champions" (
  "announced_faction_champion_id" bigint,
  "announced_faction_change_id" bigint NOT NULL,
  "champion_name" text NOT NULL,
  "champion_variant" text,
  "announced_note" text,
  PRIMARY KEY ("announced_faction_champion_id")
);
CREATE TABLE IF NOT EXISTS knowledge."announced_faction_changes" (
  "announced_faction_change_id" bigint,
  "update_id" bigint NOT NULL,
  "faction_name" text NOT NULL,
  "change_kind" text NOT NULL,
  "replaces_or_expands" text,
  "announced_playstyle" text,
  "announced_bonus" text,
  PRIMARY KEY ("announced_faction_change_id")
);
CREATE TABLE IF NOT EXISTS knowledge."announced_game_updates" (
  "update_id" bigint,
  "title" text NOT NULL,
  "announcement_date" text,
  "expected_release_timing" text,
  "live_status" text NOT NULL,
  "source_id" bigint NOT NULL,
  "notes" text,
  PRIMARY KEY ("update_id")
);
CREATE TABLE IF NOT EXISTS knowledge."announced_strategy_rules" (
  "announced_strategy_rule_id" bigint,
  "update_id" bigint NOT NULL,
  "rule_key" text NOT NULL,
  "category" text NOT NULL,
  "exact_text" text NOT NULL,
  PRIMARY KEY ("announced_strategy_rule_id")
);
CREATE TABLE IF NOT EXISTS knowledge."champion_companions" (
  "companion_id" bigint,
  "champion_id" bigint NOT NULL,
  "companion_name" text NOT NULL,
  "skill_name" text,
  "stamina_speed" text,
  "tags" text,
  "exact_visible_text" text,
  "stat_bonus_text" text,
  "completion_state" text NOT NULL,
  "source_id" bigint,
  "subtitle" text,
  "shown_level" bigint,
  "shown_attack" text,
  "shown_defense" text,
  "shown_hp" text,
  PRIMARY KEY ("companion_id")
);
CREATE TABLE IF NOT EXISTS knowledge."champion_detailed_stats" (
  "champion_id" bigint,
  "attack" text,
  "defense" text,
  "health" text,
  "critical_damage_percent" double precision,
  "critical_strike_chance_percent" double precision,
  "gem_damage_percent" double precision,
  "gem_crit_chance_percent" double precision,
  "power_percent" double precision,
  "durability_percent" double precision,
  "fire_resistance_percent" double precision,
  "physical_resistance_percent" double precision,
  "unnatural_resistance_percent" double precision,
  "accuracy_percent" double precision,
  "dodge_chance_percent" double precision,
  "hit_chance_percent" double precision,
  "tenacity_percent" double precision,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("champion_id")
);
CREATE TABLE IF NOT EXISTS knowledge."champion_profiles" (
  "champion_id" bigint,
  "subtitle" text,
  "shown_level" bigint,
  "shown_power" bigint,
  "shown_attack" text,
  "shown_defense" text,
  "shown_hp" text,
  "notes" text,
  PRIMARY KEY ("champion_id")
);
CREATE TABLE IF NOT EXISTS knowledge."champion_skills" (
  "skill_id" bigint,
  "champion_id" bigint NOT NULL,
  "skill_name" text NOT NULL,
  "stamina_speed" text,
  "tags" text,
  "exact_visible_text" text NOT NULL,
  "completion_state" text NOT NULL,
  "source_id" bigint NOT NULL,
  "shown_skill_level" bigint,
  PRIMARY KEY ("skill_id")
);
CREATE TABLE IF NOT EXISTS knowledge."champion_traits" (
  "trait_id" bigint,
  "champion_id" bigint NOT NULL,
  "trait_name" text NOT NULL,
  "trait_level" text,
  "trait_type" text,
  "scope" text,
  "exact_visible_text" text NOT NULL,
  "completion_state" text NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("trait_id")
);
CREATE TABLE IF NOT EXISTS knowledge."champions" (
  "champion_id" bigint,
  "name" text NOT NULL,
  "rarity" text,
  "gem_color" text,
  "faction" text,
  "record_state" text NOT NULL,
  "notes" text,
  "canonical_name" text,
  PRIMARY KEY ("champion_id")
);
CREATE TABLE IF NOT EXISTS knowledge."iconic_abilities" (
  "iconic_ability_id" bigint,
  "champion_id" bigint NOT NULL,
  "item_name" text NOT NULL,
  "item_level" bigint,
  "ability_name" text NOT NULL,
  "ability_rank" text,
  "exact_visible_text" text NOT NULL,
  "completion_state" text NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("iconic_ability_id")
);
CREATE TABLE IF NOT EXISTS knowledge."iconic_items" (
  "item_id" bigint,
  "item_name" text NOT NULL,
  "item_level" bigint,
  "effect_name" text,
  "exact_visible_text" text NOT NULL,
  "completion_state" text NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("item_id")
);
CREATE TABLE IF NOT EXISTS knowledge."interaction_hypotheses" (
  "interaction_id" bigint,
  "champion_a_id" bigint NOT NULL,
  "champion_b_id" bigint NOT NULL,
  "hypothesis" text NOT NULL,
  "status" text NOT NULL,
  "evidence_notes" text NOT NULL,
  PRIMARY KEY ("interaction_id")
);
CREATE TABLE IF NOT EXISTS knowledge."raid_boss_abilities" (
  "raid_boss_ability_id" bigint,
  "raid_boss_id" bigint NOT NULL,
  "ability_name" text NOT NULL,
  "ability_rank" text,
  "scope" text,
  "exact_visible_text" text NOT NULL,
  "completion_state" text NOT NULL,
  PRIMARY KEY ("raid_boss_ability_id")
);
CREATE TABLE IF NOT EXISTS knowledge."raid_boss_ability_sources" (
  "raid_boss_ability_id" bigint NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("raid_boss_ability_id", "source_id")
);
CREATE TABLE IF NOT EXISTS knowledge."raid_boss_tips" (
  "tip_id" bigint,
  "raid_boss_id" bigint NOT NULL,
  "exact_visible_text" text NOT NULL,
  "completion_state" text NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("tip_id")
);
CREATE TABLE IF NOT EXISTS knowledge."raid_bosses" (
  "raid_boss_id" bigint,
  "name" text NOT NULL,
  "rarity" text,
  "subtitle" text,
  "gem_color" text,
  "shown_level" bigint,
  "shown_attack" text,
  "shown_defense" text,
  "shown_hp" text,
  "record_state" text NOT NULL,
  "notes" text,
  PRIMARY KEY ("raid_boss_id")
);
CREATE TABLE IF NOT EXISTS knowledge."raid_mode_rules" (
  "raid_rule_id" bigint,
  "rule_key" text NOT NULL,
  "category" text NOT NULL,
  "exact_text" text NOT NULL,
  "evidence_type" text NOT NULL,
  "source_id" bigint,
  PRIMARY KEY ("raid_rule_id")
);
CREATE TABLE IF NOT EXISTS knowledge."raid_team_examples" (
  "raid_team_example_id" bigint,
  "team_context" text NOT NULL,
  "shown_power" bigint,
  "bonuses_text" text,
  "source_id" bigint NOT NULL,
  "notes" text,
  PRIMARY KEY ("raid_team_example_id")
);
CREATE TABLE IF NOT EXISTS knowledge."raid_team_members" (
  "raid_team_member_id" bigint,
  "raid_team_example_id" bigint NOT NULL,
  "position" bigint NOT NULL,
  "champion_name" text NOT NULL,
  "shown_level" bigint,
  "shown_power" bigint,
  "is_leader" bigint NOT NULL,
  PRIMARY KEY ("raid_team_member_id")
);
CREATE TABLE IF NOT EXISTS knowledge."sources" (
  "source_id" bigint,
  "filename" text NOT NULL,
  "drive_file_id" text NOT NULL,
  "drive_url" text NOT NULL,
  "source_type" text NOT NULL,
  "verification_state" text NOT NULL,
  "notes" text,
  PRIMARY KEY ("source_id")
);
CREATE TABLE IF NOT EXISTS knowledge."status_definitions" (
  "status_id" bigint,
  "status_name" text NOT NULL,
  "exact_visible_definition" text NOT NULL,
  "completion_state" text NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("status_id")
);
CREATE TABLE IF NOT EXISTS knowledge."strategy_team_assessments" (
  "assessment_id" bigint,
  "strategy_team_example_id" bigint NOT NULL,
  "assessment_type" text NOT NULL,
  "assessment_text" text NOT NULL,
  "evidence_type" text NOT NULL,
  "source_id" bigint,
  PRIMARY KEY ("assessment_id")
);
CREATE TABLE IF NOT EXISTS knowledge."strategy_team_examples" (
  "strategy_team_example_id" bigint,
  "display_name" text,
  "game_mode" text,
  "team_role" text NOT NULL,
  "shown_power" bigint,
  "evidence_status" text NOT NULL,
  "source_id" bigint NOT NULL,
  "notes" text,
  PRIMARY KEY ("strategy_team_example_id")
);
CREATE TABLE IF NOT EXISTS knowledge."strategy_team_members" (
  "strategy_team_member_id" bigint,
  "strategy_team_example_id" bigint NOT NULL,
  "position" bigint NOT NULL,
  "champion_name" text NOT NULL,
  "shown_level" bigint,
  "shown_power" bigint,
  "is_leader" bigint NOT NULL,
  "gem_color" text,
  PRIMARY KEY ("strategy_team_member_id")
);
CREATE TABLE IF NOT EXISTS knowledge."trait_stat_bonuses" (
  "bonus_id" bigint,
  "trait_id" bigint NOT NULL,
  "stat_name" text NOT NULL,
  "percent_value" double precision NOT NULL,
  "source_id" bigint NOT NULL,
  PRIMARY KEY ("bonus_id")
);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ability_definitions_0') THEN ALTER TABLE knowledge."ability_definitions" ADD CONSTRAINT "fk_ability_definitions_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ability_definitions_0" ON knowledge."ability_definitions" ("ability_name");
ALTER TABLE knowledge."ability_definitions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."ability_definitions" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_announced_faction_champions_0') THEN ALTER TABLE knowledge."announced_faction_champions" ADD CONSTRAINT "fk_announced_faction_champions_0" FOREIGN KEY ("announced_faction_change_id") REFERENCES knowledge."announced_faction_changes" ("announced_faction_change_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_announced_faction_champions_0" ON knowledge."announced_faction_champions" ("announced_faction_change_id", "champion_name", "champion_variant");
ALTER TABLE knowledge."announced_faction_champions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."announced_faction_champions" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_announced_faction_changes_0') THEN ALTER TABLE knowledge."announced_faction_changes" ADD CONSTRAINT "fk_announced_faction_changes_0" FOREIGN KEY ("update_id") REFERENCES knowledge."announced_game_updates" ("update_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_announced_faction_changes_0" ON knowledge."announced_faction_changes" ("update_id", "faction_name");
ALTER TABLE knowledge."announced_faction_changes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."announced_faction_changes" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_announced_game_updates_0') THEN ALTER TABLE knowledge."announced_game_updates" ADD CONSTRAINT "fk_announced_game_updates_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_announced_game_updates_0" ON knowledge."announced_game_updates" ("title");
ALTER TABLE knowledge."announced_game_updates" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."announced_game_updates" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_announced_strategy_rules_0') THEN ALTER TABLE knowledge."announced_strategy_rules" ADD CONSTRAINT "fk_announced_strategy_rules_0" FOREIGN KEY ("update_id") REFERENCES knowledge."announced_game_updates" ("update_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_announced_strategy_rules_0" ON knowledge."announced_strategy_rules" ("update_id", "rule_key");
ALTER TABLE knowledge."announced_strategy_rules" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."announced_strategy_rules" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_companions_0') THEN ALTER TABLE knowledge."champion_companions" ADD CONSTRAINT "fk_champion_companions_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_companions_1') THEN ALTER TABLE knowledge."champion_companions" ADD CONSTRAINT "fk_champion_companions_1" FOREIGN KEY ("champion_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
ALTER TABLE knowledge."champion_companions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."champion_companions" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_detailed_stats_0') THEN ALTER TABLE knowledge."champion_detailed_stats" ADD CONSTRAINT "fk_champion_detailed_stats_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_detailed_stats_1') THEN ALTER TABLE knowledge."champion_detailed_stats" ADD CONSTRAINT "fk_champion_detailed_stats_1" FOREIGN KEY ("champion_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
ALTER TABLE knowledge."champion_detailed_stats" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."champion_detailed_stats" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_profiles_0') THEN ALTER TABLE knowledge."champion_profiles" ADD CONSTRAINT "fk_champion_profiles_0" FOREIGN KEY ("champion_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
ALTER TABLE knowledge."champion_profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."champion_profiles" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_skills_0') THEN ALTER TABLE knowledge."champion_skills" ADD CONSTRAINT "fk_champion_skills_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_skills_1') THEN ALTER TABLE knowledge."champion_skills" ADD CONSTRAINT "fk_champion_skills_1" FOREIGN KEY ("champion_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
ALTER TABLE knowledge."champion_skills" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."champion_skills" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_traits_0') THEN ALTER TABLE knowledge."champion_traits" ADD CONSTRAINT "fk_champion_traits_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_champion_traits_1') THEN ALTER TABLE knowledge."champion_traits" ADD CONSTRAINT "fk_champion_traits_1" FOREIGN KEY ("champion_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
ALTER TABLE knowledge."champion_traits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."champion_traits" FROM PUBLIC, anon, authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_champions_0" ON knowledge."champions" ("name");
ALTER TABLE knowledge."champions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."champions" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_iconic_abilities_0') THEN ALTER TABLE knowledge."iconic_abilities" ADD CONSTRAINT "fk_iconic_abilities_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_iconic_abilities_1') THEN ALTER TABLE knowledge."iconic_abilities" ADD CONSTRAINT "fk_iconic_abilities_1" FOREIGN KEY ("champion_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
ALTER TABLE knowledge."iconic_abilities" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."iconic_abilities" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_iconic_items_0') THEN ALTER TABLE knowledge."iconic_items" ADD CONSTRAINT "fk_iconic_items_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_iconic_items_0" ON knowledge."iconic_items" ("item_name");
ALTER TABLE knowledge."iconic_items" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."iconic_items" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_interaction_hypotheses_0') THEN ALTER TABLE knowledge."interaction_hypotheses" ADD CONSTRAINT "fk_interaction_hypotheses_0" FOREIGN KEY ("champion_b_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_interaction_hypotheses_1') THEN ALTER TABLE knowledge."interaction_hypotheses" ADD CONSTRAINT "fk_interaction_hypotheses_1" FOREIGN KEY ("champion_a_id") REFERENCES knowledge."champions" ("champion_id"); END IF; END $$;
ALTER TABLE knowledge."interaction_hypotheses" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."interaction_hypotheses" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_boss_abilities_0') THEN ALTER TABLE knowledge."raid_boss_abilities" ADD CONSTRAINT "fk_raid_boss_abilities_0" FOREIGN KEY ("raid_boss_id") REFERENCES knowledge."raid_bosses" ("raid_boss_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_raid_boss_abilities_0" ON knowledge."raid_boss_abilities" ("raid_boss_id", "ability_name", "ability_rank");
ALTER TABLE knowledge."raid_boss_abilities" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."raid_boss_abilities" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_boss_ability_sources_0') THEN ALTER TABLE knowledge."raid_boss_ability_sources" ADD CONSTRAINT "fk_raid_boss_ability_sources_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_boss_ability_sources_1') THEN ALTER TABLE knowledge."raid_boss_ability_sources" ADD CONSTRAINT "fk_raid_boss_ability_sources_1" FOREIGN KEY ("raid_boss_ability_id") REFERENCES knowledge."raid_boss_abilities" ("raid_boss_ability_id"); END IF; END $$;
ALTER TABLE knowledge."raid_boss_ability_sources" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."raid_boss_ability_sources" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_boss_tips_0') THEN ALTER TABLE knowledge."raid_boss_tips" ADD CONSTRAINT "fk_raid_boss_tips_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_boss_tips_1') THEN ALTER TABLE knowledge."raid_boss_tips" ADD CONSTRAINT "fk_raid_boss_tips_1" FOREIGN KEY ("raid_boss_id") REFERENCES knowledge."raid_bosses" ("raid_boss_id"); END IF; END $$;
ALTER TABLE knowledge."raid_boss_tips" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."raid_boss_tips" FROM PUBLIC, anon, authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_raid_bosses_0" ON knowledge."raid_bosses" ("name");
ALTER TABLE knowledge."raid_bosses" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."raid_bosses" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_mode_rules_0') THEN ALTER TABLE knowledge."raid_mode_rules" ADD CONSTRAINT "fk_raid_mode_rules_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_raid_mode_rules_0" ON knowledge."raid_mode_rules" ("rule_key");
ALTER TABLE knowledge."raid_mode_rules" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."raid_mode_rules" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_team_examples_0') THEN ALTER TABLE knowledge."raid_team_examples" ADD CONSTRAINT "fk_raid_team_examples_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
ALTER TABLE knowledge."raid_team_examples" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."raid_team_examples" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_raid_team_members_0') THEN ALTER TABLE knowledge."raid_team_members" ADD CONSTRAINT "fk_raid_team_members_0" FOREIGN KEY ("raid_team_example_id") REFERENCES knowledge."raid_team_examples" ("raid_team_example_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_raid_team_members_0" ON knowledge."raid_team_members" ("raid_team_example_id", "position");
ALTER TABLE knowledge."raid_team_members" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."raid_team_members" FROM PUBLIC, anon, authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sources_0" ON knowledge."sources" ("drive_file_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sources_1" ON knowledge."sources" ("filename");
ALTER TABLE knowledge."sources" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."sources" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_status_definitions_0') THEN ALTER TABLE knowledge."status_definitions" ADD CONSTRAINT "fk_status_definitions_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_status_definitions_0" ON knowledge."status_definitions" ("status_name");
ALTER TABLE knowledge."status_definitions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."status_definitions" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_strategy_team_assessments_0') THEN ALTER TABLE knowledge."strategy_team_assessments" ADD CONSTRAINT "fk_strategy_team_assessments_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_strategy_team_assessments_1') THEN ALTER TABLE knowledge."strategy_team_assessments" ADD CONSTRAINT "fk_strategy_team_assessments_1" FOREIGN KEY ("strategy_team_example_id") REFERENCES knowledge."strategy_team_examples" ("strategy_team_example_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_strategy_team_assessments_0" ON knowledge."strategy_team_assessments" ("strategy_team_example_id", "assessment_type");
ALTER TABLE knowledge."strategy_team_assessments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."strategy_team_assessments" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_strategy_team_examples_0') THEN ALTER TABLE knowledge."strategy_team_examples" ADD CONSTRAINT "fk_strategy_team_examples_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
ALTER TABLE knowledge."strategy_team_examples" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."strategy_team_examples" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_strategy_team_members_0') THEN ALTER TABLE knowledge."strategy_team_members" ADD CONSTRAINT "fk_strategy_team_members_0" FOREIGN KEY ("strategy_team_example_id") REFERENCES knowledge."strategy_team_examples" ("strategy_team_example_id"); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_strategy_team_members_0" ON knowledge."strategy_team_members" ("strategy_team_example_id", "position");
ALTER TABLE knowledge."strategy_team_members" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."strategy_team_members" FROM PUBLIC, anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trait_stat_bonuses_0') THEN ALTER TABLE knowledge."trait_stat_bonuses" ADD CONSTRAINT "fk_trait_stat_bonuses_0" FOREIGN KEY ("source_id") REFERENCES knowledge."sources" ("source_id"); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trait_stat_bonuses_1') THEN ALTER TABLE knowledge."trait_stat_bonuses" ADD CONSTRAINT "fk_trait_stat_bonuses_1" FOREIGN KEY ("trait_id") REFERENCES knowledge."champion_traits" ("trait_id"); END IF; END $$;
ALTER TABLE knowledge."trait_stat_bonuses" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge."trait_stat_bonuses" FROM PUBLIC, anon, authenticated;

-- Stable identity layer. SQLite row IDs remain attached to every imported card.
CREATE TABLE IF NOT EXISTS knowledge.characters (
  id text PRIMARY KEY,
  display_name text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.champion_variants (
  id text PRIMARY KEY,
  character_id text NOT NULL REFERENCES knowledge.characters(id),
  sqlite_champion_id bigint UNIQUE REFERENCES knowledge.champions(champion_id),
  display_name text NOT NULL,
  rarity text,
  gem_color text,
  confidence numeric(4,3) CHECK (confidence BETWEEN 0 AND 1),
  review_status text NOT NULL CHECK (review_status IN ('partial', 'complete')),
  live_status text NOT NULL CHECK (live_status IN ('live', 'announced', 'superseded'))
);
CREATE TABLE IF NOT EXISTS knowledge.factions (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  live_status text NOT NULL CHECK (live_status IN ('live', 'announced', 'superseded'))
);
CREATE TABLE IF NOT EXISTS knowledge.faction_memberships (
  variant_id text NOT NULL REFERENCES knowledge.champion_variants(id),
  faction_id text NOT NULL REFERENCES knowledge.factions(id),
  live_status text NOT NULL CHECK (live_status IN ('live', 'announced', 'superseded')),
  confidence numeric(4,3) CHECK (confidence BETWEEN 0 AND 1),
  source_id bigint REFERENCES knowledge.sources(source_id),
  PRIMARY KEY (variant_id, faction_id)
);
CREATE TABLE IF NOT EXISTS knowledge.faction_rules (
  id text PRIMARY KEY,
  faction_id text NOT NULL REFERENCES knowledge.factions(id),
  exact_text text NOT NULL,
  live_status text NOT NULL CHECK (live_status IN ('live', 'announced', 'superseded')),
  source_id bigint REFERENCES knowledge.sources(source_id),
  announced_update_id bigint REFERENCES knowledge.announced_game_updates(update_id)
);
CREATE TABLE IF NOT EXISTS knowledge.abilities (
  id text PRIMARY KEY,
  kind text NOT NULL,
  name text NOT NULL,
  variant_id text REFERENCES knowledge.champion_variants(id),
  raid_boss_id bigint REFERENCES knowledge.raid_bosses(raid_boss_id),
  source_id bigint REFERENCES knowledge.sources(source_id),
  provenance text CHECK (provenance IN ('Screenshot Verified', 'Official Current', 'Derived', 'Community/Observed')),
  confidence numeric(4,3) CHECK (confidence BETWEEN 0 AND 1),
  review_status text,
  exact_visible_text text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.ability_effects (
  id text PRIMARY KEY,
  ability_id text NOT NULL REFERENCES knowledge.abilities(id),
  effect_kind text NOT NULL,
  exact_visible_text text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.source_images (
  source_id bigint PRIMARY KEY REFERENCES knowledge.sources(source_id),
  external_id text NOT NULL,
  source_url text NOT NULL,
  original_filename text NOT NULL,
  review_status text NOT NULL,
  confidence numeric(4,3) CHECK (confidence BETWEEN 0 AND 1)
);
CREATE TABLE IF NOT EXISTS knowledge.import_runs (
  source_sha256 text PRIMARY KEY,
  source_version text NOT NULL,
  imported_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS abilities_variant_idx ON knowledge.abilities(variant_id);
CREATE INDEX IF NOT EXISTS abilities_boss_idx ON knowledge.abilities(raid_boss_id);
CREATE INDEX IF NOT EXISTS abilities_source_idx ON knowledge.abilities(source_id);
CREATE INDEX IF NOT EXISTS champion_traits_champion_idx ON knowledge.champion_traits(champion_id);
CREATE INDEX IF NOT EXISTS champion_skills_champion_idx ON knowledge.champion_skills(champion_id);
CREATE INDEX IF NOT EXISTS strategy_team_members_team_idx ON knowledge.strategy_team_members(strategy_team_example_id);

-- The source has one announced update. Preserve those records in their own
-- tables; do not promote their faction changes into live memberships/rules.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announced_live_status_check') THEN
  ALTER TABLE knowledge.announced_game_updates ADD CONSTRAINT announced_live_status_check
  CHECK (live_status IN ('announced', 'live', 'superseded')); END IF; END $$;

DO $$
DECLARE tab text;
BEGIN
  FOREACH tab IN ARRAY ARRAY['characters','champion_variants','factions','faction_memberships',
    'faction_rules','abilities','ability_effects','source_images','import_runs'] LOOP
    EXECUTE format('ALTER TABLE knowledge.%I ENABLE ROW LEVEL SECURITY', tab);
    EXECUTE format('REVOKE ALL ON knowledge.%I FROM PUBLIC, anon, authenticated', tab);
  END LOOP;
END $$;

-- Grant only the current, reviewed card directory to the browser role.
-- The knowledge schema is not in Supabase's exposed API schemas.
GRANT USAGE ON SCHEMA knowledge TO anon, authenticated;
GRANT SELECT ON knowledge.champion_variants, knowledge.factions, knowledge.faction_memberships TO anon, authenticated;
DROP POLICY IF EXISTS read_current_champion_variants ON knowledge.champion_variants;
CREATE POLICY read_current_champion_variants ON knowledge.champion_variants
  FOR SELECT TO anon, authenticated USING (live_status = 'live' AND review_status = 'complete');
DROP POLICY IF EXISTS read_live_factions ON knowledge.factions;
CREATE POLICY read_live_factions ON knowledge.factions
  FOR SELECT TO anon, authenticated USING (live_status = 'live');
DROP POLICY IF EXISTS read_live_faction_memberships ON knowledge.faction_memberships;
CREATE POLICY read_live_faction_memberships ON knowledge.faction_memberships
  FOR SELECT TO anon, authenticated USING (live_status = 'live');

-- Public browser access is limited to fixed, read-only functions. The raw
-- knowledge schema, source URLs and unreviewed records are not exposed.
CREATE OR REPLACE FUNCTION public.got_data_health()
RETURNS TABLE (
  total_champions bigint,
  total_abilities bigint,
  total_raid_bosses bigint,
  total_factions bigint,
  total_faction_memberships bigint,
  total_announced_updates bigint,
  data_version text,
  imported_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT
    (SELECT count(*) FROM knowledge.champions),
    (SELECT count(*) FROM knowledge.abilities),
    (SELECT count(*) FROM knowledge.raid_bosses),
    (SELECT count(*) FROM knowledge.factions WHERE live_status = 'live'),
    (SELECT count(*) FROM knowledge.faction_memberships WHERE live_status = 'live'),
    (SELECT count(*) FROM knowledge.announced_game_updates WHERE live_status = 'announced'),
    (SELECT source_version FROM knowledge.import_runs ORDER BY imported_at DESC LIMIT 1),
    (SELECT imported_at FROM knowledge.import_runs ORDER BY imported_at DESC LIMIT 1);
$$;
REVOKE ALL ON FUNCTION public.got_data_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_data_health() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.got_current_champions()
RETURNS TABLE (id text, display_name text, rarity text, gem_color text, faction text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT v.id, v.display_name, v.rarity, v.gem_color, f.name
  FROM knowledge.champion_variants v
  LEFT JOIN knowledge.faction_memberships fm ON fm.variant_id = v.id AND fm.live_status = 'live'
  LEFT JOIN knowledge.factions f ON f.id = fm.faction_id AND f.live_status = 'live'
  WHERE v.live_status = 'live' AND v.review_status = 'complete'
  ORDER BY v.display_name;
$$;
REVOKE ALL ON FUNCTION public.got_current_champions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_current_champions() TO anon, authenticated;
