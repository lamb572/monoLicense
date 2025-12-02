# MonoLicense - Data Models

This document defines all TypeScript interfaces and types used throughout MonoLicense.

---

## Table of Contents

1. [Core Domain Models](#1-core-domain-models)
2. [Configuration Models](#2-configuration-models)
3. [Scan Result Models](#3-scan-result-models)
4. [License Recommendation Models](#4-license-recommendation-models)
5. [Lockfile Models](#5-lockfile-models)
6. [Policy and Approval Models](#6-policy-and-approval-models)
7. [Report Models](#7-report-models)
8. [Error Models](#8-error-models)
9. [Utility Types](#9-utility-types)

---

## 1. Core Domain Models

### 1.1 Project / Workspace

```typescript
/**
 * Represents a single project or workspace in the monorepo
 */
interface Project {
  /** Project name from package.json or directory name */
  name: string;

  /** Absolute path to project directory */
  path: string;

  /** Package name from package.json (may differ from directory name) */
  packageName?: string;

  /** Package manager used by this project */
  packageManager: PackageManager;

  /** Relative path from monorepo root */
  relativePath: string;
}

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'rush';
```

### 1.2 Dependency

```typescript
/**
 * Represents a single dependency extracted from lockfile
 */
interface Dependency {
  /** Package name (may include scope like @types/node) */
  name: string;

  /** Exact version from lockfile */
  version: string;

  /** Whether this is a dev dependency */
  isDev: boolean;

  /** Whether this is an optional dependency */
  isOptional: boolean;

  /** Resolved tarball URL or integrity hash */
  resolved?: string;

  /** Integrity hash for verification */
  integrity?: string;
}

/**
 * Dependency with resolved license information
 */
interface ResolvedDependency extends Dependency {
  /** License information extracted from package */
  license: LicenseInfo;

  /** Unique key for deduplication (name@version) */
  packageKey: string;

  /** Package metadata */
  metadata?: PackageMetadata;
}
```

### 1.3 License Information

```typescript
/**
 * License information extracted from a package
 */
interface LicenseInfo {
  /** Normalized license type (SPDX identifier when possible) */
  type: string;

  /** SPDX identifier (null if not valid SPDX) */
  spdxId: string | null;

  /** Raw license value from package.json */
  raw: string | object | null;

  /** Confidence level of license detection */
  confidence: 'high' | 'medium' | 'low' | 'none';

  /** For multi-license packages */
  licenses?: LicenseInfo[];

  /** First 500 chars of LICENSE file (if used for detection) */
  fileContent?: string;

  /** Path to LICENSE file if found */
  filePath?: string;
}

/**
 * Package metadata from npm registry or package.json
 */
interface PackageMetadata {
  /** Package name */
  name: string;

  /** Package version */
  version: string;

  /** Repository information */
  repository?: {
    type: string;
    url: string;
  };

  /** Homepage URL */
  homepage?: string;

  /** Author information */
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };

  /** Publisher scope (for auto-approve detection) */
  publisher?: string;

  /** Package description */
  description?: string;
}
```

### 1.4 Monorepo Detection

```typescript
/**
 * Result of monorepo detection process
 */
interface MonorepoDetectionResult {
  /** Whether a monorepo was detected */
  detected: boolean;

  /** Type of monorepo detected */
  type: MonorepoType;

  /** All projects/workspaces found */
  projects: Project[];

  /** Location of lockfile(s) */
  lockfileLocation: string | string[];

  /** Root directory of monorepo */
  rootPath?: string;
}

type MonorepoType =
  | 'pnpm-workspace'
  | 'npm-workspace'
  | 'yarn-classic-workspace'
  | 'yarn-berry-workspace'
  | 'rush-monorepo'
  | 'lerna-monorepo'
  | 'single-project';
```

### 1.5 Dependency Graph

```typescript
/**
 * In-memory dependency graph for efficient license extraction
 */
interface DependencyGraph {
  /** Map of packageKey to PackageInfo */
  readonly packages: ReadonlyMap<string, PackageInfo>;

  /** Map of project name to resolved dependencies */
  readonly projectDependencies: ReadonlyMap<string, readonly ResolvedDependency[]>;
}

/**
 * Complete package information
 */
interface PackageInfo {
  /** Package name */
  name: string;

  /** Package version */
  version: string;

  /** License information */
  license: LicenseInfo;

  /** Repository information */
  repository?: {
    type: string;
    url: string;
  };

  /** Homepage URL */
  homepage?: string;

  /** Author information */
  author?: string | object;

  /** Publisher scope */
  publisher?: string;
}
```

---

## 2. Configuration Models

### 2.1 Main Configuration

```typescript
/**
 * Complete MonoLicense configuration
 * File: monolicense.config.json
 */
interface MonoLicenseConfig {
  /** Configuration schema version */
  $schema?: string;

  /** Configuration format version */
  version: string;

  /** Projects to scan (optional, defaults to auto-detect) */
  projects?: ProjectConfig[];

  /** License policy rules */
  policy: PolicyConfig;

  /** Auto-approve configuration */
  autoApprove?: AutoApproveConfig;

  /** Update check configuration */
  updates?: UpdateConfig;

  /** Report output configuration */
  output?: OutputConfig;
}

/**
 * Project-specific configuration
 */
interface ProjectConfig {
  /** Project name or glob pattern */
  name: string;

  /** Path to project (relative to config file) */
  path: string;

  /** Override policy for this project */
  policy?: Partial<PolicyConfig>;

  /** Whether to include in scans */
  enabled?: boolean;
}

/**
 * License policy configuration
 */
interface PolicyConfig {
  /** Licenses that are always allowed */
  readonly allowed: readonly string[];

  /** Licenses that require manual review */
  readonly review: readonly string[];

  /** Licenses that are forbidden */
  readonly forbidden: readonly string[];
}

/**
 * Auto-approve configuration
 */
interface AutoApproveConfig {
  /** Publisher patterns to auto-approve (e.g., "@mycompany/*") */
  readonly publishers?: readonly string[];

  /** Licenses to auto-approve */
  readonly licenses?: readonly string[];

  /** Custom comment to add to auto-approvals */
  readonly comment?: string;
}

/**
 * Update check configuration
 */
interface UpdateConfig {
  /** Whether to check for license data updates */
  checkLicenseData: boolean;

  /** Whether to auto-update (NOT RECOMMENDED) */
  autoUpdate: boolean;

  /** How often to check for updates */
  checkFrequency: 'daily' | 'weekly' | 'never';
}

/**
 * Report output configuration
 */
interface OutputConfig {
  /** Default output format */
  format?: 'markdown' | 'json' | 'html';

  /** Whether to include dev dependencies in reports */
  includeDevDependencies?: boolean;

  /** Whether to group by license or by project */
  groupBy?: 'license' | 'project';
}
```

### 2.2 Approvals Configuration

```typescript
/**
 * License approvals tracking
 * File: monolicense.approvals.json
 */
interface Approvals {
  /** Schema version */
  $schema?: string;

  /** Approvals format version */
  version: string;

  /** Last updated timestamp */
  lastUpdated: string;

  /** Map of package@version to approval */
  dependencies: Record<string, Approval>;
}

/**
 * Single dependency approval
 */
interface Approval {
  /** Package name */
  package: string;

  /** Package version */
  version: string;

  /** License at time of approval */
  license: string;

  /** When this was approved (ISO 8601) */
  approvedAt: string;

  /** Who approved it */
  approvedBy?: string;

  /** Optional approval comment */
  comment?: string;

  /** Optional expiration date (ISO 8601) */
  expiresAt?: string;

  /** How this was approved */
  source: 'manual' | 'auto-approve' | 'init' | 'bot';
}
```

### 2.3 Baseline Scan

```typescript
/**
 * Baseline scan for diff tracking
 * File: .monolicense/last-scan.json
 */
interface BaselineScan {
  /** Schema version */
  $schema?: string;

  /** Baseline format version */
  version: string;

  /** When this scan was performed */
  timestamp: string;

  /** Git commit hash at time of scan */
  gitCommit?: string;

  /** Summary of scan results */
  summary: ScanSummary;

  /** All dependencies at time of scan */
  dependencies: Record<string, BaselineDependency>;

  /** License breakdown at time of scan */
  licenses: Record<string, number>;
}

/**
 * Dependency in baseline scan
 */
interface BaselineDependency {
  /** Package name */
  name: string;

  /** Package version */
  version: string;

  /** License */
  readonly license: string;

  /** Projects using this dependency */
  readonly usedBy: readonly string[];

  /** Policy status at time of scan */
  readonly status: PolicyStatus;
}

type PolicyStatus = 'allowed' | 'review' | 'forbidden' | 'approved' | 'unknown';
```

---

## 3. Scan Result Models

### 3.1 Scan Result

```typescript
/**
 * Complete scan result
 */
interface ScanResult {
  /** Scan metadata */
  metadata: ScanMetadata;

  /** Overall summary */
  summary: ScanSummary;

  /** Per-project reports */
  projects: ProjectReport[];

  /** All violations found */
  violations: Violation[];

  /** License breakdown across all projects */
  licenseBreakdown: Record<string, LicenseBreakdownEntry>;
}

/**
 * Scan metadata
 */
interface ScanMetadata {
  /** When scan was performed */
  timestamp: string;

  /** MonoLicense version */
  version: string;

  /** License data version used */
  licenseDataVersion: string;

  /** Monorepo type detected */
  monorepoType: MonorepoType;

  /** Total scan duration in milliseconds */
  duration: number;

  /** Git commit hash (if available) */
  gitCommit?: string;
}

/**
 * Scan summary statistics
 */
interface ScanSummary {
  /** Total number of projects scanned */
  totalProjects: number;

  /** Total dependencies across all projects */
  totalDependencies: number;

  /** Unique packages (deduplicated) */
  uniquePackages: number;

  /** Unique licenses found */
  uniqueLicenses: number;

  /** Count by policy status */
  allowed: number;
  review: number;
  forbidden: number;
  approved: number;
  unknown: number;

  /** Whether scan passed based on policy */
  passed: boolean;
}

/**
 * License breakdown entry
 */
interface LicenseBreakdownEntry {
  /** License identifier */
  license: string;

  /** Number of dependencies with this license */
  readonly count: number;

  /** Projects using dependencies with this license */
  readonly usedBy: readonly string[];

  /** Policy status for this license */
  readonly status: PolicyStatus;
}
```

### 3.2 Project Report

```typescript
/**
 * Per-project scan report
 */
interface ProjectReport {
  /** Project name */
  projectName: string;

  /** Project path */
  projectPath: string;

  /** Total dependencies in this project */
  readonly totalDependencies: number;

  /** Unique licenses in this project */
  readonly uniqueLicenses: readonly string[];

  /** License breakdown for this project */
  readonly licenseBreakdown: Readonly<Record<string, number>>;

  /** All dependencies in this project */
  readonly dependencies: readonly DependencyReportItem[];

  /** Violations specific to this project */
  readonly violations: readonly Violation[];

  /** Project-level summary */
  summary: {
    allowed: number;
    review: number;
    forbidden: number;
    approved: number;
    unknown: number;
  };
}

/**
 * Dependency in report
 */
interface DependencyReportItem {
  /** Package name */
  name: string;

  /** Package version */
  version: string;

  /** License */
  license: string;

  /** Policy evaluation status */
  status: PolicyStatus;

  /** Whether this is a dev dependency */
  isDev: boolean;

  /** Whether this is optional */
  isOptional: boolean;

  /** Homepage URL if available */
  homepage?: string;

  /** Repository URL if available */
  repository?: string;
}
```

### 3.3 Violation

```typescript
/**
 * Policy violation
 */
interface Violation {
  /** Package name */
  package: string;

  /** Package version */
  version: string;

  /** License causing violation */
  license: string;

  /** Policy status */
  status: 'review' | 'forbidden' | 'unknown';

  /** Severity level */
  severity: 'error' | 'warning';

  /** Human-readable reason */
  readonly reason: string;

  /** Projects affected by this violation */
  readonly usedBy: readonly string[];

  /** Suggested action */
  readonly suggestion?: string;
}
```

### 3.4 Policy Evaluation Result

```typescript
/**
 * Result of evaluating a dependency against policy
 */
interface PolicyEvaluationResult {
  /** Evaluation status */
  status: PolicyStatus;

  /** License evaluated */
  license: string;

  /** Reason for this status */
  reason: string;

  /** Whether user action is required */
  requiresAction: boolean;

  /** Severity if action required */
  severity?: 'error' | 'warning';
}
```

---

## 4. License Recommendation Models

### 4.1 License Recommendation Data

```typescript
/**
 * Complete license recommendation data
 * File: .monolicense/license-data.json
 */
interface LicenseRecommendationData {
  /** Data format version */
  version: string;

  /** Data version (date-based) */
  dataVersion: string;

  /** When this data was last updated */
  lastUpdated: string;

  /** License tiers */
  tiers: {
    'universally-accepted': LicenseTier;
    'generally-accepted': LicenseTier;
    'situational': LicenseTier;
    'restrictive': LicenseTier;
    'unknown': LicenseTier;
  };

  /** Detailed metadata for each license */
  metadata: Record<string, LicenseMetadata>;
}

/**
 * License tier definition
 */
interface LicenseTier {
  /** Tier name */
  name: string;

  /** Tier description */
  description: string;

  /** Recommended policy action */
  readonly recommendedPolicy: 'allow' | 'review' | 'forbid';

  /** SPDX identifiers in this tier */
  readonly licenses: readonly string[];

  /** Display order */
  readonly order: number;
}

/**
 * Detailed license metadata
 */
interface LicenseMetadata {
  /** SPDX identifier */
  spdxId: string;

  /** Full license name */
  name: string;

  /** Tier this license belongs to */
  tier: string;

  /** License category */
  category: 'permissive' | 'weak-copyleft' | 'strong-copyleft' | 'public-domain' | 'proprietary' | 'unknown';

  /** License requirements */
  mustIncludeCopyright: boolean;
  mustIncludeLicense: boolean;
  mustDiscloseSource: boolean;

  /** License permissions */
  canUseCommercially: boolean;
  canModify: boolean;
  canDistribute: boolean;

  /** Copyleft requirement */
  mustShareAlike: boolean;

  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';

  /** Human-readable description */
  description: string;

  /** Link to full license text */
  readonly url: string;

  /** Alternative names / aliases */
  readonly aliases?: readonly string[];

  /** OSI approved? */
  readonly osiApproved?: boolean;

  /** FSF approved? */
  readonly fsfApproved?: boolean;
}
```

### 4.2 Policy Recommendation

```typescript
/**
 * Generated policy recommendation from init
 */
interface PolicyRecommendation {
  /** Recommended allowed licenses */
  readonly allowed: readonly string[];

  /** Recommended review licenses */
  readonly review: readonly string[];

  /** Recommended forbidden licenses */
  readonly forbidden: readonly string[];

  /** Coverage percentage (how many deps are covered by allowed) */
  coverage: number;

  /** Human-readable reasoning */
  reasoning: string;

  /** License usage statistics */
  statistics: {
    totalDependencies: number;
    uniqueLicenses: number;
    tierBreakdown: Record<string, number>;
    topLicenses: Array<{
      license: string;
      count: number;
      percentage: number;
    }>;
  };
}
```

### 4.3 Update Check Result

```typescript
/**
 * Result of checking for license data updates
 */
interface UpdateCheckResult {
  /** Whether update is available */
  updateAvailable: boolean;

  /** Current data version */
  currentVersion?: string;

  /** Latest available version */
  latestVersion?: string;

  /** Release notes for new version */
  releaseNotes?: string;

  /** Reason if no update available */
  reason?: string;
}

/**
 * Version info from API
 */
interface VersionInfo {
  /** API version */
  version: string;

  /** Data version (date-based) */
  dataVersion: string;

  /** Release date */
  releaseDate: string;

  /** Release notes */
  releaseNotes: string;

  /** Download URL */
  downloadUrl: string;
}
```

---

## 5. Lockfile Models

### 5.1 Lockfile Data

```typescript
/**
 * Parsed lockfile data (generic)
 */
interface LockfileData {
  /** Lockfile type */
  type: 'pnpm' | 'npm' | 'yarn-classic' | 'yarn-berry';

  /** Lockfile version */
  version: string;

  /** Parsed packages data */
  packages: Record<string, any>;

  /** Path to lockfile */
  filePath?: string;

  /** Raw parsed data */
  raw: any;
}

/**
 * pnpm-specific lockfile data
 */
interface PnpmLockfileData extends LockfileData {
  type: 'pnpm';

  /** Importers (workspace projects) */
  importers: Record<string, PnpmImporter>;

  /** Packages section */
  packages: Record<string, PnpmPackage>;
}

/**
 * pnpm importer (workspace project)
 */
interface PnpmImporter {
  /** Project dependencies */
  dependencies?: Record<string, string>;

  /** Dev dependencies */
  devDependencies?: Record<string, string>;

  /** Optional dependencies */
  optionalDependencies?: Record<string, string>;

  /** Specifiers (version ranges from package.json) */
  specifiers?: Record<string, string>;
}

/**
 * pnpm package entry
 */
interface PnpmPackage {
  /** Package resolution info */
  resolution: {
    integrity?: string;
    tarball?: string;
  };

  /** Package dependencies */
  dependencies?: Record<string, string>;

  /** Dev flag */
  dev?: boolean;

  /** Optional flag */
  optional?: boolean;
}

/**
 * npm lockfile data
 */
interface NpmLockfileData extends LockfileData {
  type: 'npm';

  /** Packages with node_modules paths */
  packages: Record<string, NpmPackage>;
}

/**
 * npm package entry
 */
interface NpmPackage {
  /** Package version */
  version: string;

  /** Resolved URL */
  resolved: string;

  /** Integrity hash */
  integrity: string;

  /** Dependencies */
  dependencies?: Record<string, string>;

  /** Dev dependency flag */
  dev?: boolean;

  /** Optional dependency flag */
  optional?: boolean;
}
```

---

## 6. Policy and Approval Models

### 6.1 Policy Evaluation

```typescript
/**
 * Policy evaluation context
 */
interface PolicyContext {
  /** Configuration */
  config: MonoLicenseConfig;

  /** Current approvals */
  approvals: Approvals;

  /** License recommendation data */
  licenseData: LicenseRecommendationData;
}

/**
 * Auto-approve check result
 */
interface AutoApproveCheckResult {
  /** Whether this should be auto-approved */
  shouldApprove: boolean;

  /** Reason for auto-approval */
  reason?: string;

  /** Auto-approve source */
  source?: 'publisher' | 'license';
}
```

---

## 7. Report Models

### 7.1 Diff Report

```typescript
/**
 * Diff report comparing two scans
 */
interface DiffReport {
  /** Baseline scan info */
  baseline: {
    timestamp: string;
    gitCommit?: string;
  };

  /** Current scan info */
  current: {
    timestamp: string;
    gitCommit?: string;
  };

  /** Summary of changes */
  summary: DiffSummary;

  /** Added dependencies */
  added: DiffEntry[];

  /** Removed dependencies */
  removed: DiffEntry[];

  /** Updated dependencies (version changes) */
  updated: DiffUpdateEntry[];

  /** License changes */
  licenseChanges: DiffLicenseChange[];

  /** New violations introduced */
  newViolations: Violation[];
}

/**
 * Diff summary
 */
interface DiffSummary {
  /** Number of added dependencies */
  added: number;

  /** Number of removed dependencies */
  removed: number;

  /** Number of updated dependencies */
  updated: number;

  /** Number of license changes */
  licenseChanges: number;

  /** Number of unchanged dependencies */
  unchanged: number;
}

/**
 * Diff entry for added/removed dependencies
 */
interface DiffEntry {
  /** Package name */
  package: string;

  /** Package version */
  version: string;

  /** License */
  license: string;

  /** Policy status */
  readonly status: PolicyStatus;

  /** Projects affected */
  readonly projects: readonly string[];
}

/**
 * Diff entry for updated dependencies
 */
interface DiffUpdateEntry {
  /** Package name */
  readonly package: string;

  /** Old version */
  readonly oldVersion: string;

  /** New version */
  readonly newVersion: string;

  /** License (if unchanged) */
  readonly license: string;

  /** Whether license changed */
  readonly licenseChanged: boolean;

  /** Projects affected */
  readonly projects: readonly string[];
}

/**
 * License change entry
 */
interface DiffLicenseChange {
  /** Package name */
  package: string;

  /** Package version */
  version: string;

  /** Old license */
  oldLicense: string;

  /** New license */
  newLicense: string;

  /** Old policy status */
  oldStatus: PolicyStatus;

  /** New policy status */
  readonly newStatus: PolicyStatus;

  /** Projects affected */
  readonly projects: readonly string[];
}
```

---

## 8. Error Models

### 8.1 Error Types

```typescript
/**
 * Base error interface for MonoLicense
 */
interface MonoLicenseError {
  /** Error name/type */
  readonly name: string;

  /** Error code for programmatic handling */
  readonly code: string;

  /** User-facing error message */
  readonly message: string;

  /** Technical details for debugging */
  readonly details?: string;

  /** Exit code for CLI */
  readonly exitCode: number;

  /** Stack trace */
  readonly stack?: string;
}

/**
 * Configuration-related error
 */
interface ConfigError extends MonoLicenseError {
  readonly name: 'ConfigError';
  readonly code: 'CONFIG_ERROR';
  readonly exitCode: 2;
}

/**
 * Lockfile-related error
 */
interface LockfileError extends MonoLicenseError {
  readonly name: 'LockfileError';
  readonly code: 'LOCKFILE_ERROR';
  readonly exitCode: 3;
}

/**
 * Network-related error
 */
interface NetworkError extends MonoLicenseError {
  readonly name: 'NetworkError';
  readonly code: 'NETWORK_ERROR';
  readonly exitCode: 4;
}

/**
 * File system error
 */
interface FileSystemError extends MonoLicenseError {
  readonly name: 'FileSystemError';
  readonly code: 'FS_ERROR';
  readonly exitCode: 5;
}

/**
 * Invalid workspace configuration error
 */
interface InvalidWorkspaceConfigError extends ConfigError {
  readonly name: 'InvalidWorkspaceConfigError';
}

/**
 * Unsupported lockfile version error
 */
interface UnsupportedLockfileVersionError extends LockfileError {
  readonly name: 'UnsupportedLockfileVersionError';
}

/**
 * Package not found error
 */
interface PackageNotFoundError extends NetworkError {
  readonly name: 'PackageNotFoundError';
}

/**
 * Project not found error
 */
interface ProjectNotFoundError extends LockfileError {
  readonly name: 'ProjectNotFoundError';
}

/**
 * License data API error
 */
interface LicenseDataAPIError extends NetworkError {
  readonly name: 'LicenseDataAPIError';
}

/**
 * Invalid lockfile error
 */
interface InvalidLockfileError extends LockfileError {
  readonly name: 'InvalidLockfileError';
}

/**
 * Creates a base MonoLicense error object
 *
 * @param name - Error name
 * @param code - Error code
 * @param message - Error message
 * @param exitCode - CLI exit code
 * @param details - Optional technical details
 * @returns Error object
 */
const createMonoLicenseError = (
  name: string,
  code: string,
  message: string,
  exitCode: number,
  details?: string
): MonoLicenseError => {
  const error = new Error(message);
  return {
    name,
    code,
    message,
    exitCode,
    details,
    stack: error.stack
  };
};

/**
 * Creates a configuration error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns ConfigError object
 */
const createConfigError = (message: string, details?: string): ConfigError => {
  return {
    ...createMonoLicenseError('ConfigError', 'CONFIG_ERROR', message, 2, details),
    name: 'ConfigError',
    code: 'CONFIG_ERROR',
    exitCode: 2
  };
};

/**
 * Creates a lockfile error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns LockfileError object
 */
const createLockfileError = (message: string, details?: string): LockfileError => {
  return {
    ...createMonoLicenseError('LockfileError', 'LOCKFILE_ERROR', message, 3, details),
    name: 'LockfileError',
    code: 'LOCKFILE_ERROR',
    exitCode: 3
  };
};

/**
 * Creates a network error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns NetworkError object
 */
const createNetworkError = (message: string, details?: string): NetworkError => {
  return {
    ...createMonoLicenseError('NetworkError', 'NETWORK_ERROR', message, 4, details),
    name: 'NetworkError',
    code: 'NETWORK_ERROR',
    exitCode: 4
  };
};

/**
 * Creates a file system error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns FileSystemError object
 */
const createFileSystemError = (message: string, details?: string): FileSystemError => {
  return {
    ...createMonoLicenseError('FileSystemError', 'FS_ERROR', message, 5, details),
    name: 'FileSystemError',
    code: 'FS_ERROR',
    exitCode: 5
  };
};

/**
 * Creates an invalid workspace config error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns InvalidWorkspaceConfigError object
 */
const createInvalidWorkspaceConfigError = (message: string, details?: string): InvalidWorkspaceConfigError => {
  return {
    ...createConfigError(message, details),
    name: 'InvalidWorkspaceConfigError'
  };
};

/**
 * Creates an unsupported lockfile version error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns UnsupportedLockfileVersionError object
 */
const createUnsupportedLockfileVersionError = (message: string, details?: string): UnsupportedLockfileVersionError => {
  return {
    ...createLockfileError(message, details),
    name: 'UnsupportedLockfileVersionError'
  };
};

/**
 * Creates a package not found error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns PackageNotFoundError object
 */
const createPackageNotFoundError = (message: string, details?: string): PackageNotFoundError => {
  return {
    ...createNetworkError(message, details),
    name: 'PackageNotFoundError'
  };
};

/**
 * Creates a project not found error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns ProjectNotFoundError object
 */
const createProjectNotFoundError = (message: string, details?: string): ProjectNotFoundError => {
  return {
    ...createLockfileError(message, details),
    name: 'ProjectNotFoundError'
  };
};

/**
 * Creates a license data API error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns LicenseDataAPIError object
 */
const createLicenseDataAPIError = (message: string, details?: string): LicenseDataAPIError => {
  return {
    ...createNetworkError(message, details),
    name: 'LicenseDataAPIError'
  };
};

/**
 * Creates an invalid lockfile error
 *
 * @param message - Error message
 * @param details - Optional technical details
 * @returns InvalidLockfileError object
 */
const createInvalidLockfileError = (message: string, details?: string): InvalidLockfileError => {
  return {
    ...createLockfileError(message, details),
    name: 'InvalidLockfileError'
  };
};
```

---

## 9. Utility Types

### 9.1 Common Utility Types

```typescript
/**
 * Make all properties optional recursively
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of T that have values of type V
 */
type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Make specific keys required
 */
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific keys optional
 */
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * String literal union for SPDX identifiers
 */
type SpdxIdentifier = string; // Could be union of all valid SPDX IDs

/**
 * ISO 8601 date string
 */
type ISO8601Date = string;

/**
 * Package identifier (name@version)
 */
type PackageIdentifier = `${string}@${string}`;

/**
 * Glob pattern
 */
type GlobPattern = string;
```

### 9.2 Type Guards

```typescript
/**
 * Type guard for checking if error is MonoLicenseError
 */
const isMonoLicenseError = (error: unknown): error is MonoLicenseError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    'code' in error &&
    'message' in error &&
    'exitCode' in error
  );
};

/**
 * Type guard for checking if license info is multi-license
 */
const isMultiLicense = (license: LicenseInfo): license is LicenseInfo & { licenses: LicenseInfo[] } => {
  return license.type === 'multiple' && Array.isArray(license.licenses);
};

/**
 * Type guard for checking if value is valid PolicyStatus
 */
const isPolicyStatus = (value: string): value is PolicyStatus => {
  return ['allowed', 'review', 'forbidden', 'approved', 'unknown'].includes(value);
};

/**
 * Type guard for checking if value is valid PackageManager
 */
const isPackageManager = (value: string): value is PackageManager => {
  return ['pnpm', 'npm', 'yarn', 'rush'].includes(value);
};
```

### 9.3 Branded Types

```typescript
/**
 * Branded type for validated SPDX identifiers
 */
type ValidatedSpdxId = string & { readonly __brand: 'ValidatedSpdxId' };

/**
 * Creates validated SPDX ID
 *
 * @param id - SPDX identifier string to validate
 * @returns Validated SPDX ID or null if invalid
 */
const createSpdxId = (id: string): ValidatedSpdxId | null => {
  const spdx = require('spdx-correct');
  const corrected = spdx(id);
  return corrected ? (corrected as ValidatedSpdxId) : null;
};

/**
 * Branded type for absolute paths
 */
type AbsolutePath = string & { readonly __brand: 'AbsolutePath' };

/**
 * Creates absolute path (validates that path is absolute)
 *
 * @param path - Path string to validate
 * @returns Absolute path
 * @throws Error if path is not absolute
 */
const createAbsolutePath = (path: string): AbsolutePath => {
  if (!require('path').isAbsolute(path)) {
    throw new Error(`Path must be absolute: ${path}`);
  }
  return path as AbsolutePath;
};
```

---

## Summary

This data models specification defines:

1. **Core Domain Models**: Project, Dependency, License, Monorepo, Graph
2. **Configuration Models**: Config, Approvals, Baseline with complete schemas
3. **Scan Result Models**: Results, Reports, Violations, Evaluations
4. **License Recommendation Models**: Tiers, Metadata, Policy Recommendations
5. **Lockfile Models**: Parser interfaces for pnpm, npm, yarn
6. **Policy Models**: Evaluation context and auto-approve logic
7. **Report Models**: Diff reports with change tracking
8. **Error Models**: Hierarchical error types with exit codes
9. **Utility Types**: Type guards, branded types, helper types

All interfaces are implementation-ready with JSDoc comments and strict TypeScript typing.
