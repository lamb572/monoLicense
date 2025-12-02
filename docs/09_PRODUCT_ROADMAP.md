# MonoLicense - Product Roadmap

**Last Updated**: 2025-12-01
**Status**: Planning Phase - Pre-Code
**Version**: 0.0.0 (Not yet implemented)

---

## Table of Contents

1. [Roadmap Overview](#1-roadmap-overview)
2. [Version Strategy](#2-version-strategy)
3. [Phase 0: Documentation](#phase-0-documentation)
4. [Phase 1: Proof of Concept (v0.1)](#phase-1-proof-of-concept-v01)
5. [Phase 2: Alpha (v0.5)](#phase-2-alpha-v05)
6. [Phase 3: MVP Release (v1.0)](#phase-3-mvp-release-v10)
7. [Phase 4: Enhanced CLI (v1.5)](#phase-4-enhanced-cli-v15)
8. [Phase 5: Hosted Service (v2.0)](#phase-5-hosted-service-v20)
9. [Phase 6: Advanced Features (v2.5+)](#phase-6-advanced-features-v25)
10. [Dependency Graph](#10-dependency-graph)
11. [Risk-Adjusted Priorities](#11-risk-adjusted-priorities)
12. [Success Gates](#12-success-gates)

---

## 1. Roadmap Overview

MonoLicense follows an incremental delivery model with clear phases:

```
Phase 0        Phase 1       Phase 2       Phase 3       Phase 4       Phase 5       Phase 6
Documentation → Proof of    → Alpha       → MVP         → Enhanced    → Hosted      → Advanced
                Concept       (v0.5)        (v1.0)        CLI (v1.5)    Service       Features
                (v0.1)                                                  (v2.0)        (v2.5+)
```

**Core Principle**: Each phase delivers usable value. Users can adopt at any version.

---

## 2. Version Strategy

### Semantic Versioning

- **v0.x** - Pre-release, API may change
- **v1.x** - Stable CLI, file-based workflows
- **v2.x** - Hosted service, MongoDB integration

### Version Compatibility

| Version | CLI | GitHub Action | GitHub Bot | Web Dashboard | API |
|---------|-----|---------------|------------|---------------|-----|
| v0.1    | Basic | ❌ | ❌ | ❌ | ❌ |
| v0.5    | Full | ❌ | ❌ | ❌ | ❌ |
| v1.0    | Full | ✅ | ❌ | ❌ | ❌ |
| v1.5    | Full | ✅ | ✅ | ❌ | ❌ |
| v2.0    | Full | ✅ | ✅ | ✅ | ✅ |

---

## Phase 0: Documentation

**Status**: ✅ Complete

**Goal**: Define product vision, architecture, and technical specifications before writing code.

### Deliverables

| Document | Purpose | Status |
|----------|---------|--------|
| 01_PROJECT_OVERVIEW.md | Product vision, features, pricing | ✅ Complete |
| 02_ARCHITECTURE.md | System design, apps/libs structure | ✅ Complete |
| 03_CODING_STANDARDS.md | Functional programming guidelines | ✅ Complete |
| 04_DATA_MODELS.md | TypeScript interfaces | ✅ Complete |
| 05_CONFIG_SCHEMA.md | Configuration file specs | ✅ Complete |
| 06_API_SPECIFICATION.md | CLI commands and flags | ✅ Complete |
| 07_TECHNICAL_SPEC.md | Algorithms and implementation | ✅ Complete |
| 08_TESTING_STRATEGY.md | Testing approach | ✅ Complete |
| 09_PRODUCT_ROADMAP.md | This document | ✅ Complete |

### Exit Criteria

- [x] All core documentation complete
- [x] Technical decisions documented
- [x] Architecture validated
- [ ] Documentation reviewed by stakeholders

---

## Phase 1: Proof of Concept (v0.1)

**Goal**: Validate core scanning logic works with pnpm monorepos.

### Milestone 1.1: Project Setup

**Deliverables**:
- [ ] Initialize pnpm monorepo structure
- [ ] Configure TypeScript composite projects
- [ ] Set up ESLint with functional plugin
- [ ] Set up Prettier
- [ ] Configure Vitest
- [ ] Create initial `libs/` structure

**Libraries to Create**:
```
libs/
├── utils/          # File I/O, validation
├── parsers/        # Lockfile parsing (pnpm only)
├── dependency/     # Dependency extraction
├── license/        # License extraction
├── config/         # Shared tool configs
└── testing/        # Test utilities
```

### Milestone 1.2: pnpm Lockfile Parser

**Deliverables**:
- [ ] `libs/parsers` - Parse pnpm-lock.yaml (v6.0+ format)
- [ ] Extract package names, versions, and dependency relationships
- [ ] Handle workspace protocol (`workspace:*`)
- [ ] Unit tests with real lockfile fixtures

**Key Functions**:
```typescript
parsePnpmLockfile(path: string): Result<LockfileData, LockfileError>
```

### Milestone 1.3: Workspace Detection

**Deliverables**:
- [ ] `libs/dependency` - Detect pnpm workspaces
- [ ] Parse `pnpm-workspace.yaml`
- [ ] Enumerate projects from glob patterns
- [ ] Map dependencies to projects

**Key Functions**:
```typescript
detectPnpmWorkspace(rootPath: string): Result<MonorepoDetectionResult, DetectionError>
extractProjectDependencies(lockfile: LockfileData, project: Project): Dependency[]
```

### Milestone 1.4: License Extraction

**Deliverables**:
- [ ] `libs/license` - Extract license from node_modules
- [ ] Read `package.json` license field
- [ ] Parse LICENSE file as fallback
- [ ] SPDX normalization

**Key Functions**:
```typescript
extractLicense(packagePath: string): Result<LicenseInfo, LicenseError>
normalizeLicenseToSpdx(license: string): string
```

### Milestone 1.5: Minimal CLI

**Deliverables**:
- [ ] `apps/cli` - Basic CLI with Commander.js
- [ ] `monolicense scan` command (hardcoded config)
- [ ] JSON output to stdout
- [ ] Basic error handling

**Usage**:
```bash
monolicense scan --format json
```

### Exit Criteria

- [ ] Successfully scans a real pnpm monorepo
- [ ] Correctly identifies per-project dependencies
- [ ] Extracts licenses from 95%+ packages
- [ ] All unit tests pass (80%+ coverage)

---

## Phase 2: Alpha (v0.5)

**Goal**: Feature-complete CLI with config file support, ready for alpha testing.

### Milestone 2.1: Configuration System

**Deliverables**:
- [ ] `monolicense.config.json` parsing
- [ ] JSON Schema validation
- [ ] Policy definition (allowed/review/forbidden)
- [ ] Project path configuration
- [ ] Output format configuration

**Key Functions**:
```typescript
loadConfig(path: string): Result<Config, ConfigError>
validateConfig(config: unknown): Result<Config, ValidationError>
```

### Milestone 2.2: Policy Evaluation

**Deliverables**:
- [ ] `libs/policy` - Policy evaluation logic
- [ ] Check dependencies against policy
- [ ] Generate violations list
- [ ] Support for unknown license handling

**Key Functions**:
```typescript
evaluatePolicy(dependency: Dependency, policy: Policy): PolicyEvaluationResult
evaluateAllDependencies(deps: Dependency[], policy: Policy): PolicyEvaluationResult[]
```

### Milestone 2.3: Approvals System

**Deliverables**:
- [ ] `libs/approval` - Approval matching
- [ ] `monolicense.approvals.json` parsing
- [ ] Exact version matching
- [ ] Version range matching
- [ ] Wildcard patterns (`@company/*`)
- [ ] Project-scoped approvals
- [ ] Expiration handling

**Key Functions**:
```typescript
loadApprovals(path: string): Result<Approvals, ApprovalError>
matchApproval(dependency: Dependency, approvals: Approvals): ApprovalMatch | null
```

### Milestone 2.4: Report Generation

**Deliverables**:
- [ ] `libs/reporter` - Report generation
- [ ] JSON report format
- [ ] Markdown report format
- [ ] Console summary output
- [ ] Per-project reports

**Key Functions**:
```typescript
generateJsonReport(result: ScanResult): string
generateMarkdownReport(result: ScanResult): string
formatConsoleSummary(result: ScanResult): string
```

### Milestone 2.5: Additional Package Managers

**Deliverables**:
- [ ] npm lockfile parser (package-lock.json v2+)
- [ ] Yarn lockfile parser (Classic and Berry)
- [ ] Auto-detection of package manager
- [ ] Unified LockfileData interface

### Milestone 2.6: CLI Polish

**Deliverables**:
- [ ] All exit codes implemented (0-5)
- [ ] `--forbidden`, `--review`, `--unknown`, `--strict` flags
- [ ] `--format` flag (json, markdown)
- [ ] `--output` flag (directory path)
- [ ] `--config` flag (custom config path)
- [ ] `--verbose` and `--quiet` flags
- [ ] Colored console output with Chalk

### Exit Criteria

- [ ] Full policy evaluation working
- [ ] Approvals system functional
- [ ] All three package managers supported
- [ ] Alpha testers can use it on real projects
- [ ] 80%+ test coverage

---

## Phase 3: MVP Release (v1.0)

**Goal**: Production-ready CLI with GitHub Action, ready for public release.

### Milestone 3.1: Init Command

**Deliverables**:
- [ ] `monolicense init` interactive wizard
- [ ] @clack/prompts integration
- [ ] Project auto-detection
- [ ] License recommendation system
- [ ] Policy generation from scan results
- [ ] Auto-approve internal packages
- [ ] Pre-approve existing dependencies option

**User Flow**:
```
$ monolicense init

◆ Welcome to MonoLicense!

◇ Detected pnpm workspace with 5 projects
│ apps/web, apps/api, libs/ui, libs/utils, libs/shared

◇ Scanning dependencies...
│ Found 342 unique packages

◇ License summary:
│ MIT: 280 (82%)
│ Apache-2.0: 35 (10%)
│ ISC: 15 (4%)
│ BSD-3-Clause: 8 (2%)
│ Unknown: 4 (1%)

◆ Recommended policy covers 96% of your dependencies:
│ ✓ Allowed: MIT, Apache-2.0, BSD-3-Clause, BSD-2-Clause, ISC
│ ? Review: LGPL-2.1, MPL-2.0
│ ✗ Forbidden: GPL-3.0, AGPL-3.0

◇ Accept this policy? (y/n)
```

### Milestone 3.2: License Data System

**Deliverables**:
- [ ] Bundle license-data.json with CLI
- [ ] License tier definitions (5 tiers)
- [ ] License metadata (OSI approved, copyleft, etc.)
- [ ] `monolicense update-license-data` command
- [ ] `monolicense check-license-data` command
- [ ] Version checking and update prompts

### Milestone 3.3: Validate Command

**Deliverables**:
- [ ] `monolicense validate` command
- [ ] Config file syntax validation
- [ ] Approvals file validation
- [ ] Schema error reporting

### Milestone 3.4: Diff Command

**Deliverables**:
- [ ] `monolicense diff` command
- [ ] Compare current scan to baseline
- [ ] Show added/removed dependencies
- [ ] Show license changes
- [ ] Baseline storage (`.monolicense/last-scan.json`)

### Milestone 3.5: GitHub Action

**Deliverables**:
- [ ] `monolicense/action` GitHub Action
- [ ] Workflow YAML examples
- [ ] Action inputs (config, fail-on-*, etc.)
- [ ] PR comment with scan summary (optional)
- [ ] Caching for performance

**Example Workflow**:
```yaml
- uses: monolicense/action@v1
  with:
    config: monolicense.config.json
    fail-on-forbidden: true
    fail-on-review: true
```

### Milestone 3.6: Documentation and Polish

**Deliverables**:
- [ ] README.md with quick start
- [ ] User documentation site
- [ ] Migration guide from other tools
- [ ] Troubleshooting guide
- [ ] Contributing guide
- [ ] npm package published (`@monolicense/cli`)

### Milestone 3.7: Performance Optimization

**Deliverables**:
- [ ] Parallel license extraction
- [ ] In-memory caching during scan
- [ ] Deduplication by package@version
- [ ] Performance benchmarks documented

**Targets**:
- Small repos (<100 deps): <5 seconds
- Medium repos (100-500 deps): <15 seconds
- Large repos (500-2000 deps): <60 seconds

### Exit Criteria

- [ ] All v1.0 CLI commands implemented
- [ ] GitHub Action published and working
- [ ] Documentation complete
- [ ] 10+ beta users validated workflow
- [ ] Performance targets met
- [ ] No critical bugs

---

## Phase 4: Enhanced CLI (v1.5)

**Goal**: Improved UX with interactive approvals and GitHub Bot.

### Milestone 4.1: Approve Command

**Deliverables**:
- [ ] `monolicense approve <package>` command
- [ ] Interactive mode (`--interactive`)
- [ ] Bulk approval support
- [ ] Reason and scope prompts
- [ ] Git user detection for approvedBy

**Usage**:
```bash
# Interactive single approval
monolicense approve lodash@4.17.21

# Interactive bulk approval
monolicense approve --interactive

# Non-interactive (CI/scripts)
monolicense approve lodash@4.17.21 --reason "Reviewed" --approved-by "luke"
```

### Milestone 4.2: HTML Reports

**Deliverables**:
- [ ] HTML report format
- [ ] Styled, shareable reports
- [ ] Dependency table with sorting
- [ ] Policy violation highlighting
- [ ] Print-friendly CSS

### Milestone 4.3: Persistent Cache

**Deliverables**:
- [ ] Cache license data between scans
- [ ] Cache invalidation on version change
- [ ] `--no-cache` flag
- [ ] Cache location configuration

### Milestone 4.4: GitHub Bot (v1.5)

**Deliverables**:
- [ ] `apps/bot` - Probot-based GitHub App
- [ ] PR webhook handling
- [ ] Bot comments on PRs with scan results
- [ ] `/monolicense approve` command
- [ ] `/monolicense scan` command
- [ ] Auto-commit approvals to branch
- [ ] GitHub App marketplace listing

**Bot Comment Example**:
```markdown
## MonoLicense Scan Results

| Package | Version | License | Status |
|---------|---------|---------|--------|
| new-package | 1.0.0 | ISC | ⚠️ Needs review |

Reply `/monolicense approve new-package "Reviewed with legal"` to approve.
```

### Milestone 4.5: Auto-Approve Patterns

**Deliverables**:
- [ ] Auto-approve by publisher (`@mycompany/*`)
- [ ] Auto-approve by license tier
- [ ] Auto-approve internal packages
- [ ] Config file support for patterns

### Exit Criteria

- [ ] Interactive approve command working
- [ ] GitHub Bot deployed and functional
- [ ] HTML reports available
- [ ] Performance maintained with caching

---

## Phase 5: Hosted Service (v2.0)

**Goal**: Cloud dashboard with MongoDB persistence for teams.

### Milestone 5.1: API Server

**Deliverables**:
- [ ] `apps/api` - Fastify REST API
- [ ] Authentication (JWT + GitHub OAuth)
- [ ] Rate limiting
- [ ] OpenAPI documentation
- [ ] Health checks

**Endpoints**:
```
POST /api/v1/scans          # Submit scan results
GET  /api/v1/scans/:id      # Get scan details
GET  /api/v1/repos/:id/scans # List scans for repo
POST /api/v1/approvals      # Create approval
GET  /api/v1/approvals      # List approvals
```

### Milestone 5.2: MongoDB Integration

**Deliverables**:
- [ ] MongoDB Atlas setup
- [ ] Schema design (scans, approvals, repos, users)
- [ ] Indexes for common queries
- [ ] Data retention policies
- [ ] Backup strategy

**Collections**:
```
scans       - Scan results history
approvals   - Centralized approvals
repos       - Repository configurations
users       - User accounts (GitHub OAuth)
teams       - Team management
```

### Milestone 5.3: Web Dashboard

**Deliverables**:
- [ ] `apps/web-dashboard` - React SPA
- [ ] Dashboard overview
- [ ] Scan history view
- [ ] Approval management UI
- [ ] Settings page
- [ ] Multi-repo support

### Milestone 5.4: CLI Cloud Sync

**Deliverables**:
- [ ] `--api-key` flag for CLI
- [ ] Upload scan results to cloud
- [ ] Download approvals from cloud
- [ ] Fallback to local when offline

### Milestone 5.5: Notifications

**Deliverables**:
- [ ] Email notifications
- [ ] Slack integration
- [ ] Webhook support
- [ ] Notification preferences

### Milestone 5.6: Billing and Pricing

**Deliverables**:
- [ ] Stripe integration
- [ ] Team tier ($29-49/month)
- [ ] Business tier ($99-149/month)
- [ ] Usage tracking
- [ ] Billing dashboard

### Exit Criteria

- [ ] API server deployed and stable
- [ ] Dashboard functional
- [ ] 100+ teams using hosted service
- [ ] Revenue covers infrastructure costs

---

## Phase 6: Advanced Features (v2.5+)

**Goal**: Advanced features for larger organizations.

### Potential Features (Prioritize Based on Demand)

**6.1 Dependency Visualization**
- Interactive dependency tree UI
- Filter by license, status, project
- Export as image/data

**6.2 Trend Analysis**
- License trends over time
- New dependency alerts
- Compliance score tracking

**6.3 Multi-Language Support**
- Python (pip/poetry)
- Go (go.mod)
- Rust (Cargo.toml)

**6.4 Enterprise Features**
- SSO/SAML authentication
- Self-hosted option
- Custom SLA
- Dedicated support

**6.5 Advanced Policies**
- Per-project policy overrides
- License compatibility rules
- Custom violation severity

**6.6 Integrations**
- Jira integration
- ServiceNow integration
- Custom webhooks

---

## 10. Dependency Graph

```
Phase 0 (Docs)
    │
    ▼
Phase 1 (v0.1) ─── libs/parsers, libs/dependency, libs/license
    │
    ▼
Phase 2 (v0.5) ─── libs/policy, libs/approval, libs/reporter
    │              + npm/yarn parsers
    ▼
Phase 3 (v1.0) ─── init command, GitHub Action, license-data
    │
    ├──────────────────────────┐
    ▼                          ▼
Phase 4 (v1.5)             Phase 5 (v2.0)
GitHub Bot                 API + Dashboard
approve command            MongoDB
    │                          │
    └──────────┬───────────────┘
               ▼
         Phase 6 (v2.5+)
         Advanced Features
```

**Key Dependencies**:
- v0.5 requires v0.1 (parser/license libs)
- v1.0 requires v0.5 (policy/approval libs)
- v1.5 can proceed in parallel with v2.0 planning
- v2.0 requires v1.0 stable CLI

---

## 11. Risk-Adjusted Priorities

### High Priority (Must Have for v1.0)

| Feature | Risk | Mitigation |
|---------|------|------------|
| pnpm parser | Medium - lockfile format changes | Extensive test fixtures |
| License extraction | High - many edge cases | Multi-source fallback |
| Policy evaluation | Low - well-defined logic | Comprehensive tests |
| GitHub Action | Low - standard pattern | Follow best practices |

### Medium Priority (v1.5)

| Feature | Risk | Mitigation |
|---------|------|------------|
| GitHub Bot | Medium - hosting costs | Start with minimal infrastructure |
| Interactive approve | Low - UX polish | User testing |
| npm/yarn parsers | Medium - format variations | Version-specific handling |

### Lower Priority (v2.0+)

| Feature | Risk | Mitigation |
|---------|------|------------|
| MongoDB service | High - operational overhead | Use managed Atlas |
| Web dashboard | Medium - scope creep | MVP feature set only |
| Billing | Low - standard pattern | Use Stripe |

---

## 12. Success Gates

### Gate 1: v0.1 → v0.5

- [ ] pnpm monorepo scanning works correctly
- [ ] License extraction accuracy >95%
- [ ] Internal team validated workflow

### Gate 2: v0.5 → v1.0

- [ ] 5+ alpha testers using daily
- [ ] All three package managers working
- [ ] No blocking bugs

### Gate 3: v1.0 → v1.5

- [ ] 100+ GitHub Action installations
- [ ] <5 critical bugs in 30 days
- [ ] User feedback incorporated

### Gate 4: v1.5 → v2.0

- [ ] GitHub Bot adopted by 50+ repos
- [ ] Clear demand for hosted features
- [ ] Business model validated

### Gate 5: v2.0 → v2.5+

- [ ] 100+ paying teams
- [ ] Revenue covers costs + growth
- [ ] Clear feature requests for v2.5

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-01 | 1.0 | Initial roadmap document |

---

**Previous Document**: [TESTING_STRATEGY.md](./08_TESTING_STRATEGY.md)
**See Also**:
- [PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md) - Product vision
- [ARCHITECTURE.md](./02_ARCHITECTURE.md) - System design
