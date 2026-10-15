# Verification

## Evidence invalidated by hesitation requirements update

The previous verification evidence predates the updated contract that adds timed character-deletion hesitations and orange chart markers. Its error-only results do not verify deletion-event capture, no-op key exclusion, event attribution for hesitations, or orange marker rendering. Re-run affected automated and manual checks after implementation; prior evidence for unrelated WPM sampling, score, and ghost behavior remains historical and must be confirmed against the final code state.

## Historical automated verification — superseded by the latest run below

Tested code state: base commit `c84f36406ab2d6e7c8d855403d601394c731d64c`; working-tree feature changes in `server.js`, `public/client.js`, `public/index.html`, and `public/style.css`. Unrelated changes were present in `.agents/skills/new-change/SKILL.md` and untracked `security-review-2026-09-11.md`; they were not modified by verification.

Environment: Node.js `v22.23.1`, npm `10.9.8`.

### Commands and outcomes

- `npm ci` — passed; installed 402 packages.
- `npm audit --audit-level=high` — unavailable: npm could not resolve `registry.npmjs.org` (`EAI_AGAIN`), so audit results are unknown.
- `npm test` — failed: 14 of 15 tests passed. `health check and configured multiplayer lifecycle` failed at `test/server.integration.test.js:155`: expected player progress `50`, received `0`. The existing multiplayer progress message omits `correctWords`; the changed server now requires it for multiplayer, rejecting the update. The test then also timed out waiting for `gameFinished`.
- `docker build --tag typedash:change-check .` — unavailable: permission denied connecting to `/var/run/docker.sock`.
- `npx openspec validate typing-speed-chart --strict --no-interactive` — passed; OpenSpec reported the change valid.
- `git diff --check` — passed.

### Acceptance coverage

- Timeline sampling cadence, ordering, duration bounds, and terminal point — **not verified**. No automated coverage for the new timeline behavior is present.
- Incorrect submitted word capture, corrected partial typo exclusion, and multiplayer ownership — **not verified**. No automated tests exercise `submittedWordError` or result error data.
- Result payload compatibility, per-room/run reset, unchanged scoring, and Solo ghost behavior — **not fully verified**. Existing Solo ghost tests pass, but no new tests inspect chart fields/reset behavior. The existing multiplayer lifecycle test exposes a regression in progress updates.
- Chart rendering for Solo/multiplayer, marker placement, empty-error state, and narrow viewport — **not verified** by automated tests.

Automated verification tasks 2.1–2.3 remain pending. Do not treat the passing unrelated tests or OpenSpec validation as evidence that the feature acceptance criteria pass.

### Actionable finding

Preserve multiplayer progress updates when `correctWords` is omitted by older/current clients, or update the client/server contract consistently while retaining the existing lifecycle behavior. Reproduce with `npm test`; the first failure is at `test/server.integration.test.js:155`.

## Historical automated verification — superseded by the latest run below (2026-10-15)

This section supersedes the earlier automated result above for the updated working tree. The previous multiplayer regression is resolved by the compatibility fallback; the feature is still **not ready to pass automated verification** because required automated coverage is incomplete and two required repository checks remain unavailable.

Tested code state: base commit `c84f36406ab2d6e7c8d855403d601394c731d64c`; current working-tree changes include `server.js`, `public/client.js`, `public/index.html`, `public/style.css`, and new tests in `test/server.integration.test.js`. Unrelated `.agents/skills/new-change/SKILL.md` and `security-review-2026-09-11.md` remain untouched.

Environment: Node.js `v22.23.1`, npm `10.9.8`.

### Commands and outcomes

- `npm ci` — passed; installed 402 packages.
- `npm audit --audit-level=high` — unavailable; registry DNS lookup failed with `EAI_AGAIN registry.npmjs.org`.
- `npm test` — passed: 17 tests, 0 failures. Escalated local loopback access was required for the integration suite.
- `docker build --tag typedash:change-check .` — unavailable; permission denied connecting to `/var/run/docker.sock`.
- `openspec validate typing-speed-chart --strict --no-interactive` — passed; exit code 0 and “Change 'typing-speed-chart' is valid”. The CLI also logged a PostHog telemetry DNS failure (`EAI_AGAIN edge.openspec.dev`), which did not affect validation.
- `git diff --check` — passed.

