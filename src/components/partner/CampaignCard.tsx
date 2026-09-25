import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiCaretDown } from 'react-icons/pi';

import { CheckIcon, CopyIcon } from '@/components/icons';
import type { PartnerCampaignInfo } from '../../api/partners';
import { PARTNER_STATS } from '../../constants/partner';
import { useCurrency } from '../../hooks/useCurrency';
import { useHaptic } from '../../platform';
import { copyToClipboard } from '../../utils/clipboard';
import { CampaignDetailStats } from './CampaignDetailStats';
import { StatCard } from '../stats/StatCard';

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <PiCaretDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
);

interface CampaignCardProps {
  campaign: PartnerCampaignInfo;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { t } = useTranslation();
  const { formatWithCurrency, formatPositive } = useCurrency();
  const haptic = useHaptic();
  const [expanded, setExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const handleCopy = useCallback(
    async (url: string, key: string) => {
      try {
        await copyToClipboard(url);
        haptic.notification('success');
        setCopiedLink(key);
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(
          () => setCopiedLink(null),
          PARTNER_STATS.COPY_FEEDBACK_MS,
        );
      } catch {
        haptic.notification('error');
      }
    },
    [haptic],
  );

  const handleToggleExpand = useCallback(() => {
    haptic.impact('light');
    setExpanded((prev) => !prev);
  }, [haptic]);

  const botKey = `${campaign.id}-bot`;
  const webKey = `${campaign.id}-web`;
  const saleKey = `${campaign.id}-sale`;
  const trialKey = `${campaign.id}-trial`;
  const landingKey = `${campaign.id}-landing`;

  const linkRow = (url: string, label: string, key: string) => (
    <div>
      <div className="mb-1 text-xs font-medium text-dark-500">{label}</div>
      <div className="flex items-center gap-2">
        <input type="text" readOnly value={url} className="input flex-1 text-xs" />
        <button
          type="button"
          onClick={() => handleCopy(url, key)}
          className={`btn-primary shrink-0 px-3 py-2.5 ${
            copiedLink === key ? 'bg-success-500 hover:bg-success-500' : ''
          }`}
        >
          {copiedLink === key ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bento-card space-y-4">
      {/* Campaign header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-base font-semibold text-dark-100">{campaign.name}</h3>
        <button
          onClick={handleToggleExpand}
          aria-expanded={expanded}
          aria-controls={`campaign-detail-${campaign.id}`}
          className="flex shrink-0 items-center gap-1 text-sm text-accent-400 transition-colors hover:text-accent-300"
        >
          <span>
            {expanded
              ? t('referral.partner.stats.hideDetails')
              : t('referral.partner.stats.showDetails')}
          </span>
          <ChevronIcon expanded={expanded} />
        </button>
      </div>

      {/* Basic stats -- always visible */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard
          label={t('referral.partner.stats.registrations')}
          value={campaign.registrations_count}
        />
        <StatCard
          label={t('referral.partner.stats.referrals')}
          value={campaign.referrals_count}
          valueClassName="text-accent-400"
        />
        <StatCard
          label={t('referral.partner.stats.earnings')}
          value={formatPositive(campaign.earnings_kopeks / PARTNER_STATS.KOPEKS_DIVISOR)}
          valueClassName="text-success-400"
        />
      </div>

      {/* Bonus info */}
      {campaign.bonus_type !== 'none' && (
        <div className="rounded-lg bg-success-500/10 p-3">
          <div className="mb-1 text-xs font-medium text-success-500">
            {t('referral.partner.campaignBonus.title')}
          </div>
          <div className="text-sm font-semibold text-success-400">
            {campaign.bonus_type === 'balance' &&
              t('referral.partner.campaignBonus.balanceDesc', {
                amount: formatWithCurrency(
                  campaign.balance_bonus_kopeks / PARTNER_STATS.KOPEKS_DIVISOR,
                  0,
                ),
              })}
            {campaign.bonus_type === 'subscription' &&
              t('referral.partner.campaignBonus.subscriptionDesc', {
                days: campaign.subscription_duration_days ?? 0,
                ...(campaign.subscription_traffic_gb
                  ? { traffic: campaign.subscription_traffic_gb }
                  : {}),
              })}
            {campaign.bonus_type === 'tariff' && t('referral.partner.campaignBonus.tariffDesc')}
          </div>
        </div>
      )}

      {campaign.sale_url &&
        linkRow(campaign.sale_url, t('referral.partner.campaignLinks.sale'), saleKey)}
      {campaign.trial_url &&
        linkRow(campaign.trial_url, t('referral.partner.campaignLinks.trial'), trialKey)}
      {campaign.landing_url &&
        linkRow(campaign.landing_url, t('referral.partner.campaignLinks.landing'), landingKey)}
      {campaign.deep_link &&
        linkRow(campaign.deep_link, t('referral.partner.campaignLinks.bot'), botKey)}
      {campaign.web_link &&
        linkRow(campaign.web_link, t('referral.partner.campaignLinks.web'), webKey)}

      {/* Expanded detail stats */}
      <div id={`campaign-detail-${campaign.id}`}>
        {expanded && <CampaignDetailStats campaignId={campaign.id} />}
      </div>
    </div>
  );
}
