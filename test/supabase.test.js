const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');
const { createMessageStore, createSupabaseStore } = require('../message-store');

async function start(t, store) {
  const server = createServer({ store });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}/api/messages`;
}

test('Supabase persists messages across application server instances and owns IDs', async t => {
  const rows = [];
  const calls = [];
  const options = {
    url: 'https://example.supabase.co', key: 'sb_secret_test_only',
    fetchImpl: async (url, init) => {
      calls.push({ url, ...init });
      if (init.method === 'POST') {
        const row = { id: 42, ...JSON.parse(init.body) };
        rows.push(row);
        return Response.json([row]);
      }
      return Response.json(rows);
    }
  };
  const first = await start(t, createSupabaseStore(options));
  const write = await fetch(first, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: ' Joel ', text: ' Saved across restarts 👋 ' })
  });
  assert.equal(write.status, 201);
  assert.deepEqual(await write.json(), { id: 42, author: 'Joel', text: 'Saved across restarts 👋' });
  const second = await start(t, createSupabaseStore(options));
  assert.deepEqual(await (await fetch(second)).json(), rows);
  assert.equal(calls[0].url.pathname, '/rest/v1/kic_messages');
  assert.equal(calls[0].headers.apikey, options.key);
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.equal(calls[0].headers.Prefer, 'return=representation');
  assert.equal(calls[1].url.searchParams.get('order'), 'id.asc');
});

test('database errors return 503 without leaking details or accepting volatile writes', async t => {
  const store = createSupabaseStore({
    url: 'https://example.supabase.co', key: 'sb_secret_test_only',
    fetchImpl: async () => new Response('private credentials and database error', { status: 500 })
  });
  const endpoint = await start(t, store);
  for (const init of [undefined, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: 'Joel', text: 'Hello' })
  }]) {
    const response = await fetch(endpoint, init);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Messages are temporarily unavailable. Please try again.' });
  }
});

test('legacy service-role keys use Bearer authorization', async () => {
  const store = createSupabaseStore({
    url: 'https://example.supabase.co', key: 'test-legacy-jwt',
    fetchImpl: async (url, init) => {
      assert.equal(init.headers.Authorization, 'Bearer test-legacy-jwt');
      return Response.json([]);
    }
  });
  await store.list();
});

test('incomplete and production configuration fail instead of losing messages', () => {
  for (const env of [{ SUPABASE_URL: 'https://example.supabase.co' },
    { SUPABASE_SECRET_KEY: 'test' }, { NODE_ENV: 'production' }]) {
    assert.throws(() => createMessageStore(env), /Set SUPABASE_URL/);
  }
  assert.throws(() => createSupabaseStore({ url: 'http://example.com', key: 'test' }), /HTTPS/);
});
