import { useNavigate } from 'react-router';
import type { UseMutationResult } from '@tanstack/react-query';
import SubscriptionSummaryCard from './SubscriptionSummaryCard';
import type { Subscription } from '../../types';

interface SubscriptionCardActiveProps {
  subscription: Subscription;
  trafficData: {
    traffic_used_gb: number;
    traffic_used_percent: number;
    is_unlimited: boolean;
  } | null;
  refreshTrafficMutation: UseMutationResult<unknown, unknown, void, unknown>;
  trafficRefreshCooldown: number;
  connectedDevices: number;
}

/**
 * Обзорная карточка активной подписки на Главной. Раньше это была большая
 * «стеклянная» карточка со своей вёрсткой; теперь она единообразна с секциями
 * остального кабинета (bento + StatCard) через общий SubscriptionSummaryCard.
 * Пропсы сохранены прежними, чтобы Dashboard не менять.
 */
export default function SubscriptionCardActive({
  subscription,
  trafficData,
  refreshTrafficMutation,
  trafficRefreshCooldown,
  connectedDevices,
}: SubscriptionCardActiveProps) {
  const navigate = useNavigate();

  const usedPercent = trafficData?.traffic_used_percent ?? subscription.traffic_used_percent;
  const usedGb = trafficData?.traffic_used_gb ?? subscription.traffic_used_gb;
  const isUnlimited = trafficData?.is_unlimited ?? subscription.traffic_limit_gb === 0;

  return (
    <div data-onboarding="connect-devices">
      <SubscriptionSummaryCard
        subscription={subscription}
        usedGb={usedGb}
        usedPercent={usedPercent}
        isUnlimited={isUnlimited}
        connectedDevices={connectedDevices}
        title={subscription.tariff_name || undefined}
        onConnect={() => navigate(`/connection?sub=${subscription.id}`)}
        onRefreshTraffic={() => refreshTrafficMutation.mutate()}
        refreshing={refreshTrafficMutation.isPending}
        refreshCooldown={trafficRefreshCooldown}
      />
    </div>
  );
}
