// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PartnerReferralTerms as PartnerReferralTermsData } from '../../api/partners';
import { PartnerReferralTerms } from './PartnerReferralTerms';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const labels: Record<string, string> = {
        'referral.partner.partnerTerms.title': 'Your partner terms',
        'referral.partner.partnerTerms.description': 'Future rewards',
        'referral.partner.partnerTerms.minimumTopup': 'Minimum top-up',
        'referral.partner.partnerTerms.firstTopupBonus': 'First top-up bonus',
        'referral.partner.partnerTerms.inviterBonus': 'Inviter bonus',
        'referral.partner.partnerTerms.commission': 'Commission',
        'referral.partner.partnerTerms.firstPaymentCommission': 'First payment commission',
        'referral.partner.partnerTerms.recurringTiers': 'Recurring tiers',
        'referral.partner.partnerTerms.maxPayments': 'Maximum payments',
        'referral.partner.partnerTerms.maxCommission': 'Maximum commission',
        'referral.partner.partnerTerms.unlimited': 'Unlimited',
        'referral.partner.partnerTerms.levelsMode': 'Levels mode',
        'referral.partner.partnerTerms.rewardMode': 'Reward mode',
        'referral.partner.partnerTerms.trigger': 'Trigger',
        'referral.partner.partnerTerms.referrerReward': 'Referrer reward',
        'referral.partner.partnerTerms.refereeReward': 'Referee reward',
        'referral.partner.partnerTerms.requiredReferrals': 'Required referrals',
        'referral.partner.partnerTerms.activeOnly': 'Active only',
        'referral.partner.partnerTerms.active': 'Active',
        'referral.partner.partnerTerms.inactive': 'Inactive',
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
  useCurrency: () => ({
    formatWithCurrency: (rubles: number, decimals = 2) => `${rubles.toFixed(decimals)} ₽`,
  }),
}));

afterEach(cleanup);

const legacyTerms: PartnerReferralTermsData = {
  scheme: 'legacy',
  levels_mode: null,
  minimum_topup_kopeks: 10000,
  first_topup_bonus_kopeks: 5000,
  inviter_bonus_kopeks: 0,
  commission_percent: 25,
  first_payment_commission_percent: 30,
  recurring_commission_tiers: [{ payment_number: 10, percent: 15 }],
  max_commission_payments: 0,
  max_commission_kopeks: 20000,
};

describe('PartnerReferralTerms', () => {
  it('shows legacy effective values in readable units', () => {
    render(<PartnerReferralTerms terms={legacyTerms} />);

    expect(screen.getByText('Your partner terms')).toBeTruthy();
    expect(screen.queryByText('referral.partnerTerms.title')).toBeNull();
    expect(screen.getByText('100 ₽')).toBeTruthy();
    expect(screen.getByText('50 ₽')).toBeTruthy();
    expect(screen.getByText('0 ₽')).toBeTruthy();
    expect(screen.queryByText('100.00 ₽')).toBeNull();
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
