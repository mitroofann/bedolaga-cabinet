import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { GiftIcon } from '@/components/icons';
import { useCurrency } from '../../hooks/useCurrency';
import type { ReferralTerms } from '../../types';

interface ReferralPromoBannerProps {
  /** Terms from GET /cabinet/referral/terms (may be undefined while loading) */
  terms?: ReferralTerms;
  /**
   * Акцентный вариант: чуть заметнее (accent-фон вместо нейтральной карточки).
   * Используется на странице подписки, где баннер конкурирует за внимание
   * с кнопкой продления; на /referral обычный стиль не нужен.
   */
  compact?: boolean;
  className?: string;
}

/**
 * [Форк] Промо-баннер реферальной программы «Пригласи друга».
 *
 * Показывается на странице подписки перед кнопкой продления и на /referral.
 * Все цифры берутся из /cabinet/referral/terms, ничего не хардкодится:
 * если бэкенд ещё не отдаёт `max_commission_kopeks` (старая версия) или
 * потолок выключен (0), баннер не показывается вовсе — чтобы не обещать
 * пользователю сумму, которую программа не платит.
 */
export function ReferralPromoBanner({
  terms,
  compact = false,
  className,
}: ReferralPromoBannerProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();

  const maxCommissionKopeks = terms?.max_commission_kopeks ?? 0;
  // Баннер имеет смысл только когда есть что обещать: потолок > 0.
  // (Условие показа «кому» — на вызывающей стороне: там известен контекст подписки.)
  if (maxCommissionKopeks <= 0) return null;

  const maxRubles = maxCommissionKopeks / 100;
  const percent = terms?.commission_percent ?? 0;
  const minTopupRubles = (terms?.minimum_topup_kopeks ?? 0) / 100;

  const description = t('referral.promo.description', {
    percent,
    minTopup: `${formatAmount(minTopupRubles)} ${currencySymbol}`,
    maxCommission: `${formatAmount(maxRubles)} ${currencySymbol}`,
  });

  return (
    <Link
      to="/referral"
      className={
        className ||
        `group relative block overflow-hidden rounded-3xl border p-5 transition-colors ${
          compact
            ? 'border-accent-500/30 bg-accent-500/10 hover:bg-accent-500/15'
            : 'border-dark-700/40 bg-dark-800/30 hover:bg-dark-800/50'
        }`
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-500/20 text-accent-400">
          <GiftIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-dark-100">
            {t('referral.promo.title', { max: `${formatAmount(maxRubles)} ${currencySymbol}` })}
          </div>
          <p className="mt-1 text-sm leading-snug text-dark-400 whitespace-pre-line">
            {description}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-400 transition-transform duration-200 group-hover:translate-x-0.5">
            {t('referral.promo.cta')}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
