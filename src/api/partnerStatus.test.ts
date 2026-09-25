import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();

vi.mock('./client', () => ({
  default: { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

describe('partner status API', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('keeps the status endpoint and accepts additive partner terms and URLs', async () => {
    const response = {
      partner_status: 'approved',
      commission_percent: 25,
      partner_terms: {
        scheme: 'legacy',
        levels_mode: null,
        minimum_topup_kopeks: 10000,
        commission_percent: 25,
      },
      latest_application: null,
      campaigns: [
        {
          id: 1,
          name: 'Summer',
          start_parameter: 'summer',
          bonus_type: 'none',
          balance_bonus_kopeks: 0,
          subscription_duration_days: null,
          subscription_traffic_gb: null,
          deep_link: null,
          web_link: null,
          sale_url: 'https://cabinet.bulkavpn.net/buy/now?campaign=summer',
          trial_url: 'https://cabinet.bulkavpn.net/buy/now?campaign=summer&intent=trial',
          landing_url: 'https://bulkavpn.net/?campaign=summer',
          registrations_count: 0,
          referrals_count: 0,
          earnings_kopeks: 0,
        },
      ],
    };
    get.mockResolvedValue({ data: response });

    const { partnerApi } = await import('./partners');
    const result = await partnerApi.getStatus();

    expect(get).toHaveBeenCalledWith('/cabinet/referral/partner/status');
    expect(result.partner_terms?.scheme).toBe('legacy');
    expect(result.campaigns[0].trial_url).toContain('intent=trial');
  });

  it('keeps older responses without partner terms compatible', async () => {
    get.mockResolvedValue({
      data: {
        partner_status: 'none',
        commission_percent: null,
        latest_application: null,
        campaigns: [],
      },
    });

    const { partnerApi } = await import('./partners');
    const result = await partnerApi.getStatus();

    expect(result.partner_terms).toBeUndefined();
    expect(result.campaigns).toEqual([]);
  });
});
