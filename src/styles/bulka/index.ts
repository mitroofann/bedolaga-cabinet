/*
 * Bulka theme activation — self-contained, toggleable feature.
 *
 * Adds the `theme-bulka` class to <html> so theme.css (font + color overrides)
 * takes effect. The class coexists with the developer's `.dark`/`.light` toggle.
 *
 * The theme is GLOBAL: the admin toggle (BulkaThemeToggle) writes the Bulka
 * palette to the server via the existing branding-colors API, so every user's
 * ThemeColorsProvider applies darkBackground=#1C1C1C. We detect that here (the
 * `--color-dark-bg` var) and switch the class on for everyone — no backend
 * changes needed. A manual localStorage flag / VITE_BULKA_THEME env can also
 * force it on for local testing or a build default.
 *
 * Force on locally from the browser console:  toggleBulkaTheme(true|false)
 */
import './theme.css';
import { BULKA_DARK_BG } from './constants';

const STORAGE_KEY = 'cabinet-bulka-theme';
const CLASS = 'theme-bulka';
const root = document.documentElement;

/** The server palette (applied inline by applyThemeColors) is the Bulka one. */
function paletteIsBulka(): boolean {
  try {
    const bg = getComputedStyle(root).getPropertyValue('--color-dark-bg').trim().toLowerCase();
    return bg === BULKA_DARK_BG;
  } catch {
    return false;
  }
}

function manualForceOn(): boolean {
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'on') return true;
  } catch {
    /* private mode */
  }
  return import.meta.env.VITE_BULKA_THEME === 'true';
}

function shouldEnable(): boolean {
  return paletteIsBulka() || manualForceOn();
}

function sync(): void {
  root.classList.toggle(CLASS, shouldEnable());
}

sync();

// Re-sync whenever applyThemeColors mutates the inline CSS vars (palette change)
// or useTheme flips the dark/light class. toggle(force) is idempotent, so
// re-adding our class on those mutations never loops.
new MutationObserver(sync).observe(root, {
  attributes: true,
  attributeFilter: ['style', 'class'],
});

// Console helper for local evaluation without a rebuild (force-on only).
(window as unknown as Record<string, unknown>).toggleBulkaTheme = (on = true): void => {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  sync();
};
