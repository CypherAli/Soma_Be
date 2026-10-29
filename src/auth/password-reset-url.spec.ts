import { passwordResetFrontend } from './password-reset-url';

describe('password reset destination', () => {
  it('keeps local development usable and supports a dedicated public reset site', () => {
    expect(passwordResetFrontend({ NODE_ENV: 'test' })).toBe(
      'http://localhost:3000',
    );
    expect(
      passwordResetFrontend({
        NODE_ENV: 'production',
        FRONTEND_URL: 'http://localhost:3000',
        PASSWORD_RESET_FRONTEND_URL: 'https://soma.example/',
      }),
    ).toBe('https://soma.example');
  });
  it.each([
    'http://soma.example',
    'https://localhost',
    'https://localhost.',
    'https://127.0.0.2',
    'https://127.0.0.1',
    'https://demo.localhost',
    'https://[::1]',
    'https://user:pass@soma.example',
    'https://soma.example/?redirect=evil',
    'javascript:alert(1)',
    'invalid',
  ])('rejects an unsafe production destination: %s', (url) => {
    expect(
      passwordResetFrontend({ NODE_ENV: 'production', FRONTEND_URL: url }),
    ).toBeNull();
  });
});
