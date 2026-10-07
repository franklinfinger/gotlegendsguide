-- Complete three original trait titles visible in accessible Drive screenshots.
UPDATE knowledge.champion_traits SET trait_name='This Is My Army II'
WHERE trait_id=8 AND trait_name='[trait title not visible in source]';
UPDATE knowledge.abilities SET name='This Is My Army II', provenance='Screenshot Verified'
WHERE id='sqlite-champion_traits-8';

UPDATE knowledge.champion_traits SET trait_name='Never Known Bells To Mean Surrender II'
WHERE trait_id=12 AND trait_name='[trait title not visible in source]';
UPDATE knowledge.abilities SET name='Never Known Bells To Mean Surrender II', provenance='Screenshot Verified'
WHERE id='sqlite-champion_traits-12';

UPDATE knowledge.champion_traits SET trait_name='The Queen That Never Was II'
WHERE trait_id=14 AND trait_name='[trait title not visible in source]';
UPDATE knowledge.abilities SET name='The Queen That Never Was II', provenance='Screenshot Verified'
WHERE id='sqlite-champion_traits-14';

INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES
  ('champion_trait','8',102457,'visible_trait_title','visually_verified_title'),
  ('champion_trait','8',102467,'visible_trait_title','visually_verified_title'),
  ('champion_trait','12',102464,'visible_trait_title','visually_verified_title'),
  ('champion_trait','12',102475,'visible_trait_title','visually_verified_title'),
  ('champion_trait','12',102476,'visible_trait_title','visually_verified_title'),
  ('champion_trait','14',102480,'visible_trait_title','visually_verified_title')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.champion_traits WHERE trait_id IN (8,12,14) AND trait_name NOT LIKE '[%') <> 3 THEN
    RAISE EXCEPTION 'Expected three resolved original trait titles';
  END IF;
END $$;
