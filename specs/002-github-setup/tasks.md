# Tasks: GitHub Repository Setup

**Input**: Design documents from `/specs/002-github-setup/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not required for this feature (configuration-only, verified by CI passing)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and prepare for GitHub setup

- [x] T001 Verify GitHub CLI is installed and authenticated (`gh auth status`)
- [x] T002 Verify repository exists at https://github.com/lamb572/monoLicense (or create it)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Verify local git repository is clean and ready to push (`git status`)
- [x] T004 Add GitHub remote origin if not already configured (`git remote add origin`)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Push Code to GitHub (Priority: P1) 🎯 MVP

**Goal**: Push the existing MonoLicense codebase to GitHub with full commit history

**Independent Test**: Clone `https://github.com/lamb572/monoLicense` and run `pnpm install && pnpm build && pnpm test`

### Implementation for User Story 1

- [x] T005 [US1] Push all branches to GitHub remote (`git push -u origin --all`)
- [x] T006 [US1] Push all tags to GitHub remote (`git push origin --tags`)
- [x] T007 [US1] Verify all branches appear on GitHub (check via `gh repo view` or web UI)

**Checkpoint**: Code is accessible at https://github.com/lamb572/monoLicense with full commit history

---

## Phase 4: User Story 2 - Automated CI Checks (Priority: P2)

**Goal**: GitHub Actions automatically runs lint, build, and test on every push and PR across Node.js 20, 22, 24

**Independent Test**: Create test branch with lint error, push, verify CI fails. Fix error, push again, verify CI passes.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Create CI workflow for push events in `.github/workflows/ci.yml`
- [ ] T009 [P] [US2] Create PR workflow with Node.js matrix (20, 22, 24) in `.github/workflows/pr.yml`
- [ ] T010 [US2] Push workflow files to GitHub and verify CI runs
- [ ] T011 [US2] Configure branch protection on `main` requiring CI checks to pass
- [ ] T012 [US2] Configure branch protection to require PR before merging
- [ ] T013 [US2] Verify branch protection by attempting direct push to main (should fail)

**Checkpoint**: All CI checks pass on main branch, PRs cannot merge without passing CI

---

## Phase 5: User Story 3 - CodeRabbit PR Reviews (Priority: P3)

**Goal**: CodeRabbit automatically reviews PRs with constitution-aligned feedback

**Independent Test**: Open a PR with code changes, verify CodeRabbit posts review within 5 minutes

### Implementation for User Story 3

- [ ] T014 [US3] Create CodeRabbit configuration in `.coderabbit.yaml` with constitution rules
- [ ] T015 [US3] Verify CodeRabbit app is installed on repository (Settings → Integrations)
- [ ] T016 [US3] Push config and open test PR to verify CodeRabbit responds
- [ ] T017 [US3] Verify CodeRabbit checks for functional programming patterns (no classes, no this)

**Checkpoint**: CodeRabbit posts review comments on 100% of new pull requests

---

## Phase 6: User Story 4 - ESLint Constitution Enforcement (Priority: P4)

**Goal**: ESLint rules enforce functional programming constitution at development time

**Independent Test**: Write code with a class, verify ESLint reports error locally and in CI

### Implementation for User Story 4

- [ ] T018 [US4] Install eslint-plugin-functional and eslint-plugin-import as dev dependencies
- [ ] T019 [US4] Update ESLint config in `eslint.config.js` with functional programming rules
- [ ] T020 [US4] Configure `no-class` rule (error) in `eslint.config.js`
- [ ] T021 [US4] Configure `no-this-expression` rule (error) in `eslint.config.js`
- [ ] T022 [US4] Configure `immutable-data` rule (error) in `eslint.config.js`
- [ ] T023 [US4] Configure `no-let` rule (error) in `eslint.config.js`
- [ ] T024 [US4] Configure `prefer-readonly-type` rule (warn) in `eslint.config.js`
- [ ] T025 [US4] Configure `import/no-cycle` rule for circular dependency detection in `eslint.config.js`
- [ ] T026 [US4] Run `pnpm lint` to verify all rules pass on existing codebase
- [ ] T027 [US4] Create test file with class declaration, verify lint fails, then remove test file

