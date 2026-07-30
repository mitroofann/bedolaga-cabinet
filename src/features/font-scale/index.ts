/*
 * Global font-scale feature (isolated, merge-safe).
 *
 * Three scalable font categories keyed off CSS vars that tailwind.config.js
 * fontSize reads: --font-scale-small (2xs/xs/sm), --font-scale-body (base/lg),
 * --font-scale-heading (xl+). Each defaults to 1 → zero visual change until set.
 *
 * The scales are GLOBAL (admin-set, all users), so they're stored server-side
 * as an optional `font_scales` field on the branding-colors payload. Until the
 * bot backend adds that field, getColors simply won't return it and everything
 * stays at 1× — the frontend is inert-safe.
 */
// Scales the arbitrary-px font utilities (text-[10px] etc.) that Tailwind's
// named-scale vars can't reach. Inert at 1× until an admin sets a scale.
import './font-scale.css';

export interface FontScales {
  small: number;
  body: number;
  heading: number;
}

export const DEFAULT_FONT_SCALES: FontScales = { small: 1, body: 1, heading: 1 };

/** Discrete presets exposed in the admin UI (value = multiplier). */
export const FONT_SCALE_OPTIONS: { labelKey: string; value: number }[] = [
  { labelKey: 'admin.settings.fontSizes.smaller', value: 0.9 },
  { labelKey: 'admin.settings.fontSizes.normal', value: 1 },
  { labelKey: 'admin.settings.fontSizes.larger', value: 1.1 },
  { labelKey: 'admin.settings.fontSizes.largest', value: 1.2 },
];

const MIN = 0.75;
const MAX = 1.5;

function clampScale(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 1;
  return Math.max(MIN, Math.min(MAX, v));
}

/** Coerce an unknown (server) value into a safe FontScales object. */
export function normalizeFontScales(raw: unknown): FontScales {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_FONT_SCALES };
  const o = raw as Record<string, unknown>;
  return {
    small: clampScale(o.small),
    body: clampScale(o.body),
    heading: clampScale(o.heading),
  };
}

/** Write the scales to CSS vars on <html>. Called by the provider and previews. */
export function applyFontScales(scales: FontScales): void {
  const root = document.documentElement;
  const s = normalizeFontScales(scales);
  root.style.setProperty('--font-scale-small', String(s.small));
  root.style.setProperty('--font-scale-body', String(s.body));
  root.style.setProperty('--font-scale-heading', String(s.heading));
}

export { FontScaleProvider } from './FontScaleProvider';
