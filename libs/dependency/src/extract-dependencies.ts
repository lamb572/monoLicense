import {
  Result,
  success,
  failure,
  ScanError,
  projectNotFound,
} from '@monolicense/utils';
import { unknownLicense } from '@monolicense/license';
import type { LockfileData, DependencyRef } from '@monolicense/parsers';
import type { Dependency } from './types.js';

/**
 * Result of extracting dependencies for a project.
 */
export interface ExtractedDependencies {
  readonly dependencies: readonly Dependency[];
  readonly devDependencies: readonly Dependency[];
}

/**
 * Determines if a specifier indicates a workspace dependency.
 */
const isWorkspaceSpecifier = (specifier: string): boolean =>
  specifier.startsWith('workspace:');

/**
 * Converts a dependency ref to a Dependency object.
 * License is set to unknown initially; will be enriched during scan.
 */
const toDependency = (
  name: string,
  ref: DependencyRef,
  isDev: boolean
): Dependency => ({
  name,
  version: ref.version,
  license: unknownLicense(),
  isWorkspaceDependency: isWorkspaceSpecifier(ref.specifier),
  isDev,
  specifier: ref.specifier,
});

/**
 * Extracts dependencies from a record of DependencyRefs.
 */
const extractFromRefs = (
  refs: Readonly<Record<string, DependencyRef>> | undefined,
  isDev: boolean
): readonly Dependency[] => {
  if (!refs) return [];
  return Object.entries(refs).map(([name, ref]) =>
    toDependency(name, ref, isDev)
  );
};

/**
 * Extracts dependencies for a specific project from the lockfile.
 *
 * @param lockfile - Parsed lockfile data
 * @param projectPath - Path to the project (e.g., "." for root, "apps/web" for nested)
 * @returns Result containing dependencies and devDependencies arrays
 */
export const extractDependencies = (
  lockfile: LockfileData,
  projectPath: string
): Result<ExtractedDependencies, ScanError> => {
  const importer = lockfile.importers[projectPath];

  if (!importer) {
    return failure(projectNotFound(projectPath));
  }

  const dependencies = extractFromRefs(importer.dependencies, false);
  const devDependencies = extractFromRefs(importer.devDependencies, true);

  return success({
    dependencies,
    devDependencies,
  });
};
