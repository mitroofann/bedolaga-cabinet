import type { ReactNode } from 'react';
import { uiLocale } from '@/utils/uiLocale';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/stats';
import { CalendarIcon, DevicesIcon, RefreshIcon, StatsChartIcon } from '@/components/icons';
import { formatTraffic } from '../../utils/formatTraffic';
import type { Subscription } from '../../types';

/**
 * Единая «обзорная» карточка подписки в стиле bento (как секции на странице
 * рефералов): чёткий заголовок + статус-бейдж, плитки ключевых чисел
 * (трафик / дни / устройства) и полоса прогресса. Тона плиток намеренно
 * нейтрально-акцентные (без zone-hue) — иначе цифры «расплываются» цветом.
 *
 * Компонент чисто презентационный: данные и колбэки приходят пропсами, чтобы
 * его можно было переиспользовать и на Главной, и на детальной странице.
 */
interface SubscriptionSummaryCardProps {
  subscription: Subscription;
  usedGb: number;
  usedPercent: number;
  isUnlimited: boolean;
  connectedDevices: number;
  /** Заголовок карточки. По умолчанию — название тарифа. */
  title?: string;
  /** Показать кнопку «Подключить устройство». */
  onConnect?: () => void;
  /** Кнопка обновления трафика (иконка + кулдаун). */
  onRefreshTraffic?: () => void;
  refreshing?: boolean;
  refreshCooldown?: number;
  /** Слот в подвале карточки (например, CTA продления во всю ширину). */
  footer?: ReactNode;
}

function statusBadge(subscription: Subscription): { cls: string; key: string } {
  if (subscription.is_active) {
    return subscription.is_trial
      ? { cls: 'badge-info', key: 'subscription.trialStatus' }
      : { cls: 'badge-success', key: 'subscription.active' };
  }
  if (subscription.is_limited) {
    return { cls: 'badge-warning', key: 'subscription.trafficLimited' };
  }
  if (subscription.status === 'disabled') {
    return { cls: 'badge-warning', key: 'subscription.pause.suspended' };
  }
  return { cls: 'badge-error', key: 'subscription.expired' };
}

export default function SubscriptionSummaryCard({
  subscription,
  usedGb,
  usedPercent,
  isUnlimited,
  connectedDevices,
  title,
  onConnect,
  onRefreshTraffic,
  refreshing = false,
  refreshCooldown = 0,
  footer,
}: SubscriptionSummaryCardProps) {
  const { t } = useTranslation();

  const daysLeft = subscription.days_left;
  const formattedDate = new Date(subscription.end_date).toLocaleDateString(uiLocale());
  const badge = statusBadge(subscription);

  const isAtDeviceLimit =
    subscription.device_limit > 0 && connectedDevices >= subscription.device_limit;

  return (
    <div className="bento-card">
      {/* Header: title + status */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg font-semibold text-dark-100">
          {title || subscription.tariff_name || t('subscription.currentPlan')}
        </h2>
        <span className={`${badge.cls} shrink-0`}>{t(badge.key)}</span>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label={t('subscription.traffic')}
            value={isUnlimited ? '∞' : `${Math.round(usedPercent)}%`}
            subValue={
              isUnlimited
                ? `${formatTraffic(usedGb)} ${t('dashboard.usedSuffix')}`
                : `${formatTraffic(usedGb)} / ${formatTraffic(subscription.traffic_limit_gb)}`
            }
            icon={<StatsChartIcon className="h-5 w-5" />}
            tone="accent"
          />
        </div>
        <StatCard
          label={t('dashboard.remaining')}
          value={daysLeft}
          subValue={t('dashboard.validUntil', { date: formattedDate })}
          icon={<CalendarIcon className="h-5 w-5" />}
          tone={daysLeft <= 3 ? 'warning' : 'neutral'}
        />
        <StatCard
          label={t('subscription.devices')}
          value={
            subscription.device_limit === 0
              ? `${connectedDevices} · ∞`
              : `${connectedDevices} / ${subscription.device_limit}`
          }
          icon={<DevicesIcon className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      {/* Connect device */}
      {onConnect && subscription.subscription_url && (
        <button
          type="button"
          onClick={onConnect}
          disabled={isAtDeviceLimit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 p-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DevicesIcon className="h-4 w-4" />
          {t('dashboard.connectDevice')}
        </button>
      )}
      {onConnect && subscription.subscription_url && isAtDeviceLimit && (
        <p className="mt-2 text-center text-xs font-medium text-warning-400">
          {t('dashboard.deviceLimitReached')}
        </p>
      )}

      {/* Refresh traffic */}
      {onRefreshTraffic && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onRefreshTraffic}
            disabled={refreshing || refreshCooldown > 0}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-dark-500 transition-colors hover:bg-dark-800/50 hover:text-dark-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('common.refresh')}
          >
            <RefreshIcon className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshCooldown > 0 ? `${refreshCooldown}s` : t('common.refresh')}
          </button>
        </div>
      )}

      {/* Footer slot — CTA продления во всю ширину (детальная страница). */}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
