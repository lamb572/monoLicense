# MonoLicense Development Guidelines

Auto-generated from project documentation. Last updated: 2025-12-02

## Project Overview

MonoLicense is a monorepo-friendly license and dependency compliance tool for JS/TS teams. It scans pnpm/npm/yarn workspaces, extracts per-project dependencies, and enforces license policies.

## Active Technologies
- TypeScript 5.3+ (strict mode, composite projects) + yaml (YAML parsing), spdx-correct (license normalization), fast-glob (workspace pattern expansion) (001-pnpm-scanner)
- N/A (reads filesystem only, no persistence) (001-pnpm-scanner)
- TypeScript 5.3+ (existing project) + GitHub Actions, CodeRabbit, ESLint 9.x, eslint-plugin-functional (002-github-setup)
- N/A (configuration files only) (002-github-setup)

- **Language**: TypeScript 5.3+ (strict mode)
- **Package Manager**: pnpm 8.x with workspaces
- **Runtime**: Node.js 18, 20, or 22+ (LTS)
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Linting**: ESLint 9.x with `eslint-plugin-functional`
- **Formatting**: Prettier 3.x
- **CLI Framework**: Commander.js
- **Interactive Prompts**: @clack/prompts

## Project Structure

```text
monolicense/
├── apps/
│   ├── cli/                    # CLI tool (Node binary)
│   ├── web-dashboard/          # Web UI (v2.0+)
│   ├── api/                    # REST API (v2.0+)
│   └── bot/                    # GitHub Bot (v1.5+)
├── libs/
│   ├── dependency/             # Monorepo detection, dependency extraction
│   ├── license/                # License extraction & normalization
│   ├── approval/               # Approval matching
│   ├── policy/                 # Policy evaluation
│   ├── reporter/               # Report generation
│   ├── parsers/                # Lockfile parsers (pnpm, npm, yarn)
│   ├── utils/                  # General utilities
│   ├── testing/                # Shared test utilities
│   └── config/                 # Shared tool configs
├── docs/                       # Documentation
├── specs/                      # Feature specifications (spec-kit)
└── .specify/                   # Spec-kit templates and scripts
```

## Core Principles (Constitution)

### I. Functional Programming First
- Pure functions only, NO classes, NO `this` keyword
- All state explicit via parameters
- Enforced via ESLint `eslint-plugin-functional`

### II. Apps/Libs Architecture
- `apps/` = deployable applications
- `libs/` = reusable feature libraries
- Each lib owns its types and functions
- Zero circular dependencies

### III. Result Type Pattern
- Use `Result<T, E>` for error handling
- NO thrown exceptions for expected errors
- Return `{ success: true, data }` or `{ success: false, error }`

### IV. Type Safety & Immutability
- Strict TypeScript, NO `any` without justification
- All data structures use `readonly` modifiers
- Discriminated unions for state modeling

### V. Test-Driven Development
- TDD mandatory: Tests first → Fail → Implement → Pass
- Target 80% coverage (quality over quantity)
- Testing pyramid: 70% unit, 25% integration, 5% E2E

## Commands

```bash
# Development
pnpm install              # Install dependencies
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm lint                 # Run ESLint
pnpm format               # Run Prettier

# CLI (once built)
pnpm --filter @monolicense/cli dev    # Run CLI in dev mode
monolicense scan --format json        # Scan monorepo
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scope**: Package name (`cli`, `parsers`, `license`, `dependency`, `policy`, `approval`, `reporter`, `utils`, `testing`)

**Examples**:
- `feat(parsers): add pnpm lockfile v9 support`
- `fix(license): handle dual-license SPDX expressions`
- `docs: update README with quick start guide`
- `test(dependency): add workspace detection tests`
- `chore: upgrade TypeScript to 5.4`
- `refactor(cli): extract scan command to separate file`

**Rules**:
- Subject line max 72 characters
- Use imperative mood ("add" not "added")
- No period at end of subject
- Breaking changes: add `!` after type (e.g., `feat(cli)!: change output format`)

## Git Workflow

**Rebase-based workflow** - keep linear history, no merge commits:

```bash
# Sync feature branch with main
git checkout 001-feature-name
git fetch origin
git rebase main