### Acceptance evidence and remaining gaps

- New Solo integration test verifies an ordered timeline, gaps no greater than 1000 ms for the observed run, a final point, cumulative WPM formula, empty errors, and null ghost metadata. Existing Solo ghost selection/replay tests also pass. The new test does **not** prove an upper bound on sample count for the maximum supported duration, nor directly compare a timeline point against the live WPM statistic.
- New multiplayer integration test verifies legacy progress without `correctWords` remains accepted, player-specific errors, an exact-target submitted word is excluded, result timelines exist for both players, and replay room data clears previous chart state.
- The tests do **not** exercise the browser client behavior that only emits errors when a word is submitted, so the “incorrect partial prefix corrected before submission produces no error” scenario is not independently verified end to end. A direct correct-word event exclusion test is useful but does not verify this client behavior.
- No automated test covers multiplayer timeline ordering/cadence/gap limits, sample-count bounds, chart DOM rendering, marker placement, empty-error rendering, or narrow viewport overflow. The existing server tests cannot establish those UI criteria.
- The old multiplayer progress regression is resolved: the full integration suite now passes.

Automated tasks **2.1–2.3 remain pending**: cadence tests only cover a short Solo run; no test proves bounds at maximum supported duration; corrected partial typo behavior and browser chart behavior remain untested. In addition, audit and Docker checks are required by `CONTRIBUTING.md` but could not run in this environment. These are blockers to a `passed` status.


## Historical automated verification — superseded by lockfile re-verification below (2026-10-15)

**Current status: failed.** This section supersedes both historical results above. The earlier multiplayer regression is fixed, and acceptance-focused tests are now present. The required npm security audit fails against the repository's unchanged dependency lockfile, so the repository verification gate does not pass. Docker build and the test suite now pass.

Tested code state: base commit `c84f36406ab2d6e7c8d855403d601394c731d64c`; working-tree feature changes include `server.js`, `public/client.js`, `public/index.html`, `public/style.css`, new `public/typing-analysis.js`, `test/server.integration.test.js`, and `test/typing-analysis.test.js`. `package-lock.json` is unchanged from the base commit. Unrelated `.agents/skills/new-change/SKILL.md` and `security-review-2026-09-11.md` were preserved.

Environment: Node.js `v22.23.1`, npm `10.9.8`.

### Commands and outcomes

- `npm ci` — passed; installed 402 packages.
- `npm audit --audit-level=high` — **failed** (exit 1): 15 vulnerabilities in the resolved dependency tree (2 moderate, 11 high, 2 critical). The report identifies issues in dependencies including `brace-expansion`, `braces`/`semantic-release`, `engine.io`, `handlebars`, `http-cache-semantics`, `ip-address`, `postcss-selector-parser`, `proxy-addr`, and `undici`. `package-lock.json` is unchanged from the base revision, so this appears to be pre-existing dependency exposure rather than a dependency change in this feature; the audit gate remains failed and requires separate dependency remediation.
- `npm test` — passed: 19 tests, 0 failures. Ran with escalated loopback access required by the integration server.
- `docker build --tag typedash:change-check .` — passed after retrying with access to the local Docker daemon; image `typedash:change-check` built successfully.
- `openspec validate typing-speed-chart --strict --no-interactive` — passed, exit 0; OpenSpec reported the change valid. The CLI logged a PostHog telemetry DNS error (`EAI_AGAIN edge.openspec.dev`) after validation.
- `git diff --check` — passed.
- `node --check server.js && node --check public/client.js && node --check public/typing-analysis.js && node --check test/typing-analysis.test.js && node --check test/server.integration.test.js` — passed.

### Acceptance coverage

