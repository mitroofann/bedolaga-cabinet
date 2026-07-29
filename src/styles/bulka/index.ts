/*
 * Bulka theme activation — self-contained, toggleable feature.
 *
 * Adds the `theme-bulka` class to <html> so theme.css takes effect. The class
 * coexists with the developer's `.dark`/`.light` toggle (useTheme only adds/
 * removes those two), so both Bulka variants follow the normal light/dark switch.
 *
 * Toggle (checked in order):
 *   1. localStorage['cabinet-bulka-theme'] === 'on' | 'off'  (runtime, no rebuild)
 *   2. VITE_BULKA_THEME === 'true'                            (build-time default)
 *
 * Flip live from the browser console with:  toggleBulkaTheme(true|false)
 */
import './theme.css';

const STORAGE_KEY = 'cabinet-bulka-theme';
const CLASS = 'theme-bulka';

function isEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'on') return true;
    if (stored === 'off') return false;
  } catch {
    /* private mode / quota — fall through to env */
  }
  return import.meta.env.VITE_BULKA_THEME === 'true';
}

function apply(enabled: boolean): void {
  document.documentElement.classList.toggle(CLASS, enabled);
}

apply(isEnabled());

// Console helper for evaluating the theme without a rebuild.
(window as unknown as Record<string, unknown>).toggleBulkaTheme = (on = true): void => {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  apply(on);
};
