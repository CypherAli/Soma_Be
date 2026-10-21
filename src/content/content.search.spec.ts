import {
  contentSearchEntry,
  contentSearchScore,
  matchesContentKind,
} from './content.search';
import { ContentService } from './content.service';
import type { ContentDefinition } from './content.validation';
import type { PrismaService } from '../prisma/prisma.service';
import type { ConfigService } from '@nestjs/config';

const scene: ContentDefinition = {
  id: 'heart',
  title: 'Giải phẫu Tim',
  category: 'models',
  source: 'src/lib/scenes/cardiovascular.ts',
  payload: {
    value: {
      title: { en: 'Heart anatomy', vi: 'Giải phẫu Tim' },
      slug: 'giai-phau-tim',
      modelFile: '/models/heart.glb',
      description: 'Cấu trúc tim',
    },
  },
};

describe('CMS search relevance', () => {
  it('matches Vietnamese without accents, case, punctuation or word order', () => {
    const entry = contentSearchEntry(scene);
    for (const q of ['TIM', 'giai phau tim', 'tim giải-phẫu', 'heart anatomy'])
      expect(contentSearchScore(entry, q)).toBeGreaterThan(0);
    expect(entry.title).toBe('Giải phẫu Tim');
    expect(contentSearchScore(entry, 'động mạch')).toBe(0);
  });

  it('keeps incidental mentions out of name search and ranks them last in full text', () => {
    const incidental = contentSearchEntry({
      ...scene,
      title: 'Bàn chân',
      payload: {
        value: { title: 'Bàn chân', description: 'Máu từ tim đi tới bàn chân' },
      },
    });
    const unrelated = contentSearchEntry({
      ...scene,
      payload: {
        value: { title: 'Atlas', description: 'An estimated volume' },
      },
    });
    expect(contentSearchScore(incidental, 'tim')).toBe(0);
    expect(contentSearchScore(incidental, 'tim', 'all')).toBeGreaterThan(0);
    expect(
      contentSearchScore(contentSearchEntry(scene), 'tim', 'all'),
    ).toBeGreaterThan(contentSearchScore(incidental, 'tim', 'all'));
    expect(contentSearchScore(unrelated, 'tim', 'all')).toBe(0);
    expect(
      contentSearchScore(contentSearchEntry(scene), 'modelFile', 'all'),
    ).toBe(0);
  });

  it('separates atlas labels from editable model scenes', () => {
    const label = contentSearchEntry({
      ...scene,
      id: 'atlas:FJ1',
      payload: { value: { id: 'FJ1', name: 'Heart' } },
    });
    expect(matchesContentKind(label, 'scenes')).toBe(false);
    expect(matchesContentKind(label, 'atlas-label')).toBe(true);
    expect(matchesContentKind(contentSearchEntry(scene), 'glb')).toBe(true);
  });

  it('ranks actual catalog heart models before incidental mentions and paginates filtered results', async () => {
    const service = new ContentService(
      {
        siteContent: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService,
      { get: () => undefined } as unknown as ConfigService,
    );
    const result = await service.list('models', 'tim', 1, 'scenes');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].title.toLocaleLowerCase('vi')).toContain('tim');
    expect(result.items.every((item) => item.kind !== 'atlas-label')).toBe(
      true,
    );
    expect(
      result.items.some((item) => item.title === 'Bàn chân chi tiết'),
    ).toBe(false);
    const page = await service.list('models', '', 2, 'glb');
    expect(page.items).toHaveLength(30);
    expect(page.items.every((item) => item.kind === 'glb')).toBe(true);
  });

  it('searches and displays saved draft names rather than stale source names', async () => {
    const service = new ContentService(
      {
        siteContent: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'atlas:FJ1252',
              draft: { value: { id: 'FJ1252', name: 'Tên biên tập mới' } },
              published: null,
              version: 1,
            },
          ]),
        },
      } as unknown as PrismaService,
      { get: () => undefined } as unknown as ConfigService,
    );
    const result = await service.list('models', 'ten bien tap moi');
    expect(result.items[0].title).toBe('Tên biên tập mới');
  });

  it('lists the reproductive atlas once and resolves both legacy document kinds to the canonical lesson', async () => {
    const service = new ContentService(
      {
        siteContent: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService,
      { get: () => undefined } as unknown as ConfigService,
    );
    const legacy = [...service.definitions.values()].filter(
      (doc) =>
        (doc.payload.value as { slug?: string })?.slug ===
        'co-quan-sinh-duc-nam',
    );
    expect(legacy.length).toBeGreaterThan(0);
    for (const doc of legacy) {
      const detail = await service.detail(doc.id);
      expect(detail.identifier).toBe('he-sinh-san-nam');
      expect(detail.redirectedFrom).toBe(doc.id);
    }
    const result = await service.list('models', 'sinh sản nam', 1, 'scenes');
    expect(
      result.items.filter((item) => item.identifier === 'he-sinh-san-nam'),
    ).toHaveLength(1);
    expect(
      result.items.some((item) => item.identifier === 'co-quan-sinh-duc-nam'),
    ).toBe(false);
  });
});
