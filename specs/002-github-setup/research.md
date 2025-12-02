# Research: GitHub Repository Setup

**Feature**: 002-github-setup
**Date**: 2025-12-02
**Status**: Complete

## 1. GitHub Actions for pnpm Monorepos

### Decision: Use pnpm/action-setup with caching

**Rationale**: Official pnpm action provides proper workspace support and dependency caching.

**Alternatives considered**:
- Manual pnpm install via npm: Slower, no native caching
- yarn: Not compatible with existing pnpm-lock.yaml

### CI Workflow Structure

```yaml
# Recommended structure for pnpm monorepo
jobs:
  ci:
    strategy:
      matrix:
        node-version: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test
```

### Key Findings
- `pnpm/action-setup@v4` auto-detects pnpm version from `packageManager` field
- `--frozen-lockfile` ensures CI uses exact versions from lockfile
- Cache key based on `pnpm-lock.yaml` hash for optimal caching
- Matrix builds run in parallel by default

---

## 2. CodeRabbit Configuration

### Decision: Use `.coderabbit.yaml` with constitution-aligned rules

**Rationale**: CodeRabbit supports custom review instructions that can enforce our functional programming requirements.

**Alternatives considered**:
- GitHub Copilot PR review: Less customizable for specific patterns
- Manual review only: Doesn't scale, misses patterns

### Configuration Structure

```yaml
# .coderabbit.yaml
language: en-US
reviews:
  auto_review:
    enabled: true
    drafts: false
  path_instructions:
    - path: "**/*.ts"
      instructions: |
        Review for functional programming compliance:
        - No classes (use pure functions)
        - No 'this' keyword
        - No 'let' declarations (use const)
        - All types should use 'readonly' modifiers
        - Result<T,E> pattern for error handling
        - No thrown exceptions for expected errors
chat:
  auto_reply: true
```

### Key Findings
- `path_instructions` allows TypeScript-specific review guidance
- Can reference constitution principles in instructions
- Auto-review on PR open, not on draft PRs
- Supports inline suggestions for fixes

---

## 3. ESLint Functional Programming Rules

### Decision: Configure eslint-plugin-functional with strict rules

**Rationale**: Existing eslint-plugin-functional provides all rules needed to enforce constitution.

**Alternatives considered**:
- Custom ESLint rules: Maintenance burden, plugin already exists
- TypeScript compiler only: Doesn't catch class usage or let

### Rule Configuration

```javascript
// eslint.config.js additions
import functional from 'eslint-plugin-functional';

export default [
  {
    plugins: { functional },
    rules: {
      // Constitution I: Functional Programming First
      'functional/no-class': 'error',
      'functional/no-this-expression': 'error',
      'functional/immutable-data': 'error',
      'functional/no-let': 'error',
      'functional/prefer-readonly-type': 'warn',

      // Constitution II: No circular dependencies
      'import/no-cycle': 'error',
    }
  }
];
```

### Key Findings
- `no-class` prevents class declarations and expressions
- `no-this-expression` catches `this` in any context
- `immutable-data` prevents array/object mutation
- `no-let` enforces const declarations
- `prefer-readonly-type` suggests readonly but allows override
- Need `eslint-plugin-import` for circular dependency detection

---

## 4. Branch Protection Rules

### Decision: Configure via GitHub UI (initially), document for API automation later

**Rationale**: UI configuration is simpler for initial setup; can automate later if needed.

**Required Settings**:
- Require pull request reviews before merging
- Require status checks to pass before merging
  - Required checks: `ci` workflow (all matrix jobs)
- Require branches to be up to date before merging
- Do not allow bypassing the above settings

### Key Findings
- Branch protection applies to `main` branch
- Status checks must complete on all Node versions (matrix)
- Can require CodeRabbit approval as additional check
- Settings persist across repository

---

## 5. Repository Remote Setup

### Decision: Add remote and push all branches

**Rationale**: Preserve complete commit history and all feature branches.

**Commands**:
```bash
git remote add origin https://github.com/lamb572/monoLicense.git
git push -u origin --all
git push origin --tags
```

### Key Findings
- `--all` pushes all local branches
- `--tags` pushes all tags (if any)
- `-u origin` sets upstream tracking
- Repository must exist on GitHub first (can be empty)

---

## Summary of Decisions

| Topic | Decision | Key Dependency |
|-------|----------|----------------|
| CI Tool | GitHub Actions with pnpm/action-setup | pnpm/action-setup@v4 |
| Node Versions | Matrix: 20, 22, 24 | actions/setup-node@v4 |
| PR Review | CodeRabbit with constitution instructions | .coderabbit.yaml |
| Linting | eslint-plugin-functional strict mode | eslint-plugin-functional |
| Circular Deps | eslint-plugin-import no-cycle | eslint-plugin-import |
| Branch Protection | GitHub UI configuration | N/A |
