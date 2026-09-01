## ADDED Requirements

### Requirement: Ghost participates in Solo rankings
The system MUST include an active Solo ghost in live score-based rankings and existing overtake alert behavior as a synthetic opponent.

#### Scenario: Ghost overtakes the player
- **WHEN** a replayed ghost snapshot raises its score above the Solo player's live score and lowers the player's rank
- **THEN** the system SHALL update the rank display and play the existing overtake alert sound

### Requirement: Ghost participates in Solo results
The system MUST include the ghost raced during the completed Solo run in the existing result and podium presentation while keeping it visibly labeled as “Votre record”.

#### Scenario: Solo race against a ghost finishes
- **WHEN** a Solo retry that raced a ghost ends normally
- **THEN** the result standings SHALL rank the player and raced ghost by the existing score and display both with distinct identities

### Requirement: Solo record comparison feedback
The system MUST compare an eligible completed Solo run with the prior ghost after final metrics are available and MUST show signed differences for score, WPM, accuracy, and progress.

#### Scenario: Player sets a new best
- **WHEN** the eligible completed run outranks the prior ghost or is the first eligible run for the text
- **THEN** the results SHALL display “Nouveau meilleur score” with all four metric differences and the better run SHALL become the next retry's ghost only after calculation

#### Scenario: Player does not beat the record
- **WHEN** the eligible completed run does not outrank the prior ghost
- **THEN** the results SHALL display “Record non battu” with all four metric differences and SHALL keep the prior ghost unchanged

#### Scenario: Ineligible result has no ghost feedback
- **WHEN** a completed Solo run has fewer than three correctly typed words
- **THEN** the results SHALL omit record comparison messaging and metric differences
