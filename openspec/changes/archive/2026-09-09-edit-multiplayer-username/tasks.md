## 1. Server-side multiplayer name state

- [x] 1.1 Replace the hardcoded surname list with a bundled editable `data/default-usernames.txt` file and a server-startup loader that enforces UTF-8 decoding, BOM/line-ending support, full-line comments, trim/deduplication rules, 1–10 Unicode-character entries, warnings for skipped lines, and a fail-fast error when no valid entries are available.
- [x] 1.2 Randomly select multiplayer defaults only from the startup-loaded valid file entries; document beside the file and in project documentation that edits require a server restart and do not alter existing player names. Preserve existing role, readiness, Solo, and rename validation behavior.
- [x] 1.3 Implement the `changeUsername` Socket.IO handler: authorize only the connected player in a multiplayer waiting room, trim and validate a 1–10 Unicode-character string, broadcast accepted `usernameUpdated` player lists, and return non-destructive `usernameError` feedback for invalid submissions.

## 2. Multiplayer interface and shared rendering

- [x] 2.1 Add an accessible waiting-room username editor with an explicit 10-character limit, submit action, and inline error feedback that does not reset room context.
- [x] 2.2 Consume name synchronization events and render multiplayer usernames via safe text insertion in lobby cards, racetrack labels, podium positions, and standings, while retaining existing Solo labels and role-based host controls.

## 3. Automated coverage

- [x] 3.1 Add deterministic parser and server tests covering UTF-8/BOM and LF/CRLF handling, blank lines, full-line comments, trimming, 1–10 Unicode-character validation, duplicate deduplication, inline-`#` behavior, file-backed default membership, and missing/unreadable/malformed/empty-file startup failure; retain coverage for rename validation and countdown lock.
- [x] 3.2 Re-run `npm test` and `openspec validate edit-multiplayer-username --strict --no-interactive`; record the commands, outcomes, and covered acceptance criteria in `openspec/changes/edit-multiplayer-username/verification.md`.

## 4. Manual verification

- [x] 4.1 Run the application with separate host and guest browser sessions; verify each receives a visible suggestion from the editable bundled file without network access, successful 10-character rename synchronization, and inline feedback for an invalid value without leaving the room.
- [x] 4.2 Verify restart semantics using a safe temporary edit to the default-name file: entrants before restart retain the startup-loaded set, entrants after restart use the edited set, and existing players remain unchanged. Start a multiplayer race after accepting or replacing suggestions and verify names appear safely in the lobby, racetrack, podium, and standings; verify Solo flow and host/ready controls still behave as before. Restore the checked-in file and record environment, steps, expected and observed results, and pass/fail status in `openspec/changes/edit-multiplayer-username/verification.md`.
