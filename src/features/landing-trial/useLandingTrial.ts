import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  landingApi,
  type LandingTrialConfig,
  type TrialFreeResponse,
  type TrialRequest,
} from '../../api/landings';
import { getApiErrorMessage } from '../../utils/api-error';
import { getYandexCid } from '../../utils/yandexCid';
import { detectContactType, isValidContact } from './contact';

/** Read a tracking id from the current URL, falling back to sessionStorage. */
function readTrackingParam(key: string, storageKey: string): string | undefined {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(key);
    if (fromUrl) return fromUrl;
    return sessionStorage.getItem(storageKey) || undefined;
  } catch {
    return undefined;
  }
}

interface UseLandingTrial {
  contactValue: string;
  setContactValue: (v: string) => void;
  selectedMethod: string | null;
  setSelectedMethod: (v: string | null) => void;
  selectedSubOption: string | null;
  setSelectedSubOption: (v: string | null) => void;
  isSubmitting: boolean;
  submitError: string | null;
  freeResult: TrialFreeResponse | null;
  canSubmit: boolean;
  submit: () => void;
}

/**
 * Encapsulates the trial mutation + success routing so QuickPurchase stays thin.
 * Owns its own contact/payment state, independent of the tariff purchase flow.
 */
export function useLandingTrial(slug: string, trial: LandingTrialConfig): UseLandingTrial {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [contactValue, setContactValue] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedSubOption, setSelectedSubOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [freeResult, setFreeResult] = useState<TrialFreeResponse | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requiresPayment = trial.requires_payment;

  const canSubmit = isValidContact(contactValue) && (!requiresPayment || !!selectedMethod);

  const mutation = useMutation({
    mutationFn: (data: TrialRequest) => landingApi.createTrial(slug, data),
    onSuccess: (res) => {
      if (res.mode === 'paid') {
        window.location.href = res.payment_url;
        // Popup/redirect blocked → let the user retry after a few seconds.
        redirectTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 5000);
        return;
      }
      // mode === 'free'
      if (res.auto_login_token) {
        navigate(`/auto-login?token=${encodeURIComponent(res.auto_login_token)}`);
        return;
      }
      setFreeResult(res);
      setIsSubmitting(false);
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      let msg: string;
      if (status === 409) {
        msg = t('landingTrial.alreadyUsed', 'You have already used the trial.');
      } else if (status === 429) {
        msg = t('landingTrial.rateLimited', 'Too many attempts. Please try again later.');
      } else if (status === 403) {
        msg = t('landingTrial.disabled', 'The trial is not available.');
      } else {
        msg = getApiErrorMessage(
          err,
          t('landingTrial.error', 'Something went wrong. Please try again.'),
        );
      }
      setSubmitError(msg);
      setIsSubmitting(false);
    },
  });

  const submit = useCallback(() => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    let paymentMethod: string | null = null;
    if (requiresPayment && selectedMethod) {
      paymentMethod = selectedSubOption ? `${selectedMethod}_${selectedSubOption}` : selectedMethod;
    }

    const data: TrialRequest = {
      contact_type: detectContactType(contactValue),
      contact_value: contactValue.trim(),
      payment_method: paymentMethod,
      language: i18n.language,
      yandex_cid: getYandexCid() || undefined,
      yclid: readTrackingParam('yclid', 'landing_yclid'),
      referrer: sessionStorage.getItem('landing_referrer') || undefined,
      subid: sessionStorage.getItem('landing_subid') || undefined,
    };

    mutation.mutate(data);
  }, [
    canSubmit,
    isSubmitting,
    requiresPayment,
    selectedMethod,
    selectedSubOption,
    contactValue,
    i18n.language,
    mutation,
  ]);

  return {
    contactValue,
    setContactValue,
    selectedMethod,
    setSelectedMethod,
    selectedSubOption,
    setSelectedSubOption,
    isSubmitting,
    submitError,
    freeResult,
    canSubmit,
    submit,
  };
}
