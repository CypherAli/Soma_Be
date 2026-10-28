import { mobileReturnUrl } from './mobile-return';

describe('Expo Go callback allowlist', () => {
  const original = process.env.MOBILE_OAUTH_RETURN_URLS;
  afterEach(() => {
    if (original === undefined) delete process.env.MOBILE_OAUTH_RETURN_URLS;
    else process.env.MOBILE_OAUTH_RETURN_URLS = original;
  });
  it('permits the native app and explicitly registered Expo host only', () => {
    const expo = 'exp://192.168.1.10:8081/--/oauth';
    expect(mobileReturnUrl()).toBe('soma://oauth');
    expect(mobileReturnUrl(expo)).toBeNull();
    process.env.MOBILE_OAUTH_RETURN_URLS = expo;
    expect(mobileReturnUrl(expo)).toBe(expo);
    expect(mobileReturnUrl('exp://192.168.1.11:8081/--/oauth')).toBeNull();
    expect(mobileReturnUrl(expo + '?next=https://evil.test')).toBeNull();
    expect(mobileReturnUrl(expo + '#token=secret')).toBeNull();
    expect(mobileReturnUrl('https://evil.test/oauth')).toBeNull();
  });
});
