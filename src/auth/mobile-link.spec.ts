import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

describe('authenticated mobile provider linking', () => {
  const owner = {
    id: 'owner',
    name: 'Owner',
    email: 'owner@example.invalid',
    role: 'user',
    plan: 'free',
    learningRole: 'learner',
    premiumUntil: null,
    sandboxPremiumUntil: null,
    passwordHash: 'hash',
    avatar: null,
    createdAt: new Date(),
    disabledAt: null,
    googleId: null,
    githubId: null,
    facebookId: null,
  };
  const record = {
    id: 'state',
    linkUserId: 'owner',
    provider: 'google',
    codeVerifier: 'verifier',
    mobileChallenge: 'challenge',
    mobileState: 'mobile-state',
    callbackUrl: 'https://mobile.example/api/auth/oauth/google/callback',
  };
  let prisma: {
    oAuthState: { findFirst: jest.Mock; delete: jest.Mock };
    user: { findUnique: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    mobileOAuthCode: { create: jest.Mock };
    session: { create: jest.Mock };
  };
  let service: AuthService;
  let saved: Record<string, string | undefined>;
  beforeEach(() => {
    const keys = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'MOBILE_GOOGLE_CLIENT_ID',
      'MOBILE_GOOGLE_CLIENT_SECRET',
    ];
    saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    Object.assign(process.env, {
      GOOGLE_CLIENT_ID: 'client',
      GOOGLE_CLIENT_SECRET: 'secret',
    });
    delete process.env.MOBILE_GOOGLE_CLIENT_ID;
    delete process.env.MOBILE_GOOGLE_CLIENT_SECRET;
    prisma = {
      oAuthState: {
        findFirst: jest.fn().mockResolvedValue(record),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(owner),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest
          .fn()
          .mockResolvedValue({ ...owner, googleId: 'google-owner' }),
      },
      mobileOAuthCode: { create: jest.fn() },
      session: { create: jest.fn() },
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      {} as MailService,
    );
    jest.spyOn(global, 'fetch').mockImplementation((input) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            (typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : input.url
            ).includes('/token')
              ? { access_token: 'provider-token' }
              : {
                  sub: 'google-owner',
                  email: 'separate-google@example.invalid',
                  email_verified: true,
                  name: 'Provider name',
                },
          ),
        ),
      ),
    );
  });
  afterEach(() => {
    jest.restoreAllMocks();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  it('issues only a one-time PKCE code for the authenticated owner, never a token in the callback', async () => {
    const result = await service.oauthCallback('google', 'code', 'state');
    expect(result).toEqual({
      mobileCode: expect.any(String) as unknown,
      mobileState: 'mobile-state',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'owner' },
      data: { googleId: 'google-owner' },
    });
    expect(prisma.mobileOAuthCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'owner',
        challenge: 'challenge',
        codeHash: expect.any(String) as unknown,
      }) as unknown,
    });
    expect(prisma.session.create).not.toHaveBeenCalled();
  });
  it('does not link an identity already owned by another account', async () => {
    prisma.user.findFirst.mockResolvedValue({ ...owner, id: 'other' });
    await expect(
      service.oauthCallback('google', 'code', 'state'),
    ).rejects.toThrow('người dùng khác');
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.mobileOAuthCode.create).not.toHaveBeenCalled();
  });
  it('rejects a disabled owner before adding a provider', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...owner,
      disabledAt: new Date(),
    });
    await expect(
      service.oauthCallback('google', 'code', 'state'),
    ).rejects.toThrow();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('retains the existing web link response for a web request', async () => {
    prisma.oAuthState.findFirst.mockResolvedValue({
      ...record,
      mobileChallenge: null,
      mobileState: null,
    });
    expect(await service.oauthCallback('google', 'code', 'state')).toEqual(
      expect.objectContaining({
        linked: 'google',
        user: expect.objectContaining({ id: 'owner' }) as unknown,
      }),
    );
    expect(prisma.mobileOAuthCode.create).not.toHaveBeenCalled();
  });
  it('requires a Bearer session on the mobile link endpoint', async () => {
    const url = jest.spyOn(service, 'oauthUrl');
    await expect(
      new AuthController(service).mobileOAuthLink('google', {
        challenge: 'c',
        state: 's',
        returnUrl: 'soma://oauth',
      }),
    ).rejects.toThrow('Cần đăng nhập');
    expect(url).not.toHaveBeenCalled();
  });
});
