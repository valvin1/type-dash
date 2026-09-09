## Context

Multiplayer player objects currently contain a socket id, transient race statistics, readiness, and a role (`P1`, `P2`, …). The client derives presentation labels such as “Vous,” “Hôte,” and “Joueur 2” from that role in the lobby, racetrack, and results. There are no accounts or persisted player profiles. This change adds an in-room display-name field without changing the role field that drives host authorization.

## Goals / Non-Goals

**Goals:**

- Give every multiplayer player a short server-generated provisional username that makes its temporary nature clear.
- Let a player update only their own username from the waiting-room UI before a multiplayer race starts.
- Enforce the 1–10 character rule on the server and promptly synchronize accepted changes to every player.
- Render the selected name safely and consistently in multiplayer lobby, racetrack, podium, and standings views.

**Non-Goals:**

- Accounts, persistence across reconnects, reserved names, uniqueness guarantees, avatars, moderation, or name changes during countdown, play, and results.
- Changing Solo labels, host authorization, role identifiers, readiness, or room admission rules.

## Decisions

### Server-authoritative French-surname suggestions and validation

The server will add a `username` to each multiplayer player when they join by randomly selecting from an immutable, offline curated list of common French surnames. The list is source-controlled application data, contains surname strings only, and every entry has from one through ten Unicode code points. It will contain at least ten distinct entries, such as `Martin`, `Bernard`, `Dubois`, `Moreau`, and `Lefebvre`. The selected value is an arbitrary display-name suggestion, not a claim about the player’s legal name, identity, nationality, gender, or account.

The server will trim a submitted replacement name and count Unicode code points before accepting only values from one through ten characters.

Keeping the list local makes selection work offline, avoids live personal-data lookups, and makes the allowed default set testable without asserting a particular random outcome. This also keeps malformed or bypassed browser input from entering shared room state and avoids relying on `maxlength`, which counts UTF-16 code units and is only a convenience affordance. A sequential slot-derived name was considered, but it can be reused after disconnections and feels like the static labels this change replaces. Live name APIs and user-derived profile names were rejected because they would add availability, privacy, and identity implications outside this game’s scope.

### Owner-only rename protocol in the waiting room

The client will emit `changeUsername` with the requested string. The server will resolve the sender through its socket id, allow the update only for a multiplayer room in the `waiting` state, and mutate only that player object. On success, it will broadcast `usernameUpdated` with the current player list; on invalid input it will send a non-destructive `usernameError` only to the sender, retaining the prior name. Requests after countdown begins or from a socket outside a valid multiplayer waiting room are ignored.

A client-only update and allowing arbitrary target player ids were rejected because either could desynchronize players or let a participant rename somebody else.

### One shared name renderer, safe DOM insertion

The client will render `player.username` for non-Solo multiplayer competitors in the lobby cards, racetrack labels, podium, and standings. It will use DOM `textContent` (not HTML interpolation) for each supplied name. The waiting-room control will expose the 10-character limit and submit on an explicit action and/or standard form submission; server feedback will be associated with that control.

Role badges and vehicle tokens remain role-based so host behavior and existing visual distinctions are unchanged. Rendering a locally cached value before the room broadcast was considered but rejected in favor of the broadcast as the source of truth.

## Risks / Trade-offs

- **[Risk] Multiple players can receive the same surname.** → Names are display labels rather than identifiers; socket ids remain authoritative. Name uniqueness is intentionally outside this change.
- **[Risk] A suggested surname could be mistaken for collected identity data.** → Keep the list offline and curated, present the value only as an editable pseudonym suggestion, and do not link it to accounts or personal data.
- **[Risk] A client can submit values that bypasses the input limit.** → The server trims and validates every request before changing room state.
- **[Risk] Arbitrary text could be interpreted as markup.** → Render names only with `textContent`, and cover markup-like input in automated tests.
- **[Risk] A player may expect a name to survive reconnecting.** → The UI treats defaults as provisional and the scope explicitly remains session-only.

## Migration Plan

No data migration is required because rooms are in-memory. Deploying the server and browser assets together adds `username` to new multiplayer player records. Rolling back removes the transient field and restores role-derived labels; active rooms are already lost on process restart.

## Open Questions

None.
