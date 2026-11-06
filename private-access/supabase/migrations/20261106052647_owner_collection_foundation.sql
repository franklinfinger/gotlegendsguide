-- LOCAL FOUNDATION ONLY. Not applied to the hosted project.
-- Additive and fail-closed: does not change existing public guide functions.
-- Do not seed an email, password, Auth user, or owner ID in a repository.
BEGIN;

CREATE TABLE public.got_owner_access (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.got_owner_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.got_owner_access FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.got_owner_access FROM PUBLIC, anon, authenticated;
GRANT SELECT (user_id) ON public.got_owner_access TO authenticated;
CREATE POLICY got_owner_access_read_self ON public.got_owner_access
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id
    AND coalesce((SELECT auth.jwt())->>'is_anonymous', 'false') <> 'true');

CREATE TABLE public.got_owner_roster (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id text NOT NULL REFERENCES knowledge.champion_variants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, variant_id)
);
ALTER TABLE public.got_owner_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.got_owner_roster FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.got_owner_roster FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.got_owner_roster TO authenticated;
GRANT INSERT (user_id, variant_id) ON public.got_owner_roster TO authenticated;
GRANT DELETE ON public.got_owner_roster TO authenticated;
-- No UPDATE: a roster entry is presence/absence, not a progression tracker.
-- Ownership cannot be reassigned; existing entries cannot have their IDs altered.
CREATE POLICY got_owner_roster_read ON public.got_owner_roster
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id
    AND coalesce((SELECT auth.jwt())->>'is_anonymous', 'false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));
CREATE POLICY got_owner_roster_add ON public.got_owner_roster
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id
    AND coalesce((SELECT auth.jwt())->>'is_anonymous', 'false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));
CREATE POLICY got_owner_roster_remove ON public.got_owner_roster
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id
    AND coalesce((SELECT auth.jwt())->>'is_anonymous', 'false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));
COMMIT;
