## 1. Configure tag-only semantic releases

- [x] 1.1 Mark the application package private, replace its committed version with the semantic-release sentinel, remove unused GitLab/changelog/git release dependencies, add explicit GitHub release support, and regenerate `package-lock.json`.
- [x] 1.2 Reconfigure semantic-release for `main` with commit analysis, release-note generation, and GitHub publication only; disable issue comments, pull-request comments, released labels, and failure issues.
- [x] 1.3 Document the supported Conventional Commit release types and that reachable `v${version}` tags, rather than `package.json`, define release state.

## 2. Add GitHub Actions validation

- [x] 2.1 Create the pull-request workflow for `main` with read-only contents access, Node.js 24 npm caching, locked dependency installation, integration tests, and a non-publishing Docker build.
- [x] 2.2 Add pull-request concurrency keyed by pull request and configure superseded validation runs to be cancelled.
- [x] 2.3 Create the `main` release workflow with complete Git history, Node.js 24 npm caching, locked dependency installation, integration tests, and a non-publishing Docker build before semantic-release.
- [x] 2.4 Grant only repository-content write access to the release job, pass the built-in GitHub token to semantic-release, and serialize `main` releases without cancelling an active run.

## 3. Remove GitLab integration

- [x] 3.1 Delete `.gitlab-ci.yml` and confirm that no GitLab CI or container-registry behavior is carried into the GitHub workflows.
- [x] 3.2 Update the README deployment and release guidance from GitLab to GitHub, including the Render repository connection instructions.
- [x] 3.3 Replace existing GitLab commit URLs in `CHANGELOG.md` with their equivalent GitHub repository URLs and clarify that future release notes are published with GitHub Releases.

## 4. Verify the migration

- [x] 4.1 Run the complete npm integration-test suite under a supported Node.js version.
- [x] 4.2 Build the production Docker image locally without logging in to or pushing to a registry.
- [x] 4.3 Validate both GitHub Actions workflow files for syntax, triggers, permissions, checkout depth, and concurrency behavior.
- [x] 4.4 Run semantic-release in dry-run mode with complete local history and confirm that it derives the expected next release from the latest reachable version tag without modifying tracked files.
- [x] 4.5 Search active automation, dependency metadata, semantic-release configuration, README, and changelog files and confirm that no case-insensitive GitLab reference remains.
- [x] 4.6 Record the GitHub repository settings required after merge: Actions content-write permission, compatible tag rules, and required pull-request validation checks on `main`.
