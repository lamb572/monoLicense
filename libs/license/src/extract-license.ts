import { Result, success, failure } from '@monolicense/utils';
import type { ScanError } from '@monolicense/utils';
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
 */
export const extractLicenseFromPackageJson = (
  packageJsonContent: string,
  path?: string
): Result<LicenseInfo, ScanError> => {
  let parsed: PackageJsonLicense;

  try {
    parsed = JSON.parse(packageJsonContent) as PackageJsonLicense;
  } catch {
    return failure({
      type: 'PACKAGE_JSON_PARSE_ERROR',
      path: path ?? 'unknown',
      message: 'Invalid JSON in package.json',
    });
  }

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

  // No license found
  return success(unknownLicense());
};

/**
 * Extracts license information from LICENSE file content using pattern matching.
 */
export const extractLicenseFromFile = (fileContent: string): Result<LicenseInfo, ScanError> => {
  const content = fileContent.trim();

  // Check each pattern
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
