# Feature Specification: pnpm Monorepo Scanner

**Feature Branch**: `001-pnpm-scanner`
**Created**: 2025-12-02
**Status**: Draft
**Input**: User description: "pnpm monorepo scanning with per-project dependency extraction and license detection"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan pnpm Monorepo (Priority: P1)

As a developer working in a pnpm monorepo, I want to run a scan command that identifies all my projects and their dependencies, so I can see exactly which packages each project uses.

**Why this priority**: This is the core value proposition - without accurate dependency detection per project, all other features (license checking, policy enforcement) cannot function. This is the foundation.

**Independent Test**: Can be fully tested by running the scanner on any pnpm monorepo and verifying that each project's dependencies are correctly listed. Delivers immediate value by providing per-project dependency visibility.

**Acceptance Scenarios**:

1. **Given** a pnpm monorepo with `pnpm-workspace.yaml` and `pnpm-lock.yaml`, **When** I run the scan command, **Then** I see a list of all projects detected in the workspace with their paths.

2. **Given** a detected project at `apps/web`, **When** the scanner analyzes its dependencies, **Then** I see all direct dependencies from that project's `package.json` along with their resolved versions from the lockfile.

3. **Given** a project with nested transitive dependencies, **When** the scanner runs, **Then** both direct and transitive dependencies are captured with their complete version information.

4. **Given** a project using workspace protocol dependencies (`workspace:*`), **When** the scanner runs, **Then** internal workspace packages are correctly identified and distinguished from external npm packages.

---

### User Story 2 - Extract License Information (Priority: P2)

As a developer, I want to see the license for each dependency detected, so I can understand what licenses my project is using without manually checking each package.

**Why this priority**: License detection is essential for the product's core purpose (compliance), but requires dependency detection (P1) to work first. Without licenses, users cannot evaluate compliance.

**Independent Test**: Can be tested by scanning a monorepo and verifying that licenses are displayed for each dependency. Delivers value by eliminating manual license lookup.

**Acceptance Scenarios**:

1. **Given** a dependency with a `license` field in its `package.json`, **When** the scanner extracts license info, **Then** the license identifier is captured (e.g., "MIT", "Apache-2.0").

2. **Given** a dependency without a `license` field but with a LICENSE file, **When** the scanner extracts license info, **Then** the license is detected from the file content.

3. **Given** a dependency with a non-standard license identifier (e.g., "Apache 2.0"), **When** the scanner processes it, **Then** the license is normalized to SPDX format ("Apache-2.0").

4. **Given** a dependency with no detectable license, **When** the scanner processes it, **Then** the license is marked as "UNKNOWN" rather than failing.

---

### User Story 3 - JSON Output (Priority: P3)

As a developer or CI system, I want to get scan results in JSON format, so I can programmatically process the dependency and license data.

**Why this priority**: Machine-readable output enables automation and integration. Less critical than detection accuracy but required for CI usage.

**Independent Test**: Can be tested by running scan with JSON output flag and validating the JSON structure. Delivers value by enabling scripting and automation.

**Acceptance Scenarios**:

1. **Given** a completed scan, **When** I request JSON output, **Then** I receive valid JSON containing all projects, dependencies, and licenses.

2. **Given** JSON output, **When** I parse it, **Then** each project has a name, path, and array of dependencies with package name, version, and license.

3. **Given** a scan error (e.g., missing lockfile), **When** JSON output is requested, **Then** the error is returned in a structured JSON format with error type and message.

---

### Edge Cases

