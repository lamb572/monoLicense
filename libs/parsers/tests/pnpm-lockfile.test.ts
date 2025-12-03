import { describe, it, expect } from 'vitest';
import { parsePnpmLockfile, parsePnpmLockfileFromString } from '../src/pnpm-lockfile.js';
import { lockfileFixtures, fixturePaths } from '@monolicense/testing';
import { isSuccess, isFailure } from '@monolicense/utils';

describe('parsePnpmLockfile', () => {
  describe('parsePnpmLockfileFromString', () => {
    it('should parse a simple v6.0 lockfile', () => {
      const result = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.lockfileVersion).toBe('6.0');
        expect(Object.keys(result.data.importers)).toContain('.');
        expect(Object.keys(result.data.importers)).toContain('apps/web');
        expect(Object.keys(result.data.importers)).toContain('libs/utils');
      }
    });

    it('should parse importers with dependencies', () => {
      const result = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const rootImporter = result.data.importers['.'];
        expect(rootImporter?.dependencies?.['lodash']?.version).toBe('4.17.21');
        expect(rootImporter?.devDependencies?.['typescript']?.version).toBe('5.3.3');
      }
    });

    it('should parse packages section', () => {
      const result = parsePnpmLockfileFromString(lockfileFixtures.simpleV6);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.packages['/lodash@4.17.21']).toBeDefined();
        expect(result.data.packages['/react@18.2.0']).toBeDefined();
        expect(result.data.packages['/react@18.2.0']?.dependencies?.['loose-envify']).toBe('1.4.0');
      }
    });

    it('should parse workspace protocol lockfile', () => {
      const result = parsePnpmLockfileFromString(lockfileFixtures.workspaceProtocol);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cliImporter = result.data.importers['apps/cli'];
        expect(cliImporter?.dependencies?.['@myorg/utils']?.specifier).toBe('workspace:*');
        expect(cliImporter?.dependencies?.['@myorg/utils']?.version).toBe('link:../../libs/utils');
      }
    });

    it('should return failure for invalid YAML', () => {
      const result = parsePnpmLockfileFromString('{ invalid yaml');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('LOCKFILE_PARSE_ERROR');
      }
    });

    it('should return failure for unsupported lockfile version', () => {
      const result = parsePnpmLockfileFromString(`
lockfileVersion: '5.0'
importers: {}
packages: {}
`);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('INVALID_LOCKFILE_VERSION');
      }
    });

    it('should return failure for missing lockfileVersion', () => {
      const result = parsePnpmLockfileFromString(`
importers: {}
packages: {}
`);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('LOCKFILE_PARSE_ERROR');
      }
    });
  });

  describe('parsePnpmLockfile (file)', () => {
    it('should parse lockfile from file', async () => {
      const result = await parsePnpmLockfile(fixturePaths.lockfiles.simpleV6);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.lockfileVersion).toBe('6.0');
      }
    });

    it('should return failure for non-existent file', async () => {
      const result = await parsePnpmLockfile('/non/existent/path.yaml');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('LOCKFILE_NOT_FOUND');
      }
    });
  });
});
