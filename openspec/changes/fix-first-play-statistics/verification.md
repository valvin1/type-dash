# Verification

## Automated verification

**Status: passed.** This report supersedes the previous automated evidence because the Solo result feedback selection changed. The older all-dependencies audit findings remain a development-dependency diagnostic outside the current production-only audit gate.

Tested state: base commit `ae27be4221ed4f2b7d01044032cc341bb466e3f9`, branch `feat/fix-first-play-statistics`, with current working-tree changes to `CONTRIBUTING.md`, `public/client.js`, `public/index.html`, `public/solo-progress.js`, `test/solo-progress.test.js`, and OpenSpec artifacts. `package.json` and `package-lock.json` are unchanged. I reviewed the new `selectGhostFeedback` path and its tests as well as the affected result rendering and all acceptance criteria. No implementation or test files were modified during verification.

### Required checks

| Command | Result | Evidence |
| --- | --- | --- |
| `npm ci` | Passed | Exit 0; installed 404 packages. |
| `npm audit --omit=dev --audit-level=high` | Passed | Exit 0; `found 0 vulnerabilities`. |
| `npm test` | Passed | Exit 0; 34 tests passed, 0 failed, including the integration suite and 11 Solo progression/feedback tests. |
| `docker build --tag typedash:change-check .` | Passed | Exit 0; image built successfully with `node:24-alpine`. |
| `openspec validate fix-first-play-statistics --strict --no-interactive` | Passed | Exit 0; `Change 'fix-first-play-statistics' is valid`. OpenSpec emitted a PostHog telemetry network warning after validation; it did not affect the result. |
| `git diff --check` | Passed | Exit 0. |

### Acceptance coverage

- **First run displays current/live statistics and current chart without historical comparison; marks text played and establishes the first qualified best:** tests verify no comparator, initial best storage, and a first-run chart containing only the current series with a zero baseline. The new feedback test verifies that even a stale server `new-best` result is suppressed when there was no local best at run start. The client passes the helper's `null` result to `renderGhostResult`, which hides and clears the panel. Live metrics were not changed; this wiring was code-inspected.
- **Replay compares to the best captured at run start, never only the immediately previous run; a better run is promoted:** sequence tests verify best retention and promotion. The new feedback test asserts score/WPM deltas and `previousGhost` derive from the local best at run start, overriding stale server deltas; it also checks the panel is built when the server result is absent.
- **Best-run ordering and qualification:** tests cover score, progress and accuracy ordering, exact tie not promoting, and the three-correct-word threshold. Feedback uses the same `isBetterRun` comparator to choose `new-best` versus `not-beaten`.
- **Zero-input/incomplete runs count as played and do not create/replace a best; another text has no comparison:** tests cover zero input, incomplete after a best, initial short runs, and distinct text. The new feedback selector returns no comparison on first play; an existing best still remains the comparator for an incomplete replay.
- **Exact-text persistence, refresh/reselection, and independent timelines:** tests clear module memory and restore serialized storage for identical content, distinguish a trailing-space variant, keep current and historical chart series separate, and assert no mutation of stored timelines.
- **Malformed or unavailable storage does not interrupt play:** malformed JSON and throwing storage are covered by memory fallback tests; parseable-but-invalid data is code-inspected.
- **Non-Solo behavior is preserved:** a new test confirms multiplayer continues to use server feedback, while the chart path continues to use only current players for non-Solo results.

Automated tasks 2.1–2.5 are complete. The existing manual observations predate this fix: their first-run observation says the panel displayed “Nouveau meilleur score,” which conflicts with the corrected behavior. The manual verifier must repeat the affected result-panel checks (at least first run and replay) on this code state and update the manual evidence before the workflow can advance. This automated report makes no claim that the corrected panel was manually observed.

## Manual verification

**Status: blocked (one persistence scenario remains unverified).** The observations in the first table below are from the initial UI pass and are superseded for first-run Ghost feedback by the post-fix re-verification at the end of this section. Manual checks were performed on branch `feat/fix-first-play-statistics`; no remote production service was used.

### Observed scenarios

| Scenario | Steps and expected result | Observed result | Status |
| --- | --- | --- | --- |
| First qualified Solo run | Select Solo and a Cinema text, enter the matching text, then finish. Live WPM/accuracy remain visible; the result chart shows the current series only and no historical comparison; the qualified result becomes the reference. | While typing, the UI showed `151 WPM` and `100%` accuracy. The result showed `152 WPM`, the chart legend contained only `P1`, and ghost feedback said `Nouveau meilleur score`. There was no historical comparison line. | Passed |
| Worse replay, then improvement over replay but below original best | Replay the same exact text with a weaker run, then replay again with a better run that remains below the first best. Both should compare to the unchanged best. | First result: `15 WPM`, chart legend `P1 Meilleur run précédent`, ghost `152 WPM`. Next result: `18 WPM`, still below the original best; it again showed `P1 Meilleur run précédent` and ghost `152 WPM`. The reference did not move to the intervening 15 WPM run. | Passed |
| New best promotion and subsequent replay | On another exact Cinema passage, establish a qualified best, beat it, then start a subsequent replay. The new run should be promoted and used as the next comparator. | A qualified run ended at `151 WPM` with `Nouveau meilleur score`. The next run showed live `256 WPM` against the ghost's `151 WPM`; its result showed the prior ghost at `151 WPM`, `Nouveau meilleur score`, and a `+105` score delta. The following replay displayed the ghost at `256 WPM`; after a weaker run, the result showed `Vous 9 WPM` against `Votre record 256 WPM` and legend `P1 Meilleur run précédent`. | Passed |
| Never-played text and zero-input result | Change category to a new Culture text and finish without typing. Current statistics/chart should remain visible without historical comparison or a best. | The zero-input result displayed `0 WPM`, `0%`, a chart with only `P1`, and no ghost lane or historical line. | Passed for visible result; played-marker persistence not visually observable |
| Ghost, retry, and change-text flows | Observe ghost competitor/result feedback on a replay, retry, and use change-text to choose another category. | The ghost occupied its own lane and was named `Votre record`; results showed record comparison and `Nouveau meilleur score` feedback. `Réessayer ce texte` restarted the game and retained its text. `Changer de texte` returned to category selection, and a different category loaded a different passage. | Passed |

