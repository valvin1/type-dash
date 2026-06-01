## ADDED Requirements

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
At the end of the game timer, the system MUST render a 3D-styled glassmorphic podium displaying the names and stats of the top 3 players, accompanied by a detailed scoreboard table for all other participants.

#### Scenario: Podium rendering at end game
- **WHEN** the 60-second timer expires
- **THEN** the client interface SHALL transition to the results screen and inject the 1st, 2nd, and 3rd place players into Gold, Silver, and Bronze styled glass containers, followed by a listing of the 4th through 10th place players' detailed scores
