import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { scryptSync } from 'node:crypto';
import type { User } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma/prisma.service';

describe('independent OAuth identities and optional linking', () => {
  const envKeys = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'API_URL',
    'FRONTEND_URL',
  ] as const;
  let saved: Array<string | undefined>;
  beforeEach(() => {
    saved = envKeys.map((key) => process.env[key]);
    Object.assign(process.env, {
      GOOGLE_CLIENT_ID: 'test-client',
      GOOGLE_CLIENT_SECRET: 'test-secret',
      GITHUB_CLIENT_ID: 'test-github',
      GITHUB_CLIENT_SECRET: 'test-secret',
      API_URL: 'http://localhost:4000/api',
      FRONTEND_URL: 'http://localhost:3000',
    });
    jest.spyOn(global, 'fetch').mockImplementation((input) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const body =
        url.includes('/token') || url.includes('/access_token')
          ? { access_token: 'test-provider-token' }
          : url.includes('/user/emails')
            ? [{ email: 'test@example.com', primary: true, verified: true }]
            : url.includes('api.github.com/user')
              ? {
                  id: 'github-owner',
                  name: 'GitHub Test',
                  email: 'test@example.com',
                }
              : {
                  sub: 'google-owner',
                  name: 'Google Test',
                  email: 'test@example.com',
                  email_verified: true,
                };
      return Promise.resolve(
        new Response(JSON.stringify(body), { status: 200 }),
      );
    });
  });
  afterEach(() => {
    envKeys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key];
      else process.env[key] = saved[i];
    });
    jest.restoreAllMocks();
  });

  function setup() {
    const users = [
      {
        id: 'password-owner',
        name: 'Test',
        email: 'test@example.com',
        passwordEmail: 'test@example.com',
        role: 'user',
        passwordHash: `scrypt:salt:${scryptSync('password123', 'salt', 64).toString('hex')}`,
        googleId: null,
        githubId: null,
        facebookId: null,
        disabledAt: null,
      } as User,
    ];
    const states: Array<{
      id: string;
      stateHash: string;
      provider: string;
      linkUserId?: string;
      expiresAt: Date;
      codeVerifier: string;
    }> = [];
    const sessions: Array<{ tokenHash: string; userId: string }> = [];
    type Where = Partial<
      Pick<
        User,
        'id' | 'passwordEmail' | 'googleId' | 'githubId' | 'facebookId'
      >
    >;
    const find = (where: Where) =>
      users.find((user) =>
        Object.entries(where).every(
          ([key, value]) => user[key as keyof Where] === value,
        ),
      ) ?? null;
    const prisma = {
      user: {
        findFirst: jest.fn(({ where }: { where: Where }) =>
          Promise.resolve(find(where)),
        ),
        findUnique: jest.fn(({ where }: { where: Where }) =>
          Promise.resolve(find(where)),
        ),
        create: jest.fn(({ data }: { data: Partial<User> }) => {
          const user = {
            id: `oauth-${users.length}`,
            role: 'user',
            passwordHash: null,
            passwordEmail: null,
            googleId: null,
            githubId: null,
            facebookId: null,
            disabledAt: null,
            ...data,
          } as User;
          users.push(user);
          return Promise.resolve(user);
        }),
        update: jest.fn(
          ({ where, data }: { where: { id: string }; data: Partial<User> }) => {
            const user = users.find((item) => item.id === where.id)!;
            Object.assign(user, data);
            return Promise.resolve(user);
          },
        ),
      },
      oAuthState: {
        create: jest.fn(
          ({ data }: { data: Omit<(typeof states)[number], 'id'> }) => {
            states.push({ ...data, id: `state-${states.length}` });
            return Promise.resolve({});
          },
        ),
        findFirst: jest.fn(
          ({
            where,
          }: {
            where: {
              stateHash: string;
              provider: string;
              expiresAt: { gt: Date };
            };
          }) =>
            Promise.resolve(
              states.find(
                (s) =>
                  s.stateHash === where.stateHash &&
                  s.provider === where.provider &&
                  s.expiresAt > where.expiresAt.gt,
              ),
            ),
        ),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          states.splice(
            states.findIndex((s) => s.id === where.id),
            1,
          );
          return Promise.resolve({});
        }),
      },
      session: {
        create: jest.fn(({ data }: { data: (typeof sessions)[number] }) => {
          sessions.push(data);
          return Promise.resolve({});
        }),
        findFirst: jest.fn(({ where }: { where: { tokenHash: string } }) => {
          const session = sessions.find((s) => s.tokenHash === where.tokenHash);
          return Promise.resolve(
            session
              ? {
                  ...session,
                  user: users.find((u) => u.id === session.userId)!,
                }
              : null,
          );
        }),
      },
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as MailService,
    );
    const controller = new AuthController(service);
    async function oauth(provider: 'google' | 'github', linkToken?: string) {
      const url = new URL(
        linkToken
          ? (await controller.beginOAuthLink(provider, `Bearer ${linkToken}`))
              .url
          : await service.oauthUrl(provider),
      );
      const result = await controller.oauthCallback(
        provider,
        'test-code',
        url.searchParams.get('state')!,
      );
      const fragment = new URLSearchParams(new URL(result.url).hash.slice(1));
      return {
        url: result.url,
        user: fragment.has('user')
          ? (JSON.parse(fragment.get('user')!) as { id: string; role: string })
          : null,
      };
    }
    return { service, controller, prisma, users, oauth };
  }

  it('keeps password, Google and GitHub separate even when their contact email matches', async () => {
    const { oauth, service, users, prisma } = setup();
    const hash = users[0].passwordHash;
    const google = await oauth('google');
    const github = await oauth('github');
    expect(google.user?.id).not.toBe('password-owner');
    expect(github.user?.id).not.toBe('password-owner');
    expect(google.user?.id).not.toBe(github.user?.id);
    expect(google.user?.role).toBe('user');
    expect(users).toHaveLength(3);
    expect(users[0].passwordHash).toBe(hash);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(
      (
        await service.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).user.id,
    ).toBe('password-owner');
    expect((await oauth('google')).user?.id).toBe(google.user?.id);
    expect((await oauth('github')).user?.id).toBe(github.user?.id);
    expect(users).toHaveLength(3);
  });
  it('allows password registration after an independent OAuth account used the email', async () => {
    const { oauth, service, users } = setup();
    users.splice(0);
    const google = await oauth('google');
    const password = await service.register({
      name: 'Password Test',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(password.user.id).not.toBe(google.user?.id);
    expect(
      (
        await service.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).user.id,
    ).toBe(password.user.id);
    expect((await oauth('google')).user?.id).toBe(google.user?.id);
  });

  it('logs into an already linked password account directly', async () => {
    const { oauth, users, prisma } = setup();
    users[0].githubId = 'github-owner';
    expect((await oauth('github')).user?.id).toBe('password-owner');
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('links only on an explicit authenticated request, preserving password and account ID', async () => {
    const { service, oauth, users } = setup();
    const hash = users[0].passwordHash;
    const login = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect((await oauth('google', login.token)).url).toContain(
      '/cai-dat/ket-noi?linked=google',
    );
    expect(users[0].passwordHash).toBe(hash);
    expect((await oauth('google')).user?.id).toBe('password-owner');
    expect(
      (
        await service.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).user.id,
    ).toBe('password-owner');
    expect(users).toHaveLength(1);
  });
  it('does not take over a separate OAuth account during linking', async () => {
    const { service, controller, oauth, prisma } = setup();
    await oauth('github');
    const login = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });
    const url = new URL(
      (await controller.beginOAuthLink('github', `Bearer ${login.token}`)).url,
    );
    await expect(
      controller.oauthCallback(
        'github',
        'code',
        url.searchParams.get('state')!,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('rejects linking without a valid session before creating a state', async () => {
    const { controller, prisma } = setup();
    await expect(controller.beginOAuthLink('google')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.beginOAuthLink('google', 'Bearer invalid'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.oAuthState.create).not.toHaveBeenCalled();
  });
  it('rejects a disabled provider account instead of creating a replacement', async () => {
    const { users, oauth, prisma } = setup();
    users[0].googleId = 'google-owner';
    users[0].disabledAt = new Date();
    await expect(oauth('google')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.session.create).not.toHaveBeenCalled();
  });
});
