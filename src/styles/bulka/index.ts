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

/** The server palette (applied inline by applyThemeColors) is the Bulka one.
 *  Read the INLINE style, not getComputedStyle: theme.css overrides --color-dark-*
 *  via the .theme-bulka class, so a computed read would flip once the class is on
 *  and toggle it back off → infinite MutationObserver loop. The inline value is
 *  written only by applyThemeColors (the server palette) and is unaffected by our
 *  class, so it's a stable sentinel. */
function paletteIsBulka(): boolean {
  try {
    const bg = root.style.getPropertyValue('--color-dark-bg').trim().toLowerCase();
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
  const want = shouldEnable();
  // Only touch the class when it actually changes — writing it unconditionally
  // would retrigger our own MutationObserver (which watches 'class') every time,
  // an easy way to spin. No-op when already in the desired state.
  if (root.classList.contains(CLASS) === want) return;
  root.classList.toggle(CLASS, want);
}

sync();

// Re-sync whenever applyThemeColors mutates the inline CSS vars (palette change)
// or useTheme flips the dark/light class. sync() is a no-op when state is
// unchanged, so our own class writes don't re-loop.
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
