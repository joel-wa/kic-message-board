// This server uses only modules that are included with Node.js.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, 'public');
const MAX_BODY_BYTES = 16 * 1024;

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(data));
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function createServer() {
  // This array belongs to the server. Nothing is saved to a file or database.
  // Creating/restarting the server restores these three sample messages.
  const messages = [
    { id: 1, author: 'Aki', text: 'Hello from the KIC lecture!' },
    { id: 2, author: 'Ren', text: 'I am learning how the frontend talks to the backend.' },
    { id: 3, author: 'Mina', text: 'This message came from the server API.' }
  ];
  let nextId = 4;

  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    // Return the in-memory messages as JSON for the frontend.
    if (request.method === 'GET' && requestUrl.pathname === '/api/messages') {
      sendJson(response, 200, messages);
      return;
    }

    // The browser submits { author, text } as a JSON body using HTTP POST.
    if (requestUrl.pathname === '/api/messages') {
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'GET, POST');
        sendJson(response, 405, { error: 'Use GET to read messages or POST to send one.' });
        return;
      }

      const contentType = (request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (contentType !== 'application/json') {
        request.resume();
        sendJson(response, 415, { error: 'Send the message as application/json.' });
        return;
      }

      const chunks = [];
      let bodyBytes = 0;
      request.on('data', chunk => {
        bodyBytes += chunk.length;
        // Discard excess data instead of storing an unlimited request body.
        if (bodyBytes <= MAX_BODY_BYTES) chunks.push(chunk);
      });
      request.on('end', () => {
        if (bodyBytes > MAX_BODY_BYTES) {
          sendJson(response, 413, { error: 'The message is too large.' });
          return;
        }

        let data;
        try {
          data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch {
          sendJson(response, 400, { error: 'The request must contain valid JSON.' });
          return;
        }

        if (!data || Array.isArray(data) || typeof data.author !== 'string' || typeof data.text !== 'string') {
          sendJson(response, 400, { error: 'Enter both your name and a message.' });
          return;
        }
        const author = data.author.trim();
        const text = data.text.trim();
        if (!author || !text) {
          sendJson(response, 400, { error: 'Your name and message cannot be blank.' });
          return;
        }
        if (author.length > 80 || text.length > 1000) {
          sendJson(response, 400, { error: 'Use up to 80 characters for your name and 1,000 for your message.' });
          return;
        }

        const message = { id: nextId++, author, text };
        messages.push(message);
        sendJson(response, 201, message);
      });
      request.on('error', () => {
        if (!response.headersSent && !response.destroyed) {
          sendJson(response, 400, { error: 'The request could not be read. Please try again.' });
        }
      });
      return;
    }

    if (request.method !== 'GET') {
      response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Method Not Allowed');
      return;
    }

    // Map the root URL to the frontend's main page.
    const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    let decodedPath;

    try {
      decodedPath = decodeURIComponent(requestedPath);
    } catch {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Bad Request');
      return;
    }

    const filePath = path.resolve(publicDirectory, `.${decodedPath}`);
    if (!filePath.startsWith(`${publicDirectory}${path.sep}`)) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, fileContents) => {
      if (error) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not Found');
        return;
      }

      const contentType = contentTypes[path.extname(filePath)] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(fileContents);
    });
    });
  }

  // Importing createServer in the tests does not start a second server.
  if (require.main === module) {
    createServer().listen(PORT, () => {
      console.log(`KIC Web Application Starter is running at http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
