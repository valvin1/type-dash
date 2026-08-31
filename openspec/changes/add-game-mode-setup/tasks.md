## 1. Server-side room configuration

- [ ] 1.1 Replace the fixed 10-player limit with validated room configuration fields `mode` and `maxPlayers`, allowing solo capacity 1 and multiplayer capacities 2 through 6.
- [ ] 1.2 Add an authoritative `createRoom` flow that validates the room identifier and configuration, rejects collisions, creates the configured room, and assigns its creator as P1/Host.
- [ ] 1.3 Change `joinRoom` to join only existing waiting multiplayer rooms, reject missing or solo rooms, and enforce each room's configured capacity.
- [ ] 1.4 Include `mode` and `maxPlayers` in room state sent to clients and preserve both fields when resetting a room for replay.

## 2. Server-side launch and host controls

- [ ] 2.1 Update `startGame` authorization to require the Host, at least two connected players, and every connected player's ready state before synchronously entering countdown.
- [ ] 2.2 Add a validated `removePlayer` handler restricted to the Host and waiting multiplayer rooms, removing only another current member and notifying both the target and remaining players.
- [ ] 2.3 Centralize player removal and role reindexing so host removal, disconnect handling, capacity release, and player-list broadcasts remain consistent.
- [ ] 2.4 Ensure admissions and removal requests are rejected after the room leaves the waiting state.

## 3. Initial setup and lobby interface

- [ ] 3.1 Replace the single create button with explicit Solo and Multijoueur choices and add an accessible capacity selector from 2 to 6 with 2 selected by default.
- [ ] 3.2 Implement client creation requests for both modes while preserving direct `joinRoom` behavior for invitation URLs.
- [ ] 3.3 Adapt the solo setup to show theme selection and launch controls without room sharing, participant slots, ready-state controls, or removal actions.
- [ ] 3.4 Render exactly `maxPlayers` lobby slots in multiplayer and add Host-only removal controls to occupied non-host slots.
- [ ] 3.5 Handle `removedFromRoom` by clearing local room state, removing the invitation parameter, returning to the initial screen, and displaying the removal explanation.
- [ ] 3.6 Drive the Host launch button from the same minimum-player and unanimous-readiness rules enforced by the server, including updates after joins, removals, and disconnects.
- [ ] 3.7 Adjust responsive lobby, racetrack, podium, and standings presentation and copy for the new global maximum of 6 players.

## 4. Automated verification and documentation

- [ ] 4.1 Add integration tests for valid Solo and Multijoueur creation, invalid capacities, room identifier collisions, expired invitations, and attempts to join solo rooms.
- [ ] 4.2 Add integration tests proving room-specific capacities from 2 to 6 are enforced and a seventh player cannot join any room.
- [ ] 4.3 Add integration tests for unanimous readiness, minimum player count, non-host start rejection, readiness invalidation on join, and admission rejection during countdown.
- [ ] 4.4 Add integration tests for successful Host removal and rejection of self-removal, non-host removal, unknown targets, and removal after countdown.
- [ ] 4.5 Add integration coverage proving Solo starts with one player and replay preserves each room's mode and capacity.
- [ ] 4.6 Update the README to describe the initial mode choice, configurable 2-to-6-player rooms, unanimous readiness, and Host removal behavior.
- [ ] 4.7 Run the complete automated test suite and perform a browser smoke test of Solo, multiplayer invitation, player removal, full-room rejection, launch, results, and replay flows.
