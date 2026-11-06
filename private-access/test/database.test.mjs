import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const foundation = fs.readFileSync(new URL('../supabase/migrations/20261106052647_owner_collection_foundation.sql', import.meta.url), 'utf8');
const cutover = fs.readFileSync(new URL('../sql/private-cutover.draft.sql', import.meta.url), 'utf8');
const evidenceMigration = fs.readFileSync(new URL('../supabase/migrations/20261106061345_owner_evidence_snapshots.sql', import.meta.url), 'utf8');
const names = ['got_current_champions','got_data_health','got_guide_data','got_guide_data_preview','got_raid_synergy_data','got_raid_synergy_data_preview','got_strategy_data','got_strategy_data_preview'];
async function setup() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE SCHEMA knowledge;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    INSERT INTO auth.users VALUES ('${owner}'), ('${other}');
    CREATE TABLE knowledge.champion_variants(id text PRIMARY KEY);
    INSERT INTO knowledge.champion_variants VALUES ('v1'),('v2');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, anon;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated, anon;
  `);
  await db.exec(foundation);
  return db;
}
async function identity(db, id, role = 'authenticated', anonymous = false) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${id || ''}', false); SELECT set_config('request.jwt.claims', '${JSON.stringify({is_anonymous: anonymous})}', false); SET ROLE ${role};`);
}
const denied = async (db, sql) => assert.rejects(db.query(sql), error => ['42501','23503','23505','23514'].includes(error.code));
test('foundation is fail-closed before owner provisioning; anon and foreign users cannot read/write', async () => {
  const db = await setup();
  try {
    await identity(db, owner);
    assert.equal((await db.query('SELECT * FROM public.got_owner_roster')).rows.length, 0);
    await denied(db, `INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v1')`);
    await identity(db, null, 'anon');
    await denied(db, 'SELECT * FROM public.got_owner_roster');
    await denied(db, 'SELECT user_id FROM public.got_owner_access');
    await db.exec(`RESET ROLE; INSERT INTO public.got_owner_access(user_id) VALUES ('${owner}')`);
    await identity(db, other);
    assert.equal((await db.query('SELECT user_id FROM public.got_owner_access')).rows.length, 0);
    await denied(db, `INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${other}','v1')`);
    await denied(db, `INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v1')`);
  } finally { await db.close(); }
});
test('only the provisioned owner can add/read/remove exact variants; privileges cannot be expanded', async () => {
  const db = await setup();
  try {
    await db.exec(`INSERT INTO public.got_owner_access(user_id) VALUES ('${owner}')`);
    await identity(db, owner);
    await db.query(`INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v1') ON CONFLICT(user_id,variant_id) DO NOTHING`);
    await db.query(`INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v1') ON CONFLICT(user_id,variant_id) DO NOTHING`);
    assert.equal((await db.query('SELECT * FROM public.got_owner_roster')).rows.length, 1);
    await denied(db, `INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${other}','v2')`);
    await denied(db, `INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','unknown-variant')`);
    await denied(db, `UPDATE public.got_owner_roster SET user_id='${other}'`);
    await denied(db, `INSERT INTO public.got_owner_access(user_id) VALUES ('${other}')`);
    await denied(db, `DELETE FROM public.got_owner_access`);
    await identity(db, other);
    assert.equal((await db.query('SELECT * FROM public.got_owner_roster')).rows.length, 0);
    assert.equal((await db.query('DELETE FROM public.got_owner_roster RETURNING *')).rows.length, 0);
    await identity(db, owner, 'authenticated', true);
    assert.equal((await db.query('SELECT * FROM public.got_owner_roster')).rows.length, 0);
    await denied(db, `INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v2')`);
    await identity(db, owner);
    await db.query('DELETE FROM public.got_owner_roster');
    assert.equal((await db.query('SELECT * FROM public.got_owner_roster')).rows.length, 0);
  } finally { await db.close(); }
});
test('revoking owner membership immediately closes RLS without waiting for JWT expiration', async () => {
  const db = await setup();
  try {
    await db.exec(`INSERT INTO public.got_owner_access(user_id) VALUES ('${owner}'); INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v1'); DELETE FROM public.got_owner_access`);
    await identity(db, owner);
    assert.equal((await db.query('SELECT * FROM public.got_owner_roster')).rows.length, 0);
    await denied(db, `INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v2')`);
  } finally { await db.close(); }
});
test('only one owner can be provisioned', async () => {
  const db = await setup();
  try {
    await db.exec(`INSERT INTO public.got_owner_access(user_id) VALUES ('${owner}')`);
    await denied(db, `INSERT INTO public.got_owner_access(user_id) VALUES ('${other}')`);
  } finally { await db.close(); }
});
test('draft cutover blocks all 8 public RPCs, private source calls and non-owner/anonymous bypasses', async () => {
  const db = await setup();
  try {
    await db.exec(evidenceMigration);
    await db.exec(`INSERT INTO public.got_owner_access(user_id) VALUES ('${owner}')`);
    for (const name of names) {
      const table = ['got_data_health','got_current_champions'].includes(name);
      await db.exec(`CREATE FUNCTION public.${name}() RETURNS ${table ? 'TABLE(id text)' : 'jsonb'} LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT ${table ? "'sample'::text" : "'{\"sample\":true}'::jsonb"} $$; GRANT EXECUTE ON FUNCTION public.${name}() TO anon,authenticated;`);
    }
    // Reproduce the real legacy direct-read grants, not only the RPCs.
    await db.exec(`CREATE TABLE knowledge.factions(id text); INSERT INTO knowledge.factions VALUES ('f1');
      CREATE TABLE knowledge.faction_memberships(id text); INSERT INTO knowledge.faction_memberships VALUES ('m1');
      GRANT USAGE ON SCHEMA knowledge TO anon,authenticated;
      GRANT SELECT ON ALL TABLES IN SCHEMA knowledge TO anon,authenticated;
      GRANT SELECT(id) ON knowledge.champion_variants TO anon;
      ALTER TABLE knowledge.champion_variants ENABLE ROW LEVEL SECURITY;
      CREATE POLICY read_current_champion_variants ON knowledge.champion_variants FOR SELECT TO anon,authenticated USING (true);
      CREATE OR REPLACE FUNCTION public.got_guide_data() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT jsonb_build_object('count',(SELECT count(*) FROM knowledge.champion_variants)) $$;`);
    await identity(db,null,'anon');
    assert.equal((await db.query('SELECT * FROM knowledge.champion_variants')).rows.length,2);
    await db.exec('RESET ROLE');
    await db.exec(cutover);
    for (const role of ['anon','authenticated']) {
      await identity(db,role==='anon'?null:owner,role);
      for (const table of ['champion_variants','factions','faction_memberships']) await denied(db,`SELECT * FROM knowledge.${table}`);
    }
    await db.exec('RESET ROLE');
    const privilege=await db.query("SELECT has_column_privilege('anon','knowledge.champion_variants','id','SELECT') AS allowed");
    assert.equal(privilege.rows[0].allowed,false);
    for (const name of names) {
      await identity(db, owner);
      assert.equal((await db.query(`SELECT * FROM public.${name}()`)).rows.length, 1);
      await denied(db, `SELECT * FROM got_private_sources.${name}()`);
      await identity(db, other);
      await denied(db, `SELECT * FROM public.${name}()`);
      await denied(db, `SELECT * FROM got_private_api.${name}()`);
      await identity(db, owner, 'authenticated', true);
      await denied(db, `SELECT * FROM public.${name}()`);
      await identity(db, null, 'anon');
      await denied(db, `SELECT * FROM public.${name}()`);
    }
    await identity(db,owner);
    await db.query(`INSERT INTO public.got_owner_variants(user_id,variant_id,canonical_variant_id,display_name) VALUES ('${owner}','v1','v1','Canonical V1')`);
    await db.query(`INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','v1')`);
    assert.equal((await db.query('SELECT * FROM public.got_owner_roster')).rows.length,1);
    await db.exec('RESET ROLE; DELETE FROM public.got_owner_access');
    await identity(db, owner);
    await denied(db, 'SELECT * FROM public.got_guide_data()');
  } finally { await db.close(); }
});


