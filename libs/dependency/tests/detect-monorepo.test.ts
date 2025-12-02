import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectMonorepo } from '../src/detect-monorepo.js';
import { isSuccess, isFailure } from '@monolicense/utils';

describe('detectMonorepo', () => {
  const testRoot = join(tmpdir(), 'monolicense-test-' + Date.now());

  beforeAll(() => {
    // Create test monorepo structure
    mkdirSync(testRoot, { recursive: true });
    mkdirSync(join(testRoot, 'apps', 'web'), { recursive: true });
    mkdirSync(join(testRoot, 'apps', 'cli'), { recursive: true });
    mkdirSync(join(testRoot, 'libs', 'utils'), { recursive: true });
    mkdirSync(join(testRoot, 'libs', 'core'), { recursive: true });

    // Create pnpm-workspace.yaml
    writeFileSync(
      join(testRoot, 'pnpm-workspace.yaml'),
      'packages:\n  - apps/*\n  - libs/*\n'
    );

    // Create package.json files
    writeFileSync(
      join(testRoot, 'package.json'),
      JSON.stringify({ name: 'test-monorepo', version: '1.0.0' })
    );
    writeFileSync(
      join(testRoot, 'apps', 'web', 'package.json'),
      JSON.stringify({ name: '@test/web', version: '1.0.0' })
    );
    writeFileSync(
      join(testRoot, 'apps', 'cli', 'package.json'),
      JSON.stringify({ name: '@test/cli', version: '1.0.0' })
    );
    writeFileSync(
      join(testRoot, 'libs', 'utils', 'package.json'),
      JSON.stringify({ name: '@test/utils', version: '1.0.0' })
    );
    writeFileSync(
      join(testRoot, 'libs', 'core', 'package.json'),
      JSON.stringify({ name: '@test/core', version: '1.0.0' })
    );
  });

  afterAll(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  it('should detect a valid pnpm monorepo', async () => {
    const result = await detectMonorepo(testRoot);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.root).toBe(testRoot);
      expect(result.data.workspaceGlobs).toEqual(['apps/*', 'libs/*']);
    }
  });

  it('should enumerate project paths from workspace globs', async () => {
    const result = await detectMonorepo(testRoot);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const paths = result.data.projectPaths;
      expect(paths).toHaveLength(4);
      expect(paths).toContain('apps/web');
      expect(paths).toContain('apps/cli');
      expect(paths).toContain('libs/utils');
      expect(paths).toContain('libs/core');
    }
  });

  it('should return failure for non-existent directory', async () => {
    const result = await detectMonorepo('/non/existent/path');

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('WORKSPACE_CONFIG_NOT_FOUND');
    }
  });

  it('should return failure for directory without pnpm-workspace.yaml', async () => {
    const noWorkspaceDir = join(testRoot, 'apps', 'web');
    const result = await detectMonorepo(noWorkspaceDir);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('WORKSPACE_CONFIG_NOT_FOUND');
    }
  });

  it('should handle nested glob patterns', async () => {
    // Create nested structure
    const nestedRoot = join(tmpdir(), 'nested-test-' + Date.now());
    mkdirSync(nestedRoot, { recursive: true });
    mkdirSync(join(nestedRoot, 'packages', 'sub', 'pkg1'), { recursive: true });

    writeFileSync(
      join(nestedRoot, 'pnpm-workspace.yaml'),
      'packages:\n  - packages/**\n'
    );
    writeFileSync(
      join(nestedRoot, 'packages', 'sub', 'pkg1', 'package.json'),
      JSON.stringify({ name: 'pkg1', version: '1.0.0' })
    );

    const result = await detectMonorepo(nestedRoot);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.projectPaths).toContain('packages/sub/pkg1');
    }

    rmSync(nestedRoot, { recursive: true, force: true });
  });

  it('should exclude paths matching negation patterns', async () => {
    // Create structure with negation
    const negationRoot = join(tmpdir(), 'negation-test-' + Date.now());
    mkdirSync(negationRoot, { recursive: true });
    mkdirSync(join(negationRoot, 'packages', 'keep'), { recursive: true });
    mkdirSync(join(negationRoot, 'packages', 'skip', 'test'), { recursive: true });

    writeFileSync(
      join(negationRoot, 'pnpm-workspace.yaml'),
      'packages:\n  - packages/**\n  - "!**/test/**"\n'
    );
    writeFileSync(
      join(negationRoot, 'packages', 'keep', 'package.json'),
      JSON.stringify({ name: 'keep', version: '1.0.0' })
    );
    writeFileSync(
      join(negationRoot, 'packages', 'skip', 'test', 'package.json'),
      JSON.stringify({ name: 'skip-test', version: '1.0.0' })
    );

    const result = await detectMonorepo(negationRoot);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.projectPaths).toContain('packages/keep');
      expect(result.data.projectPaths).not.toContain('packages/skip/test');
    }

    rmSync(negationRoot, { recursive: true, force: true });
  });
});
