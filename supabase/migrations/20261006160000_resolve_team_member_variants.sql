-- Expand resolution states for source-backed canonical-name and gem-color matches.
ALTER TABLE knowledge.team_member_variant_links
  DROP CONSTRAINT IF EXISTS team_member_variant_links_resolution_state_check;
ALTER TABLE knowledge.team_member_variant_links
  ADD CONSTRAINT team_member_variant_links_resolution_state_check
  CHECK (resolution_state IN ('exact_name', 'exact_name_and_gem_color', 'unique_canonical_name', 'unresolved_name'));
ALTER TABLE knowledge.team_member_variant_links
  DROP CONSTRAINT IF EXISTS team_member_variant_links_check;
ALTER TABLE knowledge.team_member_variant_links
  ADD CONSTRAINT team_member_variant_links_check
  CHECK ((resolution_state = 'unresolved_name') = (variant_id IS NULL));

UPDATE knowledge.team_member_variant_links SET
  variant_id='sqlite-champion-11', resolution_state='exact_name_and_gem_color'
WHERE member_kind='strategy' AND member_id=40 AND original_champion_name='Daenerys Targaryen' AND source_id=612;
UPDATE knowledge.team_member_variant_links SET
  variant_id='sqlite-champion-24', resolution_state='unique_canonical_name'
WHERE member_kind='strategy' AND member_id=46 AND original_champion_name='Arya Stark' AND source_id=614;
UPDATE knowledge.team_member_variant_links SET
  variant_id='sqlite-champion-6', resolution_state='exact_name_and_gem_color'
WHERE member_kind='strategy' AND member_id=57 AND original_champion_name='Daenerys Targaryen' AND source_id=616;
UPDATE knowledge.team_member_variant_links SET
  variant_id='sqlite-champion-19', resolution_state='exact_name_and_gem_color'
WHERE member_kind='strategy' AND member_id=58 AND original_champion_name='Daenerys Targaryen' AND source_id=616;

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.team_member_variant_links WHERE member_kind='strategy' AND member_id IN (40,46,57,58) AND variant_id IS NOT NULL) <> 4 THEN
    RAISE EXCEPTION 'Expected four team member variant resolutions';
  END IF;
END $$;
