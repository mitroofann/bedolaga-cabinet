import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePermissionStore } from '@/store/permissions';
import { useDestructiveConfirm } from '@/platform/hooks/useNativeDialog';
import { useNotify } from '@/platform/hooks/useNotify';
import { getApiErrorMessage } from '@/utils/api-error';
import { useCurrency } from '@/hooks/useCurrency';
import {
  partnerApi,
  type LegacyReferralSettingField,
  type LegacyReferralSettingsPatch,
  type LegacyReferralSettingsResponse,
} from '@/api/partners';
import { RefreshIcon } from './icons';
import { Skeleton } from '@/components/ui/skeleton';

type NumberFieldValue = number | '';
type FormValue = NumberFieldValue | string;
type FormState = Record<LegacyReferralSettingField, FormValue>;

const FIELDS: LegacyReferralSettingField[] = [
  'minimum_topup_kopeks',
  'first_topup_bonus_kopeks',
  'inviter_bonus_kopeks',
  'commission_percent',
  'first_payment_commission_percent',
  'recurring_commission_tiers',
  'max_commission_payments',
  'max_commission_kopeks',
];

const MONEY_FIELDS = new Set<LegacyReferralSettingField>([
  'minimum_topup_kopeks',
  'first_topup_bonus_kopeks',
  'inviter_bonus_kopeks',
  'max_commission_kopeks',
]);
const PERCENT_FIELDS = new Set<LegacyReferralSettingField>([
  'commission_percent',
  'first_payment_commission_percent',
]);
function toFormValue(field: LegacyReferralSettingField, value: number | string | null): FormValue {
  if (value === null) return '';
  if (MONEY_FIELDS.has(field) && typeof value === 'number') return value / 100;
  return value;
}

function toKopeks(value: FormValue): number | null {
  if (value === '' || (typeof value !== 'number' && typeof value !== 'string')) return null;
  const normalized = String(value).trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function sourceLabel(source: string, t: TFunction): string {
  if (source === 'partner') return t('admin.partnerDetail.legacySettings.sources.partner');
  if (source === 'partner_profile')
    return t('admin.partnerDetail.legacySettings.sources.partnerProfile');
  return t('admin.partnerDetail.legacySettings.sources.global');
}

function errorMessage(error: unknown, t: TFunction): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 401) return t('admin.partnerDetail.legacySettings.errors.unauthorized');
  if (status === 403) return t('admin.partnerDetail.legacySettings.errors.forbidden');
  if (status === 404) return t('admin.partnerDetail.legacySettings.errors.notFound');
  if (status === 409) return t('admin.partnerDetail.legacySettings.errors.notApproved');
  if (!(error as { response?: unknown })?.response) {
    return t('admin.partnerDetail.legacySettings.errors.network');
  }
  return getApiErrorMessage(error, t('admin.partnerDetail.legacySettings.errors.generic'));
}

function validateValue(
  field: LegacyReferralSettingField,
  value: FormValue,
  t: TFunction,
): string | null {
  if (field === 'recurring_commission_tiers') {
    if (typeof value !== 'string' || value.length > 500) {
      return t('admin.partnerDetail.legacySettings.validation.tiersLength');
    }
    if (value && !/^\d+:\d+(?:,\d+:\d+)*$/.test(value.replace(/\s/g, ''))) {
      return t('admin.partnerDetail.legacySettings.validation.tiersFormat');
    }
    return null;
  }

  if (value === '' || (typeof value === 'string' && value.trim() === '')) {
    return t('admin.partnerDetail.legacySettings.validation.number');
  }
  const normalized = String(value).replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return t('admin.partnerDetail.legacySettings.validation.number');
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return t('admin.partnerDetail.legacySettings.validation.number');
  }
  if (!MONEY_FIELDS.has(field) && !Number.isInteger(numeric)) {
    return t('admin.partnerDetail.legacySettings.validation.number');
  }
  if (MONEY_FIELDS.has(field) && !/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return t('admin.partnerDetail.legacySettings.validation.number');
  }
  if (PERCENT_FIELDS.has(field) && numeric > 100) {
    return t('admin.partnerDetail.legacySettings.validation.percent');
  }
  return null;
}

function initialForm(data: LegacyReferralSettingsResponse): FormState {
  return Object.fromEntries(
    FIELDS.map((field) => [field, toFormValue(field, data.overrides[field])]),
  ) as FormState;
}

