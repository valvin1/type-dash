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

## Continuous integration and releases

Pull requests targeting `main` run the integration test suite and build the
production Docker image. The image is only used for validation and is not
published to a container registry.

After a change reaches `main`, the same validation runs before
[semantic-release](https://github.com/semantic-release/semantic-release)
analyzes commits made since the latest reachable `v<major>.<minor>.<patch>`
Git tag:

- `fix:` and `perf:` create a patch release.
- `feat:` creates a minor release.
- A `!` after the commit type or a `BREAKING CHANGE:` footer creates a major
  release.
- Other commit types, including `docs:`, `test:`, and `chore:`, do not create a
  release by default.

Git tags and [GitHub Releases](https://github.com/valvin1/type-dash/releases)
are the source of truth for project versions. The sentinel version in
`package.json` is intentionally not updated or committed during releases, and
the package is not published to npm.

### Required GitHub repository settings

Before merging the workflow configuration:

1. In the repository's Actions settings, ensure organizational and repository
   policy allows the release job to request `contents: write` for the built-in
   `GITHUB_TOKEN`.
2. In the `main` branch ruleset, require pull requests and the `Test and build`
   status check from the `Pull request validation` workflow.
3. If tag rules protect `v*` tags, allow the GitHub Actions repository app to
   create the semantic-release tags.

## Publish a test deployment on Render

The repository includes `render.yaml` for a free, single-instance web service
in Frankfurt. Render supports the WebSocket connection used by Socket.IO.

1. Open a pull request on GitHub and merge it into the repository's `main`
   branch after the required validation checks pass.
2. In Render, create a new Blueprint and connect the GitHub repository.
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
