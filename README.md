# Pop Pond · KIC community

A shared, hand-drawn message board. Color an animal, choose its resting spot, and give it a voice. Tap with the hand to pop, hold to move, feed the pond, or send animals bouncing with a bubble bomb. Animals return to their resting spots after eating and explosions.

## Run locally

Requires Node.js 22 or newer. No external runtime dependencies.

```sh
npm test
npm start
```

Open http://localhost:3017. `PORT` configures the server port; `HOST` optionally overrides its bind address. When `PORT` is set the default bind address is `0.0.0.0`, suitable for Render.

## Hosting

The Render web service builds with `npm test` and starts with `npm start`. Deploy the latest `main` commit from Render. Public repository URL services require a manual deploy; automatic deploys require a connected Git provider.

This prototype stores animals and messages in `data.json` on the server. Render's free filesystem is temporary: redeploying or restarting the service can reset this data. Supabase persistence is planned. Browser ownership is a prototype convenience, without authentication.

Local state and backups are excluded from Git. Production begins with an empty pond.

Animal artwork, pond backgrounds and interface illustrations are generated pencil-and-watercolor assets. Font licenses are included beside their files in `public/art`.

