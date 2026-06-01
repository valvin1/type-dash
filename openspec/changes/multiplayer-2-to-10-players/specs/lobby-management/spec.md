## ADDED Requirements

### Requirement: Room capacity limit of 10
The system MUST restrict each multiplayer room to a maximum of 10 concurrent players, rejecting any additional connection attempts once the limit is reached.

#### Scenario: Block eleventh player from joining
- **WHEN** 10 players have already joined room `room-123`
- **THEN** the server SHALL reject any further connection requests for `room-123` and emit a `'error'` event with message `'Room is full'` to the eleventh player

### Requirement: Dynamic Host assignment and promotion
The system MUST designate the first player joining a room as the Host. If the Host disconnects, the system MUST automatically promote the next connected player to the Host role and broadcast the updated player list.

#### Scenario: Automatic host promotion upon disconnect
- **WHEN** Host `P1` disconnects from the room
- **THEN** the server SHALL assign the Host role to the next player in the array (`players[0]`) and emit `'playerLeft'` with the updated player list

### Requirement: Host-Controlled start execution
The system MUST allow the Host to trigger the countdown launch only when at least 2 players in the room are marked as ready. Non-host players SHALL not have the ability to start the game.

#### Scenario: Host starts game with enough ready players
- **WHEN** at least 2 players (including the Host) have clicked "Ready" and the Host clicks the "Lancer la partie" button
- **THEN** the server SHALL start the 3-second countdown and broadcast `'countdown'` to all players in the room
