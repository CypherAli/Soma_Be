import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  it('publishes the API entry contract', async () => {
    const result = await request(app.getHttpServer()).get('/api').expect(200);
    const body = result.body as {
      name: string;
      docs: string;
      version: string;
      endpoints: string[];
    };
    expect(body.name).toBe('Soma 3D API');
    expect(body.docs).toBe('/api/docs');
    expect(typeof body.version).toBe('string');
    expect(body.endpoints).toContain('/api/health');
  });

  it('reports database health or a controlled degraded state', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    const body = result.body as {
      db: string;
      status: string;
      timestamp: string;
    };
    expect(['up', 'down']).toContain(body.db);
    expect(body.status).toBe(body.db === 'up' ? 'ok' : 'degraded');
    expect(Number.isFinite(Date.parse(body.timestamp))).toBe(true);
  });

  it('exposes authentication availability as flags without provider credentials', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/auth/capabilities')
      .expect(200);
    const body = result.body as {
      passwordReset: boolean;
      mobileOAuth: boolean;
      oauth: Record<string, boolean>;
    };
    expect(typeof body.passwordReset).toBe('boolean');
    expect(typeof body.mobileOAuth).toBe('boolean');
    expect(Object.keys(body.oauth).sort()).toEqual([
      'facebook',
      'github',
      'google',
    ]);
    expect(
      Object.values(body.oauth).every((value) => typeof value === 'boolean'),
    ).toBe(true);
    expect(Object.keys(body).sort()).toEqual([
      'mobileOAuth',
      'oauth',
      'passwordReset',
    ]);
  });

  for (const path of [
    'auth/me',
    'study/history',
    'study/due',
    'personal-docs',
    'chat-memory',
  ]) {
    it(`requires authentication for ${path}`, () =>
      request(app.getHttpServer()).get(`/api/${path}`).expect(401));
  }
  for (const path of ['species', 'structures', 'pathologies', 'quizzes']) {
    it(`rejects anonymous content writes to ${path}`, () =>
      request(app.getHttpServer()).post(`/api/${path}`).send({}).expect(401));
  }
  for (const query of [
    'q=gan&limit=NaN',
    'q=gan&limit=Infinity',
    'q=gan&limit=2.5',
    'q=gan&limit=0',
    'q=gan&limit=31',
    'q=gan&q=tim',
  ]) {
    it(`validates medical search parameters: ${query}`, () =>
      request(app.getHttpServer())
        .get(`/api/medical-knowledge/search?${query}`)
        .expect(400));
  }

  it('rejects malformed JSON before executing a search or login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
