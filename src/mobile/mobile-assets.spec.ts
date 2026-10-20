import { ServiceUnavailableException } from '@nestjs/common';
import { MobileService } from './mobile.service';
import type { ContentService } from '../content/content.service';
import type { AuthService } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StudyService } from '../study/study.service';
import type { ConfigService } from '@nestjs/config';

describe('mobile CMS replacement asset references', () => {
  function setup(file: string) {
    const content = {
      definitions: new Map([
        [
          'scene',
          {
            id: 'scene',
            source: 'src/lib/scenes/hand.ts',
            payload: { value: { slug: 'ban-tay' } },
          },
        ],
      ]),
      snapshot: () =>
        Promise.resolve({
          documents: { scene: { value: { slug: 'ban-tay', modelFile: file } } },
        }),
      asset: jest.fn().mockResolvedValue({
        mime: 'model/gltf-binary',
        data: Buffer.from('glTF'),
      }),
    };
    const service = new MobileService(
      content as unknown as ContentService,
      {} as AuthService,
      {} as PrismaService,
      {} as StudyService,
      {
        get: (key: string) =>
          key === 'API_URL' ? 'https://api.soma.test/api' : undefined,
      } as ConfigService,
    );
    return { service, content };
  }
  it.each([
    '/api/content/assets/aa-bb',
    'https://api.soma.test/api/content/assets/aa-bb',
  ])('reads the same stored asset from %s', async (file) => {
    const { service, content } = setup(file);
    expect((await service.modelFile('ban-tay')).toString()).toBe('glTF');
    expect(content.asset).toHaveBeenCalledWith('aa-bb');
  });
  it.each([
    'https://other.test/api/content/assets/aa-bb',
    'https://api.soma.test/api/content/assets/aa-bb?token=x',
    'https://user@api.soma.test/api/content/assets/aa-bb',
    '/api/content/assets/../../secret',
  ])('rejects an untrusted reference: %s', async (file) => {
    const { service, content } = setup(file);
    await expect(service.modelFile('ban-tay')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(content.asset).not.toHaveBeenCalled();
  });
});
