# scoreboard-podium Specification

## Purpose
Define live ranking behavior, overtake feedback, and the final podium and standings presentation.

## Requirements
### Requirement: Live leaderboard rankings
The system MUST dynamically calculate and sort the standings of all active players in real-time based on their current typing scores (WPM * Accuracy / 100).

#### Scenario: Standings update on progress
- **WHEN** players type and emit progress updates
- **THEN** the client leaderboard panel SHALL instantly sort the players list in descending order of their current calculated scores

### Requirement: Standings drop sound alert
The system MUST play a distinct high-stakes beep sound whenever an opponent's score overtakes the user's score and causes the user's standing rank to decrease.

#### Scenario: Overtake sound triggers
- **WHEN** an opponent's score increases and exceeds the player's active score, lowering the player's standing from 1st to 2nd place
- **THEN** the client browser SHALL play the alert oscillator sound immediately

### Requirement: Glassmorphic podium results display
At the end of the game timer, the system MUST render a 3D-styled glassmorphic podium displaying the names and stats of up to the top 3 players, accompanied by a detailed scoreboard table for participants ranked 4th through 6th when present.

#### Scenario: Results for a six-player game
- **WHEN** the 60-second timer expires in a game with 6 players
- **THEN** the client interface SHALL show the 1st, 2nd, and 3rd place players in Gold, Silver, and Bronze styled glass containers followed by detailed rows for the 4th, 5th, and 6th place players

#### Scenario: Results for fewer than four players
- **WHEN** the timer expires in a game with 1, 2, or 3 players
- **THEN** the client interface SHALL render only the available podium positions and SHALL hide the additional standings table

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
