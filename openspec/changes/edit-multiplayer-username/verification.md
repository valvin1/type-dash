## Automated verification

**Status: passed (re-verification)** — this section supersedes the prior failed automated-verification result. The focused fix removes the UTF-16 `maxlength` mismatch, limits the editor by Unicode code points, and adds rendering safety coverage.

### Tested state

- Base commit: `d32dba1 chore(deps): update js-yaml lib`
- Working-tree change under test: `server.js`, `public/client.js`, `public/index.html`, `public/style.css`, `public/player-display.js`, `test/server.integration.test.js`, `test/player-display.test.js`, and this OpenSpec change directory (all uncommitted).

### Commands and outcomes

| Command | Outcome |
| --- | --- |
| `npm ci` | Passed; installed 402 packages. |
| `npm audit --audit-level=high` | Passed with normal network access; 0 vulnerabilities. (The sandboxed first attempt could not resolve the npm audit endpoint.) |
| `npm test` | Passed with loopback-server permission; 12/12 tests passed, including the new Unicode editor-limit and safe-renderer tests. |
| `docker build --tag typedash:change-check .` | Passed with Docker-daemon permission. |
| `openspec validate edit-multiplayer-username --strict --no-interactive` | Passed; change is valid. The CLI's telemetry flush reported an unrelated DNS error after validation. |
| `git diff --check` | Passed; no whitespace errors. |

### Acceptance-criterion evidence

- **Generated defaults:** Covered by the Socket.IO integration test: both host and guest receive `Pseudo-[A-Z0-9]{3}` names, verified as 10 Unicode code points.
- **Owner-only waiting-room rename, trimming, synchronization, invalid feedback, and countdown lock:** Covered by the same integration test. It observes both peers' `usernameUpdated`, confirms the trimmed value, checks empty/whitespace/non-string/11-character rejection without mutation or broadcast, and confirms the post-countdown request is ignored.
- **Unicode editor limit:** `test/player-display.test.js` verifies that the shared input limiter retains ten astral Unicode characters and trims the eleventh. The editor applies that limiter on each input event, and the obsolete UTF-16 `maxlength` attribute is removed.
- **Safe and consistent client rendering:** `test/player-display.test.js` verifies markup-like names are inserted by `textContent`, not HTML, for the shared renderer's lobby, racetrack, podium, and standings use cases. Inspection confirms each of those client views calls that renderer.
- **Solo and existing role/readiness flow:** Existing integration suite passes, including multiplayer lifecycle, readiness/host authorization, and Solo ghost scenarios.

### Superseded finding

The prior failure reported that HTML `maxlength="10"` limited UTF-16 units and blocked a valid ten-emoji username. The fix removes that attribute and limits input through `Array.from(...).slice(0, 10)`, matching server validation. The new unit test proves the reported ten-emoji reproduction now retains all ten characters; the finding is resolved.

Automated verification task 3.2 is complete.

## Manual verification

**Status: passed** — independently exercised in a local browser against the working-tree change, after the recorded automated re-verification.

### Environment

- Local application started with `npm start` at `http://localhost:3000`.
- Separate browser tabs provided independent Socket.IO host and guest sessions; an additional new tab exercised Solo.

### Scenarios, expected results, and direct observations

| Scenario | Expected | Observed |
| --- | --- | --- |
| Create a two-player multiplayer room, then join it from a separate guest session | Each player has a visible provisional `Pseudo-XXX` name, and both sessions show both players. | Host received `Pseudo-90V`; guest received `Pseudo-D47`. Both names were visible in both waiting rooms. |
| Guest changes name to `1234567890` | A 10-character name is accepted and synchronizes to every room member. | The guest lobby showed `P2 1234567890`, and the host lobby simultaneously showed the same updated P2 card. |
| Guest submits a whitespace-only name | The player stays in the lobby, the last accepted name remains displayed, and inline validation feedback appears. | The guest remained in the same room; the control displayed `Le pseudo doit contenir de 1 à 10 caractères.` and both player cards retained `1234567890`. The visible label stated `Votre pseudo (10 caractères max.)`. |
| Change guest to markup-like `<Max>` and host to `HostAlice` | Names are rendered as literal text, not interpreted markup, in the lobby and race. | Both lobby cards displayed the literal `<Max>` and `HostAlice`; neither session navigated or created markup. After normal guest/host readiness and host start controls, the racetrack labels displayed literal `<Max>` and `HostAlice`. |
| Complete the two-player race | Results use selected usernames; with fewer than four players, no extra standings table is shown. | After the 30-second race, the podium displayed `🥇 HostAlice` and `🥈 <Max>` as literal text. No standings table was shown, as required for a two-player result. |
| Solo regression | Solo keeps its existing flow and does not expose the multiplayer name editor. | A fresh session opened `Partie solo`; choosing Cinema revealed `Lancer la partie solo`. No multiplayer username control appeared. |

The host-only theme selection, guest/host readiness states, and the host-only `Lancer la partie` control also remained functional during the multiplayer run. Manual verification tasks 4.1 and 4.2 are complete.
