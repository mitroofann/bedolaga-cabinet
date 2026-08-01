import { Link, Navigate } from 'react-router';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import type { BrandingInfo } from '@/api/branding';
import type { LandingConfig } from '@/api/landings';
import {
  BackgroundRenderer,
  StaticBackgroundRenderer,
} from '@/components/backgrounds/BackgroundRenderer';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';
import AuthPanel from '@/components/AuthPanel';
import { LandingLegalFooter } from '../LandingLegalFooter';
import { LandingProgressSteps } from '../LandingProgressSteps';
import { LandingPublicHeader } from '../LandingPublicHeader';

interface BulkaSalesFlowProps {
  slug: string;
  intent: 'trial' | 'purchase';
  config: LandingConfig;
  branding?: BrandingInfo;
}

export function BulkaSalesFlow({ slug, intent, config, branding }: BulkaSalesFlowProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const continuation = `/buy/${slug}/flow${intent === 'trial' ? '?intent=trial' : ''}`;
  const selectedTariff = config.tariffs[0];

  if (isAuthenticated) return <Navigate to={continuation} replace />;

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {config.background_config ? (
        <StaticBackgroundRenderer config={config.background_config} />
      ) : (
        <BackgroundRenderer />
      )}
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-4 sm:px-6 lg:px-8">
        <LandingPublicHeader branding={branding} mode={authMode} onModeChange={setAuthMode} />
        <main className="flex-1 py-8 sm:py-10">
          <LandingProgressSteps current={1} />
          <section className="mx-auto mt-6 max-w-xl bento-card sm:mt-8">
            <h1 className="text-center text-xl font-semibold text-dark-50 sm:text-2xl">
              Продолжим с вашим аккаунтом
            </h1>
            <p className="mt-2 text-center text-sm text-dark-400">
              Войдите или создайте аккаунт — после этого вернём к оформлению выбранного доступа.
            </p>
            <div className="mt-6">
              <AuthPanel embedded initialMode={authMode} returnTo={continuation} />
            </div>
          </section>
          <section className="sr-only">
            <h2>{intent === 'trial' ? 'Пробный период' : 'Подписка'}</h2>
            {selectedTariff?.description && <SanitizedHtml html={selectedTariff.description} />}
            <Link to={continuation}>Продолжить</Link>
          </section>
        </main>
        <LandingLegalFooter />
      </div>
    </div>
  );
}
