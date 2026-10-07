-- Run as postgres on the linked project. All test identities and rows roll back.
BEGIN;
INSERT INTO auth.users (id, instance_id, aud, role, email, created_at, updated_at) VALUES
('00000000-0000-4000-8000-000000000a51','00000000-0000-0000-0000-000000000000','authenticated','authenticated','roster-rls-a@example.invalid',now(),now()),
('00000000-0000-4000-8000-000000000a52','00000000-0000-0000-0000-000000000000','authenticated','authenticated','roster-rls-b@example.invalid',now(),now());
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-000000000a51';
INSERT INTO public.player_roster (user_id,variant_id,owned,level,stars)
VALUES ('00000000-0000-4000-8000-000000000a51','sqlite-champion-48',true,12,3);
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-000000000a52';
INSERT INTO public.player_roster (user_id,variant_id,owned)
VALUES ('00000000-0000-4000-8000-000000000a52','sqlite-champion-48',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.player_roster) <> 1 THEN RAISE EXCEPTION 'Cross-user read visible'; END IF;
  UPDATE public.player_roster SET stars=5 WHERE user_id='00000000-0000-4000-8000-000000000a51';
  IF FOUND THEN RAISE EXCEPTION 'Cross-user update allowed'; END IF;
  DELETE FROM public.player_roster WHERE user_id='00000000-0000-4000-8000-000000000a51';
  IF FOUND THEN RAISE EXCEPTION 'Cross-user delete allowed'; END IF;
  BEGIN
    INSERT INTO public.player_roster (user_id,variant_id,owned)
    VALUES ('00000000-0000-4000-8000-000000000a51','sqlite-champion-54',true);
    RAISE EXCEPTION 'Cross-user insert allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.player_roster SET user_id='00000000-0000-4000-8000-000000000a51'
    WHERE user_id='00000000-0000-4000-8000-000000000a52';
    RAISE EXCEPTION 'Cross-user ownership transfer allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;
