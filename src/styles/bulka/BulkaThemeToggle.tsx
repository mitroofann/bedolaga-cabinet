import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { themeColorsApi } from '@/api/themeColors';
import { applyThemeColors } from '@/hooks/useThemeColors';
import { DEFAULT_THEME_COLORS, type ThemeColors, type ThemeSettings } from '@/types/theme';
import { Toggle } from '@/components/admin/Toggle';
import { BULKA_COLORS, isBulkaPalette } from './constants';

// Palette to restore when turning Bulka off (the admin's pre-Bulka colors).
const PREV_KEY = 'cabinet-bulka-prev-palette';

function toThemeColors(s: ThemeSettings | ThemeColors): ThemeColors {
  return {
    accent: s.accent,
    darkBackground: s.darkBackground,
    darkSurface: s.darkSurface,
    darkText: s.darkText,
    darkTextSecondary: s.darkTextSecondary,
    lightBackground: s.lightBackground,
    lightSurface: s.lightSurface,
    lightText: s.lightText,
    lightTextSecondary: s.lightTextSecondary,
    success: s.success,
    warning: s.warning,
    error: s.error,
  };
}

/**
 * Admin toggle for the Bulka theme. Self-contained so it can be dropped into the
 * developer's ThemeTab with a single line and survive upstream merges. Turning it
 * on pushes the Bulka palette to the server (global, all users); turning it off
 * restores the palette that was active before.
 */
export function BulkaThemeToggle() {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const ru = (i18n.language || '').toLowerCase().startsWith('ru');

  const { data: colors } = useQuery({
    queryKey: ['theme-colors'],
    queryFn: themeColorsApi.getColors,
  });

  const enabled = isBulkaPalette(colors);

  const mutation = useMutation({
    mutationFn: themeColorsApi.updateColors,
    onSuccess: (data) => {
      const next = toThemeColors(data);
      applyThemeColors(next);
      queryClient.setQueryData(['theme-colors'], data);
      queryClient.invalidateQueries({ queryKey: ['theme-colors'] });
    },
  });

  const handleToggle = () => {
    if (mutation.isPending) return;
    if (!enabled) {
      // Remember the current palette so we can restore it on toggle-off.
      try {
        if (colors) localStorage.setItem(PREV_KEY, JSON.stringify(toThemeColors(colors)));
      } catch {
        /* ignore */
      }
      mutation.mutate(BULKA_COLORS);
    } else {
      let prev: ThemeColors | null = null;
      try {
        const raw = localStorage.getItem(PREV_KEY);
        if (raw) prev = JSON.parse(raw) as ThemeColors;
      } catch {
        /* ignore */
      }
      // Don't restore Bulka itself if that's what was stored.
      mutation.mutate(prev && !isBulkaPalette(prev) ? prev : DEFAULT_THEME_COLORS);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl bg-dark-700/30 p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold"
          style={{ background: '#E8A33D', color: '#1C1C1C' }}
        >
          B
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-dark-200 sm:text-base">
            {ru ? 'Тема Bulka' : 'Bulka theme'}
          </span>
          <span className="text-xs text-dark-400">
            {ru ? 'Янтарный стиль сайта · для всех' : "Site's amber style · all users"}
          </span>
        </div>
      </div>
      <Toggle
        checked={enabled}
        onChange={handleToggle}
        disabled={mutation.isPending}
        aria-label={ru ? 'Тема Bulka' : 'Bulka theme'}
      />
    </div>
  );
}
