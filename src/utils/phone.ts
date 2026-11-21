/**
 * Normalizes a phone number to the format 55DDDDDDDDDDD (e.g. 5577988227549)
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If it doesn't start with 55 and looks like a Brazilian number (10 or 11 digits)
  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = "55" + digits;
  }

  return digits;
}

/**
 * Formats a phone number for display: (DD) 9XXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  // Remove 55 prefix if present for display formatting
  let displayDigits = digits.startsWith("55") ? digits.slice(2) : digits;

  if (displayDigits.length === 11) {
    return `(${displayDigits.slice(0, 2)}) ${displayDigits.slice(2, 7)}-${displayDigits.slice(7)}`;
  } else if (displayDigits.length === 10) {
    return `(${displayDigits.slice(0, 2)}) ${displayDigits.slice(2, 6)}-${displayDigits.slice(6)}`;
  }
  
  return phone;
}
