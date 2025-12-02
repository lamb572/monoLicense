# MonoLicense - Architecture

**Last Updated**: 2025-11-27
**Status**: Planning Phase - Pre-Code
**Version**: 0.0.0 (Not yet implemented)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Apps Layer](#apps-layer)
4. [Libraries Layer](#libraries-layer)
5. [Data Flow](#data-flow)
6. [Technology Stack](#technology-stack)
7. [Feature Library Details](#feature-library-details)
8. [External Dependencies](#external-dependencies)
9. [Deployment Architecture](#deployment-architecture)
10. [Scalability and Performance](#scalability-and-performance)

---

## System Overview

MonoLicense is built as a **monorepo** using a strict **apps/libs architecture** where:

- **apps/** contains deployable applications (CLI, Web Dashboard, API, Bot)
- **libs/** contains reusable feature libraries (no deployment, pure functions)

This architecture provides:

- **Zero Circular Dependencies** - Each lib is self-contained
- **Optimal Tree-Shaking** - Apps only bundle what they import
- **Microservice Ready** - Easy to extract features to separate services
- **Parallel Development** - Teams can work on different libs independently
- **Incremental Builds** - TypeScript composite projects for fast rebuilds

```
┌─────────────────────────────────────────────────────────────┐
│                      Apps Layer                             │
│  (Deployable Applications - Import from libs)               │
├──────────────┬──────────────────┬──────────────────────────┤
│  CLI         │  Web Dashboard   │  API         │   Bot     │
│  (Binary)    │  (Static Site)   │  (Server)    │  (Server) │
└──────┬───────┴────────┬─────────┴──────┬───────┴──────┬────┘
       │                │                │              │
       └────────────────┴────────────────┴──────────────┘
                         │
              ┌──────────▼──────────┐
              │   Libraries Layer    │
              │ (Reusable Functions) │
              └──────────┬──────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
   ┌───▼────┐      ┌────▼─────┐     ┌────▼──────┐
   │License │      │Dependency│     │ Approval  │
   │  Lib   │      │   Lib    │     │   Lib     │
   └────────┘      └──────────┘     └───────────┘
       │                 │                 │
   ┌───▼────┐      ┌────▼─────┐     ┌────▼──────┐
   │ Policy │      │ Parsers  │     │ Reporter  │
   │  Lib   │      │   Lib    │     │   Lib     │
   └────────┘      └──────────┘     └───────────┘
```

### Design Principles

> **Enforcement**: These principles are enforced via ESLint with `eslint-plugin-functional` rules (no-class, no-this-expression, immutable-data, no-let, prefer-readonly-type). See [CODING_STANDARDS.md](./03_CODING_STANDARDS.md) for configuration details.

1. **Functional Programming First**: Pure functions, no classes, no `this`
2. **Feature-Based Libraries**: Each lib owns its types and functions
3. **Explicit Dependencies**: No shared "kitchen sink" package
4. **Composability**: Small functions compose into larger ones
5. **Immutability**: All data transformations create new objects
6. **Type Safety**: Strict TypeScript with comprehensive type coverage
7. **Testability**: Every function can be tested in isolation

---

## Monorepo Structure

```
monolicense/
├── apps/
│   ├── cli/                          # CLI tool (Node binary)
│   ├── web-dashboard/                # Web UI (v2.0+)
│   ├── api/                          # REST API (v2.0+)
│   └── bot/                          # GitHub Bot (v1.5+)
│
├── libs/
│   ├── dependency/                   # Dependency scanning
│   ├── license/                      # License extraction & recommendations
│   ├── approval/                     # Approval management
│   ├── policy/                       # Policy evaluation
│   ├── reporter/                     # Report generation
│   ├── parsers/                      # Lockfile parsers
│   ├── ui/                           # UI components
│   ├── testing/                      # Shared test utilities
│   ├── utils/                        # General utilities
│   └── config/                       # Shared configurations
│       ├── formatters/               # Prettier
│       ├── linters/                  # ESLint
│       ├── bundlers/                 # Vite/Rollup
│       └── compilers/                # TypeScript
│
├── docs/                             # Documentation
├── scripts/                          # Build scripts
├── pnpm-workspace.yaml               # pnpm workspace config
├── package.json                      # Root package.json
└── tsconfig.json                     # Root TypeScript config
```

### Workspace Configuration

**pnpm-workspace.yaml**:

```yaml
packages:
  - "apps/*"
  - "libs/*"
```

**Root tsconfig.json** (Composite Project):

```json
{
  "files": [],
  "references": [
    { "path": "./apps/cli" },
    { "path": "./apps/web-dashboard" },
    { "path": "./apps/api" },
    { "path": "./apps/bot" },
    { "path": "./libs/dependency" },
    { "path": "./libs/license" },
    { "path": "./libs/approval" },
    { "path": "./libs/policy" },
    { "path": "./libs/reporter" },
    { "path": "./libs/parsers" },
    { "path": "./libs/ui" },
    { "path": "./libs/testing" },
    { "path": "./libs/utils" }
  ]
}
```

---

## Apps Layer

### 1. CLI App (`apps/cli`)

**Purpose**: Command-line interface for MonoLicense.

**Structure**:

```
apps/cli/
├── src/
│   ├── commands/              # Command implementations
│   │   ├── scan.ts
│   │   ├── init.ts
│   │   ├── approve.ts
│   │   ├── diff.ts
│   │   └── update-license-data.ts
│   ├── utils/                 # CLI-specific utilities
│   │   ├── interactive.ts     # @clack/prompts wrappers
│   │   └── output.ts          # Terminal formatting
│   └── index.ts               # Main entry point
├── tests/
├── package.json
└── tsconfig.json
```

**Dependencies**:

```json
{
  "dependencies": {
    "@monolicense/dependency": "workspace:*",
    "@monolicense/license": "workspace:*",
    "@monolicense/approval": "workspace:*",
    "@monolicense/policy": "workspace:*",
    "@monolicense/reporter": "workspace:*",
    "@monolicense/parsers": "workspace:*",
    "@monolicense/utils": "workspace:*",
    "commander": "^12.0.0",
    "@clack/prompts": "^0.7.0",
    "chalk": "^5.3.0"
  }
}
```

**Commands** (v1.0):

- `monolicense scan` - Run full compliance scan
- `monolicense init` - Interactive setup wizard
- `monolicense update-license-data` - Download latest license data
- `monolicense check-license-data` - Check for updates
- `monolicense validate` - Validate config files
- `monolicense version` - Show version info

**Commands** (v1.5+):

- `monolicense approve` - Interactive approval helper
- `monolicense diff` - Show dependency changes

**Exit Codes**:

- `0` - All licenses pass policy
- `1` - Forbidden licenses found
- `2` - Unknown/missing licenses found (if strict mode enabled)
- `3` - Configuration error
- `4` - Scan error (lockfile parsing failed, etc.)
- `5` - Unapproved dependencies requiring review

---

### 2. Web Dashboard App (`apps/web-dashboard`)

**Purpose**: Web UI for viewing scan results and managing approvals (v2.0+).

**Structure**:

```
apps/web-dashboard/
├── src/
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── scan-results.tsx
│   │   ├── approvals.tsx
│   │   └── settings.tsx
│   ├── hooks/
│   ├── utils/
│   └── main.tsx
├── e2e/                       # Playwright tests
├── tests/                     # Unit tests
├── package.json
└── tsconfig.json
```

**Dependencies**:

```json
{
  "dependencies": {
    "@monolicense/ui": "workspace:*",
    "@monolicense/reporter": "workspace:*",
    "@monolicense/utils": "workspace:*",
    "react": "^18.3.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

**Technology**:

- React 18 with TypeScript
- Vite for bundling
- TanStack Query for data fetching
- React Router for routing
- Playwright for E2E tests
- Loki.js for visual regression testing

---

### 3. API App (`apps/api`)

**Purpose**: REST API for hosted MonoLicense service (v2.0+).

**Structure** (Feature-Based, Microservice-Ready):

```
apps/api/
├── src/
│   ├── features/              # Feature-based routes (no coupling)
│   │   ├── scan/
│   │   │   ├── routes.ts      # Fastify routes
│   │   │   ├── handlers.ts    # Request handlers (pure functions)
│   │   │   ├── schemas.ts     # JSON schemas
│   │   │   ├── services.ts    # Business logic (pure functions)
│   │   │   └── scan.test.ts   # Co-located tests
│   │   ├── approvals/
│   │   │   └── ...
│   │   ├── licenses/
│   │   │   └── ...
│   │   └── reports/
│   │       └── ...
│   └── server.ts             # Fastify server setup
├── tests/
│   ├── integration/
│   └── e2e/
├── package.json
└── tsconfig.json
```

**Dependencies**:

```json
{
  "dependencies": {
    "@monolicense/dependency": "workspace:*",
    "@monolicense/license": "workspace:*",
    "@monolicense/approval": "workspace:*",
    "@monolicense/policy": "workspace:*",
    "@monolicense/utils": "workspace:*",
    "fastify": "^4.25.0",
    "mongodb": "^6.3.0",
    "@fastify/jwt": "^8.0.0"
  }
}
```

**Technology**:

- Fastify (TypeScript-first, fast, plugin-based)
- MongoDB for persistence
- JWT authentication
- OpenAPI documentation (auto-generated from JSDoc)

**Shared API Infrastructure** (in `libs/api-infra`):

API infrastructure code that might be shared across multiple API apps lives in `libs/api-infra`:

```
libs/api-infra/
├── src/
│   ├── db.ts             # MongoDB connection factory
│   ├── auth.ts           # Authentication (JWT validation)
│   ├── config.ts         # API config loading utilities
│   ├── logger.ts         # Structured logging
│   └── index.ts          # Barrel export
├── package.json
└── tsconfig.json
```

**Feature Independence**:

> **Enforcement**: Feature independence is enforced by ESLint import rules that prevent cross-feature imports. Each feature can only import from `libs/` and external packages.

Each feature (`scan/`, `approvals/`, etc.) is completely independent and can be extracted to a microservice with minimal changes.

---

### 4. Bot App (`apps/bot`)

**Purpose**: GitHub App/Bot for PR comments and interactive approvals (v1.5+).

**Structure**:

```
apps/bot/
├── src/
│   ├── handlers/
│   │   ├── pull-request.ts
│   │   ├── issue-comment.ts
│   │   └── check-run.ts
│   ├── commands/
│   │   ├── approve.ts
│   │   ├── scan.ts
│   │   └── help.ts
│   ├── utils/
│   └── index.ts
├── tests/
├── package.json
└── tsconfig.json
```

**Dependencies**:

```json
{
  "dependencies": {
    "@monolicense/dependency": "workspace:*",
    "@monolicense/license": "workspace:*",
    "@monolicense/approval": "workspace:*",
    "@monolicense/policy": "workspace:*",
    "@monolicense/reporter": "workspace:*",
    "@monolicense/utils": "workspace:*",
    "probot": "^13.0.0",
    "@octokit/rest": "^20.0.0"
  }
}
```

**Technology**:

- Probot framework for GitHub Apps
- Octokit for GitHub API

**Commands** (via PR comments):

- `/monolicense scan` - Trigger scan
- `/monolicense approve <package>` - Approve dependency
- `/monolicense help` - Show available commands

---

## Libraries Layer

### Library Design Principles

Each library follows these rules:

> **Enforcement**: These rules are enforced via `eslint-plugin-functional`. See [CODING_STANDARDS.md](./03_CODING_STANDARDS.md) for ESLint configuration.

1. **Self-Contained**: Contains its own types and functions
2. **No Classes**: Pure functions only (except for third-party requirements)
3. **No `this`**: All parameters explicit
4. **Immutable**: Never mutate inputs
5. **Composable**: Small functions that compose
6. **Testable**: Target 80% unit test coverage with focus on quality over quantity

### Library Structure Template

```
libs/feature-name/
├── src/
│   ├── types.ts           # TypeScript interfaces for this feature
│   ├── function-a.ts      # Pure function
│   ├── function-b.ts      # Pure function
│   ├── function-c.ts      # Pure function
│   └── index.ts           # Barrel export
├── tests/
│   ├── function-a.test.ts
│   ├── function-b.test.ts
│   └── function-c.test.ts
├── package.json
└── tsconfig.json
```

**Example exports**:

```typescript
// libs/license/src/index.ts
export type * from "./types"
export { extractLicense } from "./extract-license"
export { normalizeLicense } from "./normalize-license"
export { recommendPolicy } from "./recommend-policy"
```

---

## Libraries Layer - Feature Libraries

### 1. Dependency Library (`libs/dependency`)

**Purpose**: Monorepo detection and dependency extraction.

**Exports**:

```typescript
// Types
export interface MonorepoDetectionResult {}
export interface Project {}
export interface Dependency {}

// Functions
export const detectMonorepo: (rootPath: string) => MonorepoDetectionResult
export const detectPnpmWorkspace: (rootPath: string) => MonorepoDetectionResult
export const detectNpmWorkspace: (rootPath: string) => MonorepoDetectionResult
export const detectYarnWorkspace: (rootPath: string) => MonorepoDetectionResult
export const extractDependencies: (
  lockfileData: LockfileData,
  project: Project
) => Dependency[]
export const buildDependencyGraph: (
  dependencies: Dependency[]
) => DependencyGraph
```

**Key Algorithms**:

- Workspace detection (pnpm-workspace.yaml, package.json workspaces, etc.)
- Project enumeration
- Dependency graph construction with deduplication

---

### 2. License Library (`libs/license`)

**Purpose**: License extraction, normalization, and recommendations.

**Exports**:

```typescript
// Types
export interface LicenseInfo {}
export interface LicenseMetadata {}
export interface LicenseTier {}
export interface PolicyRecommendation {}

// Functions
export const extractLicense: (packagePath: string) => LicenseInfo
export const extractLicenseFromPackageJson: (
  packageJson: PackageJson
) => string | null
export const normalizeLicenseToSpdx: (license: string) => string
export const loadLicenseData: () => LicenseRecommendationData
export const recommendPolicy: (
  dependencies: Dependency[],
  threshold: number
) => PolicyRecommendation
export const downloadLicenseData: () => Promise<void>
export const checkForUpdates: () => Promise<UpdateCheckResult>
```

**Key Features**:

- Multi-source license detection (package.json, LICENSE file, README)
- SPDX normalization
- License recommendation system (5 tiers)
- License data update mechanism

**License Data Structure**:

```typescript
interface LicenseRecommendationData {
  version: string
  dataVersion: string
  lastUpdated: string
  tiers: {
    "universally-accepted": LicenseTier
    "generally-accepted": LicenseTier
    situational: LicenseTier
    restrictive: LicenseTier
    unknown: LicenseTier
  }
  metadata: Record<string, LicenseMetadata>
}
```

---

### 3. Approval Library (`libs/approval`)

**Purpose**: Approval matching and management.

**Exports**:

```typescript
// Types
export interface Approval {}
export interface Approvals {}
export interface AutoApproveConfig {}

// Functions
export const matchApproval: (
  dependency: Dependency,
  approvals: Approvals
) => boolean
export const addApproval: (
  approvals: Approvals,
  approval: Approval
) => Approvals
export const removeApproval: (
  approvals: Approvals,
  packageKey: string
) => Approvals
export const checkAutoApprove: (
  dependency: Dependency,
  config: AutoApproveConfig
) => boolean
export const loadApprovals: (path: string) => Approvals
export const saveApprovals: (path: string, approvals: Approvals) => void
```

**Key Features**:

- Approval matching by package@version
- Auto-approve pattern matching (publisher, license)
- Approval expiration handling

---

### 4. Policy Library (`libs/policy`)

**Purpose**: Policy evaluation and violation detection.

**Exports**:

```typescript
// Types
export interface Policy {}
export interface PolicyEvaluationResult {}
export interface Violation {}

// Functions
export const evaluatePolicy: (
  dependency: Dependency,
  policy: Policy
) => PolicyEvaluationResult
export const checkViolation: (
  result: PolicyEvaluationResult
) => Violation | null
export const evaluateAllDependencies: (
  dependencies: Dependency[],
  policy: Policy,
  approvals: Approvals
) => PolicyEvaluationResult[]
export const groupViolationsBySeverity: (
  violations: Violation[]
) => Record<string, Violation[]>
```

**Policy Evaluation Logic**:

1. Check if dependency is approved → `approved`
2. Check if license is forbidden → `forbidden` (violation)
3. Check if license is allowed → `allowed`
4. Check if license requires review → `review` (violation)
5. Otherwise → `unknown` (violation)

---

### 5. Reporter Library (`libs/reporter`)

**Purpose**: Generate reports in various formats.

**Exports**:

```typescript
// Types
export interface ScanResult {}
export interface ProjectReport {}
export interface SummaryReport {}

// Functions
export const generateMarkdownReport: (result: ScanResult) => string
export const generateJsonReport: (result: ScanResult) => string
export const generateHtmlReport: (result: ScanResult) => string
export const generateSummaryReport: (projects: ProjectReport[]) => SummaryReport
export const formatViolation: (violation: Violation) => string
```

**Report Types**:

- Per-project reports
- Summary report (aggregated across all projects)
- Diff report (changes since last scan)

---

### 6. Parsers Library (`libs/parsers`)

**Purpose**: Lockfile parsing for different package managers.

**Exports**:

```typescript
// Types
export interface LockfileData {}
export interface LockfileParser {}

// Functions
export const parsePnpmLockfile: (path: string) => LockfileData
export const parseNpmLockfile: (path: string) => LockfileData
export const parseYarnLockfile: (path: string) => LockfileData
export const detectLockfileType: (path: string) => "pnpm" | "npm" | "yarn"
```

**Supported Formats**:

- pnpm-lock.yaml (v6.0+)
- package-lock.json (v2+)
- yarn.lock (Classic and Berry)

---

### 7. UI Library (`libs/ui`)

**Purpose**: Reusable React components for web-dashboard.

**Exports**:

```typescript
// Components
export const LicenseCard: React.FC<{ license: string }>
export const ViolationList: React.FC<{ violations: Violation[] }>
export const DependencyTable: React.FC<{ dependencies: Dependency[] }>
export const ScanSummary: React.FC<{ summary: ScanSummary }>
export const PolicyBadge: React.FC<{ status: PolicyStatus }>

// Hooks
export const useScanResults: (scanId: string) => ScanResult
export const useApprovals: () => Approvals
```

**Technology**:

- React 18 with TypeScript
- Tailwind CSS for styling
- Radix UI for accessible primitives
- Storybook for component documentation
- Loki.js for visual regression testing
- Shadcn/UI for components
- playwright for e2e testing

---

### 8. Testing Library (`libs/testing`)

**Purpose**: Shared test utilities, fixtures, and mocks **only**.

> **Important**: This library contains only shared testing infrastructure. Feature-specific tests live alongside the feature code in each library (co-located tests). Do NOT add feature tests here.

**Exports**:

```typescript
// Fixtures
export const createMockDependency: (
  overrides?: Partial<Dependency>
) => Dependency
export const createMockLicenseInfo: (
  overrides?: Partial<LicenseInfo>
) => LicenseInfo
export const createMockConfig: (overrides?: Partial<Config>) => Config
export const loadFixtureLockfile: (name: "pnpm" | "npm" | "yarn") => string

// Helpers
export const expectNoViolations: (result: ScanResult) => void
export const expectViolationCount: (result: ScanResult, count: number) => void
export const mockFileSystem: (files: Record<string, string>) => void
```

**Why Shared Testing Library?**

- Prevents duplicate test utilities across apps
- Ensures consistent test data
- Provides realistic fixtures (lockfiles, configs)
- Reusable assertions and matchers

---

### 9. Utils Library (`libs/utils`)

**Purpose**: General-purpose utilities used across multiple features.

**Exports**:

```typescript
// File system (IO boundary functions)
export const readJsonFile: (path: string) => unknown
export const writeJsonFile: (path: string, data: unknown) => void
export const fileExists: (path: string) => boolean

// Validation
export const isValidSpdxId: (id: string) => boolean
export const isValidConfig: (config: unknown) => config is Config

// Error handling
export const createConfigError: (message: string, path?: string) => ConfigError
export const createLockfileError: (
  message: string,
  path: string
) => LockfileError
```

**Note**: This is for **truly general** utilities only. Feature-specific utilities belong in their feature library.

---

### 10. Config Library (`libs/config`)

**Purpose**: Shared configuration for tools (Prettier, ESLint, TypeScript, Vite).

> **Note**: The current structure uses tool-based organization (formatters, linters, bundlers, compilers). If app-specific configurations diverge significantly (e.g., Web needs different bundler config than CLI), consider splitting into `libs/config-web`, `libs/config-node`, etc. For now, the tool-based approach with app/lib variants (e.g., `app.json` vs `lib.json`) is sufficient.

**Structure**:

```
libs/config/
├── formatters/                # Prettier configs
│   ├── index.json
│   └── package.json
├── linters/                   # ESLint configs
│   ├── base.js              # Base config for all packages
│   ├── react.js             # React-specific rules
│   ├── node.js              # Node-specific rules
│   └── package.json
├── bundlers/                  # Vite configs
│   ├── vite.config.ts
│   └── package.json
└── compilers/                 # TypeScript configs
    ├── base.json            # Base tsconfig
    ├── app.json             # For apps
    ├── lib.json             # For libraries
    └── package.json
```

**Usage**:

```json
// apps/cli/package.json
{
  "prettier": "@monolicense/config-formatters",
  "eslintConfig": {
    "extends": "@monolicense/config-linters/node"
  }
}

// apps/cli/tsconfig.json
{
  "extends": "@monolicense/config-compilers/app.json"
}
```

---

## Data Flow

### 1. Scan Flow (CLI)

```
User runs: monolicense scan
         │
         ▼
┌─────────────────────────┐
│ CLI: Parse Arguments    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Utils: Load Config      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Dependency: Detect      │
│ Monorepo                │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Parsers: Parse Lockfile │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Dependency: Extract     │
│ Dependencies            │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ License: Extract        │
│ Licenses (parallel)     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Approval: Load          │
│ Approvals               │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Policy: Evaluate        │
│ All Dependencies        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Reporter: Generate      │
│ Reports                 │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Utils: Write Files      │
└──────────┬──────────────┘
           │
           ▼
      Exit with code
```

### 2. Init Flow (CLI)

```
User runs: monolicense init
         │
         ▼
┌─────────────────────────┐
│ Dependency: Detect      │
│ Monorepo                │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Dependency: Scan        │
│ All Dependencies        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ License: Extract        │
│ All Licenses            │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ License: Recommend      │
│ Policy (90% threshold)  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ CLI: Interactive        │
│ Prompts (@clack)        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Utils: Write Config     │
│ Files                   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ License: Download       │
│ License Data            │
└──────────┬──────────────┘
           │
           ▼
      Setup complete
```

### 3. API Scan Flow

```
POST /api/scan
         │
         ▼
┌─────────────────────────┐
│ API: Validate Request   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Dependency: Scan        │
│ (same as CLI)           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ API: Save to MongoDB    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ API: Return JSON        │
└─────────────────────────┘
```

---

## Technology Stack

### Apps

| App           | Primary Tech                  | Additional                                 |
| ------------- | ----------------------------- | ------------------------------------------ |
| CLI           | Node.js 22.x, TypeScript 5.3+ | Commander, @clack/prompts, Chalk           |
| Web Dashboard | React 18, Vite                | TanStack Query, React Router, Tailwind CSS |
| API           | Fastify 4.x, MongoDB 6.x      | @fastify/jwt, Pino logger                  |
| Bot           | Probot 13.x                   | Octokit                                    |

### Libraries

| Category        | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| Language        | TypeScript 5.3+ (strict mode)                                 |
| Package Manager | pnpm 8.x (workspaces)                                         |
| Testing         | Vitest (unit/integration), Playwright (E2E), Loki.js (visual) |
| Linting         | ESLint 9.x with functional plugin                             |
| Formatting      | Prettier 3.x                                                  |
| Build           | TypeScript composite projects (incremental)                   |

### External Services (v2.0+)

| Service        | Purpose               |
| -------------- | --------------------- |
| MongoDB Atlas  | Persistence for API   |
| Vercel/Netlify | Web dashboard hosting |
| Railway/Fly.io | API hosting           |
| GitHub Apps    | Bot hosting           |

---

## Feature Library Details

### Dependency Library - Monorepo Detection

**Detection Priority**:

1. pnpm-workspace.yaml
2. package.json (npm/yarn workspaces)
3. rush.json
4. lerna.json
5. Single project fallback

**Example**:

```typescript
// libs/dependency/src/detect-monorepo.ts
export const detectMonorepo = (rootPath: string): MonorepoDetectionResult => {
  const detectors = [
    detectPnpmWorkspace,
    detectNpmWorkspace,
    detectYarnWorkspace,
    detectRushMonorepo,
  ]

  for (const detector of detectors) {
    const result = detector(rootPath)
    if (result.detected) {
      return result
    }
  }

  return createSingleProjectResult(rootPath)
}
```

### License Library - Extraction Strategy

**Multi-Source Extraction**:

1. package.json `license` field (preferred)
2. package.json `licenses` array (deprecated)
3. LICENSE file (parse with heuristics)
4. README.md (last resort)
5. UNKNOWN if nothing found

**SPDX Normalization**:

```typescript
// libs/license/src/normalize-license.ts
export const normalizeLicenseToSpdx = (license: string): string => {
  // Use spdx-correct library
  const corrected = spdxCorrect(license)
  if (corrected) return corrected

  // Common non-SPDX mappings
  const mappings: Record<string, string> = {
    BSD: "BSD-3-Clause",
    "Apache 2.0": "Apache-2.0",
    UNLICENSED: "UNLICENSED",
  }

  return mappings[license] ?? "UNKNOWN"
}
```

### Parser Library - Lockfile Parsing

**Plugin Architecture**:

```typescript
// libs/parsers/src/types.ts
export interface LockfileParser {
  readonly type: "pnpm" | "npm" | "yarn"
  parse: (path: string) => LockfileData
  extractDependencies: (data: LockfileData, projectPath: string) => Dependency[]
}

// libs/parsers/src/parse-pnpm-lockfile.ts
export const parsePnpmLockfile = (path: string): LockfileData => {
  const content = readFileSync(path, "utf-8")
  const parsed = parseYaml(content)

  return {
    type: "pnpm",
    version: parsed.lockfileVersion,
    packages: parsed.packages ?? {},
    importers: parsed.importers ?? {},
    raw: parsed,
  }
}
```

---

## External Dependencies

### npm Registry

- **Purpose**: Fetch package metadata when not in node_modules
- **API**: https://registry.npmjs.org/{package}/{version}
- **Fallback**: Local node_modules first, registry second
- **Rate Limiting**: Batched requests, max 10 concurrent

### License Data API (v1.0+)

- **Purpose**: Download license recommendation data
- **Endpoint**: https://api.monolicense.com/v1/license-data
- **Format**: JSON
- **Update Frequency**: Check daily, manual download
- **Versioning**: Date-based (e.g., `2024-01-15`)

### GitHub API (v1.5+)

- **Purpose**: Bot integration, PR comments
- **Authentication**: GitHub App installation token
- **Rate Limiting**: 5000 requests/hour per installation

---

## Deployment Architecture

### v1.0 - CLI Only

```
┌──────────────────────┐
│   Developer Machine  │
│                      │
│  $ monolicense scan  │
│         │            │
│         ▼            │
│  monolicense.config  │
│  pnpm-lock.yaml      │
│         │            │
│         ▼            │
│   Scan Results       │
│   (local files)      │
└──────────────────────┘
```

### v1.5 - CLI + Bot

```
┌──────────────────────┐      ┌──────────────────────┐
│   GitHub Actions     │──────│   GitHub Bot         │
│                      │      │   (Probot Server)    │
│  $ monolicense scan  │      │                      │
│         │            │      │  Listens to:         │
│         ▼            │      │  - PR events         │
│  Comment on PR       │◄─────│  - /approve commands │
│  Update approvals.   │      │                      │
└──────────────────────┘      └──────────────────────┘
```

### v2.0 - Full Stack

```
┌──────────────────────┐      ┌──────────────────────┐
│   Web Dashboard      │──────│   API Server         │
│   (React SPA)        │      │   (Fastify)          │
│                      │      │         │            │
│  - View Scans        │      │         ▼            │
│  - Manage Approvals  │      │   ┌──────────────┐   │
│  - Settings          │      │   │   MongoDB    │   │
└──────────────────────┘      │   └──────────────┘   │
                              │                      │
                              │  Features:           │
                              │  - /scan             │
                              │  - /approvals        │
                              │  - /reports          │
                              └──────────────────────┘
```

---

## Scalability and Performance

### Build Performance

**TypeScript Composite Projects**:

- Build only changed packages
- Parallel builds across libs
- Incremental compilation with `.tsbuildinfo`

**Example build times** (approximate):

- Full build: 30-60 seconds
- Incremental build (single lib): 2-5 seconds
- Watch mode: <1 second per change

### Runtime Performance

**CLI Scan Performance Targets**:

- Small repos (<100 deps): <5 seconds
- Medium repos (100-500 deps): <15 seconds
- Large repos (500-2000 deps): <60 seconds

**Optimization Strategies**:

1. **Parallel License Extraction**: Use `Promise.all()` in batches
2. **Caching**: In-memory cache during scan (v1.0), persistent cache (v1.5+)
3. **Deduplication**: Extract license once per unique package@version
4. **Streaming**: For very large monorepos (2000+ packages)

### Bundle Size Optimization

**Tree-Shaking**:

- Apps only bundle imported functions
- CLI bundle: ~2-3 MB (includes Node runtime)
- Web dashboard bundle: ~200-300 KB gzipped

**Example**:

```typescript
// CLI imports only what it needs
import { detectMonorepo } from "@monolicense/dependency"
import { extractLicense } from "@monolicense/license"
// Does NOT bundle: API routes, React components, Bot handlers
```

---

## Document History

| Date       | Version | Changes                                                                                       |
| ---------- | ------- | --------------------------------------------------------------------------------------------- |
| 2025-11-27 | 2.0     | Complete rewrite with apps/libs architecture, functional programming, feature-based libraries |
| 2025-11-26 | 1.0     | Initial architecture document                                                                 |

---

**Previous Document**: [PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md)
**Next Document**: [CODING_STANDARDS.md](./03_CODING_STANDARDS.md)
**See Also**:

- [CODING_STANDARDS.md](./03_CODING_STANDARDS.md) - Functional programming standards
- [TODO.md](../TODO.md) - Full documentation roadmap
