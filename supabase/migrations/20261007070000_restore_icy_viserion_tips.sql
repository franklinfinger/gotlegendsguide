-- The original Tips and Tricks screenshots were reviewed, but their three
-- visible lines were absent from the structured Legendary Assault tip table.
-- Preserve the game's spelling of "devestating" in the exact-visible-text field.
INSERT INTO knowledge.legendary_assault_tips (id,encounter_name,exact_visible_text,review_state) VALUES
  ('icy-viserion-reinforce','Icy Viserion','Champions who REINFORCE can punish Icy Viserion by dealing bonus damage.','screenshot_verified_current'),
  ('icy-viserion-gem-teams','Icy Viserion','Strong gem teams can take advantage of Icy Viserion''s Undead Dragon trait.','screenshot_verified_current'),
  ('icy-viserion-skill-timing','Icy Viserion','Using Skills frequently will trigger his devestating Icebound attack sooner, and he is immune to most Debuffs.','screenshot_verified_current');

INSERT INTO knowledge.legendary_assault_tip_sources (tip_id,source_id)
SELECT tip.id, source.source_id
FROM (VALUES ('icy-viserion-reinforce'),('icy-viserion-gem-teams'),('icy-viserion-skill-timing')) tip(id)
CROSS JOIN (VALUES (102125),(102126),(102127)) source(source_id);

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.legendary_assault_tips WHERE encounter_name='Icy Viserion') <> 3 THEN
    RAISE EXCEPTION 'Icy Viserion must have three screenshot-backed tips';
  END IF;
  IF (SELECT count(*) FROM knowledge.legendary_assault_tip_sources WHERE tip_id LIKE 'icy-viserion-%') <> 9 THEN
    RAISE EXCEPTION 'Icy Viserion tip provenance is incomplete';
  END IF;
END $$;
