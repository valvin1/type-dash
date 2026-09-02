## Context

The repository is hosted on GitHub with `main` as its release branch, but it still contains a GitLab CI pipeline and uses `@semantic-release/gitlab`. The application is a Node.js service with an npm integration-test command and a production Dockerfile; it has no separate application compilation step. Render builds and deploys that Dockerfile from the connected repository, so this change does not need a container registry.

The existing `v1.0.0` and earlier tags remain valid release markers. Semantic-release can continue from those tags as long as the release checkout contains the complete `main` history and all reachable tags.

## Goals / Non-Goals

**Goals:**

- Give pull requests targeting `main` deterministic Node.js test and Docker-build checks.
- Prevent a release unless the exact commit on `main` passes the same validation.
- Publish semantic Git tags and GitHub Releases from `main` using Conventional Commits.
- Use Git tags, rather than a committed package version, to identify the latest release.
- Remove GitLab-specific automation, dependencies, and references from active project files.
- Keep write permissions and credentials out of pull-request workflows.

**Non-Goals:**

- Publishing the package to npm.
- Publishing Docker images to GitHub Container Registry or another registry.
- Committing generated versions, changelogs, or release notes back to `main`.
- Changing the Render service or application runtime behavior.
- Rewriting Git history to remove references present only in historical commits.
- Automatically releasing for commit types that semantic-release considers non-releasable by default.

## Decisions

### Separate validation and release workflows

Create `.github/workflows/ci.yml` for `pull_request` events targeting `main` and `.github/workflows/release.yml` for pushes to `main`. Separate files make the trust boundary visible: pull-request jobs receive `contents: read`, while only the release job receives `contents: write`.

The release workflow will repeat installation, tests, and Docker build before invoking semantic-release. Depending only on a prior pull-request run was rejected because the resulting `main` commit can differ from the tested head and direct pushes could otherwise bypass validation.

### Treat the Docker image as the build artifact

Both workflows will use Node.js 24, run `npm ci`, run `npm test`, and build the existing Dockerfile. The project has no npm `build` script, so successfully constructing the production image is the meaningful build verification. Builds will not log in to or push to a registry.

Use the current stable major versions of the official checkout and Node setup actions, enable npm caching from `package-lock.json`, and cancel superseded pull-request runs. The release workflow will use a non-cancelling concurrency group so two rapid pushes to `main` cannot calculate or publish releases concurrently.

### Use tags and GitHub Releases as release state

Configure semantic-release for the `main` branch with commit analysis, release-note generation, and GitHub publication only. The release checkout will use `fetch-depth: 0`, allowing semantic-release to find the latest reachable `v${version}` tag, analyze later commits, and create the next tag on the current `main` commit.

Remove `@semantic-release/npm`, `@semantic-release/changelog`, and `@semantic-release/git` from the active plugin list. Set the package version to a clear non-release sentinel such as `0.0.0-semantically-released` and mark the application private. This makes it explicit that `package.json` is not the release ledger.

Keeping release commits was rejected because they require automated pushes to the protected branch, complicate branch rules, and can leave repository files out of sync with the published release. GitHub tags and Releases provide the authoritative version and notes without an additional commit.

### Use the built-in GitHub token with least privilege

Pass the workflow-provided `GITHUB_TOKEN` to semantic-release and grant the release job `contents: write`. Configure `@semantic-release/github` not to comment on or label resolved issues and pull requests and not to open a failure issue, avoiding the need for `issues: write` or `pull-requests: write`.

No release credentials will be available in the pull-request workflow. A personal access token was rejected because the repository-scoped workflow token is sufficient and avoids a long-lived secret.

### Remove active-project GitLab references without rewriting history

Delete `.gitlab-ci.yml`, remove the GitLab release package from `package.json` and `package-lock.json`, replace the GitLab plugin in semantic-release configuration, update deployment instructions to GitHub, and replace historical changelog commit URLs with their GitHub equivalents. Verification will search active project files while excluding `.git` metadata, installed dependencies, and the OpenSpec proposal and archive that intentionally preserve migration history.

Git history and OpenSpec decision records will not be rewritten. Existing commits, deleted-file history, and this migration proposal remain auditable, while operational configuration, dependency metadata, and user-facing documentation become GitHub-only.

## Risks / Trade-offs

- **A non-conventional squash or merge commit can produce no release** → Document the accepted commit types and recommend Conventional Commit pull-request titles when squash merging.
- **A shallow checkout would cause incorrect version discovery** → Require `fetch-depth: 0` in the release workflow and verify the configuration during implementation.
- **Concurrent pushes could race when creating tags** → Serialize the release workflow with a `main` release concurrency group and do not cancel an in-progress release.
- **Changing `package.json` to a sentinel version may surprise consumers** → Mark the package private and document that Git tags and GitHub Releases are authoritative.
- **The checked-in changelog stops receiving automatic entries** → Preserve it as migrated historical content and direct users to GitHub Releases for versions after this change.
- **A GitHub ruleset may prevent tag or release creation** → Confirm that GitHub Actions has repository-content write access and that tag rules allow the repository Actions app before merging the workflow.
- **Building untrusted pull-request code has supply-chain exposure** → Run only on GitHub-hosted ephemeral runners with read-only repository access and no secrets or registry credentials.

## Migration Plan

1. Add and locally validate the pull-request and release workflow definitions.
2. Replace the semantic-release plugin set and regenerate the npm lockfile.
3. Delete the GitLab CI file and migrate GitLab references in documentation and historical changelog URLs.
4. Run the integration suite, build the Docker image, validate the semantic-release configuration in dry-run mode where credentials permit, and scan tracked files for remaining GitLab references.
5. Push the change through a pull request and verify that the read-only CI workflow succeeds.
6. Before merging, ensure GitHub Actions is allowed to create repository contents and that `main` branch protection requires the CI checks.
7. Merge to `main` and observe the release workflow. With the current history after `v1.0.0`, the first releasable result is expected to be a minor release if the relevant `feat:` commits remain reachable.

Rollback consists of disabling or reverting the GitHub workflow and release-configuration changes. Published Git tags and GitHub Releases are immutable release records and must not be deleted merely to roll back the workflow; a corrective release should be published instead.

## Open Questions

None. The design adopts the explored decision to use tags and GitHub Releases without committing release files back to `main`.
