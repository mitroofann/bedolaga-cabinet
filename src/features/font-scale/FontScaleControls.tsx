import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { themeColorsApi } from '../../api/themeColors';
import type { ThemeSettings } from '../../types/theme';
import {
  applyFontScales,
  normalizeFontScales,
  DEFAULT_FONT_SCALES,
  FONT_SCALE_OPTIONS,
  type FontScales,
} from './index';

const CATEGORIES: { key: keyof FontScales; labelKey: string }[] = [
  { key: 'heading', labelKey: 'admin.settings.fontSizes.heading' },
  { key: 'body', labelKey: 'admin.settings.fontSizes.body' },
  { key: 'small', labelKey: 'admin.settings.fontSizes.small' },
];

/**
 * Admin control for the global font scales. Self-contained (its own query +
 * mutation on the shared theme-colors payload) so ThemeTab wires it with one
 * line and it survives upstream merges. Applies instantly for preview and
 * persists font_scales via the existing updateColors PATCH.
 */
export function FontScaleControls() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['theme-colors'],
    queryFn: themeColorsApi.getColors,
  });

  const current = normalizeFontScales(
    (data as { font_scales?: unknown } | undefined)?.font_scales ?? DEFAULT_FONT_SCALES,
  );

  const mutation = useMutation({
    mutationFn: (font_scales: FontScales) =>
      themeColorsApi.updateColors({ font_scales } as Partial<ThemeSettings>),
    onSuccess: (updated) => {
      queryClient.setQueryData(['theme-colors'], updated);
      queryClient.invalidateQueries({ queryKey: ['theme-colors'] });
    },
  });

  const setCategory = (key: keyof FontScales, value: number) => {
    const next = { ...current, [key]: value };
    applyFontScales(next); // instant preview
    mutation.mutate(next);
  };

  return (
    <div className="rounded-2xl border border-dark-700/50 bg-dark-800/50 p-6">
      <h3 className="mb-1 text-lg font-semibold text-dark-100">
        {t('admin.settings.fontSizes.title', 'Font sizes')}
      </h3>
      <p className="mb-4 text-sm text-dark-400">
        {t(
          'admin.settings.fontSizes.description',
          'Scale text size by category (applies to everyone).',
        )}
      </p>

      <div className="space-y-3">
        {CATEGORIES.map(({ key, labelKey }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-dark-200">{t(labelKey)}</span>
            <div className="flex flex-wrap gap-2">
              {FONT_SCALE_OPTIONS.map((opt) => {
                const active = Math.abs(current[key] - opt.value) < 0.001;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(key, opt.value)}
                    disabled={mutation.isPending}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      active
                        ? 'bg-accent-500 text-on-accent'
                        : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
