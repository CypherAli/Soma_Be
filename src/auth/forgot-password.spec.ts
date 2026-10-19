import { ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma/prisma.service';

describe('forgot password delivery', () => {
  function setup(configured = true) {
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'owner', disabledAt: null }),
      },
      passwordResetToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'new-reset' }),
      },
    };
    const mail = {
      configured,
      sendPasswordReset: jest.fn().mockResolvedValue({ sent: true }),
    };
    return {
      prisma,
      mail,
      service: new AuthService(
        prisma as unknown as PrismaService,
        mail as unknown as MailService,
      ),
    };
  }
  it('reports missing SMTP consistently before looking up an account or creating tokens', async () => {
    const { service, prisma, mail } = setup(false);
    await expect(
      service.forgotPassword({ email: 'test@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });
  it('invalidates only the newly created token when delivery fails', async () => {
    const { service, prisma, mail } = setup();
    mail.sendPasswordReset.mockResolvedValue({ sent: false });
    await expect(
      service.forgotPassword({ email: 'test@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenLastCalledWith({
      where: { id: 'new-reset', usedAt: null },
    });
  });
  it('returns success only after a registered account mail is delivered', async () => {
    const { service, mail } = setup();
    const result = await service.forgotPassword({ email: 'test@example.com' });
    expect(mail.sendPasswordReset).toHaveBeenCalledTimes(1);
    expect(result.message).toContain('đã được gửi');
    expect(result).not.toHaveProperty('token');
  });
});
