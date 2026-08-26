import apiClient from './client';
import type { AnimationConfig } from '@/components/ui/backgrounds/types';

export type LandingTemplate = 'classic' | 'bulka_sales_flow';

export interface BulkaFlowTrial {
  available: boolean;
  unavailable_code: string | null;
  unavailable_reason: string | null;
  tariff_id: number | null;
  tariff_name: string | null;
  tariff_description_html: string | null;
  duration_days: number | null;
  traffic_limit_gb: number | null;
  device_limit: number | null;
  requires_external_payment: boolean;
  price_kopeks: number | null;
  currency: string | null;
}

export interface BulkaFlowTariffPeriod {
  days: number;
  price_kopeks: number;
  original_price_kopeks: number | null;
  discount_percent: number | null;
}

export interface BulkaFlowTariff {
  id: number;
  name: string;
  description_html: string | null;
  traffic_limit_gb: number;
  device_limit: number;
  is_daily: boolean;
  periods: BulkaFlowTariffPeriod[];
}

export interface BulkaFlowPaymentMethod extends LandingPaymentMethod {}

export interface BulkaFlowConfig {
  landing_slug: string;
  landing_template: 'bulka_sales_flow';
  trial: BulkaFlowTrial;
  tariffs: BulkaFlowTariff[];
  payment_methods: BulkaFlowPaymentMethod[];
}

export interface BulkaFlowPurchaseRequest {
  flow_kind: 'trial' | 'purchase';
  tariff_id?: number | null;
  period_days?: number | null;
  payment_method: string;
  payment_sub_option?: string | null;
  language?: string | null;
  yandex_cid?: string | null;
  referrer?: string | null;
  subid?: string | null;
}

export interface BulkaFlowPurchaseResponse {
  purchase_token: string;
  payment_url: string;
  flow_kind: 'trial' | 'purchase';
  landing_slug: string;
  landing_template: 'bulka_sales_flow';
}

export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingTariffPeriod {
  days: number;
  label: string;
  price_kopeks: number;
  price_label: string;
  original_price_kopeks: number | null;
  original_price_label: string | null;
  discount_percent: number | null;
}

export interface LandingTariff {
  id: number;
  name: string;
  description: string | null;
  traffic_limit_gb: number;
  device_limit: number;
  tier_level: number;
  periods: LandingTariffPeriod[];
  /** Daily tariff: the single purchasable period is 1 day, priced per day. */
  is_daily?: boolean;
  daily_price_kopeks?: number;
}

export interface LandingPaymentMethodSubOption {
  id: string;
  name: string;
}

/** Payment method as returned by the public landing config API */
export interface LandingPaymentMethod {
  method_id: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  min_amount_kopeks: number | null;
  max_amount_kopeks: number | null;
  currency: string | null;
  sub_options: LandingPaymentMethodSubOption[] | null;
}

/** Payment method as stored/returned by the admin landing API (sub_options is a dict) */
export interface AdminLandingPaymentMethod {
  method_id: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  min_amount_kopeks: number | null;
  max_amount_kopeks: number | null;
  currency: string | null;
  return_url: string | null;
  sub_options: Record<string, boolean> | null;
}

/** Editable fields on a payment method in the landing editor */
export type EditableMethodField =
  | 'display_name'
  | 'description'
  | 'icon_url'
  | 'min_amount_kopeks'
  | 'max_amount_kopeks'
  | 'currency'
  | 'return_url';

export interface LandingDiscountInfo {
  percent: number;
  ends_at: string; // ISO datetime
  badge_text: string | null;
}

/** Public trial config on the landing (null when the landing has no trial). */
export interface LandingTrialConfig {
  enabled: boolean;
  duration_days: number;
  traffic_limit_gb: number;
  device_limit: number;
  requires_payment: boolean;
  price_kopeks: number;
  price_rubles: number;
}

export interface LandingConfig {
  /** Missing on older backend versions; render it as the unchanged classic experience. */
  template?: LandingTemplate;
  slug: string;
  title: string;
  subtitle: string | null;
  features: LandingFeature[];
  footer_text: string | null;
  tariffs: LandingTariff[];
  payment_methods: LandingPaymentMethod[];
  gift_enabled: boolean;
  custom_css: string | null;
  meta_title: string | null;
  meta_description: string | null;
  discount: LandingDiscountInfo | null;
  background_config: AnimationConfig | null;
  analytics_view_enabled: boolean;
  analytics_view_goal: string;
  analytics_click_enabled: boolean;
  analytics_click_goal: string;
  sticky_pay_button: boolean;
  // Trial offer exposed on the public funnel (backend feature). null / enabled:false
  // means no trial block is shown. See src/features/landing-trial/.
  trial?: LandingTrialConfig | null;
}

