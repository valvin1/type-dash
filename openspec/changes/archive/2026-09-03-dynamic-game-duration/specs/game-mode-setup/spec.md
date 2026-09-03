## ADDED Requirements

### Requirement: Game duration selection
The system MUST allow selecting a game duration among discrete presets (15s, 30s, 45s, 60s) in the pre-race waiting area, defaulting to 30 seconds for newly created Solo and Multiplayer rooms.

#### Scenario: Default duration on room creation
- **WHEN** a player creates a new Solo or Multiplayer room
- **THEN** the server SHALL initialize the room duration to 30 seconds and the client SHALL render 30 seconds as the active preset

#### Scenario: Solo player changes duration preset
- **WHEN** a Solo player in the waiting screen selects a duration preset (15s, 45s, or 60s)
- **THEN** the system SHALL update the active duration for the upcoming run and clear any existing ghost data

## MODIFIED Requirements

### Requirement: Solo setup flow
The system MUST create a one-player solo game and take the player directly to theme selection without exposing multiplayer sharing, participant-grid, ready-state, or removal controls, and after a completed run MUST offer separate actions to retry the exact text or change text.

#### Scenario: Player selects Solo
- **WHEN** the player selects Solo on the initial screen
- **THEN** the system SHALL create a solo game, hide multiplayer room controls, and present theme selection before the countdown can begin

#### Scenario: Solo retry preserves text and ghost
- **WHEN** a solo game finishes and the player selects “Réessayer ce texte”
- **THEN** the system SHALL retain Solo mode, the exact theme, text, and duration, and the best eligible ghost, reset the player run state, and start a new countdown

#### Scenario: Solo player changes text
- **WHEN** a solo game finishes and the player selects “Changer de texte”
- **THEN** the system SHALL retain Solo mode, clear the theme, text, and ghost, and return the player to theme selection without showing the initial multiplayer setup
