import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerStore, validateConfiguration, OWNER_TABLE, EVIDENCE_TABLE, VARIANT_TABLE } from '../src/client.js';
const config = { enabled: true, url: 'http://127.0.0.1:54321', publishableKey: 'sb_publishable_test' };
function fake({ owner = true, user = { id: 'owner', is_anonymous: false }, readError = false } = {}) {
  const calls = []; const rows = new Set(); let options; let listener;
  const sdk = {
    auth: {
      getUser: async () => ({ data: { user } }),
      signInWithPassword: async credentials => { calls.push(['login', credentials.email]); return { data: { user } }; },
      signOut: async opts => { calls.push(['logout', opts]); return {}; },
      onAuthStateChange: fn => { listener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
    },
    rpc: async name => { calls.push(['rpc', name]); return { data: { champions: [{ id: 'v1', name: 'Variant' }] } }; },
    from: name => {
      const filters = {}; let action = 'select'; let input;
      const run = () => {
        calls.push([name, action]);
        if (readError) return { error: { message: 'network' } };
        if (name === OWNER_TABLE) return { data: owner ? { user_id: user.id } : null };
        if (name === EVIDENCE_TABLE) return { data: null };
        if (name === VARIANT_TABLE) return { data: [] };
        if (action === 'upsert') rows.add(input.variant_id);
        if (action === 'delete') rows.delete(filters.variant_id);
        return { data: filters.variant_id ? (rows.has(filters.variant_id) ? { variant_id: filters.variant_id } : null) : [...rows].map(variant_id => ({ variant_id })) };
      };
      const chain = {
        select() { return chain; },
        eq(key, value) { filters[key] = value; return chain; },
        order() { return chain; },
        maybeSingle() { return Promise.resolve(run()); },
        upsert(value, opts) { input = value; action = 'upsert'; calls.push(['upsert-options', opts]); return chain; },
        delete() { action = 'delete'; return chain; },
        then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
      }; return chain;
    },
  };
  const store = createOwnerStore({ config, createClient: (url, key, opts) => { options = opts; return sdk; } });
  return { store, calls, rows, sdk, options, emit: value => listener(value) };
}
test('disabled preview creates no client or connection', () => {
  assert.deepEqual(createOwnerStore({ config: {}, createClient() { throw new Error('must not run'); } }), { enabled: false });
});
test('configuration rejects hosted-by-default, secrets and URL credentials', () => {
  assert.throws(() => validateConfiguration({ ...config, url: 'https://example.supabase.co' }), /Hosted access/);
  assert.throws(() => validateConfiguration({ ...config, publishableKey: 'sb_secret_test' }), /publishable key/);
  assert.throws(() => validateConfiguration({ ...config, publishableKey: 'eyJ.service-role.jwt' }), /publishable key/);
  assert.throws(() => validateConfiguration({ ...config, url: 'http://name:password@localhost:54321' }), /without credentials/);
  assert.throws(() => validateConfiguration({ ...config, url: 'http://example.com', allowHosted: true }), /Hosted access/);
  assert.equal(validateConfiguration({ ...config, url: 'https://example.supabase.co', allowHosted: true }).url, 'https://example.supabase.co');
});
test('saved SDK session with refresh; URL tokens never auto-consumed', () => {
  const { options } = fake();
  assert.equal(options.auth.persistSession, true); assert.equal(options.auth.autoRefreshToken, true);
  assert.equal(options.auth.detectSessionInUrl, false);
});
test('non-owner and anonymous identities cannot trigger guide or roster queries', async () => {
  for (const settings of [{ owner: false }, { user: { id: 'owner', is_anonymous: true } }]) {
    const { store, calls } = fake(settings);
    await assert.rejects(store.readCollection(), error => error.code === 'not_owner');
    assert.equal(calls.some(row => row[0] === 'rpc' || row[0] === 'got_owner_roster'), false);
  }
});
test('access errors fail closed instead of falling back to public data', async () => {
  const { store, calls } = fake({ readError: true });
  await assert.rejects(store.readCollection(), error => error.code === 'access_unavailable');
  assert.equal(calls.some(row => row[0] === 'rpc'), false);
});
test('per-variant add, idempotent duplicate add, readback and remove preserve other variants', async () => {
  const { store, rows, calls } = fake();
  rows.add('other');
  await store.setOwned('v1', true); await store.setOwned('v1', true);
  assert.deepEqual(new Set((await store.readCollection()).variantIds), new Set(['v1', 'other']));
  await store.setOwned('v1', false);
  assert.deepEqual([...rows], ['other']);
  assert.deepEqual(calls.find(row => row[0] === 'upsert-options')[1], { onConflict: 'user_id,variant_id', ignoreDuplicates: true });
});
test('invalid variant or nonboolean state never writes', async () => {
  const { store, calls } = fake();
  await assert.rejects(store.setOwned('', true)); await assert.rejects(store.setOwned('v1', 'true'));
  assert.equal(calls.length, 0);
});
test('password sign in is used; local sign out keeps other devices signed in', async () => {
  const { store, calls } = fake();
  await store.signIn(' user@example.test ', 'not-real');
  assert.deepEqual(calls[0], ['login', 'user@example.test']);
  await store.signOut();
  assert.deepEqual(calls.at(-1), ['logout', { scope: 'local' }]);
  await assert.rejects(store.readCollection(), error => error.code === 'signed_out');
});
test('sign-out invalidates an in-flight read before any roster data returns', async () => {
  const { store, sdk, calls } = fake(); let release;
  sdk.auth.getUser = () => new Promise(resolve => { release = resolve; });
  const pending = store.readCollection(); await store.signOut();
  release({ data: { user: { id: 'owner' } } });
  await assert.rejects(pending, error => error.code === 'session_changed');
  assert.equal(calls.some(row => row[0] === 'got_owner_roster'), false);
});
test('auth callbacks remain synchronous and surface sign-out', () => {
  const { store, emit } = fake(); const events = [];
  const unwatch = store.watch(event => events.push(event)); emit('SIGNED_OUT'); unwatch();
  assert.deepEqual(events, ['SIGNED_OUT']);
});
test('revocation after a remove cannot be reported as a confirmed save', async () => {
  const { store, sdk } = fake(); const from = sdk.from; let accessChecks = 0;
  sdk.from = name => {
    const chain = from(name);
    if (name === OWNER_TABLE && ++accessChecks === 2) chain.maybeSingle = async () => ({ data: null });
    return chain;
  };
  await assert.rejects(store.setOwned('v1', false), error => error.code === 'not_owner');
});
