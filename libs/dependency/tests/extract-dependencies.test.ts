import { describe, it, expect } from 'vitest';
import { extractDependencies } from '../src/extract-dependencies.js';
import { lockfileFixtures } from '@monolicense/testing';
import { parsePnpmLockfileFromString } from '@monolicense/parsers';
import { isSuccess, isFailure } from '@monolicense/utils';

describe('extractDependencies', () => {
  describe('with simple v6 lockfile', () => {
    it('should extract dependencies for root project', () => {
      const lockfileResult = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);
      expect(isSuccess(lockfileResult)).toBe(true);
      if (!isSuccess(lockfileResult)) return;

      const result = extractDependencies(lockfileResult.data, '.');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { dependencies, devDependencies } = result.data;

        // Root has lodash as dependency
        const lodash = dependencies.find(d => d.name === 'lodash');
        expect(lodash).toBeDefined();
        expect(lodash?.version).toBe('4.17.21');
        expect(lodash?.specifier).toBe('^4.17.21');
        expect(lodash?.isWorkspaceDependency).toBe(false);
        expect(lodash?.isDev).toBe(false);

        // Root has typescript as devDependency
        const ts = devDependencies.find(d => d.name === 'typescript');
        expect(ts).toBeDefined();
        expect(ts?.isDev).toBe(true);
      }
    });

    it('should extract dependencies for nested project', () => {
      const lockfileResult = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);
      expect(isSuccess(lockfileResult)).toBe(true);
      if (!isSuccess(lockfileResult)) return;

      const result = extractDependencies(lockfileResult.data, 'apps/web');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { dependencies } = result.data;

        // apps/web has react as dependency
        const react = dependencies.find(d => d.name === 'react');
        expect(react).toBeDefined();
        expect(react?.version).toBe('18.2.0');
      }
    });

    it('should return failure for non-existent project', () => {
      const lockfileResult = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);
      expect(isSuccess(lockfileResult)).toBe(true);
      if (!isSuccess(lockfileResult)) return;

      const result = extractDependencies(lockfileResult.data, 'non/existent');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('PROJECT_NOT_FOUND');
      }
    });
  });

  describe('with workspace protocol lockfile', () => {
    it('should mark workspace dependencies correctly', () => {
      const lockfileResult = parsePnpmLockfileFromString(lockfileFixtures.workspaceProtocol);
      expect(isSuccess(lockfileResult)).toBe(true);
      if (!isSuccess(lockfileResult)) return;

      const result = extractDependencies(lockfileResult.data, 'apps/cli');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { dependencies } = result.data;

        // apps/cli depends on @myorg/utils via workspace:*
        const utils = dependencies.find(d => d.name === '@myorg/utils');
        expect(utils).toBeDefined();
        expect(utils?.isWorkspaceDependency).toBe(true);
        expect(utils?.specifier).toBe('workspace:*');
      }
    });

    it('should handle workspace:^ specifier', () => {
      const lockfileResult = parsePnpmLockfileFromString(lockfileFixtures.workspaceProtocol);
      expect(isSuccess(lockfileResult)).toBe(true);
      if (!isSuccess(lockfileResult)) return;

      const result = extractDependencies(lockfileResult.data, 'apps/cli');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { dependencies } = result.data;

        // apps/cli depends on @myorg/config via workspace:^
        const config = dependencies.find(d => d.name === '@myorg/config');
        expect(config).toBeDefined();
        expect(config?.isWorkspaceDependency).toBe(true);
        expect(config?.specifier).toBe('workspace:^');
      }
    });
  });

  describe('dependency categorization', () => {
    it('should separate dependencies and devDependencies', () => {
      const lockfileResult = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);
      expect(isSuccess(lockfileResult)).toBe(true);
      if (!isSuccess(lockfileResult)) return;

      const result = extractDependencies(lockfileResult.data, '.');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { dependencies, devDependencies } = result.data;

        // All deps in dependencies should have isDev = false
        dependencies.forEach(d => {
          expect(d.isDev).toBe(false);
        });

        // All deps in devDependencies should have isDev = true
        devDependencies.forEach(d => {
          expect(d.isDev).toBe(true);
        });
      }
    });

    it('should return empty arrays for project with no dependencies', () => {
      const lockfileResult = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);
      expect(isSuccess(lockfileResult)).toBe(true);
      if (!isSuccess(lockfileResult)) return;

      // libs/utils has no deps in our fixture
      const result = extractDependencies(lockfileResult.data, 'libs/utils');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.dependencies).toEqual([]);
        expect(result.data.devDependencies).toEqual([]);
      }
    });
  });
});
