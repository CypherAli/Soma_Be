import { Controller, Get, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { allowedOrigins, configureHttpSecurity } from './http-security';
import { rateLimits } from './rate-limits';

@Controller('fixture')
class FixtureController {
  @Get('one') one() {
    return { ok: true };
  }
  @Get('two') two() {
    return { ok: true };
  }
}

describe('HTTP security boundary', () => {
  let app: NestExpressApplication;
  const auth = {
    forgotPassword: jest.fn().mockResolvedValue({
      message: 'Nếu email này đã đăng ký, link đã được gửi',
    }),
    me: jest.fn().mockResolvedValue({ user: { id: 'owner', plan: 'pro' } }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(rateLimits)],
      controllers: [AuthController, FixtureController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
      logger: false,
    });
    app.setGlobalPrefix('api');
    configureHttpSecurity(app);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });
  afterEach(async () => {
    await app?.close();
  });

  it('limits reset emails before mail/database work and ignores spoofed forwarding headers', async () => {
    for (let i = 0; i < 4; i++) {
      const result = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', `198.51.100.${i + 1}`)
        .send({ email: 'student@example.com' });
      expect(result.status).toBe(i < 3 ? 200 : 429);
      if (i === 3)
        expect(Number(result.headers['retry-after-auth'])).toBeGreaterThan(0);
    }
    expect(auth.forgotPassword).toHaveBeenCalledTimes(3);
  });
  it('shares the global IP limit across endpoints', async () => {
    for (let i = 0; i < 301; i++) {
      const result = await request(app.getHttpServer()).get(
        `/api/fixture/${i % 2 ? 'one' : 'two'}`,
      );
      expect(result.status).toBe(i < 300 ? 200 : 429);
    }
  }, 30_000);
  it('permits configured web/native clients, omits CORS for unknown origins, and prevents profile caching', async () => {
    const local = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Origin', 'http://localhost:3000')
      .expect(200);
    expect(local.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(local.headers['cache-control']).toBe('private, no-store');
    expect(local.headers['x-content-type-options']).toBe('nosniff');
    expect(local.headers['x-powered-by']).toBeUndefined();
    const other = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Origin', 'https://attacker.example')
      .expect(200);
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
    await request(app.getHttpServer()).get('/api/auth/me').expect(200);
  });
  it('rejects oversized auth JSON before invoking a service', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'a'.repeat(17000) })
      .expect(413);
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });
  it('uses exact origins and does not retain development defaults in production', () => {
    const origins = allowedOrigins({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://soma.example/vi',
      CORS_ORIGINS: 'https://admin.example',
    });
    expect([...origins].sort()).toEqual([
      'https://admin.example',
      'https://soma.example',
    ]);
    expect(origins.has('https://soma.example.attacker.example')).toBe(false);
  });
});
