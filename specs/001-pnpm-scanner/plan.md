# Implementation Plan: pnpm Monorepo Scanner

**Branch**: `001-pnpm-scanner` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pnpm-scanner/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a pnpm monorepo scanner that detects workspace projects, extracts per-project dependencies from `pnpm-lock.yaml`, and identifies license information for each dependency. Output is JSON to stdout. This is the foundational Phase 1 feature enabling all downstream compliance functionality.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode, composite projects)
**Primary Dependencies**: yaml (YAML parsing), spdx-correct (license normalization), fast-glob (workspace pattern expansion)
**Storage**: N/A (reads filesystem only, no persistence)
**Testing**: Vitest (unit/integration), target 80% coverage
**Target Platform**: Node.js 20, 22, 24 LTS (cross-platform CLI)
**Project Type**: monorepo (apps/libs architecture)
**Performance Goals**: <15s for 500 deps, <60s for 2000 deps
**Constraints**: Offline-capable (no network calls during scan), 95% license detection rate
**Scale/Scope**: Monorepos with up to 2000 dependencies across multiple workspace projects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Functional Programming | Pure functions, no classes, no `this` | ✅ PASS | All scanner functions will be pure |
| II. Apps/Libs Architecture | Strict apps/libs separation | ✅ PASS | CLI in `apps/cli`, core logic in `libs/parsers`, `libs/dependency`, `libs/license` |
| III. Result Type Pattern | `Result<T, E>` for error handling | ✅ PASS | All parsing/extraction functions return Result types |
| IV. Type Safety & Immutability | Strict TS, readonly, no `any` | ✅ PASS | All entities defined with readonly interfaces |
| V. Test-Driven Development | TDD, 80% coverage | ✅ PASS | Tests first for all parsers and extractors |
| Technology Stack | pnpm, TS 5.3+, Vitest, ESLint 9.x | ✅ PASS | All aligned with constitution |
| Development Workflow | Feature branch, spec-first, rebase | ✅ PASS | Following `001-pnpm-scanner` branch pattern |

**Gate Status**: ✅ ALL GATES PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/001-pnpm-scanner/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
└── cli/
    ├── src/
    │   ├── commands/
    │   │   └── scan.ts           # CLI scan command entry point
    │   └── index.ts              # CLI main entry
    └── tests/
        └── commands/
            └── scan.test.ts

libs/
├── parsers/
│   ├── src/
│   │   ├── pnpm-lockfile.ts      # pnpm-lock.yaml parser
│   │   ├── pnpm-workspace.ts     # pnpm-workspace.yaml parser
│   │   ├── types.ts              # Parser type definitions
│   │   └── index.ts
│   └── tests/
│       ├── pnpm-lockfile.test.ts
│       └── pnpm-workspace.test.ts
│
├── dependency/
│   ├── src/
│   │   ├── detect-monorepo.ts    # Workspace detection
│   │   ├── extract-dependencies.ts # Per-project dependency extraction
│   │   ├── types.ts
│   │   └── index.ts
│   └── tests/
│       ├── detect-monorepo.test.ts
│       └── extract-dependencies.test.ts
│
├── license/
│   ├── src/
│   │   ├── extract-license.ts    # License extraction from package.json/LICENSE
│   │   ├── normalize-license.ts  # SPDX normalization
│   │   ├── types.ts
│   │   └── index.ts
│   └── tests/
│       ├── extract-license.test.ts
│       └── normalize-license.test.ts
│
└── testing/
    └── src/
        └── fixtures/             # Shared test fixtures (mock lockfiles, etc.)
```

**Structure Decision**: Apps/libs monorepo architecture per constitution. CLI app delegates to three feature libraries: `parsers` (lockfile/workspace parsing), `dependency` (project detection, dependency extraction), and `license` (license detection/normalization). Shared test fixtures in `libs/testing`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all gates pass. Design follows constitution principles.
