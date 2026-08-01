import { Link, Navigate } from 'react-router';
import { useAuthStore } from '@/store/auth';
import type { BrandingInfo } from '@/api/branding';
import type { LandingConfig } from '@/api/landings';
import {
  BackgroundRenderer,
  StaticBackgroundRenderer,
} from '@/components/backgrounds/BackgroundRenderer';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';
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
  const continuation = `/buy/${slug}?flow=1${intent === 'trial' ? '&intent=trial' : ''}`;
  const selectedTariff = config.tariffs[0];

  if (isAuthenticated) {
    return (
      <Navigate to={`/buy/${slug}/flow${intent === 'trial' ? '?intent=trial' : ''}`} replace />
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {config.background_config ? (
        <StaticBackgroundRenderer config={config.background_config} />
      ) : (
        <BackgroundRenderer />
      )}
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-4 sm:px-6 lg:px-8">
        {!isAuthenticated && (
          <LandingPublicHeader branding={branding} continuation={continuation} />
        )}

        <main className="flex-1 py-8 sm:py-10">
          <LandingProgressSteps current={isAuthenticated ? 2 : 1} />

          {!isAuthenticated ? (
            <section className="mx-auto mt-6 max-w-xl bento-card text-center sm:mt-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/15 text-xl text-accent-400">
                B
              </span>
              <h1 className="mt-4 text-xl font-semibold text-dark-50 sm:text-2xl">
                Продолжим с вашим аккаунтом
              </h1>
              <p className="mt-2 text-sm text-dark-400">
                Войдите или создайте аккаунт — после этого вернём к оформлению выбранного доступа.
              </p>
              <Link
                to="/login"
                state={{ from: continuation }}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-accent-500 px-5 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600"
              >
                Продолжить
              </Link>
              <p className="mt-3 text-xs text-dark-500">
                Войти и регистрация доступны на следующем шаге.
              </p>
            </section>
          ) : (
            <section className="mt-6 space-y-4 sm:mt-8">
              <div className="bento-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-dark-100">Выберите доступ</p>
                    <p className="mt-1 text-xs text-dark-400">
                      Исходный выбор можно изменить перед оплатой.
                    </p>
                  </div>
                  <div className="flex rounded-xl bg-dark-800/50 p-1 text-xs font-medium">
                    <Link
                      to={`/buy/${slug}?flow=1&intent=trial`}
                      className={`rounded-lg px-3 py-2 ${intent === 'trial' ? 'bg-accent-500 text-on-accent' : 'text-dark-400 hover:text-dark-200'}`}
                    >
                      Попробовать
                    </Link>
                    <Link
                      to={`/buy/${slug}?flow=1`}
                      className={`rounded-lg px-3 py-2 ${intent === 'purchase' ? 'bg-accent-500 text-on-accent' : 'text-dark-400 hover:text-dark-200'}`}
                    >
                      Купить
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bento-card">
                <h1 className="text-xl font-semibold text-dark-50">
                  {intent === 'trial' ? 'Пробный период' : 'Подписка'}
                </h1>
                {selectedTariff?.description && (
                  <SanitizedHtml
                    html={selectedTariff.description}
                    className="mt-3 text-sm leading-relaxed text-dark-300"
                  />
                )}
                <p className="mt-4 rounded-xl bg-dark-800/50 p-3 text-sm text-dark-400">
                  {intent === 'trial'
                    ? 'Выберите способ оплаты. После подтверждения пробный период активируется автоматически.'
                    : 'Выберите тариф, срок и способ оплаты. После подтверждения подписка активируется автоматически.'}
                </p>
                <p className="mt-4 text-xs text-dark-500">
                  Платёжный шаг будет подключён после развёртывания безопасного backend-контракта
                  флоу.
                </p>
              </div>
            </section>
          )}
        </main>
        <LandingLegalFooter />
      </div>
    </div>
  );
}
