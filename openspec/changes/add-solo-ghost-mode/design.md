## Context

TypeDash keeps each room in the Node.js process and sends progress through Socket.IO. Solo rooms currently use the same single-player collection as multiplayer, finish only through the normal game timer, and reset both the theme and text on replay. The browser owns typing calculations and the visual race, while the server validates and relays progress.

Ghost data must remain scoped to one Solo room and one exact text, must not count as a connected player, and must disappear with the room. The feature crosses server state, Socket.IO payloads, race rendering, rankings, results, and integration tests.

## Goals / Non-Goals

**Goals:**

- Record a trustworthy server-relative timeline from eligible, normally finished Solo runs.
- Retain only the best run for the current text with deterministic comparison rules.
- Reuse the existing race, ranking, alert, podium, and score concepts for a synthetic opponent.
- Preserve the exact text and ghost on retry, while providing an explicit action that clears both and returns to theme selection.
- Keep multiplayer behavior and one-player Solo validation unchanged.

**Non-Goals:**

- Persist ghosts in browser storage, a database, or across refreshes.
- Add accounts, leaderboards, ghost sharing, or server-authoritative anti-cheat scoring.
- Add a ghost to the room `players` collection or Socket.IO membership.

## Decisions

### Store ghost and current-run state separately on Solo rooms

Each Solo room receives `ghost` and `currentRun` fields alongside, not inside, `players`. A ghost contains the exact text, final score/WPM/accuracy/progress, correctly typed word count, and normalized snapshots. This preserves existing admission and one-player checks. Putting the ghost in `players` was rejected because it would affect capacity, readiness, disconnect, host, and Solo validation paths.

### Timestamp validated progress on the server

At `gameStarted`, the server initializes the Solo run with a monotonic start timestamp. Each validated Solo `updateProgress` stores a snapshot whose elapsed time is derived on the server and whose progress, WPM, and accuracy use the accepted payload. This prevents clients from supplying arbitrary replay timestamps and naturally preserves pauses and bursts. Constant-speed interpolation was rejected because it cannot reproduce the recorded typing cadence.

### Make correct-word count explicit

The client includes `correctWords` with Solo progress updates. The server validates it as an integer between zero and the reported word index/text word count and stores it on the player/current run. Existing multiplayer progress remains compatible and does not require the new field.

### Finalize and compare only in the normal end-game path

Only the timer-driven `endGame` path may create or replace a ghost. A Solo run is eligible when its final correct-word count is at least three. Eligible runs compare lexicographically by rounded score, progress, then accuracy; equality retains the existing ghost. The result payload includes the pre-update ghost, the current run, outcome, and signed metric differences, and only then is the room ghost updated. Disconnecting deletes the Solo room and therefore cannot finalize an interrupted run.

### Keep replay scheduling in the browser

The server sends the retained ghost with room data when the same text is retried. The browser creates a synthetic competitor with a reserved ID, renders a translucent 👻 lane, and schedules each snapshot relative to `gameStarted`. Every scheduled update flows through shared lane and ranking helpers, so existing overtake feedback is preserved. Timers are cancelled on reset, results, text change, and room-context clearing.

### Use explicit Solo result actions

`retrySoloText` resets the player and run state while preserving the room theme, exact text, and ghost. `changeSoloText` resets the player, clears the text/theme/ghost, and returns room data for theme selection. Existing `playAgain` remains the multiplayer replay path. This makes the data-lifetime boundary explicit at the server instead of relying only on UI state.

### Present the previous ghost in results

For a race that began with a ghost, the final standings combine the real player with the pre-update ghost used during that race. The comparison panel reports “Nouveau meilleur score” or “Record non battu” and signed differences for score, WPM, accuracy, and progress. The first eligible run reports a new best without adding a nonexistent ghost to its podium; an ineligible run shows no ghost-specific feedback.

## Risks / Trade-offs

- [Browser-calculated metrics can be manipulated] → Keep the existing trust model, validate ranges server-side, and explicitly leave anti-cheat out of scope.
- [Many snapshots increase room memory and result payload size] → Record only throttled/word-boundary updates already emitted by the client and bound stored snapshots to the text word count plus a small margin.
- [Delayed network messages slightly shift recorded timing] → Use server receive time consistently; ordering and pauses remain representative within normal Socket.IO latency.
- [Stale replay timers could update a later screen] → Track timeout handles and cancel them from every game/room reset path.
- [Protocol changes could regress multiplayer] → Gate all ghost logic on `room.mode === 'solo'`, retain multiplayer events, and add regression assertions.

## Migration Plan

Deploy server and static client together because the Solo result payload and actions are coordinated. Existing in-memory rooms disappear on restart, so there is no data migration. Rollback consists of restoring the previous server/client bundle; no persistent ghost data remains to clean up.

## Open Questions

None. Issue #2 defines the eligibility threshold, comparison order, lifetime, presentation, and storage boundaries needed for implementation.
