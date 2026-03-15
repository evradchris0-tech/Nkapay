export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  // remove all non-digit characters
  const digits = phone.replace(/\D+/g, '');
  // ensure leading +
  return digits.startsWith('0') ? digits : (digits.startsWith('237') ? `+${digits}` : `+${digits}`);
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const original = String(phone).trim();
  const digits = original.replace(/\D+/g, '');

  // If starts with country code 237
  if (digits.startsWith('237')) {
    const rest = digits.slice(3);
    // group rest as 3-2-2-2 if length fits, else fallback to groups of 2
    if (rest.length === 9) {
      return `+237 ${rest.slice(0,3)} ${rest.slice(3,5)} ${rest.slice(5,7)} ${rest.slice(7)}`.trim();
    }
    // fallback: split in groups of 2
    return `+237 ${rest.replace(/(\d{2})/g, '$1 ').trim()}`;
  }

  // No explicit CC: try to format 9-digit local number as 3-2-2-2
  if (digits.length === 9) {
    return `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5,7)} ${digits.slice(7)}`.trim();
  }

  // generic grouping in blocks of 3
  return digits.replace(/(\d{3})/g, '$1 ').trim();
}
