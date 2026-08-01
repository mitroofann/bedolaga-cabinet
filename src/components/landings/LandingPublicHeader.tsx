import { Link } from 'react-router';
import type { BrandingInfo } from '@/api/branding';

interface LandingPublicHeaderProps {
  branding?: BrandingInfo;
  continuation: string;
}

export function LandingPublicHeader({ branding, continuation }: LandingPublicHeaderProps) {
  const name = 'Bulka VPN';
  const letter = branding?.logo_letter || 'B';

  return (
    <header className="flex items-center justify-between gap-4 border-b border-dark-700/40 py-4">
      <div className="flex min-w-0 items-center gap-3 text-dark-50">
        {branding?.has_custom_logo && branding.logo_url ? (
          <img src={branding.logo_url} alt="" className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-sm font-bold text-on-accent">
            {letter}
          </span>
        )}
        <span className="truncate text-base font-semibold">{name}</span>
      </div>
      <nav className="flex shrink-0 items-center gap-2" aria-label="Вход в кабинет">
        <Link
          to="/login"
          state={{ from: continuation }}
          className="rounded-xl px-3 py-2 text-sm font-medium text-dark-300 hover:bg-dark-800/50 hover:text-dark-100"
        >
          Войти
        </Link>
        <Link
          to="/login"
          state={{ from: continuation, authMode: 'register' }}
          className="rounded-xl bg-accent-500 px-3 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600"
        >
          Зарегистрироваться
        </Link>
      </nav>
    </header>
  );
}
