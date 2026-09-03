## MODIFIED Requirements

### Requirement: Glassmorphic podium results display
At the end of the game timer, the system MUST render a 3D-styled glassmorphic podium displaying the names and stats of up to the top 3 players, accompanied by a detailed scoreboard table for participants ranked 4th through 6th when present.

#### Scenario: Results for a six-player game
- **WHEN** the configured game timer expires in a game with 6 players
- **THEN** the client interface SHALL show the 1st, 2nd, and 3rd place players in Gold, Silver, and Bronze styled glass containers followed by detailed rows for the 4th, 5th, and 6th place players

#### Scenario: Results for fewer than four players
- **WHEN** the timer expires in a game with 1, 2, or 3 players
- **THEN** the client interface SHALL render only the available podium positions and SHALL hide the additional standings table
