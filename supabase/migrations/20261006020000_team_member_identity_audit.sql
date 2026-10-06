-- Resolve only exact, unique champion identities in observed team screenshots.
-- Unmatched labels stay visible as source text, with no guessed variant.
CREATE TABLE IF NOT EXISTS knowledge.team_member_variant_links (
  member_kind text NOT NULL CHECK (member_kind IN ('strategy', 'raid')),
  member_id bigint NOT NULL,
  original_champion_name text NOT NULL,
  variant_id text REFERENCES knowledge.champion_variants(id),
  resolution_state text NOT NULL CHECK (resolution_state IN ('exact_name', 'unresolved_name')),
  source_id bigint NOT NULL REFERENCES knowledge.sources(source_id),
  PRIMARY KEY (member_kind, member_id),
  CHECK ((resolution_state = 'exact_name') = (variant_id IS NOT NULL))
);

ALTER TABLE knowledge.team_member_variant_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.team_member_variant_links FROM PUBLIC, anon, authenticated;
