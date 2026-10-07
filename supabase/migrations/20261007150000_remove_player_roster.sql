-- Product correction: remove only the Phase 5 private roster objects.
-- Preserve any unexpected player data for manual review instead of deleting it.
DO $$
BEGIN
  IF to_regclass('public.player_roster') IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.player_roster LIMIT 1) THEN
    RAISE EXCEPTION 'player_roster is not empty; review its rows before removal';
  END IF;
END $$;

DROP TABLE IF EXISTS public.player_roster;
DROP FUNCTION IF EXISTS public.touch_player_roster_updated_at();
