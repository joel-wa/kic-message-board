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
are running. With Supabase configured, messages survive server restarts.
Public visibility may need to be selected again after restarting a Codespace.
Codespaces usage is shared across your account. Stop it when you finish.

### On your computer

You need Node.js installed. In the project directory, run:

```bash
npm start
```

The server listens on port 3000. Keep this terminal open while using the
application. Press `Ctrl+C` to stop the server.

## Connect Supabase

1. Create a dedicated Supabase project with Data API enabled. Disable automatic
   table exposure and enable automatic Row Level Security.
2. Run `supabase/migrations/202611050001_create_kic_messages.sql` once in the
   project's SQL Editor. It creates the table, validates message lengths, seeds
   three sample messages, and denies direct anonymous access.
3. In Render, open the **kic-message-board** service → **Environment**. Add
   `SUPABASE_URL` (the HTTPS project URL) and `SUPABASE_SECRET_KEY` (a backend
   secret key from Supabase's API Keys page). Legacy `SUPABASE_SERVICE_ROLE_KEY`
   is also supported. Preserve other environment variables and deploy the change.
4. Submit a message and confirm it remains after a service restart.

Keep the key server-side. Never put it in `public/`, GitHub, or screenshots.
The browser continues using `/api/messages`; only Node contacts Supabase.
If the database is unavailable, the API returns 503 and the form retains its draft.
It never silently accepts temporary messages when database storage is configured.

For local database use with Node.js 22 or newer, copy `.env.example` to `.env`,
fill in the values, then run `node --env-file=.env server.js`. `npm start` reads
variables supplied by the hosting platform or shell; it does not load `.env`.
Existing messages held only in a running server's memory must be copied before
that server is restarted if you wish to keep them.

## Open the application

Open `http://localhost:3000` in your browser. In GitHub Codespaces, use the
Ports tab to open forwarded port 3000. Codespaces may show a notification when
the server starts; you can open the application from that notification too.

The page requests the sample messages from `GET /api/messages` and displays
them. Enter your name and message in the form, then select **Send message**.
The browser sends JSON to `POST /api/messages`. The server validates the input,
saves the message through its configured store, and returns the new message with HTTP
status `201 Created`. The browser then shows it on the board.

Messages are shared by all visitors. With Supabase configured, they are stored
in PostgreSQL and survive server restarts. Local development without credentials
uses a temporary sample board. Production requires Supabase configuration.

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
    └── messages.test.js   # HTTP API and local demo storage checks
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
Supabase contract tests use a fake Data API to check persistence across app
instances, headers, failure responses, and configuration; live deployment must
also be verified against the selected project.

## Hosting note

This application needs a running Node.js server. Use `npm start` locally or in
Codespaces and open port 3000. GitHub Pages alone cannot run the POST API.
No packages need to be installed.
