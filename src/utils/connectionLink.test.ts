import { describe, expect, it } from 'vitest';
import { extractSubscriptionUrl } from './connectionLink';

describe('extractSubscriptionUrl', () => {
  it('returns a plain https url unchanged', () => {
    expect(extractSubscriptionUrl('https://sub.example.com/abc')).toBe(
      'https://sub.example.com/abc',
    );
  });

  it('extracts from path-embedded deep links (incy, happ)', () => {
    expect(extractSubscriptionUrl('incy://import/https://sub.example.com/abc')).toBe(
      'https://sub.example.com/abc',
    );
    expect(extractSubscriptionUrl('happ://add/https://sub.example.com/abc')).toBe(
      'https://sub.example.com/abc',
    );
  });

  it('strips #fragment profile names (streisand)', () => {
    expect(extractSubscriptionUrl('streisand://import/https://sub.example.com/abc#MyVPN')).toBe(
      'https://sub.example.com/abc',
    );
  });

  it('extracts from ?url= query params, decoding and dropping other params', () => {
    expect(
      extractSubscriptionUrl(
        'v2rayng://install-sub?url=https%3A%2F%2Fsub.example.com%2Fabc&name=VPN',
      ),
    ).toBe('https://sub.example.com/abc');
    expect(
      extractSubscriptionUrl('clash://install-config?url=https://sub.example.com/abc&name=X'),
    ).toBe('https://sub.example.com/abc');
  });

  it('decodes URL-encoded path-embedded links (hiddify)', () => {
    expect(extractSubscriptionUrl('hiddify://import/https%3A%2F%2Fsub.example.com%2Fabc')).toBe(
      'https://sub.example.com/abc',
    );
  });

  it('decodes base64 payloads (shadowrocket sub://)', () => {
    const b64 = btoa('https://sub.example.com/abc');
    expect(extractSubscriptionUrl(`sub://${b64}`)).toBe('https://sub.example.com/abc');
  });

  it('keeps & that belongs to the subscription url itself', () => {
    expect(
      extractSubscriptionUrl('v2box://install-sub?url=https://sub.example.com/abc?key=1&x=2'),
    ).toBe('https://sub.example.com/abc?key=1');
  });

  it('returns null when nothing is embedded (happ crypt links)', () => {
    expect(extractSubscriptionUrl('happ://crypt4/AbCdEfGh123')).toBeNull();
    expect(extractSubscriptionUrl('')).toBeNull();
    expect(extractSubscriptionUrl(null)).toBeNull();
    expect(extractSubscriptionUrl(undefined)).toBeNull();
  });
});
