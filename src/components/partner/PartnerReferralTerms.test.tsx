// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PartnerReferralTerms as PartnerReferralTermsData } from '../../api/partners';
import { PartnerReferralTerms } from './PartnerReferralTerms';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const labels: Record<string, string> = {
        'referral.partnerTerms.title': 'Your partner terms',
        'referral.partnerTerms.description': 'Future rewards',
        'referral.partnerTerms.minimumTopup': 'Minimum top-up',
        'referral.partnerTerms.firstTopupBonus': 'First top-up bonus',
        'referral.partnerTerms.inviterBonus': 'Inviter bonus',
        'referral.partnerTerms.commission': 'Commission',
        'referral.partnerTerms.firstPaymentCommission': 'First payment commission',
        'referral.partnerTerms.recurringTiers': 'Recurring tiers',
        'referral.partnerTerms.maxPayments': 'Maximum payments',
        'referral.partnerTerms.maxCommission': 'Maximum commission',
        'referral.partnerTerms.unlimited': 'Unlimited',
        'referral.partnerTerms.levelsMode': 'Levels mode',
        'referral.partnerTerms.rewardMode': 'Reward mode',
        'referral.partnerTerms.trigger': 'Trigger',
        'referral.partnerTerms.referrerReward': 'Referrer reward',
        'referral.partnerTerms.refereeReward': 'Referee reward',
        'referral.partnerTerms.requiredReferrals': 'Required referrals',
        'referral.partnerTerms.activeOnly': 'Active only',
        'referral.partnerTerms.active': 'Active',
        'referral.partnerTerms.inactive': 'Inactive',
        'referral.terms.levelLabel': `Level ${options?.level ?? ''}`,
        'referral.terms.modeChain': 'Chain',
        'referral.terms.modeTiers': 'Tiers',
        'common.yes': 'Yes',
        'common.no': 'No',
      };
      return labels[key] ?? key;
    },
  }),
}));

vi.mock('../../hooks/useCurrency', () => ({
  useCurrency: () => ({ formatWithCurrency: (rubles: number) => `${rubles} ₽` }),
}));

afterEach(cleanup);

const legacyTerms: PartnerReferralTermsData = {
  scheme: 'legacy',
  levels_mode: null,
  minimum_topup_kopeks: 10000,
  first_topup_bonus_kopeks: 5000,
  inviter_bonus_kopeks: 2500,
  commission_percent: 25,
  first_payment_commission_percent: 30,
  recurring_commission_tiers: [{ payment_number: 10, percent: 15 }],
  max_commission_payments: 0,
  max_commission_kopeks: 20000,
};

describe('PartnerReferralTerms', () => {
  it('shows legacy effective values in readable units', () => {
    render(<PartnerReferralTerms terms={legacyTerms} />);

    expect(screen.getByText('100 ₽')).toBeTruthy();
    expect(screen.getByText('50 ₽')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
    expect(screen.getByText('30%')).toBeTruthy();
    expect(screen.getByText('10 → 15%')).toBeTruthy();
    expect(screen.getByText('Unlimited')).toBeTruthy();
  });

  it('shows structured levels without treating them as recurring tiers', () => {
    render(
      <PartnerReferralTerms
        terms={{
          scheme: 'levels',
          levels_mode: 'chain',
          levels: [
            {
              level: 1,
              is_active: true,
              reward_mode: 'both',
              trigger: 'first_topup',
              referrer_percent: 25,
              referrer_fixed_kopeks: 1000,
              referrer_days: 7,
              referrer_tariff_id: null,
              referee_fixed_kopeks: 0,
              referee_days: 3,
              referee_tariff_id: null,
              max_payments: 2,
              required_referrals: 4,
              required_referrals_active_only: true,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Level 1')).toBeTruthy();
    expect(screen.getByText('Reward mode: both')).toBeTruthy();
    expect(screen.getByText('Referrer reward: 25% + 10 ₽ + 7 дн.')).toBeTruthy();
    expect(screen.getByText('Referee reward: 3 дн.')).toBeTruthy();
    expect(screen.queryByText('Recurring tiers')).toBeNull();
  });
});
