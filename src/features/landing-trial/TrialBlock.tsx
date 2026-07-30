import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DevicesIcon, DownloadIcon } from '@/components/icons';
import { cn } from '../../lib/utils';
import { formatPrice } from '../../utils/format';
import { fireAnalyticsEvent } from '../../hooks/useAnalyticsCounters';
import type { LandingConfig, LandingTrialConfig } from '../../api/landings';
import { useLandingTrial } from './useLandingTrial';
import { TrialSuccessPanel } from './TrialSuccessPanel';

interface TrialBlockProps {
  slug: string;
  config: LandingConfig;
  trial: LandingTrialConfig;
  /** When arriving via ?intent=trial — scroll into view, emphasize, focus contact. */
  autofocus?: boolean;
}

/**
 * Self-contained trial offer block, rendered above the tariff flow on the public
 * funnel when config.trial.enabled is true. Free trial → granted immediately
 * (auto-login or success panel); paid trial → redirect to payment. Isolated
 * feature — no edits to the purchase flow's own state.
 */
export function TrialBlock({ slug, config, trial, autofocus }: TrialBlockProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    contactValue,
    setContactValue,
    selectedMethod,
    setSelectedMethod,
    selectedSubOption,
    setSelectedSubOption,
    isSubmitting,
    submitError,
    freeResult,
    canSubmit,
    submit,
  } = useLandingTrial(slug, trial);

  // Capture yclid (Yandex Direct click id) into sessionStorage on mount, mirroring
  // how QuickPurchase captures subid — the hook then reads it for the request.
  useEffect(() => {
    try {
      const yclid = new URLSearchParams(window.location.search).get('yclid');
      if (yclid) sessionStorage.setItem('landing_yclid', yclid.slice(0, 256));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!autofocus || !rootRef.current) return;
    rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputRef.current?.focus();
  }, [autofocus]);

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) return;
    fireAnalyticsEvent('trial_click');
    submit();
  };

  const requiresPayment = trial.requires_payment;
  const priceLabel = requiresPayment
    ? formatPrice(trial.price_kopeks)
    : t('landingTrial.free', 'Free');

  const stats = [
    { value: String(trial.duration_days), label: t('landingTrial.days', 'days') },
    {
      value: trial.traffic_limit_gb === 0 ? '∞' : String(trial.traffic_limit_gb),
      label: t('landing.gb', 'GB'),
    },
    {
      value: trial.device_limit === 0 ? '∞' : String(trial.device_limit),
      label: t('landing.devices', 'devices'),
    },
  ];

  return (
    <div
      ref={rootRef}
      className={cn(
        'rounded-2xl border p-5 transition-all duration-300',
        autofocus
          ? 'border-accent-500/60 bg-accent-500/10 ring-2 ring-accent-500/30'
          : 'border-accent-500/30 bg-accent-500/5',
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-accent-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent-400">
          {requiresPayment
            ? t('landingTrial.badge', 'Trial')
            : t('landingTrial.badgeFree', 'Free trial')}
        </span>
        <span className="text-sm font-semibold text-dark-100">
          {t('landingTrial.title', 'Try before you buy')}
        </span>
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-6">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {i === 2 ? (
              <DevicesIcon className="h-4 w-4 text-accent-400" />
            ) : i === 1 ? (
              <DownloadIcon className="h-4 w-4 text-accent-400" />
            ) : null}
            <span className="text-lg font-bold text-dark-50">{s.value}</span>
            <span className="text-xs text-dark-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Price */}
      <p className="mb-4 text-sm text-dark-300">
        {t('landingTrial.priceLabel', 'Price')}:{' '}
        <span className="font-semibold text-dark-50">{priceLabel}</span>
      </p>

      {/* Success panel (free, no auto-login) OR the form */}
      {freeResult ? (
        <TrialSuccessPanel result={freeResult} />
      ) : (
        <>
          {/* Contact */}
          <label
            htmlFor="trial-contact-input"
            className="mb-2 block text-sm font-medium text-dark-200"
          >
            {t('landingTrial.contactLabel', 'Your contact')}
          </label>
          <input
            id="trial-contact-input"
            ref={inputRef}
            type="text"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder={t('landingTrial.contactPlaceholder', 'email@example.com or @telegram')}
            className="w-full rounded-xl border border-dark-700/50 bg-dark-800/50 px-4 py-3 text-sm text-dark-50 placeholder-dark-500 outline-none transition-colors focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/25"
          />
          <p className="mt-1.5 text-xs text-dark-500">
            {t('landingTrial.contactHint', 'Email or Telegram @username')}
          </p>

          {/* Payment methods (paid trial only) */}
          {requiresPayment && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-dark-200">
                {t('landing.paymentMethod', 'Payment method')}
              </p>
              {config.payment_methods.map((m) => {
                const isSelected = selectedMethod === m.method_id;
                const hasSub = m.sub_options && m.sub_options.length > 1;
                return (
                  <div
                    key={m.method_id}
                    className={cn(
                      'rounded-xl border transition-all duration-200',
                      isSelected
                        ? 'border-accent-500/50 bg-accent-500/5'
                        : 'border-dark-800/50 bg-dark-900/50 hover:border-dark-700/50',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod(m.method_id);
                        setSelectedSubOption(null);
                      }}
                      className="flex w-full items-center gap-3 p-3 text-start"
                    >
                      {m.icon_url && (
                        <img src={m.icon_url} alt="" className="h-6 w-6 shrink-0 object-contain" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-dark-100">
                        {m.display_name}
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                          isSelected ? 'border-accent-500 bg-accent-500' : 'border-dark-600',
                        )}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                    </button>
                    {isSelected && hasSub && (
                      <div className="flex flex-wrap gap-2 border-t border-dark-800/30 px-3 pb-3 pt-2">
                        {m.sub_options!.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedSubOption(opt.id)}
                            className={cn(
                              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                              selectedSubOption === opt.id
                                ? 'bg-accent-500 text-on-accent'
                                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50',
                            )}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {submitError && <p className="mt-3 text-sm text-error-400">{submitError}</p>}

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              'mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-all duration-200',
              canSubmit && !isSubmitting
                ? 'bg-accent-500 text-on-accent hover:bg-accent-400'
                : 'cursor-not-allowed bg-dark-800/50 text-dark-500',
            )}
          >
            {isSubmitting
              ? t('landing.processing', 'Processing...')
              : requiresPayment
                ? t('landingTrial.ctaPaid', {
                    price: priceLabel,
                    defaultValue: 'Get trial for {{price}}',
                  })
                : t('landingTrial.ctaFree', 'Start free trial')}
          </button>
        </>
      )}
    </div>
  );
}
