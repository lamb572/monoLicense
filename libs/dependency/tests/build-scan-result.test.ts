import { describe, it, expect, beforeAll } from 'vitest';
import { buildScanResult } from '../src/build-scan-result.js';
import type { Project, Dependency } from '../src/types.js';
import type { LicenseInfo } from '@monolicense/license';

/**
 * Creates a test dependency with specified properties.
 */
const createDep = (
  name: string,
  version: string,
  spdxId: string,
  isDev = false
): Dependency => ({
  name,
  version,
  license: {
    spdxId,
    source: 'package.json',
    rawValue: null,
  },
  isWorkspaceDependency: false,
  isDev,
  specifier: `^${version}`,
});

/**
 * Creates a test project with specified properties.
 */
const createProject = (
  name: string,
  path: string,
  deps: Dependency[] = [],
  devDeps: Dependency[] = [],
  isRoot = false
): Project => ({
  name,
  path,
  version: '1.0.0',
  dependencies: deps,
  devDependencies: devDeps,
  isWorkspaceRoot: isRoot,
});

describe('buildScanResult', () => {
  describe('metadata', () => {
    it('should include monorepo root path', () => {
      const projects: Project[] = [
        createProject('root', '.', [], [], true),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      expect(result.metadata.monorepoRoot).toBe('/path/to/monorepo');
    });

    it('should include lockfile version', () => {
      const projects: Project[] = [
        createProject('root', '.', [], [], true),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '9.0');

      expect(result.metadata.lockfileVersion).toBe('9.0');
    });

    it('should include scan timestamp in ISO format', () => {
      const projects: Project[] = [
        createProject('root', '.', [], [], true),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      // Should be a valid ISO 8601 timestamp
      expect(() => new Date(result.metadata.scanTimestamp)).not.toThrow();
      expect(result.metadata.scanTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should set pnpmVersion to null (not detectable in v1)', () => {
      const projects: Project[] = [
        createProject('root', '.', [], [], true),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      expect(result.metadata.pnpmVersion).toBeNull();
    });
  });

  describe('summary', () => {
    it('should count total projects', () => {
      const projects: Project[] = [
        createProject('root', '.', [], [], true),
        createProject('@app/web', 'apps/web'),
        createProject('@lib/utils', 'libs/utils'),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      expect(result.summary.totalProjects).toBe(3);
    });

    it('should count total dependencies including devDependencies', () => {
      const projects: Project[] = [
        createProject('root', '.', [
          createDep('lodash', '4.17.21', 'MIT'),
        ], [
          createDep('typescript', '5.3.0', 'Apache-2.0', true),
        ], true),
        createProject('@app/web', 'apps/web', [
          createDep('react', '18.2.0', 'MIT'),
        ]),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      // 1 dep + 1 devDep + 1 dep = 3 total
      expect(result.summary.totalDependencies).toBe(3);
    });

    it('should count unique dependencies after deduplication', () => {
      const projects: Project[] = [
        createProject('root', '.', [
          createDep('lodash', '4.17.21', 'MIT'),
        ], [], true),
        createProject('@app/web', 'apps/web', [
          createDep('lodash', '4.17.21', 'MIT'),  // Same dep
          createDep('react', '18.2.0', 'MIT'),
        ]),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      // lodash appears twice but should only count once in unique
      expect(result.summary.totalDependencies).toBe(3);
      expect(result.summary.uniqueDependencies).toBe(2);
    });

    it('should count licenses correctly', () => {
      const projects: Project[] = [
        createProject('root', '.', [
          createDep('lodash', '4.17.21', 'MIT'),
          createDep('underscore', '1.13.0', 'MIT'),
          createDep('express', '4.18.0', 'MIT'),
          createDep('typescript', '5.3.0', 'Apache-2.0'),
        ], [], true),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      expect(result.summary.licenseCounts['MIT']).toBe(3);
      expect(result.summary.licenseCounts['Apache-2.0']).toBe(1);
    });

    it('should count unknown licenses', () => {
      const projects: Project[] = [
        createProject('root', '.', [
          createDep('lodash', '4.17.21', 'MIT'),
          createDep('mystery-pkg', '1.0.0', 'UNKNOWN'),
          createDep('another-pkg', '2.0.0', 'UNKNOWN'),
        ], [], true),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      expect(result.summary.unknownLicenseCount).toBe(2);
      expect(result.summary.licenseCounts['UNKNOWN']).toBe(2);
    });

    it('should deduplicate by name+version for license counts', () => {
      const projects: Project[] = [
        createProject('root', '.', [
          createDep('lodash', '4.17.21', 'MIT'),
        ], [], true),
        createProject('@app/web', 'apps/web', [
          createDep('lodash', '4.17.21', 'MIT'),  // Duplicate - should not double count
        ]),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      // Only 1 unique lodash, so MIT count should be 1
      expect(result.summary.licenseCounts['MIT']).toBe(1);
    });
  });

  describe('projects', () => {
    it('should include all projects in result', () => {
      const projects: Project[] = [
        createProject('root', '.', [], [], true),
        createProject('@app/web', 'apps/web'),
        createProject('@lib/utils', 'libs/utils'),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      expect(result.projects).toHaveLength(3);
      expect(result.projects.map(p => p.name)).toEqual([
        'root',
        '@app/web',
        '@lib/utils',
      ]);
    });

    it('should preserve project structure unchanged', () => {
      const dep = createDep('lodash', '4.17.21', 'MIT');
      const devDep = createDep('typescript', '5.3.0', 'Apache-2.0', true);
      const project = createProject('root', '.', [dep], [devDep], true);

      const result = buildScanResult([project], '/path/to/monorepo', '6.0');

      expect(result.projects[0]).toEqual(project);
    });
  });

  describe('edge cases', () => {
    it('should handle empty projects array', () => {
      const result = buildScanResult([], '/path/to/monorepo', '6.0');

      expect(result.projects).toHaveLength(0);
      expect(result.summary.totalProjects).toBe(0);
      expect(result.summary.totalDependencies).toBe(0);
      expect(result.summary.uniqueDependencies).toBe(0);
      expect(result.summary.unknownLicenseCount).toBe(0);
    });

    it('should handle projects with no dependencies', () => {
      const projects: Project[] = [
        createProject('root', '.', [], [], true),
        createProject('@app/web', 'apps/web', [], []),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      expect(result.summary.totalDependencies).toBe(0);
      expect(result.summary.uniqueDependencies).toBe(0);
    });

    it('should handle same package with different versions as separate deps', () => {
      const projects: Project[] = [
        createProject('root', '.', [
          createDep('lodash', '4.17.21', 'MIT'),
        ], [], true),
        createProject('@app/web', 'apps/web', [
          createDep('lodash', '4.17.20', 'MIT'),  // Different version
        ]),
      ];

      const result = buildScanResult(projects, '/path/to/monorepo', '6.0');

      // Different versions = 2 unique deps
      expect(result.summary.uniqueDependencies).toBe(2);
    });
  });
});
