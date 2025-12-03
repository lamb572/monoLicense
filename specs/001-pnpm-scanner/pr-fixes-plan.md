# PR #2 CodeRabbit Review Fixes Plan

**Branch**: `001-pnpm-scanner`
**PR**: https://github.com/lamb572/monoLicense/pull/2
**Date**: 2025-12-03

## Summary

This plan addresses 11 code review comments from CodeRabbit on PR #2. Issues are grouped by type and prioritized by severity.

## Constitution Alignment

All fixes align with the MonoLicense Constitution:
- **Principle I**: Functional Programming First (no mutations, no `let`)
- **Principle IV**: Type Safety & Immutability (runtime guards, readonly)

---

## Fix 1: UNEXPECTED_ERROR for Generic Exceptions

**Status**: COMPLETED
**File**: `apps/cli/src/commands/scan.ts:166-175`
**Severity**: Minor
**Issue**: Using `LOCKFILE_NOT_FOUND` for all unexpected errors is misleading

### Before
```typescript
} catch (error) {
  const errorOutput: ErrorOutput = {
    error: {
      type: 'LOCKFILE_NOT_FOUND',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
```

### After
```typescript
} catch (error) {
  const errorOutput: ErrorOutput = {
    error: {
      type: 'UNEXPECTED_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
```

### Additional Change
Add `UNEXPECTED_ERROR` to `specs/001-pnpm-scanner/contracts/scan-error.schema.json` enum.

---

## Fix 2: Remove Redundant Ternary

**Status**: COMPLETED
**File**: `libs/dependency/src/extract-dependencies.ts:36`
**Severity**: Minor
**Issue**: Ternary returns same value in both branches

### Before
```typescript
version: ref.version.startsWith('link:') ? ref.version : ref.version,
```

### After
```typescript
version: ref.version,
```

---

## Fix 3: Add Runtime Type Guard

**Status**: PENDING
**File**: `libs/parsers/src/pnpm-workspace.ts:46-48`
**Severity**: Major
**Issue**: Unsafe type assertion without runtime validation

### Before
```typescript
try {
  const raw = parseYaml(content) as RawWorkspaceConfig;
  return validateWorkspaceConfig(raw ?? { packages: [] }, path);
} catch (error) {
```

### After
```typescript
try {
  const parsed = parseYaml(content);
  if (parsed === null || parsed === undefined) {
    return validateWorkspaceConfig({ packages: [] }, path);
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    return failure(
      workspaceConfigParseError(path, 'Root must be an object')
    );
  }
  return validateWorkspaceConfig(parsed as RawWorkspaceConfig, path);
} catch (error) {
```

---

## Fix 4: Fix Regex Pattern for Project.path

**Status**: PENDING
**File**: `specs/001-pnpm-scanner/contracts/scan-output.schema.json:38`
**Severity**: Minor
**Issue**: Ungrouped alternation allows invalid absolute paths ending with `.`

### Before
```json
"pattern": "^[^/].*|\\.$"
```

### After
```json
"pattern": "^(?:\\.|[^/].*)$"
```

---

## Fix 5: Add Language to Code Block

**Status**: PENDING
**File**: `specs/001-pnpm-scanner/quickstart.md:136`
**Severity**: Minor
**Issue**: Missing language identifier (MD040)

### Before
````markdown
```
libs/
├── parsers/
````

### After
````markdown
```text
libs/
├── parsers/
````

---

## Fix 6: Remove Array Mutations

**Status**: PENDING
**File**: `libs/dependency/src/detect-monorepo.ts:30-41`
**Severity**: Major
**Issue**: Array mutations with `push` violate functional programming guidelines

### Before
```typescript
const includePatterns: string[] = [];
const excludePatterns: string[] = [];

for (const glob of workspaceGlobs) {
  if (glob.startsWith('!')) {
    excludePatterns.push(glob.slice(1));
  } else {
    includePatterns.push(glob);
  }
}
```

