## ADDED Requirements

### Requirement: Per-player WPM timeline is included in completed results
The system MUST capture elapsed-time WPM measurements for every player during a game and include them in that player's end-of-game result. Measurements MUST be at least once per second (no interval between consecutive scheduled measurements may exceed 1000 ms), with a final measurement at game completion. WPM MUST use the same cumulative definition as the live result statistic.

#### Scenario: Solo result contains a regular timeline
- **WHEN** a Solo game completes normally
- **THEN** the result SHALL include the player's ordered elapsed-time WPM measurements, spanning the run through its final measurement, with no scheduled gap greater than 1000 ms

#### Scenario: Every multiplayer player has a timeline
- **WHEN** a multiplayer game completes with multiple players
- **THEN** the result SHALL include a separate ordered WPM timeline for every player, including players who did not type during part of the game

#### Scenario: Timeline uses the live WPM definition
- **WHEN** a timeline measurement is captured at elapsed time `t`
- **THEN** its WPM SHALL equal the rounded count of correctly completed words divided by elapsed minutes, using the existing live-statistic minimum-time behavior at the beginning of the run

#### Scenario: Final measurement closes the timeline
- **WHEN** a game ends between scheduled measurement times
- **THEN** the result SHALL include a final measurement at the actual elapsed game-end time

### Requirement: Completed incorrect words are represented as timed errors
The system MUST associate each player's incorrectly completed word with its word index and elapsed time, and include those events in the end-of-game result. A word is incorrect only when the player submits it as complete and its text does not match the target word.

#### Scenario: Incorrect submitted word appears in results
- **WHEN** a player completes a word with text that differs from the target word
- **THEN** that player's result SHALL contain one error event with the target word index and elapsed time of submission

#### Scenario: Corrected partial typo is not an error event
- **WHEN** a player briefly types an incorrect prefix but corrects it before submitting the word
- **THEN** the result SHALL NOT contain an error event for that word

#### Scenario: Multiplayer errors belong to the submitting player
- **WHEN** one player submits an incorrect word during a multiplayer game
- **THEN** the error event SHALL appear only in that player's result data

### Requirement: Actual character deletions are represented as timed hesitations
The system MUST record a hesitation when a player uses Backspace or Delete and the action actually removes one or more characters from the current word input. Each event MUST include the current word index, elapsed time, and player identity through its result association. A key press that does not change the input, ordinary character entry, and a deletion outside the active word input MUST NOT be recorded as a hesitation.

#### Scenario: Backspace removes a character
- **WHEN** a player presses Backspace while one or more characters are present in the current word input
- **THEN** the result SHALL contain an orange-eligible hesitation event at the time of that deletion, associated with the current word index

#### Scenario: Delete removes a character
- **WHEN** a player presses Delete and one or more characters are actually removed from the current word input
- **THEN** the result SHALL contain an orange-eligible hesitation event at the time of that deletion, associated with the current word index

#### Scenario: Deletion key has no effect
- **WHEN** a player presses Backspace on an empty input or presses Delete where no character is removed
- **THEN** the result SHALL NOT contain a hesitation event for that key press

#### Scenario: Ordinary typing is not a hesitation
- **WHEN** a player enters a character without deleting existing input
- **THEN** the result SHALL NOT contain a hesitation event for that character entry

#### Scenario: Multiplayer hesitation belongs to its player
- **WHEN** one player deletes a character during a multiplayer game
- **THEN** the hesitation event SHALL appear only in that player's result data

### Requirement: End-of-game chart visualizes each player's timeline, errors, and hesitations
The results screen MUST render an attractive, legible WPM-over-time chart from the completed result data, with a distinct curve and legend entry for each human player, a small red marker for every incorrect completed word, and a small orange marker for every actual character deletion. Markers MUST be positioned at their elapsed time and associated with the correct player. The visualization MUST label time and WPM, explain the marker colors, and remain usable on narrow screens.

#### Scenario: Solo chart distinguishes errors and hesitations
- **WHEN** a Solo result with measurements, incorrect completed words, and character deletions is displayed
- **THEN** the results screen SHALL show one player's WPM curve, red markers aligned to incorrect-word submission times, and orange markers aligned to actual deletion times

#### Scenario: Multiplayer chart compares all players
- **WHEN** a multiplayer result contains multiple players
- **THEN** the chart SHALL show a distinct curve and identified legend entry for every player, with each red error marker and orange hesitation marker associated with the correct player's curve or legend identity

#### Scenario: Marker legend distinguishes event types
- **WHEN** the chart contains error and hesitation markers
- **THEN** its legend or equivalent accessible key SHALL identify red as an incorrect completed word and orange as a character deletion

#### Scenario: Result without errors
- **WHEN** a completed game contains no incorrect submitted words
- **THEN** the chart SHALL show all available WPM curves and no red error markers, while still showing any orange hesitation markers and without implying missing chart data

#### Scenario: Narrow viewport
- **WHEN** the results screen is viewed on a narrow mobile viewport
- **THEN** chart labels, curves, legend, and error markers SHALL remain readable without forcing page-wide horizontal overflow

### Requirement: Chart data is limited to the current game
The system MUST keep chart measurements and error events scoped to the active game and discard them when the room/run is reset or removed. Chart data MUST NOT change scoring, ranking, ghost selection, or ghost replay behavior.

#### Scenario: New run starts with empty chart data
- **WHEN** a new game starts after a previous result
- **THEN** every player's chart measurements and errors SHALL start empty and SHALL NOT contain events from the previous run

#### Scenario: Room is removed
- **WHEN** the game room is reset or deleted
- **THEN** its chart measurements and errors SHALL be discarded and SHALL NOT be available to another room

#### Scenario: Existing results remain unchanged
- **WHEN** chart measurements and errors are added to results
- **THEN** the existing final score, accuracy, standings, and Solo ghost comparison SHALL retain their current behavior
