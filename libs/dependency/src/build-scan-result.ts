import type { Project, ScanResult, ScanMetadata, ScanSummary, Dependency } from './types.js';

/**
 * Creates a unique key for a dependency based on name and version.
 */
const getDependencyKey = (dep: Dependency): string => `${dep.name}@${dep.version}`;

/**
 * Collects all dependencies from all projects.
 */
const collectAllDependencies = (projects: readonly Project[]): readonly Dependency[] => {
  const all: Dependency[] = [];
  for (const project of projects) {
    all.push(...project.dependencies);
    all.push(...project.devDependencies);
  }
  return all;
};

/**
 * Deduplicates dependencies by name+version.
 */
const deduplicateDependencies = (deps: readonly Dependency[]): readonly Dependency[] => {
  const seen = new Map<string, Dependency>();
  for (const dep of deps) {
    const key = getDependencyKey(dep);
    if (!seen.has(key)) {
      seen.set(key, dep);
    }
  }
  return Array.from(seen.values());
};

/**
 * Computes license counts from unique dependencies.
 */
const computeLicenseCounts = (
  uniqueDeps: readonly Dependency[]
): Readonly<Record<string, number>> => {
  const counts: Record<string, number> = {};
  for (const dep of uniqueDeps) {
    const license = dep.license.spdxId;
    counts[license] = (counts[license] ?? 0) + 1;
  }
  return counts;
};

/**
 * Builds scan metadata.
 */
const buildMetadata = (monorepoRoot: string, lockfileVersion: string): ScanMetadata => ({
  monorepoRoot,
  lockfileVersion,
  scanTimestamp: new Date().toISOString(),
  pnpmVersion: null, // Not detectable in v1
});

/**
 * Builds scan summary from projects and their dependencies.
 */
const buildSummary = (
  projects: readonly Project[],
  allDeps: readonly Dependency[],
  uniqueDeps: readonly Dependency[]
): ScanSummary => {
  const licenseCounts = computeLicenseCounts(uniqueDeps);
  const unknownLicenseCount = licenseCounts['UNKNOWN'] ?? 0;

  return {
    totalProjects: projects.length,
    totalDependencies: allDeps.length,
    uniqueDependencies: uniqueDeps.length,
    licenseCounts,
    unknownLicenseCount,
  };
};

/**
 * Builds a complete ScanResult from projects and metadata.
 *
 * @param projects - Array of scanned projects
 * @param monorepoRoot - Absolute path to the monorepo root
 * @param lockfileVersion - Version of the pnpm lockfile
 * @returns Complete scan result with metadata and summary
 */
export const buildScanResult = (
  projects: readonly Project[],
  monorepoRoot: string,
  lockfileVersion: string
): ScanResult => {
  const allDeps = collectAllDependencies(projects);
  const uniqueDeps = deduplicateDependencies(allDeps);

  return {
    projects,
    metadata: buildMetadata(monorepoRoot, lockfileVersion),
    summary: buildSummary(projects, allDeps, uniqueDeps),
  };
};
