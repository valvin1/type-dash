# lobby-management Specification

## Purpose
Define multiplayer room capacity, host succession, and the authorization rules that control when a race may start.
## Requirements
### Requirement: Configurable room capacity from 2 to 6
The system MUST enforce each multiplayer room's host-selected maximum capacity, which MUST be an integer from 2 through 6, and reject connections once that room-specific capacity is reached.

#### Scenario: Block a player beyond the selected capacity
- **WHEN** 4 players have already joined a multiplayer room whose `maxPlayers` is 4
- **THEN** the server SHALL reject another connection request for that room and emit a `'roomError'` event with message `'Le salon est complet'` to that player

#### Scenario: Capacity remains unchanged on replay
- **WHEN** players request a replay in a multiplayer room whose `maxPlayers` is 5
- **THEN** the server SHALL reset the game state while retaining `maxPlayers` equal to 5

### Requirement: Dynamic Host assignment and promotion
The system MUST designate the first player joining a room as the Host. If the Host disconnects, the system MUST automatically promote the next connected player to the Host role and broadcast the updated player list.

#### Scenario: Automatic host promotion upon disconnect
- **WHEN** Host `P1` disconnects from the room
- **THEN** the server SHALL assign the Host role to the next player in the array (`players[0]`) and emit `'playerLeft'` with the updated player list

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

### Requirement: Host duration selection and synchronization
The system MUST allow only the Host to change the game duration in a multiplayer waiting room among valid presets (15s, 30s, 45s, 60s), and MUST broadcast the updated duration immediately to all connected players in the room.

#### Scenario: Host changes duration preset
- **WHEN** the Host selects an allowed duration preset (15s, 45s, or 60s) while the multiplayer room is waiting
- **THEN** the server SHALL update the room's duration and broadcast `'durationUpdated'` with the new value to all connected players in the room

#### Scenario: Non-host duration change attempt is rejected
- **WHEN** a non-host player attempts to emit a duration change event
- **THEN** the server SHALL reject or ignore the update and keep the room duration unchanged

#### Scenario: Invalid duration value is rejected
- **WHEN** a client submits a duration value other than 15, 30, 45, or 60
- **THEN** the server SHALL keep the existing room duration unchanged and SHALL NOT broadcast an update

### Requirement: Generated provisional multiplayer username
The system MUST assign every player entering a multiplayer room a server-randomly-selected username from the valid entries in the bundled editable `data/default-usernames.txt` file, and MUST include that username in player data sent to room members. Each selected username MUST contain from 1 through 10 Unicode characters and MUST be an editable display-name suggestion only; it MUST NOT identify, authenticate, profile, or imply characteristics of the player.

#### Scenario: Host receives a file-backed suggestion
- **WHEN** a client creates a multiplayer room
- **THEN** its `roomData` player record SHALL contain a username selected from the valid entries in `data/default-usernames.txt` and that name SHALL contain no more than 10 Unicode characters

#### Scenario: Guest receives a file-backed suggestion
- **WHEN** a client joins an existing multiplayer waiting room
- **THEN** the joining client and existing room members SHALL receive player data containing the guest’s randomly selected username from the valid entries in `data/default-usernames.txt`

#### Scenario: Suggested names require no external lookup
- **WHEN** a player creates or joins a multiplayer room while the application has no network access
- **THEN** the server SHALL assign a username from the bundled local file without making a network request

### Requirement: Editable default-username file format
The system MUST load default multiplayer usernames from `data/default-usernames.txt` once at server startup. The file MUST be decoded as UTF-8; an optional leading UTF-8 byte-order mark and either LF or CRLF line endings MUST be accepted. A line whose first non-whitespace character is `#`, and every blank or whitespace-only line, MUST be ignored. Each other line MUST be trimmed and accepted only if it contains from 1 through 10 Unicode characters. Inline `#` characters MUST be treated as ordinary entry characters. Duplicate accepted entries MUST be deduplicated case-sensitively, retaining the first occurrence. Invalid and duplicate lines MUST be skipped with a startup warning that identifies the line number.

#### Scenario: Operators add values and annotations
- **WHEN** an operator adds `  Sprinter  `, a blank line, and `  # summer event names` to `data/default-usernames.txt`
- **THEN** `Sprinter` SHALL be eligible for random selection and the blank and comment lines SHALL not become usernames

#### Scenario: Invalid and duplicate lines do not poison a usable file
- **WHEN** the file contains a valid `Dash`, a duplicate ` Dash `, and an 11-Unicode-character entry
- **THEN** only one `Dash` entry SHALL be eligible for selection and the server SHALL warn for the duplicate and overlong lines

#### Scenario: File encoding or contents cannot produce a valid default
- **WHEN** `data/default-usernames.txt` is missing, unreadable, malformed UTF-8, or contains no valid distinct entries after parsing
- **THEN** the server SHALL fail to start and report a configuration error that identifies the file and reason

### Requirement: Default-name file restart semantics
The system MUST retain the valid default-name entries loaded at startup for the lifetime of the server process. Editing `data/default-usernames.txt` while the server is running MUST NOT modify existing player names or affect new entrants until the server is restarted. The file format and restart requirement MUST be documented for operators without requiring code changes.

#### Scenario: Operator edits the file while the server is running
- **WHEN** an operator changes the valid entries in `data/default-usernames.txt` after the server has started
- **THEN** existing players and players who join before restart SHALL continue to use the startup-loaded entries, and only a server restarted after the edit SHALL use the changed entries

### Requirement: Owner-controlled multiplayer username change
The system MUST allow a connected multiplayer player to change only their own username while the room is waiting. The server MUST trim the submitted string and accept it only when it contains from 1 through 10 Unicode characters. On an accepted change, the server MUST retain the trimmed username and broadcast `usernameUpdated` with the current player list to every room member.

#### Scenario: Player changes their username successfully
- **WHEN** a waiting-room guest submits `Léa` through the username-change event
- **THEN** the server SHALL replace only that guest’s username with `Léa` and every room member SHALL receive `usernameUpdated` containing `Léa`

#### Scenario: Whitespace is removed before saving
- **WHEN** a waiting-room player submits `  Dash  `
- **THEN** the server SHALL save and broadcast `Dash`

#### Scenario: Invalid username is rejected without changing state
- **WHEN** a waiting-room player submits an empty or whitespace-only username, a username longer than 10 Unicode characters, or a non-string value
- **THEN** the server SHALL retain the existing username, SHALL not broadcast `usernameUpdated`, and SHALL emit `usernameError` to the submitting player

#### Scenario: Rename request after the room leaves waiting is ignored
- **WHEN** a player submits a username-change event after multiplayer countdown has started
- **THEN** the server SHALL retain every username and SHALL not broadcast `usernameUpdated`

### Requirement: Multiplayer username editing control
The multiplayer waiting-room interface MUST show the local player’s current username in an editable control with a visible 10-character limit and a way to submit the change. It MUST display the server’s `usernameError` feedback without leaving the room and MUST refresh the control from accepted synchronized player data.

#### Scenario: Invalid name feedback keeps the player in the lobby
- **WHEN** the local player submits an invalid username and receives `usernameError`
- **THEN** the interface SHALL keep the player in the waiting room, show the error near the username control, and retain the last accepted username

#### Scenario: A player sees another participant’s new name
- **WHEN** a room member receives `usernameUpdated` after another player changes their name
- **THEN** the lobby card for that participant SHALL show the updated username