- Timeline cadence and ordering: Solo integration test checks sorted samples and maximum 1000 ms gaps; multiplayer integration test checks strictly increasing samples and maximum 1000 ms gaps for each player.
- Terminal point and WPM formula: Solo and multiplayer result tests verify a final point and compare its WPM to the shared cumulative helper. Unit tests cover normal elapsed time and the minimum elapsed-time behavior used by live stats.
- Bounded samples: the multiplayer integration test configures the maximum supported 60-second duration and asserts a maximum count of `ceil(60_000 / 500) + 2` for each player's timeline. The test uses accelerated game ticks to avoid a 60-second test; it verifies the 60-second bound against the actual recorded series and code's 500 ms sampler, but not a full wall-clock 60-second playthrough.
- Error capture: helper tests verify that a partial typo without a submission is not reported, an incorrect submitted word is reported, and a corrected word submitted exactly is not reported. Multiplayer integration verifies that only the submitting player's result contains each error and that submitting the exact target does not create an error.
- Payload and regression behavior: multiplayer test covers legacy progress without `correctWords`, preserves progress/stat fields, checks timelines/errors for both players, and confirms replay clears chart data. Existing Solo ghost eligibility, best-run and isolation tests pass; Solo chart result checks keep ghost metadata unchanged.
- The new automated tests exercise the report decision helper and data payloads, but do not render the chart in a browser or assert SVG marker placement, responsive layout, or absence of horizontal overflow. Those remain in the separate manual verification stage.

Automated acceptance tasks 2.1–2.3 have their intended server/helper scenarios covered by the latest tests, but remain **unchecked** because CONTRIBUTING's required security audit fails. Manual tasks remain pending and were not performed by this verifier. Do not report the overall verification as passed until the dependency audit gate is resolved and required manual verification is recorded.


## Automated verification — post-`npm audit fix` lockfile state (2026-10-15)

**Current status: failed.** This section supersedes all previous automated results above. The coordinator updated `package-lock.json` using non-force `npm audit fix`; the lockfile update is now part of the working-tree state under verification. Automated tests and build pass, but the required high-severity audit still exits nonzero.

Tested state: base commit `c84f36406ab2d6e7c8d855403d601394c731d64c`; feature changes in `server.js`, `public/client.js`, `public/index.html`, `public/style.css`, `public/typing-analysis.js`, `test/server.integration.test.js`, and `test/typing-analysis.test.js`; dependency-resolution changes in `package-lock.json`. `package.json` is unchanged. Unrelated `.agents/skills/new-change/SKILL.md` and `security-review-2026-09-11.md` were preserved.

Environment: Node.js `v22.23.1`, npm `10.9.8`.

### Commands and outcomes

- `npm ci` — passed; installed 404 packages from the updated lockfile.
- `npm audit --audit-level=high` — **failed**, exit 1: 12 vulnerabilities remain (2 moderate, 10 high; no critical vulnerabilities reported). Findings include nested npm-bundled `brace-expansion`, `http-cache-semantics`, `ip-address`, `postcss-selector-parser`, and `undici`, plus `braces` in the semantic-release dependency tree. npm reports that fixing all findings requires `npm audit fix --force`, which would make a breaking semantic-release downgrade. Because the lockfile changed in this working tree, these findings are part of the current change state; they are not solely an unchanged baseline. No dependency remediation was performed by this verifier.
- `npm test` — passed: 19 tests, 0 failures, with escalated loopback access for integration tests.
- `docker build --tag typedash:change-check .` — passed with escalated access to the Docker daemon; image built successfully. The production-only container install reported 0 vulnerabilities across 93 packages.
- `openspec validate typing-speed-chart --strict --no-interactive` — passed, exit 0; change is valid. PostHog telemetry emitted a DNS warning after validation (`EAI_AGAIN edge.openspec.dev`).
- `git diff --check` — passed.
- `node --check server.js && node --check public/client.js && node --check public/typing-analysis.js && node --check test/typing-analysis.test.js && node --check test/server.integration.test.js` — passed.

### Acceptance coverage

The acceptance-focused test coverage recorded in the preceding historical section remains applicable and passed again: solo/multiplayer timelines are ordered with no tested gap above 1000 ms, terminal WPM uses the shared calculation helper, a 60-second configured multiplayer run asserts the sample-count ceiling, errors are only reported on submitted incorrect words and belong to the submitting player, corrected submissions do not report an error, legacy multiplayer progress remains accepted, replay clears chart state, and existing Solo ghost tests pass. The accelerated game-tick test does not constitute a full wall-clock 60-second run. Automated browser rendering/responsive layout checks remain absent and belong to the manual stage.

