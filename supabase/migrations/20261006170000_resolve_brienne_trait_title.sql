-- Complete the title visible on four accessible Brienne True Knight trait screens.
UPDATE knowledge.champion_traits
SET trait_name='Stand Your Ground!', completion_state='complete'
WHERE trait_id=109 AND trait_name='[Trait name not visible]';

UPDATE knowledge.abilities
SET name='Stand Your Ground!', review_status='complete', provenance='Screenshot Verified'
WHERE id='sqlite-champion_traits-109';

INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES
  ('champion_trait','109',102436,'visible_trait_title','visually_verified_title'),
  ('champion_trait','109',102437,'visible_trait_title','visually_verified_title'),
  ('champion_trait','109',102768,'visible_trait_title','visually_verified_title'),
  ('champion_trait','109',102769,'visible_trait_title','visually_verified_title')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM knowledge.champion_traits WHERE trait_id=109 AND trait_name='Stand Your Ground!' AND completion_state='complete') THEN
    RAISE EXCEPTION 'Brienne trait title was not completed';
  END IF;
END $$;
