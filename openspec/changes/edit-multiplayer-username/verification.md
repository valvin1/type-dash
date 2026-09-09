## Supersession notice — 2026-09-09

The evidence below applies to commit `ed16545`, which generated `Pseudo-XXX` defaults. It is retained as historical evidence for the unchanged rename, Unicode-limit, safe-rendering, and regression checks, but it is **stale for the default-username acceptance criterion** after the requirement changed to offline curated French-surname suggestions. Tasks 1.1, 3.1, 3.2, 4.1, and 4.2 have been reopened. No verification in this document demonstrates the new default-selection behavior until those tasks are rerun and new evidence is recorded.

## Automated verification — curated surname re-verification

**Status: passed** — this is the current, superseding automated-verification result for the working-tree revision based on `ed16545 feat(multiplayer): allow username changes`. The older automated section below remains historical evidence only.

### Tested state

- Base commit: `ed16545 feat(multiplayer): allow username changes`
- Working-tree revision: offline curated surname selection and revised OpenSpec artifacts in `server.js`, `public/index.html`, `test/server.integration.test.js`, and `openspec/changes/edit-multiplayer-username/`.

### Commands and outcomes

| Command | Outcome |
| --- | --- |
| `npm ci` | Passed; installed 402 packages. |
| `npm audit --audit-level=high` | Passed with normal network access; 0 vulnerabilities. The sandboxed first attempt could not resolve the npm audit endpoint. |
| `npm test` | Passed with loopback-server permission; 12/12 tests passed. |
| `docker build --tag typedash:change-check .` | Passed with Docker-daemon permission. |
| `openspec validate edit-multiplayer-username --strict --no-interactive` | Passed; change is valid. The CLI's optional telemetry flush reported an unrelated DNS error after successful validation. |
| `git diff --check` | Passed; no whitespace errors. |

### Acceptance-criterion evidence

- **Offline curated defaults:** `server.js` defines a source-controlled `Object.freeze`d list of 15 distinct surname strings. Its startup invariant requires at least ten distinct string entries and rejects any entry outside 1–10 Unicode code points. `createSuggestedUsername` selects only from that list; its implementation makes no request or lookup. The integration test checks list immutability, cardinality, uniqueness, entry length, and host/guest membership without assuming a particular random selection.
- **Suggestion-only and editable behavior:** The revised lobby label describes the value as a modifiable suggested pseudonym; existing waiting-room input and `changeUsername` protocol retain player-controlled replacement rather than any identity, authentication, profile, or demographic behavior. The integration test confirms a guest replaces only their own suggestion with a trimmed value and both peers receive the update.
- **Existing username safeguards:** The integration test continues to prove empty, whitespace-only, non-string, and over-limit submissions emit only an error and do not mutate/broadcast; it also proves post-countdown rename requests are ignored.
- **Unicode editor and safe rendering:** The retained 12-test suite includes the ten-astral-character editor limit and markup-like-name `textContent` renderer tests across lobby, racetrack, podium, and standings. Static inspection confirms each view continues to use the shared renderer.
- **Regression protection:** The same passing suite covers multiplayer room lifecycle, capacity, readiness, host authorization, duration behavior, and Solo ghost behavior.

Automated verification task 3.2 is complete for the curated-surname revision.

## Historical automated verification — `Pseudo-XXX` revision

### Automated verification

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

## Manual verification — curated surname re-verification

**Status: passed** — this supersedes the historical manual section above for the revised offline curated-surname default. It was independently exercised against the current local preview after the recorded curated-surname automated verification.

### Environment

- Current local source served at `http://localhost:3000`.
- Separate fresh browser tabs created independent Socket.IO host and guest sessions; a third fresh tab exercised Solo.
- The source-controlled suggestion list was inspected: it contains the displayed `Durand` and `Dubois` values, among the bundled surname strings, with no server-side lookup mechanism.

### Scenarios, expected results, and direct observations

| Scenario | Expected | Observed |
| --- | --- | --- |
| Create a two-player room, then join it in an independent guest session | Both players receive visible, editable suggestions from the bundled curated surname list rather than a `Pseudo-XXX` placeholder. | The host received `Durand` and the guest received `Dubois`. Both names appeared in both lobbies. Each local control was visibly labelled `Pseudo suggéré (modifiable, 10 caractères max.)`. |
| Guest changes the suggestion to `1234567890` | A valid 10-character replacement is accepted and synchronized. | Guest and host both immediately displayed `P2 1234567890`. |
| Guest submits whitespace only | The room remains open, feedback is inline, and the last accepted name persists. | The guest remained in the waiting room and saw `Le pseudo doit contenir de 1 à 10 caractères.` beside the editor; both lobbies retained `1234567890`. |
| Replace guest with markup-like `<Max>` and host with `HostAlice` | Names remain literal text in lobby, race, and results. | The lobby, two racetrack lanes, and completed podium all visibly rendered literal `<Max>` alongside `HostAlice`, without creating elements from the markup-like text. |
| Run a normal multiplayer race | Host settings/readiness/start controls work and results use the selected names. | The host chose Cinema and 15 seconds; guest readiness, host readiness, then host-only `Lancer la partie` worked. The race displayed both renamed labels and the completed two-player podium displayed `🥇 HostAlice` and `🥈 <Max>`. No standings table appeared, as expected with fewer than four players. |
| Solo regression | Solo retains its separate flow and does not show multiplayer name editing. | A fresh Solo session showed `Partie solo`; selecting Cinema exposed `Lancer la partie solo`, with no suggested-name editor. |

Manual verification tasks 4.1 and 4.2 are complete for the curated-surname revision. No defects found.
