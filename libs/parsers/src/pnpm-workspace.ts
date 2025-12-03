import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import {
  success,
  failure,
  workspaceConfigNotFound,
  workspaceConfigParseError,
} from '@monolicense/utils';
import type { Result, ScanError } from '@monolicense/utils';
import type { WorkspaceConfig, RawWorkspaceConfig } from './types.js';

/**
 * Validates and transforms raw parsed YAML into WorkspaceConfig.
 */
const validateWorkspaceConfig = (
  raw: RawWorkspaceConfig,
  path: string
): Result<WorkspaceConfig, ScanError> => {
  if (!raw.packages) {
    return failure(
      workspaceConfigParseError(path, 'Missing required field: packages')
    );
  }

  if (!Array.isArray(raw.packages)) {
    return failure(
      workspaceConfigParseError(path, 'Field "packages" must be an array')
    );
  }

  const packages = raw.packages.filter(
    (p): p is string => typeof p === 'string'
  );

  return success({ packages });
};

/**
 * Parses pnpm-workspace.yaml content from a string.
 *
 * Validates the workspace configuration and extracts the packages array
 * containing workspace glob patterns.
 *
 * @param content - Raw YAML string content of the workspace config
 * @param path - Optional path for error messages (defaults to '<string>')
 * @returns Parsed workspace config or error
 *
 * @example
 * ```typescript
 * const result = parsePnpmWorkspaceFromString('packages:\n  - "apps/*"');
 * if (result.success) {
 *   console.log(result.data.packages); // ['apps/*']
 * }
 * ```
 */
export const parsePnpmWorkspaceFromString = (
  content: string,
  path = '<string>'
): Result<WorkspaceConfig, ScanError> => {
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
    const message = error instanceof Error ? error.message : String(error);
    return failure(workspaceConfigParseError(path, message));
  }
};

/**
 * Reads and parses pnpm-workspace.yaml from the filesystem.
 *
 * Reads the file at the given path and parses it as a pnpm workspace config.
 * Returns appropriate errors for missing files or parse failures.
 *
 * @param path - Absolute or relative path to pnpm-workspace.yaml
 * @returns Parsed workspace config or error (WORKSPACE_CONFIG_NOT_FOUND, WORKSPACE_CONFIG_PARSE_ERROR)
 *
 * @example
 * ```typescript
 * const result = await parsePnpmWorkspace('./pnpm-workspace.yaml');
 * if (result.success) {
 *   console.log(`Found ${result.data.packages.length} workspace patterns`);
 * }
 * ```
 */
export const parsePnpmWorkspace = async (
  path: string
): Promise<Result<WorkspaceConfig, ScanError>> => {
  try {
    const content = await readFile(path, 'utf-8');
    return parsePnpmWorkspaceFromString(content, path);
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return failure(workspaceConfigNotFound(path));
    }
    const message = error instanceof Error ? error.message : String(error);
    return failure(workspaceConfigParseError(path, message));
  }
};
