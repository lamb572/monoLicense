import { success, failure } from '@monolicense/utils';
import type { Result, ScanError } from '@monolicense/utils';
import type { LicenseInfo } from './types.js';
import { unknownLicense } from './types.js';
import { normalizeLicense } from './normalize-license.js';

/**
 * License patterns for common licenses detected from file content.
 * Order matters - more specific patterns should come first.
 * ISC patterns must come before generic MIT patterns since ISC also contains "AS IS" text.
 */
const LICENSE_PATTERNS: ReadonlyArray<{ readonly pattern: RegExp; readonly spdxId: string }> = [
  { pattern: /Apache License[,\s]+Version 2\.0/i, spdxId: 'Apache-2.0' },
  { pattern: /Apache-2\.0/i, spdxId: 'Apache-2.0' },
  { pattern: /Apache License/i, spdxId: 'Apache-2.0' },
  // ISC patterns must come before MIT - ISC licenses contain "AS IS" text that would match MIT
  { pattern: /ISC License/i, spdxId: 'ISC' },
  { pattern: /Permission to use, copy, modify, and\/or distribute/i, spdxId: 'ISC' },
  // MIT patterns
  { pattern: /MIT License/i, spdxId: 'MIT' },
  { pattern: /Permission is hereby granted, free of charge/i, spdxId: 'MIT' },
  { pattern: /THE SOFTWARE IS PROVIDED "AS IS"/i, spdxId: 'MIT' },
  { pattern: /BSD 3-Clause License/i, spdxId: 'BSD-3-Clause' },
  { pattern: /BSD 2-Clause License/i, spdxId: 'BSD-2-Clause' },
  { pattern: /GNU General Public License.*version 3/i, spdxId: 'GPL-3.0' },
  { pattern: /GNU General Public License.*version 2/i, spdxId: 'GPL-2.0' },
  { pattern: /GNU Lesser General Public License/i, spdxId: 'LGPL-3.0' },
  { pattern: /Mozilla Public License.*2\.0/i, spdxId: 'MPL-2.0' },
  { pattern: /The Unlicense/i, spdxId: 'Unlicense' },
];

/**
 * Package.json structure for license extraction.
 */
interface PackageJsonLicense {
  readonly license?: string;
  readonly licenses?: ReadonlyArray<{ readonly type?: string; readonly url?: string }>;
}

/**
 * Extracts license information from package.json content string.
 *
 * Parses the JSON and extracts license from either the modern `license` field
 * or the legacy `licenses` array format. Normalizes to SPDX identifiers.
 *
 * @param packageJsonContent - Raw JSON string content of package.json
 * @param path - Optional path for error messages
 * @returns Extracted license info or error (PACKAGE_JSON_PARSE_ERROR)
 *
 * @example
 * ```typescript
 * const result = extractLicenseFromPackageJson('{"license": "MIT"}');
 * if (result.success) {
 *   console.log(result.data.spdxId); // 'MIT'
 * }
 * ```
 */
export const extractLicenseFromPackageJson = (
  packageJsonContent: string,
  path?: string
): Result<LicenseInfo, ScanError> => {
  try {
    const parsed = JSON.parse(packageJsonContent) as PackageJsonLicense;

    // Primary: Check license field (modern format)
    if (typeof parsed.license === 'string' && parsed.license.trim()) {
      const rawLicense = parsed.license.trim();
      const normalized = normalizeLicense(rawLicense);

      return success({
        spdxId: normalized,
        source: 'package.json',
        rawValue: normalized !== rawLicense ? rawLicense : null,
      });
    }

    // Secondary: Check legacy licenses array format
    if (Array.isArray(parsed.licenses) && parsed.licenses.length > 0) {
      const firstLicense = parsed.licenses[0];
      if (firstLicense?.type) {
        const rawLicense = firstLicense.type;
        const normalized = normalizeLicense(rawLicense);

        return success({
          spdxId: normalized,
          source: 'package.json-array',
          rawValue: normalized !== rawLicense ? rawLicense : null,
        });
      }
    }

    return success(unknownLicense());
  } catch {
    return failure({
      type: 'PACKAGE_JSON_PARSE_ERROR',
      path: path ?? 'unknown',
      message: 'Invalid JSON in package.json',
    });
  }
};

/**
 * Extracts license information from LICENSE file content using pattern matching.
 *
 * Scans the file content against known license patterns (MIT, Apache-2.0, ISC, etc.)
 * and returns the first matching SPDX identifier.
 *
 * @param fileContent - Raw text content of the LICENSE file
 * @returns Extracted license info (never fails, returns UNKNOWN if no match)
 *
 * @example
 * ```typescript
 * const result = extractLicenseFromFile('MIT License\n\nCopyright...');
 * if (result.success) {
 *   console.log(result.data.spdxId); // 'MIT'
 * }
 * ```
 */
export const extractLicenseFromFile = (fileContent: string): Result<LicenseInfo, ScanError> => {
  const content = fileContent.trim();

  for (const { pattern, spdxId } of LICENSE_PATTERNS) {
    if (pattern.test(content)) {
      return success({
        spdxId,
        source: 'license-file',
        rawValue: null,
      });
    }
  }

  // No recognized license pattern
  return success(unknownLicense());
};
