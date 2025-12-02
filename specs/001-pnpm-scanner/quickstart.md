# Quick Start: pnpm Monorepo Scanner

## Prerequisites

- Node.js 20, 22, or 24 LTS
- pnpm 8.x
- A pnpm monorepo with `pnpm-lock.yaml`

## Installation

```bash
# Clone and install
git clone <repo-url>
cd monolicense
pnpm install

# Build all packages
pnpm build
```

## Usage

```bash
# Scan current directory (after building)
node apps/cli/dist/index.js scan

# Or use pnpm dev mode
pnpm --filter @monolicense/cli dev scan

# Scan specific directory
node apps/cli/dist/index.js scan --root /path/to/monorepo

# Output is JSON to stdout
node apps/cli/dist/index.js scan > scan-result.json
```

### Example Output

```json
{
  "projects": [
    {
      "name": "my-app",
      "path": "apps/web",
      "version": "1.0.0",
      "dependencies": [
        {
          "name": "react",
          "version": "18.2.0",
          "license": {
            "spdxId": "MIT",
            "source": "package.json",
            "rawValue": null
          },
          "isWorkspaceDependency": false,
          "isDev": false,
          "specifier": "^18.2.0"
        }
      ],
      "devDependencies": [],
      "isWorkspaceRoot": false
    }
  ],
  "metadata": {
    "monorepoRoot": "/path/to/monorepo",
    "lockfileVersion": "6.0",
    "scanTimestamp": "2025-12-02T17:00:00.000Z",
    "pnpmVersion": null
  },
  "summary": {
    "totalProjects": 3,
    "totalDependencies": 50,
    "uniqueDependencies": 35,
    "licenseCounts": {
      "MIT": 25,
      "Apache-2.0": 8,
      "ISC": 2
    },
    "unknownLicenseCount": 0
  }
}
```

## Development

### Run Tests

```bash
# All tests
pnpm test

# Specific library
pnpm --filter @monolicense/parsers test
pnpm --filter @monolicense/license test
pnpm --filter @monolicense/dependency test

# Watch mode
pnpm --filter @monolicense/parsers test:watch
```

### TDD Workflow

1. Write failing test first
2. Run test to confirm failure
3. Implement minimum code to pass
4. Run test to confirm pass
5. Refactor if needed
6. Repeat

```bash
# Example: Adding a new parser function
cd libs/parsers

# 1. Write test
cat > tests/new-feature.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { newFeature } from '../src/new-feature';

describe('newFeature', () => {
  it('should do something', () => {
    expect(newFeature('input')).toBe('expected');
  });
});
EOF

# 2. Run test (should fail)
pnpm test

# 3. Implement
# 4. Run test (should pass)
# 5. Refactor
```

### Project Structure

```
libs/
├── parsers/        # Lockfile/workspace parsing
│   └── src/
│       ├── pnpm-lockfile.ts
│       └── pnpm-workspace.ts
├── dependency/     # Dependency extraction
│   └── src/
│       ├── detect-monorepo.ts
│       └── extract-dependencies.ts
├── license/        # License detection
│   └── src/
│       ├── extract-license.ts
│       └── normalize-license.ts
└── testing/        # Test fixtures
    └── src/fixtures/

apps/
└── cli/            # CLI entry point
    └── src/commands/scan.ts
```

## Key Patterns

### Result Type

All functions return `Result<T, E>`:

```typescript
import { Result, success, failure } from '@monolicense/utils';

const parseConfig = (path: string): Result<Config, ParseError> => {
  try {
    const data = readFileSync(path, 'utf-8');
    return success(JSON.parse(data));
  } catch (e) {
    return failure({ type: 'PARSE_ERROR', message: String(e) });
  }
};

// Usage
const result = parseConfig('./config.json');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Pure Functions

No classes, no `this`, explicit parameters:

```typescript
// Good
const extractLicense = (packagePath: string): Result<LicenseInfo, Error> => {
  // ...
};

// Bad - don't do this
class LicenseExtractor {
  extract(path: string) {
    return this.normalize(this.read(path));
  }
}
```

### Immutable Data

All interfaces use `readonly`:

```typescript
interface Dependency {
  readonly name: string;
  readonly version: string;
  readonly license: LicenseInfo;
}
```

## Debugging

```bash
# Enable debug logging
DEBUG=monolicense:* pnpm --filter @monolicense/cli dev scan

# Validate output against schema
npx ajv validate -s specs/001-pnpm-scanner/contracts/scan-output.schema.json -d output.json
```

## Common Issues

### "pnpm-lock.yaml not found"

Run `pnpm install` in the target monorepo first.

### "Invalid lockfile version"

Scanner requires pnpm lockfile v6.0+. Update pnpm if using older version.

### License marked as UNKNOWN

Check if:
1. `node_modules` is installed
2. Package has `license` field in package.json
3. Package has LICENSE file
