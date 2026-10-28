import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

describe('Expo desktop callback isolation', () => {
  const keys = [
    'NODE_ENV',
    'DESKTOP_OAUTH_API_URL',
    'MOBILE_OAUTH_API_URL',
    'MOBILE_OAUTH_RETURN_URLS',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
  ] as const;
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const prisma = {
    oAuthState: { create: jest.fn(), deleteMany: jest.fn() },
    mobileOAuthCode: { deleteMany: jest.fn() },
  };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    {} as MailService,
  );
  const proof = {
    challenge: 'a'.repeat(43),
    state: 'b'.repeat(64),
    returnUrl: 'http://localhost:8082/oauth',
  };
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.DESKTOP_OAUTH_API_URL = 'http://localhost:4000/api';
    process.env.MOBILE_OAUTH_API_URL = 'https://mobile.example/api';
    process.env.MOBILE_OAUTH_RETURN_URLS = proof.returnUrl;
    process.env.GITHUB_CLIENT_ID = 'id';
    process.env.GITHUB_CLIENT_SECRET = 'secret';
  });
  afterAll(() => {
    for (const key of keys) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  it('uses the owner-configured loopback callback for an allowlisted desktop return', async () => {
    const url = new URL(await service.oauthUrl('github', undefined, proof));
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/api/auth/oauth/github/callback',
    );
    expect(prisma.oAuthState.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mobileReturnUrl: proof.returnUrl,
        }) as unknown,
      }),
    );
  });
  it('keeps native APK authorization on the public callback', async () => {
    const url = new URL(
      await service.oauthUrl('github', undefined, {
        ...proof,
        returnUrl: 'soma://oauth',
      }),
    );
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://mobile.example/api/auth/oauth/github/callback',
    );
  });
  it('does not accept an unregistered desktop host', async () => {
    await expect(
      service.oauthUrl('github', undefined, {
        ...proof,
        returnUrl: 'http://127.0.0.1:8082/oauth',
      }),
    ).rejects.toThrow('chưa được cho phép');
    expect(prisma.oAuthState.create).not.toHaveBeenCalled();
  });
  it('never selects the loopback callback in production', async () => {
    process.env.NODE_ENV = 'production';
    const url = new URL(await service.oauthUrl('github', undefined, proof));
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://mobile.example/api/auth/oauth/github/callback',
    );
  });
  it('cannot use desktop configuration to forward a callback to an external host', async () => {
    process.env.DESKTOP_OAUTH_API_URL = 'http://attacker.example/api';
    const url = new URL(await service.oauthUrl('github', undefined, proof));
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://mobile.example/api/auth/oauth/github/callback',
    );
  });
  it('can run desktop OAuth without a tunnel, while native remains unavailable', () => {
    delete process.env.MOBILE_OAUTH_API_URL;
    expect(service.mobileCapabilities(proof.returnUrl).oauth.github).toBe(true);
    expect(service.mobileCapabilities('soma://oauth').mobileOAuth).toBe(false);
  });
});
