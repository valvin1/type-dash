## ADDED Requirements

### Requirement: Generated provisional multiplayer username
The system MUST assign every player entering a multiplayer room a server-randomly-selected username from an offline, source-controlled curated list of common French surnames, and MUST include that username in player data sent to room members. The list MUST contain at least 10 distinct entries, each entry MUST contain from 1 through 10 Unicode characters, and the selected username MUST be an editable display-name suggestion only; it MUST NOT identify, authenticate, profile, or imply characteristics of the player.

#### Scenario: Host receives an offline surname suggestion
- **WHEN** a client creates a multiplayer room
- **THEN** its `roomData` player record SHALL contain a username selected from the curated local surname list and that name SHALL contain no more than 10 Unicode characters

#### Scenario: Guest receives an offline surname suggestion
- **WHEN** a client joins an existing multiplayer waiting room
- **THEN** the joining client and existing room members SHALL receive player data containing the guest’s randomly selected username from the curated local surname list

#### Scenario: Suggested names require no external lookup
- **WHEN** a player creates or joins a multiplayer room while the application has no network access
- **THEN** the server SHALL assign a username from the bundled curated list without making a network request

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
