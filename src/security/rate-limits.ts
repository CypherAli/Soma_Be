import { createHash } from 'crypto';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export const rateLimits: ThrottlerModuleOptions = {
  errorMessage: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.',
  throttlers: [
    {
      name: 'global',
      ttl: 60_000,
      limit: 300,
      // One bucket across controllers, so switching endpoints cannot evade it.
      generateKey: (_context, tracker) =>
        createHash('sha256').update(`global:${tracker}`).digest('hex'),
    },
    {
      name: 'auth',
      ttl: 60_000,
      limit: 60,
      skipIf: (context) => context.getClass().name !== 'AuthController',
    },
  ],
};
