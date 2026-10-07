-- Observed community Attack profiles only; no result or champion variant inferred.
CREATE TABLE IF NOT EXISTS knowledge.community_team_examples (
  id text PRIMARY KEY,
  mode text NOT NULL,
  displayed_team_power bigint,
  leader_position integer,
  outcome text NOT NULL CHECK (outcome = 'not_shown'),
  source_id bigint NOT NULL REFERENCES knowledge.sources(source_id),
  review_state text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.community_team_members (
  example_id text NOT NULL REFERENCES knowledge.community_team_examples(id),
  position integer NOT NULL,
  observed_name text NOT NULL,
  PRIMARY KEY (example_id, position)
);
ALTER TABLE knowledge.community_team_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.community_team_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.community_team_examples, knowledge.community_team_members FROM PUBLIC, anon, authenticated;

INSERT INTO knowledge.community_team_examples (id,mode,displayed_team_power,leader_position,outcome,source_id,review_state) VALUES
  ('archive-community-attack-1387','community_attack_profile',1167971,2,'not_shown',201387,'screenshot_checked_composition_only'),
  ('archive-community-attack-1391','community_attack_profile',1131074,4,'not_shown',201391,'screenshot_checked_composition_only')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.community_team_members (example_id,position,observed_name) VALUES
  ('archive-community-attack-1387',1,'Arya Stark'),
  ('archive-community-attack-1387',2,'Sandor Clegane'),
  ('archive-community-attack-1387',3,'Jorah Mormont'),
  ('archive-community-attack-1387',4,'Daenerys Targaryen'),
  ('archive-community-attack-1387',5,'Daenerys Targaryen'),
  ('archive-community-attack-1391',1,'Khal Drogo'),
  ('archive-community-attack-1391',2,'Olenna Tyrell'),
  ('archive-community-attack-1391',3,'Jorah Mormont'),
  ('archive-community-attack-1391',4,'Nymeria Sand'),
  ('archive-community-attack-1391',5,'Daenerys Targaryen')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES
  ('community_team_example','archive-community-attack-1387',201387,'observed_composition_only','screenshot_checked_no_outcome'),
  ('community_team_example','archive-community-attack-1391',201391,'observed_composition_only','screenshot_checked_no_outcome')
ON CONFLICT DO NOTHING;
