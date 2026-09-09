## 1. Server-side multiplayer name state

- [x] 1.1 Replace the `Pseudo-XXX` generator with random selection from an immutable offline curated list of at least 10 distinct common French surnames, verify every source entry is 1–10 Unicode characters, and assign the selected surname to new multiplayer player records while preserving existing role, readiness, and Solo behavior.
- [x] 1.2 Implement the `changeUsername` Socket.IO handler: authorize only the connected player in a multiplayer waiting room, trim and validate a 1–10 Unicode-character string, broadcast accepted `usernameUpdated` player lists, and return non-destructive `usernameError` feedback for invalid submissions.

## 2. Multiplayer interface and shared rendering

- [x] 2.1 Add an accessible waiting-room username editor with an explicit 10-character limit, submit action, and inline error feedback that does not reset room context.
- [x] 2.2 Consume name synchronization events and render multiplayer usernames via safe text insertion in lobby cards, racetrack labels, podium positions, and standings, while retaining existing Solo labels and role-based host controls.

## 3. Automated coverage

- [x] 3.1 Update server integration tests to deterministically prove host and guest defaults belong to the bundled curated surname list, each list entry and emitted default satisfies the 10-Unicode-character limit, and the existing trimmed rename, invalid-input, and countdown-lock behavior remains intact.
- [x] 3.2 Re-run `npm test` and `openspec validate edit-multiplayer-username --strict --no-interactive`; record the commands, outcomes, and covered acceptance criteria in `openspec/changes/edit-multiplayer-username/verification.md`.

## 4. Manual verification

- [x] 4.1 Run the application with separate host and guest browser sessions; verify each receives a visible suggestion from the bundled French-surname list without network access, successful 10-character rename synchronization, and inline feedback for an invalid value without leaving the room.
- [x] 4.2 Start a multiplayer race after accepting or replacing surname suggestions and verify names appear safely in the lobby, racetrack, podium, and standings; verify Solo flow and host/ready controls still behave as before. Record environment, steps, expected and observed results, and pass/fail status in `openspec/changes/edit-multiplayer-username/verification.md`.
