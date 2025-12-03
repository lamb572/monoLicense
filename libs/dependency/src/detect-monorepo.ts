import { join } from 'node:path';
import fg from 'fast-glob';
import {
  Result,
  success,
  ScanError,
} from '@monolicense/utils';
import { parsePnpmWorkspace } from '@monolicense/parsers';
import type { MonorepoInfo } from './types.js';

/**
 * Detects a pnpm monorepo and enumerates its projects.
 *
 * Reads pnpm-workspace.yaml to get workspace globs, then uses fast-glob
 * to find all matching directories containing package.json files.
 */
export const detectMonorepo = async (
  rootPath: string
): Promise<Result<MonorepoInfo, ScanError>> => {
  const workspaceConfigPath = join(rootPath, 'pnpm-workspace.yaml');

  // Parse workspace config
  const configResult = await parsePnpmWorkspace(workspaceConfigPath);
  if (!configResult.success) {
    return configResult;
  }

  const workspaceGlobs = configResult.data.packages;

  // Separate include patterns from exclude patterns (those starting with !)
  const includePatterns = workspaceGlobs.filter(glob => !glob.startsWith('!'));
  const excludePatterns = workspaceGlobs
    .filter(glob => glob.startsWith('!'))
    .map(glob => glob.slice(1));

  // Find all directories matching the globs that contain package.json
  const projectDirs = await fg(
    includePatterns.map((p) => `${p}/package.json`),
    {
      cwd: rootPath,
      ignore: [
        '**/node_modules/**',
        ...excludePatterns.map((p) => `${p}/package.json`),
      ],
      onlyFiles: true,
    }
  );

  // Extract directory paths (remove /package.json suffix)
  const projectPaths = projectDirs
    .map((p) => p.replace(/\/package\.json$/, ''))
    .sort();

  return success({
    root: rootPath,
    workspaceGlobs: [...workspaceGlobs],
    projectPaths,
  });
};
