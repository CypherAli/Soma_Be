import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { scryptSync } from 'crypto';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';

describe('AuthService session and password lifecycle', () => {
  const user = {
    id: 'user-a',
    name: 'Test',
    email: 'test@example.com',
    passwordEmail: 'test@example.com',
    role: 'user',
    plan: 'free',
    passwordHash: `scrypt:salt:${scryptSync('password123', 'salt', 64).toString('hex')}`,
    disabledAt: null,
    avatar: null,
    googleId: null,
    githubId: null,
    facebookId: null,
    createdAt: new Date(),
  } as User;

  function setup() {
    const tx = {
      passwordResetToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: jest.fn().mockResolvedValue(user) },
      session: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      passwordResetToken: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'reset-a', userId: user.id, user }),
      },
      session: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'session-a', userId: user.id, user }),
      },
      $transaction: jest.fn(
        async (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          work(tx as unknown as Prisma.TransactionClient),
      ),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as MailService,
    );
    return { service, prisma, tx };
  }

  it('allows exactly one of two concurrent requests to consume a reset token', async () => {
    const { service, tx } = setup();
    let claimed = false;
    tx.passwordResetToken.updateMany.mockImplementation(() => {
      const count = claimed ? 0 : 1;
      claimed = true;
      return Promise.resolve({ count });
    });
    const results = await Promise.allSettled([
      service.resetPassword({
        token: 'reset-token',
        newPassword: 'password456',
      }),
      service.resetPassword({
        token: 'reset-token',
        newPassword: 'password789',
      }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(tx.user.update).toHaveBeenCalledTimes(1);
    expect(tx.session.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'reset-a',
          usedAt: null,
          expiresAt: { gt: expect.any(Date) as unknown },
        },
      }),
    );
  });

  it('rejects an expired or consumed token before changing any credentials', async () => {
    const { service, tx } = setup();
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.resetPassword({
        token: 'reset-token',
        newPassword: 'password456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.session.deleteMany).not.toHaveBeenCalled();
  });

  it('changes credentials, revokes sessions and issues the replacement in one transaction', async () => {
    const { service, prisma, tx } = setup();
    const result = await service.changePassword(
      { currentPassword: 'password123', newPassword: 'password456' },
      'session-token',
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.user.update).toHaveBeenCalledTimes(1);
    expect(tx.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: user.id },
    });
    expect(tx.session.create).toHaveBeenCalledTimes(1);
    expect(result.token).toEqual(expect.any(String));
  });

  it('keeps a valid session when the current password was entered incorrectly', async () => {
    const { service, prisma } = setup();
    await expect(
      service.changePassword(
        { currentPassword: 'wrong', newPassword: 'password456' },
        'session-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects disabled accounts on profile, session and provider operations', async () => {
    const { service, prisma } = setup();
    prisma.session.findFirst.mockResolvedValue({
      id: 'session-a',
      userId: user.id,
      user: { ...user, disabledAt: new Date() },
    });
    for (const action of [
      () => service.updateProfile({ name: 'Updated' }, 'session-token'),
      () => service.sessions('session-token'),
      () => service.revokeOtherSessions('session-token'),
      () => service.unlinkProvider('google', 'session-token'),
    ]) {
      await expect(action()).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });
});
