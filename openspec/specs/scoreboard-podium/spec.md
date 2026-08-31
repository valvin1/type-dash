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
