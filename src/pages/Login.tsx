import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  brandingApi,
  getCachedBranding,
  getLogoBlobUrl,
  isLogoPreloaded,
  preloadLogo,
  setCachedBranding,
  type BrandingInfo,
  type EmailAuthEnabled,
} from '../api/branding';
import AuthPanel from '../components/AuthPanel';
import LegalFooter from '../components/LegalFooter';
import { BackgroundRenderer } from '../components/backgrounds/BackgroundRenderer';
import { getPendingReferralCode } from '../utils/referral';
import { UsersIcon } from '@/components/icons';

export default function Login() {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  useEffect(() => {
    if (i18n.language !== 'ru') i18n.changeLanguage('ru');
  }, [i18n]);
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
  const { data: emailAuthConfig } = useQuery<EmailAuthEnabled>({
    queryKey: ['email-auth-enabled'],
    queryFn: brandingApi.getEmailAuthEnabled,
    staleTime: 60_000,
  });
  const { data: footerEnabled } = useQuery({
    queryKey: ['footer-enabled'],
    queryFn: brandingApi.getFooterEnabled,
    staleTime: 60_000,
  });
  const appName = branding?.name || import.meta.env.VITE_APP_NAME || 'VPN';
  const appLogo = branding?.logo_letter || import.meta.env.VITE_APP_LOGO || 'V';
  const logoUrl = branding?.has_custom_logo ? getLogoBlobUrl() : null;
  const referralCode = getPendingReferralCode();

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 sm:px-6 lg:px-8">
      <BackgroundRenderer />
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
          {referralCode && (emailAuthConfig?.enabled ?? true) && (
            <div className="mt-3 rounded-xl border border-accent-500/30 bg-accent-500/10 p-2.5">
              <div className="flex items-center justify-center gap-2 text-accent-400">
                <UsersIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium">{t('auth.referralInvite')}</span>
              </div>
            </div>
          )}
        </div>
        <AuthPanel
          initialMode={
            (location.state as { authMode?: string } | null)?.authMode === 'register'
              ? 'register'
              : undefined
          }
        />
        {footerEnabled && <LegalFooter className="pt-1" />}
      </div>
    </div>
  );
}
