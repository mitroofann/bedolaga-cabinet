import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { themeColorsApi } from '../../api/themeColors';
import { applyFontScales, normalizeFontScales } from './index';

/**
 * Reads the global font_scales off the branding-colors payload (same query key
 * as ThemeColorsProvider, so no extra request) and applies them to <html>.
 * Absent field → defaults (1×), so this is inert until the backend ships it.
 */
export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ['theme-colors'],
    queryFn: themeColorsApi.getColors,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    const raw = (data as { font_scales?: unknown } | undefined)?.font_scales;
    applyFontScales(normalizeFontScales(raw));
  }, [data]);

  return <>{children}</>;
}
