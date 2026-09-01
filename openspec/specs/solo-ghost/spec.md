# solo-ghost Specification

## Purpose
Define how eligible Solo runs are retained, selected, replayed, scoped, and kept separate from connected players as ghost opponents.

## Requirements
### Requirement: Eligible Solo runs create a text-specific ghost
The system MUST create a ghost only from a normally completed Solo run with at least three correctly typed words, and MUST associate that ghost with the exact text used by the run.

#### Scenario: First eligible run creates a ghost
- **WHEN** a Solo player normally completes a run with at least three correctly typed words and no ghost exists for the current text
- **THEN** the system SHALL retain the run's final score, WPM, accuracy, progress, correct-word count, and timestamped snapshots as the ghost

#### Scenario: Short run remains ordinary Solo play
- **WHEN** a Solo player normally completes a run with fewer than three correctly typed words
- **THEN** the system SHALL NOT create or replace a ghost and SHALL NOT show ghost-specific result feedback

#### Scenario: Interrupted run is discarded
- **WHEN** a Solo player disconnects before the run ends normally
- **THEN** the system SHALL NOT create or replace a ghost from that run

### Requirement: Best eligible run selection
The system MUST retain the best eligible run for the current text by comparing rounded score first, then progress, then accuracy, and MUST retain the existing ghost when all three values are tied.

#### Scenario: Higher score replaces the ghost
- **WHEN** an eligible completed run has a higher `Math.round(WPM * accuracy / 100)` score than the existing ghost
- **THEN** the system SHALL replace the ghost after the result comparison is calculated

#### Scenario: Progress breaks an equal-score tie
- **WHEN** an eligible completed run ties the existing ghost's score but has higher progress
- **THEN** the system SHALL replace the ghost after the result comparison is calculated

#### Scenario: Accuracy breaks an equal-score and progress tie
- **WHEN** an eligible completed run ties the existing ghost's score and progress but has higher accuracy
- **THEN** the system SHALL replace the ghost after the result comparison is calculated

#### Scenario: Equal or worse run keeps the ghost
- **WHEN** an eligible completed run does not outrank the existing ghost by score, progress, then accuracy
- **THEN** the system SHALL retain the existing ghost unchanged

### Requirement: Timestamped ghost replay
The system MUST record validated progress, WPM, and accuracy snapshots against elapsed run time and MUST replay the retained snapshots on the same relative timeline during a retry of the exact text.

#### Scenario: Replay preserves pauses and bursts
- **WHEN** a retained ghost contains snapshots separated by unequal elapsed-time intervals and the player retries the text
- **THEN** the ghost SHALL update at those recorded intervals rather than moving at a constant calculated speed

### Requirement: Session-scoped ghost lifetime
The system MUST keep ghost data only in the current in-memory Solo room and MUST clear it when the text or theme changes, the Solo room ends, or the player disconnects or refreshes.

#### Scenario: Changing text clears the ghost
- **WHEN** a Solo player chooses to change text after a run
- **THEN** the system SHALL clear the retained ghost before returning to theme selection

#### Scenario: Disconnect clears the Solo ghost
- **WHEN** the Solo player disconnects or refreshes and its one-player room ends
- **THEN** the system SHALL delete the room and its ghost data

#### Scenario: Ghosts are isolated between Solo rooms
- **WHEN** two Solo rooms run concurrently
- **THEN** each room SHALL expose only its own current-text ghost and run history

### Requirement: Ghost state remains separate from connected players
The system MUST NOT add a ghost to the room's connected `players` collection.

#### Scenario: Solo validation remains one-player
- **WHEN** a Solo retry is started with a retained ghost
- **THEN** the room SHALL still contain exactly one connected player while separately providing the synthetic ghost opponent
