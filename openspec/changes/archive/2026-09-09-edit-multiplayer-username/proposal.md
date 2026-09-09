## Why

Multiplayer participants are currently shown with fixed slot labels such as “Joueur 2,” making a shared race harder to recognize and less personal. Giving each participant a short editable display name makes the lobby, race, and results understandable at a glance; operators also need to choose the starting suggestions without editing application code or making a network request.

## What Changes

- Randomly select a server-authoritative default username for every multiplayer entrant from an editable, bundled UTF-8 plain-text file. Every usable entry fits the existing 10-character Unicode limit.
- Define and document the file format, including full-line comments, blank lines, whitespace trimming, duplicate handling, invalid entries, and startup configuration failures.
- Load the file once when the server starts; document that edits require a server restart and do not alter players already in a room.
- Treat every selected value solely as an arbitrary display-name suggestion: it does not identify, authenticate, profile, or imply anything about the player.
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
- Adds a bundled editable name-list file and server-side parsing/validation. Requires deterministic tests for file parsing and default selection as well as existing rename validation coverage. It does not add persistence, authentication, network lookups, personal-data collection, or dependencies.
