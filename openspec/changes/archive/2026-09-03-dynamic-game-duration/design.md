## Context

TypeDash is a real-time multiplayer and solo typing game powered by Node.js, Express, and Socket.IO. The game loop previously hardcoded a 60-second limit directly in the server tick loop (`let timeLeft = 60;`), the client reset routine (`timerDisplay.textContent = '60'`), and the static HTML template (`<span id="timer">60</span>s`).

Users need flexible sprint options—specifically short sprint drills (15s, 30s) as well as longer sessions (45s, 60s). This design outlines the integration of dynamic duration selection in the pre-race waiting area, server authority over game length, client synchronization, and ghost lifetime management.

## Goals / Non-Goals

**Goals:**
- Provide 4 discrete duration presets: 15s, 30s, 45s, and 60s.
- Set default duration to 30 seconds for both Solo and Multiplayer rooms.
- Position duration controls in the pre-race waiting area alongside theme selection.
- Grant duration control exclusively to Solo players and Multiplayer hosts (P1), while guests receive synchronized live updates.
- Drive server timer and client countdowns using the configured room duration.
- Preserve the Solo Ghost across retries when text and duration remain identical; clear the ghost when either text or duration changes.

**Non-Goals:**
- Arbitrary continuous duration inputs or sliders (e.g. 17s, 23s).
- Altering game duration mid-race once countdown or gameplay begins.
- Storing duration configurations persistently in a database (runtime in-memory room scoping is preserved).

## Decisions

### 1. Pre-race Waiting Room Placement over Lobby Selection
- **Choice**: Place the duration selector in the waiting room alongside theme selection rather than in the initial lobby modal.
- **Rationale**: Keeps room creation simple and identical for quick-start solo play. It also allows hosts and solo players to change round duration between matches without leaving or recreating the room.
- **Alternative considered**: Selecting duration during room creation (like player capacity). Rejected because it would require remaking rooms to change round length.

### 2. Discrete Preset Buttons (15s, 30s, 45s, 60s)
- **Choice**: Render dedicated preset buttons with active toggle styling.
- **Rationale**: Immediate one-click selection, highly readable on mobile/desktop, aligned with popular typing test conventions (e.g., Monkeytype).
- **Alternative considered**: Range slider (`<input type="range">`). Rejected due to fiddly precision on mobile and lack of need for arbitrary intermediate second counts.

### 3. Default to 30 Seconds
- **Choice**: Initialize new rooms with `duration = 30`.
- **Rationale**: 30 seconds offers an optimal balance between fast-paced competitive rounds and reliable typing metric sampling.

### 4. Authoritative Server Validation & Synchronization
- **Choice**: Add `room.duration` (default: 30) to room state. Add `socket.on('chooseDuration', (duration) => ...)`:
  - Guard: only P1 can call it.
  - Guard: room state must be `'waiting'`.
  - Guard: duration must be an integer in `[15, 30, 45, 60]`.
  - Broadcast: emit `durationUpdated` to `roomId` with `{ duration }`.
  - Serialization: include `duration` in `serializeRoom(room)`.
- **Rationale**: Prevents malicious or malformed durations, ensures all participants' timers stay synchronized with the host.

### 5. Solo Ghost Invalidation on Duration Change
- **Choice**: When a solo player changes duration in the waiting room (`chooseDuration`), clear `room.ghost = null` and clear local client ghost records. Retrying with "Réessayer ce texte" retains both text and duration, keeping the ghost.
- **Rationale**: Typing performance (WPM pacing, burst snapshots, word totals) is heavily duration-dependent. Racing a 60-second ghost in a 15-second game would distort relative progress and rankings.

## Risks / Trade-offs

- **[Risk] Typists on 15s games might not reach 3 correct words for Ghost eligibility**
  - *Mitigation*: 3 correct words at 15s is ~12 WPM, easily attainable by virtually all typists. If typists do not meet this threshold, existing behavior gracefully omits ghost creation without crashing.

- **[Risk] Out-of-sync timer display if client reconnects or enters during countdown**
  - *Mitigation*: Timer display initializes directly from `room.duration` provided in `roomData`, and updates on every server `timerUpdate` tick.
