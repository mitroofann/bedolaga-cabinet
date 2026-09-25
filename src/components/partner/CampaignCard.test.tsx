// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PartnerCampaignInfo } from '../../api/partners';
import { CampaignCard } from './CampaignCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'referral.partner.stats.showDetails': 'Details',
        'referral.partner.stats.registrations': 'Registrations',
        'referral.partner.stats.referrals': 'Referrals',
        'referral.partner.stats.earnings': 'Earnings',
        'referral.partner.campaignLinks.sale': 'Sale link',
        'referral.partner.campaignLinks.trial': 'Trial link',
        'referral.partner.campaignLinks.landing': 'Landing link',
        'referral.partner.campaignLinks.bot': 'Bot link',
        'referral.partner.campaignLinks.web': 'Cabinet link',
      })[key] ?? key,
  }),
}));
vi.mock('../../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatWithCurrency: (value: number) => `${value} ₽`,
    formatPositive: (value: number) => `+${value} ₽`,
  }),
}));
vi.mock('../../platform', () => ({
  useHaptic: () => ({ notification: vi.fn(), impact: vi.fn() }),
}));
vi.mock('../../utils/clipboard', () => ({ copyToClipboard: vi.fn() }));
vi.mock('./CampaignDetailStats', () => ({ CampaignDetailStats: () => null }));
vi.mock('../stats/StatCard', () => ({
  StatCard: ({ label }: { label: string }) => <span>{label}</span>,
}));

const campaign: PartnerCampaignInfo = {
  id: 1,
  name: 'Summer',
  start_parameter: 'summer_2026',
  bonus_type: 'none',
  balance_bonus_kopeks: 0,
  subscription_duration_days: null,
  subscription_traffic_gb: null,
  deep_link: 'https://t.me/example?start=legacy',
  web_link: 'https://cabinet.example/ref=legacy',
  registrations_count: 0,
  referrals_count: 0,
  earnings_kopeks: 0,
};

afterEach(cleanup);

describe('CampaignCard', () => {
  it('shows backend campaign URLs verbatim and keeps legacy links', () => {
    render(
      <CampaignCard
        campaign={{
          ...campaign,
          sale_url: 'https://cabinet.bulkavpn.net/buy/now?campaign=summer_2026',
          trial_url: 'https://cabinet.bulkavpn.net/buy/now?campaign=summer_2026&intent=trial',
          landing_url: 'https://bulkavpn.net/?campaign=summer_2026',
        }}
      />,
    );

    expect(
      screen.getByDisplayValue('https://cabinet.bulkavpn.net/buy/now?campaign=summer_2026'),
    ).toBeTruthy();
    expect(
      screen.getByDisplayValue(
        'https://cabinet.bulkavpn.net/buy/now?campaign=summer_2026&intent=trial',
      ),
    ).toBeTruthy();
    expect(screen.getByDisplayValue('https://bulkavpn.net/?campaign=summer_2026')).toBeTruthy();
    expect(screen.getByDisplayValue('https://t.me/example?start=legacy')).toBeTruthy();
    expect(screen.getByDisplayValue('https://cabinet.example/ref=legacy')).toBeTruthy();
    expect(screen.getByText('Sale link')).toBeTruthy();
    expect(screen.getByText('Trial link')).toBeTruthy();
    expect(screen.getByText('Landing link')).toBeTruthy();
  });

  it('omits new URL rows when the backend does not supply them', () => {
    render(<CampaignCard campaign={campaign} />);

    expect(screen.queryByText('Sale link')).toBeNull();
    expect(screen.queryByText('Trial link')).toBeNull();
    expect(screen.queryByText('Landing link')).toBeNull();
    expect(screen.getByDisplayValue('https://t.me/example?start=legacy')).toBeTruthy();
    expect(screen.getByDisplayValue('https://cabinet.example/ref=legacy')).toBeTruthy();
  });
});
