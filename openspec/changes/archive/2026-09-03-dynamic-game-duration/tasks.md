## 1. Server Duration Model & Validation

- [x] 1.1 Add allowed duration presets `[15, 30, 45, 60]` and initialize `room.duration = 30` during room creation in `server.js`
- [x] 1.2 Include `duration` in `serializeRoom(room)` payload
- [x] 1.3 Add `chooseDuration` socket event handler validating host role, waiting state, and allowed duration preset
- [x] 1.4 Clear `room.ghost` when a solo player updates duration via `chooseDuration`
- [x] 1.5 Update `startGame(roomId)` to start countdown from `room.duration` rather than hardcoded 60 seconds
- [x] 1.6 Verify `retrySoloText` retains `room.duration` alongside text and ghost

## 2. Waiting Room UI & Styles

- [x] 2.1 Add duration selection UI markup with 15s, 30s, 45s, and 60s preset buttons and a read-only duration indicator in `public/index.html`
- [x] 2.2 Add CSS styles for duration button group, active preset pill styling, and guest display in `public/style.css`
- [x] 2.3 Update initial game header timer display in `public/index.html` to reflect the 30s default

## 3. Client State & Synchronization

- [x] 3.1 Track `selectedDuration` in `public/client.js` initialized from room data (defaulting to 30)
- [x] 3.2 Wire click listeners on duration preset buttons to emit `chooseDuration` and clear local ghost data when in solo mode
- [x] 3.3 Handle `durationUpdated` event to update active button styles for host and read-only text for guests
- [x] 3.4 Update `resetGameState()` to reset the timer display to `selectedDuration` instead of hardcoded 60
- [x] 3.5 Ensure guest view hides interactive duration buttons and displays the host-selected duration

## 4. Testing & Verification

- [x] 4.1 Add integration tests for default 30s room duration and allowed duration validation in `test/server.integration.test.js`
- [x] 4.2 Add integration tests verifying host duration updates broadcast to room and non-host updates are rejected
- [x] 4.3 Add integration tests verifying solo ghost is reset on duration change but preserved on exact text retry
- [x] 4.4 Run test suite and ensure all tests pass cleanly
