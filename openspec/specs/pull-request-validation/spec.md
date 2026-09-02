# pull-request-validation Specification

## Purpose
Define the GitHub Actions checks that protect pull requests targeting `main`, including dependency auditing, integration testing, production image construction, least-privilege permissions, and superseded-run cancellation.

## Requirements
### Requirement: Pull requests are validated on GitHub
The repository SHALL automatically validate every pull request whose target branch is `main` using GitHub Actions.

#### Scenario: Pull request opens against main
- **WHEN** a pull request targeting `main` is opened, reopened, or updated
- **THEN** the pull-request validation workflow runs against the proposed repository state

#### Scenario: Pull request targets another branch
- **WHEN** a pull request targets a branch other than `main`
- **THEN** the `main` pull-request validation workflow is not required to run

### Requirement: Node integration tests gate pull requests
The pull-request workflow SHALL install the locked dependency graph with Node.js 24 and SHALL run the repository's npm test command.

#### Scenario: Integration tests pass
- **WHEN** dependency installation succeeds and every integration test passes
- **THEN** the test portion of pull-request validation succeeds

#### Scenario: Integration tests fail
- **WHEN** dependency installation fails or any integration test fails
- **THEN** pull-request validation reports a failed check

### Requirement: High-severity dependency vulnerabilities gate pull requests
After locked dependency installation, the pull-request workflow SHALL audit the installed dependency graph and SHALL fail when npm reports a vulnerability with high or critical severity.

#### Scenario: No high-severity vulnerability is reported
- **WHEN** the dependency audit reports no high or critical vulnerability
- **THEN** the vulnerability check succeeds and pull-request validation continues

#### Scenario: High-severity vulnerability is reported
- **WHEN** the dependency audit reports at least one high or critical vulnerability
- **THEN** pull-request validation reports a failed check

#### Scenario: Only lower-severity vulnerabilities are reported
- **WHEN** the dependency audit reports only low or moderate vulnerabilities
- **THEN** the findings remain visible in the workflow log and the vulnerability check does not fail because of their severity

#### Scenario: Dependency audit cannot complete
- **WHEN** the dependency audit exits unsuccessfully without producing a valid vulnerability result
- **THEN** pull-request validation reports a failed check rather than bypassing the audit

### Requirement: Production Docker construction gates pull requests
The pull-request workflow SHALL build the repository's production Dockerfile and SHALL NOT publish the resulting image.

#### Scenario: Production image builds
- **WHEN** the Dockerfile produces an image successfully
- **THEN** the build portion of pull-request validation succeeds without authenticating to a container registry

#### Scenario: Production image fails to build
- **WHEN** the Docker build exits unsuccessfully
- **THEN** pull-request validation reports a failed check

### Requirement: Pull-request validation is read-only
The pull-request workflow MUST use read-only repository permissions and MUST NOT receive release, npm, or container-registry credentials.

#### Scenario: Pull request originates from an untrusted fork
- **WHEN** validation runs for a pull request from a fork
- **THEN** the workflow can test and build the proposed code without access to write-capable repository credentials or publishing secrets

### Requirement: Superseded pull-request validation is cancelled
The repository SHALL cancel an older in-progress validation run when a newer commit updates the same pull request.

#### Scenario: A pull request receives another commit
- **WHEN** validation for an earlier commit is still running and the pull request is updated
- **THEN** the older run is cancelled and validation continues for the newest proposed state
