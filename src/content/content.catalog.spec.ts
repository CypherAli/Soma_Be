import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { ContentService } from './content.service';

describe('CMS source catalog reload', () => {
  it('replaces a cached publication contract, model list and search definitions after source sync', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'soma-catalog-'));
    const filename = join(directory, 'catalog.json');
    const writeCatalog = (contractHash: string, id: string) =>
      writeFileSync(
        filename,
        JSON.stringify({
          contractHash,
          documents: [
            {
              id,
              title: id,
              source: 'src/lib/example.ts',
              category: 'interface',
              payload: { value: { title: id } },
            },
          ],
          meshes: { [`/models/${id}.glb`]: [id] },
          atlasParts: [],
        }),
      );
    try {
      writeCatalog('before', 'old');
      const prisma = {
        siteContent: { findMany: jest.fn().mockResolvedValue([]) },
        siteAsset: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const service = new ContentService(
        prisma as unknown as PrismaService,
        {
          get: () => filename,
        } as unknown as ConfigService,
      );
      expect((await service.snapshot()).contractHash).toBe('before');

      // No restart and no wait for the publication cache's three-second TTL.
      writeCatalog('after-source-sync', 'new-source-document');
      expect((await service.snapshot()).contractHash).toBe('after-source-sync');
      expect(service.definitions.has('old')).toBe(false);
      expect((await service.list()).items.map((item) => item.id)).toEqual([
        'new-source-document',
      ]);
      expect(await service.models()).toEqual([
        {
          url: '/models/new-source-document.glb',
          meshNames: ['new-source-document'],
        },
      ]);
      expect(prisma.siteContent.findMany).toHaveBeenCalledTimes(3);
    } finally {
      unlinkSync(filename);
      rmdirSync(directory);
    }
  });
});
