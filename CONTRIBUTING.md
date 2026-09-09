# Creating a change

Use this workflow for each new change:

**Branch → Explore → Propose → Apply → Automated verification → Manual verification → Commit → Push**

In Codex, invoke the repository's `new-change` skill:

```text
$new-change <describe your feature or fix>
```

The skill coordinates the complete process and its subagents. It is stored in
`.agents/skills/new-change/SKILL.md`. If it does not appear after adding it,
restart Codex to refresh skill discovery.

The individual OpenSpec stages below use the `openspec-explore`,
`openspec-propose`, and `openspec-apply-change` skills. These are skill
mentions in the agent prompt, not terminal commands. Use them individually
when you only want that stage; use `new-change` for the complete process.

## Agent responsibilities

The main agent coordinates the workflow and owns branching, final review,
commit, and push. It delegates the following stages sequentially:

| Agent instructions | Responsibility |
| --- | --- |
| [Planner](.agent/agents/planner.md) | Explore, then propose validated OpenSpec artifacts |
| [Implementer](.agent/agents/implementer.md) | Implement the change and tests; address verification findings |
| [Automated verifier](.agent/agents/automated-verifier.md) | Independently check acceptance criteria and run required checks |
| [Manual verifier](.agent/agents/manual-verifier.md) | Exercise user flows or assess contributor-provided observations |

These files are role prompts explicitly passed to the host's subagent tools
by the coordinator, not platform-specific agent registrations. No model is
selected: subagents use the host's default/inherited settings. Separate agents
provide separate responsibilities, but do not guarantee different models.
The host must support subagents; otherwise the coordinator reports the
limitation before proceeding with an alternative.

Agents share the branch and pass context through OpenSpec artifacts and
`verification.md`. Run only one subagent at a time to avoid conflicting edits.
Verification failures return to the implementer, followed by renewed checks
of the affected behavior. Only the coordinator may commit and push, after
both verification stages pass for the final code state.

## 1. Create a feature branch

Choose a short kebab-case name, such as `add-race-history`. Use that same name
for the branch suffix and the OpenSpec change.

Inspect `git status` first. Preserve unrelated work; do not discard or commit
it with the new change. Start from an up-to-date `main` with a clean working
tree:

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/add-race-history
```

Create the branch before creating OpenSpec artifacts or editing the feature.
When resuming a change, use its existing branch and artifacts instead of
creating duplicates. If the branch or change name already belongs to another
change, choose a distinct name.

## 2. Explore

```text
$openspec-explore <description of the change>
```

Read the relevant code and existing specs in `openspec/specs/`. Clarify the
problem, scope, constraints, and observable acceptance criteria. Identify how
each criterion will be checked programmatically and manually. Resolve material
ambiguities before proposing. Exploration does not implement the feature;
the next stage creates the change artifacts.

## 3. Propose

```text
$openspec-propose add-race-history
```

Carry the exploration findings into the proposal. Generate the proposal,
design, spec changes, and tasks under `openspec/changes/add-race-history/`
using the OpenSpec instructions and dependency order.

Include separate tasks for implementation, automated verification, and manual
verification. Specify expected results, including relevant edge cases and
regressions. Ensure the artifacts are ready for implementation:

```sh
openspec status --change add-race-history
openspec validate add-race-history --strict --no-interactive
```

## 4. Apply

```text
$openspec-apply-change add-race-history
```

Implement the tasks against the proposal, design, and specs. Keep edits scoped
to the change, and update the artifacts if implementation changes the design
or acceptance criteria. Mark each task complete only after doing its work;
leave verification tasks unchecked until their checks have passed.

## 5. Verify programmatically

Add or update meaningful automated tests for changed behavior where applicable.
Check the acceptance criteria against the implementation; existing tests passing
alone does not prove the new feature works.

Run the same checks used by the repository's pull request validation:

```sh
npm ci
npm audit --audit-level=high
npm test
docker build --tag typedash:change-check .
openspec validate add-race-history --strict --no-interactive
git diff --check
```

Use Node.js 22–24 (CI uses Node.js 24) and a running Docker daemon. Record
commands, outcomes, and the acceptance criteria they cover in
`openspec/changes/add-race-history/verification.md`. Fix failures and rerun
affected checks. An unavailable tool or skipped check is a blocker, not a pass.

## 6. Verify manually

Run `npm start` and open <http://localhost:3000>. Exercise the feature as a
user, checking the expected results from the specs and relevant error or edge
cases. For multiplayer changes, use separate browser sessions to check host
and guest behavior. Check affected existing flows such as starting a race,
results, and replay; for Solo changes, include ghost behavior when relevant.

Record the environment, steps, expected and observed results, and pass/fail
status in the same `verification.md`. For changes without a UI, manually
exercise the relevant command or process instead. Fix defects and repeat the
affected automated and manual checks after fixes.

If the agent cannot perform manual verification, ask the contributor to run
the documented steps and provide results. Leave this task pending until those
results are available. Never claim manual verification based only on automated
tests. Do not proceed to commit and push with failed or pending verification.

## 7. Commit with a Conventional Commit

Review the final diff, verification evidence, and task checklist. All scoped
implementation and verification tasks must be complete.

```sh
git status --short
git diff
git add <explicit-paths-for-this-change>
git diff --cached
git diff --cached --check
git commit -m "feat(history): add race history"
```

Include the implementation, relevant tests, and OpenSpec artifacts and
verification evidence in the commit. Inspect newly created files as well as
tracked diffs, and stage only files belonging to this change. If available,
use the `git-commit` skill to review and create the commit.

Use `<type>(<optional-scope>): <description>` with the type appropriate to the
change: for example, `feat`, `fix`, `docs`, `test`, or `chore`. Mark breaking
changes with `!` or a `BREAKING CHANGE:` footer. Commit types drive the
repository's automated releases; do not manually bump `package.json`.

## 8. Push the feature branch

Confirm you are on the intended `feat/` branch, then push it:

```sh
git branch --show-current
git push -u origin feat/add-race-history
git status --short --branch
```

Report the change name, branch, verification results, commit hash, and push
outcome. If pushing fails, report the failure without claiming completion.
This workflow ends with the pushed feature branch. PR creation, merging, and
OpenSpec archival are separate follow-up actions.
