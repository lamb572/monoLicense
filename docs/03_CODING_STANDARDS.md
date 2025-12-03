# MonoLicense - Coding Standards

**Last Updated**: 2025-11-27
**Status**: Planning Phase - Pre-Code
**Version**: 0.0.0 (Not yet implemented)

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Monorepo Structure](#monorepo-structure)
4. [TypeScript Configuration](#typescript-configuration)
5. [Functional Programming Standards](#functional-programming-standards)
6. [File and Folder Structure](#file-and-folder-structure)
7. [Naming Conventions](#naming-conventions)
8. [Code Formatting](#code-formatting)
9. [Import/Export Patterns](#importexport-patterns)
10. [Error Handling](#error-handling)
11. [Type Definitions](#type-definitions)
12. [Comments and Documentation](#comments-and-documentation)
13. [Testing Standards](#testing-standards)
14. [API Development Standards](#api-development-standards)
15. [UI Component Development (Atomic Design)](#ui-component-development-atomic-design)
16. [Shared Configuration](#shared-configuration)
17. [Anti-Patterns and No-Nos](#anti-patterns-and-no-nos)
18. [Git Conventions](#git-conventions)

---

## Overview

MonoLicense follows strict coding standards to ensure:
- **Functional Purity**: Predictable, testable, side-effect-free functions
- **Type Safety**: Catch errors at compile time with strict TypeScript
- **Consistency**: All code looks like it was written by one person
- **Performance**: Efficient patterns with incremental builds
- **Maintainability**: Self-documenting code with minimal comments
- **Testability**: Target 80% test coverage with emphasis on TDD and practical testing

**Enforcement**:
- TypeScript compiler (`tsc --strict`) with composite projects
- ESLint with strict functional programming rules
- Prettier for formatting
- Pre-commit hooks (Husky)
- CI checks (all must pass)

---

## Core Principles

### 1. Functional Programming First

**Classes are FORBIDDEN except**:
- Required by third-party library configuration
- Required for legacy tool compatibility
- Explicitly approved in code review with justification

**Use functions and composition instead**:
```typescript
// ✅ Good: Pure functions
const extractLicense = (packagePath: string): LicenseInfo => {
  const packageJson = readPackageJson(packagePath);
  return normalizeLicense(packageJson.license);
};

// ❌ Bad: Class-based
class LicenseExtractor {
  extract(packagePath: string): LicenseInfo {
    return this.normalize(this.readPackage(packagePath).license);
  }
}
```

### 2. No `this` Keyword

**NEVER use `this`** - it couples code and makes testing harder.

```typescript
// ✅ Good: Explicit parameters
const calculateTotal = (items: Item[], taxRate: number): number => {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
};

// ❌ Bad: Using this
class Calculator {
  private taxRate: number;
  calculateTotal(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.price, 0) * (1 + this.taxRate);
  }
}
```

### 3. Declarative Function Names

Function names should be so clear that comments are rarely needed.

```typescript
// ✅ Good: Self-documenting
const extractLicenseFromPackageJson = (packageJson: PackageJson): string => {
  return packageJson.license;
};

const hasViolations = (scanResult: ScanResult): boolean => {
  return scanResult.violations.length > 0;
};

// ❌ Bad: Requires comments
const extract = (pkg: PackageJson): string => { // Extract what?
  return pkg.license;
};
```

### 4. Interfaces Over Types

**Always use `interface` instead of `type`** for object shapes (performance optimization).

```typescript
// ✅ Good: Interface (faster for type checking)
interface Config {
  version: string;
  policy: Policy;
}

interface Policy {
  allowed: string[];
  forbidden: string[];
}

// ❌ Bad: Type alias for objects
type Config = {
  version: string;
  policy: Policy;
};
```

**Use `type` only for**:
- Union types: `type Status = 'allowed' | 'forbidden'`
- Intersection types: `type Combined = A & B`
- Utility types: `type Partial<T> = ...`

### 5. Latest LTS Versions

All packages must use the most recent LTS (Long Term Support) versions:
- Node.js: 22.x LTS (development), with CI testing on 20.x, 22.x, and 24.x
- TypeScript: 5.3+
- All dependencies: Latest stable/LTS

---

## Monorepo Structure

MonoLicense itself is built as a monorepo with apps and libraries:

```
monolicense/
├── apps/                    # Deployable applications
│   ├── cli/                 # CLI tool (monolicense command)
│   │   ├── src/
│   │   │   ├── commands/   # CLI commands
│   │   │   └── utils/      # CLI-specific utilities
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web-dashboard/       # Web dashboard (v2.0+)
│   │   ├── src/
│   │   │   ├── components/ # UI components (Atomic Design)
│   │   │   ├── pages/      # Application pages
│   │   │   └── lib/        # UI-specific utilities
│   │   ├── tests/
│   │   │   ├── unit/       # Component tests
│   │   │   └── e2e/        # Playwright E2E tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                 # REST API (v2.0+)
│   │   ├── src/
│   │   │   ├── features/   # Feature-based routes (no coupling)
│   │   │   │   ├── scan/
│   │   │   │   ├── approvals/
│   │   │   │   ├── licenses/
│   │   │   │   └── reports/
│   │   │   └── lib/        # Shared API infrastructure
│   │   │       ├── db.ts   # Database connection
│   │   │       ├── auth.ts # Authentication
│   │   │       └── logger.ts
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── bot/                 # GitHub Bot (v1.5+)
│       ├── src/
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── libs/                    # Reusable libraries (feature-based)
│   ├── dependency/          # Dependency detection and resolution
│   │   ├── src/
│   │   │   ├── detect-monorepo.ts
│   │   │   ├── parse-lockfile.ts
│   │   │   └── resolve-dependencies.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── license/             # License extraction and normalization
│   │   ├── src/
│   │   │   ├── extract-license.ts
│   │   │   ├── normalize-license.ts
│   │   │   └── spdx-utils.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── policy/              # Policy evaluation
│   │   ├── src/
│   │   │   ├── evaluate-policy.ts
│   │   │   └── auto-approve.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── approval/            # Approval management
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── reporter/            # Report generation
│   │   ├── src/
│   │   │   ├── format-markdown.ts
│   │   │   ├── format-json.ts
│   │   │   └── format-html.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── parsers/             # Lockfile parsers
│   │   ├── src/
│   │   │   ├── pnpm.ts
│   │   │   ├── npm.ts
│   │   │   └── yarn.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                  # Shared UI components
│   │   ├── src/
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   └── organisms/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── testing/             # Shared test utilities
│   │   ├── src/
│   │   │   ├── fixtures/
│   │   │   ├── mocks/
│   │   │   ├── matchers/
│   │   │   └── helpers/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── utils/               # General utilities
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/              # Shared configuration
│       ├── formatters/      # Prettier config
│       ├── linters/         # ESLint config
│       ├── bundlers/        # Build tool config
│       └── compilers/       # TypeScript config
│
├── docs/                    # Documentation
├── scripts/                 # Build and deployment scripts
├── pnpm-workspace.yaml
├── package.json             # Root package.json
└── tsconfig.json            # Root TypeScript config
```

**Rationale**: Apps/libs structure provides:
- **Clear separation**: Apps are deployable, libs are reusable
- **No circular dependencies**: Feature-based libs prevent coupling
- **Optimal tree-shaking**: Apps only bundle what they import
- **Microservice-ready**: API features can be extracted easily
- **Better build performance**: TypeScript composite projects build incrementally
- **Independent development**: Each lib can be developed and tested independently

---

## TypeScript Configuration

### Root tsconfig.json

**Root composite configuration**:
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
    { "path": "./libs/policy" },
    { "path": "./libs/approval" },
    { "path": "./libs/reporter" },
    { "path": "./libs/parsers" },
    { "path": "./libs/ui" },
    { "path": "./libs/testing" },
    { "path": "./libs/utils" }
  ],
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true
  }
}
```

### App/Library tsconfig.json

**Each app/lib has its own config** (e.g., `apps/cli/tsconfig.json` or `libs/dependency/tsconfig.json`):

```json
{
  "extends": "../../libs/config/compilers/base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo",

    // Strict Mode (ALL enabled)
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,

    // Module Resolution
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    // Output
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,

    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/types": ["src/types"],
      "@/utils": ["src/utils"],
      "@shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  "references": [
    { "path": "../shared" }
  ]
}
```

### Test tsconfig.json

**Each app/lib has separate test config** (e.g., `apps/cli/tsconfig.test.json`):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist-tests",
    "tsBuildInfoFile": "./dist-tests/.tsbuildinfo",
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["tests/**/*", "src/**/*"],
  "exclude": ["node_modules"]
}
```

**Rationale**: Separate test config allows:
- Building tests independently from source
- Only rebuild changed tests
- Different compiler options for tests (e.g., allow unused params in mocks)

---

## Functional Programming Standards

### Pure Functions

**All functions should be pure** (same input = same output, no side effects):

```typescript
// ✅ Good: Pure function
const calculateTotalPrice = (items: Item[], taxRate: number): number => {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
};

// ❌ Bad: Impure (side effects)
let total = 0;
const calculateTotalPrice = (items: Item[], taxRate: number): void => {
  total = items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
};
```

### Immutability

**Never mutate data** - create new copies instead:

```typescript
// ✅ Good: Immutable operations
const addApproval = (
  approvals: Approvals,
  newApproval: Approval
): Approvals => {
  return {
    ...approvals,
    dependencies: {
      ...approvals.dependencies,
      [newApproval.package]: newApproval,
    },
  };
};

// ❌ Bad: Mutation
const addApproval = (approvals: Approvals, newApproval: Approval): void => {
  approvals.dependencies[newApproval.package] = newApproval;
};
```

### Function Composition

**Compose small functions** into larger ones:

```typescript
// ✅ Good: Composable functions
const readPackageJson = (path: string): PackageJson => {
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content);
};

const extractLicenseField = (packageJson: PackageJson): string | null => {
  return packageJson.license ?? null;
};

const normalizeSpdxId = (license: string | null): string => {
  if (!license) return 'UNKNOWN';
  const corrected = spdxCorrect(license);
  return corrected ?? 'UNKNOWN';
};

const extractLicenseFromPackage = (path: string): string => {
  const packageJson = readPackageJson(path);
  const licenseField = extractLicenseField(packageJson);
  return normalizeSpdxId(licenseField);
};

// ❌ Bad: Monolithic function
const extractLicenseFromPackage = (path: string): string => {
  const content = readFileSync(path, 'utf-8');
  const packageJson = JSON.parse(content);
  const license = packageJson.license;
  if (!license) return 'UNKNOWN';
  const corrected = spdxCorrect(license);
  return corrected ?? 'UNKNOWN';
};
```

### Higher-Order Functions

**Use map, filter, reduce** instead of loops:

```typescript
// ✅ Good: Functional approach
const extractAllLicenses = (dependencies: Dependency[]): string[] => {
  return dependencies
    .map(dep => dep.license)
    .filter(license => license !== 'UNKNOWN')
    .map(normalizeSpdxId);
};

// ❌ Bad: Imperative loops
const extractAllLicenses = (dependencies: Dependency[]): string[] => {
  const licenses: string[] = [];
  for (const dep of dependencies) {
    if (dep.license !== 'UNKNOWN') {
      licenses.push(normalizeSpdxId(dep.license));
    }
  }
  return licenses;
};
```

### Currying and Partial Application

**Use currying** for flexible function reuse:

```typescript
// ✅ Good: Curried function
const filterByLicense = (license: string) => (dependencies: Dependency[]): Dependency[] => {
  return dependencies.filter(dep => dep.license === license);
};

const filterByMIT = filterByLicense('MIT');
const filterByApache = filterByLicense('Apache-2.0');

const mitDeps = filterByMIT(allDependencies);
const apacheDeps = filterByApache(allDependencies);

// ❌ Bad: Repetitive
const filterByMIT = (dependencies: Dependency[]): Dependency[] => {
  return dependencies.filter(dep => dep.license === 'MIT');
};

const filterByApache = (dependencies: Dependency[]): Dependency[] => {
  return dependencies.filter(dep => dep.license === 'Apache-2.0');
};
```

### No Side Effects (Except IO Boundary)

**Side effects only at boundaries**:

```typescript
// ✅ Good: Side effects at boundary only
const main = async (): Promise<void> => {
  // IO boundary - side effects allowed
  const config = await readConfig('./monolicense.config.json');
  const lockfile = await parseLockfile('./pnpm-lock.yaml');

  // Pure functions
  const dependencies = extractDependencies(lockfile);
  const violations = evaluatePolicy(dependencies, config.policy);
  const report = generateReport(violations);

  // IO boundary - side effects allowed
  await writeReport('./report.md', report);
};

// ❌ Bad: Side effects mixed with logic
const generateReport = (violations: Violation[]): string => {
  console.log('Generating report...'); // Side effect!
  const report = violations.map(v => `- ${v.package}`).join('\n');
  writeFileSync('./report.md', report); // Side effect!
  return report;
};
```

---

## File and Folder Structure

### CLI App Structure

```
apps/cli/
├── src/
│   ├── commands/              # CLI commands (pure functions)
│   │   ├── scan.ts
│   │   ├── init.ts
│   │   ├── approve.ts
│   │   ├── diff.ts
│   │   └── update-license-data.ts
│   │
│   ├── core/                  # Core business logic (pure functions)
│   │   ├── scanner/
│   │   │   ├── detect-monorepo.ts
│   │   │   ├── parse-lockfile.ts
│   │   │   ├── extract-dependencies.ts
│   │   │   └── build-dependency-graph.ts
│   │   ├── license/
│   │   │   ├── extract-license.ts
│   │   │   ├── normalize-license.ts
│   │   │   ├── evaluate-policy.ts
│   │   │   └── recommend-policy.ts
│   │   ├── approval/
│   │   │   ├── match-approval.ts
│   │   │   ├── add-approval.ts
│   │   │   └── check-auto-approve.ts
│   │   └── reporter/
│   │       ├── generate-markdown-report.ts
│   │       ├── generate-json-report.ts
│   │       └── generate-html-report.ts
│   │
│   ├── parsers/               # Lockfile parsers (pure functions)
│   │   ├── parse-pnpm-lockfile.ts
│   │   ├── parse-npm-lockfile.ts
│   │   └── parse-yarn-lockfile.ts
│   │
│   ├── utils/                 # Utility functions (pure)
│   │   ├── file-system.ts    # IO wrappers
│   │   ├── git.ts
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── errors.ts
│   │
│   └── index.ts               # Main entry point
│
└── tests/                     # Mirror src/ structure
    ├── commands/
    │   ├── scan.test.ts
    │   ├── init.test.ts
    │   └── ...
    ├── core/
    │   ├── scanner/
    │   │   ├── detect-monorepo.test.ts
    │   │   └── ...
    │   └── ...
    ├── parsers/
    │   ├── parse-pnpm-lockfile.test.ts
    │   └── ...
    ├── utils/
    │   └── ...
    └── fixtures/              # Test data
        ├── lockfiles/
        │   ├── pnpm-lock.yaml
        │   ├── package-lock.json
        │   └── yarn.lock
        └── configs/
            └── valid-config.json
```

### API App Structure (Feature-Based)

```
apps/api/
├── src/
│   ├── features/              # Feature-based routes (no coupling)
│   │   ├── scan/
│   │   │   ├── routes.ts      # Fastify routes
│   │   │   ├── handlers.ts    # Request handlers
│   │   │   ├── schemas.ts     # JSON schemas
│   │   │   ├── services.ts    # Business logic
│   │   │   └── scan.test.ts   # Tests co-located
│   │   │
│   │   ├── approvals/
│   │   │   ├── routes.ts
│   │   │   ├── handlers.ts
│   │   │   ├── schemas.ts
│   │   │   ├── services.ts
│   │   │   └── approvals.test.ts
│   │   │
│   │   ├── licenses/
│   │   │   └── ...
│   │   │
│   │   └── reports/
│   │       └── ...
│   │
│   ├── lib/                   # Shared API infrastructure
│   │   ├── db.ts             # MongoDB connection
│   │   ├── auth.ts           # Authentication
│   │   ├── config.ts         # Config loading
│   │   ├── logger.ts         # Logging
│   │   └── errors.ts         # Error handling
│   │
│   └── server.ts             # Fastify server setup
│
└── tests/
    ├── integration/          # Integration tests
    └── e2e/                  # End-to-end tests
```

**Rationale**:
- Feature-based structure allows easy extraction to microservices
- No coupling between features
- Each feature can be independently tested and deployed

---

## Naming Conventions

### Files

**kebab-case** for all files:
```
✅ Good:
  extract-license.ts
  parse-pnpm-lockfile.ts
  generate-markdown-report.ts

❌ Bad:
  extractLicense.ts
  ParsePnpmLockfile.ts
  generate_markdown_report.ts
```

### Functions

**Declarative, verb-noun pattern** in camelCase:

```typescript
// ✅ Good: Clear, declarative
const extractLicenseFromPackageJson = (pkg: PackageJson): string => { };
const hasViolations = (result: ScanResult): boolean => { };
const filterDependenciesByLicense = (license: string) => (deps: Dependency[]): Dependency[] => { };

// ❌ Bad: Unclear
const extract = (pkg: PackageJson): string => { };
const check = (result: ScanResult): boolean => { };
const filter = (license: string, deps: Dependency[]): Dependency[] => { };
```

### Constants

**UPPER_SNAKE_CASE** for true constants:

```typescript
const MAX_LOCKFILE_SIZE_BYTES = 100 * 1024 * 1024;
const DEFAULT_POLICY_THRESHOLD = 90;
const API_BASE_URL = 'https://api.monolicense.com';
```

### Interfaces

**No "I" prefix**, descriptive names:

```typescript
// ✅ Good
interface Config { }
interface LicenseInfo { }
interface ScanResult { }

// ❌ Bad
interface IConfig { }
interface ILicenseInfo { }
```

### Boolean Variables

**is/has/should/can prefix**:

```typescript
const isValid = validateConfig(config);
const hasViolations = violations.length > 0;
const shouldAutoApprove = matchesPattern(pkg);
const canModify = checkPermissions(user);
```

---

## Code Formatting

### Shared Prettier Config

**libs/config/prettier-config/index.json**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false
}
```

All packages extend this config:
```json
{
  "prettier": "@monolicense/prettier-config"
}
```

### Shared ESLint Config

**libs/config/linters/base.js**:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:functional/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'functional', 'import'],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/consistent-type-imports': 'error',

    // Functional Programming
    'functional/no-class': 'error',
    'functional/no-this-expression': 'error',
    'functional/no-let': 'error',
    'functional/immutable-data': 'error',
    'functional/prefer-readonly-type': 'warn',

    // Import Sorting (automatic)
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true,
      },
      'newlines-between': 'always',
    }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // TypeScript handles this

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

---

## Import/Export Patterns

### Import Order

**Use automatic import sorting** via ESLint/IDE plugins:
- ESLint plugin: `eslint-plugin-import` with `import/order` rule
- VSCode: Enable "Organize Imports on Save"
- WebStorm/IntelliJ: Enable "Optimize imports on the fly"

Imports will be automatically sorted alphabetically and grouped. No manual ordering required.

```typescript
// Example (auto-sorted by tooling)
import { readFile } from 'fs/promises';
import { join } from 'path';
import spdxCorrect from 'spdx-correct';
import * as yaml from 'yaml';

import type { Config, License } from '@monolicense/license';
import { extractLicense } from '@monolicense/license';
import type { ScanResult } from '@monolicense/reporter';
import { validateConfig } from '@monolicense/utils';

import { buildGraph } from './build-dependency-graph';
```

### Type Imports

**Always use `import type`** for types:

```typescript
// ✅ Good
import type { Config, License } from '@shared/types';
import { validateConfig } from '@shared/validators';

// ❌ Bad
import { Config, License, validateConfig } from '@shared/types';
```

### Named Exports Only

**NEVER use default exports**:

```typescript
// ✅ Good
export const extractLicense = (path: string): LicenseInfo => { };

// ❌ Bad
export default function extractLicense(path: string): LicenseInfo { }
```

---

## Error Handling

### Functional Error Handling with Result Types

**Use Result type instead of throwing**:

```typescript
// Define Result type
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

// ✅ Good: Functional error handling
const parseConfig = (path: string): Result<Config, ConfigError> => {
  try {
    const content = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(content);
    return { success: true, value: parsed };
  } catch (error) {
    return {
      success: false,
      error: new ConfigError('Failed to parse config', path),
    };
  }
};

// Usage
const configResult = parseConfig('./config.json');
if (!configResult.success) {
  console.error(configResult.error.message);
  return;
}
const config = configResult.value; // Type-safe!

// ❌ Bad: Throwing
const parseConfig = (path: string): Config => {
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content); // Throws!
};
```

### Custom Error Constructors (Not Classes)

```typescript
// ✅ Good: Error constructor functions
interface ConfigError extends Error {
  readonly name: 'ConfigError';
  readonly configPath?: string;
}

const createConfigError = (message: string, configPath?: string): ConfigError => {
  const error = new Error(message) as ConfigError;
  error.name = 'ConfigError';
  (error as any).configPath = configPath;
  return error;
};

// ❌ Bad: Error class
class ConfigError extends Error {
  constructor(message: string, public readonly configPath?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
```

---

## Type Definitions

### Interfaces Over Types

**Always use interface for objects**:

```typescript
// ✅ Good
interface Config {
  version: string;
  policy: Policy;
}

interface Policy {
  allowed: string[];
  forbidden: string[];
}

// ❌ Bad
type Config = {
  version: string;
  policy: Policy;
};
```

### Explicit Return Types

**All functions must have explicit return types**:

```typescript
// ✅ Good
const extractLicense = (path: string): LicenseInfo => {
  // ...
};

const hasViolations = (result: ScanResult): boolean => {
  return result.violations.length > 0;
};

// ❌ Bad
const extractLicense = (path: string) => {
  // ... what does this return?
};
```

### Readonly by Default

**Use readonly for immutability**:

```typescript
// ✅ Good
interface Config {
  readonly version: string;
  readonly policy: readonly string[];
}

// ❌ Bad
interface Config {
  version: string;
  policy: string[];
}
```

---

## Comments and Documentation

### Detailed JSDoc for All Functions

**All exported functions MUST have JSDoc**:

```typescript
/**
 * Extracts license information from a package's package.json file.
 *
 * Reads the package.json, extracts the license field, and normalizes it
 * to an SPDX identifier. Falls back to 'UNKNOWN' if license is missing
 * or cannot be normalized.
 *
 * @param packagePath - Absolute path to the package directory
 * @returns Normalized SPDX license identifier
 * @throws Never throws - returns 'UNKNOWN' on errors
 *
 * @example
 * ```typescript
 * const license = extractLicenseFromPackageJson('/path/to/package');
 * console.log(license); // "MIT"
 * ```
 */
export const extractLicenseFromPackageJson = (packagePath: string): string => {
  const packageJson = readPackageJson(packagePath);
  const licenseField = extractLicenseField(packageJson);
  return normalizeSpdxId(licenseField);
};
```

### API Route Documentation

**All API routes MUST have JSDoc compatible with doc compilers**:

```typescript
/**
 * @openapi
 * /api/scan:
 *   post:
 *     summary: Trigger a license compliance scan
 *     description: Scans the specified monorepo for license compliance violations
 *     tags:
 *       - Scan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - repoPath
 *             properties:
 *               repoPath:
 *                 type: string
 *                 description: Absolute path to monorepo root
 *     responses:
 *       200:
 *         description: Scan completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScanResult'
 *       400:
 *         description: Invalid request
 */
export const handleScanRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // ...
};
```

### Minimal Inline Comments

**Code should be self-documenting** - only comment WHY, not WHAT:

```typescript
// ✅ Good: Explains WHY
// Normalize to SPDX because some packages use non-standard formats like "The MIT License"
const spdxId = normalizeLicenseToSpdx(rawLicense);

// ❌ Bad: Explains WHAT (obvious from code)
// Call normalizeLicenseToSpdx function
const spdxId = normalizeLicenseToSpdx(rawLicense);
```

---

## Testing Standards

### Test Structure Mirrors Source

```
apps/cli/
├── src/
│   ├── commands/
│   │   ├── scan.ts
│   │   └── init.ts
│   └── utils/
│       └── logger.ts
└── tests/
    ├── commands/
    │   ├── scan.test.ts
    │   └── init.test.ts
    └── utils/
        └── logger.test.ts

libs/license/
├── src/
│   ├── extract-license.ts
│   └── normalize-license.ts
└── tests/
    ├── extract-license.test.ts
    └── normalize-license.test.ts
```

### Unit and Integration Tests Required

**All functional code MUST have**:
- Unit tests (test individual functions in isolation)
- Integration tests (test functions working together)

**Exceptions**:
- UI code uses Playwright E2E tests
- UI code uses Loki.js for image regression testing

### Test Configuration

**apps/cli/vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['tests/**', 'dist/**', '**/*.test.ts', '**/*.stories.tsx'],
      // Coverage targets are guidelines, not strict requirements
      // Focus on quality tests over metrics
      thresholds: {
        lines: 80,      // Target: 80%
        functions: 80,  // Target: 80%
        branches: 75,   // Target: 75%
        statements: 80, // Target: 80%
      },
    },
  },
});
```

### Arrange-Act-Assert Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { extractLicenseFromPackageJson } from '@/core/license/extract-license';

describe('extractLicenseFromPackageJson', () => {
  describe('when package.json has valid license field', () => {
    it('should return normalized SPDX identifier', () => {
      // Arrange
      const packagePath = '/fixtures/packages/valid-mit';

      // Act
      const license = extractLicenseFromPackageJson(packagePath);

      // Assert
      expect(license).toBe('MIT');
    });
  });

  describe('when package.json has non-standard license format', () => {
    it('should normalize to SPDX identifier', () => {
      // Arrange
      const packagePath = '/fixtures/packages/the-mit-license';

      // Act
      const license = extractLicenseFromPackageJson(packagePath);

      // Assert
      expect(license).toBe('MIT');
    });
  });
});
```

---

## API Development Standards

### Feature-Based Structure

**Each feature is completely independent**:

```
features/scan/
  ├── routes.ts      # Fastify routes
  ├── handlers.ts    # Request handlers (pure functions)
  ├── schemas.ts     # JSON schemas for validation
  ├── services.ts    # Business logic (pure functions)
  └── scan.test.ts   # Co-located tests
```

**No coupling between features** - allows easy microservice extraction.

### Fastify Framework

**Use Fastify** (not Express) for:
- Better TypeScript support
- Built-in schema validation
- Plugin architecture (easy to split)
- Excellent performance

### Shared API Library

**apps/api/src/lib/** contains shared infrastructure:

```typescript
// lib/db.ts - Database connection (side effect isolated)
export const createDbConnection = async (config: DbConfig): Promise<Db> => {
  return await MongoClient.connect(config.url);
};

// lib/auth.ts - Authentication (pure functions)
export const verifyToken = (token: string, secret: string): Result<User, AuthError> => {
  // ...
};

// lib/config.ts - Config loading
export const loadApiConfig = (): Result<ApiConfig, ConfigError> => {
  // ...
};
```

### API Route Example

```typescript
// features/scan/routes.ts
import type { FastifyInstance } from 'fastify';
import { handleScanRequest } from './handlers';
import { scanRequestSchema, scanResponseSchema } from './schemas';

export const registerScanRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post('/api/scan', {
    schema: {
      body: scanRequestSchema,
      response: {
        200: scanResponseSchema,
      },
    },
    handler: handleScanRequest,
  });
};

// features/scan/handlers.ts
export const handleScanRequest = async (
  request: FastifyRequest<{ Body: ScanRequest }>,
  reply: FastifyReply
): Promise<void> => {
  const result = await performScan(request.body);

  if (!result.success) {
    reply.code(400).send({ error: result.error.message });
    return;
  }

  reply.send(result.value);
};

// features/scan/services.ts (pure functions)
export const performScan = async (
  request: ScanRequest
): Promise<Result<ScanResult, ScanError>> => {
  // Pure business logic
};
```

---

## UI Component Development (Atomic Design)

### Overview

All UI components in `libs/ui` and `apps/web-dashboard` MUST follow **Atomic Design** methodology for consistent, scalable, and reusable component architecture.

**Reference**: [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)

### Atomic Design Hierarchy

```
libs/ui/src/
├── atoms/           # Smallest building blocks
├── molecules/       # Simple groups of atoms
├── organisms/       # Complex UI components
├── templates/       # Page-level layouts (structure only)
└── index.ts         # Barrel export
```

**Note**: Pages live in `apps/web-dashboard/src/pages/` and use templates from `libs/ui`.

---

### Atoms

**Definition**: Basic building blocks that cannot be broken down further.

**Examples**: Buttons, inputs, labels, icons, badges, typography

**Structure**:
```
libs/ui/src/atoms/
├── button/
│   ├── button.tsx
│   ├── button.test.tsx
│   ├── button.stories.tsx
│   └── index.ts
├── badge/
│   ├── badge.tsx
│   ├── badge.test.tsx
│   ├── badge.stories.tsx
│   └── index.ts
└── index.ts
```

**Example Atom**:
```typescript
// libs/ui/src/atoms/button/button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'secondary' | 'danger';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps): JSX.Element => {
  const baseClasses = 'rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

**Atom Guidelines**:
- ✅ No business logic
- ✅ Highly reusable
- ✅ Minimal props (only for styling/behavior)
- ✅ Pure presentational components
- ❌ No API calls
- ❌ No complex state management

---

### Molecules

**Definition**: Simple combinations of atoms functioning together as a unit.

**Examples**: Form fields (label + input + error), search bars (input + button), card headers (title + badge)

**Structure**:
```
libs/ui/src/molecules/
├── form-field/
│   ├── form-field.tsx
│   ├── form-field.test.tsx
│   ├── form-field.stories.tsx
│   └── index.ts
├── license-badge/
│   ├── license-badge.tsx
│   ├── license-badge.test.tsx
│   ├── license-badge.stories.tsx
│   └── index.ts
└── index.ts
```

**Example Molecule**:
```typescript
// libs/ui/src/molecules/form-field/form-field.tsx
import type { InputHTMLAttributes } from 'react';

import { Input } from '../../atoms/input';
import { Label } from '../../atoms/label';
import { Text } from '../../atoms/text';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  readonly helperText?: string;
}

export const FormField = ({
  label,
  error,
  helperText,
  id,
  ...inputProps
}: FormFieldProps): JSX.Element => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} aria-invalid={!!error} {...inputProps} />
      {error && <Text variant="error" size="sm">{error}</Text>}
      {!error && helperText && <Text variant="muted" size="sm">{helperText}</Text>}
    </div>
  );
};
```

**Molecule Guidelines**:
- ✅ Compose 2-5 atoms
- ✅ Single responsibility (one UI pattern)
- ✅ Reusable across multiple contexts
- ❌ No direct API calls
- ❌ No global state management

---

### Organisms

**Definition**: Complex UI components made of molecules and/or atoms with specific business logic.

**Examples**: Navigation bars, data tables, forms, scan result cards, violation lists

**Structure**:
```
libs/ui/src/organisms/
├── violation-list/
│   ├── violation-list.tsx
│   ├── violation-list.test.tsx
│   ├── violation-list.stories.tsx
│   └── index.ts
├── dependency-table/
│   ├── dependency-table.tsx
│   ├── dependency-table.test.tsx
│   ├── dependency-table.stories.tsx
│   └── index.ts
└── index.ts
```

**Example Organism**:
```typescript
// libs/ui/src/organisms/violation-list/violation-list.tsx
import type { Violation } from '@monolicense/policy';

import { Badge } from '../../atoms/badge';
import { Button } from '../../atoms/button';
import { Card } from '../../molecules/card';

export interface ViolationListProps {
  readonly violations: readonly Violation[];
  readonly onApprove?: (packageName: string) => void;
  readonly showApproveButton?: boolean;
}

export const ViolationList = ({
  violations,
  onApprove,
  showApproveButton = false,
}: ViolationListProps): JSX.Element => {
  if (violations.length === 0) {
    return (
      <Card>
        <p className="text-green-600">✓ No violations found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {violations.map(violation => (
        <Card key={`${violation.package}@${violation.version}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {violation.package}@{violation.version}
              </h3>
              <Badge variant={violation.severity === 'error' ? 'danger' : 'warning'}>
                {violation.license}
              </Badge>
              <p className="mt-2 text-gray-700">{violation.reason}</p>
              <p className="mt-1 text-sm text-gray-500">
                Used by: {violation.usedBy.join(', ')}
              </p>
            </div>
            {showApproveButton && onApprove && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onApprove(violation.package)}
              >
                Approve
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
```

**Organism Guidelines**:
- ✅ Business-specific components
- ✅ Can manage internal state (useState, useReducer)
- ✅ Can use custom hooks (useScanResults, etc.)
- ✅ Accept data as props (no direct fetching)
- ❌ No direct API calls (use hooks from apps)

---

### Templates

**Definition**: Page-level layouts that define structure without content.

**Examples**: Dashboard layout, two-column layout, scan result template

**Structure**:
```
libs/ui/src/templates/
├── dashboard-layout/
│   ├── dashboard-layout.tsx
│   ├── dashboard-layout.test.tsx
│   └── index.ts
├── two-column-layout/
│   ├── two-column-layout.tsx
│   ├── two-column-layout.test.tsx
│   └── index.ts
└── index.ts
```

**Example Template**:
```typescript
// libs/ui/src/templates/dashboard-layout/dashboard-layout.tsx
import type { ReactNode } from 'react';

export interface DashboardLayoutProps {
  readonly sidebar: ReactNode;
  readonly header: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export const DashboardLayout = ({
  sidebar,
  header,
  children,
  footer,
}: DashboardLayoutProps): JSX.Element => {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b px-6 flex items-center">
          {header}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>

        {/* Footer */}
        {footer && (
          <footer className="h-12 bg-white border-t px-6 flex items-center">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
```

**Template Guidelines**:
- ✅ Define layout structure only
- ✅ Use composition (children, render props)
- ✅ Responsive by default
- ❌ No business logic
- ❌ No data fetching

---

### Pages (in apps/web-dashboard)

**Definition**: Specific instances of templates with real content and data fetching.

**Structure**:
```
apps/web-dashboard/src/pages/
├── dashboard/
│   ├── dashboard.tsx
│   ├── dashboard.test.tsx
│   └── index.ts
├── scan-results/
│   ├── scan-results.tsx
│   ├── scan-results.test.tsx
│   └── index.ts
└── index.ts
```

**Example Page**:
```typescript
// apps/web-dashboard/src/pages/scan-results/scan-results.tsx
import { useScanResults } from '@monolicense/ui/hooks';
import { DashboardLayout } from '@monolicense/ui/templates';
import { ViolationList } from '@monolicense/ui/organisms';
import { Sidebar } from '../../components/sidebar';
import { Header } from '../../components/header';

export const ScanResultsPage = (): JSX.Element => {
  const { data: scanResult, isLoading, error } = useScanResults();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <DashboardLayout
      sidebar={<Sidebar />}
      header={<Header title="Scan Results" />}
    >
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">License Compliance Scan</h1>

        <ViolationList
          violations={scanResult.violations}
          showApproveButton
          onApprove={handleApprove}
        />
      </div>
    </DashboardLayout>
  );
};
```

**Page Guidelines**:
- ✅ Data fetching (React Query, SWR, etc.)
- ✅ Route-specific logic
- ✅ Compose templates + organisms
- ✅ Handle loading/error states
- ❌ No presentational styling (delegate to components)

---

### Component File Structure

Each component must have:

```
component-name/
├── component-name.tsx        # Component implementation
├── component-name.test.tsx   # Unit tests (Vitest + Testing Library)
├── component-name.stories.tsx # Storybook stories
└── index.ts                  # Barrel export
```

**index.ts**:
```typescript
export { ComponentName } from './component-name';
export type { ComponentNameProps } from './component-name';
```

---

### Storybook Integration

All UI components MUST have Storybook stories for visual testing and documentation.

**Example Story**:
```typescript
// libs/ui/src/atoms/button/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};
```

---

### UI Testing Strategy

1. **Unit Tests (Vitest + React Testing Library)**:
   - Test component rendering
   - Test user interactions
   - Test prop variations

2. **Visual Regression (Loki.js)**:
   - Screenshot testing via Storybook
   - Detect unintended visual changes

3. **E2E Tests (Playwright)**:
   - Full page flows in web-dashboard
   - Integration with real API

**Example Unit Test**:
```typescript
// libs/ui/src/atoms/button/button.test.tsx
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

---

### Atomic Design Benefits

1. **Consistency**: Reusable atoms ensure UI consistency
2. **Scalability**: Easy to add new pages by composing existing components
3. **Testability**: Isolated components are easy to test
4. **Documentation**: Storybook provides living documentation
5. **Team Collaboration**: Clear component hierarchy
6. **Bundle Size**: Tree-shaking removes unused components

---

## Shared Configuration

### Shared Config Package

**libs/config/** contains all shared configurations:

```
libs/config/
├── eslint-config/
│   ├── index.js
│   └── package.json
├── prettier-config/
│   ├── index.json
│   └── package.json
├── tsconfig/
│   ├── base.json
│   ├── package.json
│   └── README.md
└── vitest-config/
    ├── index.ts
    └── package.json
```

### Using Shared Config

**Each app/lib extends shared config**:

```json
// apps/cli/package.json
{
  "prettier": "@monolicense/prettier-config",
  "eslintConfig": {
    "extends": "@monolicense/eslint-config"
  }
}

// apps/cli/tsconfig.json
{
  "extends": "@monolicense/tsconfig/base.json"
}
```

---

## Anti-Patterns and No-Nos

### ❌ No Classes (Unless Required)

```typescript
// ❌ Bad
class LicenseExtractor {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  extract(path: string): License {
    return this.normalize(this.readLicense(path));
  }
}

// ✅ Good
const extractLicense = (config: Config) => (path: string): License => {
  const rawLicense = readLicense(path);
  return normalizeLicense(rawLicense);
};
```

### ❌ No `this` Keyword

```typescript
// ❌ Bad
class Cache {
  private data: Map<string, any>;

  get(key: string): any {
    return this.data.get(key);
  }
}

// ✅ Good
interface Cache {
  readonly data: ReadonlyMap<string, unknown>;
}

const createCache = (): Cache => {
  return { data: new Map() };
};

const getCacheValue = (cache: Cache, key: string): unknown | undefined => {
  return cache.data.get(key);
};
```

### ❌ No Mutations

```typescript
// ❌ Bad
const addLicense = (licenses: string[], newLicense: string): void => {
  licenses.push(newLicense);
};

// ✅ Good
const addLicense = (licenses: readonly string[], newLicense: string): readonly string[] => {
  return [...licenses, newLicense];
};
```

### ❌ No `any` Types

```typescript
// ❌ Bad
const processData = (data: any): any => {
  return data.something;
};

// ✅ Good
const processData = (data: unknown): ProcessedData => {
  if (!isValidData(data)) {
    throw createValidationError('Invalid data format');
  }
  return transformData(data);
};
```

### ❌ No Magic Numbers

```typescript
// ❌ Bad
if (dependencies.length > 1000) {
  console.warn('Large dependency count');
}

// ✅ Good
const MAX_DEPENDENCY_WARNING_THRESHOLD = 1000;

if (dependencies.length > MAX_DEPENDENCY_WARNING_THRESHOLD) {
  console.warn('Large dependency count');
}
```

---

## Git Conventions

### Commit Message Format

MonoLicense uses [Conventional Commits](https://www.conventionalcommits.org/) for clear, consistent commit history.

**Format**:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(parsers): add pnpm lockfile v9 support` |
| `fix` | Bug fix | `fix(license): handle dual-license SPDX expressions` |
| `docs` | Documentation only | `docs: update README with quick start guide` |
| `style` | Formatting, no code change | `style(cli): fix indentation in scan command` |
| `refactor` | Code restructuring | `refactor(cli): extract scan command to separate file` |
| `test` | Adding/updating tests | `test(dependency): add workspace detection tests` |
| `chore` | Build, tooling, deps | `chore: upgrade TypeScript to 5.4` |

### Scope

Scope should match the package name from `apps/` or `libs/`:

- **Apps**: `cli`, `web-dashboard`, `api`, `bot`
- **Libs**: `parsers`, `license`, `dependency`, `policy`, `approval`, `reporter`, `utils`, `testing`, `config`

Scope is optional for changes affecting multiple packages or root-level config.

### Subject Line Rules

1. **Max 72 characters** - Keep subject concise
2. **Imperative mood** - "add feature" not "added feature" or "adds feature"
3. **No period** - Don't end with punctuation
4. **Lowercase** - Start with lowercase letter
5. **Present tense** - "change" not "changed"

### Breaking Changes

Add `!` after type/scope for breaking changes:

```
feat(cli)!: change default output format to JSON

BREAKING CHANGE: The default output format has changed from text to JSON.
Users who depend on text output should use --format text explicitly.
```

### Body Guidelines

Use body for:
- Explaining **why** the change was made (not what)
- Providing context that isn't obvious from the diff
- Referencing related issues or discussions

```
fix(license): handle packages with multiple license fields

Some packages declare licenses in both "license" and "licenses" fields.
Previously we only checked "license", missing valid license data.

Fixes #42
```

### Examples

**Good**:
```
feat(parsers): add pnpm lockfile v9 support
fix(license): handle dual-license SPDX expressions
docs: update README with quick start guide
test(dependency): add workspace detection tests
chore: upgrade TypeScript to 5.4
refactor(cli): extract scan command to separate file
feat(cli)!: require Node.js 20+
```

**Bad**:
```
Updated parser                    # No type, vague subject
feat: stuff                       # Non-descriptive subject
FEAT(CLI): Add new feature.       # Wrong case, period at end
feat(parsers): added support      # Past tense instead of imperative
fix: various bug fixes            # Too vague, multiple changes
```

### Enforcement

- **Pre-commit hook**: Validates commit message format (Husky + commitlint)
- **CI check**: Rejects PRs with invalid commit messages
- **Squash merging**: PR title becomes commit message, must follow format

### Branch Workflow

MonoLicense uses a **rebase-based workflow** to maintain linear history:

**Sync Feature Branch**:
```bash
# Always rebase onto main, never merge
git checkout 001-feature-name
git fetch origin
git rebase main

# If conflicts occur, resolve then continue
git rebase --continue

# Force push after rebase (feature branches only, never main)
git push --force-with-lease
```

**Rules**:
1. **Never merge main into feature branches** - always use `git rebase main`
2. **Linear history required** - no merge commits in feature branches
3. **Force push allowed** - only on feature branches with `--force-with-lease`
4. **Never force push main** - protected branch, only fast-forward merges

**Why Rebase?**:
- Clean, linear commit history
- Easier to understand project evolution
- Simpler `git bisect` for debugging
- Each commit is a logical, complete change

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-27 | 2.0 | Complete rewrite with functional programming requirements |
| 2025-11-26 | 1.0 | Initial coding standards document |

---

**Previous Document**: [CONFIG_SCHEMA.md](./CONFIG_SCHEMA.md)
**Next Document**: [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)
**See Also**: [TODO.md](../TODO.md) for full documentation roadmap
