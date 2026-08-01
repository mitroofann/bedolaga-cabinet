import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  brandingApi,
  getCachedBranding,
  getLogoBlobUrl,
  isLogoPreloaded,
  preloadLogo,
  setCachedBranding,
  type BrandingInfo,
} from '../api/branding';
import AuthPanel from '../components/AuthPanel';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTelegramSDK } from '../hooks/useTelegramSDK';

export default function Login() {
  const location = useLocation();
  const { safeAreaInset, contentSafeAreaInset } = useTelegramSDK();
  const safeTop = Math.max(safeAreaInset.top, contentSafeAreaInset.top);
  const safeBottom = Math.max(safeAreaInset.bottom, contentSafeAreaInset.bottom);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());
  const cachedBranding = useMemo(() => getCachedBranding(), []);
  const { data: branding } = useQuery<BrandingInfo>({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    staleTime: 60_000,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: 0,
  });
  const appName = branding?.name || import.meta.env.VITE_APP_NAME || 'VPN';
  const appLogo = branding?.logo_letter || import.meta.env.VITE_APP_LOGO || 'V';
  const logoUrl = branding?.has_custom_logo ? getLogoBlobUrl() : null;

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{
        paddingTop:
          safeTop > 0 ? `${safeTop + 16}px` : 'calc(1rem + env(safe-area-inset-top, 0px))',
        paddingBottom:
          safeBottom > 0 ? `${safeBottom + 16}px` : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="fixed right-3 z-50"
        style={{
          top: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <LanguageSwitcher />
      </div>
      <div className="relative w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-dark-700/50 bg-dark-800/80 shadow-md">
            <span
              className={`absolute text-lg font-bold text-accent-400 transition-opacity duration-200 ${logoUrl && logoLoaded ? 'opacity-0' : 'opacity-100'}`}
            >
              {appLogo}
            </span>
            {logoUrl && (
              <img
                src={logoUrl}
                alt={appName}
                className={`absolute h-full w-full object-contain transition-opacity duration-200 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLogoLoaded(true)}
              />
            )}
          </div>
          <h1 className="text-2xl font-bold text-dark-50">{appName}</h1>
        </div>
        <AuthPanel
          initialMode={
            (location.state as { authMode?: string } | null)?.authMode === 'register'
              ? 'register'
              : undefined
          }
        />
      </div>
    </div>
  );
}
