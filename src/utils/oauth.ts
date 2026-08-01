export const LINK_OAUTH_STATE_KEY = 'link_oauth_state';
export const LINK_OAUTH_PROVIDER_KEY = 'link_oauth_provider';

const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_PROVIDER_KEY = 'oauth_provider';

const OAUTH_RETURN_TO_KEY = 'oauth_return_to';

export function saveOAuthState(state: string, provider: string, returnTo?: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
  if (returnTo) sessionStorage.setItem(OAUTH_RETURN_TO_KEY, returnTo);
  else sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
}

export function loadOAuthState(): {
  state: string;
  provider: string;
  returnTo: string | null;
} | null {
  const state = sessionStorage.getItem(OAUTH_STATE_KEY);
  const provider = sessionStorage.getItem(OAUTH_PROVIDER_KEY);
  if (!state || !provider) return null;
  return { state, provider, returnTo: sessionStorage.getItem(OAUTH_RETURN_TO_KEY) };
}

export function clearOAuthState(): void {
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
  sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
}

export function peekLinkOAuthState(): { state: string; provider: string } | null {
  const state = sessionStorage.getItem(LINK_OAUTH_STATE_KEY);
  const provider = sessionStorage.getItem(LINK_OAUTH_PROVIDER_KEY);
  if (!state || !provider) return null;
  return { state, provider };
}

export function clearLinkOAuthState(): void {
  sessionStorage.removeItem(LINK_OAUTH_STATE_KEY);
  sessionStorage.removeItem(LINK_OAUTH_PROVIDER_KEY);
}

export function getErrorDetail(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { detail?: unknown } } }).response;
    const detail = resp?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object' && 'message' in detail) {
      const msg = (detail as Record<string, unknown>).message;
      if (typeof msg === 'string') return msg;
    }
  }
  if (err instanceof Error) return err.message;
  return null;
}
