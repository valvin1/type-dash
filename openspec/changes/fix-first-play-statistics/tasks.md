## 1. Implementation

- [x] 1.1 Derive a stable key from exact text content and persist a validated Solo record per browser profile, with separate `played` marker and `best` qualified run summary/timeline.
- [x] 1.2 Keep first-run live indicators and current-run chart visible; show no historical comparison or delta feedback until a qualified same-text best exists.
- [x] 1.3 Reuse the ghost best-run ordering (score, then progress, then accuracy) and qualification threshold (at least three correct words) for the persistent comparison reference.
- [x] 1.4 At each run start snapshot the current best as that run's comparator; at completion mark every run as played, but promote only a qualified run that beats the snapshot. Keep current-run timeline separate from stored best timeline.
- [x] 1.5 Preserve existing live metrics, scoring, standings, ghost lane, and multiplayer results; use safe in-memory fallback if local storage is unavailable or invalid.
- [x] 1.6 Build Solo result comparison feedback and deltas only from the qualified best captured at run start; keep the server ghost lane and non-Solo result feedback behavior unchanged.
- [x] 1.7 Calculate progress from normalized target words and ignore empty submissions so repeated spaces cannot advance progress.

## 2. Automated Verification

- [x] 2.1 Verify first-run live/result statistics are visible without historical comparison and that a qualified first run is saved as the initial best.
- [x] 2.2 Verify a later run compares to the stored best; cover a worse run then a run better than the immediately prior run but worse than the best, and confirm the best remains unchanged.
- [x] 2.3 Verify score/progress/accuracy tie-breaks match `isBetterRun`, and only runs with at least three correct words can become best.
- [x] 2.4 Verify zero-input and incomplete runs mark text as played and display current stats without creating/replacing a qualified best; a different unplayed text remains without comparison.
- [x] 2.5 Verify refresh/reselection restores same-content best data, timeline data is not mixed across runs, and malformed/unavailable storage does not break play; record commands and outcomes in `verification.md`.
- [x] 2.6 Verify normalized word counting matches the server and extra spaces do not submit an empty word or increase progress.

## 3. Manual Verification

- [x] 3.1 Play a first Solo text and confirm live WPM/accuracy/progress and the final current-run chart appear, with no historical comparison; confirm the qualified run becomes the reference.
- [x] 3.2 Replay the text with a worse result, then improve over that replay but remain below the original best; confirm both comparisons remain against the original best and it is not replaced.
- [x] 3.3 Beat the stored best and confirm the current run becomes the reference for the next replay; choose a never-played text and confirm no historical comparison appears.
- [ ] 3.4 Complete a zero-input or incomplete run and confirm it counts as played but does not create/replace a best; refresh and reselect identical content to confirm the best is retained. Record environment and observations in `verification.md`.
