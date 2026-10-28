import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const verifier = 'v'.repeat(64);
const challenge = createHash('sha256').update(verifier).digest('base64url');
const mobileState = 's'.repeat(64);
describe('mobile OAuth shares provider identity without putting session tokens in links', () => {
  const envKeys = [
    'API_URL',
    'MOBILE_OAUTH_API_URL',
    'MOBILE_OAUTH_RETURN_URLS',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ] as const;
  let saved: (string | undefined)[];
  beforeEach(() => {
    saved = envKeys.map((k) => process.env[k]);
    Object.assign(process.env, {
      API_URL: 'http://localhost:4000/api',
      MOBILE_OAUTH_API_URL: 'https://mobile.example.test/api',
      GOOGLE_CLIENT_ID: 'test-client',
      GOOGLE_CLIENT_SECRET: 'test-secret',
    });
    jest.spyOn(global, 'fetch').mockImplementation((input) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      return Promise.resolve(
        new Response(
          JSON.stringify(
            url.includes('/token')
              ? { access_token: 'provider-secret' }
              : {
                  sub: 'existing-google-id',
                  name: 'Existing learner',
                  email: 'learner@example.invalid',
                  email_verified: true,
                },
          ),
        ),
      );
    });
  });
  afterEach(() => {
    envKeys.forEach((k, i) => {
      if (saved[i] === undefined) delete process.env[k];
      else process.env[k] = saved[i];
    });
    jest.restoreAllMocks();
  });
  function setup() {
    const user = {
      id: 'existing-web-user',
      name: 'Learner',
      email: 'learner@example.invalid',
      role: 'user',
      plan: 'free',
      avatar: null,
      disabledAt: null,
      googleId: 'existing-google-id',
    };
    type State = {
      id: string;
      provider: string;
      stateHash: string;
      codeVerifier: string;
      mobileState?: string;
      mobileChallenge?: string;
      callbackUrl?: string;
    };
    type Code = {
      codeHash: string;
      challenge: string;
      userId: string;
      expiresAt: Date;
    };
    const states: State[] = [],
      codes: Code[] = [];
    const prisma = {
      oAuthState: {
        create: jest.fn(({ data }: { data: Omit<State, 'id'> }) => {
          states.push({ ...data, id: 'state-id' });
        }),
        findFirst: jest.fn(
          ({ where }: { where: Pick<State, 'stateHash' | 'provider'> }) =>
            Promise.resolve(
              states.find(
                (s) =>
                  s.stateHash === where.stateHash &&
                  s.provider === where.provider,
              ),
            ),
        ),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          const index = states.findIndex((s) => s.id === where.id);
          if (index < 0) throw new Error('Already consumed');
          states.splice(index, 1);
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      mobileOAuthCode: {
        create: jest.fn(({ data }: { data: Code }) => {
          codes.push(data);
        }),
        findUnique: jest.fn(({ where }: { where: { codeHash: string } }) =>
          Promise.resolve(codes.find((c) => c.codeHash === where.codeHash)),
        ),
        deleteMany: jest.fn(({ where }: { where: { codeHash?: string } }) => {
          const i = codes.findIndex((c) => c.codeHash === where.codeHash);
          if (i < 0) return Promise.resolve({ count: 0 });
          codes.splice(i, 1);
          return Promise.resolve({ count: 1 });
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
        findUnique: jest.fn().mockResolvedValue(user),
        create: jest.fn(),
      },
      session: { create: jest.fn().mockResolvedValue({}) },
      $transaction: <T>(f: (tx: unknown) => Promise<T>) => f(prisma),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      { configured: true } as MailService,
    );
    const controller = new AuthController(service);
    async function callback() {
      const { url } = await controller.mobileOAuthStart('google', {
        state: mobileState,
        challenge,
      });
      return controller.oauthCallback(
        'google',
        'provider-code',
        new URL(url).searchParams.get('state')!,
      );
    }
    return { user, prisma, service, controller, codes, callback };
  }
  it('uses configured mobile HTTPS callback and preserves the web callback', async () => {
    const { service } = setup();
    const mobile = new URL(
      await service.oauthUrl('google', undefined, {
        state: mobileState,
        challenge,
      }),
    );
    const web = new URL(await service.oauthUrl('google'));
    expect(mobile.searchParams.get('redirect_uri')).toBe(
      'https://mobile.example.test/api/auth/oauth/google/callback',
    );
    expect(web.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/api/auth/oauth/google/callback',
    );
    process.env.MOBILE_OAUTH_API_URL = 'http://localhost:4000/api';
    await expect(
      service.oauthUrl('google', undefined, { state: mobileState, challenge }),
    ).rejects.toThrow('HTTPS');
  });
  it('hands the provider identity back to an explicitly allowed Expo Go route', async () => {
    const { service, controller, user } = setup();
    const returnUrl = 'exp://192.168.1.12:8081/--/oauth';
    process.env.MOBILE_OAUTH_RETURN_URLS = returnUrl;
    const authorize = new URL(
      await service.oauthUrl('google', undefined, {
        state: mobileState,
        challenge,
        returnUrl,
      }),
    );
    const result = await controller.oauthCallback(
      'google',
      'provider-code',
      authorize.searchParams.get('state')!,
    );
    expect(result.url.startsWith(returnUrl + '?')).toBe(true);
    const code = new URL(result.url).searchParams.get('code')!;
    expect(
      (await controller.mobileOAuthExchange({ code, verifier })).user.id,
    ).toBe(user.id);
    await expect(
      service.oauthUrl('google', undefined, {
        state: mobileState,
        challenge,
        returnUrl: returnUrl.replace('8081', '8082'),
      }),
    ).rejects.toThrow('chưa được cho phép');
  });
  it('returns one-use PKCE code and logs into the exact existing web identity', async () => {
    const { callback, controller, prisma, user } = setup();
    const returned = new URL((await callback()).url);
    expect(returned.protocol).toBe('soma:');
    expect(returned.hostname).toBe('oauth');
    expect(returned.searchParams.get('state')).toBe(mobileState);
    expect(returned.searchParams.has('token')).toBe(false);
    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    const code = returned.searchParams.get('code')!;
    const login = await controller.mobileOAuthExchange({ code, verifier });
    expect(login.user.id).toBe(user.id);
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
    await expect(
      controller.mobileOAuthExchange({ code, verifier }),
    ).rejects.toThrow();
  });
  it('rejects intercepted codes, expiry, deleted/disabled accounts and concurrent reuse', async () => {
    const { callback, controller, codes, prisma } = setup();
    const code = new URL((await callback()).url).searchParams.get('code')!;
    expect(codes[0].codeHash).toBe(hash(code));
    await expect(
      controller.mobileOAuthExchange({ code, verifier: 'wrong'.repeat(15) }),
    ).rejects.toThrow();
    expect(prisma.session.create).not.toHaveBeenCalled();
    codes[0].expiresAt = new Date(0);
    await expect(
      controller.mobileOAuthExchange({ code, verifier }),
    ).rejects.toThrow();
    codes[0].expiresAt = new Date(Date.now() + 60000);
    const results = await Promise.allSettled([
      controller.mobileOAuthExchange({ code, verifier }),
      controller.mobileOAuthExchange({ code, verifier }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });
  it('returns denial to the requesting app with its state and rejects forged states', async () => {
    const { service, controller, prisma } = setup();
    const url = new URL(
      await service.oauthUrl('google', undefined, {
        state: mobileState,
        challenge,
      }),
    );
    const result = await controller.oauthCallback(
      'google',
      '',
      url.searchParams.get('state')!,
      undefined,
      'access_denied',
    );
    const returned = new URL(result.url);
    expect(returned.searchParams.get('error')).toBe('cancelled');
    expect(returned.searchParams.get('state')).toBe(mobileState);
    expect(prisma.session.create).not.toHaveBeenCalled();
    await expect(
      controller.oauthCallback(
        'google',
        '',
        'forged',
        undefined,
        'access_denied',
      ),
    ).rejects.toThrow();
  });
});
