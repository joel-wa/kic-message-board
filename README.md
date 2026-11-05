# Pop Pond · KIC community

A shared, hand-drawn message board. Color an animal, choose its resting spot, and give it a voice. Tap with the hand to pop, hold to move, feed the pond, or send animals bouncing with a bubble bomb. Animals return to their resting spots after eating and explosions.

## Run locally

Requires Node.js 22 or newer. The PostgreSQL driver is pinned in the package lockfile.

```sh
npm test
npm start
```

Open http://localhost:3017. `PORT` configures the server port; `HOST` optionally overrides its bind address. When `PORT` is set the default bind address is `0.0.0.0`, suitable for Render.

## Hosting

The Render web service builds with `npm test` and starts with `npm start`. Deploy the latest `main` commit from Render. Public repository URL services require a manual deploy; automatic deploys require a connected Git provider.

Animals, drawings, names, speech, replies, and resting positions are saved in the existing Supabase project. The application waits for the database before accepting production traffic, confirms writes before acknowledging them, and rejects stale writes instead of overwriting a newer pond. Food and explosions are transient shared events.

Run `supabase/migrations/202611060001_persistent_pond.sql` once for a new database. It adds the private pond table without changing the original messages table. Configure `SUPABASE_DATABASE_URL` in Render's secret environment settings using the project's session pooler connection, and leave `POND_ID=community`. The bundled Supabase root certificate verifies the database's TLS identity. Secrets never belong in `public/`, Git, or logs.

`npm test` installs locked runtime dependencies only when they are missing, so the existing Render build command also works on a clean build. Local development without a database continues to use ignored `data.json`. Production requires a database and will not fall back to temporary storage.

The coloring editor supports template colors and a Paint-style bucket for closed freehand shapes, including previously saved drawings. Undo removes a fill just like a pen stroke.

Browser ownership is a prototype convenience, without authentication. Local state and backups are excluded from Git.

Animal artwork, pond backgrounds and interface illustrations are generated pencil-and-watercolor assets. Font licenses are included beside their files in `public/art`.

