import { describe, it, expect } from 'vitest';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';

const execAsync = promisify(exec);

describe('scan command', () => {
  const cliPath = path.join(__dirname, '../../dist/index.js');
  const fixturesPath = path.join(__dirname, '../../../testing/src/fixtures');

  describe('when scanning a valid monorepo', () => {
    it('should output valid JSON with projects, metadata, and summary', async () => {
      // Run CLI on the MonoLicense repo itself
      const { stdout } = await execAsync(`node ${cliPath} scan`);

      const result = JSON.parse(stdout);

      // Verify structure per scan-output.schema.json
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('summary');

      // Verify metadata
      expect(result.metadata).toHaveProperty('monorepoRoot');
      expect(result.metadata).toHaveProperty('lockfileVersion');
      expect(result.metadata).toHaveProperty('scanTimestamp');
      expect(result.metadata).toHaveProperty('pnpmVersion');

      // Verify summary
      expect(result.summary).toHaveProperty('totalProjects');
      expect(result.summary).toHaveProperty('totalDependencies');
      expect(result.summary).toHaveProperty('uniqueDependencies');
      expect(result.summary).toHaveProperty('licenseCounts');
      expect(result.summary).toHaveProperty('unknownLicenseCount');

      // Basic sanity checks
      expect(result.projects.length).toBeGreaterThan(0);
      expect(result.summary.totalProjects).toBe(result.projects.length);
    });

    it('should include all workspace projects', async () => {
      const { stdout } = await execAsync(`node ${cliPath} scan`);
      const result = JSON.parse(stdout);

      // Should have the monorepo root
      const rootProject = result.projects.find(
        (p: { isWorkspaceRoot: boolean }) => p.isWorkspaceRoot
      );
      expect(rootProject).toBeDefined();

      // Should have workspace packages
      const workspaceProjects = result.projects.filter(
        (p: { isWorkspaceRoot: boolean }) => !p.isWorkspaceRoot
      );
      expect(workspaceProjects.length).toBeGreaterThan(0);
    });

    it('should have valid dependency structure', async () => {
      const { stdout } = await execAsync(`node ${cliPath} scan`);
      const result = JSON.parse(stdout);

      // Find a project with dependencies
      const projectWithDeps = result.projects.find(
        (p: { dependencies: unknown[]; devDependencies: unknown[] }) =>
          p.dependencies.length > 0 || p.devDependencies.length > 0
      );

      if (projectWithDeps) {
        const allDeps = [
          ...projectWithDeps.dependencies,
          ...projectWithDeps.devDependencies,
        ];

        for (const dep of allDeps) {
          expect(dep).toHaveProperty('name');
          expect(dep).toHaveProperty('version');
          expect(dep).toHaveProperty('license');
          expect(dep).toHaveProperty('isWorkspaceDependency');
          expect(dep).toHaveProperty('isDev');
          expect(dep).toHaveProperty('specifier');

          // Verify license structure
          expect(dep.license).toHaveProperty('spdxId');
          expect(dep.license).toHaveProperty('source');
        }
      }
    });
  });

  describe('when --root option is provided', () => {
    it('should scan from the specified root path', async () => {
      const { stdout } = await execAsync(`node ${cliPath} scan --root .`);
      const result = JSON.parse(stdout);

      expect(result.projects.length).toBeGreaterThan(0);
    });
  });
});
