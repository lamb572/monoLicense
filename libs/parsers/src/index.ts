/**
 * @monolicense/parsers
 *
 * Parsers for pnpm workspace configuration and lockfile.
 */

export type {
  WorkspaceConfig,
  LockfileData,
  ImporterData,
  PackageData,
  DependencyRef,
  LockfileSettings,
} from './types.js';

export {
  parsePnpmWorkspace,
  parsePnpmWorkspaceFromString,
} from './pnpm-workspace.js';

export {
  parsePnpmLockfile,
  parsePnpmLockfileFromString,
} from './pnpm-lockfile.js';
