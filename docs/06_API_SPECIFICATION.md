# MonoLicense - API Specification

This document defines the complete CLI interface for MonoLicense, including all commands, flags, arguments, exit codes, and output formats.

---

## Table of Contents

1. [Command Overview](#1-command-overview)
2. [monolicense scan](#2-monolicense-scan)
3. [monolicense init](#3-monolicense-init)
4. [monolicense approve](#4-monolicense-approve)
5. [monolicense diff](#5-monolicense-diff)
6. [monolicense update-license-data](#6-monolicense-update-license-data)
7. [monolicense check-license-data](#7-monolicense-check-license-data)
8. [monolicense validate](#8-monolicense-validate)
9. [monolicense version](#9-monolicense-version)
10. [Global Flags](#10-global-flags)
11. [Exit Codes](#11-exit-codes)
12. [Output Formats](#12-output-formats)
13. [Environment Variables](#13-environment-variables)
14. [Configuration Resolution](#14-configuration-resolution)
15. [CI/CD Usage](#15-cicd-usage)

---

## 1. Command Overview

| Command | Version | Description |
|---------|---------|-------------|
| `scan` | v0.1+ | Run license compliance scan and generate reports |
| `init` | v1.0+ | Interactive setup wizard with license recommendations |
| `approve` | v1.5+ | Interactive CLI helper for approving dependencies |
| `diff` | v1.5+ | Show dependency and license changes since last scan |
| `update-license-data` | v1.0+ | Download latest license recommendation data |
| `check-license-data` | v1.0+ | Check if license data updates are available |
| `validate` | v0.5+ | Validate configuration file syntax |
| `version` | v0.1+ | Display version information |

---

## 2. monolicense scan

Run a complete license compliance scan on the monorepo and generate reports.

### 2.1 Usage

```bash
monolicense scan [options]
```

### 2.2 Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--config <path>` | `-c` | string | `./monolicense.config.json` | Path to config file |
| `--output <format>` | `-o` | string | `markdown` | Output format: `markdown`, `json`, `html` |
| `--output-file <path>` | `-f` | string | stdout | Write report to file instead of stdout |
| `--project <name>` | `-p` | string | all | Scan only specific project(s), comma-separated |
| `--fail-on <level>` | | string | `forbidden` | Exit with error on: `forbidden`, `review`, `unknown`, `any` |
| `--save-baseline` | | boolean | `false` | Save scan results to `.monolicense/last-scan.json` |
| `--update-approvals` | | boolean | `false` | Interactive mode to approve violations during scan |
| `--quiet` | `-q` | boolean | `false` | Suppress all output except errors |
| `--verbose` | `-v` | boolean | `false` | Show detailed progress and debug info |
| `--no-cache` | | boolean | `false` | Disable package info caching |

### 2.3 Examples

```bash
# Basic scan with markdown output
monolicense scan

# Scan and save to file
monolicense scan --output-file report.md

# Scan specific projects only
monolicense scan --project api,web

# Fail on any violations requiring review
monolicense scan --fail-on review

# Save baseline for future diffs
monolicense scan --save-baseline

# Generate JSON report
monolicense scan --output json --output-file report.json

# CI mode: fail on forbidden, quiet output
monolicense scan --fail-on forbidden --quiet
```

### 2.4 Behavior

1. Detect monorepo structure from workspace config
2. Parse lockfile(s) for all projects
3. Extract unique dependencies and licenses
4. Evaluate against policy rules
5. Generate report in specified format
6. Exit with appropriate code based on `--fail-on` setting

### 2.5 Exit Codes

- `0`: Scan completed, no violations matching `--fail-on` level
- `1`: Scan completed, violations found matching `--fail-on` level
- `2`: Configuration error (missing/invalid config)
- `3`: Lockfile error (missing/invalid lockfile)
- `4`: Network error (failed to fetch package info)

---

## 3. monolicense init

Interactive setup wizard to create initial MonoLicense configuration with license recommendations.

### 3.1 Usage

```bash
monolicense init [options]
```

### 3.2 Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--threshold <number>` | `-t` | number | `90` | Policy recommendation threshold (80-95) |
| `--allow-all` | | boolean | `false` | Add all current licenses to allowed list |
| `--approve-all` | | boolean | `false` | Pre-approve all current dependencies |
| `--no-ci` | | boolean | `false` | Skip CI setup prompts |
| `--yes` | `-y` | boolean | `false` | Accept all defaults (non-interactive) |
| `--non-interactive` | | boolean | auto | Force non-interactive mode (auto-detected in CI) |
| `--config <path>` | `-c` | string | `./monolicense.config.json` | Output path for config file |

### 3.3 Interactive Flow

When run without `--yes` or `--non-interactive`:

```
┌  MonoLicense Setup Wizard
│
◇  Detected monorepo: pnpm workspace with 12 projects
│
◇  Scanning existing dependencies...
│  Found 847 dependencies across 12 projects
│  Detected 8 unique licenses
│
◇  License breakdown:
│  • MIT: 623 dependencies (73.6%)
│  • Apache-2.0: 156 dependencies (18.4%)
│  • ISC: 42 dependencies (5.0%)
│  • BSD-3-Clause: 18 dependencies (2.1%)
│  • Unlicense: 4 dependencies (0.5%)
│  • LGPL-2.1: 2 dependencies (0.2%)
│  • GPL-3.0: 1 dependency (0.1%)
│  • UNKNOWN: 1 dependency (0.1%)
│
◆  Recommended policy (90% coverage):
│  ✓ Allow: MIT, Apache-2.0, BSD-3-Clause, ISC
│  ⚠ Review: Unlicense, LGPL-2.1, UNKNOWN
│  ✗ Forbid: GPL-3.0, AGPL-3.0
│
◆  Accept recommended policy?
│  ○ Yes, use recommended policy
│  ● Customize policy (select licenses manually)
│  ○ Allow all current licenses
│
◇  Selected: Customize policy
│
◆  Select licenses to ALLOW (can use commercially without restrictions):
│  ☑ MIT (623 deps)
│  ☑ Apache-2.0 (156 deps)
│  ☑ BSD-3-Clause (18 deps)
│  ☑ ISC (42 deps)
│  ☐ Unlicense (4 deps)
│
◆  Select licenses to REVIEW (require manual approval):
│  ☑ Unlicense (4 deps)
│  ☑ LGPL-2.1 (2 deps)
│  ☑ UNKNOWN (1 dep)
│  ☐ GPL-3.0 (1 dep)
│
◆  Select licenses to FORBID (block from use):
│  ☑ GPL-3.0 (1 dep)
│  ☑ AGPL-3.0 (not currently used)
│
◇  Policy configured
│
◆  Auto-approve existing dependencies?
│  ● Yes, approve all current dependencies
│  ○ No, I'll approve them manually
│  ○ Only approve dependencies with allowed licenses
│
◇  Will pre-approve 846 dependencies (excluding 1 forbidden GPL-3.0 package)
│
◆  Detect and auto-approve internal packages?
│  ● Yes, auto-approve @mycompany/* packages
│  ○ No
│  ○ Customize pattern
│
◇  Auto-approve pattern: @mycompany/*
│
◆  Enable license data updates?
│  ● Yes, check for updates daily (manual download)
│  ○ No, disable update checks
│
◇  Update checks enabled
│
◆  Generate baseline scan for diff tracking?
│  ● Yes, create .monolicense/last-scan.json
│  ○ No
│
◇  Running initial scan...
│
◇  Configuration created:
│  • monolicense.config.json
│  • monolicense.approvals.json (846 pre-approved)
│  • .monolicense/last-scan.json (baseline)
│  • .monolicense/license-data.json (v2024-01-15)
│
└  Setup complete! Run 'monolicense scan' to verify.
```

### 3.4 Non-Interactive Mode

When `--yes` or `--non-interactive` is specified:

```bash
monolicense init --yes

# Output:
✓ Detected pnpm workspace with 12 projects
✓ Scanned 847 dependencies
✓ Generated recommended policy (90% coverage)
✓ Created monolicense.config.json
✓ Created monolicense.approvals.json
✓ Downloaded license data (v2024-01-15)
✓ Saved baseline scan

Setup complete! Run 'monolicense scan' to verify.
```

Default behavior in non-interactive mode:
- Use recommended policy at 90% threshold
- DO NOT pre-approve existing dependencies
- DO NOT configure auto-approve patterns
- Enable update checks
- Create baseline scan
- Skip CI setup prompts

### 3.5 Examples

```bash
# Interactive setup with all prompts
monolicense init

# Quick setup with defaults
monolicense init --yes

# Strict policy (lower threshold)
monolicense init --threshold 80

# Permissive setup (allow all current licenses)
monolicense init --allow-all --approve-all

# CI-friendly setup
monolicense init --non-interactive --no-ci

# Custom config location
monolicense init --config .github/monolicense.config.json
```

### 3.6 Exit Codes

- `0`: Setup completed successfully
- `1`: User cancelled setup
- `2`: Failed to download license data
- `3`: Failed to write config files
- `4`: Invalid threshold value

---

## 4. monolicense approve

Interactive CLI helper for approving dependencies (v1.5+).

### 4.1 Usage

```bash
monolicense approve [package@version] [options]
```

### 4.2 Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--license <spdx>` | `-l` | string | - | Approve all dependencies with this license |
| `--config <path>` | `-c` | string | `./monolicense.config.json` | Path to config file |
| `--comment <text>` | `-m` | string | - | Add comment to approval |
| `--expires <date>` | `-e` | string | - | Set expiration date (ISO 8601) |
| `--interactive` | `-i` | boolean | `true` | Interactive selection mode |

### 4.3 Examples

```bash
# Approve specific package
monolicense approve lodash@4.17.21

# Approve with comment
monolicense approve lodash@4.17.21 --comment "Reviewed legal implications"

# Approve with expiration (re-review in 1 year)
monolicense approve lodash@4.17.21 --expires 2025-01-15

# Approve all packages with MIT license
monolicense approve --license MIT

# Interactive mode (select from violations)
monolicense approve --interactive
```

### 4.4 Interactive Mode

```
◆  Select dependencies to approve:
│  ☑ lodash@4.17.21 (MIT) - needs review
│  ☑ axios@1.6.0 (MIT) - needs review
│  ☐ @types/node@20.0.0 (MIT) - already approved
│
◆  Add approval comment? (optional)
│  Legal review completed 2024-01-15
│
◆  Set expiration date? (optional)
│  ○ No expiration
│  ● 1 year from now
│  ○ Custom date
│
◇  Approved 2 dependencies
│  Updated monolicense.approvals.json
│
└  Run 'monolicense scan' to verify.
```

### 4.5 Exit Codes

- `0`: Approval(s) added successfully
- `1`: No matching dependencies found
- `2`: Invalid package specifier
- `3`: Failed to write approvals file

---

## 5. monolicense diff

Show dependency and license changes since last scan (v1.5+).

### 5.1 Usage

```bash
monolicense diff [options]
```

### 5.2 Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--config <path>` | `-c` | string | `./monolicense.config.json` | Path to config file |
| `--baseline <path>` | `-b` | string | `.monolicense/last-scan.json` | Path to baseline scan |
| `--output <format>` | `-o` | string | `markdown` | Output format: `markdown`, `json` |
| `--show-unchanged` | | boolean | `false` | Include unchanged dependencies |
| `--licenses-only` | | boolean | `false` | Only show license changes |

### 5.3 Output

```markdown
# License Diff Report

**Baseline**: 2024-01-10 14:23:45
**Current**: 2024-01-15 09:12:33

## Summary

- **Added**: 12 dependencies
- **Removed**: 3 dependencies
- **Updated**: 8 dependencies
- **License changed**: 2 dependencies
- **Unchanged**: 824 dependencies

## Added Dependencies

| Package | Version | License | Status |
|---------|---------|---------|--------|
| zod | 3.22.4 | MIT | ✅ Allowed |
| date-fns | 2.30.0 | MIT | ✅ Allowed |
| ... | ... | ... | ... |

## Removed Dependencies

| Package | Version | License |
|---------|---------|---------|
| moment | 2.29.4 | MIT |
| lodash | 4.17.20 | MIT |
| ... | ... | ... |

## Updated Dependencies

| Package | Old Version | New Version | License Change |
|---------|-------------|-------------|----------------|
| react | 18.2.0 | 18.3.0 | - |
| typescript | 5.2.2 | 5.3.3 | - |
| ... | ... | ... | ... |

## License Changes ⚠️

| Package | Version | Old License | New License | Status |
|---------|---------|-------------|-------------|--------|
| some-lib | 2.0.0 | MIT | Apache-2.0 | ✅ Allowed |
| other-lib | 1.5.0 | ISC | GPL-3.0 | ❌ Forbidden |
```

### 5.4 Examples

```bash
# Basic diff
monolicense diff

# Show all dependencies including unchanged
monolicense diff --show-unchanged

# Only show license changes
monolicense diff --licenses-only

# Generate JSON diff
monolicense diff --output json

# Compare against custom baseline
monolicense diff --baseline .monolicense/prod-baseline.json
```

### 5.5 Exit Codes

- `0`: Diff generated successfully
- `1`: New violations detected
- `2`: Baseline file not found
- `3`: Failed to run current scan

---

## 6. monolicense update-license-data

Download latest license recommendation data from MonoLicense API.

### 6.1 Usage

```bash
monolicense update-license-data [options]
```

### 6.2 Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--force` | `-f` | boolean | `false` | Force update even if already up to date |
| `--verbose` | `-v` | boolean | `false` | Show detailed download progress |

### 6.3 Output

```
◇  Checking for license data updates...
│
◇  Current version: 2024-01-10
│  Latest version: 2024-01-15
│
◇  Downloading license data...
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
│
◇  License data updated successfully
│  • 15 new licenses added
│  • 8 license metadata updated
│  • GPL-3.0 description improved
│
└  Update complete (v2024-01-15)
```

### 6.4 Examples

```bash
# Update if new version available
monolicense update-license-data

# Force update even if up to date
monolicense update-license-data --force

# Verbose output
monolicense update-license-data --verbose
```

### 6.5 Exit Codes

- `0`: Update successful or already up to date
- `1`: Update available but download failed
- `2`: API unavailable
- `3`: Failed to save license data file

---

## 7. monolicense check-license-data

Check if license data updates are available without downloading.

### 7.1 Usage

```bash
monolicense check-license-data
```

### 7.2 Output

```
✓ License data is up to date (v2024-01-15)
```

or

```
⚠ License data update available
  Current version: 2024-01-10
  Latest version: 2024-01-15

Run 'monolicense update-license-data' to download.
```

### 7.3 Exit Codes

- `0`: Up to date
- `1`: Update available
- `2`: API unavailable
- `3`: Local license data file not found

---

## 8. monolicense validate

Validate configuration file syntax and schema.

### 8.1 Usage

```bash
monolicense validate [options]
```

### 8.2 Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--config <path>` | `-c` | string | `./monolicense.config.json` | Path to config file to validate |
| `--strict` | | boolean | `false` | Enable strict validation (warn on unused fields) |

### 8.3 Output (Success)

```
✓ Configuration is valid
  • 12 projects detected
  • 4 allowed licenses
  • 2 review licenses
  • 3 forbidden licenses
  • Auto-approve: @mycompany/*
```

### 8.3 Output (Errors)

```
✗ Configuration validation failed

Errors:
  • [line 12] policy.allowed must be an array of strings
  • [line 18] autoApprove.publishers contains invalid regex: @mycompany/[
  • [line 23] updates.checkFrequency must be one of: daily, weekly, never

Warnings (strict mode):
  • Unknown field 'customField' at root level
  • Field 'projects[0].description' is not used by MonoLicense
```

### 8.4 Examples

```bash
# Validate default config
monolicense validate

# Validate specific config
monolicense validate --config .github/monolicense.config.json

# Strict validation
monolicense validate --strict
```

### 8.5 Exit Codes

- `0`: Configuration is valid
- `1`: Configuration has errors
- `2`: Configuration file not found
- `3`: Invalid JSON syntax

---

## 9. monolicense version

Display version information for MonoLicense and license data.

### 9.1 Usage

```bash
monolicense version [--verbose]
```

### 9.2 Output (Basic)

```
MonoLicense v1.0.0
```

### 9.3 Output (Verbose)

```
MonoLicense CLI v1.0.0

License Data:
  Version: 2024-01-15
  Tiers: 5
  Licenses: 187
  Last Updated: 2024-01-15T00:00:00Z

Environment:
  Node: v20.10.0
  Platform: darwin (arm64)
  Config: ./monolicense.config.json
```

### 9.4 Examples

```bash
# Basic version
monolicense version

# Detailed version info
monolicense version --verbose

# Short alias
monolicense --version
monolicense -V
```

### 9.5 Exit Codes

- `0`: Always succeeds

---

## 10. Global Flags

These flags work with all commands:

| Flag | Alias | Type | Description |
|------|-------|------|-------------|
| `--help` | `-h` | boolean | Show help for command |
| `--version` | `-V` | boolean | Show version (same as `monolicense version`) |
| `--cwd <path>` | | string | Set working directory |
| `--no-color` | | boolean | Disable colored output |
| `--debug` | | boolean | Enable debug logging |

### 10.1 Examples

```bash
# Show help for scan command
monolicense scan --help

# Run from different directory
monolicense scan --cwd /path/to/monorepo

# Disable colors (CI-friendly)
monolicense scan --no-color

# Debug mode
monolicense scan --debug
```

---

## 11. Exit Codes

MonoLicense uses standard exit codes for different scenarios:

| Code | Name | Description |
|------|------|-------------|
| `0` | Success | Command completed successfully, no violations |
| `1` | Violations Found | Scan found violations matching `--fail-on` level |
| `2` | Config Error | Configuration file missing, invalid, or malformed |
| `3` | Lockfile Error | Lockfile missing, invalid, or unsupported version |
| `4` | Network Error | Failed to fetch package info or license data |
| `5` | File System Error | Failed to read/write files |
| `6` | User Cancelled | User cancelled interactive operation |
| `7` | Invalid Arguments | Invalid command-line arguments provided |
| `8` | Not a Monorepo | Current directory is not a monorepo |

### 11.1 CI/CD Usage

Exit codes are designed for CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run MonoLicense scan
  run: monolicense scan --fail-on forbidden --quiet
  # Exits with code 1 if forbidden licenses found
  # Pipeline fails automatically
```

---

## 12. Output Formats

### 12.1 Markdown (Default)

Human-readable format with tables and emojis:

```markdown
# MonoLicense Scan Report

**Generated**: 2024-01-15T10:30:00Z
**Projects**: 12
**Dependencies**: 847

## Summary
| Status | Count |
|--------|-------|
| ✅ Allowed | 820 |
| ⚠ Review | 12 |
| ❌ Forbidden | 1 |
...
```

### 12.2 JSON

Machine-readable format for programmatic consumption:

```json
{
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "summary": {
    "totalProjects": 12,
    "totalDependencies": 847,
    "uniquePackages": 456,
    "allowed": 820,
    "review": 12,
    "forbidden": 1,
    "unknown": 14
  },
  "violations": [
    {
      "package": "some-gpl-lib",
      "version": "2.0.0",
      "license": "GPL-3.0",
      "status": "forbidden",
      "severity": "error",
      "usedBy": ["api", "worker"]
    }
  ],
  "projects": [...]
}
```

### 12.3 HTML (v1.5+)

Interactive web report with filtering and search:

```html
<!DOCTYPE html>
<html>
<head>
  <title>MonoLicense Report</title>
  <style>/* Beautiful CSS */</style>
</head>
<body>
  <div class="report">
    <h1>MonoLicense Scan Report</h1>
    <!-- Interactive charts, tables, filters -->
  </div>
</body>
</html>
```

---

## 13. Environment Variables

MonoLicense supports configuration via environment variables:

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `MONOLICENSE_CONFIG` | string | Path to config file | `./monolicense.config.json` |
| `MONOLICENSE_NO_COLOR` | boolean | Disable colored output | `false` |
| `MONOLICENSE_API_URL` | string | Override API base URL | `https://api.monolicense.com` |
| `MONOLICENSE_CACHE_DIR` | string | Override cache directory | `.monolicense/cache` |
| `CI` | boolean | Auto-detect CI environment | - |
| `NO_COLOR` | boolean | Standard no-color flag | `false` |

### 13.1 Examples

```bash
# Use custom config location
export MONOLICENSE_CONFIG=.github/monolicense.config.json
monolicense scan

# Disable colors
export MONOLICENSE_NO_COLOR=1
monolicense scan

# Use custom API (for testing)
export MONOLICENSE_API_URL=https://staging-api.monolicense.com
monolicense update-license-data
```

---

## 14. Configuration Resolution

MonoLicense resolves configuration in the following order (first found wins):

1. `--config` flag (highest priority)
2. `MONOLICENSE_CONFIG` environment variable
3. `monolicense.config.json` in current directory
4. `monolicense.config.json` in parent directories (walk up)
5. `.monolicense/config.json` in current directory
6. Error: No configuration found

### 14.1 Examples

```bash
# Explicit config path
monolicense scan --config /path/to/config.json

# Environment variable
export MONOLICENSE_CONFIG=/path/to/config.json
monolicense scan

# Auto-detect in current directory
cd /monorepo
monolicense scan  # Uses ./monolicense.config.json

# Walk up directory tree
cd /monorepo/apps/api
monolicense scan  # Uses /monorepo/monolicense.config.json
```

---

## 15. CI/CD Usage

### 15.1 GitHub Actions

```yaml
name: License Compliance

on:
  pull_request:
  push:
    branches: [main]

jobs:
  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install MonoLicense
        run: npm install -g monolicense

      - name: Run license scan
        run: monolicense scan --fail-on forbidden --quiet

      - name: Generate HTML report
        if: failure()
        run: monolicense scan --output html --output-file report.html

      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: license-report
          path: report.html
```

### 15.2 GitLab CI

```yaml
license-check:
  stage: test
  image: node:20
  script:
    - npm install -g monolicense
    - monolicense scan --fail-on forbidden --output json --output-file report.json
  artifacts:
    when: always
    reports:
      license_scanning: report.json
```

### 15.3 Non-Interactive Detection

MonoLicense auto-detects CI environments and disables interactive features:

```typescript
const isCI = process.env.CI === 'true' ||
             process.env.GITHUB_ACTIONS === 'true' ||
             process.env.GITLAB_CI === 'true' ||
             process.env.JENKINS_HOME !== undefined;
```

When in CI:
- All prompts use default values
- Colors disabled unless `FORCE_COLOR=1`
- Progress spinners replaced with simple logs
- Exit codes strictly followed

---

## Summary

This API specification defines:

1. **8 CLI commands** covering all MonoLicense operations from v0.1 to v2.0
2. **Complete flag and argument specifications** for each command
3. **Interactive flows** for `init` and `approve` commands with @clack/prompts
4. **Non-interactive modes** for CI/CD with auto-detection
5. **Exit codes** designed for pipeline integration
6. **Output formats** (Markdown, JSON, HTML) for different use cases
7. **Environment variables** for configuration override
8. **Configuration resolution** with priority order
9. **CI/CD examples** for GitHub Actions and GitLab CI

All commands are implementation-ready with exact behavior specifications.