export interface PurchaseRequest {
  tariff_id: number;
  period_days: number;
  contact_type: 'email' | 'telegram';
  contact_value: string;
  payment_method: string;
  is_gift: boolean;
  gift_recipient_type?: 'email' | 'telegram';
  gift_recipient_value?: string;
  gift_message?: string;
  language?: string;
  // Yandex offline-conversions linkage (bot PR #2851 backend fields)
  yandex_cid?: string;
  referrer?: string;
  subid?: string;
  // Слаг рекламной кампании: без него покупка гостем не попадает в статистику
  // кампании и не даёт её бонус — auth-флоу, который привязывает кампанию
  // обычно, на этом пути не срабатывает.
  campaign_slug?: string;
}

export interface PurchaseResponse {
  purchase_token: string;
  payment_url: string;
}

// ── Trial (public landing funnel) ─────────────────────────────────────────
export interface TrialRequest {
  contact_type: 'email' | 'telegram';
  contact_value: string;
  /** Required only for a paid trial (config.trial.requires_payment). */
  payment_method?: string | null;
  language?: string | null;
  yandex_cid?: string | null;
  yclid?: string | null;
  referrer?: string | null;
  subid?: string | null;
}

/** Free trial granted immediately (no payment). */
export interface TrialFreeResponse {
  mode: 'free';
  status: 'delivered';
  subscription_url: string | null;
  subscription_crypto_link: string | null;
  contact_type: 'email' | 'telegram';
  // Present only for a freshly created email account.
  cabinet_email: string | null;
  cabinet_password: string | null;
  auto_login_token: string | null;
  // Telegram arm.
  recipient_in_bot: boolean | null;
  bot_link: string | null;
}

/** Paid trial — proceed through payment like a normal purchase. */
export interface TrialPaidResponse {
  mode: 'paid';
  purchase_token: string;
  payment_url: string;
}

export type TrialResponse = TrialFreeResponse | TrialPaidResponse;

export interface PurchaseStatus {
  status: 'pending' | 'paid' | 'delivered' | 'pending_activation' | 'failed' | 'expired';
  subscription_url: string | null;
  subscription_crypto_link: string | null;
  is_gift: boolean;
  contact_value: string | null;
  recipient_contact_value: string | null;
  period_days: number | null;
  tariff_name: string | null;
  gift_message: string | null;
  contact_type: 'email' | 'telegram' | null;
  cabinet_email: string | null;
  cabinet_password: string | null;
  auto_login_token: string | null;
  recipient_in_bot: boolean | null;
  bot_link: string | null;
  // Transferable gift claim link — the buyer forwards this; whoever activates it
  // gets the gift. Derived from token + status (purchase.user is null until claim).
  is_claimable: boolean;
  claim_url: string | null;
  bot_claim_link: string | null;
  /** Additive metadata for the authenticated Bulka sales flow. */
  landing_template?: LandingTemplate | null;
  flow_kind?: 'trial' | 'purchase' | null;
  flow_return_kind?: 'bulka_connect' | null;
  activated_at?: string | null;
  subscription_id?: number | null;
}

/** Result returned to the recipient after a successful web (email) gift claim. */
export interface GiftClaimResult {
  status: string;
  tariff_name: string | null;
  period_days: number | null;
  subscription_url: string | null;
  subscription_crypto_link: string | null;
  auto_login_token: string | null;
}

/** Locale dict for multi-language text fields (admin API) */
export type LocaleDict = Record<string, string>;

