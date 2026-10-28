import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('deployment readiness', () => {
  it('returns 503 while the database is unavailable', async () => {
    const db = { $queryRaw: jest.fn().mockRejectedValue(new Error('offline')) };
    const controller = new HealthController(db as unknown as PrismaService);
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    db.$queryRaw.mockResolvedValue([{ result: 1 }]);
    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      db: 'up',
    });
  });
});
