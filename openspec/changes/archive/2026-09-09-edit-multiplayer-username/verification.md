## Supersession notice — 2026-09-09 (file-backed defaults revision)

The default-source evidence below applies to the prior hardcoded `CURATED_FRENCH_SURNAMES` implementation. It is retained as historical evidence for unchanged rename, Unicode-limit, safe-rendering, and regression checks, but it is **stale for every default-username source, parsing, startup-failure, and reload-semantics acceptance criterion** after the requirement changed to `data/default-usernames.txt`. Tasks 1.1, 1.2, 3.1, 3.2, 4.1, and 4.2 have been reopened. No verification in this document demonstrates the file-backed behavior until those tasks are rerun and new evidence is recorded.

## Automated verification — file-backed defaults re-verification

**Status: passed** — this is the current, superseding automated-verification result for the file-backed default-name working-tree revision based on `3a261ad feat(multiplayer): suggest French surnames`. The older default-source evidence below is historical only.

### Tested state

- Base commit: `3a261ad feat(multiplayer): suggest French surnames`
- Working-tree revision: `data/default-usernames.txt`, the startup parser/loader in `server.js`, parser and server tests, operator documentation, and revised OpenSpec artifacts.

### Commands and outcomes

| Command | Outcome |
| --- | --- |
| `npm ci` | Passed; installed 402 packages. |
| `npm audit --audit-level=high` | Passed with normal network access; 0 vulnerabilities. The sandboxed first attempt could not resolve the npm audit endpoint. |
| `npm test` | Passed with loopback-server permission; 15/15 tests passed, including all three new parser/loader tests. |
| `docker build --tag typedash:change-check .` | Passed with Docker-daemon permission and includes `data/` in the final image. |
| `openspec validate edit-multiplayer-username --strict --no-interactive` | Passed; change is valid. The CLI's optional telemetry flush reported an unrelated DNS error after successful validation. |
| `git diff --check` | Passed; no whitespace errors (including the two new files). |

### Acceptance-criterion evidence

- **Editable bundled file and file-backed selection:** `data/default-usernames.txt` is a tracked UTF-8 plain-text file and `DEFAULT_USERNAMES` loads it once at module/server startup. Multiplayer creation and joining select only from this frozen loaded list; the integration test proves host and guest defaults are members without assuming a random result. Docker copies `data/` into the runtime image.
- **Parsing format:** `test/default-usernames.test.js` verifies leading BOM, CRLF input, comments, blank lines, trim, case-sensitive first-wins deduplication, an inline `#`, 10 astral Unicode code points, and overlong-value rejection with line-number warnings. The checked-in LF file is loaded by the full server test suite; the parser explicitly accepts both LF and CRLF.
- **Failure behavior:** The parser test verifies malformed UTF-8 and an effectively empty list fail with a clear `data/default-usernames.txt` configuration error. Loader tests verify missing and unreadable targets do the same. Inspection confirms every startup read goes through this fail-fast loader before the server can listen.
- **Restart semantics and operator documentation:** `DEFAULT_USERNAMES` is initialized once and never re-read or mutated during process lifetime, so edits neither change existing players nor new entrants before restart. The editable file carries format/restart guidance and `README.md` documents format, warnings, restart, and preservation of existing player names.
- **Existing user behavior and regressions:** The passing integration test retains owner-only trim/validate/synchronize/error/countdown-lock coverage. The existing unit tests retain ten-astral-character editor and markup-safe lobby/racetrack/podium/standings coverage; the remainder of the suite covers room lifecycle, capacity, readiness, host authorization, duration, and Solo ghost behavior.

Automated verification task 3.2 is complete for the file-backed-defaults revision.

## Historical supersession notice — 2026-09-09 (curated-surname revision)

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

## Manual verification — file-backed defaults re-verification

**Status: passed** — this supersedes all prior manual sections for the editable-file-backed default behavior. It was independently exercised against the freshly restarted local preview after the recorded file-backed automated verification.

### Environment and source inspection

- Fresh local preview at `http://localhost:3000`, with separate host and guest browser sessions plus a new Solo session.
- `data/default-usernames.txt` was read without modification. Its documented UTF-8 plain-text entries include `Orbit`; it also documents that a server restart is required after edits and that existing players do not change. The current server source loads this file once at startup. No temporary file edit was performed, preserving the checked-in contents as directed.

### Scenarios, expected results, and direct observations

| Scenario | Expected | Observed |
| --- | --- | --- |
| Create a two-player room and join from an independent guest session | Defaults are suggestions selected from the currently loaded `data/default-usernames.txt`, not hardcoded surnames or `Pseudo-XXX`. | Host and guest each displayed `Orbit`, a current entry in `data/default-usernames.txt`. Each had the visible editable `Pseudo suggéré (modifiable, 10 caractères max.)` control. |
| Replace guest name with `1234567890` | Valid 1–10-character input synchronizes. | Both guest and host immediately rendered `P2 1234567890`. |
| Submit a whitespace-only name | The accepted name remains, the room remains open, and feedback appears inline. | The guest stayed in the same waiting room; the error `Le pseudo doit contenir de 1 à 10 caractères.` appeared by the control, and both lobbies retained `1234567890`. |
| Change guest to `<Max>` and host to `HostAlice` | Markup-like names are safe literal text through lobby, race, and results. | Both lobby cards, both racetrack labels, and the completed podium showed literal `<Max>` and `HostAlice`; no markup was created. |
| Complete normal multiplayer flow | Host configuration, readiness, host-only start, and results remain functional. | The host selected Cinema and 15 seconds. Guest readiness, host readiness, and host-only `Lancer la partie` worked; the two-player podium showed the selected names and correctly had no standings table. |
| Solo regression | Solo remains independent of multiplayer name editing. | A new Solo session showed `Partie solo`; selecting Cinema revealed `Lancer la partie solo` and no suggested-name control. |

Restart semantics and file parsing were confirmed by read-only inspection of the documented loaded file and startup-only loader; the recorded automated verification independently covers actual parser and restart behavior. No defects found. Manual verification tasks 4.1 and 4.2 are complete for the file-backed-defaults revision.

### Addendum — actual file edit and restart check for task 4.2

The preceding read-only restart statement is superseded by this direct isolated-server check.

- Started an isolated server on port 3001 from the checked-in file; its host received `Rocket`.
- While that server was still running, temporarily replaced only `data/default-usernames.txt` with the single valid entry `Reverify`. The existing host continued to display `Rocket`; a guest joining its existing room received `Nimbus`, not `Reverify`. This directly shows that the pre-restart loaded set and existing player record were unchanged by the on-disk edit.
- Stopped and restarted the isolated server. A newly created room then displayed `Reverify`, proving the edited file became the source after restart.
- Restored `data/default-usernames.txt` exactly to its original checked-in contents using the repository patch mechanism, then stopped and restarted the isolated server once more. The restored file loaded successfully. No application source or configuration other than the authorized temporary data-file edit was changed.

**Task 4.2 status: passed.**
