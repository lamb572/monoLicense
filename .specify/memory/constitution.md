# MonoLicense Constitution

## Core Principles

### I. Functional Programming First
Pure functions, no classes, no `this` keyword. All state is explicit via parameters.
Enforced via ESLint with `eslint-plugin-functional` rules (no-class, no-this-expression,
immutable-data, no-let, prefer-readonly-type). Classes allowed ONLY when required by
third-party libraries with explicit code review justification.

### II. Apps/Libs Architecture
Strict separation: `apps/` contains deployable applications, `libs/` contains reusable
feature libraries. Each library is self-contained with its own types and functions.
No shared "kitchen sink" packages. Zero circular dependencies enforced via ESLint
import rules.

### III. Result Type Pattern
Explicit error handling using `Result<T, E>` discriminated unions. No thrown exceptions
for expected errors. Functions return `{ success: true, data: T }` or
`{ success: false, error: E }`. Railway-oriented programming for composing operations.

### IV. Type Safety & Immutability
Strict TypeScript (`tsc --strict`) with comprehensive type coverage. All data structures
use `readonly` modifiers. Discriminated unions for state modeling. No `any` type without
explicit justification.

### V. Test-Driven Development
TDD mandatory: Tests written → Tests fail → Implement → Tests pass → Refactor.
Target 80% coverage (quality over quantity). Testing pyramid: 70% unit, 25% integration,
5% E2E. Shared testing utilities in `libs/testing`. Every function independently testable.

## Technology Stack

- **Runtime**: Node.js 20, 22, or 24 (LTS versions)
- **Package Manager**: pnpm 8.x with workspaces
- **Language**: TypeScript 5.3+ (strict mode, composite projects)
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Linting**: ESLint 9.x with functional plugin
- **Formatting**: Prettier 3.x
- **CI**: GitHub Actions with all checks required (test matrix: Node 20, 22, 24)

## Development Workflow

1. **Feature branches**: Named `NNN-feature-name` (e.g., `001-pnpm-parser`)
2. **Spec-first**: Features start with `/speckit.specify` before code
3. **TDD cycle**: Red → Green → Refactor strictly enforced
4. **PR review**: All changes require review, CI must pass
5. **No direct commits**: All changes via PR to main branch
6. **Commit messages**: Follow Conventional Commits format (`type(scope): subject`)
7. **Rebase workflow**: Feature branches rebase onto main (no merge commits)

## Governance

This constitution supersedes all other practices. Violations require explicit
justification documented in PR description. Amendments require:
1. Documentation of rationale
2. Review and approval
3. Migration plan for existing code

**Version**: 1.0.0 | **Ratified**: 2025-12-02 | **Last Amended**: 2025-12-02
