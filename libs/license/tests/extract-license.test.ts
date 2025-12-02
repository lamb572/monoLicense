import { describe, it, expect } from 'vitest';
import { extractLicenseFromPackageJson, extractLicenseFromFile } from '../src/extract-license.js';
import { packageFixtures, licenseFileFixtures } from '@monolicense/testing';
import { isSuccess, isFailure } from '@monolicense/utils';

describe('extractLicense', () => {
  describe('extractLicenseFromPackageJson', () => {
    it('should extract MIT license from package.json string', () => {
      const result = extractLicenseFromPackageJson(packageFixtures.mitLicense);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.spdxId).toBe('MIT');
        expect(result.data.source).toBe('package.json');
        expect(result.data.rawValue).toBeNull();
      }
    });

    it('should extract Apache-2.0 license from package.json string', () => {
      const result = extractLicenseFromPackageJson(packageFixtures.apacheLicense);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.spdxId).toBe('Apache-2.0');
        expect(result.data.source).toBe('package.json');
      }
    });

    it('should extract license from legacy licenses array format', () => {
      const result = extractLicenseFromPackageJson(packageFixtures.legacyLicensesArray);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.source).toBe('package.json-array');
        // Should take first license in array
        expect(result.data.spdxId).toBeDefined();
      }
    });

    it('should return UNKNOWN for package.json without license field', () => {
      const result = extractLicenseFromPackageJson(packageFixtures.noLicense);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.spdxId).toBe('UNKNOWN');
        expect(result.data.source).toBe('unknown');
      }
    });

    it('should handle SPDX expression', () => {
      const result = extractLicenseFromPackageJson(packageFixtures.spdxExpression);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        // SPDX expressions like "MIT OR Apache-2.0" should be preserved
        expect(result.data.spdxId).toContain('MIT');
      }
    });

    it('should return failure for invalid JSON', () => {
      const result = extractLicenseFromPackageJson('not valid json');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe('PACKAGE_JSON_PARSE_ERROR');
      }
    });
  });

  describe('extractLicenseFromFile', () => {
    it('should detect MIT license from LICENSE file content', () => {
      const result = extractLicenseFromFile(licenseFileFixtures.mit);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.spdxId).toBe('MIT');
        expect(result.data.source).toBe('license-file');
      }
    });

    it('should detect Apache-2.0 license from LICENSE file content', () => {
      const result = extractLicenseFromFile(licenseFileFixtures.apache2);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.spdxId).toBe('Apache-2.0');
        expect(result.data.source).toBe('license-file');
      }
    });

    it('should detect ISC license from LICENSE file content', () => {
      const result = extractLicenseFromFile(licenseFileFixtures.isc);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.spdxId).toBe('ISC');
        expect(result.data.source).toBe('license-file');
      }
    });

    it('should return UNKNOWN for unrecognized license text', () => {
      const result = extractLicenseFromFile('Some random text that is not a license');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.spdxId).toBe('UNKNOWN');
        expect(result.data.source).toBe('unknown');
      }
    });
  });
});
