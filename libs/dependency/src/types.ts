/**
 * Dependency types for pnpm monorepo scanner.
 * Per data-model.md specification.
 */

import type { LicenseInfo } from '@monolicense/license';

/**
 * A package dependency with name, version, license, and metadata.
 */
export interface Dependency {
  readonly name: string;
  readonly version: string;
  readonly license: LicenseInfo;
  readonly isWorkspaceDependency: boolean;
  readonly isDev: boolean;
  readonly specifier: string;
}

/**
 * A workspace member representing an app or library in the monorepo.
 */
export interface Project {
  readonly name: string;
  readonly path: string;
  readonly version: string;
  readonly dependencies: readonly Dependency[];
  readonly devDependencies: readonly Dependency[];
  readonly isWorkspaceRoot: boolean;
}

/**
 * Result of detecting a monorepo.
 */
export interface MonorepoInfo {
  readonly root: string;
  readonly workspaceGlobs: readonly string[];
  readonly projectPaths: readonly string[];
}

/**
 * Metadata about the scan operation.
 */
export interface ScanMetadata {
  readonly monorepoRoot: string;
  readonly lockfileVersion: string;
  readonly scanTimestamp: string;
  readonly pnpmVersion: string | null;
}

/**
 * Summary statistics for the scan results.
 */
export interface ScanSummary {
  readonly totalProjects: number;
  readonly totalDependencies: number;
  readonly uniqueDependencies: number;
  readonly licenseCounts: Readonly<Record<string, number>>;
  readonly unknownLicenseCount: number;
}

/**
 * Complete output of a scan operation.
 */
export interface ScanResult {
  readonly projects: readonly Project[];
  readonly metadata: ScanMetadata;
  readonly summary: ScanSummary;
}
