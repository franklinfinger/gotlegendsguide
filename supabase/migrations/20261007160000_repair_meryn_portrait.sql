-- The legacy 72px Meryn crop contains damaged pixels. Retain it as a source
-- artifact and prefer this deterministic crop of the verified IMG_2242.PNG.
INSERT INTO knowledge.champion_portraits
  (id, variant_id, legacy_key, asset_path, source_script, sha256,
   source_image_id, attribution, review_state)
VALUES
  ('derived-profile-sqlite-champion-49', 'sqlite-champion-49',
   'derived:sqlite-champion-49',
   'assets/champion-portraits/derived-sqlite-champion-49.png',
   'scripts/build-derived-portraits.py',
   '4edad15444ed170cd66a6e0406568b087159f8173eac83e1135dd3569f3b0bca',
   '102242',
   'User supplied GOT: Legends game image; game art remains with its rights holder.',
   'derived_profile_center_crop');

INSERT INTO knowledge.record_evidence
  (record_kind, record_id, source_id, evidence_role, review_state)
VALUES
  ('champion_portrait', 'derived-profile-sqlite-champion-49', '102242',
   'derived_from_full_profile_screenshot', 'derived_profile_center_crop')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF (SELECT asset_path FROM knowledge.champion_portraits
      WHERE variant_id='sqlite-champion-49'
      ORDER BY (source_image_id IS NOT NULL) DESC, id LIMIT 1)
     <> 'assets/champion-portraits/derived-sqlite-champion-49.png' THEN
    RAISE EXCEPTION 'Meryn portrait preference did not select the repaired crop';
  END IF;
END $$;
