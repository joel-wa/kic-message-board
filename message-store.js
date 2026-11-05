// Supabase is accessed only by the Node server; keys never reach the browser.
function createSupabaseStore({ url, key, fetchImpl = fetch }) {
  const projectUrl = new URL(url);
  if (projectUrl.protocol !== 'https:' || projectUrl.username || projectUrl.password ||
      projectUrl.pathname !== '/' || projectUrl.search || projectUrl.hash) {
    throw new Error('SUPABASE_URL must be an HTTPS project URL.');
  }
  const endpoint = new URL('/rest/v1/kic_messages', projectUrl);
  async function request(method, message) {
    const target = new URL(endpoint);
    target.searchParams.set('select', 'id,author,text');
    if (method === 'GET') target.searchParams.set('order', 'id.asc');
    const headers = { apikey: key, 'Content-Type': 'application/json' };
    // Legacy service-role JWTs need Bearer authorization; new secret keys do not.
    if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
    if (method === 'POST') headers.Prefer = 'return=representation';
    const response = await fetchImpl(target, {
      method, headers, signal: AbortSignal.timeout(10000),
      ...(message ? { body: JSON.stringify(message) } : {})
    });
    if (!response.ok) throw new Error('Supabase request failed.');
    const rows = await response.json();
    if (!Array.isArray(rows) || (method === 'POST' && rows.length !== 1)) {
      throw new Error('Unexpected Supabase response.');
    }
    return method === 'GET' ? rows : rows[0];
  }
  return { list: () => request('GET'), add: message => request('POST', message) };
}

function createMemoryStore() {
  const messages = [
    { id: 1, author: 'Aki', text: 'Hello from the KIC lecture!' },
    { id: 2, author: 'Ren', text: 'I am learning how the frontend talks to the backend.' },
    { id: 3, author: 'Mina', text: 'This message came from the server API.' }
  ];
  let nextId = 4;
  return {
    list: async () => messages.slice(),
    add: async data => {
      const message = { id: nextId++, ...data };
      messages.push(message);
      return message;
    }
  };
}

function createMessageStore(env = process.env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return createSupabaseStore({ url, key });
  if (url || key || env.NODE_ENV === 'production') {
    throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY before starting the server.');
  }
  return createMemoryStore();
}

module.exports = { createMessageStore, createSupabaseStore, createMemoryStore };
