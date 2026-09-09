## MODIFIED Requirements

### Requirement: Multi-lane progress track rendering
The system MUST dynamically generate a horizontal racing lane for each active player when the game transitions to the playing state, representing their typing progress visually. For multiplayer players, each lane MUST display that player’s synchronized username as its label.

#### Scenario: Racetrack creation with multiplayer usernames
- **WHEN** the game state shifts to `'playing'` in a room with 4 players whose usernames are `Léa`, `Max`, `Noa`, and `Zoe`
- **THEN** the client interface SHALL dynamically inject 4 horizontal racetrack lanes labeled `Léa`, `Max`, `Noa`, and `Zoe`, each with a unique color gradient track

#### Scenario: Name is rendered as text rather than markup
- **WHEN** a multiplayer player’s accepted username contains markup-like characters such as `<Max>`
- **THEN** the corresponding racetrack label SHALL display those characters as text and SHALL not create HTML elements from them
