# Data Model: pnpm Monorepo Scanner

**Feature**: 001-pnpm-scanner
**Date**: 2025-12-02
**Status**: Complete

## Core Entities

### Project

A workspace member representing an app or library in the monorepo.

```typescript
interface Project {
  readonly name: string;              // Package name from package.json
  readonly path: string;              // Relative path from monorepo root (e.g., "apps/web")
  readonly version: string;           // Version from package.json
  readonly dependencies: readonly Dependency[];
  readonly devDependencies: readonly Dependency[];
  readonly isWorkspaceRoot: boolean;  // True if this is the root package.json
}
```

**Validation Rules**:
- `name` must be non-empty string
- `path` must be valid relative path (no leading `/`)
- `version` must be valid semver or "0.0.0" for unversioned packages
- `dependencies` may be empty array

**Relationships**:
- A Project has many Dependencies
- A Project belongs to one ScanResult

---

### Dependency

A package dependency with name, version, and license information.

```typescript
interface Dependency {
  readonly name: string;              // Package name (e.g., "lodash")
  readonly version: string;           // Resolved version (e.g., "4.17.21")
  readonly license: LicenseInfo;      // License information
  readonly isWorkspaceDependency: boolean;  // True if workspace:* protocol
  readonly isDev: boolean;            // True if devDependency
  readonly specifier: string;         // Original specifier (e.g., "^4.17.0")
}
```

**Validation Rules**:
- `name` must be valid npm package name (scoped or unscoped)
- `version` must be exact resolved version (not range)
- `specifier` is the original version range from package.json

**Relationships**:
- A Dependency belongs to one or more Projects (deduplicated in output)
- A Dependency has one LicenseInfo

---

### LicenseInfo

License information for a dependency.

```typescript
interface LicenseInfo {
  readonly spdxId: string;            // Normalized SPDX identifier (e.g., "MIT")
  readonly source: LicenseSource;     // Where license was detected
  readonly rawValue: string | null;   // Original value if different from spdxId
}

type LicenseSource =
  | 'package.json'      // From license field in package.json
  | 'package.json-array' // From legacy licenses array
  | 'license-file'      // From LICENSE/LICENSE.md file
  | 'unknown';          // Could not be detected
```

**Validation Rules**:
- `spdxId` is "UNKNOWN" when license cannot be detected
- `rawValue` is null when it matches `spdxId`

**Special Values**:
- "UNKNOWN" - License could not be detected
- "UNLICENSED" - Explicitly no license (proprietary)
- SPDX expressions supported (e.g., "MIT OR Apache-2.0")

---

### ScanResult

The complete output of a scan operation.

```typescript
interface ScanResult {
  readonly projects: readonly Project[];
  readonly metadata: ScanMetadata;
  readonly summary: ScanSummary;
}

interface ScanMetadata {
  readonly monorepoRoot: string;      // Absolute path to monorepo root
  readonly lockfileVersion: string;   // pnpm lockfile version (e.g., "6.0")
  readonly scanTimestamp: string;     // ISO 8601 timestamp
  readonly pnpmVersion: string | null; // pnpm version if detectable
}

interface ScanSummary {
  readonly totalProjects: number;
  readonly totalDependencies: number;
  readonly uniqueDependencies: number;  // After deduplication
  readonly licenseCounts: Record<string, number>;  // License → count
  readonly unknownLicenseCount: number;
}
```

**Validation Rules**:
- `projects` must have at least one project (root)
- `scanTimestamp` must be valid ISO 8601

---

### LockfileData

Internal representation of parsed pnpm-lock.yaml.

```typescript
interface LockfileData {
  readonly lockfileVersion: string;
  readonly importers: Record<string, ImporterData>;
  readonly packages: Record<string, PackageData>;
  readonly settings?: LockfileSettings;
}

interface ImporterData {
  readonly dependencies?: Record<string, DependencyRef>;
  readonly devDependencies?: Record<string, DependencyRef>;
  readonly optionalDependencies?: Record<string, DependencyRef>;
}

interface DependencyRef {
  readonly specifier: string;         // e.g., "^4.17.0"
  readonly version: string;           // e.g., "4.17.21"
}

interface PackageData {
  readonly resolution: { readonly integrity: string };
  readonly dependencies?: Record<string, string>;
  readonly dev?: boolean;
  readonly optional?: boolean;
}

interface LockfileSettings {
  readonly autoInstallPeers?: boolean;
  readonly excludeLinksFromLockfile?: boolean;
}
```

---

### WorkspaceConfig

Parsed pnpm-workspace.yaml configuration.

```typescript
interface WorkspaceConfig {
  readonly packages: readonly string[];  // Glob patterns
}
```

---

## Error Types

```typescript
type ScanError =
  | { readonly type: 'LOCKFILE_NOT_FOUND'; readonly path: string }
  | { readonly type: 'LOCKFILE_PARSE_ERROR'; readonly path: string; readonly message: string; readonly line?: number }
  | { readonly type: 'WORKSPACE_CONFIG_NOT_FOUND'; readonly path: string }
  | { readonly type: 'WORKSPACE_CONFIG_PARSE_ERROR'; readonly path: string; readonly message: string }
  | { readonly type: 'INVALID_LOCKFILE_VERSION'; readonly version: string; readonly expected: string }
  | { readonly type: 'PROJECT_NOT_FOUND'; readonly path: string }
  | { readonly type: 'PACKAGE_JSON_PARSE_ERROR'; readonly path: string; readonly message: string };
```

---

## Result Types

All operations return Result types per constitution:

```typescript
type Result<T, E> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Function signatures
type ParseLockfile = (path: string) => Promise<Result<LockfileData, ScanError>>;
type ParseWorkspaceConfig = (path: string) => Promise<Result<WorkspaceConfig, ScanError>>;
type ExtractDependencies = (lockfile: LockfileData, projectPath: string) => Result<readonly Dependency[], ScanError>;
type ExtractLicense = (packagePath: string) => Promise<Result<LicenseInfo, ScanError>>;
type ScanMonorepo = (rootPath: string) => Promise<Result<ScanResult, ScanError>>;
```

---

## State Transitions

The scanner has no persistent state. Each scan is stateless:

```
[Start] → Parse Lockfile → Parse Workspace Config → Enumerate Projects →
Extract Dependencies → Extract Licenses → Build Result → [End]
```

On error at any stage, return `Result.failure` with appropriate error type.

---

## Entity Relationships Diagram

```
┌─────────────────┐
│   ScanResult    │
├─────────────────┤
│ projects[]      │──────┐
│ metadata        │      │
│ summary         │      │
└─────────────────┘      │
                         │ 1:N
                         ▼
┌─────────────────┐      ┌─────────────────┐
│ ScanMetadata    │      │    Project      │
├─────────────────┤      ├─────────────────┤
│ monorepoRoot    │      │ name            │
│ lockfileVersion │      │ path            │
│ scanTimestamp   │      │ dependencies[]  │──────┐
│ pnpmVersion     │      │ devDeps[]       │      │
└─────────────────┘      └─────────────────┘      │
                                                   │ 1:N
                                                   ▼
                         ┌─────────────────┐
                         │   Dependency    │
                         ├─────────────────┤
                         │ name            │
                         │ version         │
                         │ license         │──────┐
                         │ isWorkspaceDep  │      │
                         │ isDev           │      │
                         └─────────────────┘      │
                                                   │ 1:1
                                                   ▼
                         ┌─────────────────┐
                         │  LicenseInfo    │
                         ├─────────────────┤
                         │ spdxId          │
                         │ source          │
                         │ rawValue        │
                         └─────────────────┘
```
