/*
 * Contact helpers — copied verbatim from QuickPurchase.tsx (lines 36-48) so the
 * trial feature validates contacts identically to the purchase flow without
 * forcing an export from that upstream file (keeps the merge surface minimal).
 */

export function detectContactType(value: string): 'email' | 'telegram' {
  return value.startsWith('@') ? 'telegram' : 'email';
}

export function isValidContact(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('@')) {
    return trimmed.length >= 4;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