- What happens when `pnpm-lock.yaml` is missing? System reports clear error indicating the file is required.
- What happens when `pnpm-workspace.yaml` is missing but `pnpm-lock.yaml` exists? System treats it as a single-project repository.
- What happens when a workspace glob pattern matches no directories? System reports warning but continues with found projects.
- How does the system handle corrupted or malformed lockfile? System reports parse error with line number if possible.
- What happens when `node_modules` is missing for a package? License extraction falls back to lockfile metadata or marks as "UNKNOWN".
- How does the system handle circular dependencies? Dependencies are deduplicated; each unique package@version appears once.
- What happens with very large monorepos (1000+ packages)? System completes within reasonable time (target: <60 seconds for 2000 packages).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect pnpm workspaces by reading `pnpm-workspace.yaml` configuration file.
- **FR-002**: System MUST parse `pnpm-lock.yaml` to extract exact dependency versions (lockfile version 6.0+).
- **FR-003**: System MUST enumerate all projects defined in workspace configuration including glob pattern expansion.
- **FR-004**: System MUST map dependencies to their respective projects, distinguishing per-project dependency trees.
- **FR-005**: System MUST identify and separate internal workspace packages from external npm dependencies.
- **FR-006**: System MUST extract license information from package.json `license` field as primary source.
- **FR-007**: System MUST fall back to LICENSE file parsing when package.json license field is absent.
- **FR-008**: System MUST normalize license identifiers to SPDX format (e.g., "Apache 2.0" → "Apache-2.0").
- **FR-009**: System MUST mark packages with undetectable licenses as "UNKNOWN" rather than failing.
- **FR-010**: System MUST output results in JSON format to stdout.
- **FR-011**: System MUST provide clear error messages when required files are missing or malformed.
- **FR-012**: System MUST handle workspace protocol references (`workspace:*`, `workspace:^`, etc.).
- **FR-013**: System MUST deduplicate dependencies across the monorepo (same package@version counted once).

### Non-Functional Requirements

- **NFR-001**: System MUST complete scanning of a 500-dependency monorepo in under 15 seconds.
- **NFR-002**: System MUST achieve 95% or higher license detection rate for packages with valid license data.
- **NFR-003**: System MUST work offline after initial installation (no network calls during scan).

### Key Entities

- **Project**: A workspace member with a name, path, and list of dependencies. Represents an app or library in the monorepo.
- **Dependency**: A package with name, version, and license. Can be external (npm) or internal (workspace).
- **LicenseInfo**: License identifier (SPDX format), source of detection (package.json, LICENSE file, or unknown), and raw value if different from normalized.
- **ScanResult**: Collection of projects with their dependencies, plus metadata (scan timestamp, monorepo root, lockfile version).
- **LockfileData**: Parsed representation of pnpm-lock.yaml including packages, importers, and version mappings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Scan correctly identifies 100% of projects defined in `pnpm-workspace.yaml` for tested monorepos.
- **SC-002**: Scan correctly captures all dependencies for each project with accurate version numbers matching the lockfile.
- **SC-003**: License detection succeeds for 95% or more of dependencies that have valid license information.
- **SC-004**: Users can view per-project dependency breakdown without manual analysis (verified by JSON containing project-grouped data).
- **SC-005**: Scan completes in under 15 seconds for monorepos with up to 500 dependencies.
- **SC-006**: Scan completes in under 60 seconds for monorepos with up to 2000 dependencies.
- **SC-007**: All unit tests pass with 80% or higher code coverage.

## Assumptions

- Users have pnpm installed and their monorepo uses `pnpm-workspace.yaml` for workspace configuration.
- The `pnpm-lock.yaml` file is present and up-to-date (users have run `pnpm install`).
- Node.js LTS version (20, 22, or 24) is available in the execution environment.
- For license extraction from `node_modules`, the modules are installed locally.
- The lockfile format is pnpm v6.0+ (YAML-based format with `packages` and `importers` sections).

## Out of Scope

- npm and Yarn lockfile support (Phase 2)
- Configuration file support (`monolicense.config.json`) (Phase 2)
- Policy checking (allowed/forbidden licenses) (Phase 2)
- Approval workflow (Phase 2)
- Console/Markdown output formats (Phase 2)
- Interactive CLI prompts (Phase 3)
- GitHub Action integration (Phase 3)
