## RENAMED Requirements

- FROM: `Room capacity limit of 10`
- TO: `Configurable room capacity from 2 to 6`

## MODIFIED Requirements

### Requirement: Configurable room capacity from 2 to 6
The system MUST enforce each multiplayer room's host-selected maximum capacity, which MUST be an integer from 2 through 6, and reject connections once that room-specific capacity is reached.

#### Scenario: Block a player beyond the selected capacity
- **WHEN** 4 players have already joined a multiplayer room whose `maxPlayers` is 4
- **THEN** the server SHALL reject another connection request for that room and emit a `'roomError'` event with message `'Le salon est complet'` to that player

#### Scenario: Capacity remains unchanged on replay
- **WHEN** players request a replay in a multiplayer room whose `maxPlayers` is 5
- **THEN** the server SHALL reset the game state while retaining `maxPlayers` equal to 5

### Requirement: Host-Controlled start execution
The system MUST allow only the Host to trigger the countdown, only while the room is waiting, only when at least 2 players are connected, and only when every connected player including the Host is ready.

#### Scenario: Host starts when every connected player is ready
- **WHEN** a multiplayer room contains at least 2 players, every connected player is ready, and the Host clicks "Lancer la partie"
- **THEN** the server SHALL transition the room out of the waiting state and broadcast the countdown to all players in the room

#### Scenario: One connected player is not ready
- **WHEN** at least one connected player is not ready and the Host attempts to start the game
- **THEN** the server SHALL keep the room in the waiting state and SHALL NOT broadcast a countdown

#### Scenario: Non-host attempts to start
- **WHEN** a non-host player emits the start command even though every connected player is ready
- **THEN** the server SHALL keep the room in the waiting state and SHALL NOT broadcast a countdown

## ADDED Requirements

### Requirement: Host removal of a waiting player
The system MUST allow the Host to remove another connected player from a multiplayer room while the room is waiting, and MUST reject removal requests from non-hosts, for the Host, for unknown targets, or after countdown has begun.

#### Scenario: Host removes a blocking player
- **WHEN** the room is waiting and the Host requests removal of another player in the same room
- **THEN** the server SHALL remove the target from the room, free the occupied capacity, notify the target with `'removedFromRoom'`, and broadcast the updated player list to the remaining players

#### Scenario: Removed player receives an explanation
- **WHEN** a client receives `'removedFromRoom'` after the Host removes it
- **THEN** the client SHALL return to the initial screen and display `'L’hôte vous a retiré de la partie'`

#### Scenario: Unauthorized removal is ignored
- **WHEN** a non-host, a player outside the room, or the Host targeting themself requests a removal
- **THEN** the server SHALL leave the room membership unchanged

#### Scenario: Removal after countdown is rejected
- **WHEN** the room is no longer waiting and the Host requests removal of a player
- **THEN** the server SHALL leave the room membership unchanged

### Requirement: Admission closes at countdown start
The system MUST reject new room admissions as soon as the room leaves the waiting state to begin its countdown.

#### Scenario: Invitation opened during countdown
- **WHEN** a player attempts to join a room whose countdown has begun
- **THEN** the server SHALL reject the connection with a room error and SHALL NOT add the player to the race

#### Scenario: New arrival invalidates readiness before countdown
- **WHEN** a player successfully joins a waiting room whose existing players were all ready
- **THEN** the new player SHALL enter as not ready and the Host SHALL no longer be able to start until every connected player is ready
