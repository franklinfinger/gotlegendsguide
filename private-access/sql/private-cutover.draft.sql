-- DRAFT: NEVER run against the hosted project without explicit private-cutover
-- approval and a tested authenticated frontend. This closes the public API.
-- Original data/functions are preserved, and all eight known read endpoints
-- (including preview endpoints) become owner-only. No private roster is seeded.
-- Rerunning intentionally fails rather than silently guessing existing state.
BEGIN;
DO $preflight$
DECLARE names text[] := ARRAY[
  'got_current_champions','got_data_health','got_guide_data',
  'got_guide_data_preview','got_raid_synergy_data',
  'got_raid_synergy_data_preview','got_strategy_data','got_strategy_data_preview'];
BEGIN
  IF (SELECT count(*) FROM public.got_owner_access) <> 1 THEN
    RAISE EXCEPTION 'Exactly one approved app owner must exist before cutover';
  END IF;
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname = ANY(names) AND p.pronargs=0) <> 8 THEN
    RAISE EXCEPTION 'Expected eight no-argument guide RPCs; re-audit before cutover';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname LIKE 'got\_%' ESCAPE '\'
        AND (NOT (p.proname = ANY(names)) OR p.pronargs <> 0)) THEN
    RAISE EXCEPTION 'Unexpected GOT RPC exists; re-audit before cutover';
  END IF;
END $preflight$;

-- The original public model also grants direct knowledge-schema access.
-- Revoke the schema AND its objects; changing RPC grants alone is insufficient.
-- Privileged curated functions still read these tables as their trusted owner.
REVOKE ALL ON SCHEMA knowledge FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA knowledge FROM PUBLIC, anon, authenticated;
-- Table-level REVOKE does not remove separately granted column privileges.
DO $columns$
DECLARE entry record;
BEGIN
  FOR entry IN SELECT c.relname, string_agg(quote_ident(a.attname), ',') AS columns
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
    WHERE n.nspname='knowledge' AND c.relkind IN ('r','p','v','m','f') GROUP BY c.relname
  LOOP
    EXECUTE format('REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON knowledge.%I FROM PUBLIC, anon, authenticated', entry.columns, entry.columns, entry.columns, entry.columns, entry.relname);
  END LOOP;
END $columns$;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA knowledge FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA knowledge FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS read_current_champion_variants ON knowledge.champion_variants;
-- Other legacy public-read policies are removed dynamically after permissions
-- are revoked, including grants inherited through PUBLIC or future equivalents.
DO $policies$
DECLARE entry record;
BEGIN
  FOR entry IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='knowledge'
      AND (roles && ARRAY['public','anon','authenticated']::name[])
  LOOP
    EXECUTE format('DROP POLICY %I ON knowledge.%I', entry.policyname, entry.tablename);
  END LOOP;
END $policies$;
-- Default privileges are owner-specific. Harden each current object owner's
-- defaults and the migration executor's defaults, not just existing tables.
DO $defaults$
DECLARE owner_name text;
BEGIN
  FOR owner_name IN SELECT DISTINCT r.rolname FROM pg_roles r WHERE r.oid IN (
    SELECT c.relowner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='knowledge'
    UNION SELECT p.proowner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='knowledge'
    UNION SELECT current_user::regrole::oid)
  LOOP
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA knowledge REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated', owner_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA knowledge REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated', owner_name);
    -- PUBLIC execute is a global default; schema-level REVOKE cannot undo it.
    -- Existing and future knowledge functions remain blocked by schema USAGE.
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA knowledge REVOKE ALL ON FUNCTIONS FROM anon, authenticated', owner_name);
  END LOOP;
END $defaults$;

CREATE SCHEMA got_private_sources;
CREATE SCHEMA got_private_api;
REVOKE ALL ON SCHEMA got_private_sources, got_private_api FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA got_private_api TO authenticated;

DO $wrap$
DECLARE
  entry record;
  body text;
  return_statement text;
BEGIN
  FOR entry IN SELECT p.proname, pg_get_function_result(p.oid) AS result_type, p.proretset
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.pronargs=0 AND p.proname = ANY(ARRAY[
        'got_current_champions','got_data_health','got_guide_data',
        'got_guide_data_preview','got_raid_synergy_data',
        'got_raid_synergy_data_preview','got_strategy_data','got_strategy_data_preview'])
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I() SET SCHEMA got_private_sources', entry.proname);
    EXECUTE format('REVOKE ALL ON FUNCTION got_private_sources.%I() FROM PUBLIC, anon, authenticated', entry.proname);
    return_statement := CASE WHEN entry.proretset
      THEN format('RETURN QUERY SELECT * FROM got_private_sources.%I();', entry.proname)
      ELSE format('RETURN got_private_sources.%I();', entry.proname) END;
    body := 'BEGIN
      IF (SELECT auth.uid()) IS NULL
        OR coalesce((SELECT auth.jwt())->>''is_anonymous'', ''false'') = ''true''
        OR NOT EXISTS (SELECT 1 FROM public.got_owner_access a WHERE a.user_id = (SELECT auth.uid()))
      THEN RAISE EXCEPTION ''Private guide access required'' USING ERRCODE = ''42501'';
      END IF;
      ' || return_statement || '
    END';
    -- The only elevated wrapper is non-exposed, has an explicit owner check,
    -- and a fixed empty search_path. It needs elevation to read the curated
    -- knowledge through the original privileged functions without table grants.
    EXECUTE format('CREATE FUNCTION got_private_api.%I() RETURNS %s LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = %L AS %L', entry.proname, entry.result_type, '', body);
    EXECUTE format('REVOKE ALL ON FUNCTION got_private_api.%I() FROM PUBLIC, anon, authenticated', entry.proname);
    EXECUTE format('GRANT EXECUTE ON FUNCTION got_private_api.%I() TO authenticated', entry.proname);
    -- Exposed functions do not run with elevated privileges themselves.
    EXECUTE format('CREATE FUNCTION public.%I() RETURNS %s LANGUAGE sql STABLE SECURITY INVOKER SET search_path = %L AS %L', entry.proname, entry.result_type, '', format('SELECT * FROM got_private_api.%I()', entry.proname));
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I() FROM PUBLIC, anon, authenticated', entry.proname);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I() TO authenticated', entry.proname);
  END LOOP;
END $wrap$;
DO $verify$
BEGIN
  IF has_schema_privilege('anon','knowledge','USAGE') OR has_schema_privilege('authenticated','knowledge','USAGE') THEN
    RAISE EXCEPTION 'Inherited knowledge access remains; inspect role grants before cutover';
  END IF;
END $verify$;
-- Neither got_private_sources nor got_private_api may be added to exposed schemas.
-- Check PostgREST schema settings and refresh its schema cache during deployment.
COMMIT;