# If conflicts, resolve then continue
git rebase --continue

# Force push after rebase (feature branches only)
git push --force-with-lease
```

**Never merge main into feature branches** - always rebase.

## Code Style

### TypeScript

```typescript
// ✅ Good: Pure function with explicit parameters
const extractLicense = (packagePath: string): Result<LicenseInfo, LicenseError> => {
  const packageJson = readPackageJson(packagePath);
  if (!packageJson.success) {
    return { success: false, error: packageJson.error };
  }
  return { success: true, data: normalizeLicense(packageJson.data.license) };
};

// ❌ Bad: Class with this
class LicenseExtractor {
  extract(path: string) {
    return this.normalize(this.read(path));
  }
}
```

### File Naming

- Functions: `kebab-case.ts` (e.g., `extract-license.ts`)
- Types: `types.ts` in each library
- Tests: `*.test.ts` co-located with source
- Barrel exports: `index.ts`

### Imports

```typescript
// ✅ Good: Explicit imports from workspace packages
import { extractLicense } from '@monolicense/license';
import type { LicenseInfo } from '@monolicense/license';

// ❌ Bad: Deep imports
import { extractLicense } from '@monolicense/license/src/extract-license';
```

## Spec-Kit Workflow

This project uses spec-kit for feature planning:

1. `/speckit.specify` - Create feature specification
2. `/speckit.plan` - Generate implementation plan
3. `/speckit.tasks` - Create task breakdown
4. `/speckit.implement` - Execute tasks

Feature specs live in `specs/NNN-feature-name/`.

## Recent Changes
- 002-github-setup: Added TypeScript 5.3+ (existing project) + GitHub Actions, CodeRabbit, ESLint 9.x, eslint-plugin-functional
- 001-pnpm-scanner: Added TypeScript 5.3+ (strict mode, composite projects) + yaml (YAML parsing), spdx-correct (license normalization), fast-glob (workspace pattern expansion)

- **001-pnpm-scanner** (In Progress): pnpm monorepo scanning with per-project dependency extraction and license detection

<!-- MANUAL ADDITIONS START -->
## Implementation Commit Workflow

**CRITICAL**: Commits must be made incrementally during implementation, not batched at the end.

### When to Commit

Commit after completing each logical unit of work:
- After creating a new package (package.json, tsconfig.json)
- After implementing a function and its tests passing
- After completing a task from tasks.md
- After fixing a bug or test failure
- After adding/updating types

### Commit Frequency Guidelines

- **Small commits**: 1-3 files changed, single logical change
- **Commit early, commit often**: Every 15-30 minutes of work should produce a commit
- **Never batch**: Don't accumulate hours of work before committing

### Example Commit Sequence for a Feature

```bash
# 1. Package setup
git add libs/license/package.json libs/license/tsconfig.json
git commit -m "chore(license): initialize package structure"

# 2. Types
git add libs/license/src/types.ts
git commit -m "feat(license): add LicenseInfo and LicenseSource types"

# 3. Tests first (TDD)
git add libs/license/tests/normalize-license.test.ts
git commit -m "test(license): add normalize-license tests"

# 4. Implementation
git add libs/license/src/normalize-license.ts
git commit -m "feat(license): implement SPDX license normalization"

# 5. Integration
git add libs/license/src/index.ts
git commit -m "feat(license): export license functions from index"
```

### Why This Matters

- Enables easy rollback if something breaks
- Creates clear history for code review
- Makes rebasing and conflict resolution easier
- Documents the implementation journey
<!-- MANUAL ADDITIONS END -->
