import {
  checkLoginThrottle,
  loginKey,
  recordLoginFail,
  recordLoginSuccess,
} from './login-throttle';

describe('login throttle', () => {
  afterEach(() => jest.restoreAllMocks());

  it('normalizes email and keeps different IP buckets separate', () => {
    expect(loginKey(' Test@Example.com ', '127.0.0.1')).toBe(
      'test@example.com|127.0.0.1',
    );
    expect(loginKey('test@example.com', '127.0.0.1')).not.toBe(
      loginKey('test@example.com', '127.0.0.2'),
    );
  });

  it('blocks at five failures and expires exactly at the window boundary', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const key = loginKey('boundary@example.com');
    for (let i = 0; i < 5; i += 1) recordLoginFail(key);
    expect(checkLoginThrottle(key)).toEqual({
      blocked: true,
      retryAfterSec: 900,
    });
    now.mockReturnValue(1000 + 15 * 60 * 1000);
    expect(checkLoginThrottle(key)).toEqual({
      blocked: false,
      retryAfterSec: 0,
    });
  });

  it('clears failures after a successful login', () => {
    const key = loginKey('success@example.com');
    for (let i = 0; i < 5; i += 1) recordLoginFail(key);
    recordLoginSuccess(key);
    expect(checkLoginThrottle(key).blocked).toBe(false);
  });
});
