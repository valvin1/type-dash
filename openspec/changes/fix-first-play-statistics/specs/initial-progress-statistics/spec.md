## ADDED Requirements

### Requirement: Current-run progression is visible from the first play

The system MUST display the current run's progression statistics from the first play of a text, including live WPM, accuracy, and current-run progression chart data. A historical comparison MUST be shown only when a qualified best run exists for the same text. The system MUST keep a completed-play marker separately from the qualified-best-run record.

Progress MUST be calculated from the same normalized whitespace-delimited word list used to display the target text. An empty submission caused by an extra space MUST NOT advance the current word index or progression.

#### Scenario: First run displays current statistics without historical comparison
- **WHEN** a player completes the first Solo run of a text and no qualified best run exists
- **THEN** the results SHALL show the current run's available statistics and progression timeline
- **AND** the results SHALL NOT show a historical comparison or prior-run series
- **AND** the text SHALL be marked as played

#### Scenario: Live statistics remain visible in the first run
- **WHEN** a player types during the first run of a text
- **THEN** the live WPM, accuracy, and current progress indicators SHALL remain visible and usable

### Requirement: Solo progression is compared with the best qualified run for the same text

The system MUST persist the best qualified Solo run and its progression timeline per exact text content in the browser profile. A run is qualified when it has at least three correctly completed words. A run MUST be compared against the best qualified run that existed before that run started, never merely against the immediately previous run. The existing best-run ordering MUST be reused: higher score wins; on equal score, higher progress wins; on equal score and progress, higher accuracy wins. A qualified current run MUST replace the stored reference only when it is better under this ordering. Comparison MUST use the current run and the stored best timeline, with the current run's zero baseline and valid ordered measurements; historical data from other runs MUST NOT contaminate the current series.

#### Scenario: Second run compares against first qualified run
- **WHEN** a second run of the same text begins after a qualified first run
- **THEN** the result SHALL compare the current run to the first run's stored best summary and timeline

#### Scenario: Later run compares against the best, not the previous run
- **WHEN** a player completes a sequence where a run is worse than the best and a later run improves on the previous run but not the best
- **THEN** both runs SHALL be compared to the unchanged best reference
- **AND** the stored best SHALL remain unchanged

#### Scenario: Better run becomes the new reference
- **WHEN** a qualified run beats the stored best by score, progress, or accuracy in the defined tie-break order
- **THEN** the comparison SHALL use the prior best for that run
- **AND** the current run's summary and timeline SHALL become the reference for subsequent runs

#### Scenario: Incomplete run is counted but cannot replace a best
- **WHEN** a run ends with fewer than three correctly completed words, including zero input
- **THEN** the text SHALL still be marked as played
- **AND** current-run statistics SHALL be displayed
- **AND** the run SHALL NOT replace an existing best or create a qualified comparison reference

#### Scenario: Never-played text has no historical comparison
- **WHEN** a player chooses another text content with no qualified stored run
- **THEN** current-run statistics SHALL be displayed without a historical comparison, even if another text in the same theme has a stored best

#### Scenario: Same text is recognized after refresh
- **WHEN** the browser is refreshed and the same exact text content is later selected in the same browser profile
- **THEN** its played marker and qualified best SHALL be restored and used for the next run's comparison

#### Scenario: Invalid or unavailable local record
- **WHEN** the stored record is malformed or browser storage is unavailable
- **THEN** gameplay and current-run statistics SHALL continue without error
- **AND** the system SHALL omit historical comparison unless a valid in-memory best is available
