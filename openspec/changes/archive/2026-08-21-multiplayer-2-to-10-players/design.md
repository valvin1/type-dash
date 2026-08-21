## Context

TypeDash is currently a 1v1 typing speed duel with hardcoded visual slots (`#player-1` and `#player-2`), static progress bars (`#player-progress` and `#opponent-progress`), and dual result cards. To scale this system to support 2 to 10 concurrent players in a single game room, we must generalize both the WebSocket event handling and the DOM rendering logic.

## Goals / Non-Goals

**Goals:**
- Allow between 2 and 10 players to join the same room.
- Implement **Option B (Host-Controlled Start)** to prevent AFK players from locking up lobbies.
- Dynamically build visual elements (lobby slots, racetrack lanes, standing cards, results podium) in the DOM rather than relying on hardcoded selectors.
- Generalize the real-time leaderboard sorting and trigger audio alerts when any opponent overtakes the player's rank.
- Provide a gorgeous, premium glassmorphic visual style for the lobby, the racetrack, and the final 3D podium.

**Non-Goals:**
- Creating a persistent online database, global user accounts, or matchmaking queues (we continue to use URL query parameters for custom room sharing).
- Adding in-game text/voice chat.
- Designing customizable 3D graphics or custom avatar uploads.

## Decisions

### Decision 1: Host-Controlled Start (Option B)
- **Choice:** P1 is the room creator and designated "Host". Non-hosts can click "Ready". Once at least 2 players in the room are ready, the Host can click the active "Lancer la partie" button.
- **Alternatives considered:** Auto-start when 100% of joined players are ready.
- **Rationale:** If 10 people join a room, there is a very high probability that one player goes AFK or fails to ready up. A host-controlled start enables the game to begin as long as the active participants are ready.

### Decision 2: Client-side Progress Update Throttling
- **Choice:** Restrict the frequency of `updateProgress` socket emissions from each client to a maximum of once every 150ms.
- **Alternatives considered:** Broadcasting every single keystroke; or having the server run a centralized 20Hz update loop.
- **Rationale:** With 10 players typing at 80+ WPM, sending a WS message for every keypress would generate hundreds of broadcasts per second, flooding the connection. Throttling to 150ms maintains a highly responsive visual experience while keeping network consumption extremely low.

### Decision 3: dynamic CSS Grid & Flexbox layout for Racetrack & Podium
- **Choice:** Generate HTML racing tracks and results cards dynamically in Javascript and style them using modern CSS Grid and Flexbox variables.
- **Alternatives considered:** Rendering a 2D HTML5 Canvas board for the racetrack.
- **Rationale:** Flexbox and CSS Grid are highly responsive, fully accessible, and allow us to reuse the existing premium glassmorphism theme easily without the performance overhead or coding complexity of a custom canvas render loop.

### Decision 4: Overtake Audio logic
- **Choice:** The client maintains a sorted array of player standings locally. On every update, the client re-evaluates their rank. If their previous rank was higher than their new rank (meaning they got passed), the alert sound is played.
- **Alternatives considered:** Performing the overtake calculation on the server and emitting a dedicated `'overtake'` event.
- **Rationale:** Offloading this to the client reduces server computation, and since the client already receives all opponent progress events, rank calculation is cheap and instantaneous.

## Risks / Trade-offs

- **[Risk] Host goes AFK or disconnects during setup**
  - *Mitigation:* The server monitors disconnect events. If P1 leaves, the server automatically promotes the next player in the array (`players[0]`) to Host, updating their role to `'Host'` and alerting all clients to enable their category selection and starting button.
- **[Risk] Room is overloaded during late join attempts**
  - *Mitigation:* The server strictly validates connection counts on `'joinRoom'`. If `players.length >= 10`, it sends a `'error'` event and refuses the connection.
- **[Risk] Username XSS on Racetrack & Podium**
  - *Mitigation:* Player names are strictly auto-assigned (e.g. `Joueur 1`, `Joueur 2`, or `Vous`) or fully escaped using secure DOM creation APIs (`textContent` or text nodes) before rendering to prevent HTML injection.

## Technical Security Hardening

To maintain application security under higher load, the implementation will strictly enforce the following controls:

1. **Server-Side Host Validation (Anti-State Disruption):**
   - **Rule:** The server MUST authorize the `'startGame'` trigger.
   - **Verification:** The handler will explicitly check:
     - `socket.id === room.players[0].id` (Sender is the active Host).
     - `room.gameState === 'waiting'` (The room is in the setup state).
     - At least 2 players in the room are ready.
   - **Action:** Any unauthorized or out-of-order `'startGame'` event will be discarded.

2. **DoS Prevention via Strict Payload Validation:**
   - All newly introduced and modified WebSocket event handlers on the server (e.g., `'chooseTheme'`, `'updateProgress'`, `'setReady'`, `'startGame'`) must perform type-checking:
     - Ensure data structures are non-null and match expected schemas.
     - Discard malformed requests immediately to prevent unhandled TypeErrors from crashing the Node.js process.

3. **Authoritative Game State Enforcements:**
   - The server maintains the master clock for the countdown and 60-second limit, broadcasting timer ticks. All progress updates are rejected by the server unless `room.gameState === 'playing'`.

