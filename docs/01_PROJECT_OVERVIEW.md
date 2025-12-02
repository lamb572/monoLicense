# MonoLicense - Project Overview

**Last Updated**: 2025-11-26
**Status**: Planning Phase - Pre-Code
**Version**: 0.0.0 (Not yet implemented)

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [Core Value Proposition](#3-core-value-proposition)
4. [MVP Feature Set](#4-mvp-feature-set)
   - [Inputs](#41-inputs)
   - [Scanning and Output](#42-scanning-and-output)
   - [Policy Checks](#43-policy-checks)
   - [Review and Approval Workflow](#44-review-and-approval-workflow)
   - [CI Integration](#45-ci-integration)
   - [Future Enhancements](#46-future-enhancements-v20)
5. [Non-Goals for v1](#5-non-goals-for-v1)
6. [Technology Sketch](#6-technology-sketch)
7. [State Management in CI](#7-state-management-in-ci)
8. [Pricing Idea](#8-pricing-idea-very-rough)
9. [Immediate Next Steps](#9-immediate-next-steps)
10. [Success Metrics](#10-success-metrics-future)
11. [Risks and Mitigation](#11-risks-and-mitigation)
12. [Appendix: Related Tools](#12-appendix-related-tools-and-differentiation)

---

## 0. Working Title

**MonoLicense**

_Monorepo-friendly license and dependency compliance for JS/TS teams._

---

## 1. Problem Statement

Teams using modern monorepo tools (pnpm, Rush, Nx, Turborepo, etc.) face significant challenges when it comes to license and dependency compliance:

### Pain Points

1. **Lack of per-project visibility**

   - Monorepos contain multiple applications and services
   - Existing tools treat the entire monorepo as one unit
   - Teams can't easily answer "what licenses does App A use?" vs "what licenses does Service B use?"

2. **Customer and legal blockers**

   - Sales teams get asked "what third-party licenses do you use?" before deals close
   - Legal teams need clear dependency reports for compliance reviews
   - No simple way to generate these reports per-application in a monorepo

3. **Policy enforcement gaps**

   - Teams want to enforce simple rules like "no GPL licenses" or "flag any AGPL for review"
   - Existing solutions are either:
     - Too heavy: Enterprise SCA (Software Composition Analysis) tools that are expensive and complex
     - Too limited: Simple scripts that don't understand monorepo structure
   - No middle ground for small/medium teams

4. **Monorepo-specific challenges**

   - pnpm, Rush, Nx, etc. each have different workspace configurations
   - Lockfile formats vary (pnpm-lock.yaml vs package-lock.json vs yarn.lock)
   - Dependency hoisting and workspace protocols create complexity
   - No tool that "just works" across different monorepo setups

5. **No approval workflow**
   - When a dependency needs review, there's no structured way to approve it
   - Approvals aren't tracked or persisted
   - CI keeps failing until someone manually overrides or removes the dependency
   - No audit trail of who approved what and why

### Current Workarounds

Teams currently resort to:

- Manual spreadsheet maintenance (error-prone, time-consuming)
- Custom scripts that break when lockfiles change
- Treating the entire monorepo as one project (inaccurate)
- Expensive enterprise tools meant for large organizations
- Manually maintaining approval lists with no workflow

---

## 2. Target Users

### Primary Audience

1. **Small to medium engineering teams (5-50 developers)**

   - Using JS/TS monorepos
   - Need compliance without enterprise budgets
   - Value automation and CI integration

2. **Agencies and consultancies**

   - Ship multiple client applications from one monorepo
   - Need per-client license reports
   - Must answer compliance questions quickly for contracts

3. **Tech leads and staff engineers**
   - Responsible for answering legal/compliance questions
   - Need to enforce license policies in CI
   - Want simple tools that don't require dedicated security teams

### Secondary Audience (Future)

- Open source maintainers managing monorepos
- Solo developers and small startups (free tier)
- Enterprise teams looking for lightweight alternatives to heavy SCA tools

---

## 3. Core Value Proposition

> **"Give me a clean, per-project license report and fail my CI if someone adds a forbidden license—without me having to run or pay for enterprise SCA."**

### Key Benefits

- ✅ **Monorepo-native**: Understands workspace structures, not just root package.json
- ✅ **Per-project reports**: Separate output for each app/service in your monorepo
- ✅ **Simple policy enforcement**: Define allowed/forbidden licenses once, enforce in CI
- ✅ **Approval workflow**: Review and approve questionable licenses with audit trail
- ✅ **Fast and local**: Reads lockfiles, no cloud scanning or data upload required
- ✅ **CI-ready**: GitHub Action and CLI for easy integration
- ✅ **No vendor lock-in**: Open core model, config files in your repo

---

## 4. MVP Feature Set

### 4.1 Inputs

#### Supported Monorepo Layouts

**v1.0 Support**:

- ✅ pnpm workspaces (primary focus)
- ✅ npm workspaces (basic support)
- ✅ Yarn workspaces (basic support)

**v1.5+ Support**:

- Rush (even if slightly manual configuration required)
- Nx (if lockfile-based)
- Turborepo (if using pnpm/npm/yarn underneath)

#### Configuration File

A `monolicense.config.json` or `monolicense.config.yaml` in the repo root:

```json
{
  "projects": [
    {
      "name": "web-app",
      "path": "apps/web"
    },
    {
      "name": "mobile-api",
      "path": "apps/api"
    }
  ],
  "policy": {
    "allowed": ["MIT", "Apache-2.0", "BSD-3-Clause"],
    "review": ["ISC", "BSD-2-Clause"],
    "forbidden": ["GPL-3.0", "AGPL-3.0"]
  }
}
```

**Key features**:

- Define projects (by path or glob pattern)
- Define license policy (allowed, needs review, forbidden)
- Simple, human-readable format

---

### 4.2 Scanning and Output

#### CLI Command

```bash
monolicense scan
```

**Behavior**:

1. Detects monorepo type automatically (pnpm, npm, yarn)
2. Reads workspace configuration
3. Parses lockfile(s)
4. Builds dependency graph per project
5. Extracts license information for each dependency
6. Checks approvals file for previously reviewed dependencies
7. Generates reports

#### Output Formats

**Per-project outputs**:

1. **JSON** (machine-readable for automation)

   - `reports/web-app.json`
   - `reports/mobile-api.json`

2. **Markdown** (human-readable)

   - `reports/web-app.md`
   - `reports/mobile-api.md`

3. **HTML** (v1.5+, nice formatting for sharing)
   - `reports/web-app.html`

**Report Contents**:

- Project name
- Total dependency count
- List of dependencies with:
  - Package name
  - Version
  - License(s)
  - License source (package.json, LICENSE file, README)
  - Approval status (if previously approved)
- Policy violations (if any)
- Unknown/missing licenses flagged

**Console Output**:

```
✓ web-app: 145 dependencies scanned
  ✓ 142 allowed licenses
  ⚠ 2 need review (ISC)
    - some-package@1.2.3 (ISC) - not yet approved
    - other-package@4.5.6 (ISC) - approved by @lukebeach on 2025-11-20
  ✗ 1 forbidden license found (GPL-3.0)

✗ mobile-api: 98 dependencies scanned
  ✓ 95 allowed licenses
  ✗ 3 forbidden licenses found (AGPL-3.0)

Summary: 2 projects scanned, 2 policy violations
Exit code: 1 (policy violations found)
```

---

### 4.3 Policy Checks

#### Policy Evaluation

Reads policy from `monolicense.config.json`:

```json
{
  "policy": {
    "allowed": ["MIT", "Apache-2.0", "BSD-3-Clause"],
    "review": ["ISC"],
    "forbidden": ["GPL-3.0", "AGPL-3.0", "SSPL-1.0"]
  }
}
```

#### Flags and Exit Codes

**Exit Codes**:

- `0` - All licenses pass policy
- `1` - Forbidden licenses found
- `2` - Unknown/missing licenses found (if `strict` mode enabled)
- `3` - Configuration error
- `4` - Scan error (lockfile parsing failed, etc.)
- `5` - Unapproved dependencies requiring review

**Flags**:

- `--forbidden` - Fail on forbidden licenses (default: true)
- `--review` - Fail on licenses needing review that haven't been approved (default: true)
- `--unknown` - Fail on unknown licenses (default: false)
- `--strict` - Fail on all violations including unknown licenses (equivalent to `--forbidden --review --unknown`)

> **Note**: The default behavior (`--forbidden --review`) is intentionally lenient on unknown licenses for v1.0, since missing license data is common and would cause false positives. Teams can opt into stricter checking with `--strict` or `--unknown`.

#### Summary Output

CLI output includes:

- Forbidden licenses with package names
- Unknown/missing license data
- Review-flagged licenses with approval status
- Clear summary of pass/fail status

---

### 4.4 Review and Approval Workflow

One of MonoLicense's key features is the ability to approve dependencies that require review, with a clear audit trail.

#### The Problem

When CI detects a dependency with a "review" license:

1. Build fails (blocks PR merge)
2. Someone needs to review and approve it
3. That approval must persist so CI doesn't keep failing
4. Team needs audit trail of who approved what and why

#### v1.0 Solution: File-Based Approvals

**Approval File**: `monolicense.approvals.json` (checked into repo)

```json
{
  "approvals": [
    {
      "package": "some-package",
      "version": "1.2.3",
      "license": "ISC",
      "approvedBy": "lukebeach",
      "approvedAt": "2025-11-26T10:30:00Z",
      "reason": "Reviewed with legal team. ISC is acceptable for internal tools.",
      "expiresAt": null
    },
    {
      "package": "another-package",
      "version": "2.0.0",
      "license": "BSD-2-Clause",
      "approvedBy": "jsmith",
      "approvedAt": "2025-11-20T14:15:00Z",
      "reason": "BSD-2-Clause approved for use in web-app only",
      "scope": ["web-app"],
      "expiresAt": "2026-11-20T14:15:00Z"
    }
  ]
}
```

**Workflow**:

1. **PR adds new dependency** → CI runs `monolicense scan`
2. **Scan detects ISC license** (in "review" category) → CI fails with exit code 5
3. **Developer or tech lead reviews** the license terms
4. **Add approval entry** to `monolicense.approvals.json`:
   ```json
   {
     "package": "new-package",
     "version": "1.0.0",
     "license": "ISC",
     "approvedBy": "lukebeach",
     "approvedAt": "2025-11-26T10:30:00Z",
     "reason": "ISC is permissive, approved for all projects"
   }
   ```
5. **Commit approval file** (can be same PR or separate)
6. **CI re-runs** → reads approvals → passes ✓

**Benefits**:

- ✅ No external service required
- ✅ Works offline
- ✅ Approval history in git
- ✅ PR review process applies to approvals too
- ✅ Simple to understand and audit

**Limitations**:

- Manual file editing (no UI)
- Must remember to update when dependency version changes (can be made optional)
- No notifications or reminders

#### Approval Matching Rules

> **Note**: Approvals are matched against the **lockfile** (actual installed versions), not package.json version ranges. This ensures approvals are for the exact versions in use.

**Exact match** (default):

```json
{ "package": "foo", "version": "1.2.3" }
```

Only approves `foo@1.2.3`, not `foo@1.2.4`

**Version range** (optional):

```json
{ "package": "foo", "versionRange": "^1.2.0" }
```

Approves any `foo@1.x.x` version

**Wildcard** (optional, for internal packages):

```json
{ "package": "@mycompany/*", "license": "ISC" }
```

Approves all `@mycompany` scoped packages with ISC

**Project-scoped approval** (supports glob patterns):

```json
{ "package": "foo", "version": "1.2.3", "scope": ["web-app"] }
{ "package": "foo", "version": "1.2.3", "scope": ["apps/*", "libs/ui"] }
```

Only approved for matching projects, still requires review for other projects

#### Approval Expiration (Optional)

```json
{
  "package": "some-package",
  "version": "1.2.3",
  "expiresAt": "2026-11-26T00:00:00Z"
}
```

After expiration:

- CI fails again
- Forces periodic re-review of questionable licenses
- Optional feature (most approvals won't expire)

#### CLI Helper for Approvals

**v1.5+ Feature**: `monolicense approve` command

```bash
# Interactive approval - approve a specific package
monolicense approve some-package@1.2.3

# Interactive bulk approval - loop through all pending reviews
monolicense approve --interactive
# Shows list of packages needing review, approve/skip each one

# Prompts for:
# - Reason for approval
# - Scope (all projects or specific ones)
# - Expiration (optional)
# - Approved by (defaults to git user.name)

# Non-interactive (for scripts/CI)
monolicense approve --package some-package@1.2.3 \
  --reason "Reviewed with legal" \
  --approved-by "lukebeach" \
  --scope "web-app,mobile-api"

# Positional argument also supported
monolicense approve some-package@1.2.3 --reason "Reviewed with legal"
```

This command:

1. Reads existing `monolicense.approvals.json`
2. Adds new approval entry
3. Writes back to file
4. Validates JSON format

**Not in v1.0** - users manually edit JSON file for MVP.

---

### 4.5 CI Integration

MonoLicense provides progressive enhancement through three phases of CI integration:

#### v1.0: GitHub Action (MVP - File-Based)

**Basic usage**:

```yaml
name: License Check

on: [pull_request]

jobs:
  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: monolicense/action@v1
        with:
          config: monolicense.config.json
          fail-on-forbidden: true
          fail-on-review: true
```

**Features**:

- Runs scan on PR
- Reads approvals from `monolicense.approvals.json` (committed in repo)
- Fails workflow if forbidden licenses or unapproved review licenses appear
- Job log shows brief summary with approval status
- All state stored in git (no external dependencies)

**Exit behavior**:

- Action fails (red ✗) if policy violations found
- Action passes (green ✓) if all licenses comply or are approved

**Approval workflow (v1.0)**:

1. CI fails on new dependency needing review
2. Developer manually edits `monolicense.approvals.json`
3. Commits approval file to repo
4. CI re-runs and passes

**Advantages**:

- ✅ Simple, no hosting required
- ✅ Works offline
- ✅ Approval changes go through PR review
- ✅ Git provides full audit trail

**Limitations**:

- Manual JSON editing
- No notifications or @mentions
- No interactive UI

---

#### v1.5: GitHub App/Bot (Enhanced UX - Still File-Based)

**Concept**: Add a GitHub App that improves the approval workflow while still using file-based storage.

**Installation**:

```bash
# Install MonoLicense GitHub App on your repo
# Visit https://github.com/apps/monolicense
```

**Enhanced workflow**:

1. **PR opened with new dependency**

   - GitHub App receives webhook
   - App runs `monolicense scan`
   - Posts PR comment with results

2. **Bot comment on PR**:

   ```
   🤖 MonoLicense Bot

   ⚠️ License review needed:

   | Package | Version | License | Status |
   |---------|---------|---------|--------|
   | some-package | 1.2.3 | ISC | Needs approval |
   | another-package | 4.5.6 | BSD-2-Clause | Needs approval |

   Reply with a comment to approve:
   `/monolicense approve some-package "Reviewed with legal team"`

   Or approve all:
   `/monolicense approve-all "All ISC licenses pre-approved"`
   ```

3. **Team member responds**:

   ```
   /monolicense approve some-package "ISC is acceptable for internal tools"
   ```

4. **Bot processes approval**:

   - Reads command from comment
   - Updates `monolicense.approvals.json`
   - Commits the file to PR (or creates separate commit on branch)
   - Re-runs scan
   - Posts updated status

5. **Bot confirms**:

   ```
   ✅ Approved by @lukebeach

   I've updated monolicense.approvals.json and committed the change.
   Re-scanning...

   ✓ All licenses now comply with policy
   ```

**Bot commands**:

- `/monolicense approve <package> "<reason>"` - Approve specific package
- `/monolicense approve-all "<reason>"` - Approve all pending review licenses
- `/monolicense scan` - Re-run scan manually
- `/monolicense status` - Show current policy violations

**Features**:

- ✅ Interactive approval via PR comments
- ✅ Bot commits approvals to git automatically
- ✅ Can @mention specific team members for approval
- ✅ Richer PR status checks (✓/✗ badges)
- ✅ Still file-based (no external state storage required)
- ✅ Works with existing GitHub permissions

**Architecture**:

```
GitHub PR → Webhook → MonoLicense Bot (hosted)
                          ↓
                    monolicense scan
                          ↓
                    Process /commands
                          ↓
                    Update approvals.json
                          ↓
                    Commit via GitHub API
                          ↓
                    Post results to PR
```

**Hosting requirements**:

- Lightweight Node.js server (handle webhooks)
- GitHub App authentication (handles repo access via installation tokens)
- Runs CLI in serverless function or container
- No database needed (still uses git for state)

> **Security Note**: GitHub Apps use installation-based authentication. When installed on a repo, the app receives scoped tokens with only the permissions granted. For private repos, the app needs explicit installation by a repo admin. No additional authentication layer is needed beyond the GitHub App flow.

**Advantages over v1.0**:

- ✅ No manual JSON editing
- ✅ Approval workflow in familiar PR interface
- ✅ Can assign approvals to specific people
- ✅ Faster approval process
- ✅ Still maintains git as source of truth

**Still file-based**:

- All approvals stored in `monolicense.approvals.json`
- Bot just automates the editing and committing
- No cloud database required
- Can work offline (fall back to manual editing)

---

#### v2.0: Hosted Service with MongoDB (Cloud Dashboard)

**Concept**: Optional cloud service for teams that want centralized management across multiple repos.

**Features**:

- MongoDB stores scan history across all repos
- Web dashboard for viewing trends
- Centralized approval management (optional override of local files)
- Email/Slack notifications
- Multi-repo compliance reporting

**Workflow**:

1. GitHub App still runs on PRs
2. Optionally syncs scan results to MongoDB
3. Team can manage approvals via web UI or continue using PR comments
4. Dashboard shows historical trends

**Hybrid approach**:

- Local file still works (backward compatible)
- Cloud sync is optional (enable with API key)
- Falls back to local if API unavailable
- Best of both worlds

**Not in v1.5** - only needed for teams with many repos or complex compliance needs.

---

### 4.6 Future Enhancements (v2.0+)

#### GitHub Issues Integration (Alternative Approach - To Be Evaluated)

**Concept**: Use GitHub Issues as approval workflow UI (alternative to v1.5 Bot approach)

> **Design Decision**: Evaluate Bot vs Issues approach during v1.5 planning. The Bot approach (v1.5) is currently preferred because it provides a smoother UX within the PR context, while Issues may add friction by requiring users to navigate away from the PR.

**High-level flow**:

1. CI detects dependency needing review
2. CLI checks for existing GitHub Issue for that package
3. If no issue exists, optionally create one (or just fail)
4. Team member reviews → adds label `approved` or `rejected`
5. Next CI run checks issue status via GitHub API

**Benefits**:

- Uses familiar GitHub UI
- Approval history in issues
- Can assign to specific team members
- Notifications built-in

**Challenges to solve later**:

- Rate limiting on GitHub API
- How to map issue status to approval (labels? closed state? comments?)
- What if issue is deleted?
- Should CLI auto-create issues or just check existing ones?

> **Note**: GitHub Apps solve the token security problem - installation tokens are scoped to specific repos and permissions. No need to expose personal access tokens in CI.

**Decision**: Design this when we get to v1.5. File-based approach is sufficient for v1.0.

#### Hosted Service (Option C - v2.0+)

**Concept**: MonoLicense cloud service with web dashboard

**Features**:

- MongoDB stores approvals, scan history, team data
- Web UI for managing approvals (click "Approve" button)
- GitHub OAuth for authentication
- Email/Slack notifications when approvals needed
- Audit logs and reporting
- Multi-repo management

**Not in v1.0** - requires full web app and hosting infrastructure.

---

## 5. Non-Goals for v1

To maintain focus and ship quickly, these are explicitly **out of scope** for v1.0:

### ❌ Not in v1.0

1. **Vulnerability scanning**

   - MonoLicense focuses on licenses, not CVEs
   - Users should use tools like `npm audit`, Snyk, or Dependabot for vulnerabilities
   - Potential future feature, but not core value prop

2. **Multi-language support**

   - v1.0 is JS/TS only (npm/pnpm/yarn ecosystems)
   - No Python (pip), Ruby (bundler), Go (go.mod), Rust (Cargo), etc.
   - May add in v2.0+ if demand exists

3. **User management / SSO / Teams**

   - No hosted user accounts in v1
   - CLI and GitHub Action are single-tenant (run in your repo)
   - Hosted service with multi-user access is v2.0+ feature

4. **Fancy dashboard / web UI**

   - v1.0 outputs are JSON, Markdown, and basic HTML files
   - No interactive web application for browsing reports
   - Static reports are "good enough" for MVP
   - Full dashboard is v2.0+ feature

5. **License compatibility analysis**

   - No "can I use MIT + Apache together?" logic
   - Just reports what's there and checks against policy
   - Users must define their own policy rules

6. **Automated license remediation**

   - No suggestions like "replace package X with Y"
   - No automatic PR creation to swap dependencies
   - Pure reporting and policy enforcement only

7. **Historical tracking in v1.0**

   - No database of scan results over time in CLI
   - Each scan is independent
   - Trend analysis is v2.0+ feature (hosted service with MongoDB)

8. **Interactive approval UI**

   - v1.0 uses manual JSON file editing for approvals
   - `monolicense approve` CLI helper is v1.5+
   - Web-based approval workflow is v2.0+

9. **GitHub Issues integration**
   - File-based approvals only in v1.0
   - GitHub Issues workflow is v1.5+ (needs design work)

10. **UI Dependency Visualization (v2.5+ Feature)**

    Interactive dependency tree visualization:
    - **Top level**: Customer's apps (deployable applications)
    - **Second level**: Customer's internal libraries with links to apps using them
    - **Third level**: External dependencies with license status indicators
    - Click any node to drill down into its dependencies
    - Filter by license type, policy status, or project
    - Export dependency graph as image or data

---

## 6. Technology Sketch

### Core CLI

- **Language**: TypeScript
- **Runtime**: Node.js (LTS versions: 18, 20, 22+)
- **Distribution**: npm package (`@monolicense/cli`)
- **Dependencies** (minimal):
  - Commander.js or Yargs for CLI parsing
  - YAML parser (if supporting YAML config)
  - License detection library (license-checker, spdx-correct, or custom)
  - Lockfile parsers (custom or lightweight libraries)

### Scanner Engine

**Responsibilities**:

1. Detect monorepo type (pnpm vs npm vs yarn)
2. Read workspace configuration
3. Parse lockfile(s)
4. Build per-project dependency graph
5. Extract license data from packages
6. Load and validate approvals file
7. Match dependencies against approvals

**Approach**:

- Read `pnpm-workspace.yaml`, `package.json#workspaces`, etc.
- Parse lockfile format specific to package manager
- Use lockfile to build exact dependency tree per workspace
- Read license from `package.json` or LICENSE file in `node_modules`
- Handle edge cases (missing licenses, dual licenses, custom expressions)
- Check approvals for review-flagged dependencies

### Configuration

**File format**: JSON or YAML
**Location**: Repo root (`monolicense.config.json`)
**Schema**: See CONFIG_SCHEMA.md (to be created)

**Example**:

```json
{
  "version": "1.0",
  "projects": [
    { "name": "web-app", "path": "apps/web" },
    { "name": "api", "path": "apps/api" }
  ],
  "policy": {
    "allowed": ["MIT", "Apache-2.0"],
    "review": ["ISC", "BSD-2-Clause"],
    "forbidden": ["GPL-3.0"]
  },
  "output": {
    "formats": ["json", "markdown"],
    "directory": "reports"
  },
  "approvals": {
    "file": "monolicense.approvals.json"
  }
}
```

### Approvals File

**File format**: JSON
**Location**: Repo root (`monolicense.approvals.json` by default, configurable)
**Schema**: See CONFIG_SCHEMA.md (to be created)

**Example**:

```json
{
  "version": "1.0",
  "approvals": [
    {
      "package": "some-package",
      "version": "1.2.3",
      "license": "ISC",
      "approvedBy": "lukebeach",
      "approvedAt": "2025-11-26T10:30:00Z",
      "reason": "Reviewed with legal team",
      "scope": null,
      "expiresAt": null
    }
  ]
}
```

### Web App and Database (v2.0+ - Hosted Service)

**When we build a hosted service later**:

- **Frontend**: React or similar lightweight framework
- **Backend**: Node.js + Express (minimal API)
- **Database**: MongoDB
  - Flexible schema for JSON-like scan results
  - Easy to evolve schema as features grow
  - Good fit for storing approvals, scan history, reports
  - Scales well for multi-tenant architecture
- **Auth**: GitHub OAuth for easy login
- **Hosting**: Vercel (frontend), Railway/Render (backend + MongoDB)

> **Implementation Note**: Hosting decisions will be finalized during v2.0 planning based on cost analysis, scaling needs, and operational complexity. Current preference is managed services to minimize ops burden.

**MongoDB Collections (v2.0+ design)**:

> **Design Notes for v2.0**: Schema will need to address multi-tenancy (tenantId), data retention policies (scan history limits per tier), TTL indexes for automatic cleanup, and query optimization (indexes for common patterns like repo lookups, branch filtering, aggregate counts). These will be detailed in a dedicated DATABASE_DESIGN.md document during v2.0 planning.

```javascript
// scans collection
{
  _id: ObjectId,
  repoId: "owner/repo",
  branch: "main",
  commit: "abc123",
  scannedAt: ISODate,
  results: {
    projects: [
      { name: "web-app", dependencies: [...], violations: [...] }
    ]
  }
}

// approvals collection
{
  _id: ObjectId,
  repoId: "owner/repo",
  package: "some-package",
  version: "1.2.3",
  license: "ISC",
  approvedBy: { githubId: "lukebeach", name: "Luke Beach" },
  approvedAt: ISODate,
  reason: "...",
  scope: ["web-app"],
  expiresAt: ISODate
}

// repos collection
{
  _id: ObjectId,
  repoId: "owner/repo",
  team: { name: "...", plan: "free|team|business" },
  settings: { ... }
}
```

**Purpose**:

- Store scan results over time
- Show trends (new licenses added, removed)
- Multi-repo dashboard
- Team access controls
- Hosted approval workflow

**Not required for v1.0** - CLI and GitHub Action with file-based approvals are sufficient.

---

## 7. State Management in CI

### How Approvals Work in CI

#### v1.0: File-Based (Recommended for MVP)

**State location**: `monolicense.approvals.json` in git repo

**CI workflow**:

1. GitHub Action checks out repo (includes approval file)
2. Runs `monolicense scan`
3. CLI reads `monolicense.approvals.json`
4. Checks each dependency against approvals
5. Passes if all review-flagged dependencies are approved
6. Fails if new unapproved dependencies found

**Advantages**:

- ✅ No external state storage needed
- ✅ Works offline
- ✅ Git is source of truth
- ✅ Approval changes go through PR review
- ✅ Full audit trail in git history

**How to add approval**:

1. Edit `monolicense.approvals.json` locally
2. Commit and push (same PR or separate)
3. CI re-runs and passes

#### v1.5+: GitHub Issues (Design TBD)

**State location**: GitHub Issues + labels

**Rough concept** (to be flushed out later):

- CLI queries GitHub API for issues with label `monolicense:approval`
- Issue title format: `[MonoLicense] Approve: some-package@1.2.3 (ISC)`
- Approval status determined by labels or issue state
- Requires `GITHUB_TOKEN` in CI environment

**Challenges**:

- How to handle rate limits?
- Should CLI auto-create issues or just check?
- How to sync approvals back to local file (if at all)?
- What if issue is deleted?

**Decision**: Design this in v1.5 planning phase, not now.

#### v2.0+: Hosted Service

**State location**: MongoDB cloud database

**Workflow**:

1. CI runs `monolicense scan --api-key=xxx`
2. CLI sends scan results to MonoLicense API
3. API checks approvals in MongoDB
4. Returns pass/fail status
5. Team manages approvals via web dashboard

**Advantages**:

- ✅ Nice web UI for approvals
- ✅ Multi-repo management
- ✅ Notifications and reminders
- ✅ Audit logs

**Disadvantages**:

- ❌ Requires hosted service
- ❌ External dependency (if API is down, CI fails)
- ❌ Not available for free tier users

**Hybrid approach** (best of both worlds):

- CLI checks local approval file first
- Optionally syncs with cloud (if API key provided)
- Falls back to local if API unavailable

---

## 8. Pricing Idea (Very Rough)

### Free Tier (Open Source CLI)

- ✅ Unlimited scans locally
- ✅ CLI tool (fully featured)
- ✅ File-based approvals
- ✅ GitHub Action (basic)
- ✅ All output formats (JSON, Markdown, HTML)
- ❌ No hosted scan history
- ❌ No web dashboard
- ❌ No MongoDB-backed approvals
- ❌ No multi-repo management

**Target**: Solo devs, small teams, open source projects

---

### Paid Tiers (Future - Hosted Service)

**Tier 1: Team ($29-49/month)**

- ✅ Everything in Free
- ✅ Hosted scan history (90 days) in MongoDB
- ✅ Web dashboard for approvals
- ✅ Up to 5 repositories
- ✅ Email notifications on policy violations
- ✅ Basic support

**Tier 2: Business ($99-149/month)**

- ✅ Everything in Team
- ✅ Unlimited repositories
- ✅ 1 year scan history in MongoDB (pricing subject to cost analysis)
- ✅ Advanced reporting (trends, comparisons)
- ✅ Team management and permissions
- ✅ SSO / SAML (if we build it)
- ✅ Priority support

> **Note**: Enterprise tier is deprioritized for initial launch. Focus on Team and Business tiers first; Enterprise requires dedicated support/sales resources that distract from product development.

**Tier 3: Enterprise (Custom)** _(Future - Low Priority)_

- ✅ Everything in Business
- ✅ Self-hosted option (bring your own MongoDB)
- ✅ Custom integrations
- ✅ SLA and dedicated support
- ✅ Multi-language support (if we build it)
- ✅ On-premise deployment

---

### Monetization Philosophy

1. **Open core model**: CLI is free forever (MIT license)
2. **Value-added services**: Charge for hosted history, dashboards, and convenience
3. **No feature gates on scanning**: Core scanning and policy checks always free
4. **Hosted automation is paid**: Bot/webhook automation has hosting costs, so it's a paid feature
5. **File-based approvals always free**: Don't paywall basic approval workflow
6. **Align with user value**: Only charge when we provide ongoing value (hosting, storage, analysis)

---

## 9. Immediate Next Steps

Now that we have the overview defined, here's the sequence to move forward:

### Phase 1: Documentation (Before Code)

1. ✅ **PROJECT_OVERVIEW.md** (this document)
2. ⬜ **ARCHITECTURE.md** - System design, components, data flow
3. ⬜ **CONFIG_SCHEMA.md** - Exact config file specification (includes approval file schema)
4. ⬜ **CODING_STANDARDS.md** - Language conventions, file structure
5. ⬜ **TECHNICAL_SPEC.md** - Detailed component behaviors
6. ⬜ **API_SPECIFICATION.md** - CLI commands, flags, outputs
7. ⬜ **DATA_MODELS.md** - TypeScript interfaces and types

See **TODO.md** for complete documentation checklist.

### Phase 2: Proof of Concept (v0.1)

Once docs are complete:

1. **Prototype scanner** that:

   - Reads `pnpm-lock.yaml`
   - Reads `pnpm-workspace.yaml`
   - Groups dependencies per workspace project
   - Extracts license data
   - Emits JSON output

2. **Minimal CLI** (`monolicense scan`):

   - Single command
   - Hardcoded config for now
   - JSON output to console

3. **Test on real monorepo**:
   - Use a public pnpm monorepo (e.g., Turborepo examples)
   - Verify accuracy of dependency detection
   - Validate license extraction

### Phase 3: MVP (v0.5-1.0)

1. **Build `monolicense init` command**:

   - Interactive setup wizard
   - License recommendation system with tier-based suggestions
   - Pre-approval of existing dependencies
   - Internal package auto-approve detection
   - Download license data on first run
   - Create baseline scan (`.monolicense/last-scan.json`)

2. **Core scanning functionality**:

   - Add config file support
   - Add policy checking
   - Add approvals file support
   - Add auto-approve patterns
   - Add multiple output formats

3. **License data system**:

   - Bundle license recommendation metadata
   - Implement update mechanism (`monolicense update-license-data`)
   - Build license data API (v1.0 or v1.5)

4. **CI/CD support**:

   - Non-interactive mode for CI environments
   - Build GitHub Action wrapper
   - Add error handling

5. **Testing and documentation**:
   - Write comprehensive tests
   - Create user documentation (README, usage guides)

---

## 10. Success Metrics (Future)

How we'll know MonoLicense is working:

### v1.0 Success Criteria

- ✅ Successfully scans 3+ package managers (pnpm, npm, yarn)
- ✅ File-based approval workflow is clear and usable
- ✅ Used by at least 10 teams in production
- ✅ GitHub Action has 100+ installations
- ✅ <5 critical bugs in issue tracker
- ✅ Scan time <30s for repos with 500+ dependencies

### v2.0+ Success Criteria (If We Build Hosted Service)

- ✅ 100+ paying teams
- ✅ 1,000+ repositories scanned monthly
- ✅ MongoDB handles multi-tenant load efficiently
- ✅ Revenue covers hosting + 1 FTE
- ✅ NPS score >40

---

## 11. Risks and Mitigation

### Risk 1: Lockfile Complexity

**Risk**: Package manager lockfiles are complex and change frequently.
**Mitigation**:

- Start with pnpm (most structured lockfile format)
- Build parser with clear interfaces for extensibility
- Write extensive test fixtures for different lockfile versions
- Monitor package manager release notes

### Risk 2: License Detection Accuracy

**Risk**: Licenses can be missing, malformed, or ambiguous.
**Mitigation**:

- Use SPDX license identifiers as canonical source
- Fall back to LICENSE file parsing
- Flag unknown licenses clearly (don't guess)
- Allow user overrides in approvals file

### Risk 3: Approval Workflow Adoption

**Risk**: Users might find manual JSON editing too cumbersome.
**Mitigation**:

- Keep JSON schema simple and well-documented
- Provide clear examples in docs
- Add `monolicense approve` CLI helper in v1.5
- Validate that file-based approach works with beta users before v1.0
- Build GitHub Issues integration in v1.5 if demand exists

### Risk 4: Market Fit

**Risk**: Teams might prefer enterprise tools or manual processes.
**Mitigation**:

- Focus on underserved segment (small/medium teams)
- Keep free tier generous (CLI is always free)
- Validate with 5-10 beta users before v1.0 launch
- Gather feedback early and iterate

### Risk 5: Maintenance Burden

**Risk**: Supporting multiple package managers and monorepo tools is complex.
**Mitigation**:

- Ship with just pnpm first (v0.1)
- Add other package managers incrementally based on demand
- Use modular architecture so each package manager is isolated
- Comprehensive test suite to catch regressions

### Risk 6: MongoDB Complexity (v2.0+)

**Risk**: Managing hosted MongoDB adds operational overhead.
**Mitigation**:

- Don't build hosted service until v1.0 proves market fit
- Use MongoDB Atlas (managed service) instead of self-hosting
- Keep schema simple and well-indexed
- Start with small instance, scale as needed

---

## 12. Appendix: Related Tools and Differentiation

### Existing Tools

| Tool                       | Focus              | Gaps for Monorepos                        |
| -------------------------- | ------------------ | ----------------------------------------- |
| `license-checker`          | Single project     | No monorepo support, no approval workflow |
| `npm audit` / `yarn audit` | Vulnerabilities    | Not focused on licenses                   |
| Snyk, Sonatype             | Enterprise SCA     | Expensive, complex setup                  |
| FOSSA                      | License compliance | Enterprise-only, heavy                    |
| `licensed` (GitHub)        | Multi-language     | Not JS-native, complex config             |

### MonoLicense Differentiators

1. **Monorepo-first**: Built for workspaces, not single projects
2. **Lightweight**: No cloud scanning, no complex setup
3. **Per-project reports**: Understand each app/service independently
4. **Approval workflow**: Built-in, git-based approval tracking with audit trail
5. **CI-native**: Designed for GitHub Actions from day one
6. **Free core**: CLI is MIT licensed and free forever
7. **File-based state**: No external dependencies for basic usage

---

## Document History

| Date       | Version | Changes                                                                                                                       |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 2025-11-26 | 1.0     | Initial creation from Notion outline                                                                                          |
| 2025-11-26 | 1.1     | Added MongoDB, approval workflow, state management                                                                            |
| 2025-11-26 | 1.2     | Updated CI integration with phased approach: v1.0 GitHub Action, v1.5 GitHub App/Bot (file-based), v2.0 MongoDB cloud service |

---

**Next Document**: [ARCHITECTURE.md](./ARCHITECTURE.md) (to be created)
**See Also**: [TODO.md](../TODO.md) for full documentation roadmap
