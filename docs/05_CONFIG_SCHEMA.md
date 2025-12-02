# MonoLicense - Configuration Schema

**Last Updated**: 2025-11-26
**Status**: Planning Phase - Pre-Code
**Version**: 0.0.0 (Not yet implemented)

---

## Table of Contents

1. [Overview](#overview)
2. [File Formats](#file-formats)
3. [Main Configuration Schema](#main-configuration-schema)
4. [Approvals File Schema](#approvals-file-schema)
5. [Last Scan File Schema](#last-scan-file-schema)
6. [License Data File Schema](#license-data-file-schema)
7. [Configuration Examples](#configuration-examples)
8. [Validation Rules](#validation-rules)
9. [Environment Variables](#environment-variables)
10. [CLI Flag Overrides](#cli-flag-overrides)

---

## Overview

MonoLicense uses four primary configuration/data files:

| File | Purpose | Format | Location | Required | Git |
|------|---------|--------|----------|----------|-----|
| `monolicense.config.json` | Main config (projects, policy) | JSON/YAML | Repo root | Yes | ✓ Commit |
| `monolicense.approvals.json` | License approvals | JSON | Repo root | No | ✓ Commit |
| `.monolicense/last-scan.json` | Previous scan result (for diff) | JSON | `.monolicense/` | No (auto-generated) | ✓ Commit |
| `.monolicense/license-data.json` | License recommendation data | JSON | `.monolicense/` | No (auto-downloaded) | ✗ Ignore |

---

## File Formats

### Supported Formats

MonoLicense supports both **JSON** and **YAML** for the main configuration file.

**JSON** (preferred):
- `monolicense.config.json`

**YAML** (alternative):
- `monolicense.config.yaml`
- `monolicense.config.yml`

**File resolution order**:
1. `monolicense.config.json`
2. `monolicense.config.yaml`
3. `monolicense.config.yml`
4. `.monolicense.json` (hidden file variant)
5. If none found → error (no implicit defaults for config file)

---

## Main Configuration Schema

### Full JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Config schema version",
      "enum": ["1.0"]
    },
    "projects": {
      "type": "array",
      "description": "List of projects/workspaces to scan (optional if auto-detecting)",
      "items": {
        "type": "object",
        "required": ["name", "path"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Project name (used in reports)"
          },
          "path": {
            "type": "string",
            "description": "Relative path from repo root"
          },
          "include": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Glob patterns to include (optional)"
          },
          "exclude": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Glob patterns to exclude (optional)"
          }
        }
      }
    },
    "policy": {
      "type": "object",
      "description": "License policy rules",
      "required": ["allowed"],
      "properties": {
        "allowed": {
          "type": "array",
          "items": { "type": "string" },
          "description": "SPDX license identifiers that are allowed"
        },
        "review": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Licenses that require manual review/approval"
        },
        "forbidden": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Licenses that are forbidden (fail immediately)"
        }
      }
    },
    "autoApprove": {
      "type": "object",
      "description": "Patterns for automatic approval",
      "properties": {
        "publishers": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Package name patterns (e.g., @mycompany/*)"
        },
        "licenses": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Licenses to auto-approve (must match publisher too)"
        },
        "comment": {
          "type": "string",
          "description": "Explanation for auto-approve rule"
        }
      }
    },
    "output": {
      "type": "object",
      "description": "Report output settings",
      "properties": {
        "formats": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["json", "markdown", "html"]
          },
          "description": "Report formats to generate",
          "default": ["json", "markdown"]
        },
        "directory": {
          "type": "string",
          "description": "Directory for report files",
          "default": "reports"
        },
        "summary": {
          "type": "boolean",
          "description": "Generate summary report (deduplicated)",
          "default": true
        },
        "perProject": {
          "type": "boolean",
          "description": "Generate per-project reports",
          "default": true
        }
      }
    },
    "approvals": {
      "type": "object",
      "description": "Approvals file configuration",
      "properties": {
        "file": {
          "type": "string",
          "description": "Path to approvals file",
          "default": "monolicense.approvals.json"
        }
      }
    },
    "scan": {
      "type": "object",
      "description": "Scan behavior settings",
      "properties": {
        "includeDev": {
          "type": "boolean",
          "description": "Include devDependencies in scan",
          "default": true
        },
        "includePeer": {
          "type": "boolean",
          "description": "Include peerDependencies in scan",
          "default": false
        },
        "includeOptional": {
          "type": "boolean",
          "description": "Include optionalDependencies in scan",
          "default": true
        },
        "excludeInternal": {
          "type": "boolean",
          "description": "Exclude workspace internal packages",
          "default": true
        }
      }
    },
    "monorepo": {
      "type": "object",
      "description": "Monorepo detection overrides",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["auto", "pnpm", "npm", "yarn", "rush", "nx", "single"],
          "description": "Force monorepo type (or auto-detect)",
          "default": "auto"
        },
        "lockfile": {
          "type": "string",
          "description": "Override lockfile path"
        }
      }
    },
    "updates": {
      "type": "object",
      "description": "License data update settings",
      "properties": {
        "checkLicenseData": {
          "type": "boolean",
          "description": "Check for license data updates during scan",
          "default": true
        },
        "autoUpdate": {
          "type": "boolean",
          "description": "Automatically download updates (not recommended)",
          "default": false
        },
        "checkFrequency": {
          "type": "string",
          "enum": ["never", "daily", "weekly", "always"],
          "description": "How often to check for updates",
          "default": "daily"
        }
      }
    },
    "behavior": {
      "type": "object",
      "description": "CLI behavior settings",
      "properties": {
        "failOnForbidden": {
          "type": "boolean",
          "description": "Exit code 1 if forbidden licenses found",
          "default": true
        },
        "failOnReview": {
          "type": "boolean",
          "description": "Exit code 5 if unapproved review licenses found",
          "default": true
        },
        "failOnUnknown": {
          "type": "boolean",
          "description": "Fail on unknown/missing licenses",
          "default": false
        },
        "strict": {
          "type": "boolean",
          "description": "Fail on any violation (forbidden, review, unknown)",
          "default": false
        }
      }
    }
  }
}
```

### TypeScript Interface

```typescript
interface MonoLicenseConfig {
  version: '1.0';
  projects?: ProjectConfig[];
  policy: PolicyConfig;
  autoApprove?: AutoApproveConfig;
  output?: OutputConfig;
  approvals?: ApprovalsConfig;
  scan?: ScanConfig;
  monorepo?: MonorepoConfig;
  updates?: UpdatesConfig;
  behavior?: BehaviorConfig;
}

interface ProjectConfig {
  name: string;
  path: string;
  include?: string[]; // Glob patterns
  exclude?: string[]; // Glob patterns
}

interface PolicyConfig {
  allowed: string[]; // SPDX identifiers
  review?: string[];
  forbidden?: string[];
}

interface AutoApproveConfig {
  publishers?: string[]; // e.g., "@mycompany/*"
  licenses?: string[];   // e.g., ["MIT", "Apache-2.0"]
  comment?: string;
}

interface OutputConfig {
  formats?: ('json' | 'markdown' | 'html')[];
  directory?: string;
  summary?: boolean;
  perProject?: boolean;
}

interface ApprovalsConfig {
  file?: string;
}

interface ScanConfig {
  includeDev?: boolean;
  includePeer?: boolean;
  includeOptional?: boolean;
  excludeInternal?: boolean;
}

interface MonorepoConfig {
  type?: 'auto' | 'pnpm' | 'npm' | 'yarn' | 'rush' | 'nx' | 'single';
  lockfile?: string;
}

interface UpdatesConfig {
  checkLicenseData?: boolean;
  autoUpdate?: boolean;
  checkFrequency?: 'never' | 'daily' | 'weekly' | 'always';
}

interface BehaviorConfig {
  failOnForbidden?: boolean;
  failOnReview?: boolean;
  failOnUnknown?: boolean;
  strict?: boolean;
}
```

---

## Approvals File Schema

### Full JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "approvals"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Approvals file schema version",
      "enum": ["1.0"]
    },
    "approvals": {
      "type": "array",
      "description": "List of approved licenses",
      "items": {
        "type": "object",
        "required": ["package", "license", "approvedBy", "approvedAt", "reason"],
        "properties": {
          "package": {
            "type": "string",
            "description": "Package name (can include wildcards like @mycompany/*)"
          },
          "version": {
            "type": "string",
            "description": "Exact version (e.g., 1.2.3). Mutually exclusive with versionRange."
          },
          "versionRange": {
            "type": "string",
            "description": "Semver range (e.g., ^1.2.0). Mutually exclusive with version."
          },
          "license": {
            "type": "string",
            "description": "SPDX license identifier"
          },
          "approvedBy": {
            "type": "string",
            "description": "Username or GitHub handle of approver"
          },
          "approvedAt": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 timestamp"
          },
          "reason": {
            "type": "string",
            "description": "Explanation for approval"
          },
          "scope": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Project names this approval applies to (null = all projects)"
          },
          "expiresAt": {
            "type": "string",
            "format": "date-time",
            "description": "Optional expiration timestamp (ISO 8601)"
          }
        }
      }
    }
  }
}
```

### TypeScript Interface

```typescript
interface ApprovalsFile {
  version: '1.0';
  approvals: Approval[];
}

interface Approval {
  package: string;
  version?: string;       // Exact version (mutually exclusive with versionRange)
  versionRange?: string;  // Semver range (mutually exclusive with version)
  license: string;
  approvedBy: string;
  approvedAt: string;     // ISO 8601
  reason: string;
  scope?: string[] | null; // null = all projects
  expiresAt?: string | null; // ISO 8601
}
```

### Approval Matching Logic

**Exact version match**:
```json
{
  "package": "some-package",
  "version": "1.2.3"
}
```
→ Only approves `some-package@1.2.3`

**Version range match**:
```json
{
  "package": "some-package",
  "versionRange": "^1.2.0"
}
```
→ Approves `some-package@1.2.x`

**Wildcard match** (internal packages):
```json
{
  "package": "@mycompany/*",
  "license": "ISC"
}
```
→ Approves all `@mycompany/*` packages with ISC license

**Project-scoped approval**:
```json
{
  "package": "some-package",
  "version": "1.2.3",
  "scope": ["web-app", "mobile-app"]
}
```
→ Only approved for `web-app` and `mobile-app`, not for other projects

**Expiring approval**:
```json
{
  "package": "some-package",
  "version": "1.2.3",
  "expiresAt": "2026-11-26T00:00:00Z"
}
```
→ Approval expires after date, requires re-review

---

## Last Scan File Schema

### Purpose

Stores the result of the previous scan for diff calculations.

**Location**: `.monolicense/last-scan.json`

**Git**: Should be **committed** to repo for team visibility

### Full JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["monolicense", "scannedAt", "summary", "dependencies"],
  "properties": {
    "monolicense": {
      "type": "string",
      "description": "MonoLicense CLI version"
    },
    "scannedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    },
    "commit": {
      "type": "string",
      "description": "Git commit SHA (if available)"
    },
    "branch": {
      "type": "string",
      "description": "Git branch name (if available)"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalProjects": { "type": "number" },
        "totalDependencies": { "type": "number" },
        "uniqueDependencies": { "type": "number" },
        "allowed": { "type": "number" },
        "autoApproved": { "type": "number" },
        "approved": { "type": "number" },
        "review": { "type": "number" },
        "forbidden": { "type": "number" },
        "unknown": { "type": "number" }
      }
    },
    "dependencies": {
      "type": "array",
      "description": "Flattened list of all unique dependencies",
      "items": {
        "type": "object",
        "required": ["name", "version", "license"],
        "properties": {
          "name": { "type": "string" },
          "version": { "type": "string" },
          "license": { "type": "string" },
          "licenseSource": { "type": "string" },
          "status": {
            "type": "string",
            "enum": ["allowed", "auto-approved", "approved", "review", "forbidden", "unknown"]
          },
          "usedBy": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Project names"
          }
        }
      }
    }
  }
}
```

### TypeScript Interface

```typescript
interface LastScanFile {
  monolicense: string; // CLI version
  scannedAt: string;   // ISO 8601
  commit?: string;
  branch?: string;
  summary: ScanSummary;
  dependencies: DependencySnapshot[];
}

interface ScanSummary {
  totalProjects: number;
  totalDependencies: number;
  uniqueDependencies: number;
  allowed: number;
  autoApproved: number;
  approved: number;
  review: number;
  forbidden: number;
  unknown: number;
}

interface DependencySnapshot {
  name: string;
  version: string;
  license: string;
  licenseSource?: string;
  status: 'allowed' | 'auto-approved' | 'approved' | 'review' | 'forbidden' | 'unknown';
  usedBy: string[]; // Project names
}
```

---

## License Data File Schema

### Purpose

Contains license recommendation data with tier classifications and metadata.

**Location**: `.monolicense/license-data.json`

**Git**: Should be **ignored** (downloaded/updated separately)

**Source**: Downloaded from `https://api.monolicense.com/license-data/latest` on first `init` or via `monolicense update-license-data`

### Full JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "dataVersion", "lastUpdated", "tiers", "metadata"],
  "properties": {
    "version": {
      "type": "string",
      "description": "License data schema version",
      "enum": ["1.0"]
    },
    "dataVersion": {
      "type": "string",
      "description": "Data content version (e.g., 1.2.0)",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "lastUpdated": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    },
    "tiers": {
      "type": "object",
      "description": "License tiers with recommendations",
      "properties": {
        "universally-accepted": {
          "$ref": "#/definitions/licenseTier"
        },
        "generally-accepted": {
          "$ref": "#/definitions/licenseTier"
        },
        "situational": {
          "$ref": "#/definitions/licenseTier"
        },
        "restrictive": {
          "$ref": "#/definitions/licenseTier"
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Detailed metadata for each license",
      "additionalProperties": {
        "$ref": "#/definitions/licenseMetadata"
      }
    }
  },
  "definitions": {
    "licenseTier": {
      "type": "object",
      "required": ["action", "confidence", "reason", "licenses"],
      "properties": {
        "action": {
          "type": "string",
          "enum": ["allow", "review", "forbid"]
        },
        "confidence": {
          "type": "string",
          "enum": ["high", "medium", "low"]
        },
        "reason": {
          "type": "string",
          "description": "Why this tier has this action"
        },
        "licenses": {
          "type": "array",
          "items": { "type": "string" },
          "description": "SPDX identifiers in this tier"
        }
      }
    },
    "licenseMetadata": {
      "type": "object",
      "required": ["fullName", "spdxId", "osiApproved"],
      "properties": {
        "fullName": {
          "type": "string",
          "description": "Full license name"
        },
        "spdxId": {
          "type": "string",
          "description": "SPDX identifier"
        },
        "osiApproved": {
          "type": "boolean",
          "description": "OSI approved status"
        },
        "url": {
          "type": "string",
          "format": "uri",
          "description": "Link to license documentation"
        },
        "permissions": {
          "type": "array",
          "items": { "type": "string" },
          "description": "What you can do"
        },
        "conditions": {
          "type": "array",
          "items": { "type": "string" },
          "description": "What you must do"
        },
        "limitations": {
          "type": "array",
          "items": { "type": "string" },
          "description": "What you cannot do"
        },
        "summary": {
          "type": "string",
          "description": "Brief summary of the license"
        }
      }
    }
  }
}
```

### TypeScript Interface

```typescript
interface LicenseDataFile {
  version: '1.0';
  dataVersion: string; // e.g., "1.2.0"
  lastUpdated: string; // ISO 8601
  tiers: {
    'universally-accepted': LicenseTier;
    'generally-accepted': LicenseTier;
    'situational': LicenseTier;
    'restrictive': LicenseTier;
  };
  metadata: Record<string, LicenseMetadata>;
}

interface LicenseTier {
  action: 'allow' | 'review' | 'forbid';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  licenses: string[]; // SPDX identifiers
}

interface LicenseMetadata {
  fullName: string;
  spdxId: string;
  osiApproved: boolean;
  url?: string;
  permissions?: string[];
  conditions?: string[];
  limitations?: string[];
  summary?: string;
}
```

---

## Configuration Examples

### Example 1: Minimal Config (Generated by init)

**File**: `monolicense.config.json`

```json
{
  "version": "1.0",
  "policy": {
    "allowed": ["MIT", "Apache-2.0", "BSD-3-Clause"]
  }
}
```

**Behavior**:
- Auto-detects monorepo structure
- Scans all workspaces
- Only allows MIT, Apache-2.0, BSD-3-Clause
- Any other license requires manual review or is forbidden

---

### Example 2: Basic Monorepo Config

**File**: `monolicense.config.json`

```json
{
  "version": "1.0",
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
    "forbidden": ["GPL-3.0", "AGPL-3.0", "SSPL-1.0"]
  },
  "output": {
    "formats": ["json", "markdown"],
    "directory": "reports",
    "summary": true
  }
}
```

---

### Example 3: Advanced Config with Auto-Approve and Updates

**File**: `monolicense.config.json`

```json
{
  "version": "1.0",
  "projects": [
    {
      "name": "web-app",
      "path": "apps/web",
      "exclude": ["**/test/**"]
    },
    {
      "name": "mobile-api",
      "path": "apps/api"
    },
    {
      "name": "admin-dashboard",
      "path": "apps/admin"
    }
  ],
  "policy": {
    "allowed": ["MIT", "Apache-2.0", "BSD-3-Clause", "ISC"],
    "review": ["BSD-2-Clause", "0BSD"],
    "forbidden": ["GPL-3.0", "AGPL-3.0", "SSPL-1.0", "BUSL-1.1"]
  },
  "autoApprove": {
    "publishers": ["@mycompany/*", "@internal/*"],
    "licenses": ["MIT", "Apache-2.0", "ISC"],
    "comment": "Internal packages with permissive licenses are auto-approved"
  },
  "output": {
    "formats": ["json", "markdown", "html"],
    "directory": "reports",
    "summary": true,
    "perProject": true
  },
  "approvals": {
    "file": "monolicense.approvals.json"
  },
  "scan": {
    "includeDev": true,
    "includePeer": false,
    "includeOptional": true,
    "excludeInternal": true
  },
  "updates": {
    "checkLicenseData": true,
    "autoUpdate": false,
    "checkFrequency": "daily"
  },
  "behavior": {
    "failOnForbidden": true,
    "failOnReview": true,
    "failOnUnknown": false,
    "strict": false
  }
}
```

---

### Example 4: YAML Format

**File**: `monolicense.config.yaml`

```yaml
version: '1.0'

projects:
  - name: web-app
    path: apps/web
  - name: mobile-api
    path: apps/api

policy:
  allowed:
    - MIT
    - Apache-2.0
    - BSD-3-Clause
  review:
    - ISC
    - BSD-2-Clause
  forbidden:
    - GPL-3.0
    - AGPL-3.0

autoApprove:
  publishers:
    - '@mycompany/*'
  licenses:
    - MIT
    - Apache-2.0
  comment: Internal packages auto-approved

output:
  formats:
    - json
    - markdown
  directory: reports
  summary: true

updates:
  checkLicenseData: true
  checkFrequency: daily
```

---

### Example 5: Approvals File

**File**: `monolicense.approvals.json`

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
      "reason": "Reviewed with legal team. ISC is acceptable for internal tools.",
      "scope": null,
      "expiresAt": null
    },
    {
      "package": "another-package",
      "versionRange": "^2.0.0",
      "license": "BSD-2-Clause",
      "approvedBy": "jsmith",
      "approvedAt": "2025-11-20T14:15:00Z",
      "reason": "BSD-2-Clause approved for use in web-app only",
      "scope": ["web-app"],
      "expiresAt": "2026-11-20T14:15:00Z"
    },
    {
      "package": "@legacy/*",
      "license": "0BSD",
      "approvedBy": "lukebeach",
      "approvedAt": "2025-11-15T09:00:00Z",
      "reason": "All @legacy packages are being phased out, temporary approval",
      "scope": null,
      "expiresAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Example 6: Last Scan File

**File**: `.monolicense/last-scan.json`

```json
{
  "monolicense": "1.0.0",
  "scannedAt": "2025-11-26T10:30:00Z",
  "commit": "abc123def456",
  "branch": "main",
  "summary": {
    "totalProjects": 3,
    "totalDependencies": 412,
    "uniqueDependencies": 180,
    "allowed": 170,
    "autoApproved": 5,
    "approved": 3,
    "review": 2,
    "forbidden": 0,
    "unknown": 0
  },
  "dependencies": [
    {
      "name": "react",
      "version": "18.2.0",
      "license": "MIT",
      "licenseSource": "package.json",
      "status": "allowed",
      "usedBy": ["web-app", "mobile-api", "admin-dashboard"]
    },
    {
      "name": "lodash",
      "version": "4.17.21",
      "license": "MIT",
      "licenseSource": "package.json",
      "status": "allowed",
      "usedBy": ["web-app"]
    },
    {
      "name": "@mycompany/utils",
      "version": "1.0.0",
      "license": "MIT",
      "licenseSource": "package.json",
      "status": "auto-approved",
      "usedBy": ["web-app", "mobile-api"]
    },
    {
      "name": "some-package",
      "version": "1.2.3",
      "license": "ISC",
      "licenseSource": "package.json",
      "status": "approved",
      "usedBy": ["web-app"]
    }
  ]
}
```

---

### Example 7: License Data File (Partial)

**File**: `.monolicense/license-data.json`

```json
{
  "version": "1.0",
  "dataVersion": "1.2.0",
  "lastUpdated": "2025-11-20T00:00:00Z",
  "tiers": {
    "universally-accepted": {
      "action": "allow",
      "confidence": "high",
      "reason": "OSI-approved permissive license with broad consensus",
      "licenses": ["MIT", "Apache-2.0", "BSD-3-Clause", "BSD-2-Clause", "ISC", "0BSD"]
    },
    "generally-accepted": {
      "action": "allow",
      "confidence": "medium",
      "reason": "Permissive but less common",
      "licenses": ["Unlicense", "CC0-1.0", "Zlib", "Python-2.0"]
    },
    "situational": {
      "action": "review",
      "confidence": "medium",
      "reason": "Weak copyleft - may be acceptable depending on use case",
      "licenses": ["LGPL-2.1", "LGPL-3.0", "MPL-2.0", "EPL-1.0", "EPL-2.0"]
    },
    "restrictive": {
      "action": "forbid",
      "confidence": "high",
      "reason": "Strong copyleft - typically incompatible with commercial use",
      "licenses": ["GPL-2.0", "GPL-3.0", "AGPL-3.0", "SSPL-1.0", "BUSL-1.1"]
    }
  },
  "metadata": {
    "MIT": {
      "fullName": "MIT License",
      "spdxId": "MIT",
      "osiApproved": true,
      "url": "https://opensource.org/licenses/MIT",
      "permissions": ["commercial-use", "modification", "distribution", "private-use"],
      "conditions": ["include-copyright"],
      "limitations": ["liability", "warranty"],
      "summary": "A short and simple permissive license with conditions only requiring preservation of copyright and license notices."
    },
    "Apache-2.0": {
      "fullName": "Apache License 2.0",
      "spdxId": "Apache-2.0",
      "osiApproved": true,
      "url": "https://opensource.org/licenses/Apache-2.0",
      "permissions": ["commercial-use", "modification", "distribution", "patent-use", "private-use"],
      "conditions": ["include-copyright", "document-changes", "include-notice"],
      "limitations": ["liability", "trademark-use", "warranty"],
      "summary": "A permissive license that also provides an express grant of patent rights from contributors."
    }
  }
}
```

---

## Validation Rules

### Main Config Validation

**Required fields**:
- `version` - Must be "1.0"
- `policy.allowed` - Must be non-empty array

**Optional but recommended**:
- `policy.forbidden` - Explicitly list forbidden licenses
- `projects` - If omitted, auto-detects workspaces

**Validation logic**:
```typescript
function validateConfig(config: any): ValidationResult {
  const errors: string[] = [];

  // Version check
  if (config.version !== '1.0') {
    errors.push('Invalid version. Expected "1.0"');
  }

  // Policy check
  if (!config.policy || !Array.isArray(config.policy.allowed)) {
    errors.push('policy.allowed is required and must be an array');
  }

  // No overlap between allowed, review, forbidden
  const allowed = new Set(config.policy.allowed || []);
  const review = new Set(config.policy.review || []);
  const forbidden = new Set(config.policy.forbidden || []);

  const overlap = [...allowed].filter(l => review.has(l) || forbidden.has(l));
  if (overlap.length > 0) {
    errors.push(`Licenses appear in multiple categories: ${overlap.join(', ')}`);
  }

  // Projects validation
  if (config.projects) {
    for (const project of config.projects) {
      if (!project.name || !project.path) {
        errors.push('Each project must have name and path');
      }
    }
  }

  // Auto-approve validation
  if (config.autoApprove) {
    if (config.autoApprove.publishers && !config.autoApprove.licenses) {
      errors.push('autoApprove.licenses required when autoApprove.publishers is set');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Approvals File Validation

**Required fields per approval**:
- `package` - Package name (can be wildcard)
- `license` - SPDX identifier
- `approvedBy` - Username
- `approvedAt` - ISO 8601 timestamp
- `reason` - Non-empty string

**Mutually exclusive**:
- Cannot have both `version` and `versionRange`

**Validation logic**:
```typescript
function validateApproval(approval: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!approval.package) errors.push('package is required');
  if (!approval.license) errors.push('license is required');
  if (!approval.approvedBy) errors.push('approvedBy is required');
  if (!approval.approvedAt) errors.push('approvedAt is required');
  if (!approval.reason) errors.push('reason is required');

  // Mutually exclusive version fields
  if (approval.version && approval.versionRange) {
    errors.push('Cannot specify both version and versionRange');
  }

  // Validate ISO 8601 timestamp
  if (approval.approvedAt && !isValidISO8601(approval.approvedAt)) {
    errors.push('approvedAt must be ISO 8601 format');
  }

  // Validate expiration is in future
  if (approval.expiresAt) {
    const expiry = new Date(approval.expiresAt);
    if (expiry < new Date()) {
      errors.push('Approval has expired');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Environment Variables

MonoLicense supports environment variable overrides:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONOLICENSE_CONFIG` | Path to config file | `./custom-config.json` |
| `MONOLICENSE_APPROVALS` | Path to approvals file | `./approvals.json` |
| `MONOLICENSE_OUTPUT_DIR` | Report output directory | `./compliance-reports` |
| `MONOLICENSE_FAIL_ON_FORBIDDEN` | Override behavior | `true` |
| `MONOLICENSE_FAIL_ON_REVIEW` | Override behavior | `false` |
| `MONOLICENSE_STRICT` | Strict mode | `true` |
| `MONOLICENSE_LICENSE_DATA_URL` | Custom license data API | `https://custom.com/api` |

**Usage**:
```bash
MONOLICENSE_STRICT=true monolicense scan
```

**Priority**:
1. CLI flags (highest)
2. Environment variables
3. Config file
4. Defaults (lowest)

---

## CLI Flag Overrides

CLI flags override both config and environment variables:

```bash
monolicense scan \
  --config ./custom.json \
  --approvals ./custom-approvals.json \
  --output-dir ./reports \
  --fail-on-forbidden \
  --no-fail-on-review \
  --strict
```

**Common flags**:

| Flag | Type | Description |
|------|------|-------------|
| `--config <path>` | string | Path to config file |
| `--approvals <path>` | string | Path to approvals file |
| `--output-dir <path>` | string | Report output directory |
| `--format <format>` | string | Output format (json, markdown, html) |
| `--fail-on-forbidden` | boolean | Fail if forbidden licenses found |
| `--no-fail-on-review` | boolean | Don't fail on unapproved review licenses |
| `--fail-on-unknown` | boolean | Fail on unknown licenses |
| `--strict` | boolean | Fail on any violation |
| `--no-dev` | boolean | Exclude devDependencies |
| `--include-peer` | boolean | Include peerDependencies |
| `--yes`, `-y` | boolean | Accept all defaults (non-interactive) |
| `--non-interactive` | boolean | Disable all prompts |
| `--json` | boolean | JSON output only |
| `--quiet`, `-q` | boolean | Minimal output |
| `--verbose`, `-v` | boolean | Detailed output |

**Init-specific flags**:

| Flag | Type | Description |
|------|------|-------------|
| `--threshold <number>` | number | Policy recommendation threshold (80-95) |
| `--allow-all` | boolean | Add all current licenses to allowed |
| `--approve-all` | boolean | Pre-approve all current dependencies |
| `--no-ci` | boolean | Skip CI setup prompt |

**Example**:
```bash
# Scan without failing on review licenses
monolicense scan --no-fail-on-review

# Generate only JSON reports
monolicense scan --format json

# Strict mode (fail on everything)
monolicense scan --strict

# Init with custom threshold
monolicense init --threshold 85

# Init non-interactively, approve all existing
monolicense init --yes --approve-all
```

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-26 | 1.0 | Initial config schema documentation with all file formats |

---

**Previous Document**: [ARCHITECTURE.md](./ARCHITECTURE.md)
**Next Document**: [CODING_STANDARDS.md](./CODING_STANDARDS.md) (to be created)
**See Also**:
- [TODO.md](../TODO.md) for full documentation roadmap
- [DATA_MODELS.md](./DATA_MODELS.md) (to be created) for TypeScript type definitions
