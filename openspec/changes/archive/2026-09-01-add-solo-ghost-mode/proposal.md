## Why

Solo players currently lose the context of a completed run when they replay, so they cannot measure improvement against their own performance. A session-only ghost for the current text turns retries into an immediate, multiplayer-like race without adding accounts or persistent storage.

## What Changes

- Record eligible Solo runs with timestamped progress, WPM, and accuracy snapshots.
- Keep the best eligible run for the current text using score, progress, then accuracy as deterministic comparison criteria.
- Replay the best run as a distinct synthetic opponent on retries of the exact same text.
- Include the ghost in the racetrack, live ranking and overtake feedback, and final result/podium presentation.
- Replace the current Solo replay action with separate retry-same-text and change-text actions.
- Show whether the player beat the record, including score, WPM, accuracy, and progress differences.
- Clear ghost data when the text or theme changes, the Solo room ends, or the player disconnects/refreshes.
- Keep multiplayer room membership and behavior unchanged.

## Capabilities

### New Capabilities
- `solo-ghost`: Session-scoped ghost eligibility, recording, best-run selection, replay timing, result comparison, and clearing behavior.

### Modified Capabilities
- `game-mode-setup`: Solo results offer retrying the exact text with the retained ghost or returning to theme selection and clearing it.
- `racetrack-progression`: Solo retries render and animate a visually distinct ghost lane from recorded snapshots.
- `scoreboard-podium`: Live and final Solo rankings include the ghost and show record comparison feedback.

## Impact

- `server.js`: Solo room state, snapshot collection, ghost selection, retry/change-text events, and serialized ghost/result data.
- `public/client.js`: Ghost replay timeline, ranking integration, result comparison, and revised Solo actions.
- `public/index.html` and `public/style.css`: Ghost presentation and Solo result controls/feedback.
- `test/server.integration.test.js`: Coverage for eligibility, best-run selection, timeline retention, clearing, isolation, and multiplayer regression behavior.
- No new runtime dependencies, backend persistence, or browser storage.