Automated tasks 2.1–2.3 remain unchecked because the repository-required audit gate fails. Manual tasks remain pending and were not performed by this verifier. Do not mark automated verification passed until the remaining audit findings are resolved in the dependency tree.


## Automated verification — hesitation marker implementation (2026-10-15)

**Current status: failed.** This section supersedes all earlier automated results for the current implementation, which now includes orange hesitation markers. No manual verification was performed. The automated tests and build pass, but `npm audit --audit-level=high` still fails with 12 findings, so the CONTRIBUTING verification gate is not satisfied.

Tested state: base commit `c84f36406ab2d6e7c8d855403d601394c731d64c`; current working tree includes the existing feature changes, the updated `package-lock.json`, and hesitation recording/rendering changes in `server.js`, `public/client.js`, `public/index.html`, `public/style.css`, `public/typing-analysis.js`, `test/server.integration.test.js`, and `test/typing-analysis.test.js`. `package.json` remains unchanged. Unrelated `.agents/skills/new-change/SKILL.md` and `security-review-2026-09-11.md` were preserved.

Environment: Node.js `v22.23.1`, npm `10.9.8`.

### Commands and outcomes

- `npm ci` — passed; installed 404 packages from the updated lockfile.
- `npm audit --audit-level=high` — **failed**, exit 1: 12 vulnerabilities (2 moderate, 10 high). Reported remaining issues include `brace-expansion`, `braces` through the semantic-release dependency tree, and npm-nested `http-cache-semantics`, `ip-address`, `postcss-selector-parser`, and `undici`. npm indicates force remediation would require a breaking semantic-release downgrade. The updated lockfile is in the current change state; these remaining findings are part of the current verification and must not be called a pass.
- `npm test` — passed: 21 tests, 0 failures. Escalated loopback access was used for socket integration tests.
- `docker build --tag typedash:change-check .` — passed with escalated access to the local Docker daemon.
- `openspec validate typing-speed-chart --strict --no-interactive` — passed, exit 0; OpenSpec reported the change valid. A PostHog telemetry DNS warning (`EAI_AGAIN edge.openspec.dev`) occurred after validation.
- `git diff --check` — passed.
- `node --check server.js && node --check public/client.js && node --check public/typing-analysis.js && node --check test/typing-analysis.test.js && node --check test/server.integration.test.js` — passed.

### Acceptance coverage

- Timeline and WPM coverage from the prior implementation remains passing: Solo and multiplayer series are ordered, tested gaps are at most 1000 ms, the final point is checked with the shared cumulative WPM helper, and the multiplayer test asserts a sample-count ceiling for the configured 60-second maximum duration (using accelerated game ticks). Existing Solo ghost regression tests pass.
- Incorrect-word and hesitation helper tests pass. The tests cover backward and forward deletion, word deletion, no-op Backspace/Delete, ordinary insertion, cut exclusion, Unicode character counting, and a corrected typo where actual deletion creates a hesitation but exact target submission creates no incorrect-word error.
- Multiplayer integration checks hesitation event ownership, elapsed timestamp presence, rejection of zero deletion count and out-of-range word index, result payloads, and replay reset of timelines, errors, and hesitations. It also retains the legacy progress, player-specific incorrect-word, exact-target exclusion, and cadence assertions.
- The OpenSpec spec now includes Backspace/Delete semantics and orange marker/legend requirements. The automated suite does not render the chart in a browser or verify marker positions/colors and narrow viewport layout; those are still assigned to manual verification.

Automated tasks 2.1–2.3 remain unchecked because the required npm audit gate fails. Manual tasks 3.1–3.3 remain pending and were not performed. Do not report this verification as passed until the audit gate and manual verification are resolved.

## Automated verification — deletion-tracker fallback correction (2026-10-15)

**Current status: failed.** This update supersedes the preceding hesitation-marker result for the corrected deletion-tracker implementation. No manual verification was performed. The tracker correction is covered by passing tests, while the unchanged lockfile audit still fails.

Tested state: current working tree after the deletion-tracker fallback correction. No package manifest or lockfile changes have occurred since the preceding audit result.

### New and repeated evidence