### Remaining manual check

The browser UI selects a random passage when a category is chosen and exposes no control to select a particular exact passage. After refresh, choosing Cinema produced a different full text composition from the one with the stored best, so this session could not confirm by UI that a best is restored after refresh and reselection of the **same exact full text**. The production code and automated tests cover storage restoration, but those are not manual observations. The zero-input result also does not expose a separate played marker in the UI.

Contributor check: in the same browser profile, complete and qualify a specific exact passage, note the entire displayed passage and its best result, refresh the page, choose Solo and the same category, and repeat category selection until the entire passage matches. Start the run; expected: the best ghost/reference is restored at run start and the result compares against that saved best. Also verify a zero-input run is marked played in the app's persisted state while leaving any qualified best unchanged. Until those observations are recorded, manual verification remains blocked and task 3.4 stays pending.

No application code, tests, or acceptance criteria were changed during manual verification.

### Post-fix re-verification

Tested state: HEAD `ae27be4221ed4f2b7d01044032cc341bb466e3f9` plus the current working-tree changes. `public/client.js` SHA-256: `aa72db06a9b2ed3d2d4805482350880d191d164c84737adb3db886cef3a881ec`; `public/solo-progress.js` SHA-256: `309bc4db54d9eb281186db530d50fb4701917fb86f62dc5e6d4694f97579e362`. Environment: Node.js `v22.23.1`, npm `10.9.8`, coordinator's existing server at `http://localhost:3000/`, Chrome. In-app Browser was unavailable, so I used a new Chrome tab (tab `406136651`) separate from the user's existing TypeDash tab; both tabs share the Chrome profile. I did not operate the user's tab or stop the coordinator's server.

| Scenario | Steps and expected result | Observed result | Status |
| --- | --- | --- | --- |
| Fresh first Solo run after the UI correction | Start a never-used Gastronomie passage, type its matching text, and finish. Live stats and a current-only result chart should appear, with no first-run Ghost panel or historical progression. | While typing, the page showed `185 WPM` and `100%` accuracy. The result showed `157 WPM` and `100%`; the chart legend contained only `P1`. There was no `ghost-result-feedback`, no `Nouveau meilleur score` panel, no Ghost lane, and no historical series. | Passed |
| Replay uses the local best when server Ghost feedback is absent | Retry that exact passage and leave it empty. The run is below the qualification threshold, so the server returns no qualified `ghostResult`; the client should still compare against the local best captured at run start. | The result showed `0 WPM`, `0%`, `Votre record 157 WPM`, chart legend `P1 Meilleur run précédent`, and `Record non battu` with `-157` WPM/score and `-100%` accuracy. The local comparison remained visible despite the absent qualified server Ghost feedback. | Passed for local comparison with absent server feedback |

The UI flow did not produce a conflicting stale server `new-best` result: a new room starts without the server's prior Ghost, and random category selection does not let the tester choose a known exact saved passage after refresh. The available UI therefore did not let this pass independently demonstrate a stale, conflicting server feedback payload. The automated test `Solo result panel is absent on first run and replay feedback uses the local best over stale server feedback` explicitly supplies stale server feedback and verifies that the local best wins; that automated evidence remains separate from manual observation. Exact-text restoration after refresh also remains unverified manually for the same random passage-selection reason; task 3.4 stays pending.

The new Chrome tab was closed after verification. The coordinator's server and the user's original browser tab were left running and untouched.

### Progress calculation follow-up

During further testing, I found that the client split target text on literal spaces while the server counted normalized whitespace-separated words. Also, submitting an extra space with an empty input advanced `currentWordIndex`, which could inflate progress without consuming a target word. The client now uses normalized target tokens, calculates progress through a bounded helper shared by its tests, and ignores empty space submissions.

| Check | Result |
| --- | --- |
| `node test/typing-analysis.test.js` | Passed: 7 tests, including normalized token counts, progress bounds, and empty-space detection. |
| `node --test test/default-usernames.test.js test/player-display.test.js test/solo-progress.test.js test/typing-analysis.test.js` | Passed: 4 files, 0 failures. |
| `node --check public/client.js && node --check public/typing-analysis.js` | Passed. |
| `git diff --check` | Passed. |
| Full `npm test` | Not verified for this follow-up: the integration suite could not bind its loopback test server in this sandbox (`listen EPERM: operation not permitted 127.0.0.1`). The previous full run passed before this follow-up. |

The added tests exercise the normalized counter and empty-submission predicate used by the input handler. A manual browser regression was not run for this follow-up.
