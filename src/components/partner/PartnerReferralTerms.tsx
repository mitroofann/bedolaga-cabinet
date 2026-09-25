import { useTranslation } from 'react-i18next';
import type { PartnerReferralTerms as PartnerReferralTermsData } from '../../api/partners';
import { useCurrency } from '../../hooks/useCurrency';

interface PartnerReferralTermsProps {
  terms: PartnerReferralTermsData;
}

function valueOrDash(value: number | undefined, format: (value: number) => string): string {
  return value == null ? '—' : format(value);
}

export function PartnerReferralTerms({ terms }: PartnerReferralTermsProps) {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();
  const formatMoney = (kopeks: number) => formatWithCurrency(kopeks / 100);
  const formatLimit = (value: number | undefined) =>
    value == null ? '—' : value === 0 ? t('referral.partnerTerms.unlimited') : String(value);

  return (
    <section className="bento-card">
      <h2 className="mb-1 text-lg font-semibold text-dark-100">
        {t('referral.partnerTerms.title')}
      </h2>
      <p className="mb-4 text-sm text-dark-400">{t('referral.partnerTerms.description')}</p>

      {terms.scheme === 'legacy' ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <TermStat
            label={t('referral.partnerTerms.minimumTopup')}
            value={valueOrDash(terms.minimum_topup_kopeks, formatMoney)}
          />
          <TermStat
            label={t('referral.partnerTerms.firstTopupBonus')}
            value={valueOrDash(terms.first_topup_bonus_kopeks, formatMoney)}
          />
          <TermStat
            label={t('referral.partnerTerms.inviterBonus')}
            value={valueOrDash(terms.inviter_bonus_kopeks, formatMoney)}
          />
          <TermStat
            label={t('referral.partnerTerms.commission')}
            value={valueOrDash(terms.commission_percent, (value) => `${value}%`)}
          />
          <TermStat
            label={t('referral.partnerTerms.firstPaymentCommission')}
            value={valueOrDash(terms.first_payment_commission_percent, (value) => `${value}%`)}
          />
          <TermStat
            label={t('referral.partnerTerms.maxPayments')}
            value={formatLimit(terms.max_commission_payments)}
          />
          <TermStat
            label={t('referral.partnerTerms.maxCommission')}
            value={valueOrDash(terms.max_commission_kopeks, formatMoney)}
          />
          {terms.recurring_commission_tiers && terms.recurring_commission_tiers.length > 0 && (
            <div className="col-span-2 rounded-xl border border-dark-700/40 bg-dark-800/30 p-3 md:col-span-3">
              <div className="text-xs text-dark-500">
                {t('referral.partnerTerms.recurringTiers')}
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-dark-100">
                {terms.recurring_commission_tiers.map((tier) => (
                  <span
                    key={`${tier.payment_number}-${tier.percent}`}
                    className="rounded-lg bg-dark-700/60 px-2 py-1"
                  >
                    {tier.payment_number} → {tier.percent}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {terms.levels_mode && (
            <p className="text-sm text-dark-300">
              {t('referral.partnerTerms.levelsMode')}:{' '}
              {t(`referral.terms.mode${terms.levels_mode === 'chain' ? 'Chain' : 'Tiers'}`)}
            </p>
          )}
          {terms.levels?.map((level) => (
            <div
              key={level.level}
              className="rounded-xl border border-dark-700/40 bg-dark-800/30 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-accent-500/15 px-2 py-1 text-sm font-semibold text-accent-300">
                  {t('referral.terms.levelLabel', { level: level.level })}
                </span>
                <span className={level.is_active ? 'badge-success' : 'badge-neutral'}>
                  {level.is_active
                    ? t('referral.partnerTerms.active')
                    : t('referral.partnerTerms.inactive')}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-sm text-dark-300 md:grid-cols-2">
                <span>
                  {t('referral.partnerTerms.rewardMode')}: {level.reward_mode}
                </span>
                <span>
                  {t('referral.partnerTerms.trigger')}: {level.trigger}
                </span>
                <span>
                  {t('referral.partnerTerms.referrerReward')}:{' '}
                  {formatReward(
                    level.referrer_percent,
                    level.referrer_fixed_kopeks,
                    level.referrer_days,
                    formatMoney,
                  )}
                </span>
                <span>
                  {t('referral.partnerTerms.refereeReward')}:{' '}
                  {formatReward(
                    undefined,
                    level.referee_fixed_kopeks,
                    level.referee_days,
                    formatMoney,
                  )}
                </span>
                <span>
                  {t('referral.partnerTerms.maxPayments')}: {formatLimit(level.max_payments)}
                </span>
                <span>
                  {t('referral.partnerTerms.requiredReferrals')}: {level.required_referrals}
                </span>
                <span>
                  {t('referral.partnerTerms.activeOnly')}:{' '}
                  {level.required_referrals_active_only ? t('common.yes') : t('common.no')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatReward(
  percent: number | undefined,
  fixedKopeks: number,
  days: number,
  formatMoney: (kopeks: number) => string,
): string {
  const parts = [
    percent ? `${percent}%` : '',
    fixedKopeks ? formatMoney(fixedKopeks) : '',
    days ? `${days} дн.` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' + ') : '—';
}

function TermStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-dark-700/40 bg-dark-800/30 p-3">
      <div className="text-xs text-dark-500">{label}</div>
      <div className="mt-1 font-medium text-dark-100">{value}</div>
    </div>
  );
}
