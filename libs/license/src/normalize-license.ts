import spdxCorrect from 'spdx-correct';

/**
 * Normalizes a license string to a valid SPDX identifier.
 * Returns 'UNKNOWN' if the license cannot be recognized.
 */
export const normalizeLicense = (license: string): string => {
  const trimmed = license.trim();

  // Handle empty string
  if (!trimmed) {
    return 'UNKNOWN';
  }

  // Handle UNLICENSED - this is a special case
  if (trimmed.toUpperCase() === 'UNLICENSED') {
    return 'UNLICENSED';
  }

  // Try to correct the license using spdx-correct
  const corrected = spdxCorrect(trimmed);

  // If spdx-correct returns null, the license is unrecognizable
  if (corrected === null) {
    return 'UNKNOWN';
  }

  return corrected;
};
