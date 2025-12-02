/**
 * Parser type definitions for pnpm lockfile and workspace config.
 * Per data-model.md specification.
 */

/**
 * Parsed pnpm-workspace.yaml configuration.
 */
export interface WorkspaceConfig {
  readonly packages: readonly string[];
}

/**
 * Reference to a dependency in an importer.
 */
export interface DependencyRef {
  readonly specifier: string;
  readonly version: string;
}

/**
 * Data for a single importer (workspace member) in the lockfile.
 */
export interface ImporterData {
  readonly dependencies?: Readonly<Record<string, DependencyRef>>;
  readonly devDependencies?: Readonly<Record<string, DependencyRef>>;
  readonly optionalDependencies?: Readonly<Record<string, DependencyRef>>;
}

/**
 * Data for a package in the lockfile.
 */
export interface PackageData {
  readonly resolution: {
    readonly integrity: string;
  };
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly dev?: boolean;
  readonly optional?: boolean;
}

/**
 * Lockfile settings.
 */
export interface LockfileSettings {
  readonly autoInstallPeers?: boolean;
  readonly excludeLinksFromLockfile?: boolean;
}

/**
 * Complete parsed pnpm-lock.yaml structure.
 */
export interface LockfileData {
  readonly lockfileVersion: string;
  readonly importers: Readonly<Record<string, ImporterData>>;
  readonly packages: Readonly<Record<string, PackageData>>;
  readonly settings?: LockfileSettings;
}

/**
 * Raw lockfile data before validation (from YAML parse).
 */
export interface RawLockfileData {
  readonly lockfileVersion?: unknown;
  readonly importers?: unknown;
  readonly packages?: unknown;
  readonly settings?: unknown;
}

/**
 * Raw workspace config before validation.
 */
export interface RawWorkspaceConfig {
  readonly packages?: unknown;
}
