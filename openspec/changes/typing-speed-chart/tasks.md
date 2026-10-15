## 1. Implementation

- [x] 1.1 Add bounded per-player elapsed-time WPM sampling for Solo and multiplayer games, including a final point, without breaking Solo ghost snapshots.
- [x] 1.2 Capture validated incorrect-word events and actual character deletion events with player identity, word index, and elapsed time; exclude deletion key presses that do not change input and include both event types in the completed result payload.
- [x] 1.3 Add a responsive, visually polished results chart with a labeled curve per human player, time/WPM axes, legend, red incorrect-word markers, and orange deletion markers; preserve podium, standings, and ghost feedback.

## 2. Automated Verification

- [x] 2.1 Add/run automated coverage proving per-player measurements are ordered and no more than 1000 ms apart, include the terminal point, and remain bounded for supported game durations.
- [x] 2.2 Add/run automated coverage for incorrect submitted words, actual Backspace/Delete deletions, no-op deletion keys, ordinary typing, and ownership of both event types in multiplayer.
- [x] 2.3 Verify result payload compatibility, fresh data per run/room, and unchanged scoring and Solo ghost behavior; record commands and outcomes in `verification.md`.

## 3. Manual Verification

- [x] 3.1 Run Solo games with a submitted incorrect word, a corrected partial typo, a character deletion, and a deletion key press with no effect; confirm red/orange marker placement and that no-op deletion creates no orange marker.
- [x] 3.2 Run a multiplayer game in separate browser sessions with at least two players; confirm every player has a distinct curve and only their own red error and orange hesitation markers, including a player who pauses typing.
- [x] 3.3 Check the results layout on a narrow viewport and confirm replay/new-game flows clear prior chart data while podium, standings, and Solo ghost feedback still work; record environment and observations in `verification.md`.
