# MonoLicense - Technical Specification

This document provides detailed technical specifications for all core components, algorithms, and behaviors in MonoLicense.

---

## Table of Contents

1. [Result Type Pattern](#1-result-type-pattern)
2. [Monorepo Detection](#2-monorepo-detection)
3. [Lockfile Parsing](#3-lockfile-parsing)
4. [Dependency Resolution](#4-dependency-resolution)
5. [License Extraction and Normalization](#5-license-extraction-and-normalization)
6. [License Recommendation System](#6-license-recommendation-system)
7. [License Data Update Mechanism](#7-license-data-update-mechanism)
8. [License Data API Specification](#8-license-data-api-specification)
9. [Policy Evaluation Logic](#9-policy-evaluation-logic)
10. [Report Generation Process](#10-report-generation-process)
11. [Caching Strategy](#11-caching-strategy)
12. [Performance Optimization](#12-performance-optimization)

---

## 1. Result Type Pattern

### 1.1 Error Handling Philosophy

MonoLicense uses **Result types** for all fallible operations instead of throwing exceptions. This approach:
- Makes errors explicit in function signatures
- Forces callers to handle errors
- Enables functional composition
- Eliminates try/catch blocks in business logic

### 1.2 Result Type Definition

```typescript
/**
 * Result type for operations that can succeed or fail
 *
 * @template T - Success value type
 * @template E - Error type
 */
type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };
```

### 1.3 Using Result Types

**Creating success results**:
```typescript
const createSuccess = <T>(value: T): Result<T, never> => {
  return { success: true, value };
};
```

**Creating error results**:
```typescript
const createError = <E>(error: E): Result<never, E> => {
  return { success: false, error };
};
```

**Pattern matching on Results**:
```typescript
const handleResult = async (path: string): Promise<void> => {
  const result = await parsePnpmLockfile(path);

  if (!result.success) {
    // Handle error
    console.error(`Failed to parse lockfile: ${result.error.message}`);
    return;
  }

  // Use success value
  const lockfileData = result.value;
  console.log(`Parsed ${lockfileData.type} lockfile`);
};
```

### 1.4 When to Throw vs Return Result

**Return Result<T, E>**: All business logic and library functions
- Lockfile parsing
- License extraction
- Policy evaluation
- Data validation

**Throw exceptions**: Only at IO boundaries
- CLI entry points (to show error and exit)
- API route handlers (to return HTTP error responses)
- File system operations (already throw by default)

---

## 2. Monorepo Detection

### 2.1 Detection Algorithm

MonoLicense must detect the monorepo type and identify all workspaces/projects before scanning.

```typescript
/**
 * Detects monorepo type and workspaces
 *
 * @param rootPath - Root directory to scan
 * @returns Monorepo detection result with type and projects
 */
const detectMonorepo = async (rootPath: string): Promise<Result<MonorepoDetectionResult, never>> => {
  // Step 1: Check for workspace configuration files in priority order
  const detectors = [
    detectPnpmWorkspaces,
    detectNpmWorkspaces,
    detectYarnWorkspaces,
    detectRushMonorepo,
    detectLernaMonorepo
  ];

  for (const detector of detectors) {
    const result = await detector(rootPath);
    if (result.success && result.value.detected) {
      return result;
    }
  }

  // Step 2: If no workspace config found, treat as single-project repo
  return {
    success: true,
    value: {
      detected: false,
      type: 'single-project',
      projects: [{ name: 'root', path: rootPath }]
    }
  };
};
```

### 2.2 pnpm Workspace Detection

**File**: `pnpm-workspace.yaml`

```typescript
/**
 * Detects pnpm workspaces configuration
 *
 * @param rootPath - Root directory to scan
 * @returns Detection result with workspace projects
 */
const detectPnpmWorkspaces = async (rootPath: string): Promise<Result<MonorepoDetectionResult, InvalidWorkspaceConfigError>> => {
  const workspaceFile = path.join(rootPath, 'pnpm-workspace.yaml');

  if (!await fileExists(workspaceFile)) {
    return { success: true, value: { detected: false } };
  }

  const content = await readFile(workspaceFile, 'utf-8');
  const config = parseYaml(content);

  if (!config.packages || !Array.isArray(config.packages)) {
    return {
      success: false,
      error: createInvalidWorkspaceConfigError('pnpm-workspace.yaml missing packages array')
    };
  }

  // Expand glob patterns to find all matching directories
  const projects: Project[] = [];
  for (const pattern of config.packages) {
    const matches = await glob(pattern, { cwd: rootPath, onlyDirectories: true });

    for (const match of matches) {
      const projectPath = path.join(rootPath, match);
      const packageJson = await readPackageJson(projectPath);

      if (packageJson) {
        projects.push({
          name: packageJson.name || path.basename(match),
          path: projectPath,
          packageManager: 'pnpm'
        });
      }
    }
  }

  return {
    success: true,
    value: {
      detected: true,
      type: 'pnpm-workspace',
      projects,
      lockfileLocation: path.join(rootPath, 'pnpm-lock.yaml')
    }
  };
};
```

### 2.3 npm Workspace Detection

**File**: `package.json` (root)

```typescript
/**
 * Detects npm workspaces configuration
 *
 * @param rootPath - Root directory to scan
 * @returns Detection result with workspace projects
 */
const detectNpmWorkspaces = async (rootPath: string): Promise<Result<MonorepoDetectionResult, InvalidWorkspaceConfigError>> => {
  const packageJsonPath = path.join(rootPath, 'package.json');
  const packageJson = await readPackageJson(rootPath);

  if (!packageJson || !packageJson.workspaces) {
    return { success: true, value: { detected: false } };
  }

  // npm workspaces can be array or object with "packages" key
  const workspacePatterns = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces.packages;

  if (!workspacePatterns || !Array.isArray(workspacePatterns)) {
    return {
      success: false,
      error: createInvalidWorkspaceConfigError('Invalid workspaces configuration in package.json')
    };
  }

  const projects = await expandWorkspacePatterns(rootPath, workspacePatterns, 'npm');

  return {
    success: true,
    value: {
      detected: true,
      type: 'npm-workspace',
      projects,
      lockfileLocation: path.join(rootPath, 'package-lock.json')
    }
  };
};
```

### 2.4 Yarn Workspace Detection

**Files**: `package.json` (root) with `workspaces` field

```typescript
/**
 * Detects Yarn workspaces configuration
 *
 * @param rootPath - Root directory to scan
 * @returns Detection result with workspace projects
 */
const detectYarnWorkspaces = async (rootPath: string): Promise<Result<MonorepoDetectionResult, never>> => {
  const packageJson = await readPackageJson(rootPath);

  if (!packageJson || !packageJson.workspaces) {
    return { success: true, value: { detected: false } };
  }

  // Yarn Berry (v2+) check
  const yarnrcPath = path.join(rootPath, '.yarnrc.yml');
  const isYarnBerry = await fileExists(yarnrcPath);

  const workspacePatterns = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces.packages;

  const projects = await expandWorkspacePatterns(rootPath, workspacePatterns, 'yarn');

  return {
    success: true,
    value: {
      detected: true,
      type: isYarnBerry ? 'yarn-berry-workspace' : 'yarn-classic-workspace',
      projects,
      lockfileLocation: path.join(rootPath, isYarnBerry ? 'yarn.lock' : 'yarn.lock')
    }
  };
};
```

### 2.5 Rush Monorepo Detection

**File**: `rush.json`

```typescript
/**
 * Detects Rush monorepo configuration
 *
 * @param rootPath - Root directory to scan
 * @returns Detection result with Rush projects
 */
const detectRushMonorepo = async (rootPath: string): Promise<Result<MonorepoDetectionResult, InvalidWorkspaceConfigError>> => {
  const rushJsonPath = path.join(rootPath, 'rush.json');

  if (!await fileExists(rushJsonPath)) {
    return { success: true, value: { detected: false } };
  }

  const rushConfig = await readJsonFile(rushJsonPath);

  if (!rushConfig.projects || !Array.isArray(rushConfig.projects)) {
    return {
      success: false,
      error: createInvalidWorkspaceConfigError('rush.json missing projects array')
    };
  }

  const projects: Project[] = [];
  for (const project of rushConfig.projects) {
    const projectPath = path.join(rootPath, project.projectFolder);
    const packageJson = await readPackageJson(projectPath);

    projects.push({
      name: project.packageName,
      path: projectPath,
      packageManager: 'rush'
    });
  }

  return {
    success: true,
    value: {
      detected: true,
      type: 'rush-monorepo',
      projects,
      lockfileLocation: path.join(rootPath, 'common/config/rush/pnpm-lock.yaml')
    }
  };
};
```

### 2.6 Lerna Monorepo Detection

**File**: `lerna.json`

Lerna is a monorepo management tool that can work with npm, yarn, or pnpm as the underlying package manager. The lockfile location depends on the `npmClient` configuration.

```typescript
/**
 * Detects Lerna monorepo configuration
 *
 * @param rootPath - Root directory to scan
 * @returns Detection result with Lerna projects
 */
const detectLernaMonorepo = async (rootPath: string): Promise<Result<MonorepoDetectionResult, InvalidWorkspaceConfigError>> => {
  const lernaJsonPath = path.join(rootPath, 'lerna.json');

  if (!await fileExists(lernaJsonPath)) {
    return { success: true, value: { detected: false } };
  }

  const lernaConfig = await readJsonFile(lernaJsonPath);

  // Lerna 7+ moved packages to lerna.json, older versions may use package.json workspaces
  const packagePatterns = lernaConfig.packages || ['packages/*'];

  // Determine lockfile based on npmClient (defaults to npm)
  const npmClient = lernaConfig.npmClient || 'npm';
  const lockfileLocation = getLockfileForClient(rootPath, npmClient);

  const projects: Project[] = [];
  for (const pattern of packagePatterns) {
    const matches = await glob(pattern, { cwd: rootPath, onlyDirectories: true });

    for (const match of matches) {
      const projectPath = path.join(rootPath, match);
      const packageJson = await readPackageJson(projectPath);

      if (packageJson) {
        projects.push({
          name: packageJson.name || path.basename(match),
          path: projectPath,
          packageManager: npmClient
        });
      }
    }
  }

  return {
    success: true,
    value: {
      detected: true,
      type: 'lerna-monorepo',
      projects,
      lockfileLocation
    }
  };
};

/**
 * Returns the lockfile path based on the npm client
 */
const getLockfileForClient = (rootPath: string, npmClient: string): string => {
  switch (npmClient) {
    case 'pnpm':
      return path.join(rootPath, 'pnpm-lock.yaml');
    case 'yarn':
      return path.join(rootPath, 'yarn.lock');
    case 'npm':
    default:
      return path.join(rootPath, 'package-lock.json');
  }
};
```

**Lerna Configuration Notes**:

| Property | Description | Default |
|----------|-------------|---------|
| `packages` | Glob patterns for package locations | `['packages/*']` |
| `npmClient` | Package manager: `npm`, `yarn`, or `pnpm` | `npm` |
| `version` | Lerna version mode: `independent` or fixed version | - |
| `useWorkspaces` | Delegate to npm/yarn/pnpm workspaces | `false` |

When `useWorkspaces: true`, Lerna delegates project discovery to the underlying package manager's workspace configuration, and the appropriate workspace detector (pnpm, npm, or yarn) takes precedence.

---

## 3. Lockfile Parsing

### 3.1 General Parsing Strategy

Each package manager has a dedicated parser that implements the `LockfileParser` interface:

```typescript
interface LockfileParser {
  parse(lockfilePath: string): Promise<Result<LockfileData, LockfileError>>;
  extractDependencies(lockfileData: LockfileData, projectPath: string): Promise<Result<readonly Dependency[], Error>>;
}
```

### 3.2 pnpm Lockfile Parser

**File format**: YAML v6.0+ (newer versions use v9.0)

```typescript
/**
 * Parses a pnpm lockfile and extracts lockfile data
 *
 * @param lockfilePath - Absolute path to pnpm-lock.yaml
 * @returns Parsed lockfile data
 * @throws InvalidLockfileError if lockfileVersion is missing
 * @throws UnsupportedLockfileVersionError if version is below 6.0
 */
const parsePnpmLockfile = async (lockfilePath: string): Promise<Result<LockfileData, LockfileError>> => {
  const content = await readFile(lockfilePath, 'utf-8');
  const parsed = parseYaml(content);

  if (!parsed.lockfileVersion) {
    return {
      success: false,
      error: createInvalidLockfileError('Missing lockfileVersion in pnpm-lock.yaml')
    };
  }

  // pnpm v6+ uses lockfileVersion: '6.0' or higher
  const version = parseFloat(parsed.lockfileVersion);
  if (version < 6.0) {
    return {
      success: false,
      error: createUnsupportedLockfileVersionError(
        `pnpm lockfile version ${version} not supported. Please upgrade to pnpm 8+`
      )
    };
  }

  return {
    success: true,
    value: {
      type: 'pnpm' as const,
      version: parsed.lockfileVersion,
      packages: parsed.packages || {},
      importers: parsed.importers || {},
      raw: parsed
    }
  };
};

/**
 * Parses version spec from pnpm lockfile format
 * pnpm format: "1.2.3" or "1.2.3_peer@4.5.6"
 *
 * @param versionSpec - Version specification string
 * @returns Extracted version number
 */
const parsePnpmVersionSpec = (versionSpec: string): string => {
  return versionSpec.split('_')[0];
};

/**
 * Extracts dependencies from pnpm lockfile data for a specific project
 *
 * @param lockfileData - Parsed pnpm lockfile data
 * @param projectPath - Absolute path to the project
 * @returns Array of resolved dependencies
 * @throws ProjectNotFoundError if project is not found in importers
 */
const extractPnpmDependencies = async (
  lockfileData: LockfileData,
  projectPath: string
): Promise<Result<readonly Dependency[], ProjectNotFoundError>> => {
  const rootPath = path.dirname(lockfileData.filePath);
  const relativePath = path.relative(rootPath, projectPath);

  // Find the importer for this project
  const importerKey = relativePath || '.';
  const importer = lockfileData.importers[importerKey];

  if (!importer) {
    return {
      success: false,
      error: createProjectNotFoundError(
        `Project at ${projectPath} not found in pnpm-lock.yaml importers`
      )
    };
  }

  // Combine dependencies, devDependencies, and optionalDependencies
  const allDeps = {
    ...importer.dependencies,
    ...importer.devDependencies,
    ...importer.optionalDependencies
  };

  const dependencies = Object.entries(allDeps).reduce<Dependency[]>((acc, [name, versionSpec]) => {
    // pnpm uses format like "1.2.3" or "link:../other-package"
    if (versionSpec.startsWith('link:')) {
      // Internal workspace dependency - skip or mark as internal
      return acc;
    }

    // Extract exact version from versionSpec
    const version = parsePnpmVersionSpec(versionSpec);

    // Look up package details in packages section
    const packageKey = `/${name}/${version}`;
    const packageInfo = lockfileData.packages[packageKey];

    if (!packageInfo) {
      console.warn(`Package ${name}@${version} not found in packages section`);
      return acc;
    }

    return [
      ...acc,
      {
        name,
        version,
        isDev: !!importer.devDependencies?.[name],
        isOptional: !!importer.optionalDependencies?.[name],
        resolved: packageInfo.resolution?.tarball || packageInfo.resolution?.integrity,
        integrity: packageInfo.resolution?.integrity
      }
    ];
  }, []);

  return { success: true, value: dependencies };
};
```

### 3.3 npm Lockfile Parser

**File format**: JSON (lockfileVersion 2 or 3)

```typescript
/**
 * Parses an npm lockfile and extracts lockfile data
 *
 * @param lockfilePath - Absolute path to package-lock.json
 * @returns Parsed lockfile data
 * @throws InvalidLockfileError if lockfileVersion is missing
 * @throws UnsupportedLockfileVersionError if version is below 2
 */
const parseNpmLockfile = async (lockfilePath: string): Promise<Result<LockfileData, LockfileError>> => {
  const content = await readFile(lockfilePath, 'utf-8');
  const parsed = JSON.parse(content);

  if (!parsed.lockfileVersion) {
    return {
      success: false,
      error: createInvalidLockfileError('Missing lockfileVersion in package-lock.json')
    };
  }

  if (parsed.lockfileVersion < 2) {
    return {
      success: false,
      error: createUnsupportedLockfileVersionError(
        'npm lockfile version 1 not supported. Please upgrade to npm 7+'
      )
    };
  }

  return {
    success: true,
    value: {
      type: 'npm' as const,
      version: parsed.lockfileVersion,
      packages: parsed.packages || {},
      raw: parsed
    }
  };
};

/**
 * Extracts package name from npm node_modules path
 *
 * @param pkgPath - Path in node_modules (e.g., "node_modules/@scope/package")
 * @returns Package name or null if path doesn't match expected format
 */
const extractNpmPackageName = (pkgPath: string): string | null => {
  const match = pkgPath.match(/node_modules\/(@?[^/]+(?:\/[^/]+)?)/);
  return match ? match[1] : null;
};

/**
 * Extracts dependencies from npm lockfile data for a specific project
 *
 * @param lockfileData - Parsed npm lockfile data
 * @param projectPath - Absolute path to the project
 * @returns Array of resolved dependencies
 */
const extractNpmDependencies = async (
  lockfileData: LockfileData,
  projectPath: string
): Promise<Result<readonly Dependency[], never>> => {
  const rootPath = path.dirname(lockfileData.filePath);
  const relativePath = path.relative(rootPath, projectPath);

  // npm v7+ uses "packages" with node_modules paths
  const prefix = relativePath ? `node_modules/${relativePath}/` : '';

  const dependencies = Object.entries(lockfileData.packages).reduce<Dependency[]>((acc, [pkgPath, pkgInfo]) => {
    // Skip root package and workspace packages
    if (pkgPath === '' || pkgPath.startsWith('node_modules/.pnpm')) {
      return acc;
    }

    // Extract package name and version
    const name = extractNpmPackageName(pkgPath);
    if (!name) return acc;

    const version = pkgInfo.version;
    if (!version) return acc;

    return [
      ...acc,
      {
        name,
        version,
        isDev: !!pkgInfo.dev,
        isOptional: !!pkgInfo.optional,
        resolved: pkgInfo.resolved,
        integrity: pkgInfo.integrity
      }
    ];
  }, []);

  return { success: true, value: dependencies };
};
```

### 3.4 Yarn Lockfile Parser

**File format**: Custom YAML-like format (Yarn Classic) or YAML (Yarn Berry)

```typescript
/**
 * Detects whether a yarn.lock file is Yarn Berry (v2+) or Yarn Classic (v1)
 *
 * @param content - Raw yarn.lock file content
 * @returns True if Yarn Berry, false if Yarn Classic
 */
const isYarnBerry = (content: string): boolean => {
  return content.includes('__metadata:');
};

/**
 * Parses a Yarn lockfile and extracts lockfile data
 *
 * @param lockfilePath - Absolute path to yarn.lock
 * @returns Parsed lockfile data
 * @throws InvalidLockfileError if parsing fails
 */
const parseYarnLockfile = async (lockfilePath: string): Promise<Result<LockfileData, LockfileError>> => {
  const content = await readFile(lockfilePath, 'utf-8');
  const isBerry = isYarnBerry(content);

  let parsed;
  if (isBerry) {
    parsed = parseYaml(content);
  } else {
    // Use @yarnpkg/lockfile parser for Yarn Classic
    const lockfile = require('@yarnpkg/lockfile');
    const result = lockfile.parse(content);
    if (result.type !== 'success') {
      return {
        success: false,
        error: createInvalidLockfileError('Failed to parse yarn.lock')
      };
    }
    parsed = result.object;
  }

  return {
    success: true,
    value: {
      type: (isBerry ? 'yarn-berry' : 'yarn-classic') as const,
      version: isBerry ? '2+' : '1',
      packages: parsed,
      raw: parsed
    }
  };
};

/**
 * Extracts primary package name from Yarn lockfile key
 * Yarn Classic format: "package-name@^1.0.0, package-name@~1.0.0"
 * Yarn Berry format: "package-name@npm:1.0.0"
 *
 * @param key - Lockfile entry key
 * @returns Package name
 */
const extractYarnPackageName = (key: string): string => {
  const names = key.split(', ');
  return names[0].split('@')[0];
};

/**
 * Extracts dependencies from Yarn lockfile data for a specific project
 *
 * @param lockfileData - Parsed Yarn lockfile data
 * @param projectPath - Absolute path to the project
 * @returns Array of resolved dependencies
 */
const extractYarnDependencies = async (
  lockfileData: LockfileData,
  projectPath: string
): Promise<Result<readonly Dependency[], never>> => {
  const dependencies = Object.entries(lockfileData.packages).reduce<Dependency[]>((acc, [key, pkgInfo]) => {
    // Skip metadata entries
    if (key === '__metadata') return acc;

    const name = extractYarnPackageName(key);
    const version = pkgInfo.version;

    if (!version) return acc;

    return [
      ...acc,
      {
        name,
        version,
        isDev: false, // Yarn lockfile doesn't distinguish dev deps
        isOptional: false,
        resolved: pkgInfo.resolved,
        integrity: pkgInfo.integrity
      }
    ];
  }, []);

  return { success: true, value: dependencies };
};
```

---

## 4. Dependency Resolution

### 4.1 Dependency Graph Construction

After parsing lockfiles, MonoLicense builds an in-memory dependency graph to:
- Deduplicate packages across projects
- Track which projects use which dependencies
- Enable efficient license extraction (extract once, use many times)

```typescript
/**
 * Creates a package cache key from name and version
 *
 * @param name - Package name
 * @param version - Package version
 * @returns Cache key string
 */
const createPackageKey = (name: string, version: string): string => {
  return `${name}@${version}`;
};

/**
 * Searches for package.json in local node_modules
 *
 * @param packageName - Name of the package to find
 * @returns Package.json contents or null if not found
 */
const findLocalPackageJson = async (packageName: string): Promise<any | null> => {
  // Search in node_modules, handling scoped packages
  const searchPaths = [
    `node_modules/${packageName}/package.json`,
    `**/node_modules/${packageName}/package.json`
  ];

  for (const searchPath of searchPaths) {
    const matches = await glob(searchPath, { cwd: process.cwd() });
    if (matches.length > 0) {
      return await readJsonFile(matches[0]);
    }
  }

  return null;
};

/**
 * Fetches package information from npm registry
 *
 * @param name - Package name
 * @param version - Package version
 * @returns Package information
 * @throws PackageNotFoundError if package is not found in registry
 */
const fetchFromRegistry = async (name: string, version: string): Promise<Result<PackageInfo, PackageNotFoundError>> => {
  const url = `https://registry.npmjs.org/${name}/${version}`;
  const response = await fetch(url);

  if (!response.ok) {
    return {
      success: false,
      error: createPackageNotFoundError(`Package ${name}@${version} not found in registry`)
    };
  }

  const data = await response.json();
  return {
    success: true,
    value: extractPackageInfo(data)
  };
};

/**
 * Extracts package information from package.json data
 *
 * @param packageJson - Raw package.json data
 * @returns Structured package information
 */
const extractPackageInfo = (packageJson: any): PackageInfo => {
  return {
    name: packageJson.name,
    version: packageJson.version,
    license: extractLicense(packageJson),
    repository: packageJson.repository,
    homepage: packageJson.homepage,
    author: packageJson.author,
    publisher: extractPublisher(packageJson)
  };
};

/**
 * Fetches package information with cache support
 *
 * @param name - Package name
 * @param version - Package version
 * @param cache - Package cache map
 * @returns Package information
 */
const fetchPackageInfo = async (
  name: string,
  version: string,
  cache: ReadonlyMap<string, PackageInfo>
): Promise<Result<PackageInfo, PackageNotFoundError>> => {
  const cacheKey = createPackageKey(name, version);

  // Check cache first
  if (cache.has(cacheKey)) {
    return { success: true, value: cache.get(cacheKey)! };
  }

  // Try to find package.json in node_modules first (faster)
  const localPackageJson = await findLocalPackageJson(name);

  if (localPackageJson && localPackageJson.version === version) {
    return { success: true, value: extractPackageInfo(localPackageJson) };
  }

  // Fallback to npm registry API (slower)
  return await fetchFromRegistry(name, version);
};

/**
 * Resolves a single dependency to include package information
 *
 * @param dep - Dependency to resolve
 * @param packages - Map of already resolved packages
 * @param cache - Package cache
 * @returns Resolved dependency with license information
 */
const resolveSingleDependency = async (
  dep: Dependency,
  packages: Map<string, PackageInfo>,
  cache: ReadonlyMap<string, PackageInfo>
): Promise<Result<ResolvedDependency, PackageNotFoundError>> => {
  const packageKey = createPackageKey(dep.name, dep.version);

  // Check if already in packages map
  if (!packages.has(packageKey)) {
    const result = await fetchPackageInfo(dep.name, dep.version, cache);
    if (!result.success) {
      return result;
    }
    packages.set(packageKey, result.value);
  }

  const packageInfo = packages.get(packageKey)!;

  return {
    success: true,
    value: {
      ...dep,
      packageKey,
      license: packageInfo.license
    }
  };
};

/**
 * Resolves all dependencies for a single project
 *
 * @param project - Project to resolve dependencies for
 * @param lockfileData - Parsed lockfile data
 * @param packages - Shared packages map for deduplication
 * @param cache - Package cache
 * @returns Array of resolved dependencies for the project
 */
const resolveProjectDependencies = async (
  project: Project,
  lockfileData: LockfileData,
  packages: Map<string, PackageInfo>,
  cache: ReadonlyMap<string, PackageInfo>
): Promise<Result<readonly ResolvedDependency[], Error>> => {
  const parser = getParserForLockfile(lockfileData.type);
  const depsResult = await parser.extractDependencies(lockfileData, project.path);

  if (!depsResult.success) {
    return depsResult;
  }

  const resolvedDeps: ResolvedDependency[] = [];

  for (const dep of depsResult.value) {
    const result = await resolveSingleDependency(dep, packages, cache);
    if (!result.success) {
      return result;
    }
    resolvedDeps.push(result.value);
  }

  return { success: true, value: resolvedDeps };
};

/**
 * Resolves dependencies for all projects and builds dependency graph
 *
 * @param projects - Array of projects to resolve
 * @param lockfileData - Parsed lockfile data
 * @param cache - Optional package cache (defaults to empty map)
 * @returns Complete dependency graph with deduplicated packages
 */
const resolveDependencies = async (
  projects: readonly Project[],
  lockfileData: LockfileData,
  cache: ReadonlyMap<string, PackageInfo> = new Map()
): Promise<Result<DependencyGraph, Error>> => {
  const packages = new Map<string, PackageInfo>();
  const projectDependencies = new Map<string, readonly ResolvedDependency[]>();

  for (const project of projects) {
    const result = await resolveProjectDependencies(project, lockfileData, packages, cache);

    if (!result.success) {
      return result;
    }

    projectDependencies.set(project.name, result.value);
  }

  return {
    success: true,
    value: {
      packages,
      projectDependencies
    }
  };
};
```

### 4.2 Internal Package Detection

MonoLicense must identify internal/workspace packages to exclude them from compliance checks:

```typescript
function isInternalPackage(
  dependency: Dependency,
  projects: Project[],
  autoApproveConfig?: AutoApproveConfig
): boolean {
  // Check if package name matches any workspace package
  const isWorkspacePackage = projects.some(p => p.packageName === dependency.name);

  if (isWorkspacePackage) {
    return true;
  }

  // Check auto-approve publisher patterns
  if (autoApproveConfig?.publishers) {
    for (const pattern of autoApproveConfig.publishers) {
      if (dependency.name.match(pattern)) {
        return true;
      }
    }
  }

  return false;
}
```

---

## 5. License Extraction and Normalization

### 5.1 License Extraction Strategy

License information can be found in multiple places, checked in order of preference:

```typescript
/**
 * Common non-SPDX license format mappings
 */
const LICENSE_MAPPINGS: Record<string, string> = {
  'BSD': 'BSD-3-Clause',
  'Apache 2.0': 'Apache-2.0',
  'Apache-2': 'Apache-2.0',
  'GPLv2': 'GPL-2.0',
  'GPLv3': 'GPL-3.0',
  'UNLICENSED': 'UNLICENSED',
  'SEE LICENSE IN LICENSE': 'SEE-LICENSE'
} as const;

/**
 * Common license file names to search for
 */
const LICENSE_FILE_NAMES: readonly string[] = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'LICENCE',
  'COPYING',
  'COPYRIGHT'
] as const;

/**
 * Converts a license string to SPDX identifier
 *
 * @param license - License string to convert
 * @returns SPDX identifier or null if cannot be determined
 */
const toSpdxIdentifier = (license: string): string | null => {
  // Use spdx-correct library for validation and correction
  const spdx = require('spdx-correct');
  const corrected = spdx(license);

  if (corrected) {
    return corrected;
  }

  // Handle common non-SPDX formats
  return LICENSE_MAPPINGS[license] || null;
};

/**
 * Normalizes license string or object to LicenseInfo
 *
 * @param licenseString - License from package.json (string or object)
 * @returns Normalized license information
 */
const normalizeLicense = (licenseString: string | object): LicenseInfo => {
  // Handle object format: { type: "MIT", url: "..." }
  if (typeof licenseString === 'object' && licenseString.type) {
    licenseString = licenseString.type;
  }

  if (typeof licenseString !== 'string') {
    return { type: 'UNKNOWN', spdxId: null, raw: licenseString, confidence: 'none' };
  }

  // Normalize to SPDX identifier
  const spdxId = toSpdxIdentifier(licenseString.trim());

  return {
    type: spdxId || 'UNKNOWN',
    spdxId,
    raw: licenseString,
    confidence: spdxId ? 'high' : 'low'
  };
};

/**
 * Detects license type from license file content using pattern matching
 *
 * @param licenseText - Content of license file
 * @returns Detected SPDX license identifier or null
 */
const detectLicenseType = (licenseText: string): string | null => {
  // Common license text patterns
  if (licenseText.includes('MIT License')) return 'MIT';
  if (licenseText.includes('Apache License, Version 2.0')) return 'Apache-2.0';
  if (licenseText.includes('BSD 3-Clause')) return 'BSD-3-Clause';
  if (licenseText.includes('GNU GENERAL PUBLIC LICENSE Version 2')) return 'GPL-2.0';
  if (licenseText.includes('GNU GENERAL PUBLIC LICENSE Version 3')) return 'GPL-3.0';
  if (licenseText.includes('ISC License')) return 'ISC';

  return null;
};

/**
 * Parses license file and attempts to detect license type
 *
 * @param filePath - Path to license file
 * @returns License information extracted from file
 */
const parseLicenseFile = async (filePath: string): Promise<LicenseInfo> => {
  const content = await readFile(filePath, 'utf-8');

  // Use license-checker or spdx-license-ids to detect license type
  // This is heuristic-based and may not be 100% accurate
  const detectedType = detectLicenseType(content);

  return {
    type: detectedType || 'SEE-LICENSE',
    spdxId: detectedType,
    raw: filePath,
    confidence: detectedType ? 'medium' : 'low',
    fileContent: content.substring(0, 500) // First 500 chars for reference
  };
};

/**
 * Searches for license file in package directory
 *
 * @param packageInfo - Package information
 * @returns Path to license file or null if not found
 */
const findLicenseFile = async (packageInfo: PackageInfo): Promise<string | null> => {
  const packagePath = await resolvePackagePath(packageInfo);
  if (!packagePath) return null;

  for (const fileName of LICENSE_FILE_NAMES) {
    const filePath = path.join(packagePath, fileName);
    if (await fileExists(filePath)) {
      return filePath;
    }
  }

  return null;
};

/**
 * Extracts license information from package information
 * Checks multiple sources in order of preference:
 * 1. package.json "license" field
 * 2. package.json "licenses" array (deprecated)
 * 3. LICENSE file in package
 * 4. Repository metadata
 * 5. Unknown/missing
 *
 * @param packageInfo - Package information
 * @returns License information
 */
const extractLicense = async (packageInfo: PackageInfo): Promise<LicenseInfo> => {
  // 1. Check package.json "license" field (preferred)
  if (packageInfo.license) {
    return normalizeLicense(packageInfo.license);
  }

  // 2. Check package.json "licenses" array (deprecated but still used)
  if (packageInfo.licenses && Array.isArray(packageInfo.licenses)) {
    const licenses = packageInfo.licenses.map(l =>
      typeof l === 'string' ? l : l.type
    );
    return {
      type: 'multiple',
      licenses: licenses.map(l => normalizeLicense(l)),
      raw: packageInfo.licenses
    };
  }

  // 3. Look for LICENSE file in package (if locally available)
  const licenseFile = await findLicenseFile(packageInfo);
  if (licenseFile) {
    return await parseLicenseFile(licenseFile);
  }

  // 4. Check repository metadata from npm registry
  if (packageInfo.repository) {
    const repoLicense = await extractFromRepository(packageInfo.repository);
    if (repoLicense) {
      return repoLicense;
    }
  }

  // 5. Unknown/missing license
  return {
    type: 'UNKNOWN',
    spdxId: null,
    raw: null,
    confidence: 'none'
  };
};
```

### 5.2 License Normalization Rules

- All licenses MUST be converted to SPDX identifiers where possible
- Dual licenses should be represented as `(MIT OR Apache-2.0)`
- Conjunctive licenses should be represented as `(MIT AND BSD-3-Clause)`
- Unknown licenses should be marked as `UNKNOWN` with raw value preserved
- Missing licenses should be flagged as violations

---

## 6. License Recommendation System

### 6.1 Tier System Logic

The license recommendation engine categorizes licenses into 5 tiers based on community consensus and legal risk:

```typescript
interface LicenseTier {
  name: string;
  description: string;
  recommendedPolicy: 'allow' | 'review' | 'forbid';
  licenses: string[];
}

const LICENSE_TIERS: Record<string, LicenseTier> = {
  'universally-accepted': {
    name: 'Universally Accepted',
    description: 'Permissive licenses with minimal restrictions, widely accepted in commercial and open-source projects',
    recommendedPolicy: 'allow',
    licenses: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD']
  },
  'generally-accepted': {
    name: 'Generally Accepted',
    description: 'Public domain equivalent licenses, generally safe but less common',
    recommendedPolicy: 'allow',
    licenses: ['Unlicense', 'CC0-1.0', 'WTFPL']
  },
  'situational': {
    name: 'Situational',
    description: 'Licenses with copyleft or specific requirements, may be acceptable depending on use case',
    recommendedPolicy: 'review',
    licenses: ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'EPL-1.0', 'EPL-2.0', 'CDDL-1.0']
  },
  'restrictive': {
    name: 'Restrictive',
    description: 'Strong copyleft licenses requiring derivative works to use same license',
    recommendedPolicy: 'forbid',
    licenses: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0']
  },
  'unknown': {
    name: 'Unknown or Custom',
    description: 'Licenses not recognized or custom licenses requiring manual review',
    recommendedPolicy: 'review',
    licenses: ['UNKNOWN', 'SEE-LICENSE', 'UNLICENSED', 'CUSTOM']
  }
};
```

### 6.2 License Metadata Structure

Each license has detailed metadata to help users understand implications:

```typescript
interface LicenseMetadata {
  spdxId: string;
  name: string;
  tier: string;
  category: 'permissive' | 'weak-copyleft' | 'strong-copyleft' | 'public-domain' | 'proprietary' | 'unknown';
  mustIncludeCopyright: boolean;
  mustIncludeLicense: boolean;
  mustDiscloseSource: boolean;
  canUseCommercially: boolean;
  canModify: boolean;
  canDistribute: boolean;
  mustShareAlike: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  description: string;
  url: string;
}

// Example metadata
const MIT_METADATA: LicenseMetadata = {
  spdxId: 'MIT',
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
  description: 'A permissive license that allows commercial use, modification, and distribution with minimal requirements',
  url: 'https://opensource.org/licenses/MIT'
};
```

### 6.3 Policy Recommendation Algorithm

During `monolicense init`, the system analyzes existing dependencies to recommend a policy:

```typescript
async function recommendPolicy(
  dependencies: ResolvedDependency[],
  licenseData: LicenseRecommendationData,
  threshold: number = 90
): Promise<PolicyRecommendation> {
  const licenseCounts = new Map<string, number>();
  const tierCounts = new Map<string, number>();

  // Count license occurrences
  for (const dep of dependencies) {
    const license = dep.license.type;
    licenseCounts.set(license, (licenseCounts.get(license) || 0) + 1);

    const tier = licenseData.getTierForLicense(license);
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
  }

  const totalDeps = dependencies.length;
  const coveredDeps = Array.from(licenseCounts.entries())
    .filter(([license]) => {
      const tier = licenseData.getTierForLicense(license);
      return tier === 'universally-accepted' || tier === 'generally-accepted';
    })
    .reduce((sum, [, count]) => sum + count, 0);

  const coveragePercentage = (coveredDeps / totalDeps) * 100;

  // Generate recommended policy
  const allowedLicenses: string[] = [];
  const reviewLicenses: string[] = [];
  const forbiddenLicenses: string[] = [];

  // Add all universally and generally accepted licenses to allowed
  allowedLicenses.push(...LICENSE_TIERS['universally-accepted'].licenses);
  if (coveragePercentage >= threshold) {
    allowedLicenses.push(...LICENSE_TIERS['generally-accepted'].licenses);
  }

  // Handle situational licenses based on actual usage
  for (const [license, count] of licenseCounts.entries()) {
    const metadata = licenseData.metadata[license];
    if (!metadata) continue;

    if (metadata.tier === 'situational') {
      // If used by more than 5% of dependencies, allow it
      if ((count / totalDeps) * 100 > 5) {
        allowedLicenses.push(license);
      } else {
        reviewLicenses.push(license);
      }
    }
  }

  // Always forbid strong copyleft unless explicitly used
  forbiddenLicenses.push(...LICENSE_TIERS['restrictive'].licenses);

  return {
    allowed: Array.from(new Set(allowedLicenses)),
    review: Array.from(new Set(reviewLicenses)),
    forbidden: Array.from(new Set(forbiddenLicenses)),
    coverage: coveragePercentage,
    reasoning: this.generateReasoning(licenseCounts, tierCounts, coveragePercentage, threshold)
  };
}

function generateReasoning(
  licenseCounts: Map<string, number>,
  tierCounts: Map<string, number>,
  coverage: number,
  threshold: number
): string {
  const lines: string[] = [];

  lines.push(`Analyzed ${licenseCounts.size} unique licenses across your dependencies.`);
  lines.push(`${coverage.toFixed(1)}% of dependencies use permissive licenses.`);

  if (coverage >= threshold) {
    lines.push(`✓ Your project primarily uses widely-accepted permissive licenses.`);
  } else {
    lines.push(`⚠ Some dependencies use restrictive or uncommon licenses.`);
  }

  const topLicenses = Array.from(licenseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  lines.push(`\nMost common licenses:`);
  for (const [license, count] of topLicenses) {
    lines.push(`  - ${license}: ${count} dependencies`);
  }

  return lines.join('\n');
}
```

---

## 7. License Data Update Mechanism

### 7.1 Update Check Logic

MonoLicense checks for license data updates at most once per day:

```typescript
/**
 * Configuration constants for license data updates
 */
const LICENSE_DATA_CONFIG = {
  API_BASE: 'https://api.monolicense.com',
  UPDATE_CHECK_FILE: '.monolicense/last-update-check.json',
  LICENSE_DATA_FILE: '.monolicense/license-data.json',
  MIN_HOURS_BETWEEN_CHECKS: 24
} as const;

/**
 * Reads the last update check timestamp from disk
 *
 * @returns Last update check data or default if file doesn't exist
 */
const getLastUpdateCheck = async (): Promise<{ readonly timestamp: number; readonly latestVersion: string }> => {
  try {
    const content = await readFile(LICENSE_DATA_CONFIG.UPDATE_CHECK_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { timestamp: 0, latestVersion: '0.0.0' };
  }
};

/**
 * Saves update check timestamp to disk
 *
 * @param data - Update check data to save
 */
const saveUpdateCheck = async (data: { readonly timestamp: number; readonly latestVersion: string }): Promise<void> => {
  await ensureDir(path.dirname(LICENSE_DATA_CONFIG.UPDATE_CHECK_FILE));
  await writeFile(LICENSE_DATA_CONFIG.UPDATE_CHECK_FILE, JSON.stringify(data, null, 2));
};

/**
 * Fetches latest license data version info from API
 *
 * @returns Version information
 * @throws LicenseDataAPIError if request fails
 */
const fetchLatestVersion = async (): Promise<Result<VersionInfo, LicenseDataAPIError>> => {
  const response = await fetch(`${LICENSE_DATA_CONFIG.API_BASE}/v1/license-data/latest`, {
    headers: {
      'User-Agent': `MonoLicense/${VERSION}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return {
      success: false,
      error: createLicenseDataAPIError(`Failed to check for updates: ${response.statusText}`)
    };
  }

  return {
    success: true,
    value: await response.json()
  };
};

/**
 * Downloads license data update from API
 *
 * @returns Downloaded license data
 * @throws LicenseDataAPIError if download fails
 */
const downloadLicenseDataUpdate = async (): Promise<Result<LicenseData, LicenseDataAPIError>> => {
  const response = await fetch(`${LICENSE_DATA_CONFIG.API_BASE}/v1/license-data/download`, {
    headers: {
      'User-Agent': `MonoLicense/${VERSION}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return {
      success: false,
      error: createLicenseDataAPIError(`Failed to download update: ${response.statusText}`)
    };
  }

  const data = await response.json();
  return { success: true, value: data };
};

/**
 * Checks if license data updates are available
 *
 * @param config - MonoLicense configuration
 * @returns Update check result indicating if update is available
 */
const checkForLicenseDataUpdates = async (config: MonoLicenseConfig): Promise<UpdateCheckResult> => {
  // Skip if updates disabled
  if (!config.updates?.checkLicenseData) {
    return { updateAvailable: false, reason: 'Updates disabled in config' };
  }

  // Check last update time
  const lastCheck = await getLastUpdateCheck();
  const now = Date.now();
  const hoursSinceLastCheck = (now - lastCheck.timestamp) / (1000 * 60 * 60);

  if (hoursSinceLastCheck < LICENSE_DATA_CONFIG.MIN_HOURS_BETWEEN_CHECKS) {
    return {
      updateAvailable: false,
      reason: `Last checked ${hoursSinceLastCheck.toFixed(1)} hours ago`
    };
  }

  // Fetch latest version info from API
  const currentData = await loadLicenseData();
  const latestVersionResult = await fetchLatestVersion();

  if (!latestVersionResult.success) {
    return {
      updateAvailable: false,
      reason: `Failed to check for updates: ${latestVersionResult.error.message}`
    };
  }

  const latestVersion = latestVersionResult.value;

  // Save check timestamp
  await saveUpdateCheck({ timestamp: now, latestVersion: latestVersion.version });

  if (latestVersion.dataVersion > currentData.dataVersion) {
    return {
      updateAvailable: true,
      currentVersion: currentData.dataVersion,
      latestVersion: latestVersion.dataVersion,
      releaseNotes: latestVersion.releaseNotes
    };
  }

  return { updateAvailable: false, reason: 'Already up to date' };
};
```

### 7.2 Auto-Update Behavior

MonoLicense NEVER auto-updates license data. Updates must be explicit:

```typescript
async function performUpdateCheck(config: MonoLicenseConfig): Promise<void> {
  const updater = new LicenseDataUpdater();
  const result = await updater.checkForUpdates(config);

  if (result.updateAvailable && !config.updates?.autoUpdate) {
    console.log(`
⚠ License data update available!
  Current version: ${result.currentVersion}
  Latest version: ${result.latestVersion}

Run 'monolicense update-license-data' to download the latest data.
    `.trim());
  }

  if (result.updateAvailable && config.updates?.autoUpdate) {
    console.log('Auto-update is enabled but not recommended. Please update manually.');
  }
}
```

---

## 8. License Data API Specification

### 8.1 API Endpoints

**Base URL**: `https://api.monolicense.com/v1`

#### 8.1.1 Get Latest Version Info

```
GET /license-data/latest
```

**Response**:
```json
{
  "version": "1.0.0",
  "dataVersion": "2024-01-15",
  "releaseDate": "2024-01-15T00:00:00Z",
  "releaseNotes": "Added 15 new licenses, updated GPL-3.0 metadata",
  "downloadUrl": "https://api.monolicense.com/v1/license-data/download"
}
```

#### 8.1.2 Download License Data

```
GET /license-data/download
```

**Response**:
```json
{
  "version": "1.0.0",
  "dataVersion": "2024-01-15",
  "lastUpdated": "2024-01-15T00:00:00Z",
  "tiers": {
    "universally-accepted": {
      "name": "Universally Accepted",
      "description": "...",
      "recommendedPolicy": "allow",
      "licenses": ["MIT", "Apache-2.0", "..."]
    },
    "...": {}
  },
  "metadata": {
    "MIT": {
      "spdxId": "MIT",
      "name": "MIT License",
      "tier": "universally-accepted",
      "category": "permissive",
      "mustIncludeCopyright": true,
      "...": "..."
    },
    "...": {}
  }
}
```

### 8.2 Error Handling

API errors should be handled gracefully:

```typescript
async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { timeout: 10000 });
      return response;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        await sleep(1000 * attempt); // Exponential backoff
      }
    }
  }

  throw new LicenseDataAPIError(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

---

## 9. Policy Evaluation Logic

### 9.1 Evaluation Algorithm

For each dependency, evaluate against the policy rules:

```typescript
/**
 * Checks if a dependency has been previously approved
 *
 * @param dependency - Dependency to check
 * @param approvals - Approvals configuration
 * @returns True if dependency is approved
 */
const isApproved = (
  dependency: ResolvedDependency,
  approvals: Approvals
): boolean => {
  const key = `${dependency.name}@${dependency.version}`;
  return !!approvals.dependencies?.[key];
};

/**
 * Evaluates a dependency against policy rules
 *
 * @param dependency - Dependency to evaluate
 * @param policy - License policy rules
 * @param approvals - Existing approvals
 * @returns Evaluation result with status and action requirements
 */
const evaluatePolicy = (
  dependency: ResolvedDependency,
  policy: Policy,
  approvals: Approvals
): PolicyEvaluationResult => {
  const license = dependency.license.type;

  // Step 1: Check if approved
  if (isApproved(dependency, approvals)) {
    return {
      status: 'approved',
      license,
      reason: 'Previously approved',
      requiresAction: false
    };
  }

  // Step 2: Check if forbidden
  if (policy.forbidden?.includes(license)) {
    return {
      status: 'forbidden',
      license,
      reason: `License ${license} is forbidden by policy`,
      requiresAction: true,
      severity: 'error'
    };
  }

  // Step 3: Check if allowed
  if (policy.allowed?.includes(license)) {
    return {
      status: 'allowed',
      license,
      reason: `License ${license} is allowed by policy`,
      requiresAction: false
    };
  }

  // Step 4: Check if requires review
  if (policy.review?.includes(license)) {
    return {
      status: 'review',
      license,
      reason: `License ${license} requires manual review`,
      requiresAction: true,
      severity: 'warning'
    };
  }

  // Step 5: Unknown license (not in any list)
  return {
    status: 'unknown',
    license,
    reason: `License ${license} not defined in policy`,
    requiresAction: true,
    severity: 'warning'
  };
};
```

### 9.2 Auto-Approve Logic

Auto-approve checks happen before policy evaluation:

```typescript
function shouldAutoApprove(
  dependency: ResolvedDependency,
  autoApproveConfig: AutoApproveConfig
): boolean {
  // Check publisher patterns
  if (autoApproveConfig.publishers) {
    for (const pattern of autoApproveConfig.publishers) {
      if (dependency.name.match(new RegExp(pattern))) {
        return true;
      }
    }
  }

  // Check license auto-approve
  if (autoApproveConfig.licenses) {
    if (autoApproveConfig.licenses.includes(dependency.license.type)) {
      return true;
    }
  }

  return false;
}
```

---

## 10. Report Generation Process

### 10.1 Report Types

MonoLicense generates three types of reports:

1. **Per-Project Reports**: Individual license reports for each project
2. **Summary Report**: Aggregated view across all projects
3. **Violations Report**: Only items requiring action

### 10.2 Per-Project Report Structure

```typescript
interface ProjectReport {
  projectName: string;
  projectPath: string;
  totalDependencies: number;
  uniqueLicenses: string[];
  licenseBreakdown: Record<string, number>;
  dependencies: DependencyReportItem[];
  violations: Violation[];
  summary: {
    allowed: number;
    review: number;
    forbidden: number;
    approved: number;
    unknown: number;
  };
}

interface DependencyReportItem {
  name: string;
  version: string;
  license: string;
  status: 'allowed' | 'review' | 'forbidden' | 'approved' | 'unknown';
  isDev: boolean;
  isOptional: boolean;
}
```

### 10.3 Summary Report Structure

```typescript
interface SummaryReport {
  totalProjects: number;
  totalDependencies: number;
  uniquePackages: number;
  uniqueLicenses: string[];
  licenseBreakdown: Record<string, { count: number; usedBy: string[] }>;
  overallSummary: {
    allowed: number;
    review: number;
    forbidden: number;
    approved: number;
    unknown: number;
  };
  violations: Violation[];
  projects: ProjectReport[];
}
```

### 10.4 Report Formatting

Reports can be output in multiple formats:

```typescript
/**
 * Formats violation with appropriate emoji based on severity
 *
 * @param violation - Violation to format
 * @returns Formatted violation string
 */
const formatViolation = (violation: Violation): readonly string[] => {
  const emoji = violation.severity === 'error' ? '❌' : '⚠️';
  return [
    `${emoji} **${violation.package}@${violation.version}** (${violation.license})`,
    `   ${violation.reason}`,
    ''
  ];
};

/**
 * Formats license breakdown table row
 *
 * @param license - License identifier
 * @param data - License usage data
 * @returns Formatted table row
 */
const formatLicenseBreakdownRow = (
  license: string,
  data: { readonly count: number; readonly usedBy: readonly string[] }
): string => {
  const usedBy = data.usedBy.join(', ');
  return `| ${license} | ${data.count} | ${usedBy} |`;
};

/**
 * Formats project details section
 *
 * @param project - Project report
 * @returns Formatted project details
 */
const formatProjectDetails = (project: ProjectReport): readonly string[] => {
  return [
    `### ${project.projectName}`,
    '',
    `**Path**: ${project.projectPath}`,
    `**Dependencies**: ${project.totalDependencies}`,
    `**Unique Licenses**: ${project.uniqueLicenses.join(', ')}`,
    ''
  ];
};

/**
 * Formats summary report as Markdown
 *
 * @param report - Summary report to format
 * @returns Markdown-formatted report
 */
const formatMarkdownReport = (report: SummaryReport): string => {
  const lines: string[] = [];

  // Header
  lines.push('# MonoLicense Scan Report');
  lines.push('');
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Projects**: ${report.totalProjects}`);
  lines.push(`**Dependencies**: ${report.totalDependencies}`);
  lines.push(`**Unique Packages**: ${report.uniquePackages}`);
  lines.push('');

  // Overall summary
  lines.push('## Overall Summary');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('|--------|-------|');
  lines.push(`| ✅ Allowed | ${report.overallSummary.allowed} |`);
  lines.push(`| ✓ Approved | ${report.overallSummary.approved} |`);
  lines.push(`| ⚠ Review | ${report.overallSummary.review} |`);
  lines.push(`| ❌ Forbidden | ${report.overallSummary.forbidden} |`);
  lines.push(`| ❓ Unknown | ${report.overallSummary.unknown} |`);
  lines.push('');

  // License breakdown
  lines.push('## License Breakdown');
  lines.push('');
  lines.push('| License | Count | Used By |');
  lines.push('|---------|-------|---------|');

  for (const [license, data] of Object.entries(report.licenseBreakdown)) {
    lines.push(formatLicenseBreakdownRow(license, data));
  }
  lines.push('');

  // Violations
  if (report.violations.length > 0) {
    lines.push('## Violations');
    lines.push('');

    for (const violation of report.violations) {
      lines.push(...formatViolation(violation));
    }
  }

  // Per-project details
  lines.push('## Project Details');
  lines.push('');

  for (const project of report.projects) {
    lines.push(...formatProjectDetails(project));
  }

  return lines.join('\n');
};

/**
 * Formats summary report as JSON
 *
 * @param report - Summary report to format
 * @returns JSON-formatted report
 */
const formatJSONReport = (report: SummaryReport): string => {
  return JSON.stringify(report, null, 2);
};

/**
 * Formats summary report as HTML (v1.5+)
 *
 * @param report - Summary report to format
 * @returns HTML-formatted report
 */
const formatHTMLReport = (report: SummaryReport): string => {
  // TODO: Implement HTML formatting in v1.5
  return '<html><!-- HTML report coming in v1.5 --></html>';
};
```

---

## 11. Caching Strategy

### 11.1 In-Memory Caching

During a scan, cache package information to avoid redundant fetches:

```typescript
/**
 * Creates an empty package cache
 *
 * @returns New empty Map for caching packages
 */
const createPackageCache = (): Map<string, PackageInfo> => {
  return new Map<string, PackageInfo>();
};

/**
 * Gets package info from cache
 *
 * @param cache - Package cache map
 * @param name - Package name
 * @param version - Package version
 * @returns Package info or null if not cached
 */
const getCachedPackage = (
  cache: ReadonlyMap<string, PackageInfo>,
  name: string,
  version: string
): PackageInfo | null => {
  return cache.get(`${name}@${version}`) || null;
};

/**
 * Stores package info in cache (returns new cache with added entry)
 *
 * @param cache - Existing package cache map
 * @param name - Package name
 * @param version - Package version
 * @param info - Package information to cache
 * @returns New cache map with added entry
 */
const setCachedPackage = (
  cache: Map<string, PackageInfo>,
  name: string,
  version: string,
  info: PackageInfo
): Map<string, PackageInfo> => {
  cache.set(`${name}@${version}`, info);
  return cache;
};
```

### 11.2 Persistent Caching (v1.5+)

Store package info to disk for faster subsequent scans:

```typescript
/**
 * Configuration for persistent package cache
 */
const PERSISTENT_CACHE_CONFIG = {
  CACHE_DIR: '.monolicense/cache',
  CACHE_VERSION: '1',
  MAX_AGE_DAYS: 7
} as const;

/**
 * Generates cache key hash from package name and version
 *
 * @param name - Package name
 * @param version - Package version
 * @returns SHA-256 hash of package identifier
 */
const generateCacheKey = (name: string, version: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${name}@${version}`).digest('hex');
};

/**
 * Checks if cached data is still valid based on age
 *
 * @param modifiedTime - File modification timestamp
 * @param maxAgeDays - Maximum age in days
 * @returns True if cache is still valid
 */
const isCacheValid = (modifiedTime: number, maxAgeDays: number): boolean => {
  const ageInDays = (Date.now() - modifiedTime) / (1000 * 60 * 60 * 24);
  return ageInDays <= maxAgeDays;
};

/**
 * Retrieves package info from persistent cache
 *
 * @param name - Package name
 * @param version - Package version
 * @returns Package info or null if not cached or expired
 */
const getPersistentCachedPackage = async (
  name: string,
  version: string
): Promise<PackageInfo | null> => {
  const cacheKey = generateCacheKey(name, version);
  const cachePath = path.join(PERSISTENT_CACHE_CONFIG.CACHE_DIR, `${cacheKey}.json`);

  try {
    const stats = await fs.stat(cachePath);

    if (!isCacheValid(stats.mtimeMs, PERSISTENT_CACHE_CONFIG.MAX_AGE_DAYS)) {
      await fs.unlink(cachePath);
      return null;
    }

    const content = await fs.readFile(cachePath, 'utf-8');
    const cached = JSON.parse(content);

    if (cached.version !== PERSISTENT_CACHE_CONFIG.CACHE_VERSION) {
      return null;
    }

    return cached.data;
  } catch (err) {
    return null;
  }
};

/**
 * Stores package info in persistent cache
 *
 * @param name - Package name
 * @param version - Package version
 * @param info - Package information to cache
 */
const setPersistentCachedPackage = async (
  name: string,
  version: string,
  info: PackageInfo
): Promise<void> => {
  await ensureDir(PERSISTENT_CACHE_CONFIG.CACHE_DIR);

  const cacheKey = generateCacheKey(name, version);
  const cachePath = path.join(PERSISTENT_CACHE_CONFIG.CACHE_DIR, `${cacheKey}.json`);

  const cacheData = {
    version: PERSISTENT_CACHE_CONFIG.CACHE_VERSION,
    timestamp: Date.now(),
    data: info
  };

  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
};
```

---

## 12. Performance Optimization

### 12.1 Parallelization Strategy

Parse lockfiles and extract licenses in parallel:

```typescript
async function scanMonorepo(monorepo: MonorepoDetectionResult): Promise<ScanResult> {
  // Step 1: Parse lockfile (single operation)
  const lockfileData = await parseLockfile(monorepo.lockfileLocation);

  // Step 2: Extract dependencies for all projects in parallel
  const dependencyPromises = monorepo.projects.map(project =>
    extractDependencies(lockfileData, project)
  );

  const allDependencies = await Promise.all(dependencyPromises);

  // Step 3: Build dependency graph (single operation, deduplicates)
  const graph = await buildDependencyGraph(allDependencies);

  // Step 4: Extract licenses in parallel (batched to avoid rate limits)
  const uniquePackages = Array.from(graph.packages.keys());
  const licensePromises = chunk(uniquePackages, 10).map(batch =>
    Promise.all(batch.map(pkg => extractLicense(pkg)))
  );

  await Promise.all(licensePromises);

  // Step 5: Evaluate policies and generate reports
  return generateReports(graph, monorepo.projects);
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 12.2 Performance Targets

- **Small repos** (<100 dependencies): <5 seconds
- **Medium repos** (100-500 dependencies): <15 seconds
- **Large repos** (500-2000 dependencies): <60 seconds
- **Very large repos** (2000+ dependencies): <3 minutes

### 12.3 Progress Indicators

For scans taking longer than 2 seconds, show progress:

```typescript
import ora from 'ora';

async function scanWithProgress(monorepo: MonorepoDetectionResult): Promise<ScanResult> {
  const spinner = ora('Detecting monorepo structure...').start();

  spinner.text = 'Parsing lockfiles...';
  const lockfileData = await parseLockfile(monorepo.lockfileLocation);

  spinner.text = `Extracting dependencies for ${monorepo.projects.length} projects...`;
  const dependencies = await extractAllDependencies(lockfileData, monorepo.projects);

  const uniqueCount = new Set(dependencies.map(d => `${d.name}@${d.version}`)).size;
  spinner.text = `Fetching license info for ${uniqueCount} unique packages...`;

  const graph = await buildDependencyGraph(dependencies);

  spinner.text = 'Evaluating policies...';
  const result = await generateReports(graph, monorepo.projects);

  spinner.succeed('Scan complete!');

  return result;
}
```

### 12.4 Memory Optimization

For very large monorepos, stream processing may be required:

```typescript
async function* streamDependencies(
  lockfileData: LockfileData,
  projects: Project[]
): AsyncGenerator<Dependency> {
  for (const project of projects) {
    const deps = await extractDependencies(lockfileData, project);
    for (const dep of deps) {
      yield dep;
    }
  }
}

async function scanLarge(monorepo: MonorepoDetectionResult): Promise<ScanResult> {
  const seen = new Set<string>();
  const uniqueDeps: Dependency[] = [];

  for await (const dep of streamDependencies(lockfileData, monorepo.projects)) {
    const key = `${dep.name}@${dep.version}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDeps.push(dep);
    }
  }

  // Continue with unique deps only
  return generateReports(uniqueDeps, monorepo.projects);
}
```

---

## Summary

This technical specification defines the exact algorithms and behaviors for all core MonoLicense components:

1. **Result Type Pattern**: Explicit error handling using Result types instead of exceptions
2. **Monorepo Detection**: Prioritized detection of pnpm, npm, yarn, and Rush workspaces
3. **Lockfile Parsing**: Package-manager-specific parsers for extracting dependency data
4. **Dependency Resolution**: Graph-based deduplication with efficient caching
5. **License Extraction**: Multi-source license detection with SPDX normalization
6. **License Recommendations**: Tier-based system for policy generation during init
7. **License Data Updates**: API-based update mechanism with manual control
8. **License Data API**: RESTful API endpoints for license data updates
9. **Policy Evaluation**: Rule-based evaluation with auto-approve support
10. **Report Generation**: Multi-format reports (Markdown, JSON, HTML)
11. **Caching**: In-memory and persistent caching for performance
12. **Performance**: Parallel processing with progress indicators for large repos

All specifications are implementation-ready and provide sufficient detail for development.
