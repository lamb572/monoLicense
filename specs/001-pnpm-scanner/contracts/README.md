# Contracts: pnpm Monorepo Scanner

This directory contains JSON Schema contracts for the scanner's I/O.

## Schemas

### scan-output.schema.json

Defines the structure of successful scan output to stdout.

**Usage**: Validate JSON output from `monolicense scan --format json`

```bash
# Example validation with ajv-cli
npx ajv validate -s contracts/scan-output.schema.json -d scan-result.json
```

### scan-error.schema.json

Defines the structure of error output when scan fails.

**Usage**: Parse error responses in CI/CD pipelines

## Example Outputs

### Successful Scan

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
    "monorepoRoot": "/path/to/repo",
    "lockfileVersion": "6.0",
    "scanTimestamp": "2025-12-02T10:30:00.000Z",
    "pnpmVersion": "8.15.0"
  },
  "summary": {
    "totalProjects": 3,
    "totalDependencies": 150,
    "uniqueDependencies": 120,
    "licenseCounts": {
      "MIT": 80,
      "Apache-2.0": 25,
      "ISC": 10,
      "UNKNOWN": 5
    },
    "unknownLicenseCount": 5
  }
}
```

### Error Output

```json
{
  "error": {
    "type": "LOCKFILE_NOT_FOUND",
    "message": "pnpm-lock.yaml not found. Run 'pnpm install' first.",
    "path": "/path/to/repo/pnpm-lock.yaml"
  }
}
```

## CLI Interface Contract

```
monolicense scan [options]

Options:
  --format <type>   Output format: json (default: json)
  --root <path>     Monorepo root directory (default: cwd)
  --help            Show help

Exit Codes:
  0 - Success
  1 - Scan error (missing files, parse errors)
```
