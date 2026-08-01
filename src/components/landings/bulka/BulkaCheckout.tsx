import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { landingApi, type BulkaFlowPurchaseRequest } from '@/api/landings';
import { useCurrency } from '@/hooks/useCurrency';
import { getApiErrorMessage } from '@/utils/api-error';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';
import { LandingLegalFooter } from '../LandingLegalFooter';
import { LandingProgressSteps } from '../LandingProgressSteps';

interface BulkaCheckoutProps {
  slug: string;
  initialIntent: 'trial' | 'purchase';
}

function idempotencyKey() {
  return crypto.randomUUID();
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

  const tariff = useMemo(
    () => flow?.tariffs.find((item) => item.id === selectedTariffId) ?? flow?.tariffs[0] ?? null,
    [flow?.tariffs, selectedTariffId],
  );
  const period = useMemo(
    () =>
      tariff?.periods.find((item) => item.days === selectedPeriodDays) ??
      tariff?.periods[0] ??
      null,
    [tariff, selectedPeriodDays],
  );
  const method = flow?.payment_methods.find((item) => item.method_id === selectedMethod) ?? null;

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-dark-100">Выберите доступ</p>
            <p className="mt-1 text-xs text-dark-400">
              Исходный вариант можно изменить перед оплатой.
            </p>
          </div>
          <div
            className="flex rounded-xl landing-surface-inset p-1 text-xs font-medium"
            role="tablist"
            aria-label="Вариант доступа"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isTrial}
              onClick={() => selectIntent('trial')}
              className={`rounded-lg px-3 py-2 ${isTrial ? 'bg-accent-500 text-on-accent' : 'text-dark-400 hover:text-dark-200'}`}
            >
              Попробовать
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isTrial}
              onClick={() => selectIntent('purchase')}
              className={`rounded-lg px-3 py-2 ${!isTrial ? 'bg-accent-500 text-on-accent' : 'text-dark-400 hover:text-dark-200'}`}
            >
              Купить
            </button>
          </div>
        </div>
      </div>

      {isTrial ? (
        <div className="landing-surface-primary">
          <h1 className="text-xl font-semibold text-dark-50">Пробный период</h1>
          {flow.trial.tariff_description_html && (
            <SanitizedHtml
              html={flow.trial.tariff_description_html}
              className="mt-3 text-sm leading-relaxed text-dark-300"
            />
          )}
          {flow.trial.available ? (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl landing-surface-inset p-3">
                <div className="text-base font-semibold text-dark-100">
                  {flow.trial.duration_days}
                </div>
                <div className="text-[10px] text-dark-400">дней</div>
              </div>
              <div className="rounded-xl landing-surface-inset p-3">
                <div className="text-base font-semibold text-dark-100">
                  {flow.trial.traffic_limit_gb}
                </div>
                <div className="text-[10px] text-dark-400">ГБ</div>
              </div>
              <div className="rounded-xl landing-surface-inset p-3">
                <div className="text-base font-semibold text-dark-100">
                  {flow.trial.device_limit}
                </div>
                <div className="text-[10px] text-dark-400">устройства</div>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl landing-surface-inset p-3 text-sm text-dark-400">
              {flow.trial.unavailable_reason || 'Пробный период недоступен для этого аккаунта.'}
            </p>
          )}
        </div>
      ) : (
        <div className="landing-surface-primary space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-dark-50">Выберите тариф</h1>
            <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Тариф">
              {flow.tariffs.map((item) => {
                const selected = tariff?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setSelectedTariffId(item.id);
                      setSelectedPeriodDays(item.periods[0]?.days ?? null);
                      setSubmitError(null);
                    }}
                    className={`rounded-xl border p-3 text-left ${selected ? 'border-accent-500 bg-accent-500/10' : 'border-dark-700 landing-surface-inset hover:border-dark-600'}`}
                  >
                    <span className="block text-sm font-semibold text-dark-100">{item.name}</span>
                    {item.description_html && (
                      <SanitizedHtml
                        html={item.description_html}
                        className="mt-1 text-xs text-dark-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {tariff && (
            <div>
              <p className="mb-2 text-sm font-medium text-dark-200">Срок подписки</p>
              <div className="flex flex-wrap gap-2">
                {tariff.periods.map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setSelectedPeriodDays(item.days)}
                    className={`rounded-xl border px-3 py-2 text-sm ${period?.days === item.days ? 'border-accent-500 bg-accent-500/10 text-dark-100' : 'border-dark-700 landing-surface-inset text-dark-400 hover:border-dark-600'}`}
                  >
                    {item.days} дней
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="landing-surface-primary">
        <p className="mb-3 text-sm font-semibold text-dark-100">Способ оплаты</p>
        <div className="space-y-2" role="radiogroup" aria-label="Способ оплаты">
          {flow.payment_methods.map((item) => (
            <div key={item.method_id}>
              {
                <button
                  type="button"
                  role="radio"
                  aria-checked={method?.method_id === item.method_id}
                  onClick={() => selectMethod(item.method_id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${method?.method_id === item.method_id ? 'border-accent-500 bg-accent-500/10' : 'border-dark-700 landing-surface-inset hover:border-dark-600'}`}
                >
                  <span>
                    <span className="block text-sm font-medium text-dark-100">
                      {item.display_name}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 block text-xs text-dark-400">{item.description}</span>
                    )}
                  </span>
                  <span className="text-xs text-dark-500">{item.currency || ''}</span>
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
                        className={`rounded-lg px-2.5 py-1.5 text-xs ${selectedSubOption === option.id ? 'bg-accent-500 text-on-accent' : 'landing-surface-inset text-dark-400'}`}
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
          <p className="mt-3 text-sm text-error-400" aria-live="polite">
            {submitError}
          </p>
        )}
        <button
          type="button"
          disabled={!canPay || purchaseMutation.isPending}
          onClick={handlePayment}
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-accent-500 px-5 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {purchaseMutation.isPending
            ? 'Создаём оплату…'
            : priceKopeks === null
              ? 'Выберите условия'
              : `Оплатить ${formatAmount(priceKopeks / 100)} ${currencySymbol}`}
        </button>
      </div>
      <LandingLegalFooter />
    </div>
  );
}
