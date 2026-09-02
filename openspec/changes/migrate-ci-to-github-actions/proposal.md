## Why

The project now uses GitHub, but its automation, release dependency, documentation, and generated changelog still refer to GitLab. Moving validation and releases to GitHub Actions will make pull requests verifiable on the current hosting platform and keep releases automated from `main` without maintaining obsolete GitLab integration.

## What Changes

- Add a read-only GitHub Actions workflow that installs dependencies, runs the Node.js integration tests, and proves that the production Docker image builds for pull requests targeting `main`.
- Add a separately privileged GitHub Actions workflow that repeats validation after a change reaches `main` and then runs semantic-release with complete Git history.
- Use semantic-release to derive the next version from reachable `v*` Git tags and Conventional Commits, then create the corresponding Git tag and GitHub Release without committing generated version files back to `main` or publishing to npm.
- Remove the GitLab CI configuration, GitLab semantic-release integration, and all GitLab references from active automation, dependency metadata, and user-facing project documentation.
- Document the GitHub pull-request, release, and Render deployment flow.

## Capabilities

### New Capabilities

- `pull-request-validation`: Automated test and production Docker-build checks for pull requests targeting `main`.
- `automated-github-release`: Tag-based semantic version calculation and GitHub Release publication for validated changes on `main`.

### Modified Capabilities

None.

## Impact

- Adds GitHub Actions workflow definitions under `.github/workflows/`.
- Deletes `.gitlab-ci.yml` and replaces `@semantic-release/gitlab` with GitHub release support in the npm dependency graph and semantic-release configuration.
- Stops semantic-release from committing `package.json`, `package-lock.json`, or `CHANGELOG.md`; release tags and GitHub Releases become the release source of truth.
- Updates `README.md` and existing changelog links so active project files no longer direct users or tools to GitLab; the OpenSpec change record remains as migration history.
- Requires the GitHub Actions release job to have narrowly scoped write permissions for repository contents and, if release comments remain enabled, issues and pull requests.
