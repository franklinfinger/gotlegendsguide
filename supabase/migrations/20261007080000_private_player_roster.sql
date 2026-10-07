-- Phase 5: private, exact-variant player roster. auth.users is the profile identity.
CREATE TABLE IF NOT EXISTS public.player_roster (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id text NOT NULL REFERENCES knowledge.champion_variants(id),
  owned boolean NOT NULL DEFAULT true,
  level integer CHECK (level IS NULL OR level >= 1),
  stars integer CHECK (stars IS NULL OR stars >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, variant_id)
);

CREATE OR REPLACE FUNCTION public.touch_player_roster_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS touch_player_roster_updated_at ON public.player_roster;
CREATE TRIGGER touch_player_roster_updated_at
BEFORE UPDATE ON public.player_roster
FOR EACH ROW EXECUTE FUNCTION public.touch_player_roster_updated_at();

ALTER TABLE public.player_roster ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.player_roster FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_roster TO authenticated;

DROP POLICY IF EXISTS player_roster_select_own ON public.player_roster;
CREATE POLICY player_roster_select_own ON public.player_roster
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS player_roster_insert_own ON public.player_roster;
CREATE POLICY player_roster_insert_own ON public.player_roster
FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS player_roster_update_own ON public.player_roster;
CREATE POLICY player_roster_update_own ON public.player_roster
FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS player_roster_delete_own ON public.player_roster;
CREATE POLICY player_roster_delete_own ON public.player_roster
FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
