# MonoLicense - Testing Strategy

This document defines the complete testing strategy for MonoLicense, including testing patterns, shared test utilities library, coverage requirements, and testing workflows.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Organization](#2-test-organization)
3. [Testing Pyramid](#3-testing-pyramid)
4. [Shared Testing Library](#4-shared-testing-library)
5. [Unit Testing](#5-unit-testing)
6. [Integration Testing](#6-integration-testing)
7. [End-to-End Testing](#7-end-to-end-testing)
8. [Visual Regression Testing](#8-visual-regression-testing)
9. [Test Data and Fixtures](#9-test-data-and-fixtures)
10. [Coverage Requirements](#10-coverage-requirements)
11. [CI/CD Integration](#11-cicd-integration)
12. [Performance Testing](#12-performance-testing)

---

## 1. Testing Philosophy

### 1.1 Core Principles

MonoLicense follows these testing principles:

1. **Test-Driven Development (TDD)** - Write tests first to drive design and implementation
2. **Tests mirror project structure** - Test files are organized identically to source files
3. **Practical testing over coverage metrics** - Tests must verify actual behavior, edge cases, and failures
4. **Tests are documentation** - Tests serve as living documentation of behavior
5. **Fast feedback loops** - Tests must run quickly for rapid development
6. **Functional testing patterns** - Tests use pure functions and immutable data
7. **Shared utilities** - Common test utilities live in `libs/testing`

### 1.2 Testing Goals

- **Confidence**: Changes don't break existing functionality
- **Documentation**: Tests explain how code works and its edge cases
- **Design**: TDD drives better API design before implementation
- **Regression Prevention**: Bugs stay fixed
- **Refactoring Safety**: Code can be improved without fear
- **Practical Coverage**: Aim for 80% coverage focusing on critical paths and edge cases

---

## 2. Test Organization

### 2.1 Directory Structure

Tests mirror the project structure exactly:

```
monolicense/
├── apps/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   └── scan.ts
│   │   │   └── utils/
│   │   │       └── logger.ts
│   │   └── tests/
│   │       ├── commands/
│   │       │   └── scan.test.ts      # Mirrors src/commands/scan.ts
│   │       └── utils/
│   │           └── logger.test.ts    # Mirrors src/utils/logger.ts
│   │
│   ├── api/
│   │   ├── src/
│   │   │   └── features/
│   │   │       ├── scan/
│   │   │       │   ├── routes.ts
│   │   │       │   ├── handlers.ts
│   │   │       │   ├── services.ts
│   │   │       │   └── scan.test.ts   # Co-located tests
│   │   │       └── approvals/
│   │   │           └── approvals.test.ts
│   │   └── tests/
│   │       └── integration/           # Integration tests
│   │           ├── scan.integration.test.ts
│   │           └── approvals.integration.test.ts
│   │
│   └── web-dashboard/
│       ├── src/
│       │   ├── components/
│       │   │   ├── atoms/
│       │   │   │   ├── Button/
│       │   │   │   │   ├── Button.tsx
│       │   │   │   │   ├── Button.test.tsx     # Component tests
│       │   │   │   │   └── Button.stories.tsx  # Storybook stories
│       │   │   └── pages/
│       │   │       └── ScanResults/
│       │   │           ├── ScanResults.tsx
│       │   │           └── ScanResults.test.tsx
│       └── tests/
│           ├── e2e/                   # Playwright E2E tests
│           │   ├── scan-flow.spec.ts
│           │   └── approval-flow.spec.ts
│           └── visual/                # Loki.js visual regression
│               └── .loki/
│
└── libs/
    ├── dependency/
    │   ├── src/
    │   │   ├── detect-monorepo.ts
    │   │   └── parse-lockfile.ts
    │   └── tests/
    │       ├── detect-monorepo.test.ts
    │       └── parse-lockfile.test.ts
    │
    └── testing/                       # SHARED TEST UTILITIES
        ├── src/
        │   ├── fixtures/
        │   │   ├── lockfiles.ts       # Sample lockfile data
        │   │   ├── projects.ts        # Sample project configs
        │   │   └── licenses.ts        # Sample license data
        │   ├── mocks/
        │   │   ├── fs.ts              # File system mocks
        │   │   ├── network.ts         # Network mocks
        │   │   └── git.ts             # Git mocks
        │   ├── matchers/
        │   │   ├── license.ts         # Custom license matchers
        │   │   └── policy.ts          # Custom policy matchers
        │   ├── helpers/
        │   │   ├── create-test-project.ts
        │   │   ├── create-test-config.ts
        │   │   └── assertions.ts
        │   └── index.ts               # Barrel export
        └── package.json
```

### 2.2 Test File Naming

- **Unit tests**: `*.test.ts` or `*.test.tsx`
- **Integration tests**: `*.integration.test.ts`
- **E2E tests**: `*.spec.ts` (Playwright convention)
- **Visual regression**: Component stories in `*.stories.tsx`

### 2.3 TypeScript Configuration

Each package has separate TypeScript configs for tests:

**tsconfig.json** (production code):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "tests/**/*"]
}
```

**tsconfig.test.json** (test code):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "outDir": "./dist-tests",
    "rootDir": ".",
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/**/*.test.ts", "tests/**/*"],
  "references": []
}
```

---

## 3. Testing Pyramid

MonoLicense follows the testing pyramid with heavy emphasis on unit and integration tests:

```
           /\
          /  \     E2E Tests (5%)
         /    \    - Critical user flows
        /------\   - Playwright for UI
       /        \
      /          \ Integration Tests (25%)
     /            \- Feature interactions
    /              \- API endpoints
   /----------------\
  /                  \ Unit Tests (70%)
 /                    \- Pure functions
/______________________\- Business logic
```

### 3.1 Test Distribution

- **70% Unit Tests**: Test individual functions and modules in isolation
- **25% Integration Tests**: Test feature interactions and API endpoints
- **5% E2E Tests**: Test critical user flows through UI

---

## 4. Shared Testing Library

The `libs/testing` package provides reusable test utilities for all apps and libraries.

### 4.1 Package Structure

**libs/testing/package.json**:
```json
{
  "name": "@monolicense/testing",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./fixtures": "./src/fixtures/index.ts",
    "./mocks": "./src/mocks/index.ts",
    "./matchers": "./src/matchers/index.ts",
    "./helpers": "./src/helpers/index.ts"
  },
  "dependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 4.2 Fixtures

**libs/testing/src/fixtures/lockfiles.ts**:
```typescript
/**
 * Sample pnpm lockfile data for testing
 */
export const createPnpmLockfile = (overrides?: Partial<PnpmLockfileData>): PnpmLockfileData => {
  return {
    type: 'pnpm',
    version: '9.0',
    packages: {
      '/lodash/4.17.21': {
        resolution: {
          integrity: 'sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg=='
        }
      },
      '/react/18.2.0': {
        resolution: {
          integrity: 'sha512-/3IjMdb2L9QbBdWiW5e3P2/npwMBaU9mHCSCUzNln0ZCYbcfTsGbTJrU/kGemdH2IWmB2ioZ+zkxtmq6g09fGQ=='
        }
      }
    },
    importers: {
      '.': {
        dependencies: {
          'lodash': '4.17.21',
          'react': '18.2.0'
        },
        devDependencies: {},
        optionalDependencies: {}
      }
    },
    raw: {},
    ...overrides
  };
};

/**
 * Sample npm lockfile data for testing
 */
export const createNpmLockfile = (overrides?: Partial<NpmLockfileData>): NpmLockfileData => {
  return {
    type: 'npm',
    version: '3',
    packages: {
      'node_modules/lodash': {
        version: '4.17.21',
        resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
        integrity: 'sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg=='
      }
    },
    raw: {},
    ...overrides
  };
};
```

**libs/testing/src/fixtures/licenses.ts**:
```typescript
/**
 * Sample license information for testing
 */
export const createLicenseInfo = (overrides?: Partial<LicenseInfo>): LicenseInfo => {
  return {
    type: 'MIT',
    spdxId: 'MIT',
    raw: 'MIT',
    confidence: 'high',
    ...overrides
  };
};

/**
 * Creates sample license metadata
 */
export const createLicenseMetadata = (spdxId: string = 'MIT'): LicenseMetadata => {
  return {
    spdxId,
    name: 'MIT License',
    tier: 'universally-accepted',
    category: 'permissive',
    mustIncludeCopyright: true,
    mustIncludeLicense: true,
    mustDiscloseSource: false,
    canUseCommercially: true,
    canModify: true,
    canDistribute: true,
    mustShareAlike: false,
    riskLevel: 'low',
    description: 'A permissive license',
    url: 'https://opensource.org/licenses/MIT'
  };
};
```

**libs/testing/src/fixtures/projects.ts**:
```typescript
/**
 * Creates sample project configuration for testing
 */
export const createTestProject = (overrides?: Partial<Project>): Project => {
  return {
    name: 'test-project',
    path: '/test/project',
    packageName: 'test-project',
    packageManager: 'pnpm',
    relativePath: 'apps/test-project',
    ...overrides
  };
};

/**
 * Creates sample MonoLicense configuration
 */
export const createTestConfig = (overrides?: Partial<MonoLicenseConfig>): MonoLicenseConfig => {
  return {
    version: '1.0',
    policy: {
      allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
      review: ['LGPL-3.0'],
      forbidden: ['GPL-3.0', 'AGPL-3.0']
    },
    ...overrides
  };
};
```

### 4.3 Mocks

**libs/testing/src/mocks/fs.ts**:
```typescript
import { vi } from 'vitest';

/**
 * Creates mock file system functions
 */
export const createFsMocks = () => {
  const files = new Map<string, string>();

  return {
    readFile: vi.fn(async (path: string): Promise<string> => {
      const content = files.get(path);
      if (!content) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return content;
    }),

    writeFile: vi.fn(async (path: string, content: string): Promise<void> => {
      files.set(path, content);
    }),

    fileExists: vi.fn(async (path: string): Promise<boolean> => {
      return files.has(path);
    }),

    // Helper to set file content for tests
    setFile: (path: string, content: string) => {
      files.set(path, content);
    },

    // Helper to clear all files
    clear: () => {
      files.clear();
    }
  };
};
```

**libs/testing/src/mocks/network.ts**:
```typescript
import { vi } from 'vitest';

/**
 * Creates mock fetch function for network requests
 */
export const createFetchMock = () => {
  const responses = new Map<string, Response>();

  const mockFetch = vi.fn(async (url: string): Promise<Response> => {
    const response = responses.get(url);
    if (!response) {
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }
    return response;
  });

  return {
    fetch: mockFetch,

    // Helper to set response for URL
    setResponse: (url: string, body: any, status: number = 200) => {
      responses.set(url, new Response(JSON.stringify(body), { status }));
    },

    // Helper to set error response
    setError: (url: string, status: number = 500) => {
      responses.set(url, new Response(null, { status }));
    },

    // Helper to clear all responses
    clear: () => {
      responses.clear();
    }
  };
};
```

### 4.4 Custom Matchers

**libs/testing/src/matchers/license.ts**:
```typescript
import { expect } from 'vitest';

/**
 * Custom matcher for license SPDX identifiers
 */
export const toBeValidSpdxId = (received: string) => {
  const spdx = require('spdx-correct');
  const isValid = spdx(received) !== null;

  return {
    pass: isValid,
    message: () =>
      isValid
        ? `Expected ${received} not to be a valid SPDX identifier`
        : `Expected ${received} to be a valid SPDX identifier`
  };
};

/**
 * Custom matcher for permissive licenses
 */
export const toBePermissiveLicense = (received: LicenseInfo) => {
  const permissiveLicenses = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'];
  const isPermissive = permissiveLicenses.includes(received.type);

  return {
    pass: isPermissive,
    message: () =>
      isPermissive
        ? `Expected ${received.type} not to be a permissive license`
        : `Expected ${received.type} to be a permissive license`
  };
};

// Register custom matchers
expect.extend({
  toBeValidSpdxId,
  toBePermissiveLicense
});
```

### 4.5 Test Helpers

**libs/testing/src/helpers/assertions.ts**:
```typescript
/**
 * Asserts that a Result type is successful
 */
export const assertSuccess = <T, E>(result: Result<T, E>): asserts result is { success: true; value: T } => {
  if (!result.success) {
    throw new Error(`Expected success but got error: ${JSON.stringify(result.error)}`);
  }
};

/**
 * Asserts that a Result type is an error
 */
export const assertError = <T, E>(result: Result<T, E>): asserts result is { success: false; error: E } => {
  if (result.success) {
    throw new Error(`Expected error but got success: ${JSON.stringify(result.value)}`);
  }
};

/**
 * Asserts that an array contains exactly the expected items (order-independent)
 */
export const assertArrayEquals = <T>(actual: readonly T[], expected: readonly T[]): void => {
  expect(actual).toHaveLength(expected.length);
  expect(new Set(actual)).toEqual(new Set(expected));
};
```

---

## 5. Unit Testing

### 5.1 Unit Test Structure

All unit tests follow this structure:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestProject, createTestConfig } from '@monolicense/testing/fixtures';
import { normalizeLicense } from './normalize-license';

describe('normalizeLicense', () => {
  describe('when given a valid SPDX identifier', () => {
    it('should return license info with high confidence', () => {
      const result = normalizeLicense('MIT');

      expect(result).toEqual({
        type: 'MIT',
        spdxId: 'MIT',
        raw: 'MIT',
        confidence: 'high'
      });
    });
  });

  describe('when given a non-SPDX license string', () => {
    it('should attempt to correct to SPDX', () => {
      const result = normalizeLicense('Apache 2.0');

      expect(result.spdxId).toBe('Apache-2.0');
      expect(result.type).toBe('Apache-2.0');
    });
  });

  describe('when given an unknown license', () => {
    it('should return UNKNOWN with low confidence', () => {
      const result = normalizeLicense('proprietary-custom');

      expect(result.type).toBe('UNKNOWN');
      expect(result.confidence).toBe('low');
    });
  });
});
```

### 5.2 Testing Pure Functions

Pure functions are the easiest to test:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCoverage } from './calculate-coverage';

describe('calculateCoverage', () => {
  it('should calculate 100% coverage when all deps are allowed', () => {
    const dependencies = [
      { name: 'lodash', version: '4.17.21', license: { type: 'MIT' } },
      { name: 'react', version: '18.2.0', license: { type: 'MIT' } }
    ];
    const policy = {
      allowed: ['MIT'],
      review: [],
      forbidden: []
    };

    const coverage = calculateCoverage(dependencies, policy);

    expect(coverage).toBe(100);
  });

  it('should calculate partial coverage correctly', () => {
    const dependencies = [
      { name: 'lodash', version: '4.17.21', license: { type: 'MIT' } },
      { name: 'gpl-lib', version: '1.0.0', license: { type: 'GPL-3.0' } }
    ];
    const policy = {
      allowed: ['MIT'],
      review: [],
      forbidden: ['GPL-3.0']
    };

    const coverage = calculateCoverage(dependencies, policy);

    expect(coverage).toBe(50);
  });
});
```

### 5.3 Testing with Result Types

When testing functions that return Result types:

```typescript
import { describe, it, expect } from 'vitest';
import { assertSuccess, assertError } from '@monolicense/testing/helpers';
import { parsePnpmLockfile } from './parse-pnpm-lockfile';

describe('parsePnpmLockfile', () => {
  describe('when lockfile is valid', () => {
    it('should return success with parsed data', async () => {
      const result = await parsePnpmLockfile('/path/to/pnpm-lock.yaml');

      assertSuccess(result);
      expect(result.value.type).toBe('pnpm');
      expect(result.value.version).toBe('9.0');
    });
  });

  describe('when lockfile version is unsupported', () => {
    it('should return error', async () => {
      const result = await parsePnpmLockfile('/path/to/old-lockfile.yaml');

      assertError(result);
      expect(result.error.name).toBe('UnsupportedLockfileVersionError');
      expect(result.error.message).toContain('not supported');
    });
  });
});
```

---

## 6. Integration Testing

### 6.1 API Integration Tests

Integration tests for API routes test full request/response cycles:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp } from '@monolicense/testing/helpers';
import { createTestConfig, createTestProject } from '@monolicense/testing/fixtures';

describe('POST /api/scan', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when scanning a valid project', () => {
    it('should return scan results', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/scan',
        payload: {
          projectPath: '/test/project',
          config: createTestConfig()
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        summary: expect.objectContaining({
          totalDependencies: expect.any(Number),
          uniquePackages: expect.any(Number)
        })
      });
    });
  });

  describe('when project path is invalid', () => {
    it('should return 400 error', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/scan',
        payload: {
          projectPath: '',
          config: createTestConfig()
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
    });
  });
});
```

### 6.2 Library Integration Tests

Testing interactions between multiple libraries:

```typescript
import { describe, it, expect } from 'vitest';
import { detectMonorepo } from '@monolicense/dependency';
import { parsePnpmLockfile } from '@monolicense/parsers';
import { resolveDependencies } from '@monolicense/dependency';
import { createTestProject } from '@monolicense/testing/fixtures';
import { createFsMocks } from '@monolicense/testing/mocks';

describe('Dependency Resolution Integration', () => {
  it('should detect monorepo, parse lockfile, and resolve dependencies', async () => {
    const fsMocks = createFsMocks();
    fsMocks.setFile('/project/pnpm-workspace.yaml', 'packages:\n  - "apps/*"\n  - "libs/*"');
    fsMocks.setFile('/project/pnpm-lock.yaml', '...');

    // Step 1: Detect monorepo
    const monorepo = await detectMonorepo('/project');
    expect(monorepo.detected).toBe(true);
    expect(monorepo.type).toBe('pnpm-workspace');

    // Step 2: Parse lockfile
    const lockfileResult = await parsePnpmLockfile(monorepo.lockfileLocation);
    assertSuccess(lockfileResult);

    // Step 3: Resolve dependencies
    const graphResult = await resolveDependencies(monorepo.projects, lockfileResult.value);
    assertSuccess(graphResult);

    expect(graphResult.value.packages.size).toBeGreaterThan(0);
  });
});
```

---

## 7. End-to-End Testing

### 7.1 Playwright E2E Tests

UI end-to-end tests use Playwright:

**apps/web-dashboard/tests/e2e/scan-flow.spec.ts**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Scan Flow', () => {
  test('should scan a project and display results', async ({ page }) => {
    await page.goto('/');

    // Navigate to scan page
    await page.click('text=New Scan');
    await expect(page).toHaveURL('/scan');

    // Enter project path
    await page.fill('input[name="projectPath"]', '/test/project');

    // Start scan
    await page.click('button:has-text("Start Scan")');

    // Wait for results
    await expect(page.locator('.scan-progress')).toBeVisible();
    await expect(page.locator('.scan-results')).toBeVisible({ timeout: 10000 });

    // Verify results displayed
    await expect(page.locator('.dependency-count')).toContainText(/\d+ dependencies/);
    await expect(page.locator('.license-breakdown')).toBeVisible();
  });

  test('should show violations in results', async ({ page }) => {
    await page.goto('/scan');

    // Scan project with violations
    await page.fill('input[name="projectPath"]', '/test/project-with-violations');
    await page.click('button:has-text("Start Scan")');

    // Wait for results
    await expect(page.locator('.scan-results')).toBeVisible({ timeout: 10000 });

    // Verify violations displayed
    await expect(page.locator('.violations-list')).toBeVisible();
    await expect(page.locator('.violation-item')).toHaveCount(2);
  });
});
```

### 7.2 CLI E2E Tests

CLI end-to-end tests verify command execution:

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { createTestProject } from '@monolicense/testing/fixtures';

describe('monolicense scan CLI', () => {
  it('should scan project and exit with 0 when no violations', () => {
    const output = execSync('monolicense scan /test/clean-project', {
      encoding: 'utf-8'
    });

    expect(output).toContain('Scan complete');
    expect(output).toContain('0 violations');
  });

  it('should scan project and exit with 1 when violations found', () => {
    expect(() => {
      execSync('monolicense scan /test/project-with-violations', {
        encoding: 'utf-8'
      });
    }).toThrow();
  });
});
```

---

## 8. Visual Regression Testing

### 8.1 Loki.js Configuration

Visual regression tests use Loki.js with Storybook:

**.loki/config.json**:
```json
{
  "configurations": {
    "chrome.laptop": {
      "target": "chrome.docker",
      "width": 1366,
      "height": 768
    },
    "chrome.mobile": {
      "target": "chrome.docker",
      "width": 375,
      "height": 667
    }
  },
  "diffingEngine": "pixelmatch",
  "threshold": 0.1
}
```

### 8.2 Running Visual Tests

```bash
# Update reference images
pnpm loki:update

# Run visual regression tests
pnpm loki:test

# Approve changes
pnpm loki:approve
```

---

## 9. Test Data and Fixtures

### 9.1 Fixture Organization

All fixtures are centralized in `libs/testing/src/fixtures/`:

- **lockfiles.ts**: Sample lockfile data
- **projects.ts**: Sample project configurations
- **licenses.ts**: Sample license information
- **policies.ts**: Sample policy configurations
- **approvals.ts**: Sample approval data

### 9.2 Fixture Best Practices

1. **Keep fixtures minimal**: Only include data needed for test
2. **Use factory functions**: Allow overrides for customization
3. **Make fixtures immutable**: Use `readonly` for safety
4. **Document fixture purpose**: JSDoc comments explain usage

---

## 10. Coverage Requirements

### 10.1 Coverage Philosophy

Coverage is a **byproduct of good testing**, not a goal. Tests should be written to:

1. **Verify functionality**: Does the code do what it's supposed to do?
2. **Test edge cases**: What happens at boundaries and limits?
3. **Validate error handling**: How does code fail gracefully?
4. **Document behavior**: Tests explain how to use the code

**Coverage targets are guidelines, not mandates**. A well-tested critical function at 85% coverage is better than a poorly-tested trivial function at 100%.

### 10.2 Test-Driven Development (TDD) Workflow

Follow this TDD cycle:

1. **Red**: Write a failing test that describes desired behavior
2. **Green**: Write minimal code to make test pass
3. **Refactor**: Improve code while keeping tests green
4. **Repeat**: Continue with next test

**Example TDD workflow**:

```typescript
// Step 1: Write failing test FIRST
describe('normalizeLicense', () => {
  it('should normalize "MIT" to SPDX format', () => {
    const result = normalizeLicense('MIT');

    expect(result.type).toBe('MIT');
    expect(result.spdxId).toBe('MIT');
    expect(result.confidence).toBe('high');
  });
});

// Step 2: Implement minimal code to pass
const normalizeLicense = (license: string): LicenseInfo => {
  return {
    type: 'MIT',
    spdxId: 'MIT',
    raw: license,
    confidence: 'high'
  };
};

// Step 3: Add more tests for edge cases
describe('normalizeLicense', () => {
  it('should handle Apache 2.0 variations', () => {
    expect(normalizeLicense('Apache 2.0').spdxId).toBe('Apache-2.0');
    expect(normalizeLicense('Apache-2').spdxId).toBe('Apache-2.0');
  });

  it('should return UNKNOWN for unrecognized licenses', () => {
    const result = normalizeLicense('proprietary-custom');

    expect(result.type).toBe('UNKNOWN');
    expect(result.confidence).toBe('low');
  });
});

// Step 4: Refactor implementation (tests stay green)
const normalizeLicense = (license: string): LicenseInfo => {
  const spdxId = toSpdxIdentifier(license);

  return {
    type: spdxId || 'UNKNOWN',
    spdxId,
    raw: license,
    confidence: spdxId ? 'high' : 'low'
  };
};
```

### 10.3 Coverage Targets

**Overall target: 80%** - Focus on critical paths, edge cases, and error conditions

- **Lines**: ≥80%
- **Branches**: ≥75% (focusing on meaningful branches)
- **Functions**: ≥80%
- **Statements**: ≥80%

### 10.4 What to Test

**High Priority (Must Test)**:
- Business logic functions
- Data transformation functions
- Validation and parsing functions
- Error handling paths
- Edge cases and boundary conditions
- Integration points between libraries

**Medium Priority (Should Test)**:
- Helper functions with complex logic
- Conditional branches in utilities
- State management functions

**Low Priority (Optional)**:
- Simple getters/setters
- Pass-through functions
- Trivial type guards
- Configuration objects

### 10.5 Coverage Exclusions

Exclude from coverage requirements:

- Type declarations (`.d.ts` files)
- Storybook stories (`*.stories.tsx`)
- Configuration files (`*.config.ts`)
- Test utilities and fixtures
- Build and deployment scripts
- Simple barrel exports (`index.ts` with only re-exports)

### 10.6 Vitest Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.stories.tsx',
        'src/**/*.d.ts',
        'src/**/index.ts',        // Barrel exports
        'src/**/*.config.ts'
      ],
      // Thresholds are guidelines, not strict requirements
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80
      },
      // Show uncovered lines for awareness, not enforcement
      all: true,
      skipFull: false
    }
  }
});
```

### 10.7 When Coverage Doesn't Matter

Coverage below 80% is acceptable when:

1. **Trivial code**: Simple pass-through or delegation functions
2. **Generated code**: Code from external tools (avoid if possible)
3. **Defensive programming**: Unreachable error branches that should never execute
4. **Legacy code**: Code being phased out or replaced

**Focus on test quality over quantity**. One well-written test covering edge cases is worth more than ten tests that only verify happy paths.

---

## 11. CI/CD Integration

### 11.1 GitHub Actions Workflow

**.github/workflows/test.yml**:
```yaml
name: Test