test('complete private evidence survives reads, CAS rejects stale replacement, and local IDs stay private', async () => {
  const db = await setup();
  const payload = {format:'got-reviewed-evidence-v1',handoff:{capture_date:'2026-11-04',full_source_text:'Verbatim skill, trait and tooltip evidence',source_identity:'synthetic-file'},identityMap:[{variantId:'local-verified:exact-private-variant',championName:'Private',exactVariant:'Exact'}]};
  try {
    await db.exec(evidenceMigration);
    await db.exec(`INSERT INTO public.got_owner_access(user_id) VALUES ('${owner}')`);
    await identity(db,owner);
    await db.query('INSERT INTO public.got_owner_evidence(user_id,revision,payload) VALUES ($1,1,$2)',[owner,JSON.stringify(payload)]);
    assert.deepEqual((await db.query('SELECT payload FROM public.got_owner_evidence')).rows[0].payload,payload);
    const updated=await db.query('UPDATE public.got_owner_evidence SET revision=2,payload=$1 WHERE user_id=$2 AND revision=1 RETURNING revision',[JSON.stringify(payload),owner]);
    assert.equal(updated.rows[0].revision,2);
    const stale=await db.query('UPDATE public.got_owner_evidence SET revision=2,payload=$1 WHERE user_id=$2 AND revision=1 RETURNING revision',[JSON.stringify({...payload,handoff:{overwrite:'stale'}}),owner]);
    assert.equal(stale.rows.length,0);
    assert.deepEqual((await db.query('SELECT payload FROM public.got_owner_evidence')).rows[0].payload,payload);
    await db.query(`INSERT INTO public.got_owner_variants(user_id,variant_id,display_name) VALUES ('${owner}','local-verified:exact-private-variant','Private — Exact')`);
    await db.query(`INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','local-verified:exact-private-variant')`);
    assert.equal((await db.query('SELECT variant_id FROM public.got_owner_roster')).rows[0].variant_id,'local-verified:exact-private-variant');
    await denied(db,`INSERT INTO public.got_owner_roster(user_id,variant_id) VALUES ('${owner}','local-verified:unregistered')`);
    await denied(db,`UPDATE public.got_owner_evidence SET user_id='${other}'`);
    await denied(db,'DELETE FROM public.got_owner_evidence');
    await denied(db,`UPDATE public.got_owner_evidence SET payload='{}'::jsonb`);
    for(const [id,role,anonymous] of [[other,'authenticated',false],[null,'anon',false],[owner,'authenticated',true]]) {
      await identity(db,id,role,anonymous);
      if(role==='anon') { await denied(db,'SELECT * FROM public.got_owner_evidence'); await denied(db,'SELECT * FROM public.got_owner_variants'); }
      else {
        assert.equal((await db.query('SELECT * FROM public.got_owner_evidence')).rows.length,0);
        assert.equal((await db.query('SELECT * FROM public.got_owner_variants')).rows.length,0);
        assert.equal((await db.query('UPDATE public.got_owner_evidence SET revision=3 RETURNING revision')).rows.length,0);
      }
    }
    await db.exec('RESET ROLE');
    assert.equal((await db.query("SELECT count(*)::integer AS count FROM knowledge.champion_variants WHERE id LIKE 'local-verified:%'")).rows[0].count,0);
    await db.exec('DELETE FROM public.got_owner_access');
    await identity(db,owner);
    assert.equal((await db.query('SELECT * FROM public.got_owner_evidence')).rows.length,0);
    assert.equal((await db.query('SELECT * FROM public.got_owner_variants')).rows.length,0);
  } finally { await db.close(); }
});
