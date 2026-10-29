import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json } from 'express';

export function allowedOrigins(env: NodeJS.ProcessEnv = process.env) {
  const origins = new Set<string>();
  const candidates = [
    ...(env.CORS_ORIGINS ?? '').split(','),
    env.FRONTEND_URL,
    env.MOBILE_WEB_URL,
    env.BO_FRONTEND_URL,
  ];
  if (env.NODE_ENV !== 'production') {
    for (const host of ['localhost', '127.0.0.1'])
      for (const port of [3000, 3001, 8082])
        candidates.push(`http://${host}:${port}`);
  }
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const url = new URL(candidate.trim());
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error(
        'CORS origins must be HTTP(S) addresses without credentials.',
      );
    origins.add(url.origin);
  }
  return origins;
}

export function configureHttpSecurity(app: NestExpressApplication) {
  app.disable('x-powered-by');
  // Trust only explicitly configured proxy addresses/subnets, never client headers alone.
  const proxies = process.env.TRUST_PROXY?.split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (proxies?.some((v) => /^(true|false|\d+)$/i.test(v)))
    throw new Error(
      'TRUST_PROXY must contain trusted proxy addresses or CIDR ranges.',
    );
  app.set('trust proxy', proxies?.length ? proxies : false);
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      strictTransportSecurity:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
    ],
    json({ limit: '16kb' }),
  );
  app.useBodyParser('json', { limit: '10mb' });
  const origins = allowedOrigins();
  app.enableCors({
    origin: (origin, callback) =>
      callback(null, !origin || origins.has(origin)),
    credentials: true,
  });
}
