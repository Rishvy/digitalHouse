export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstNumber(value: string) {
  return GST_REGEX.test(value.trim().toUpperCase());
}
