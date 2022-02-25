/**
 * Get country code by locale
 */
export function getCountryCode(locale: string): string | null {
  if (!locale) {
    return null;
  }

  const v = locale.split('[-_]');

  // de
  if (v.length == 1) {
    return v[0].toUpperCase();
  }

  // en_US
  return v[1].toUpperCase();
}