**Checkpoint**: ESLint catches 100% of class declarations, `this` usage, and `let` declarations

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T028 Update agent context with feature completion (`.specify/scripts/bash/update-agent-context.sh`)
- [ ] T029 Run quickstart.md validation - verify all setup instructions work
- [ ] T030 Verify SC-008: CI runs complete in under 5 minutes

---

## Follow-up: Fix Lint Warnings (Future Task)

**Purpose**: Address functional programming violations in existing code

**Note**: These are warnings, not errors. The codebase currently has mutation patterns that should be refactored to pure functional style.

- [ ] F001 Refactor `libs/dependency/src/build-scan-result.ts` to use immutable patterns (avoid `.push()`)
- [ ] F002 Refactor `libs/dependency/src/detect-monorepo.ts` to use immutable patterns
- [ ] F003 Refactor `libs/parsers/src/pnpm-lockfile.ts` to use immutable patterns
- [ ] F004 Refactor `libs/license/src/extract-license.ts` to remove `let` usage
- [ ] F005 Refactor `libs/utils/src/result.ts` to use immutable patterns
- [ ] F006 Refactor `apps/cli/src/commands/scan.ts` to reduce mutation (use `reduce` instead of `for` + `push`)
- [ ] F007 Add `readonly` modifiers to all type definitions per `prefer-readonly-type` warnings

**Approach**: Use `reduce`, spread operators, and `concat` instead of `push`. Replace `let` with `const` and restructure logic.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MUST complete before US2, US3
- **User Story 2 (Phase 4)**: Depends on US1 (code must be on GitHub for CI to run)
- **User Story 3 (Phase 5)**: Depends on US1 (code must be on GitHub for CodeRabbit)
- **User Story 4 (Phase 6)**: Can run in parallel with US2/US3 (local ESLint config)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - Can start after Phase 2
- **User Story 2 (P2)**: Requires US1 complete (GitHub Actions needs code on GitHub)
- **User Story 3 (P3)**: Requires US1 complete (CodeRabbit needs repository on GitHub)
- **User Story 4 (P4)**: Foundation only - Can run in parallel with US2/US3

### Within Each User Story

- Configuration files before verification
- Push before external validation
- Commit after each task or logical group

### Parallel Opportunities

- T008 and T009 (CI workflow and PR workflow) can run in parallel
- US2 and US4 can run in parallel after US1 completes (different concerns)
- US3 and US4 can run in parallel (CodeRabbit config vs ESLint config)

---

## Parallel Example: User Story 2

```bash
# Launch workflow file creation in parallel:
Task: "Create CI workflow in .github/workflows/ci.yml"
Task: "Create PR workflow in .github/workflows/pr.yml"
```

## Parallel Example: After US1 Completes

```bash
# These three user stories can be worked on in parallel:
User Story 2: Configure GitHub Actions CI
User Story 3: Configure CodeRabbit
User Story 4: Update ESLint rules (independent of GitHub)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Push to GitHub)
4. **STOP and VALIDATE**: Clone repo, run build, verify everything works
5. Code is now safely on GitHub

### Incremental Delivery

1. Complete Setup + Foundational → Ready to push
2. Complete US1 → Code on GitHub (MVP!)
3. Complete US2 → CI protecting main branch
4. Complete US3 → Automated PR reviews
5. Complete US4 → Local development enforcement
6. Each story adds quality gates without breaking previous work

### Recommended Order

Since US2 and US3 both depend on US1, and US4 is independent:

1. **US1** (Push code) - Foundation for everything
2. **US4** (ESLint) - Can do immediately, improves local dev
3. **US2** (CI) - Protects main branch
4. **US3** (CodeRabbit) - Adds PR review automation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This is a configuration-only feature - no new source code
- Verify each phase before proceeding to next
- Commit after each task or logical group
- Branch protection must be configured via GitHub UI (not API for initial setup)