### After
```typescript
const includePatterns = workspaceGlobs.filter(glob => !glob.startsWith('!'));
const excludePatterns = workspaceGlobs
  .filter(glob => glob.startsWith('!'))
  .map(glob => glob.slice(1));
```

---

## Fix 7: Remove `let` Declaration

**Status**: PENDING
**File**: `libs/license/src/extract-license.ts:47-57`
**Severity**: Major
**Issue**: Uses `let` declaration which violates functional programming guidelines

### Before
```typescript
let parsed: PackageJsonLicense;

try {
  parsed = JSON.parse(packageJsonContent) as PackageJsonLicense;
} catch {
  return failure({
    type: 'PACKAGE_JSON_PARSE_ERROR',
    path: path ?? 'unknown',
    message: 'Invalid JSON in package.json',
  });
}

// ... uses parsed below
```

### After
```typescript
try {
  const parsed = JSON.parse(packageJsonContent) as PackageJsonLicense;

  // Primary: Check license field (modern format)
  if (typeof parsed.license === 'string' && parsed.license.trim()) {
    const rawLicense = parsed.license.trim();
    const normalized = normalizeLicense(rawLicense);

    return success({
      spdxId: normalized,
      source: 'package.json',
      rawValue: normalized !== rawLicense ? rawLicense : null,
    });
  }

  // Secondary: Check legacy licenses array format
  if (Array.isArray(parsed.licenses) && parsed.licenses.length > 0) {
    const firstLicense = parsed.licenses[0];
    if (firstLicense?.type) {
      const rawLicense = firstLicense.type;
      const normalized = normalizeLicense(rawLicense);

      return success({
        spdxId: normalized,
        source: 'package.json-array',
        rawValue: normalized !== rawLicense ? rawLicense : null,
      });
    }
  }

  // No license found
  return success(unknownLicense());
} catch {
  return failure({
    type: 'PACKAGE_JSON_PARSE_ERROR',
    path: path ?? 'unknown',
    message: 'Invalid JSON in package.json',
  });
}
```

---

## Fix 8: Remove Object Mutations in validateDependencyRefs

**Status**: PENDING
**File**: `libs/parsers/src/pnpm-lockfile.ts:58-76`
**Severity**: Major
**Issue**: Object mutations violate functional programming guidelines

### Before
```typescript
const validateDependencyRefs = (
  deps: unknown
): Record<string, DependencyRef> | undefined => {
  if (!deps || typeof deps !== 'object') return undefined;

  const result: Record<string, DependencyRef> = {};
  for (const [name, value] of Object.entries(deps)) {
    if (value && typeof value === 'object' && 'specifier' in value && 'version' in value) {
      const ref = value as { specifier: unknown; version: unknown };
      if (typeof ref.specifier === 'string' && typeof ref.version === 'string') {
        result[name] = {
          specifier: ref.specifier,
          version: ref.version,
        };
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
};
```

### After
```typescript
const validateDependencyRefs = (
  deps: unknown
): Record<string, DependencyRef> | undefined => {
  if (!deps || typeof deps !== 'object') return undefined;

  const entries = Object.entries(deps)
    .filter(([, value]) => {
      if (!value || typeof value !== 'object') return false;
      if (!('specifier' in value) || !('version' in value)) return false;
      const ref = value as { specifier: unknown; version: unknown };
      return typeof ref.specifier === 'string' && typeof ref.version === 'string';
    })
    .map(([name, value]) => {
      const ref = value as { specifier: string; version: string };
      return [name, { specifier: ref.specifier, version: ref.version }] as const;
    });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};
```

---

## Fix 9: Remove Object Mutations in validateImporters

**Status**: PENDING
**File**: `libs/parsers/src/pnpm-lockfile.ts:81-107`
**Severity**: Major
**Issue**: Object mutations violate functional programming guidelines

