import { useEffect, useState } from 'react';
import type { BrandingInfo } from '@/api/branding';
import { brandingApi, getLogoBlobUrl, isLogoPreloaded, preloadLogo } from '@/api/branding';

interface LandingPublicHeaderProps {
  branding?: BrandingInfo;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export function LandingPublicHeader({ branding, mode, onModeChange }: LandingPublicHeaderProps) {
  const letter = branding?.logo_letter || 'B';
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());
  const [logoUrl, setLogoUrl] = useState<string | null>(() => getLogoBlobUrl());

  useEffect(() => {
    if (!branding?.has_custom_logo) return;
    let cancelled = false;
    preloadLogo(branding).then(() => {
      if (!cancelled) setLogoUrl(brandingApi.getLogoUrl(branding));
    });
    return () => {
      cancelled = true;
    };
  }, [branding]);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-dark-700/40 py-4">
      <div className="flex min-w-0 items-center gap-3 text-dark-50">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-500 text-sm font-bold text-on-accent">
          <span className={logoUrl && logoLoaded ? 'opacity-0' : 'opacity-100'}>{letter}</span>
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLogoLoaded(true)}
            />
          )}
        </span>
        <span className="truncate text-base font-semibold">Bulka VPN</span>
      </div>
      <nav className="flex shrink-0 items-center gap-2" aria-label="Вход в кабинет">
        <button
          type="button"
          onClick={() => onModeChange('login')}
          className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-dark-800 text-dark-100' : 'text-dark-300 hover:bg-dark-800/50 hover:text-dark-100'}`}
        >
          Войти
        </button>
        <button
          type="button"
          onClick={() => onModeChange('register')}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-accent-500 text-on-accent hover:bg-accent-600' : 'text-dark-300 hover:bg-dark-800/50 hover:text-dark-100'}`}
        >
          Зарегистрироваться
        </button>
      </nav>
    </header>
  );
}
