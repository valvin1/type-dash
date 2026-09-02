## ADDED Requirements

### Requirement: Main changes are validated before release
The repository SHALL run locked dependency installation, the Node.js integration tests, and the production Docker build for each push to `main` before attempting a release.

#### Scenario: Main validation succeeds
- **WHEN** a commit reaches `main` and its installation, tests, and Docker build all succeed
- **THEN** the release workflow proceeds to semantic-release

#### Scenario: Main validation fails
- **WHEN** installation, tests, or the Docker build fails for the current `main` commit
- **THEN** semantic-release is not invoked and no release is created

### Requirement: Release versions are derived from Git history
Semantic-release SHALL use the latest reachable tag matching `v${version}` and the Conventional Commits added after that tag to determine whether a release is required and whether its version bump is major, minor, or patch.

#### Scenario: Releasable commits follow the latest tag
- **WHEN** `main` contains a `feat:`, `fix:`, `perf:`, or breaking-change commit after its latest reachable release tag
- **THEN** semantic-release calculates the next version using its configured Conventional Commit rules

#### Scenario: No releasable commits follow the latest tag
- **WHEN** all commits after the latest reachable release tag are non-releasable under the configured rules
- **THEN** the workflow completes without creating a new version tag or GitHub Release

#### Scenario: Release history is checked out
- **WHEN** the release workflow prepares the repository for semantic-release
- **THEN** the complete commit history and all reachable release tags are available to the release process

### Requirement: Releases are published on GitHub
For every calculated release, the workflow SHALL create the version tag on the current `main` commit and SHALL publish matching generated release notes as a GitHub Release.

#### Scenario: Minor release is calculated
- **WHEN** the latest reachable release tag is `v1.0.0` and the highest relevant change is a feature
- **THEN** semantic-release creates tag `v1.1.0` on the validated `main` commit and publishes the corresponding GitHub Release

#### Scenario: Workflow authentication
- **WHEN** semantic-release publishes a tag and GitHub Release
- **THEN** it uses the repository-scoped GitHub Actions token with only the repository-content write permission required for publication

### Requirement: Release publication does not modify the release branch
The release process MUST NOT create or push a release commit, MUST NOT treat the package manifest version as release state, and MUST NOT publish the package to npm or a Docker image to a registry.

#### Scenario: Release completes
- **WHEN** semantic-release successfully publishes a version
- **THEN** `main` remains at the validated application commit while the new Git tag and GitHub Release record the version

#### Scenario: A later release runs
- **WHEN** semantic-release runs after a previous tag-only release
- **THEN** it derives the new baseline from the previous release tag rather than from `package.json`

### Requirement: Releases are serialized
The release workflow SHALL prevent simultaneous `main` release jobs from publishing concurrently and SHALL NOT cancel a release that has begun.

#### Scenario: Two main pushes arrive close together
- **WHEN** one release workflow is active and another is queued for a newer `main` commit
- **THEN** the newer workflow waits until the active release completes before evaluating the updated history

### Requirement: Active project files are GitHub-only
The active automation, dependency metadata, semantic-release configuration, README, and changelog SHALL contain no GitLab CI configuration, GitLab release dependency, GitLab release plugin, GitLab deployment instruction, or GitLab URL.

#### Scenario: Migration is verified
- **WHEN** active project files are searched after implementation while Git metadata, installed dependencies, and OpenSpec migration records are excluded
- **THEN** no case-insensitive reference to `gitlab` is found

#### Scenario: Historical release links are retained
- **WHEN** a historical changelog entry refers to a commit that was migrated from GitLab
- **THEN** its link targets the equivalent commit in the GitHub repository
