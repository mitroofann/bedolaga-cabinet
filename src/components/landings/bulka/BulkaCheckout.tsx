import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { landingApi, type BulkaFlowPurchaseRequest } from '@/api/landings';
import { useCurrency } from '@/hooks/useCurrency';
import { getApiErrorMessage } from '@/utils/api-error';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';
import {
  ArrowDownIcon,
  type CalendarIcon,
  CheckIcon,
  DevicesIcon,
  InfinityIcon,
} from '@/components/icons';
import { LandingLegalFooter } from '../LandingLegalFooter';
import { LandingProgressSteps } from '../LandingProgressSteps';

interface BulkaCheckoutProps {
  slug: string;
  initialIntent: 'trial' | 'purchase';
}

const TRIAL_FEATURES: { icon: string; title?: string; text: string; hint?: string }[] = [
  { icon: '🌍', title: 'Полный безлимит', text: ' на зарубежных локациях' },
  {
    icon: '🛡️',
    title: 'Обход БС',
    text: ': пакет 50 ГБ LTE-трафика',
    hint: 'Работает даже при самых жёстких ограничениях мобильного интернета',
  },
  { icon: '🏛', title: 'Умный VPN', text: ': российские сервисы не ругаются' },
  { icon: '⚡️', text: 'Высокая скорость — 1 Гбит/с' },
  { icon: '❤️', text: 'YouTube без рекламы' },
  { icon: '📱', text: '5 устройств включено в подписку' },
];

function idempotencyKey() {
  return crypto.randomUUID();
}

function AccessMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof CalendarIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="landing-access-metric">
      <Icon className="h-4 w-4 text-accent-400" />
      <span className="font-semibold text-dark-100">{value}</span>
      <span className="text-dark-400">{label}</span>
    </div>
  );
}

function TrafficMetric({ trafficLimitGb }: { trafficLimitGb: number }) {
  const unlimited = trafficLimitGb === 0;
  return (
    <AccessMetric
      icon={unlimited ? InfinityIcon : ArrowDownIcon}
      value={unlimited ? '∞' : String(trafficLimitGb)}
      label={unlimited ? 'трафик' : 'ГБ трафика'}
    />
  );
}

function DevicesMetric({ deviceLimit }: { deviceLimit: number }) {
  const unlimited = deviceLimit === 0;
  return (
    <AccessMetric
      icon={unlimited ? InfinityIcon : DevicesIcon}
      value={unlimited ? '∞' : String(deviceLimit)}
      label={unlimited ? 'устройства' : deviceLimit === 1 ? 'устройство' : 'устройства'}
    />
  );
}

