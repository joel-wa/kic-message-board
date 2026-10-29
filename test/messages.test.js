const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');

async function startServer(t) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

function post(base, body, contentType = 'application/json') {
  return fetch(`${base}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

test('POST saves a trimmed name and message, visible to the next GET request', async t => {
  const base = await startServer(t);
  const response = await post(base, { author: '  Joel  ', text: '  Hello, KIC!  ' });
  assert.equal(response.status, 201);
  const message = await response.json();
  assert.deepEqual(message, { id: 4, author: 'Joel', text: 'Hello, KIC!' });
  const read = await fetch(`${base}/api/messages`);
  assert.equal(read.headers.get('cache-control'), 'no-store');
  const messages = await read.json();
  assert.equal(messages.length, 4);
  assert.deepEqual(messages.at(-1), message);
});

test('multiple submissions receive unique IDs', async t => {
  const base = await startServer(t);
  const first = await (await post(base, { author: 'Joel', text: 'First' })).json();
  const second = await (await post(base, { author: 'Joel', text: 'Second' })).json();
  assert.equal(second.id, first.id + 1);
  assert.equal((await (await fetch(`${base}/api/messages`)).json()).length, 5);
});

test('a new server resets submitted messages instead of persisting them', async t => {
  const first = await startServer(t);
  await (await post(first, { author: 'Joel', text: 'Temporary message' })).json();
  const fresh = await startServer(t);
  const messages = await (await fetch(`${fresh}/api/messages`)).json();
  assert.equal(messages.length, 3);
  assert.equal(messages.some(message => message.text === 'Temporary message'), false);
});

test('malformed JSON and invalid field types do not change the board', async t => {
  const base = await startServer(t);
  for (const body of ['{broken', 'null', '[]', '{}', '{"author":12,"text":"Hello"}', '{"author":"Joel","text":[]}']) {
    const response = await post(base, body);
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  assert.equal((await (await fetch(`${base}/api/messages`)).json()).length, 3);
});

test('blank and over-length submissions are rejected', async t => {
  const base = await startServer(t);
  for (const body of [
    { author: '   ', text: 'Hello' },
    { author: 'Joel', text: '\n  ' },
    { author: 'x'.repeat(81), text: 'Hello' },
    { author: 'Joel', text: 'x'.repeat(1001) }
  ]) {
    assert.equal((await post(base, body)).status, 400);
  }
  assert.equal((await (await fetch(`${base}/api/messages`)).json()).length, 3);
});

test('Unicode, line breaks and HTML-like characters remain message text', async t => {
  const base = await startServer(t);
  const text = 'こんにちは！\n<b>This stays text</b> & welcome 👋';
  const response = await post(base, { author: 'ジョエル', text });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).text, text);
  assert.equal((await (await fetch(`${base}/api/messages`)).json()).at(-1).text, text);
});

test('requests with the wrong content type are rejected', async t => {
  const base = await startServer(t);
  const response = await post(base, 'author=Joel&text=Hello', 'application/x-www-form-urlencoded');
  assert.equal(response.status, 415);
  assert.match((await response.json()).error, /application\/json/);
});

test('oversized request bodies are rejected without crashing the server', async t => {
  const base = await startServer(t);
  assert.equal((await post(base, { author: 'Joel', text: 'x'.repeat(20000) })).status, 413);
  const read = await fetch(`${base}/api/messages`);
  assert.equal(read.status, 200);
  assert.equal((await read.json()).length, 3);
});

test('the API advertises its supported methods', async t => {
  const base = await startServer(t);
  const response = await fetch(`${base}/api/messages`, { method: 'DELETE' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, POST');
});

test('the original page and static assets still load', async t => {
  const base = await startServer(t);
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /id="message-form"/);
  assert.equal((await fetch(`${base}/app.js`)).status, 200);
  assert.equal((await fetch(`${base}/style.css`)).status, 200);
  assert.equal((await fetch(`${base}/missing-file`)).status, 404);
});
