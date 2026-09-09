## MODIFIED Requirements

### Requirement: Glassmorphic podium results display
At the end of the game timer, the system MUST render a 3D-styled glassmorphic podium displaying the usernames and stats of up to the top 3 multiplayer players, accompanied by a detailed scoreboard table for multiplayer participants ranked 4th through 6th when present.

#### Scenario: Results for a six-player multiplayer game
- **WHEN** the configured game timer expires in a multiplayer game with 6 players who have chosen usernames
- **THEN** the client interface SHALL show the 1st, 2nd, and 3rd place players with their usernames in Gold, Silver, and Bronze styled glass containers followed by detailed rows using the usernames of the 4th, 5th, and 6th place players

#### Scenario: Results for fewer than four multiplayer players
- **WHEN** the timer expires in a multiplayer game with 1, 2, or 3 players
- **THEN** the client interface SHALL render only the available podium positions with each player’s username and SHALL hide the additional standings table