export function BulkaCheckout({ slug, initialIntent }: BulkaCheckoutProps) {
  const { formatAmount, currencySymbol } = useCurrency();
  const [intent, setIntent] = useState<'trial' | 'purchase'>(initialIntent);
  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedSubOption, setSelectedSubOption] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: flow,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bulka-flow', slug],
    queryFn: () => landingApi.getBulkaFlowConfig(slug),
    staleTime: 30_000,
  });

  const availableDurations = useMemo(
    () =>
      [
        ...new Set(
          flow?.tariffs.flatMap((item) => item.periods.map((period) => period.days)) ?? [],
        ),
      ].sort((a, b) => a - b),
    [flow?.tariffs],
  );
  const compatibleTariffs = useMemo(
    () =>
      flow?.tariffs.filter((item) =>
        selectedPeriodDays === null
          ? true
          : item.periods.some((period) => period.days === selectedPeriodDays),
      ) ?? [],
    [flow?.tariffs, selectedPeriodDays],
  );
  const tariff = useMemo(
    () =>
      compatibleTariffs.find((item) => item.id === selectedTariffId) ??
      compatibleTariffs[0] ??
      null,
    [compatibleTariffs, selectedTariffId],
  );
  const period = useMemo(
    () =>
      tariff?.periods.find((item) => item.days === selectedPeriodDays) ??
      (selectedPeriodDays === null ? tariff?.periods[0] : null) ??
      null,
    [tariff, selectedPeriodDays],
  );
  const method = flow?.payment_methods.find((item) => item.method_id === selectedMethod) ?? null;

  useEffect(() => {
    if (!flow || intent !== 'purchase') return;
    const hasSelectedDuration =
      selectedPeriodDays !== null && availableDurations.includes(selectedPeriodDays);
    const nextDuration = hasSelectedDuration
      ? selectedPeriodDays
      : availableDurations.includes(90)
        ? 90
        : (availableDurations[0] ?? null);
    if (nextDuration !== selectedPeriodDays) {
      setSelectedPeriodDays(nextDuration);
      return;
    }
    if (tariff && tariff.id !== selectedTariffId) setSelectedTariffId(tariff.id);
  }, [availableDurations, flow, intent, selectedPeriodDays, selectedTariffId, tariff]);

  useEffect(() => {
    if (!flow || selectedMethod !== null) return;
    const defaultMethod = flow.payment_methods[0];
    if (!defaultMethod) return;
    setSelectedMethod(defaultMethod.method_id);
    setSelectedSubOption(defaultMethod.sub_options?.[0]?.id ?? null);
  }, [flow, selectedMethod]);

  const purchaseMutation = useMutation({
    mutationFn: (data: BulkaFlowPurchaseRequest) =>
      landingApi.createBulkaFlowPurchase(slug, data, idempotencyKey()),
    onSuccess: (result) => {
      window.location.assign(result.payment_url);
    },
    onError: (requestError) => {
      setSubmitError(getApiErrorMessage(requestError, 'Не удалось создать оплату'));
    },
  });

  const selectIntent = (nextIntent: 'trial' | 'purchase') => {
    setIntent(nextIntent);
    setSelectedTariffId(null);
    setSelectedPeriodDays(null);
    setSelectedMethod(null);
    setSelectedSubOption(null);
    setSubmitError(null);
  };

  const selectMethod = (methodId: string) => {
    const nextMethod = flow?.payment_methods.find((item) => item.method_id === methodId);
    setSelectedMethod(methodId);
    setSelectedSubOption(nextMethod?.sub_options?.[0]?.id ?? null);
    setSubmitError(null);
  };

  const handlePayment = () => {
    if (!flow || !selectedMethod) return;
    if (intent === 'trial') {
      if (!flow.trial.available) return;
      purchaseMutation.mutate({
        flow_kind: 'trial',
        payment_method: selectedMethod,
        payment_sub_option: selectedSubOption,
        language: 'ru',
        referrer: sessionStorage.getItem('landing_referrer'),
        subid: sessionStorage.getItem('landing_subid'),
      });
      return;
    }
    if (!tariff || !period) return;
    purchaseMutation.mutate({
      flow_kind: 'purchase',
      tariff_id: tariff.id,
      period_days: period.days,
      payment_method: selectedMethod,
      payment_sub_option: selectedSubOption,
      language: 'ru',
      referrer: sessionStorage.getItem('landing_referrer'),
      subid: sessionStorage.getItem('landing_subid'),
    });
  };

  if (isLoading) {
    return <div className="landing-surface-primary mt-6 h-64 animate-pulse" />;
  }

  if (error || !flow) {
    return (
      <div className="landing-surface-primary mt-6 text-center text-sm text-error-400">
        {getApiErrorMessage(error, 'Не удалось загрузить условия оформления')}
      </div>
    );
  }

  const isTrial = intent === 'trial';
  const priceKopeks = isTrial ? flow.trial.price_kopeks : (period?.price_kopeks ?? null);
  const canPay = Boolean(
    selectedMethod && priceKopeks !== null && (isTrial ? flow.trial.available : tariff && period),
  );

  return (
    <div className="space-y-4">
      <LandingProgressSteps current={2} />
      <div className="landing-surface-primary">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-dark-50 sm:text-2xl">Как хотите начать?</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-dark-400 sm:text-base">
            Выберите пробный доступ или сразу оформите подписку. Вариант можно изменить до оплаты.
          </p>
        </div>
        <div className="landing-intent-switcher mt-5" role="tablist" aria-label="Вариант доступа">
          <button
            type="button"
            role="tab"
            aria-selected={isTrial}
            onClick={() => selectIntent('trial')}
            className={isTrial ? 'is-selected' : ''}
          >
            <span>Попробовать</span>
            <span className="landing-intent-switcher__hint">Пробный доступ</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isTrial}
            onClick={() => selectIntent('purchase')}
            className={!isTrial ? 'is-selected' : ''}
          >
            <span>Купить</span>
            <span className="landing-intent-switcher__hint">Подписка VPN</span>
          </button>
        </div>
      </div>

      {isTrial ? (
        <div className="landing-surface-primary text-left">
          <div>
            <h2 className="text-xl font-bold text-dark-50 sm:text-2xl">Пробный период</h2>
            <p className="mt-2 text-sm leading-relaxed text-dark-400 sm:text-base">
              После подтверждения оплаты доступ активируется автоматически, а затем вы получите
              инструкцию для подключения VPN.
            </p>
          </div>
          {flow.trial.available ? (
            <ul className="mt-6 space-y-3.5">
              {TRIAL_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none"
                  >
                    {feature.icon}
                  </span>
                  <span className="min-w-0 text-sm leading-relaxed text-dark-300 sm:text-base">
                    {feature.title && (
                      <b className="font-semibold text-dark-100">{feature.title}</b>
                    )}
                    {feature.text}
                    {feature.hint && (
                      <span className="mt-0.5 block text-xs leading-relaxed text-dark-400 sm:text-sm">
                        {feature.hint}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-xl landing-surface-inset p-4 text-sm leading-relaxed text-dark-300 sm:text-base">
              {flow.trial.unavailable_reason || 'Пробный период недоступен для этого аккаунта.'}
            </p>
          )}
        </div>
      ) : (
        <div className="landing-surface-primary space-y-5">
          <div>
            <h2 className="text-xl font-bold text-dark-50 sm:text-2xl">Выберите срок подписки</h2>
            <p className="mt-2 text-sm leading-relaxed text-dark-400 sm:text-base">
              Сначала выберите продолжительность доступа, затем подходящий тариф.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Срок подписки">
              {availableDurations.map((days) => (
                <button
                  key={days}
                  type="button"
                  role="radio"
                  aria-checked={selectedPeriodDays === days}
                  onClick={() => {
                    setSelectedPeriodDays(days);
                    setSubmitError(null);
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${selectedPeriodDays === days ? 'border-accent-500 bg-accent-500/10 text-dark-100' : 'border-dark-700 landing-surface-inset text-dark-300 hover:border-dark-600'}`}
                >
                  {days} дней
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-50 sm:text-2xl">Выберите тариф</h2>
            <p className="mt-2 text-sm leading-relaxed text-dark-400 sm:text-base">
              После оплаты мы сразу активируем подписку и покажем, как подключить VPN на устройстве.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Тариф">
              {compatibleTariffs.map((item) => {
                const selected = tariff?.id === item.id;
                const selectedItemPeriod = item.periods.find(
                  (candidate) => candidate.days === selectedPeriodDays,
                );
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setSelectedTariffId(item.id);
                      setSubmitError(null);
                    }}
                    className={`landing-tariff-card ${selected ? 'is-selected' : ''}`}
                  >
                    <span className="landing-tariff-card__header">
                      <span className="landing-tariff-card__name">{item.name}</span>
                      {selected && <CheckIcon className="landing-tariff-card__check" />}
                    </span>
                    {item.description_html && (
                      <SanitizedHtml
                        html={item.description_html}
                        className="mt-2 whitespace-pre-line text-sm leading-relaxed text-dark-400"
                      />
                    )}
                    {selectedItemPeriod && (
                      <div className="mt-4 text-left">
                        <span className="block text-xs text-dark-400">
                          за {selectedPeriodDays} дней
                        </span>
                        <span className="mt-1 block text-lg font-semibold text-dark-100">
                          {formatAmount(selectedItemPeriod.price_kopeks / 100, 0)} {currencySymbol}
                        </span>
                      </div>
                    )}
                    <div className="landing-tariff-metrics mt-4">
                      <TrafficMetric trafficLimitGb={item.traffic_limit_gb} />
                      <DevicesMetric deviceLimit={item.device_limit} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="landing-surface-primary">
        <h2 className="text-xl font-bold text-dark-50 sm:text-2xl">Способ оплаты</h2>
        <p className="mt-2 text-sm leading-relaxed text-dark-400 sm:text-base">
          Выберите удобный способ. Оплата пройдёт на защищённой странице провайдера.
        </p>
        <div className="mt-4 space-y-3" role="radiogroup" aria-label="Способ оплаты">
          {flow.payment_methods.map((item) => (
            <div key={item.method_id}>
              {
                <button
                  type="button"
                  role="radio"
                  aria-checked={method?.method_id === item.method_id}
                  onClick={() => selectMethod(item.method_id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${method?.method_id === item.method_id ? 'border-accent-500 bg-accent-500/10' : 'border-dark-700 landing-surface-inset hover:border-dark-600'}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {item.icon_url && (
                      <img
                        src={item.icon_url}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-lg object-contain"
                      />
                    )}
                    <span>
                      <span className="block text-base font-medium text-dark-100">
                        {item.display_name}
                      </span>
                      {item.description && (
                        <span className="mt-1 block text-sm leading-relaxed text-dark-400">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-dark-400">{item.currency || ''}</span>
                </button>
              }
              {method?.method_id === item.method_id &&
                item.sub_options &&
                item.sub_options.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.sub_options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedSubOption(option.id)}
                        className={`rounded-lg px-3 py-2 text-sm ${selectedSubOption === option.id ? 'bg-accent-500 text-on-accent' : 'landing-surface-inset text-dark-300'}`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
        {submitError && (
          <p className="mt-4 text-sm text-error-400" aria-live="polite">
            {submitError}
          </p>
        )}
        <button
          type="button"
          disabled={!canPay || purchaseMutation.isPending}
          onClick={handlePayment}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-accent-500 px-5 py-4 text-base font-semibold text-on-accent transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {purchaseMutation.isPending
            ? 'Создаём оплату…'
            : priceKopeks === null
              ? 'Выберите условия'
              : `Перейти к оплате · ${formatAmount(priceKopeks / 100, 0)} ${currencySymbol}`}
        </button>
        <p className="landing-payment-reassurance">
          После подтверждения оплаты доступ активируется автоматически. На следующем шаге покажем
          простую инструкцию для подключения устройства.
        </p>
      </div>
      <LandingLegalFooter />
    </div>
  );
}