### Before
```typescript
const validateImporters = (
  importers: unknown
): Record<string, ImporterData> => {
  if (!importers || typeof importers !== 'object') return {};

  const result: Record<string, ImporterData> = {};
  for (const [path, data] of Object.entries(importers)) {
    if (data && typeof data === 'object') {
      // ... mutations to result and importerData
    }
  }
  return result;
};
```

### After
```typescript
const validateImporters = (
  importers: unknown
): Record<string, ImporterData> => {
  if (!importers || typeof importers !== 'object') return {};

  const entries = Object.entries(importers)
    .filter(([, data]) => data && typeof data === 'object')
    .map(([path, data]) => {
      const importer = data as {
        dependencies?: unknown;
        devDependencies?: unknown;
        optionalDependencies?: unknown;
      };
      const deps = validateDependencyRefs(importer.dependencies);
      const devDeps = validateDependencyRefs(importer.devDependencies);
      const optDeps = validateDependencyRefs(importer.optionalDependencies);

      const importerData: ImporterData = {
        ...(deps && { dependencies: deps }),
        ...(devDeps && { devDependencies: devDeps }),
        ...(optDeps && { optionalDependencies: optDeps }),
      };

      return [path, importerData] as const;
    });

  return Object.fromEntries(entries);
};
```

---

## Fix 10: Remove Object Mutations in validatePackages

**Status**: PENDING
**File**: `libs/parsers/src/pnpm-lockfile.ts:112-154`
**Severity**: Major
**Issue**: Object mutations violate functional programming guidelines

### Before
```typescript
const validatePackages = (
  packages: unknown
): Record<string, PackageData> => {
  // ... mutations to result and pkgData
};
```

### After
```typescript
const validatePackages = (
  packages: unknown
): Record<string, PackageData> => {
  if (!packages || typeof packages !== 'object') return {};

  const entries = Object.entries(packages)
    .filter(([, data]) => data && typeof data === 'object')
    .map(([id, data]) => {
      const pkg = data as {
        resolution?: unknown;
        dependencies?: unknown;
        dev?: unknown;
        optional?: unknown;
      };

      const resolution = pkg.resolution as { integrity?: string } | undefined;
      const integrity = resolution?.integrity ?? '';

      const dependencies =
        pkg.dependencies && typeof pkg.dependencies === 'object'
          ? Object.fromEntries(
              Object.entries(pkg.dependencies).filter(
                ([, v]) => typeof v === 'string'
              )
            )
          : null;

      const pkgData: PackageData = {
        resolution: { integrity },
        ...(dependencies && Object.keys(dependencies).length > 0 && { dependencies }),
        ...(typeof pkg.dev === 'boolean' && { dev: pkg.dev }),
        ...(typeof pkg.optional === 'boolean' && { optional: pkg.optional }),
      };

      return [id, pkgData] as const;
    });

  return Object.fromEntries(entries);
};
```

---

## Fix 11: Fix Markdown Emphasis Spacing

**Status**: PENDING
**File**: `specs/001-pnpm-scanner/tasks.md:34`
**Severity**: Minor
**Issue**: Spaces inside emphasis markers (MD037)

### Note
This appears to be a false positive - the `*` characters in `apps/*` and `libs/*` are glob patterns, not markdown emphasis. The line is correctly formatted for task list content. **No action required.**

---

## Execution Order

1. **Quick fixes** (Minor, documentation):
   - Fix 4: Regex pattern in schema
   - Fix 5: Code block language

2. **Type safety** (Major, critical):
   - Fix 3: Runtime type guard

3. **Functional programming compliance** (Major, constitution):
   - Fix 6: Array mutations
   - Fix 7: `let` declaration
   - Fix 8-10: Object mutations (3 functions in pnpm-lockfile.ts)

4. **Verification**:
   - Run `pnpm test` after each fix
   - Run `pnpm lint` to verify no new violations

---

## Verification Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] JSON schemas validate output
- [ ] No new TypeScript errors
