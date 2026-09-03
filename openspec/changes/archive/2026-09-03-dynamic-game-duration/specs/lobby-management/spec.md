## ADDED Requirements

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
