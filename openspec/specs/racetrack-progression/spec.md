# racetrack-progression Specification

## Purpose
Define how each player's typing progress is rendered and synchronized on the shared racetrack during a race.
## Requirements
### Requirement: Multi-lane progress track rendering
The system MUST dynamically generate a horizontal racing lane for each active player when the game transitions to the playing state, representing their typing progress visually. For multiplayer players, each lane MUST display that player’s synchronized username as its label.

#### Scenario: Racetrack creation with multiplayer usernames
- **WHEN** the game state shifts to `'playing'` in a room with 4 players whose usernames are `Léa`, `Max`, `Noa`, and `Zoe`
- **THEN** the client interface SHALL dynamically inject 4 horizontal racetrack lanes labeled `Léa`, `Max`, `Noa`, and `Zoe`, each with a unique color gradient track

#### Scenario: Name is rendered as text rather than markup
- **WHEN** a multiplayer player’s accepted username contains markup-like characters such as `<Max>`
- **THEN** the corresponding racetrack label SHALL display those characters as text and SHALL not create HTML elements from them

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
