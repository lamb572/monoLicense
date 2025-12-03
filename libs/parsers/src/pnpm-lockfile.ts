import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import {
  Result,
  success,
  failure,
  ScanError,
  lockfileNotFound,
  lockfileParseError,
  invalidLockfileVersion,
} from '@monolicense/utils';
import type {
  LockfileData,
  RawLockfileData,
  ImporterData,
  PackageData,
  DependencyRef,
} from './types.js';

/**
 * Minimum supported lockfile version.
 */
const MIN_LOCKFILE_VERSION = '6.0';

/**
 * Parses the lockfile version string and returns the major.minor number.
 */
const parseVersion = (version: string): number => {
  const match = version.match(/^(\d+)\.(\d+)/);
  if (!match) return 0;
  return parseFloat(`${match[1]}.${match[2]}`);
};

/**
 * Validates the lockfile version is supported.
 */
const validateVersion = (
  version: unknown,
  path: string
): Result<string, ScanError> => {
  if (typeof version !== 'string') {
    return failure(lockfileParseError(path, 'Missing or invalid lockfileVersion'));
  }

  const versionNum = parseVersion(version);
  const minVersionNum = parseVersion(MIN_LOCKFILE_VERSION);

  if (versionNum < minVersionNum) {
    return failure(invalidLockfileVersion(version, `>=${MIN_LOCKFILE_VERSION}`));
  }

  return success(version);
};

/**
 * Validates and transforms raw dependency refs.
 */
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

/**
 * Validates and transforms raw importer data.
 */
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

/**
 * Validates and transforms raw package data.
 */
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

/**
 * Validates and transforms raw lockfile data.
 */
const validateLockfileData = (
  raw: RawLockfileData,
  path: string
): Result<LockfileData, ScanError> => {
  const versionResult = validateVersion(raw.lockfileVersion, path);
  if (!versionResult.success) {
    return versionResult;
  }

  const lockfileData: LockfileData = {
    lockfileVersion: versionResult.data,
    importers: validateImporters(raw.importers),
    packages: validatePackages(raw.packages),
  };

  if (raw.settings) {
    (lockfileData as { settings?: LockfileData['settings'] }).settings =
      raw.settings as LockfileData['settings'];
  }

  return success(lockfileData);
};

/**
 * Parses pnpm-lock.yaml content from a string.
 */
export const parsePnpmLockfileFromString = (
  content: string,
  path = '<string>'
): Result<LockfileData, ScanError> => {
  try {
    const raw = parseYaml(content) as RawLockfileData;
    if (!raw) {
      return failure(lockfileParseError(path, 'Empty or invalid lockfile'));
    }
    return validateLockfileData(raw, path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(lockfileParseError(path, message));
  }
};

/**
 * Reads and parses pnpm-lock.yaml from the filesystem.
 */
export const parsePnpmLockfile = async (
  path: string
): Promise<Result<LockfileData, ScanError>> => {
  try {
    const content = await readFile(path, 'utf-8');
    return parsePnpmLockfileFromString(content, path);
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return failure(lockfileNotFound(path));
    }
    const message = error instanceof Error ? error.message : String(error);
    return failure(lockfileParseError(path, message));
  }
};
