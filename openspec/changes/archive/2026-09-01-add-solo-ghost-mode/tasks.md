## 1. Server ghost model and lifecycle

- [x] 1.1 Add isolated Solo ghost/current-run state plus score comparison and metric-difference helpers.
- [x] 1.2 Validate correct-word progress, timestamp Solo snapshots, and finalize eligible runs only through normal game completion.
- [x] 1.3 Emit Solo result data with the raced ghost and update the retained best ghost only after comparison.
- [x] 1.4 Add same-text retry and change-text actions that preserve or clear ghost state while leaving multiplayer replay unchanged.

## 2. Client race and results experience

- [x] 2.1 Send correct-word counts and replay retained ghost snapshots on their recorded timeline with timer cleanup.
- [x] 2.2 Render a distinct “Votre record” ghost lane and include the synthetic competitor in live ranking and overtake behavior.
- [x] 2.3 Include the raced ghost in Solo podium results and render new-best/not-beaten metric feedback.
- [x] 2.4 Replace the Solo replay control with “Réessayer ce texte” and “Changer de texte” actions and add responsive ghost styling.

## 3. Verification and documentation

- [x] 3.1 Add automated integration coverage for eligibility, timestamp replay data, best-run selection/ties, clearing, Solo-room isolation, and disconnect cleanup.
- [x] 3.2 Confirm multiplayer room progress and replay behavior remain unchanged in the integration suite.
- [x] 3.3 Update user-facing project documentation for session-only Solo ghost mode and run OpenSpec validation plus the full test suite.