export function PartnerLegacyReferralSettings({ userId }: { userId: number }) {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const confirmDestructive = useDestructiveConfirm();
  const canEdit = usePermissionStore((state) => state.hasPermission('partners:edit'));
  const [form, setForm] = useState<FormState | null>(null);
  const [dirty, setDirty] = useState<Set<LegacyReferralSettingField>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const queryKey = useMemo(() => ['admin-partner-legacy-referral-settings', userId], [userId]);
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => partnerApi.getLegacyReferralSettings(userId),
    enabled: Number.isFinite(userId),
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setForm(initialForm(data));
      setDirty(new Set());
      setValidationError(null);
      setSaveError(null);
    }
  }, [data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['admin-partner-detail', String(userId)] });
  };

  const updateMutation = useMutation({
    mutationFn: (patch: LegacyReferralSettingsPatch) =>
      partnerApi.updateLegacyReferralSettings(userId, patch),
    onSuccess: () => {
      invalidate();
      setDirty(new Set());
      setSaveError(null);
      notify.success(t('admin.partnerDetail.legacySettings.success'));
    },
    onError: (mutationError) => {
      const message = errorMessage(mutationError, t);
      setSaveError(message);
      notify.error(message);
    },
  });

  const resetAllMutation = useMutation({
    mutationFn: () => partnerApi.deleteLegacyReferralSettings(userId),
    onSuccess: () => {
      invalidate();
      setDirty(new Set());
      setSaveError(null);
      notify.success(t('admin.partnerDetail.legacySettings.resetAllSuccess'));
    },
    onError: (mutationError) => {
      const message = errorMessage(mutationError, t);
      setSaveError(message);
      notify.error(message);
    },
  });

  if (isLoading) {
    return <Skeleton variant="card" className="h-[32rem]" />;
  }

  if (error || !data || !form) {
    return (
      <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-4 text-sm text-error-400">
        {errorMessage(error, t)}
      </div>
    );
  }

  const handleChange = (field: LegacyReferralSettingField, rawValue: string) => {
    const value: FormValue =
      field === 'recurring_commission_tiers'
        ? rawValue
        : rawValue === ''
          ? ''
          : Number(rawValue.replace(',', '.'));
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setDirty((current) => new Set(current).add(field));
    setValidationError(null);
    setSaveError(null);
  };

  const handleSave = () => {
    const patch: LegacyReferralSettingsPatch = {};
    for (const field of dirty) {
      const value = form[field];
      const invalid = validateValue(field, value, t);
      if (invalid) {
        setValidationError(invalid);
        return;
      }
      patch[field] = MONEY_FIELDS.has(field) ? toKopeks(value) : value === '' ? null : value;
    }
    if (Object.keys(patch).length === 0) return;
    setValidationError(null);
    updateMutation.mutate(patch);
  };

  const handleResetField = (field: LegacyReferralSettingField) => {
    updateMutation.mutate({ [field]: null });
  };

  const handleResetAll = async () => {
    const confirmed = await confirmDestructive(
      t('admin.partnerDetail.legacySettings.resetAllConfirm'),
      t('admin.partnerDetail.legacySettings.resetAll'),
    );
    if (confirmed) resetAllMutation.mutate();
  };

  const isPending = updateMutation.isPending || resetAllMutation.isPending;

  return (
    <section className="rounded-xl border border-dark-700 bg-dark-800 p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-dark-200">
            {t('admin.partnerDetail.legacySettings.title')}
          </h3>
          <p className="mt-1 text-sm text-dark-400">
            {t('admin.partnerDetail.legacySettings.description')}
          </p>
        </div>
        <PermissionGate permission="partners:edit">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={isPending}
            className="rounded-lg bg-error-500/15 px-3 py-2 text-xs text-error-400 transition-colors hover:bg-error-500/25 disabled:opacity-50"
          >
            {t('admin.partnerDetail.legacySettings.resetAll')}
          </button>
        </PermissionGate>
      </div>

      <div className="mb-4 rounded-lg border border-warning-500/20 bg-warning-500/10 p-3 text-sm text-warning-300">
        <p>{t('admin.partnerDetail.legacySettings.futureOnly')}</p>
        <p className="mt-1 text-warning-400/80">
          {t('admin.partnerDetail.legacySettings.nullVsZero')}
        </p>
      </div>

      <div className="space-y-3">
        {FIELDS.map((field) => {
          const effective = data.effective[field];
          const override = data.overrides[field];
          const isMoney = MONEY_FIELDS.has(field);
          const inputValue = form[field];
          const effectiveLabel = isMoney
            ? formatWithCurrency(Number(effective) / 100)
            : String(effective);
          const inputType = field === 'recurring_commission_tiers' || isMoney ? 'text' : 'number';

          return (
            <div key={field} className="rounded-lg bg-dark-700/40 p-3">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <label
                      htmlFor={`legacy-${field}`}
                      className="text-sm font-medium text-dark-200"
                    >
                      {t(`admin.partnerDetail.legacySettings.fields.${field}`)}
                    </label>
                    <code className="text-[11px] text-dark-500">{field}</code>
                  </div>
                  <div className="mt-1 text-xs text-dark-500">
                    {t('admin.partnerDetail.legacySettings.effective')}: {effectiveLabel} ·{' '}
                    {sourceLabel(data.sources[field], t)}
                  </div>
                </div>
                {override === null && (
                  <span className="text-xs text-dark-500">
                    {t('admin.partnerDetail.legacySettings.inherited')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`legacy-${field}`}
                  type={inputType}
                  min={0}
                  max={PERCENT_FIELDS.has(field) ? 100 : undefined}
                  step={isMoney ? '0.01' : '1'}
                  value={inputValue}
                  onChange={(event) => handleChange(field, event.target.value)}
                  disabled={isPending || !canEdit}
                  className="input min-w-0 flex-1"
                  placeholder={t('admin.partnerDetail.legacySettings.inheritPlaceholder')}
                />
                <PermissionGate permission="partners:edit">
                  {override !== null && (
                    <button
                      type="button"
                      onClick={() => handleResetField(field)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-600 hover:text-dark-100 disabled:opacity-50"
                      title={t('admin.partnerDetail.legacySettings.resetField')}
                    >
                      <RefreshIcon />
                    </button>
                  )}
                </PermissionGate>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-error-400" role="alert">
          {validationError || saveError}
        </div>
        <PermissionGate permission="partners:edit">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || dirty.size === 0}
            className="btn-primary disabled:opacity-50"
          >
            {updateMutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </PermissionGate>
      </div>

      <p className="mt-3 text-xs text-dark-500">{t('admin.partnerDetail.legacySettings.units')}</p>
    </section>
  );
}
