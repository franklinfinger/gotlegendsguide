-- Read-only Raid team evidence. Activation thresholds below are visible on
-- the cited current faction screens; other factions have no confirmed count.
CREATE OR REPLACE FUNCTION public.got_raid_synergy_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'factionActivations', (SELECT jsonb_agg(jsonb_build_object(
      'factionId', f.id, 'factionName', f.name, 'requiredMembers', 3,
      'sourceId', evidence.source_id
    ) ORDER BY f.name)
      FROM (VALUES
        ('sqlite-faction-537461726b',102772),
        ('sqlite-faction-426172617468656f6e',102773),
        ('sqlite-faction-54617267617279656e',102580),
        ('audit-faction-bolton',102776)
      ) AS evidence(faction_id,source_id)
      JOIN knowledge.factions f ON f.id=evidence.faction_id AND f.live_status='live'),
    'allyGems', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'ownerName', a.owner_name_candidate,
      'allyName', a.ally_name_candidate, 'gemName', a.gem_title_candidate,
      'relationship', a.relationship, 'replacesPowerUp', a.replaces_power_up,
      'effect', a.exact_visible_effect, 'reviewState', a.review_state,
      'currentnessState', a.currentness_state, 'sourceId', a.source_id
    ) ORDER BY a.id), '[]'::jsonb)
      FROM knowledge.ally_gem_cards a
      WHERE a.review_state='visually_verified' AND a.exact_visible_effect IS NOT NULL)
  );
$$;

REVOKE ALL ON FUNCTION public.got_raid_synergy_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_raid_synergy_data() TO anon, authenticated;

DO $$
DECLARE payload jsonb;
BEGIN
  payload := public.got_raid_synergy_data();
  IF jsonb_array_length(payload->'factionActivations') <> 4 THEN RAISE EXCEPTION 'Expected four sourced faction thresholds'; END IF;
  IF jsonb_array_length(payload->'allyGems') <> 20 THEN RAISE EXCEPTION 'Expected twenty verified ally cards'; END IF;
END $$;
