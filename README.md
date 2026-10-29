# KIC Web Application Starter

Joel's message submission exercise, based on
[tel1203kic/kic-webapp-starter](https://github.com/tel1203kic/kic-webapp-starter).

A small message board starter project for learning how a frontend and backend
work together. It uses only Node.js built-in modules, so there are no packages
to install.

## Start the server

### GitHub Codespaces

Open https://codespaces.new/joel-wa/kic-message-board and create a Codespace.
The included configuration starts the server automatically each time the
Codespace starts. Open the **Ports** tab and use the browser icon for port
**3000**. To let classmates use the link, right-click that port and choose
**Port Visibility → Public**, then copy its forwarded address.

This is a temporary class-demo link. It works while the Codespace and server
are running. Stopping or restarting the server resets submitted messages.
Public visibility may need to be selected again after restarting a Codespace.
Codespaces usage is shared across your account. Stop it when you finish.

### On your computer

You need Node.js installed. In the project directory, run:

```bash
npm start
```

The server listens on port 3000. Keep this terminal open while using the
application. Press `Ctrl+C` to stop the server.

## Open the application

Open `http://localhost:3000` in your browser. In GitHub Codespaces, use the
Ports tab to open forwarded port 3000. Codespaces may show a notification when
the server starts; you can open the application from that notification too.

The page requests the sample messages from `GET /api/messages` and displays
them. Enter your name and message in the form, then select **Send message**.
The browser sends JSON to `POST /api/messages`. The server validates the input,
adds the message to its in-memory array, and returns the new message with HTTP
status `201 Created`. The browser then shows it on the board.

Messages are shared by visitors using the same running server. They reset to
the sample messages when the server restarts. Nothing is saved to a database,
file, or browser storage.

Names are limited to 80 characters and messages to 1,000. Both are required;
whitespace-only input is rejected. Invalid submissions return an error, and the
form keeps your draft so you can correct it or retry.

You can also visit `http://localhost:3000/api/messages` to see the raw JSON
response (use the forwarded port URL in Codespaces).

## Project structure

```text
.
├── public/
│   ├── app.js             # GETs messages and POSTs form submissions
│   ├── index.html         # Page content and the name/message form
│   └── style.css          # Page appearance
├── package.json           # Project metadata and the npm start command
├── server.js              # HTTP server, GET/POST API, and static file server
└── test/
    └── messages.test.js   # HTTP API and in-memory storage checks
```

## How it works

`server.js` creates an HTTP server using Node.js's built-in `http` module. A
GET request to `/api/messages` receives JSON. POST requests to that same route
accept a JSON object such as:

```json
{ "author": "Joel", "text": "Hello, KIC!" }
```

`author` is the name field; `text` is the message field. Requests with malformed
JSON, missing/invalid fields, or excessive length are rejected. Other GET
requests are served from the `public` directory, with `/` showing `index.html`.

The browser runs `public/app.js`, which asks the server for messages with
`fetch()` and creates a list on the page. Submitting the form makes a second
`fetch()` request with `method: 'POST'` and `Content-Type: application/json`.
Messages are inserted into the page with `textContent`, so HTML-like message
text is displayed as text rather than executed as page markup.

## Run the checks

With a recent Node.js version, run:

```bash
npm test
```

The tests check submission, reading saved messages, reset on a new server,
validation, Unicode/line breaks, request limits, and the original static pages.

## Hosting note

This application needs a running Node.js server. Use `npm start` locally or in
Codespaces and open port 3000. GitHub Pages alone cannot run the POST API.
No packages need to be installed.
