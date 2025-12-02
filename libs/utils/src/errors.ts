/**
 * ScanError - Discriminated union for all scanner error types.
 * Per data-model.md specification.
 */

export interface LockfileNotFoundError {
  readonly type: 'LOCKFILE_NOT_FOUND';
  readonly path: string;
}

export interface LockfileParseError {
  readonly type: 'LOCKFILE_PARSE_ERROR';
  readonly path: string;
  readonly message: string;
  readonly line?: number;
}

export interface WorkspaceConfigNotFoundError {
  readonly type: 'WORKSPACE_CONFIG_NOT_FOUND';
  readonly path: string;
}

export interface WorkspaceConfigParseError {
  readonly type: 'WORKSPACE_CONFIG_PARSE_ERROR';
  readonly path: string;
  readonly message: string;
}

export interface InvalidLockfileVersionError {
  readonly type: 'INVALID_LOCKFILE_VERSION';
  readonly version: string;
  readonly expected: string;
}

export interface ProjectNotFoundError {
  readonly type: 'PROJECT_NOT_FOUND';
  readonly path: string;
}

export interface PackageJsonParseError {
  readonly type: 'PACKAGE_JSON_PARSE_ERROR';
  readonly path: string;
  readonly message: string;
}

/**
 * Union of all possible scanner errors.
 */
export type ScanError =
  | LockfileNotFoundError
  | LockfileParseError
  | WorkspaceConfigNotFoundError
  | WorkspaceConfigParseError
  | InvalidLockfileVersionError
  | ProjectNotFoundError
  | PackageJsonParseError;

/**
 * Creates a LOCKFILE_NOT_FOUND error.
 */
export const lockfileNotFound = (path: string): LockfileNotFoundError => ({
  type: 'LOCKFILE_NOT_FOUND',
  path,
});

/**
 * Creates a LOCKFILE_PARSE_ERROR error.
 */
export const lockfileParseError = (
  path: string,
  message: string,
  line?: number
): LockfileParseError => ({
  type: 'LOCKFILE_PARSE_ERROR',
  path,
  message,
  line,
});

/**
 * Creates a WORKSPACE_CONFIG_NOT_FOUND error.
 */
export const workspaceConfigNotFound = (path: string): WorkspaceConfigNotFoundError => ({
  type: 'WORKSPACE_CONFIG_NOT_FOUND',
  path,
});

/**
 * Creates a WORKSPACE_CONFIG_PARSE_ERROR error.
 */
export const workspaceConfigParseError = (
  path: string,
  message: string
): WorkspaceConfigParseError => ({
  type: 'WORKSPACE_CONFIG_PARSE_ERROR',
  path,
  message,
});

/**
 * Creates an INVALID_LOCKFILE_VERSION error.
 */
export const invalidLockfileVersion = (
  version: string,
  expected: string
): InvalidLockfileVersionError => ({
  type: 'INVALID_LOCKFILE_VERSION',
  version,
  expected,
});

/**
 * Creates a PROJECT_NOT_FOUND error.
 */
export const projectNotFound = (path: string): ProjectNotFoundError => ({
  type: 'PROJECT_NOT_FOUND',
  path,
});

/**
 * Creates a PACKAGE_JSON_PARSE_ERROR error.
 */
export const packageJsonParseError = (path: string, message: string): PackageJsonParseError => ({
  type: 'PACKAGE_JSON_PARSE_ERROR',
  path,
  message,
});

/**
 * Formats a ScanError into a human-readable message.
 */
export const formatScanError = (error: ScanError): string => {
  switch (error.type) {
    case 'LOCKFILE_NOT_FOUND':
      return `pnpm-lock.yaml not found at ${error.path}. Run 'pnpm install' first.`;
    case 'LOCKFILE_PARSE_ERROR':
      return `Failed to parse lockfile at ${error.path}: ${error.message}${error.line !== undefined ? ` (line ${error.line})` : ''}`;
    case 'WORKSPACE_CONFIG_NOT_FOUND':
      return `pnpm-workspace.yaml not found at ${error.path}`;
    case 'WORKSPACE_CONFIG_PARSE_ERROR':
      return `Failed to parse workspace config at ${error.path}: ${error.message}`;
    case 'INVALID_LOCKFILE_VERSION':
      return `Invalid lockfile version: ${error.version}. Expected ${error.expected}`;
    case 'PROJECT_NOT_FOUND':
      return `Project not found at ${error.path}`;
    case 'PACKAGE_JSON_PARSE_ERROR':
      return `Failed to parse package.json at ${error.path}: ${error.message}`;
  }
};
