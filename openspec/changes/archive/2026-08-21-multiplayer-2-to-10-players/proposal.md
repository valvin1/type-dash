## Why

Currently, TypeDash is restricted to 1v1 duels or solo play. Extending the game capacity to support 2 to 10 players allows groups of friends to join a single session and compete in a real-time typing battle royale, significantly increasing the game's competitive appeal, social engagement, and replayability.

## What Changes

- **Generalize Room Capacity:** Increase the maximum limit of active players in a room from 2 to 10, removing hardcoded references to P1/P2 in progress bars, results cards, and server validation.
- **Dynamic Lobby Grid:** Replace the 1v1 waiting slots with a glassmorphic, responsive grid displaying 10 slots. Active slots will show the player's avatar, role, and ready status; empty slots will show clear placeholders.
- **Host-Controlled Start (Option B):** 
  - The first player to join is designated the Host (re-assigned dynamically if they disconnect).
  - The Host selects the category/theme.
  - The Host has a "Lancer la partie" (Start Game) button that becomes clickable once at least 2 players (including the Host) are ready.
  - Other players see a passive status: "En attente du lancement par l'hôte..." after clicking "Ready".
- **Racetrack Gameplay UI:** Overhaul the single-lane overlay progress track into a multi-lane horizontal "racetrack" progress board, where each player gets a dedicated racing lane moving smoothly in real-time.
- **Live standings panel:** Update the real-time leaderboard to calculate and sort the standings of all active players, triggering the audio alert when any opponent overtakes the player's rank.
- **Glassmorphic 3D Results Podium:** Replace the two static results cards with a 3D-styled glassmorphic podium for the top 3 spots (Gold, Silver, Bronze theme) and a detailed table listing scores, WPM, and accuracy for the remaining players.

## Capabilities

### New Capabilities
- `lobby-management`: Handles room creation, connection limits (up to 10), player nickname or slot assignments, dynamic host promotion, and the Host-Controlled game start logic.
- `racetrack-progression`: Manages the dynamic multi-lane racetrack rendering and horizontal animations showing players' progress during typing.
- `scoreboard-podium`: Calculates real-time leaderboards, manages the overtake audio alert system, and renders the final ranking podium and scoreboard.

### Modified Capabilities
<!-- None. No existing specs are registered. -->

## Impact

- **Server-Side (`server.js`):** Enforces 10-player room capacity, assigns Host role, propagates theme choice, tracks ready states, implements the Host-Controlled countdown execution, and processes throttled or unified broadcast progress events.
- **Client-Side (`public/client.js`):** Manages dynamic lobby slot rendering, handles host-specific button states, dynamically builds racetrack lanes, computes real-time scoreboard positions, triggers overtaking audio, and builds the podium UI.
- **Markup & Styles (`public/index.html`, `public/style.css`):** Replaces static VS boxes and player panels with dynamic containers and updates keyframe styling to support podium animations and racetrack tracks.
