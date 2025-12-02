/**
 * License information for a dependency.
 */
export interface LicenseInfo {
  readonly spdxId: string;
  readonly source: LicenseSource;
  readonly rawValue: string | null;
}

/**
 * Source where license was detected.
 */
export type LicenseSource =
  | 'package.json'
  | 'package.json-array'
  | 'license-file'
  | 'unknown';

/**
 * Creates a LicenseInfo with unknown license.
 */
export const unknownLicense = (): LicenseInfo => ({
  spdxId: 'UNKNOWN',
  source: 'unknown',
  rawValue: null,
});
