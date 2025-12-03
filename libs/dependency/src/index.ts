/**
 * @monolicense/dependency
 *
 * Dependency extraction and monorepo detection for pnpm workspaces.
 */

export type {
  Dependency,
  Project,
  MonorepoInfo,
  ScanResult,
  ScanMetadata,
  ScanSummary,
} from './types.js';

export type { ExtractedDependencies } from './extract-dependencies.js';

export { detectMonorepo } from './detect-monorepo.js';
export { extractDependencies } from './extract-dependencies.js';
export { buildScanResult } from './build-scan-result.js';
