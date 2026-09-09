## Why

Multiplayer participants are currently shown with fixed slot labels such as “Joueur 2,” making a shared race harder to recognize and less personal. Giving each participant a short editable display name makes the lobby, race, and results understandable at a glance, while an intentionally provisional generated name encourages players to choose their own.

## What Changes

- Generate a server-authoritative provisional username for every player who enters a multiplayer room; the generated value is visibly a placeholder and fits the 10-character limit.
- Add a multiplayer-lobby control that lets a player replace only their own username before the race begins.
- Validate submitted usernames on the server after trimming: they must be non-empty and no more than 10 user-perceived characters; invalid submissions keep the existing username unchanged and show feedback to the submitting player.
- Broadcast accepted name changes to everyone in the room and use usernames consistently in multiplayer lobby cards, racetrack labels, podium, and standings.
- Preserve existing role, readiness, host, room-capacity, and Solo behavior.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `lobby-management`: Multiplayer player identity gains a generated default and an owner-only, validated rename flow.
- `racetrack-progression`: Multiplayer lane labels show each player’s current username rather than a fixed slot label.
- `scoreboard-podium`: Multiplayer podium and standings use player usernames rather than fixed slot labels.

## Impact

- Affects Socket.IO player state and events in `server.js`, including server-side input validation and room-wide player-list updates.
- Affects the multiplayer waiting-room markup, styling, and rendering in `public/index.html`, `public/style.css`, and `public/client.js`.
- Requires integration tests for accepted and rejected rename requests; does not add persistence, authentication, or dependencies.