- `npm test` — passed: 23 tests, 0 failures. The integration suite ran with loopback access and did not use or alter the already-running application on port 3000.
- New unit coverage verifies deletion intent fallback when `inputType` is empty, deletion key intent persisting until the corresponding input event and being consumed exactly once, and correction through actual deletion without reporting a submitted-word error.
- `node --check server.js && node --check public/client.js && node --check public/typing-analysis.js && node --check test/typing-analysis.test.js && node --check test/server.integration.test.js` — passed.
- `git diff --check` — passed.
- The current lockfile has not changed since `npm audit --audit-level=high` was rerun; its latest result remains **failed** (12 vulnerabilities: 2 moderate, 10 high). Do not reinterpret that prior audit failure as a pass.

Automated tasks 2.1–2.3 remain unchecked because the required audit gate remains failed. Manual tasks 3.1–3.3 remain pending. Overall automated verification remains failed.

## Automated verification — feature acceptance and production dependency audit (2026-10-15)

**Feature acceptance status: passed.** All automated feature criteria in tasks 2.1–2.3 have passing coverage. The full audit including development dependencies remains failed, but the production-only audit reports zero vulnerabilities. The user explicitly authorized continuing on the condition that the production image dependencies are unaffected; `npm audit --omit=dev` confirms zero production vulnerabilities. This is not a pass of the full `npm audit` command.

Tested state: current feature implementation and updated compatible `package-lock.json`; no manifest or lockfile changes since the full audit result below. Existing server on port 3000 was not modified. Environment: Node.js `v22.23.1`, npm `10.9.8`.

### Commands and outcomes

- `npm ci` — passed; installed 404 packages.
- `npm audit --audit-level=high` — **failed** (exit 1): 12 vulnerabilities (2 moderate, 10 high), in development dependencies and npm-bundled nested dependencies. The `braces` finding is in the semantic-release dependency tree; `npm audit fix --dry-run` found no compatible automatic updates, and `--force` would require a major semantic-release downgrade. The full audit remains unresolved and is reported accurately as failed.
- `npm audit --omit=dev --audit-level=high` — passed; `found 0 vulnerabilities`. This verifies the production dependency set used by the image.
- `npm test` — passed: 23 tests, 0 failures; socket integration tests used loopback access without interacting with the running app on port 3000.
- `docker build --tag typedash:change-check .` — passed; built successfully using the updated lockfile.
- `openspec validate typing-speed-chart --strict --no-interactive` — passed, exit 0. The CLI emitted a PostHog telemetry DNS warning after validating the change.
- `git diff --check` — passed.
- `node --check server.js && node --check public/client.js && node --check public/typing-analysis.js && node --check test/typing-analysis.test.js && node --check test/server.integration.test.js` — passed.

### Feature acceptance evidence

- **2.1 — Passed:** Solo and multiplayer integration tests verify ordered timelines, gaps no greater than 1000 ms, terminal measurements, WPM calculations, and a sample-count ceiling for the supported 60-second maximum duration.
- **2.2 — Passed:** Helper and multiplayer tests cover incorrect submitted words, actual Backspace/Delete removals, fallback tracking for empty `inputType`, word deletions, no-op keys, insertion and cut exclusion, Unicode deletion counts, consume-once key intent, and player ownership of events.
- **2.3 — Passed:** Tests cover result payload compatibility, legacy multiplayer progress, per-player events, replay data reset, existing score/progress fields, and Solo ghost eligibility/selection/isolation. Manual checks below additionally confirm the rendered results, replay behavior, and ghost feedback.

The feature acceptance checks pass. The complete `npm audit --audit-level=high` still fails on development dependency findings; authorization to continue was based on the separately passing production-only audit and does not change or waive that reported result.

## Manual verification

Date: 2026-10-15. Environment: local app at `http://localhost:3000/`; after an initial reproduction against a stale server process, the TypeDash server was restarted to load the current server-side event handler. Checks used Chrome and Codex in-app browser on desktop. No code was changed during these checks.

### Solo errors and hesitation markers — passed (task 3.1)

**Expected:** a submitted incorrect word appears as a red marker; a typo corrected by deleting a character appears as an orange marker but no red error; Backspace on empty input produces no orange marker.

**Steps and observed results:**

