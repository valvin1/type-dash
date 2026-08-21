# racetrack-progression Specification

## Purpose
Define how each player's typing progress is rendered and synchronized on the shared racetrack during a race.

## Requirements
### Requirement: Multi-lane progress track rendering
The system MUST dynamically generate a horizontal racing lane for each active player when the game transitions to the playing state, representing their typing progress visually.

#### Scenario: Racetrack creation at game start
- **WHEN** the game state shifts to `'playing'` in a room with 4 players
- **THEN** the client interface SHALL dynamically inject 4 horizontal racetrack lanes, each displaying the corresponding player's initials and a unique color gradient track

### Requirement: Real-time progress translation
The system MUST smoothly update and slide each player's avatar horizontally along their designated racetrack lane upon receiving a progress change event.

#### Scenario: Real-time progress synchronization
- **WHEN** player `P2` sends an `'updateProgress'` socket event with a progress value of `50%` and WPM of `80`
- **THEN** the client interface SHALL instantly animate `P2`'s racer avatar to the middle of their track and update their displayed speed to `80 WPM`

### Requirement: Visual cursor isolation
The system MUST isolate the typing cursor visual highlights inside the main typing block so that only the player's own active typing cursor is displayed on the words, preventing visual overlay of other players' cursors.

#### Scenario: Opponent cursors hidden on text block
- **WHEN** player types the target text and opponents progress through the text
- **THEN** the main word display SHALL only highlight the active user's typing position and completely hide other players' specific highlights on the words
