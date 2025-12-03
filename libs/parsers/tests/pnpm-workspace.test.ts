import { describe, it, expect } from 'vitest';
import { parsePnpmWorkspace, parsePnpmWorkspaceFromString } from '../src/pnpm-workspace.js';
import { workspaceFixtures, fixturePaths } from '@monolicense/testing';
import { isSuccess, isFailure } from '@monolicense/utils';

describe('parsePnpmWorkspace', () => {
  describe('parsePnpmWorkspaceFromString', () => {
    it('should parse a simple workspace config', () => {
      const result = parsePnpmWorkspaceFromString(workspaceFixtures.simple);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.packages).toEqual(['apps/*', 'libs/*']);
      }
    });

    it('should parse a nested workspace config with negation', () => {
      const result = parsePnpmWorkspaceFromString(workspaceFixtures.nested);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.packages).toContain('apps/**');
        expect(result.data.packages).toContain('packages/*');
        expect(result.data.packages).toContain('!**/test/**');
      }
    });

    it('should parse an empty workspace config', () => {
      const result = parsePnpmWorkspaceFromString(workspaceFixtures.empty);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.packages).toEqual([]);
      }
    });

    it('should return failure for invalid YAML', () => {
      const result = parsePnpmWorkspaceFromString('{ invalid yaml');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('WORKSPACE_CONFIG_PARSE_ERROR');
      }
    });

    it('should return failure for missing packages field', () => {
      const result = parsePnpmWorkspaceFromString('name: test');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('WORKSPACE_CONFIG_PARSE_ERROR');
        expect(result.error.message).toContain('packages');
      }
    });
  });

  describe('parsePnpmWorkspace (file)', () => {
    it('should parse workspace config from file', async () => {
      const result = await parsePnpmWorkspace(fixturePaths.workspaces.simple);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.packages).toEqual(['apps/*', 'libs/*']);
      }
    });

    it('should return failure for non-existent file', async () => {
      const result = await parsePnpmWorkspace('/non/existent/path.yaml');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('WORKSPACE_CONFIG_NOT_FOUND');
      }
    });
  });
});
