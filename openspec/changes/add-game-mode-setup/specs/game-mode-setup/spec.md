## ADDED Requirements

### Requirement: Initial game mode selection
The system MUST present an explicit Solo or Multijoueur choice before creating a new game, while players opening an existing multiplayer invitation link MUST attempt to join that room directly.

#### Scenario: New visitor chooses a mode
- **WHEN** a player opens TypeDash without a room invitation parameter
- **THEN** the client SHALL display separate Solo and Multijoueur choices and SHALL NOT create a room until one is selected

#### Scenario: Invited player bypasses mode selection
- **WHEN** a player opens a valid invitation URL for an existing multiplayer room
- **THEN** the client SHALL attempt to join that room without asking the invited player to select a mode or capacity

### Requirement: Solo setup flow
The system MUST create a one-player solo game and take the player directly to theme selection without exposing multiplayer sharing, participant-grid, ready-state, or removal controls.

#### Scenario: Player selects Solo
- **WHEN** the player selects Solo on the initial screen
- **THEN** the system SHALL create a solo game, hide multiplayer room controls, and present theme selection before the countdown can begin

#### Scenario: Solo replay preserves mode
- **WHEN** a solo game finishes and the player requests a replay
- **THEN** the system SHALL retain Solo mode and return the player to theme selection without showing the initial multiplayer setup

### Requirement: Multiplayer capacity selection
The system MUST require the host to select a maximum capacity from 2 through 6 before creating a multiplayer room, with 2 selected by default in the interface.

#### Scenario: Host creates a four-player room
- **WHEN** the host selects Multijoueur, chooses a capacity of 4, and confirms creation
- **THEN** the server SHALL create a multiplayer room with `maxPlayers` equal to 4 and the client SHALL render exactly 4 participant slots

#### Scenario: Invalid capacity is rejected
- **WHEN** a client requests multiplayer room creation with a missing, non-integer, lower-than-2, or greater-than-6 capacity
- **THEN** the server SHALL reject the request with a room error and SHALL NOT create the room

### Requirement: Explicit room creation
The system MUST distinguish creating a configured game from joining an existing multiplayer room, and MUST NOT create a room implicitly from an invitation join request.

#### Scenario: Expired invitation is opened
- **WHEN** a player attempts to join a room identifier that does not correspond to an existing room
- **THEN** the server SHALL reject the join request with a clear unavailable-room error and SHALL NOT create a replacement room

#### Scenario: Solo room cannot be joined
- **WHEN** another client attempts to join the identifier of a solo game
- **THEN** the server SHALL reject the request and SHALL keep the solo game private
