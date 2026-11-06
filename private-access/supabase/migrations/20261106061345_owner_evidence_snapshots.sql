-- LOCAL, UNAPPLIED: persist complete reviewed JSON evidence and private IDs.
-- Apply after the owner collection foundation, before any real roster writes.
-- Original screenshot image bytes are not uploaded or stored by this migration.
BEGIN;
DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM public.got_owner_roster) THEN
    RAISE EXCEPTION 'Existing roster rows need an explicitly reviewed identity backfill before this migration';
  END IF;
END $guard$;
CREATE TABLE public.got_owner_evidence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revision integer NOT NULL CHECK (revision > 0),
  payload jsonb NOT NULL CHECK ((
    jsonb_typeof(payload) = 'object'
    AND payload->>'format' = 'got-reviewed-evidence-v1'
    AND jsonb_typeof(payload->'handoff') = 'object'
    AND jsonb_typeof(payload->'identityMap') = 'array'
    AND octet_length(payload::text) <= 5242880
  ) IS TRUE)
);
ALTER TABLE public.got_owner_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.got_owner_evidence FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.got_owner_evidence FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.got_owner_evidence TO authenticated;
GRANT INSERT (user_id, revision, payload), UPDATE (revision, payload) ON public.got_owner_evidence TO authenticated;
CREATE POLICY got_owner_evidence_read ON public.got_owner_evidence FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id AND coalesce((SELECT auth.jwt())->>'is_anonymous','false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));
CREATE POLICY got_owner_evidence_insert ON public.got_owner_evidence FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND coalesce((SELECT auth.jwt())->>'is_anonymous','false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));
CREATE POLICY got_owner_evidence_update ON public.got_owner_evidence FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND coalesce((SELECT auth.jwt())->>'is_anonymous','false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())))
  WITH CHECK ((SELECT auth.uid()) = user_id AND coalesce((SELECT auth.jwt())->>'is_anonymous','false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));

CREATE TABLE public.got_owner_variants (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id text NOT NULL CHECK (length(variant_id) BETWEEN 1 AND 160),
  canonical_variant_id text REFERENCES knowledge.champion_variants(id),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 500),
  capture_date date,
  PRIMARY KEY (user_id, variant_id),
  CHECK ((canonical_variant_id IS NOT NULL AND canonical_variant_id = variant_id)
    OR (canonical_variant_id IS NULL AND variant_id LIKE 'local-verified:%'))
);
ALTER TABLE public.got_owner_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.got_owner_variants FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.got_owner_variants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.got_owner_variants TO authenticated;
CREATE POLICY got_owner_variants_read ON public.got_owner_variants FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id AND coalesce((SELECT auth.jwt())->>'is_anonymous','false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));
CREATE POLICY got_owner_variants_insert ON public.got_owner_variants FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND coalesce((SELECT auth.jwt())->>'is_anonymous','false') <> 'true'
    AND EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid())));
-- Local identities are private and never inserted into the public knowledge catalog.
ALTER TABLE public.got_owner_roster DROP CONSTRAINT got_owner_roster_variant_id_fkey;
ALTER TABLE public.got_owner_roster ADD CONSTRAINT got_owner_roster_private_variant_fkey
  FOREIGN KEY (user_id, variant_id) REFERENCES public.got_owner_variants(user_id, variant_id);
COMMIT;
