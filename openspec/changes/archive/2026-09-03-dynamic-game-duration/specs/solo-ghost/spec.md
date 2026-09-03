## MODIFIED Requirements

### Requirement: Session-scoped ghost lifetime
The system MUST keep ghost data only in the current in-memory Solo room and MUST clear it when the text, theme, or game duration changes, the Solo room ends, or the player disconnects or refreshes.

#### Scenario: Changing text clears the ghost
- **WHEN** a Solo player chooses to change text after a run
- **THEN** the system SHALL clear the retained ghost before returning to theme selection

#### Scenario: Changing duration clears the ghost
- **WHEN** a Solo player changes the game duration preset
- **THEN** the system SHALL clear the retained ghost data from the room

#### Scenario: Disconnect clears the Solo ghost
- **WHEN** the Solo player disconnects or refreshes and its one-player room ends
- **THEN** the system SHALL delete the room and its ghost data

#### Scenario: Ghosts are isolated between Solo rooms
- **WHEN** two Solo rooms run concurrently
- **THEN** each room SHALL expose only its own current-text ghost and run history
