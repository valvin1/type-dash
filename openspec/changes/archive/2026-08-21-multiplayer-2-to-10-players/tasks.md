## 1. Backend Implementation (server.js)

- [x] 1.1 Increase room capacity limits from 2 to 10 concurrent connections in `joinRoom` handler, returning errors for full rooms.
- [x] 1.2 Implement Host designation (role: 'Host') for first player and automatic promotion logic on player disconnects.
- [x] 1.3 Update the start game event handlers: allow Host to trigger countdown only when at least 2 players are ready.
- [x] 1.4 Implement strict server-side validation on the `'startGame'` handler, verifying sender socket identity (must be P1/Host) and game state (`waiting`).
- [x] 1.5 Add type-checks and structure validation on all incoming WS payloads (`'chooseTheme'`, `'updateProgress'`, `'setReady'`, `'startGame'`) to prevent server crashes from malformed inputs.



## 2. UI Markup & Styles (public/index.html, public/style.css)

- [x] 2.1 Refactor lobby screen in `index.html` to replace the static 2-player slot panels with a dynamic `#player-slots` grid container.
- [x] 2.2 Rebuild the gameplay screen progress bar in `index.html` to house a dynamic multi-lane `#racetrack-lanes` grid.
- [x] 2.3 Refactor the results screen to support a `#podium-container` and a `#standings-table` for ranks 4 through 10.
- [x] 2.4 Add CSS styles for the dynamic lobby cards, horizontal racetrack racing tracks, and 3D floating podium spots (Gold, Silver, Bronze).


## 3. Client Logic & Synchronization (public/client.js)

- [x] 3.1 Overhaul `updatePlayerList` function to dynamically render 10 lobby cards showing status, role, and names.
- [x] 3.2 Add UI event listeners for Host-controlled starting button ("Lancer la partie") and passive state indicator for participants.
- [x] 3.3 Add client-side throttling to progress updates in `updateStats`, ensuring emissions occur at most once every 150ms.
- [x] 3.4 Implement dynamic racetrack track lane creation and smooth transition transforms for opponent racers.
- [x] 3.5 Isolate typing cursor highlights in text display: hide opponent cursors and show only the local user's progress cursor.
- [x] 3.6 Implement the real-time leaderboard sorting algorithm in `updateLeaderboard` and trigger overtaking sound alerts on standing rank drops.
- [x] 3.7 Implement the results podium and scoreboard renderer to dynamically display final standing cards in `displayResults`.
- [x] 3.8 Escape and sanitize all dynamic usernames and role text rendered in lobby cards, racetrack tracks, and podium spots using `textContent` to prevent XSS injection.


