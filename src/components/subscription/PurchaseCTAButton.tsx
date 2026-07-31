import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronRightIcon, SubscriptionIcon } from '@/components/icons';
import type { Subscription } from '../../types';

interface PurchaseCTAButtonProps {
  subscription: Subscription | null;
  /** In multi-tariff mode, link to /subscriptions/:id/renew instead of /subscription/purchase */
  isMultiTariff?: boolean;
}

export default function PurchaseCTAButton({
  subscription,
  isMultiTariff = false,
}: PurchaseCTAButtonProps) {
  const { t } = useTranslation();

  const isExpired =
    !subscription ||
    (!subscription.is_active && !subscription.is_trial && !subscription.is_limited);
  const isTrial = subscription?.is_trial;
  const isDaily = subscription?.is_daily;

  // Daily tariffs renew automatically — no manual renewal button needed in multi-tariff
  if (isMultiTariff && isDaily && !isExpired) return null;

  const buttonText = isExpired
    ? t('subscription.getSubscription')
    : isTrial
      ? t('subscription.trialUpgrade.title')
      : t('subscription.extend');

  const hintText = isExpired
    ? t('subscription.cta.expiredHint')
    : isTrial
      ? t('subscription.cta.trialHint')
      : isMultiTariff
        ? t('subscription.cta.renewHint', 'Продление подписки')
        : t('subscription.cta.activeHint');

  // Trial → purchase page (buy a real tariff, trial can't be renewed)
  // Multi-tariff active → per-subscription renew page
  // Otherwise → purchase page
  const linkTo = isTrial
    ? '/subscription/purchase'
    : isMultiTariff && subscription?.id
      ? `/subscriptions/${subscription.id}/renew`
      : '/subscription/purchase';

  return (
    <Link to={linkTo} className="block">
      {/* Золотистая (accent) кнопка в едином статичном стиле кабинета
        (как «Подключить устройство» на главной): обычный бордер, без бликов. */}
      <button
        type="button"
        className="group flex w-full items-center justify-between rounded-2xl bg-accent-500 px-5 py-4 text-left ring-1 ring-inset ring-white/15 transition-colors duration-300 hover:bg-accent-600"
      >
        <div className="flex items-center gap-3">
          {/* Sparkle icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-on-accent">
            <SubscriptionIcon className="h-[18px] w-[18px]" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-on-accent">{buttonText}</div>
            <div className="text-[12px] text-on-accent/70">{hintText}</div>
          </div>
        </div>

        {/* Right: chevron */}
        <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-on-accent/70 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </Link>
  );
}
