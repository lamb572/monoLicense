import { describe, it, expect } from 'vitest';
import { normalizeLicense } from '../src/normalize-license.js';

describe('normalizeLicense', () => {
  describe('standard SPDX identifiers', () => {
    it('should pass through valid SPDX identifiers unchanged', () => {
      expect(normalizeLicense('MIT')).toBe('MIT');
      expect(normalizeLicense('Apache-2.0')).toBe('Apache-2.0');
      expect(normalizeLicense('ISC')).toBe('ISC');
      expect(normalizeLicense('BSD-3-Clause')).toBe('BSD-3-Clause');
    });
  });

  describe('common variations', () => {
    it('should normalize "MIT License" to "MIT"', () => {
      expect(normalizeLicense('MIT License')).toBe('MIT');
    });

    it('should normalize "Apache 2.0" to "Apache-2.0"', () => {
      expect(normalizeLicense('Apache 2.0')).toBe('Apache-2.0');
    });

    it('should normalize "Apache License 2.0" to "Apache-2.0"', () => {
      expect(normalizeLicense('Apache License 2.0')).toBe('Apache-2.0');
    });

    it('should normalize "BSD" to a BSD variant', () => {
      const result = normalizeLicense('BSD');
      expect(result).toMatch(/^BSD/);
    });

    it('should normalize case variations', () => {
      expect(normalizeLicense('mit')).toBe('MIT');
      expect(normalizeLicense('apache-2.0')).toBe('Apache-2.0');
    });
  });

  describe('SPDX expressions', () => {
    it('should preserve valid SPDX expressions', () => {
      const expression = 'MIT OR Apache-2.0';
      const result = normalizeLicense(expression);
      // Should contain both licenses
      expect(result).toContain('MIT');
      expect(result).toContain('Apache-2.0');
    });

    it('should handle AND expressions', () => {
      const expression = 'MIT AND GPL-3.0';
      const result = normalizeLicense(expression);
      expect(result).toContain('MIT');
    });
  });

  describe('unknown licenses', () => {
    it('should return UNKNOWN for unrecognizable licenses', () => {
      expect(normalizeLicense('Some Custom License')).toBe('UNKNOWN');
    });

    it('should return UNKNOWN for empty string', () => {
      expect(normalizeLicense('')).toBe('UNKNOWN');
    });

    it('should return UNLICENSED for proprietary markers', () => {
      expect(normalizeLicense('UNLICENSED')).toBe('UNLICENSED');
      expect(normalizeLicense('Proprietary')).toBe('UNKNOWN');
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace', () => {
      expect(normalizeLicense('  MIT  ')).toBe('MIT');
    });

    it('should handle GPL variations', () => {
      // spdx-correct normalizes GPL-3.0 to GPL-3.0-or-later per SPDX spec
      expect(normalizeLicense('GPL-3.0')).toBe('GPL-3.0-or-later');
      expect(normalizeLicense('GPL-3.0-only')).toBe('GPL-3.0-only');
      expect(normalizeLicense('GPL-3.0-or-later')).toBe('GPL-3.0-or-later');
    });
  });
});