1. In a 15-second Solo history game, pressed Backspace while the word input was empty. The final chart had exactly one orange marker, so this no-op deletion did not add a marker.
2. For the first target word `Les`, typed `Lx`, pressed Backspace, then typed `es ` to submit the corrected word. The result contained one orange hesitation marker for one deleted character and no red error for this corrected word.
3. For the next target word `grands`, typed `grandx ` and submitted it. The result contained one red incorrect-word marker.
4. Inspected the rendered results chart and its accessible DOM description. It showed the WPM curve, time and WPM axes, a red “Mot terminé avec erreur” legend entry, an orange “Caractère supprimé” legend entry, and event descriptions `P1, erreur à 8 secondes` and `P1, suppression de 1 caractère(s) à 8 secondes`. The chart displayed one marker of each kind, matching the submitted incorrect word and actual deletion.

The coordinator separately observed the same distinction in Chrome with a 15-second Solo history game: typing `Lax` for the first word `Le`, deleting one character, then submitting produced one orange deletion marker and one red submitted-word error marker. Both observed Solo flows support the distinct marker semantics.

### Multiplayer comparison — passed (task 3.2)

**Environment and setup:** Chrome at `http://localhost:3000/`, using two separately opened Chrome tabs/sessions with independent Socket.IO player connections. Created a two-player room `c27ce6cd`, selected Histoire and 15 seconds, marked both players ready, and started the race from the host.

**Expected:** each human player has a distinct curve and legend identity; incorrect submitted words are red and actual deletions orange, associated only with the player who produced them; a player who stops typing still has a timeline through the end of the game.

**Steps and observed results:**

1. In both player sessions, typed `Lx`, pressed Backspace, submitted `a ` to finish the target `La` correctly, then submitted `découverteX ` as the next word. Each result showed a single deletion and a single incorrect-word event for its own player.
2. The host (`Comet`, P1) stopped typing after these two words. The guest (`Flash`, P2) continued and submitted three more correct words before the timer expired.
3. Both sessions reached results. The podium listed Comet and Flash. The chart legend listed both players, and the SVG contained two distinct curves with strokes `#8b7bff` and `#35d6c2`.
4. The chart's accessible marker descriptions were `Comet, erreur à 9 secondes`, `Comet, suppression de 1 caractère(s) à 8 secondes`, `Flash, erreur à 10 secondes`, and `Flash, suppression de 1 caractère(s) à 9 secondes`. The SVG contained one red error marker and one orange deletion marker in each player's series. Comet's line stayed flat after stopping while Flash's line continued changing through the remainder of the chart.

This verifies both curve separation and event ownership in the independently connected host and guest pages, including a paused player.

### Narrow viewport, replay/new-game reset, podium, and ghost behavior — passed (task 3.3)

**Environment:** Codex in-app browser at `http://localhost:3000/`, viewport set to 375 × 812 CSS pixels, local server left running.

**Steps and observed results:**

1. Completed a 15-second Solo Histoire run with four correct words. The result displayed the chart, axes, legend, the existing Solo podium, and “Nouveau meilleur score” ghost feedback. At 375 px viewport width, the chart box measured 294 px and its SVG 271 px; the page document scroll width was 360 px, so there was no horizontal overflow. The screenshot showed the chart, tick labels, curve, and legend within the result card.
2. Replayed the same text and submitted one corrected typo and one incorrect word. The results showed exactly one orange deletion marker and one red error marker for this run, plus the existing ghost opponent and “Record non battu” comparison. This confirmed that the chart data was newly generated and the Solo ghost feedback still worked.
3. Replayed again without typing. The final chart contained a WPM curve and no error or hesitation events; the red/orange events from the previous run did not carry over. The result still showed the prior ghost opponent in the podium. Then selected “Changer de texte”, chose Culture, and started a new Solo game. After that game ended without typing, its result showed no inherited red/orange markers or ghost from Histoire.
4. The two-player result retained the podium and showed both players' ranked standings; the Solo results continued to show the player's podium placement and ghost comparison. The separate ranks 4–6 overflow table was not part of this scenario and was not tested.

Responsive chart layout, replay reset, new-text reset, ranked player results, Solo podium, and Solo ghost comparison were observed to work. Task 3.3 is complete.
