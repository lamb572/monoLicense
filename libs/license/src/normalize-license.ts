import spdxCorrect from 'spdx-correct';

/**
 * Normalizes a license string to a valid SPDX identifier.
 * Returns 'UNKNOWN' if the license cannot be recognized.
 */
export const normalizeLicense = (license: string): string => {
  const trimmed = license.trim();

  if (!trimmed) {
    return 'UNKNOWN';
  }

  // UNLICENSED is a reserved keyword per npm spec, not an SPDX identifier
  if (trimmed.toUpperCase() === 'UNLICENSED') {
    return 'UNLICENSED';
  }

  const corrected = spdxCorrect(trimmed);

  if (corrected === null) {
    return 'UNKNOWN';
  }

  return corrected;
};
