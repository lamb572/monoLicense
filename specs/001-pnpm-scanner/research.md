# Research: pnpm Monorepo Scanner

**Feature**: 001-pnpm-scanner
**Date**: 2025-12-02
**Status**: Complete

## Research Tasks

### 1. pnpm Lockfile Format (v6.0+)

**Decision**: Parse `pnpm-lock.yaml` using the `yaml` package with type-safe interfaces.

**Rationale**:
- pnpm lockfile v6.0+ uses YAML format with well-documented structure
- The `yaml` package (formerly `yaml` or `js-yaml`) provides fast, standards-compliant YAML parsing
- Type definitions ensure we catch format changes at compile time

**Key Lockfile Structure**:
```yaml
lockfileVersion: '6.0'
settings:
  autoInstallPeers: true
importers:
  .:                          # Root project
    dependencies:
      lodash:
        specifier: ^4.17.21
        version: 4.17.21
  apps/web:                   # Workspace member
    dependencies:
      react:
        specifier: ^18.2.0
        version: 18.2.0
packages:
  /lodash@4.17.21:
    resolution: {integrity: sha512-...}
    dev: false
  /react@18.2.0:
    resolution: {integrity: sha512-...}
    dependencies:
      loose-envify: 1.4.0
```

**Alternatives Considered**:
- `@pnpm/lockfile-file`: Official pnpm package, but adds heavy dependency chain and tightly couples to pnpm internals
- Manual parsing: More fragile, no type safety

---

### 2. License Detection Strategy

**Decision**: Multi-source license detection with fallback chain.

**Rationale**:
- Primary: `package.json` `license` field (most reliable, SPDX-compliant packages)
- Secondary: Parse LICENSE/LICENSE.md/LICENSE.txt files using pattern matching
- Tertiary: Check `package.json` `licenses` array (legacy format)
- Final: Mark as "UNKNOWN" rather than fail

**Detection Priority**:
1. `package.json` → `license` field (string)
2. `package.json` → `licenses` array (legacy) → first entry
3. LICENSE file → pattern match against known license headers
4. COPYING file → same pattern matching
5. Return "UNKNOWN"

**Alternatives Considered**:
- `license-checker`: Full-featured but overkill for our needs, adds many dependencies
- `spdx-expression-parse`: Only handles expressions, not detection
- Network lookup (npm registry): Violates offline requirement (NFR-003)

---

### 3. SPDX License Normalization

**Decision**: Use `spdx-correct` package for normalization.

**Rationale**:
- Battle-tested package maintained by npm
- Handles common variations: "MIT License" → "MIT", "Apache 2.0" → "Apache-2.0"
- Returns `null` for truly unknown licenses (we convert to "UNKNOWN")
- Small dependency footprint

**Examples**:
```typescript
spdxCorrect('MIT License')     // → 'MIT'
spdxCorrect('Apache 2.0')      // → 'Apache-2.0'
spdxCorrect('BSD')             // → 'BSD-2-Clause' (assumes common variant)
spdxCorrect('Proprietary')     // → null (we mark as 'UNKNOWN')
```

**Alternatives Considered**:
- Manual mapping table: Incomplete, maintenance burden
- `spdx-license-ids`: Only validates, doesn't correct

---

### 4. Workspace Pattern Expansion

**Decision**: Use `fast-glob` for glob pattern expansion in `pnpm-workspace.yaml`.

**Rationale**:
- `pnpm-workspace.yaml` uses glob patterns: `packages/*`, `apps/**`
- `fast-glob` is fast, well-maintained, handles negation patterns
- Returns paths synchronously or async as needed

**Example Patterns**:
```yaml
packages:
  - 'packages/*'      # Direct children of packages/
  - 'apps/**'         # All nested dirs under apps/
  - '!**/test/**'     # Exclude test directories
```

**Alternatives Considered**:
- `glob`: Slower, less maintained
- `globby`: Wrapper around fast-glob, unnecessary abstraction
- Node.js `fs.glob` (Node 22+): Available in Node 22+ but fast-glob provides better cross-version compatibility

---

### 5. Result Type Implementation

**Decision**: Custom `Result<T, E>` discriminated union per constitution.

**Rationale**:
- Constitution mandates Result pattern (Principle III)
- Simple discriminated union avoids external dependencies
- Railway-oriented composition with `map`, `flatMap` utilities

**Implementation**:
```typescript
type Result<T, E> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

const success = <T>(data: T): Result<T, never> => ({ success: true, data });
const failure = <E>(error: E): Result<never, E> => ({ success: false, error });
```

**Alternatives Considered**:
- `neverthrow`: Good library but adds dependency; our needs are simple
- `fp-ts` Either: Heavy functional library, overkill for this project
- Thrown exceptions: Violates constitution

---

### 6. Performance Optimization

**Decision**: Lazy loading with parallel file I/O.

**Rationale**:
- Must scan 500 deps in <15s, 2000 deps in <60s
- Parallel `Promise.all` for license extraction across packages
- Parse lockfile once, stream-process dependencies
- Avoid loading full node_modules into memory

**Approach**:
1. Parse lockfile (single file read)
2. Extract all package paths from lockfile
3. Parallel license extraction with concurrency limit (10-20 concurrent)
4. Aggregate results

**Alternatives Considered**:
- Sequential processing: Too slow for large monorepos
- Worker threads: Overhead not justified for I/O-bound work
- Caching: Not needed for single-run CLI tool

---

## Dependencies Summary

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| yaml | ^2.x | YAML parsing for lockfiles | ISC |
| spdx-correct | ^3.x | License normalization | Apache-2.0 |
| fast-glob | ^3.x | Workspace pattern expansion | MIT |

All dependencies are permissively licensed and have minimal transitive dependencies.

## Open Questions Resolved

All technical questions resolved. No blocking unknowns remain.
