## ADDED Requirements

### Requirement: Distinct Solo ghost lane
The system MUST render an available Solo ghost as a synthetic racetrack opponent with a dedicated lane, a 👻 avatar, a “Votre record” label, and styling that is visually distinct from connected players.

#### Scenario: Solo retry renders a ghost lane
- **WHEN** the countdown begins for a Solo retry with a retained ghost
- **THEN** the racetrack SHALL render the player's lane and a separate translucent ghost lane without adding the ghost to the connected-player list

### Requirement: Recorded ghost progress animation
The system MUST update the ghost lane's progress and live WPM from its timestamped snapshots on the recorded relative timeline.

#### Scenario: Ghost snapshot updates its lane
- **WHEN** a ghost snapshot becomes due during a Solo retry
- **THEN** the client SHALL animate the ghost avatar to the snapshot progress and display the snapshot WPM
