# TypeDash

TypeDash is a real-time typing game with an explicit Solo mode and configurable
multiplayer rooms for 2–6 players. A host chooses the room capacity, shares its
URL, selects a French text category, and starts the race when everyone present
is ready.

**Live demo:** [https://typedash-97r0.onrender.com/](https://typedash-97r0.onrender.com/)

## Features

- Initial Solo or Multijoueur mode selection
- Shareable rooms with a host-selected capacity from 2 to 6 players
- Unanimous ready checks, automatic host promotion, and Host removal controls
- Six French text categories
- Server-controlled countdown and 60-second game clock
- Live WPM, accuracy, rankings, and multi-lane progress display
- Final top-three podium and standings table
- Solo retries against a session-only ghost of the best eligible run on the current text
- Separate Solo actions to retry the exact text or choose a new one

The active OpenSpec change is in
`openspec/changes/add-solo-ghost-mode/`.

## Architecture

The browser client is plain HTML, CSS, and JavaScript served by an Express
server. Socket.IO carries lobby state, timers, and live progress updates over
the same origin.

Room state is held in the Node.js process. The current version is therefore
intended to run as one application instance. A restart ends active games, and
horizontal scaling would require a shared Socket.IO adapter and shared room
state.

## Run locally

Requirements: Node.js 22–24 and npm.

```sh
npm ci
npm start
```

Open <http://localhost:3000>. The health endpoint is
<http://localhost:3000/health>.

Run the integration test suite with:

```sh
npm test
```

## Run with Docker

```sh
docker build -t typedash .
docker run --rm -p 3000:3000 typedash
```

The production image installs runtime dependencies only, runs as the
unprivileged `node` user, and includes a health check.

## Publish a test deployment on Render

The repository includes `render.yaml` for a free, single-instance web service
in Frankfurt. Render supports the WebSocket connection used by Socket.IO.

1. Push these changes to GitLab and merge them into the repository's default
   branch.
2. In Render, create a new Blueprint and connect the GitLab repository.
3. Select the repository's `render.yaml` and apply the Blueprint.
4. Wait for the Docker build and `/health` check to pass, then open the assigned
   `onrender.com` URL.
5. Choose Multijoueur, create a room, and open its copied URL in a second
   browser or private window.

The free service can sleep after a period without HTTP requests or WebSocket
messages, so the first visit after inactivity can take longer. It is suitable
for testing, not a production SLA.

## Current limitations

- Rooms, results, and solo records are not persisted.
- Player scores are still calculated in the browser and should not be treated
  as cheat-resistant competitive results.
- There are no accounts, matchmaking, moderation, or analytics.
- The Google Fonts dependency requires Internet access; the app falls back to
  a local sans-serif or monospace font if it is unavailable.