on: [push, pull_request]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Run integration tests
        run: pnpm test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: pnpm playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run visual regression tests
        run: pnpm loki:test
```

---

## 12. Performance Testing

### 12.1 Benchmark Tests

Performance-critical functions have benchmark tests:

```typescript
import { describe, it, bench } from 'vitest';
import { parsePnpmLockfile } from './parse-pnpm-lockfile';

describe('parsePnpmLockfile performance', () => {
  bench('should parse small lockfile (<100 deps) in <100ms', async () => {
    await parsePnpmLockfile('/test/small-lockfile.yaml');
  });

  bench('should parse medium lockfile (100-500 deps) in <500ms', async () => {
    await parsePnpmLockfile('/test/medium-lockfile.yaml');
  });

  bench('should parse large lockfile (500-2000 deps) in <2000ms', async () => {
    await parsePnpmLockfile('/test/large-lockfile.yaml');
  });
});
```

---

## Summary

This testing strategy ensures:

1. **Test-Driven Development (TDD)** - Write tests first to drive design
2. **Practical testing over metrics** - 80% coverage target with focus on quality
3. **Shared test utilities** in `libs/testing` for consistency
4. **Fast feedback loops** with parallel test execution
5. **Functional test patterns** matching functional code style
6. **Multiple test levels**: Unit, Integration, E2E, Visual
7. **CI/CD integration** with automated testing
8. **Performance benchmarks** for critical paths

**Key Principles**:
- Tests verify behavior, edge cases, and failures
- Coverage is a byproduct of good testing, not a goal
- Well-tested critical code at 85% beats poorly-tested trivial code at 100%
- All tests serve as living documentation and enable confident refactoring
