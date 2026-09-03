## Why

Currently, TypeDash hardcodes every game to a fixed 60-second clock. This restricts gameplay variety, making quick sprint sessions or short training drills impossible. Allowing users to configure game duration (15s, 30s, 45s, 60s, defaulting to 30s) in the pre-race waiting area gives players flexibility, enhances pacing, and aligns TypeDash with modern typing games.

## What Changes

- Add a dynamic game duration selector in the waiting screen alongside theme selection with discrete presets: 15s, 30s, 45s, and 60s.
- Set the default game duration to 30 seconds for both Solo and Multiplayer games.
- Enable the host (P1) in multiplayer rooms to select the game duration, synchronizing the choice live to all participants.
- Restrict guest players in multiplayer rooms to a read-only view of the selected duration.
- Update game countdown and game loop to initialize and count down from the configured duration instead of hardcoded 60s.
- Update Solo Ghost handling so that retrying a run retains the exact text and duration (preserving the ghost), while changing either text or duration resets the ghost.
- Generalize scoreboard/podium trigger conditions from fixed 60 seconds to the configured duration expiration.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `game-mode-setup`: Adds game duration selection (15s, 30s, 45s, 60s) to the pre-race waiting room, defaulting to 30 seconds.
- `lobby-management`: Adds host control of game duration and live synchronization of selected duration to all participants in the lobby.
- `scoreboard-podium`: Generalizes game conclusion scenarios from 60 seconds to the expiration of the configured game duration.
- `solo-ghost`: Retains ghost opponent across retries with exact text and duration, and clears ghost data when either text or duration is changed.

## Impact

- `server.js`: Room data structure (`room.duration`), socket events (`chooseDuration`, `durationUpdated`), room serialization, validation against allowed presets `[15, 30, 45, 60]`, and timer initiation in `startGame()`.
- `public/index.html`: Waiting screen UI for duration preset buttons and guest duration display; game header timer initial text.
- `public/client.js`: Handling duration button clicks, emitting `chooseDuration`, listening to `durationUpdated`, resetting timer display based on configured duration.
- `public/style.css`: Styling for duration selector buttons in waiting screen.
- Automated tests in `test/server.integration.test.js`: Validating duration configuration, broadcast, permissions, and timer execution.
