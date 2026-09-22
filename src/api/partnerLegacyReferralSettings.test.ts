import { describe, expect, it, vi } from 'vitest';

const get = vi.fn(() => Promise.resolve({ data: { ok: true } }));
const patch = vi.fn(() => Promise.resolve({ data: { ok: true } }));
const remove = vi.fn(() => Promise.resolve({ data: { ok: true } }));

vi.mock('./client', () => ({
  default: { get, patch, delete: remove, post: vi.fn(), put: vi.fn() },
}));

describe('legacy referral settings API', () => {
  it('uses the documented GET endpoint', async () => {
    const { partnerApi } = await import('./partners');
    await partnerApi.getLegacyReferralSettings(42);
    expect(get).toHaveBeenCalledWith('/cabinet/admin/partners/42/legacy-referral-settings');
  });

  it('sends only the partial PATCH body', async () => {
    const { partnerApi } = await import('./partners');
    const patchBody = { commission_percent: 100, first_payment_commission_percent: null };
    await partnerApi.updateLegacyReferralSettings(42, patchBody);
    expect(patch).toHaveBeenCalledWith(
      '/cabinet/admin/partners/42/legacy-referral-settings',
      patchBody,
    );
  });

  it('uses DELETE without a reset body', async () => {
    const { partnerApi } = await import('./partners');
    await partnerApi.deleteLegacyReferralSettings(42);
    expect(remove).toHaveBeenCalledWith('/cabinet/admin/partners/42/legacy-referral-settings');
  });
});
