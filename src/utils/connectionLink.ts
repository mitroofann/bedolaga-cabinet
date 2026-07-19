import { createHappCryptoLink } from '@kastov/cryptohapp';

export function isHappCryptolinkMode(mode: string | null | undefined): boolean {
  const normalized = String(mode ?? '').toUpperCase();
  if (!normalized) return false;
  return normalized.includes('HAPP') && normalized.includes('CRYPT');
}

/**
 * Extract the bare http(s) subscription URL from an app deep link so it can be
 * pasted into an app directly (no `incy://import/` etc. prefix). Handled formats:
 *   path-embedded:  happ://add/https://…, incy://import/https://…,
 *                   streisand://import/https://…#Name
 *   query param:    v2rayng://install-sub?url=https%3A%2F%2F…&name=…,
 *                   clash://install-config?url=…, sing-box://…?url=…
 *   encoded path:   hiddify://import/https%3A%2F%2F…
 *   base64 payload: sub://aHR0cHM6… (Shadowrocket)
 * Returns the input unchanged when it is already http(s), or null when nothing
 * extractable is embedded (e.g. happ://crypt… — those are pasted as-is).
 */
export function extractSubscriptionUrl(deepLink: string | null | undefined): string | null {
  const s = String(deepLink ?? '');
  if (!s) return null;

  // ?url= / &url= query param (possibly URL-encoded), stop at & or #
  const q = s.match(/[?&]url=([^&#]+)/i);
  if (q) {
    let val = q[1];
    try {
      val = decodeURIComponent(val);
    } catch {
      /* keep raw */
    }
    if (/^https?:\/\//i.test(val)) return val;
  }

  // http(s) embedded in the path; keep & (may belong to the sub URL),
  // strip #fragment (profile name)
  let m = s.match(/https?:\/\/[^#]+/i);
  if (m) return m[0];

  // URL-encoded embedded link
  m = s.match(/https?%3A%2F%2F[^#&]+/i);
  if (m) {
    try {
      return decodeURIComponent(m[0]);
    } catch {
      /* fall through */
    }
  }

  // whole payload is base64 (sub://<base64> — Shadowrocket)
  m = s.match(/^[a-z][a-z0-9+.-]*:\/\/([A-Za-z0-9+/=_-]+)\/?$/i);
  if (m) {
    try {
      const decoded = atob(m[1].replace(/-/g, '+').replace(/_/g, '/'));
      if (/^https?:\/\//i.test(decoded)) return decoded;
    } catch {
      /* not base64 */
    }
  }

  return null;
}

function isHttpUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function isHappSubscriptionLink(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^happ:\/\/sub/i.test(url);
}

function isCryptSourceUrl(url: string | null | undefined): url is string {
  return isHttpUrl(url) || isHappSubscriptionLink(url);
}

function isHappCryptDeepLink(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^happ:\/\/crypt/i.test(url);
}

interface ResolveConnectionUrlInput {
  mode?: string | null;
  subscriptionUrl?: string | null;
  displayLink?: string | null;
  happSchemeLink?: string | null;
  happCryptLink?: string | null;
  happCryptoLink?: string | null;
  happLink?: string | null;
  fallbackUrl?: string | null;
}

export function resolveConnectionUrlForUi(input: ResolveConnectionUrlInput): string | null {
  const defaultUrl =
    input.fallbackUrl ?? input.subscriptionUrl ?? input.displayLink ?? input.happSchemeLink ?? null;

  if (!isHappCryptolinkMode(input.mode)) return defaultUrl;

  const backendCryptLink =
    [
      input.happCryptLink,
      input.happCryptoLink,
      input.happLink,
      input.happSchemeLink,
      input.displayLink,
      input.subscriptionUrl,
    ].find((value) => isHappCryptDeepLink(value)) ?? null;
  if (backendCryptLink) return backendCryptLink;

  const sourceSubscriptionUrl =
    [input.subscriptionUrl, input.displayLink, input.fallbackUrl].find((value) =>
      isCryptSourceUrl(value),
    ) ?? null;

  if (sourceSubscriptionUrl) {
    return (
      createHappCryptoLink(sourceSubscriptionUrl, 'v4', true) ??
      createHappCryptoLink(sourceSubscriptionUrl, 'v3', true) ??
      defaultUrl
    );
  }

  return defaultUrl;
}
