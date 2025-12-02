# Tasks: pnpm Monorepo Scanner

**Input**: Design documents from `/specs/001-pnpm-scanner/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD is mandated by constitution (Principle V). Tests are written first, verified to fail, then implementation proceeds.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md, this project uses apps/libs monorepo structure:
- `apps/cli/` - CLI application
- `libs/parsers/` - Lockfile and workspace parsers
- `libs/dependency/` - Dependency detection and extraction
- `libs/license/` - License detection and normalization
- `libs/testing/` - Shared test fixtures
- `libs/utils/` - Shared utilities including Result type

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic monorepo structure

- [x] T001 Create monorepo directory structure per plan.md (apps/, libs/)
- [x] T002 Initialize root package.json with pnpm workspaces configuration
- [x] T003 [P] Create pnpm-workspace.yaml with apps/* and libs/* patterns
- [x] T004 [P] Create root tsconfig.json with composite project references
- [x] T005 [P] Configure ESLint 9.x with eslint-plugin-functional in libs/config/
- [x] T006 [P] Configure Prettier 3.x in libs/config/
- [x] T007 [P] Configure Vitest in libs/config/
- [x] T008 Initialize libs/utils package with package.json and tsconfig.json
- [x] T009 Implement Result type utilities in libs/utils/src/result.ts
- [x] T010 Initialize libs/testing package with package.json and tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and fixtures that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create shared error types in libs/utils/src/errors.ts (ScanError discriminated union)
- [x] T012 [P] Create test fixtures directory structure in libs/testing/src/fixtures/
- [x] T013 [P] Create mock pnpm-workspace.yaml fixtures in libs/testing/src/fixtures/workspaces/
- [x] T014 [P] Create mock pnpm-lock.yaml fixtures (v6.0 format) in libs/testing/src/fixtures/lockfiles/
- [x] T015 [P] Create mock package.json fixtures with various license formats in libs/testing/src/fixtures/packages/
- [x] T016 [P] Create mock LICENSE file fixtures in libs/testing/src/fixtures/licenses/
- [x] T017 Export all fixtures from libs/testing/src/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Scan pnpm Monorepo (Priority: P1) 🎯 MVP

**Goal**: Detect workspace projects and extract per-project dependencies from pnpm-lock.yaml

**Independent Test**: Run scanner on any pnpm monorepo, verify all projects detected with correct dependencies listed per project

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (TDD per constitution)**

- [ ] T018 [P] [US1] Test parsePnpmWorkspace in libs/parsers/tests/pnpm-workspace.test.ts
- [ ] T019 [P] [US1] Test parsePnpmLockfile in libs/parsers/tests/pnpm-lockfile.test.ts
- [ ] T020 [P] [US1] Test detectMonorepo in libs/dependency/tests/detect-monorepo.test.ts
- [ ] T021 [P] [US1] Test extractDependencies in libs/dependency/tests/extract-dependencies.test.ts

### Implementation for User Story 1

- [ ] T022 Initialize libs/parsers package with package.json, tsconfig.json
- [ ] T023 [P] [US1] Create parser types in libs/parsers/src/types.ts (LockfileData, ImporterData, WorkspaceConfig)
- [ ] T024 [P] [US1] Add yaml dependency to libs/parsers/package.json
- [ ] T025 [US1] Implement parsePnpmWorkspace in libs/parsers/src/pnpm-workspace.ts (reads pnpm-workspace.yaml, returns Result)
- [ ] T026 [US1] Implement parsePnpmLockfile in libs/parsers/src/pnpm-lockfile.ts (reads pnpm-lock.yaml, returns Result with LockfileData)
- [ ] T027 [US1] Export parsers from libs/parsers/src/index.ts
- [ ] T028 Initialize libs/dependency package with package.json, tsconfig.json
- [ ] T029 [P] [US1] Create dependency types in libs/dependency/src/types.ts (Project, Dependency without license field)
- [ ] T030 [P] [US1] Add fast-glob dependency to libs/dependency/package.json
- [ ] T031 [US1] Implement detectMonorepo in libs/dependency/src/detect-monorepo.ts (glob expansion, project enumeration)
- [ ] T032 [US1] Implement extractDependencies in libs/dependency/src/extract-dependencies.ts (per-project dependency extraction from lockfile)
- [ ] T033 [US1] Handle workspace: protocol references in extractDependencies
- [ ] T034 [US1] Export dependency functions from libs/dependency/src/index.ts

**Checkpoint**: User Story 1 complete - scanner detects projects and extracts dependencies (without licenses)

---

## Phase 4: User Story 2 - Extract License Information (Priority: P2)

**Goal**: Detect and normalize license information for each dependency

**Independent Test**: Scan monorepo, verify each dependency shows license from package.json or LICENSE file, normalized to SPDX format

### Tests for User Story 2

- [ ] T035 [P] [US2] Test extractLicense in libs/license/tests/extract-license.test.ts
- [ ] T036 [P] [US2] Test normalizeLicense in libs/license/tests/normalize-license.test.ts

### Implementation for User Story 2

- [ ] T037 Initialize libs/license package with package.json, tsconfig.json
- [ ] T038 [P] [US2] Create license types in libs/license/src/types.ts (LicenseInfo, LicenseSource)
- [ ] T039 [P] [US2] Add spdx-correct dependency to libs/license/package.json
- [ ] T040 [US2] Implement extractLicenseFromPackageJson in libs/license/src/extract-license.ts (read license field)
- [ ] T041 [US2] Implement extractLicenseFromFile in libs/license/src/extract-license.ts (read LICENSE/LICENSE.md files)
- [ ] T042 [US2] Implement extractLicense with fallback chain in libs/license/src/extract-license.ts
- [ ] T043 [US2] Implement normalizeLicense in libs/license/src/normalize-license.ts (spdx-correct integration)
- [ ] T044 [US2] Handle legacy licenses array format in extractLicense
- [ ] T045 [US2] Export license functions from libs/license/src/index.ts
- [ ] T046 [US2] Update Dependency type in libs/dependency/src/types.ts to include LicenseInfo
- [ ] T047 [US2] Integrate license extraction into dependency extraction pipeline

**Checkpoint**: User Story 2 complete - dependencies include license information

---

## Phase 5: User Story 3 - JSON Output (Priority: P3)

**Goal**: Output complete scan results as valid JSON to stdout

**Independent Test**: Run scan command, pipe output to jq, validate against JSON schema in contracts/

### Tests for User Story 3

- [ ] T048 [P] [US3] Test buildScanResult in libs/dependency/tests/build-scan-result.test.ts
- [ ] T049 [P] [US3] Test scan command E2E in apps/cli/tests/commands/scan.test.ts

### Implementation for User Story 3

- [ ] T050 [US3] Create ScanResult, ScanMetadata, ScanSummary types in libs/dependency/src/types.ts
- [ ] T051 [US3] Implement buildScanResult in libs/dependency/src/build-scan-result.ts (aggregate projects, compute summary)
- [ ] T052 [US3] Implement deduplication logic in buildScanResult (FR-013)
- [ ] T053 [US3] Implement licenseCounts computation in ScanSummary
- [ ] T054 Initialize apps/cli package with package.json, tsconfig.json
- [ ] T055 [P] [US3] Add commander dependency to apps/cli/package.json
- [ ] T056 [US3] Create CLI entry point in apps/cli/src/index.ts
- [ ] T057 [US3] Implement scan command in apps/cli/src/commands/scan.ts
- [ ] T058 [US3] Wire up scan command: parse args → call libs → output JSON
- [ ] T059 [US3] Implement error output in JSON format (per scan-error.schema.json)
- [ ] T060 [US3] Add --root option to scan command
- [ ] T061 [US3] Export CLI as bin in apps/cli/package.json

**Checkpoint**: User Story 3 complete - full scan with JSON output working

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T062 [P] Add JSDoc documentation to all exported functions
- [ ] T063 [P] Validate JSON output against contracts/scan-output.schema.json
- [ ] T064 [P] Validate error output against contracts/scan-error.schema.json
- [ ] T065 Performance testing: verify <15s for 500 deps (NFR-001)
- [ ] T066 [P] Add edge case handling for missing pnpm-workspace.yaml (single-project mode)
- [ ] T067 [P] Add edge case handling for empty glob matches (warning, continue)
- [ ] T068 [P] Add edge case handling for malformed lockfile (parse error with line number)
- [ ] T069 Run full test suite, verify 80% coverage target (SC-007)
- [ ] T070 Update quickstart.md with actual usage examples

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) or sequentially in priority order
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 output (dependency list)
- **User Story 3 (P3)**: Depends on US1 and US2 - needs both dependencies and licenses to output

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Types before implementation
- Core functions before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Test tasks within each story marked [P] can run in parallel
- Once Foundational phase completes:
  - US1 can start immediately
  - US2 can start after US1 core types exist (T029)
  - US3 requires US1 and US2 to be complete

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Test parsePnpmWorkspace in libs/parsers/tests/pnpm-workspace.test.ts"
Task: "Test parsePnpmLockfile in libs/parsers/tests/pnpm-lockfile.test.ts"
Task: "Test detectMonorepo in libs/dependency/tests/detect-monorepo.test.ts"
Task: "Test extractDependencies in libs/dependency/tests/extract-dependencies.test.ts"

# Launch types for User Story 1 together:
Task: "Create parser types in libs/parsers/src/types.ts"
Task: "Create dependency types in libs/dependency/src/types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Scanner should detect all projects in a pnpm monorepo
   - Scanner should list dependencies per project
   - No license info yet (that's US2)
5. Demo/review if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Dependency detection works (MVP!)
3. Add User Story 2 → Test independently → License info added
4. Add User Story 3 → Test independently → JSON output works
5. Each story adds value without breaking previous stories

### Recommended Execution Order (Single Developer)

1. T001-T010 (Setup)
2. T011-T017 (Foundational)
3. T018-T021 (US1 Tests - write, verify fail)
4. T022-T034 (US1 Implementation)
5. Verify US1 tests pass
6. T035-T036 (US2 Tests)
7. T037-T047 (US2 Implementation)
8. Verify US2 tests pass
9. T048-T049 (US3 Tests)
10. T050-T061 (US3 Implementation)
11. Verify US3 tests pass
12. T062-T070 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD: Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
