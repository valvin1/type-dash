---
name: new-change
description: Create or resume a repository change through the full OpenSpec lifecycle with subagents, from a feat branch through implementation, automated and manual verification, Conventional Commit, and push. Use for end-to-end feature or fix requests; for proposal-only or exploration-only requests use the corresponding OpenSpec skill.
---

Execute the full repository change lifecycle described below and in `CONTRIBUTING.md`.
Resolve repository-relative paths from the repository root. Read the role files
when handing off their stages. Use the installed `openspec-explore`,
`openspec-propose`, and `openspec-apply-change` skills; read each selected
skill's `SKILL.md` before following it. If a required skill is missing,
report the missing dependency before starting its stage.
Respect any narrower scope explicitly requested by the user.

Act as the coordinator. The role files in `.agent/agents/` are reusable
instructions to read and pass to subagents; they are not automatically
registered agent types. Use the host's subagent tools to create separate
agents, without specifying a model or reasoning override. Use the host's
default/inherited settings. If subagents are unavailable, report that limitation
and ask how to proceed instead of claiming independent delegation occurred.

For each handoff, provide the role file's contents, repository path, branch,
change name, user requirements, artifact paths, prior results, and the exact
scope of work. Wait for each stage's result before starting the dependent stage.
Keep only one subagent active in the shared working tree at a time. The
coordinator owns Git operations and user clarification; subagents do not
delegate further. Continue automatically between successful stages.

**Input:** `$new-change <description>` or a change name with enough context to
understand the requested behavior. If the intended change is missing, ask for
it before starting.

1. Read `CONTRIBUTING.md` and inspect the working tree. Choose a kebab-case
   change name and create `feat/<change-name>` from up-to-date `main` before
   creating artifacts or implementing. Preserve unrelated work. When resuming,
   use the existing branch and change.
2. Delegate exploration and proposal to a subagent using
   `.agent/agents/planner.md`. Have it use `openspec-explore` followed by
   `openspec-propose`. Require validated, apply-ready artifacts.
3. Delegate implementation to a separate subagent using
   `.agent/agents/implementer.md` and `openspec-apply-change`. Require
   implementation tasks to be complete,
   with acceptance verification tasks left pending.
4. Delegate programmatic verification to a separate subagent using
   `.agent/agents/automated-verifier.md`. Require a `passed` result supported
   by the change's `verification.md` before manual verification.
5. Delegate manual verification to a separate subagent using
   `.agent/agents/manual-verifier.md`. If its tools cannot perform the checks,
   collect contributor observations using its concrete steps and have the
   verifier record and assess that evidence before proceeding.
6. Route verification failures back to the implementer. After fixes, invalidate
   affected verification results and reopen their task checkboxes; rerun
   automated verification, then affected manual checks. For material design
   changes, return to the planner first. Resolve blockers before advancing.
7. Review the final diff and completed tasks, stage only this change's files,
   and create a Conventional Commit using the `git-commit` skill if available.
8. Push the `feat/<change-name>` branch with upstream tracking. Report the
   verification results, commit hash, and push outcome.

Do not treat generated artifacts or checked task boxes as evidence that a
feature works. Do not commit or push while required verification is failed,
skipped, or pending. Do not automatically archive the change, open a PR, or
merge as part of this workflow.
