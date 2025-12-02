# Quick Start: GitHub Repository Setup

## Prerequisites

- Git installed locally
- GitHub account with access to `lamb572/monoLicense`
- CodeRabbit app installed on the repository (https://coderabbit.ai)

## Initial Setup

### 1. Push Code to GitHub

```bash
# Add remote (if not already added)
git remote add origin https://github.com/lamb572/monoLicense.git

# Push all branches
git push -u origin --all

# Push tags (if any)
git push origin --tags
```

### 2. Verify CI is Running

1. Go to https://github.com/lamb572/monoLicense/actions
2. Confirm CI workflow runs on push
3. Check all Node.js versions (20, 22, 24) pass

### 3. Configure Branch Protection

1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Add required status checks: `ci` (all matrix jobs)

### 4. Verify CodeRabbit

1. Open a test PR
2. Wait for CodeRabbit to post review (< 5 minutes)
3. Verify it checks for functional programming patterns

## Development Workflow

### Creating a Feature

```bash
# Create feature branch
git checkout -b NNN-feature-name

# Make changes following TDD
# ... write tests, implement, commit incrementally ...

# Push to GitHub
git push -u origin NNN-feature-name

# Open PR via GitHub UI or CLI
gh pr create --title "feat(scope): description" --body "..."
```

### PR Requirements

Before merge, PRs must have:
- ✅ All CI checks passing (lint, build, test on Node 20/22/24)
- ✅ CodeRabbit review completed
- ✅ No unresolved review comments

### Running Checks Locally

```bash
# Run all checks (same as CI)
pnpm lint
pnpm build
pnpm test

# Fix lint issues automatically
pnpm lint --fix
```

## Troubleshooting

### CI Fails on Lint

```bash
# Check lint errors locally
pnpm lint

# Common issues:
# - Using 'let' instead of 'const'
# - Using classes
# - Missing readonly on types
```

### CI Fails on Build

```bash
# Rebuild locally
pnpm build

# Check TypeScript errors
pnpm exec tsc --noEmit
```

### CI Fails on Test

```bash
# Run tests locally
pnpm test

# Run specific test file
pnpm exec vitest run path/to/test.ts
```

### CodeRabbit Not Responding

1. Check CodeRabbit is installed: Settings → Integrations
2. Verify `.coderabbit.yaml` exists in repo root
3. Check CodeRabbit service status: https://status.coderabbit.ai
