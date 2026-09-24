// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BulkaFlowConfig } from '@/api/landings';
import { BulkaCheckout } from './BulkaCheckout';

const { getConfig, createPurchase, activateFreeTrial, navigate } = vi.hoisted(() => ({
  getConfig: vi.fn(),
  createPurchase: vi.fn(),
  activateFreeTrial: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/api/landings', () => ({
  landingApi: {
    getBulkaFlowConfig: getConfig,
    createBulkaFlowPurchase: createPurchase,
    activateBulkaFreeTrial: activateFreeTrial,
  },
}));
vi.mock('react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ formatAmount: (value: number) => String(value), currencySymbol: '₽' }),
}));
vi.mock('../LandingLegalFooter', () => ({ LandingLegalFooter: () => null }));

const flow: BulkaFlowConfig = {
  landing_slug: 'bulka',
  landing_template: 'bulka_sales_flow',
  trial: {
    available: true,
    unavailable_code: null,
    unavailable_reason: null,
    tariff_id: 1,
    tariff_name: 'Пробный',
    tariff_description_html: null,
    duration_days: 7,
    traffic_limit_gb: 50,
    device_limit: 5,
    requires_external_payment: false,
    price_kopeks: 0,
    currency: 'RUB',
  },
  tariffs: [
    {
      id: 2,
      name: 'Подписка',
      description_html: null,
      traffic_limit_gb: 100,
      device_limit: 5,
      is_daily: false,
      periods: [
        { days: 90, price_kopeks: 90000, original_price_kopeks: null, discount_percent: null },
      ],
    },
  ],
  payment_methods: [
    {
      method_id: 'card',
      display_name: 'Банковская карта',
      description: null,
      icon_url: null,
      sort_order: 0,
      min_amount_kopeks: 100,
      max_amount_kopeks: null,
      currency: 'RUB',
      sub_options: null,
    },
  ],
};

function renderCheckout(initialIntent: 'trial' | 'purchase' = 'trial') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BulkaCheckout slug="bulka" initialIntent={initialIntent} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getConfig.mockResolvedValue(flow);
});

afterEach(cleanup);

describe('Bulka free trial', () => {
  it('activates without payment methods and opens the connection step', async () => {
    activateFreeTrial.mockResolvedValue({ purchase_token: 'free-token' });
    renderCheckout();

    fireEvent.click(await screen.findByRole('button', { name: 'Активировать бесплатно' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/buy/success/free-token'));
    expect(activateFreeTrial).toHaveBeenCalledWith(
      'bulka',
      expect.objectContaining({ language: 'ru' }),
      expect.any(String),
    );
    expect(createPurchase).not.toHaveBeenCalled();
    expect(screen.queryByRole('radiogroup', { name: 'Способ оплаты' })).toBeNull();
    expect(screen.queryByText(/Перейти к оплате · 0/)).toBeNull();
  });

  it('keeps the same key and payload on retry after an error', async () => {
    activateFreeTrial.mockRejectedValueOnce(new Error('offline'));
    activateFreeTrial.mockResolvedValueOnce({ purchase_token: 'recovered' });
    renderCheckout();

    fireEvent.click(await screen.findByRole('button', { name: 'Активировать бесплатно' }));
    expect(await screen.findByText('Не удалось активировать пробный доступ')).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Активировать бесплатно' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/buy/success/recovered'));
    expect(activateFreeTrial).toHaveBeenCalledTimes(2);
    expect(activateFreeTrial.mock.calls[1]).toEqual(activateFreeTrial.mock.calls[0]);
  });

  it('preserves the paid trial payment request', async () => {
    getConfig.mockResolvedValue({
      ...flow,
      trial: { ...flow.trial, requires_external_payment: true, price_kopeks: 9900 },
    });
    createPurchase.mockImplementation(() => new Promise(() => {}));
    renderCheckout();

    fireEvent.click(await screen.findByRole('button', { name: /Перейти к оплате · 99/ }));

    await waitFor(() =>
      expect(createPurchase).toHaveBeenCalledWith(
        'bulka',
        expect.objectContaining({ flow_kind: 'trial', payment_method: 'card' }),
        expect.any(String),
      ),
    );
    expect(screen.getByRole('radiogroup', { name: 'Способ оплаты' })).toBeTruthy();
    expect(activateFreeTrial).not.toHaveBeenCalled();
  });

  it('preserves purchase payment when the trial is free', async () => {
    createPurchase.mockImplementation(() => new Promise(() => {}));
    renderCheckout('purchase');

    fireEvent.click(await screen.findByRole('button', { name: /Перейти к оплате · 900/ }));

    await waitFor(() =>
      expect(createPurchase).toHaveBeenCalledWith(
        'bulka',
        expect.objectContaining({
          flow_kind: 'purchase',
          tariff_id: 2,
          period_days: 90,
          payment_method: 'card',
        }),
        expect.any(String),
      ),
    );
    expect(activateFreeTrial).not.toHaveBeenCalled();
  });

  it('does not offer activation when the server marks the trial unavailable', async () => {
    getConfig.mockResolvedValue({ ...flow, trial: { ...flow.trial, available: false } });
    renderCheckout();

    expect(await screen.findByText('Пробный период недоступен для этого аккаунта.')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Активировать бесплатно' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.queryByRole('radiogroup', { name: 'Способ оплаты' })).toBeNull();
    expect(activateFreeTrial).not.toHaveBeenCalled();
  });
});
