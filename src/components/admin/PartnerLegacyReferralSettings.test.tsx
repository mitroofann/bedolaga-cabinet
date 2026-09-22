// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PartnerLegacyReferralSettings } from './PartnerLegacyReferralSettings';

const state = {
  patches: [] as unknown[],
  deletes: 0,
  data: {
    user_id: 42,
    is_partner: true,
    partner_status: 'approved',
    overrides: {
      minimum_topup_kopeks: null,
      first_topup_bonus_kopeks: 5000,
      inviter_bonus_kopeks: null,
      commission_percent: 50,
      first_payment_commission_percent: null,
      recurring_commission_tiers: '0:50,1:0',
      max_commission_payments: 1,
      max_commission_kopeks: null,
    },
    effective: {
      minimum_topup_kopeks: 10000,
      first_topup_bonus_kopeks: 5000,
      inviter_bonus_kopeks: 1000,
      commission_percent: 50,
      first_payment_commission_percent: 50,
      recurring_commission_tiers: '0:50,1:0',
      max_commission_payments: 1,
      max_commission_kopeks: 0,
    },
    sources: {
      minimum_topup_kopeks: 'global',
      first_topup_bonus_kopeks: 'partner',
      inviter_bonus_kopeks: 'global',
      commission_percent: 'partner',
      first_payment_commission_percent: 'global',
      recurring_commission_tiers: 'partner',
      max_commission_payments: 'partner',
      max_commission_kopeks: 'global',
    },
  },
};

const labels: Record<string, string> = {
  minimum_topup_kopeks: 'Minimum top-up',
  first_topup_bonus_kopeks: 'First top-up bonus',
  inviter_bonus_kopeks: 'Inviter bonus',
  commission_percent: 'Commission',
  first_payment_commission_percent: 'First payment commission',
  recurring_commission_tiers: 'Recurring tiers',
  max_commission_payments: 'Maximum payments',
  max_commission_kopeks: 'Maximum commission',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const field = key.match(/fields\.(.+)$/)?.[1];
      if (field && labels[field]) return labels[field];
      if (key.endsWith('.effective')) return 'Effective';
      if (key.endsWith('.sources.partner')) return 'Partner override';
      if (key.endsWith('.sources.global')) return 'Global default';
      if (key.endsWith('.sources.partnerProfile')) return 'Partner profile';
      if (key.endsWith('.validation.percent')) return 'Percentage must be between 0 and 100.';
      if (key.endsWith('.validation.number')) return 'Enter a valid non-negative number.';
      if (key.endsWith('.success')) return 'Saved';
      return key;
    },
  }),
}));

vi.mock('@/api/partners', () => ({
  partnerApi: {
    getLegacyReferralSettings: () => Promise.resolve(state.data),
    updateLegacyReferralSettings: (_userId: number, patch: unknown) => {
      state.patches.push(patch);
      return Promise.resolve(state.data);
    },
    deleteLegacyReferralSettings: () => {
      state.deletes += 1;
      return Promise.resolve(state.data);
    },
  },
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ formatWithCurrency: (rubles: number) => `${rubles} ₽` }),
}));

vi.mock('@/platform/hooks/useNotify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/platform/hooks/useNativeDialog', () => ({
  useDestructiveConfirm: () => vi.fn(async () => true),
}));

vi.mock('@/store/permissions', () => ({
  usePermissionStore: (selector: (state: { hasPermission: () => boolean }) => unknown) =>
    selector({ hasPermission: () => true }),
}));

vi.mock('@/components/auth/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: unknown }) => children,
}));

function renderBlock() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <PartnerLegacyReferralSettings userId={42} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  state.patches = [];
  state.deletes = 0;
});

describe('PartnerLegacyReferralSettings', () => {
  it('renders all fields and effective/source metadata', async () => {
    renderBlock();

    expect(await screen.findByLabelText('Minimum top-up')).toBeTruthy();
    for (const label of Object.values(labels).slice(1)) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getAllByText(/Effective/).length).toBe(8);
    expect(screen.getAllByText(/Global default|Partner override/).length).toBe(8);
  });

  it('sends a partial PATCH and converts rubles to kopeks', async () => {
    renderBlock();
    const input = (await screen.findByLabelText('First top-up bonus')) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '150,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(state.patches).toHaveLength(1));
    expect(state.patches[0]).toEqual({ first_topup_bonus_kopeks: 15050 });
  });

  it('rejects percentages outside the backend range', async () => {
    renderBlock();
    const input = (await screen.findByLabelText('Commission')) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '101' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText('Percentage must be between 0 and 100.')).toBeTruthy();
    expect(state.patches).toHaveLength(0);
  });

  it('resets all overrides after confirmation', async () => {
    renderBlock();
    await screen.findByLabelText('Minimum top-up');
    fireEvent.click(
      screen.getByRole('button', { name: 'admin.partnerDetail.legacySettings.resetAll' }),
    );

    await waitFor(() => expect(state.deletes).toBe(1));
  });
});
