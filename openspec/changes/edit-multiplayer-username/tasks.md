## 1. Server-side multiplayer name state

- [x] 1.1 Add a server-generated `Pseudo-XXX` username to newly created multiplayer player records while preserving existing role, readiness, and Solo behavior.
- [x] 1.2 Implement the `changeUsername` Socket.IO handler: authorize only the connected player in a multiplayer waiting room, trim and validate a 1–10 Unicode-character string, broadcast accepted `usernameUpdated` player lists, and return non-destructive `usernameError` feedback for invalid submissions.

## 2. Multiplayer interface and shared rendering

- [x] 2.1 Add an accessible waiting-room username editor with an explicit 10-character limit, submit action, and inline error feedback that does not reset room context.
- [x] 2.2 Consume name synchronization events and render multiplayer usernames via safe text insertion in lobby cards, racetrack labels, podium positions, and standings, while retaining existing Solo labels and role-based host controls.

## 3. Automated coverage

- [x] 3.1 Add or update server integration tests proving generated provisional names, valid trimmed rename broadcasts, rejection of empty/non-string/over-limit input without state mutation, and ignored renames once countdown has started.
- [x] 3.2 Run `npm test` and `openspec validate edit-multiplayer-username --strict --no-interactive`; record the commands, outcomes, and covered acceptance criteria in `openspec/changes/edit-multiplayer-username/verification.md`.

## 4. Manual verification

- [x] 4.1 Run the application with separate host and guest browser sessions; verify the generated `Pseudo-XXX` defaults, successful 10-character rename synchronization, and inline feedback for an invalid value without leaving the room.
- [x] 4.2 Start a multiplayer race after renaming participants and verify the selected usernames appear safely in the lobby, racetrack, podium, and standings; verify Solo flow and host/ready controls still behave as before. Record environment, steps, expected and observed results, and pass/fail status in `openspec/changes/edit-multiplayer-username/verification.md`.
