import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Reads a fixture file and returns its contents as a string.
 */
const readFixture = (relativePath: string): string =>
  readFileSync(join(__dirname, relativePath), 'utf-8');

/**
 * Workspace configuration fixtures.
 */
export const workspaceFixtures = {
  simple: readFixture('workspaces/simple.yaml'),
  nested: readFixture('workspaces/nested.yaml'),
  empty: readFixture('workspaces/empty.yaml'),
} as const;

/**
 * Lockfile fixtures (pnpm-lock.yaml v6.0 format).
 */
export const lockfileFixtures = {
  simpleV6: readFixture('lockfiles/simple-v6.yaml'),
  workspaceProtocol: readFixture('lockfiles/workspace-protocol.yaml'),
} as const;

/**
 * Package.json fixtures with various license formats.
 */
export const packageFixtures = {
  mitLicense: readFixture('packages/mit-license.json'),
  apacheLicense: readFixture('packages/apache-license.json'),
  legacyLicensesArray: readFixture('packages/legacy-licenses-array.json'),
  noLicense: readFixture('packages/no-license.json'),
  spdxExpression: readFixture('packages/spdx-expression.json'),
} as const;

/**
 * LICENSE file fixtures.
 */
export const licenseFileFixtures = {
  mit: readFixture('licenses/mit.txt'),
  apache2: readFixture('licenses/apache-2.0.txt'),
  isc: readFixture('licenses/isc.txt'),
} as const;

/**
 * Paths to fixture files (for tests that need to read from disk).
 */
export const fixturePaths = {
  workspaces: {
    simple: join(__dirname, 'workspaces/simple.yaml'),
    nested: join(__dirname, 'workspaces/nested.yaml'),
    empty: join(__dirname, 'workspaces/empty.yaml'),
  },
  lockfiles: {
    simpleV6: join(__dirname, 'lockfiles/simple-v6.yaml'),
    workspaceProtocol: join(__dirname, 'lockfiles/workspace-protocol.yaml'),
  },
  packages: {
    mitLicense: join(__dirname, 'packages/mit-license.json'),
    apacheLicense: join(__dirname, 'packages/apache-license.json'),
    legacyLicensesArray: join(__dirname, 'packages/legacy-licenses-array.json'),
    noLicense: join(__dirname, 'packages/no-license.json'),
    spdxExpression: join(__dirname, 'packages/spdx-expression.json'),
  },
  licenses: {
    mit: join(__dirname, 'licenses/mit.txt'),
    apache2: join(__dirname, 'licenses/apache-2.0.txt'),
    isc: join(__dirname, 'licenses/isc.txt'),
  },
} as const;
