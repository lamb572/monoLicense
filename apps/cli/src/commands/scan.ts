import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Command } from 'commander';
import {
  detectMonorepo,
  extractDependencies,
  buildScanResult,
} from '@monolicense/dependency';
import type { Project, ScanResult } from '@monolicense/dependency';
import { parsePnpmLockfile } from '@monolicense/parsers';
import type { LockfileData } from '@monolicense/parsers';
import { isSuccess, formatScanError } from '@monolicense/utils';
import type { ScanError } from '@monolicense/utils';

/**
 * Error output format per scan-error.schema.json.
 */
interface ErrorOutput {
  readonly error: {
    readonly type: string;
    readonly message: string;
    readonly path?: string;
    readonly line?: number;
    readonly expected?: string;
  };
}

/**
 * Formats a scan error for JSON output.
 */
const formatErrorOutput = (error: ScanError): ErrorOutput => {
  const base = {
    type: error.type,
    message: formatScanError(error),
  };

  switch (error.type) {
    case 'LOCKFILE_NOT_FOUND':
    case 'LOCKFILE_PARSE_ERROR':
    case 'WORKSPACE_CONFIG_NOT_FOUND':
    case 'WORKSPACE_CONFIG_PARSE_ERROR':
    case 'PROJECT_NOT_FOUND':
    case 'PACKAGE_JSON_PARSE_ERROR':
      return {
        error: {
          ...base,
          path: error.path,
          ...(error.type === 'LOCKFILE_PARSE_ERROR' && error.line !== undefined && { line: error.line }),
        },
      };
    case 'INVALID_LOCKFILE_VERSION':
      return {
        error: {
          ...base,
          expected: error.expected,
        },
      };
  }
};

/**
 * Builds a project from lockfile data and path.
 */
const buildProject = async (
  lockfile: LockfileData,
  projectPath: string,
  monorepoRoot: string,
  isRoot: boolean
): Promise<Project | null> => {
  const depsResult = extractDependencies(lockfile, projectPath);
  if (!isSuccess(depsResult)) {
    return null;
  }

  const packageJsonPath = path.join(
    monorepoRoot,
    projectPath === '.' ? '' : projectPath,
    'package.json'
  );

  let name = projectPath === '.' ? 'root' : projectPath;
  let version = '0.0.0';

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    name = packageJson.name ?? name;
    version = packageJson.version ?? version;
  } catch {
    // Use defaults if package.json can't be read
  }

  return {
    name,
    path: projectPath,
    version,
    dependencies: depsResult.data.dependencies,
    devDependencies: depsResult.data.devDependencies,
    isWorkspaceRoot: isRoot,
  };
};

/**
 * Performs the scan operation.
 */
const performScan = async (rootPath: string): Promise<ScanResult | ScanError> => {
  const monorepoResult = await detectMonorepo(rootPath);
  if (!isSuccess(monorepoResult)) {
    return monorepoResult.error;
  }

  const { root: monorepoRoot, projectPaths } = monorepoResult.data;

  const lockfilePath = path.join(monorepoRoot, 'pnpm-lock.yaml');
  const lockfileResult = await parsePnpmLockfile(lockfilePath);
  if (!isSuccess(lockfileResult)) {
    return lockfileResult.error;
  }

  const lockfile = lockfileResult.data;

  const projects: Project[] = [];

  const rootProject = await buildProject(lockfile, '.', monorepoRoot, true);
  if (rootProject) {
    projects.push(rootProject);
  }

  for (const projectPath of projectPaths) {
    const project = await buildProject(lockfile, projectPath, monorepoRoot, false);
    if (project) {
      projects.push(project);
    }
  }

  return buildScanResult(projects, monorepoRoot, lockfile.lockfileVersion);
};

/**
 * Creates the scan command.
 */
export const createScanCommand = (): Command => {
  const command = new Command('scan')
    .description('Scan a pnpm monorepo for dependencies and licenses')
    .option('-r, --root <path>', 'Path to monorepo root', process.cwd())
    .action(async (options: { root: string }) => {
      try {
        const rootPath = path.resolve(options.root);
        const result = await performScan(rootPath);

        // Discriminated union check: ScanError has 'type', ScanResult doesn't
        if ('type' in result) {
          console.log(JSON.stringify(formatErrorOutput(result), null, 2));
          process.exit(1);
        }

        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        const errorOutput: ErrorOutput = {
          error: {
            type: 'UNEXPECTED_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
        console.log(JSON.stringify(errorOutput, null, 2));
        process.exit(1);
      }
    });

  return command;
};
