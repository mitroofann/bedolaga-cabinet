import type { ThemeColors } from '@/types/theme';

/**
 * Bulka palette pushed to the server (global, all users) via the developer's
 * existing branding-colors API when the admin toggles the theme on. Values match
 * theme.css and the marketing site (bulkavpn.net).
 */
export const BULKA_COLORS: ThemeColors = {
  accent: '#E8A33D',

  darkBackground: '#1C1C1C',
  darkSurface: '#242424',
  darkText: '#F0F0F0',
  darkTextSecondary: '#969696',

  lightBackground: '#F5EFE4',
  lightSurface: '#FFFFFF',
  lightText: '#1C1A16',
  lightTextSecondary: '#584E40',

  success: '#5FD07C',
  warning: '#F5C24B',
  error: '#E5565B',
};

/**
 * Sentinel: applyThemeColors() writes darkBackground verbatim to the
 * `--color-dark-bg` CSS var (useThemeColors.ts:249). So "Bulka is the active
 * global palette" is detectable purely client-side by matching this value,
 * which is how the font/overrides get switched on for every user.
 */
export const BULKA_DARK_BG = '#1c1c1c';

/** True when a fetched palette is the Bulka palette. */
export function isBulkaPalette(
  colors?: { accent?: string; darkBackground?: string } | null,
): boolean {
  if (!colors) return false;
  return (
    (colors.accent ?? '').toLowerCase() === BULKA_COLORS.accent.toLowerCase() &&
    (colors.darkBackground ?? '').toLowerCase() === BULKA_DARK_BG
  );
}