/** Supported locales for the admin editor */
export const SUPPORTED_LOCALES = ['ru', 'en', 'zh', 'fa'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_META: Record<SupportedLocale, { flag: string; name: string; rtl: boolean }> = {
  ru: { flag: '\u{1F1F7}\u{1F1FA}', name: 'RU', rtl: false },
  en: { flag: '\u{1F1EC}\u{1F1E7}', name: 'EN', rtl: false },
  zh: { flag: '\u{1F1E8}\u{1F1F3}', name: 'ZH', rtl: false },
  fa: { flag: '\u{1F1EE}\u{1F1F7}', name: 'FA', rtl: true },
};

/** Admin feature type with localized title/description */
export interface AdminLandingFeature {
  icon: string;
  title: LocaleDict;
  description: LocaleDict;
}

export interface LandingListItem {
  id: number;
  /** Missing on older backend versions; treat it as classic in the admin UI. */
  template?: LandingTemplate;
  slug: string;
  title: LocaleDict;
  is_active: boolean;
  display_order: number;
  gift_enabled: boolean;
  tariff_count: number;
  method_count: number;
  analytics_view_enabled: boolean;
  analytics_click_enabled: boolean;
  purchase_stats: {
    total: number;
    pending: number;
    paid: number;
    delivered: number;
    pending_activation: number;
    failed: number;
    expired: number;
  };
  created_at: string | null;
  updated_at: string | null;
  has_active_discount: boolean;
}

export interface LandingDetail {
  id: number;
  /** Missing on older backend versions; treat it as classic in the editor. */
  template?: LandingTemplate;
  slug: string;
  title: LocaleDict;
  subtitle: LocaleDict | null;
  is_active: boolean;
  features: AdminLandingFeature[];
  footer_text: LocaleDict | null;
  allowed_tariff_ids: number[];
  allowed_periods: Record<string, number[]>;
  payment_methods: AdminLandingPaymentMethod[];
  gift_enabled: boolean;
  custom_css: string | null;
  meta_title: LocaleDict | null;
  meta_description: LocaleDict | null;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
  discount_percent: number | null;
  discount_overrides: Record<string, number> | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
  discount_badge_text: LocaleDict | null;
  background_config: AnimationConfig | null;
  analytics_view_enabled: boolean;
  analytics_view_goal: string;
  analytics_click_enabled: boolean;
  analytics_click_goal: string;
  sticky_pay_button: boolean;
  trial_enabled: boolean;
}

export interface LandingCreateRequest {
  slug: string;
  /** Optional while backend rollout is in progress; backend defaults to classic. */
  template?: LandingTemplate;
  title: LocaleDict;
  subtitle?: LocaleDict;
  is_active?: boolean;
  features?: AdminLandingFeature[];
  footer_text?: LocaleDict;
  allowed_tariff_ids?: number[];
  allowed_periods?: Record<string, number[]>;
  payment_methods?: AdminLandingPaymentMethod[];
  gift_enabled?: boolean;
  trial_enabled?: boolean;
  custom_css?: string;
  meta_title?: LocaleDict;
  meta_description?: LocaleDict;
  discount_percent?: number | null;
  discount_overrides?: Record<string, number> | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  discount_badge_text?: LocaleDict | null;
  background_config?: AnimationConfig | null;
  analytics_view_enabled?: boolean;
  analytics_view_goal?: string;
  analytics_click_enabled?: boolean;
  analytics_click_goal?: string;
  sticky_pay_button?: boolean;
}

export type LandingUpdateRequest = Partial<LandingCreateRequest>;

/** Extract best display string from a LocaleDict: ru -> en -> first available -> '' */
export function resolveLocaleDisplay(dict: LocaleDict | string | null | undefined): string {
  if (!dict) return '';
  if (typeof dict === 'string') return dict;
  return dict.ru || dict.en || Object.values(dict).find((v) => v?.trim()) || '';
}

export function toLocaleDict(
  value: string | LocaleDict | null | undefined,
  fallback: LocaleDict = {},
): LocaleDict {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value ? { ru: value } : fallback;
  return value;
}

export const landingApi = {
  getConfig: async (slug: string, lang?: string): Promise<LandingConfig> => {
    const params = lang ? `?lang=${lang}` : '';
    const response = await apiClient.get(`/cabinet/landing/${slug}${params}`);
    return response.data;
  },

  createPurchase: async (slug: string, data: PurchaseRequest): Promise<PurchaseResponse> => {
    const response = await apiClient.post(`/cabinet/landing/${slug}/purchase`, data);
    return response.data;
  },

  // Public trial grant through the funnel (no auth). Returns a discriminated
  // union on `mode`: 'free' (granted now) or 'paid' (redirect to payment).
  createTrial: async (slug: string, data: TrialRequest): Promise<TrialResponse> => {
    const response = await apiClient.post(`/cabinet/landing/${slug}/trial`, data);
    return response.data;
  },

  getBulkaFlowConfig: async (slug: string): Promise<BulkaFlowConfig> => {
    const response = await apiClient.get(`/cabinet/landing/${slug}/bulka-flow`);
    return response.data;
  },

  createBulkaFlowPurchase: async (
    slug: string,
    data: BulkaFlowPurchaseRequest,
    idempotencyKey: string,
  ): Promise<BulkaFlowPurchaseResponse> => {
    const response = await apiClient.post(`/cabinet/landing/${slug}/bulka-flow/purchase`, data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return response.data;
  },

  getPurchaseStatus: async (token: string): Promise<PurchaseStatus> => {
    const response = await apiClient.get(`/cabinet/landing/purchase/${token}`);
    return response.data;
  },

  activatePurchase: async (token: string): Promise<PurchaseStatus> => {
    const response = await apiClient.post(`/cabinet/landing/activate/${token}`);
    return response.data;
  },

  // Public gift claim page data (no auth — the token is the bearer secret).
  getGiftClaim: async (token: string): Promise<PurchaseStatus> => {
    const response = await apiClient.get(`/cabinet/landing/gift/${token}`);
    return response.data;
  },

  // Web (email) arm of the gift claim — binds the gift to the given email account.
  claimGift: async (token: string, email: string): Promise<GiftClaimResult> => {
    const response = await apiClient.post(`/cabinet/landing/gift/${token}/claim`, { email });
    return response.data;
  },
};

export interface LandingDailyStat {
  date: string;
  created: number;
  purchases: number;
  revenue_kopeks: number;
  gifts: number;
}

export interface LandingTariffStat {
  tariff_id: number | null;
  tariff_name: string;
  purchases: number;
  revenue_kopeks: number;
}

export interface LandingPaymentMethodStat {
  method: string;
  purchases: number;
  revenue_kopeks: number;
}

export interface LandingSourceStat {
  source: string;
  purchases: number;
}

export interface LandingStatsResponse {
  total_purchases: number;
  total_revenue_kopeks: number;
  total_gifts: number;
  total_gifts_claimed: number;
  total_regular: number;
  avg_purchase_kopeks: number;
  total_created: number;
  total_successful: number;
  conversion_rate: number;
  daily_stats: LandingDailyStat[];
  tariff_stats: LandingTariffStat[];
  payment_method_stats: LandingPaymentMethodStat[];
  source_stats: LandingSourceStat[];
}

export type PurchaseItemStatus =
  | 'pending'
  | 'paid'
  | 'delivered'
  | 'pending_activation'
  | 'failed'
  | 'expired';

export interface LandingPurchaseItem {
  id: number;
  token: string;
  contact_type: 'email' | 'telegram';
  contact_value: string;
  is_gift: boolean;
  gift_recipient_type: 'email' | 'telegram' | null;
  gift_recipient_value: string | null;
  tariff_name: string;
  period_days: number;
  amount_kopeks: number;
  currency: string;
  payment_method: string;
  status: PurchaseItemStatus;
  created_at: string;
  paid_at: string | null;
  referrer: string | null;
}

export interface LandingPurchaseListResponse {
  items: LandingPurchaseItem[];
  total: number;
}

export const adminLandingsApi = {
  list: async (): Promise<LandingListItem[]> => {
    const response = await apiClient.get('/cabinet/admin/landings');
    return response.data;
  },

  get: async (id: number): Promise<LandingDetail> => {
    const response = await apiClient.get(`/cabinet/admin/landings/${id}`);
    return response.data;
  },

  create: async (data: LandingCreateRequest): Promise<LandingDetail> => {
    const response = await apiClient.post('/cabinet/admin/landings', data);
    return response.data;
  },

  update: async (id: number, data: LandingUpdateRequest): Promise<LandingDetail> => {
    const response = await apiClient.put(`/cabinet/admin/landings/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/cabinet/admin/landings/${id}`);
    return response.data;
  },

  toggle: async (id: number): Promise<LandingDetail> => {
    const response = await apiClient.post(`/cabinet/admin/landings/${id}/toggle`);
    return response.data;
  },

  reorder: async (landingIds: number[]): Promise<void> => {
    await apiClient.put('/cabinet/admin/landings/order', { landing_ids: landingIds });
  },

  getStats: async (id: number): Promise<LandingStatsResponse> => {
    const { USER_TIMEZONE } = await import('../utils/format');
    const response = await apiClient.get(`/cabinet/admin/landings/${id}/stats`, {
      params: { tz: USER_TIMEZONE },
    });
    return response.data;
  },

  getPurchases: async (
    id: number,
    offset: number,
    limit: number,
    status?: PurchaseItemStatus,
  ): Promise<LandingPurchaseListResponse> => {
    const params: Record<string, string | number> = { offset, limit };
    if (status) params.status = status;
    const response = await apiClient.get(`/cabinet/admin/landings/${id}/purchases`, { params });
    return response.data;
  },
};
