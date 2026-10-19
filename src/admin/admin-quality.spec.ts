import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AdminService } from './admin.service';
import { OpsService } from './ops.service';
import { SourcesService } from './sources.service';
import { RolesGuard } from '../auth/roles.guard';
import { ContentService } from '../content/content.service';
import { QueuesService } from './queues.service';
import { revisionOf } from './revisions';
import { reviewReady, reviewRevision } from './review-readiness';
import type { AuthUser } from '../auth/roles';

jest.mock('pdf-parse', () => ({
  PDFParse: class {
    getText() {
      return Promise.resolve({ pages: [{ text: 'Nội dung chuẩn' }] });
    }
    destroy() {
      return Promise.resolve();
    }
  },
}));
const actor: AuthUser = {
  id: 'admin',
  email: 'qa@example.invalid',
  name: 'QA',
  role: 'admin',
};
function fixture() {
  const pathology = {
    id: 'p',
    slug: 'tim',
    nameVi: 'Tim',
    nameEn: 'Heart',
    nameZh: '心',
    latin: null,
    icdCode: null,
    severity: null,
    clinicalSystem: null,
    source: 'A',
    sourcePage: null,
    needsReview: false,
    structureId: null,
    content: [
      {
        id: 'c',
        pathologyId: 'p',
        locale: 'vi',
        description: 'Đại cương',
        machineTranslated: false,
      },
    ],
    citations: [
      {
        id: 'cite',
        pathologyId: 'p',
        sourceId: 'old',
        pageOrSection: '12',
        quote: null,
        verified: true,
        source: { status: 'downloaded' },
      },
    ],
    relatedStructures: [],
  };
  const source = {
    id: 'old',
    title: 'Sách chuẩn cũ',
    publisher: 'NXB A',
    year: 2020,
    url: 'https://example.org/old',
    localFile: 'original.pdf',
    status: 'downloaded',
    licenseNote: null,
  };
  let state = {
    pathology,
    source,
    created: [] as Record<string, unknown>[],
    logs: [] as Record<string, unknown>[],
    assets: [] as Record<string, unknown>[],
  };
  let failAudit = false;
  const makeTx = (working: typeof state) => ({
    pathology: {
      findUnique: jest.fn(() => Promise.resolve(working.pathology)),
      update: jest.fn(({ data }: { data: object }) => {
        Object.assign(working.pathology, data);
        return Promise.resolve(working.pathology);
      }),
      updateMany: jest.fn(() => {
        working.pathology.needsReview = true;
        return Promise.resolve({ count: 1 });
      }),
    },
    pathologyContent: {
      findUnique: jest.fn(() => Promise.resolve(working.pathology.content[0])),
      upsert: jest.fn(({ update }: { update: object }) => {
        Object.assign(working.pathology.content[0], update);
        return Promise.resolve(working.pathology.content[0]);
      }),
    },
    medicalSource: {
      findUnique: jest.fn(() => Promise.resolve(working.source)),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        working.created.push(data);
        return Promise.resolve(data);
      }),
      update: jest.fn(({ data }: { data: object }) => {
        Object.assign(working.source, data);
        return Promise.resolve(working.source);
      }),
    },
    siteAsset: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        working.assets.push(data);
        return Promise.resolve(data);
      }),
    },
    auditLog: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        if (failAudit) throw new Error('audit unavailable');
        working.logs.push(data);
        return Promise.resolve(data);
      }),
    },
  });
  const prisma = {
    $transaction: async (
      run: (tx: ReturnType<typeof makeTx>) => Promise<unknown>,
    ) => {
      const pending = structuredClone(state);
      const result = await run(makeTx(pending));
      state = pending;
      return result;
    },
  } as unknown as PrismaService;
  const audit = new AuditService(prisma),
    admin = new AdminService(prisma, audit);
  return {
    prisma,
    audit,
    admin,
    get: () => state,
    failAudit: () => {
      failAudit = true;
    },
  };
}
describe('clinical editing and audit safety', () => {
  it('rejects a stale form without modifying data or audit', async () => {
    const f = fixture();
    await expect(
      f.admin.updatePathology(actor, 'p', {
        expectedRevision: 'stale',
        nameVi: 'Wrong',
      }),
    ).rejects.toThrow('Phiên bản');
    expect(f.get().pathology.nameVi).toBe('Tim');
    expect(f.get().logs).toHaveLength(0);
  });
  it('returns edited articles to review and records the same committed change', async () => {
    const f = fixture();
    await f.admin.updatePathology(actor, 'p', {
      expectedRevision: revisionOf('pathology', f.get().pathology),
      nameVi: 'Mới',
    });
    expect(f.get().pathology.needsReview).toBe(true);
    expect(f.get().logs).toHaveLength(1);
  });
  it('rolls back the content when the audit write fails', async () => {
    const f = fixture();
    f.failAudit();
    await expect(
      f.admin.updatePathology(actor, 'p', {
        expectedRevision: revisionOf('pathology', f.get().pathology),
        nameVi: 'Không lưu',
      }),
    ).rejects.toThrow('audit unavailable');
    expect(f.get().pathology.nameVi).toBe('Tim');
    expect(f.get().pathology.needsReview).toBe(false);
  });
  it('content saves invalidate review without accepting stale revisions', async () => {
    const f = fixture();
    const c = f.get().pathology.content[0];
    await f.admin.upsertContent(actor, 'p', 'vi', {
      expectedRevision: revisionOf('pathology_content', c),
      description: 'Đã đổi',
    });
    expect(f.get().pathology.needsReview).toBe(true);
    await expect(
      f.admin.upsertContent(actor, 'p', 'vi', {
        expectedRevision: revisionOf('pathology_content', c),
        description: 'Ghi đè',
      }),
    ).rejects.toThrow('Phiên bản');
  });
  it('rejects approval of content changed after the reviewer opened it', async () => {
    const f = fixture(),
      token = reviewRevision(f.get().pathology);
    f.get().pathology.content[0].description = 'Changed';
    await expect(f.admin.setReviewed(actor, 'p', false, token)).rejects.toThrow(
      'Bài đã thay đổi',
    );
  });
  it('single approval requires a verified citation from an active source', async () => {
    const f = fixture();
    f.get().pathology.citations[0].verified = false;
    await expect(
      f.admin.setReviewed(actor, 'p', false, reviewRevision(f.get().pathology)),
    ).rejects.toThrow('trích dẫn đã đối chiếu');
  });
  it('approves the exact revision after readiness checks', async () => {
    const f = fixture();
    f.get().pathology.needsReview = true;
    await f.admin.setReviewed(
      actor,
      'p',
      false,
      reviewRevision(f.get().pathology),
    );
    expect(f.get().pathology.needsReview).toBe(false);
    expect(f.get().logs).toHaveLength(1);
  });
  it.each(['', '  '])(
    'does not count empty Vietnamese description %j as ready',
    (description) => {
      const f = fixture();
      f.get().pathology.content[0].description = description;
      expect(reviewReady(f.get().pathology)).toBe(false);
    },
  );
  it('ignores relation display enrichment when comparing review revisions', () => {
    const f = fixture();
    const base = {
      ...f.get().pathology,
      relatedStructures: [{ pathologyId: 'p', structureId: 's' }],
    };
    expect(reviewRevision(base)).toBe(
      reviewRevision({
        ...base,
        relatedStructures: [
          {
            pathologyId: 'p',
            structureId: 's',
            structure: { nameVi: 'Display name' },
          },
        ],
      }),
    );
  });
});
describe('source replacement preserves the original book and citations', () => {
  it('creates a separate source and archives the old source without retargeting citations', async () => {
    const f = fixture(),
      service = new SourcesService(f.prisma, f.audit);
    await service.create(actor, {
      title: 'Sách mới',
      publisher: 'NXB B',
      url: 'https://example.org/new',
      replaceId: 'old',
      expectedRevision: revisionOf('medical_source', f.get().source),
    });
    expect(f.get().source.title).toBe('Sách chuẩn cũ');
    expect(f.get().source.localFile).toBe('original.pdf');
    expect(f.get().source.status).toBe('archived');
    expect(f.get().created[0].id).not.toBe('old');
    expect(f.get().pathology.citations[0].sourceId).toBe('old');
    expect(f.get().pathology.needsReview).toBe(true);
  });
  it('does not archive a newer source revision', async () => {
    const f = fixture();
    await expect(
      new SourcesService(f.prisma, f.audit).create(actor, {
        title: 'New',
        publisher: 'B',
        url: 'https://example.org',
        replaceId: 'old',
        expectedRevision: 'stale',
      }),
    ).rejects.toThrow('Phiên bản');
    expect(f.get().created).toHaveLength(0);
  });
  it('stores uploaded PDF bytes unchanged and indexes text separately', async () => {
    const f = fixture(),
      bytes = Buffer.from('%PDF-1.7 original immutable bytes');
    await new SourcesService(f.prisma, f.audit).create(
      actor,
      { title: 'PDF', publisher: 'B' },
      {
        buffer: bytes,
        size: bytes.length,
        originalname: 'standard.pdf',
      } as Express.Multer.File,
    );
    expect(Buffer.from(f.get().assets[0].data as Uint8Array)).toEqual(bytes);
    expect(f.get().assets[1].mime).toBe(
      'application/vnd.soma.source-index+json',
    );
    expect(f.get().assets[0].meshNames).toEqual([]);
  });
  it('rejects a disguised non-PDF before storing anything', async () => {
    const f = fixture();
    await expect(
      new SourcesService(f.prisma, f.audit).create(
        actor,
        { title: 'Bad', publisher: 'B' },
        {
          buffer: Buffer.from('not PDF'),
          size: 7,
          originalname: 'bad.pdf',
        } as Express.Multer.File,
      ),
    ).rejects.toThrow('PDF hợp lệ');
    expect(f.get().assets).toHaveLength(0);
  });
});
describe('public model route selection', () => {
  const prisma = {
    siteContent: {
      findMany: jest.fn(() => Promise.resolve([])),
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
  } as unknown as PrismaService;
  const service = new ContentService(prisma, {
    get: () => undefined,
  } as unknown as ConfigService);
  const legacy =
    'data:src/lib/scenes/cardiovascular.ts#cardiovascularScenes/giai-phau-tim';
  it('opens the atlas actually rendered by the website for a legacy GLB record', async () => {
    const detail = await service.detail(legacy);
    expect(detail.id).toBe(
      'data:src/lib/humanAtlas/scenes/heart.ts#heartScene',
    );
    expect(detail.redirectedFrom).toBe(legacy);
  });
  it('default scene search contains only the active record for overlapping slugs', async () => {
    const result = await service.list(
      'models',
      'giai phau tim',
      1,
      'scenes',
      'title',
    );
    expect(result.items.find((item) => item.id === legacy)).toBeUndefined();
    expect(
      result.items.some((item) => item.identifier === 'giai-phau-tim'),
    ).toBe(true);
  });
  it('rejects stale clients attempting to publish the unused legacy scene', async () => {
    await expect(
      service.save(actor, legacy, { version: 0, payload: {} }),
    ).rejects.toThrow('bản atlas');
  });
  it('also follows the public atlas route alias and makes that alias searchable', async () => {
    const doc = [...service.definitions.values()].find(
      (doc) =>
        doc.id.includes('/scenes/') &&
        (doc.payload.value as { slug?: string })?.slug === 'tieu-nao-day-du' &&
        !doc.source.includes('humanAtlas'),
    );
    expect(doc).toBeDefined();
    const detail = await service.detail(doc!.id);
    expect(detail.identifier).toBe('hoi-vo-dai-nao');
    expect(
      (
        await service.list('models', 'tieu nao day du', 1, 'scenes', 'title')
      ).items.some((item) => item.id === detail.id),
    ).toBe(true);
  });
});
describe('administrative authority boundaries', () => {
  it('does not let an admin revoke a super admin session', async () => {
    const remove = jest.fn();
    const tx = {
      session: {
        findUnique: () =>
          Promise.resolve({
            id: 's',
            user: {
              id: 'super',
              email: 'super@example.invalid',
              role: 'super_admin',
            },
          }),
        delete: remove,
      },
    };
    const prisma = {
      $transaction: (run: (tx: object) => Promise<unknown>) => run(tx),
    } as unknown as PrismaService;
    await expect(
      new OpsService(
        prisma,
        {} as ConfigService,
        new AuditService(prisma),
      ).revokeSession(actor, 's'),
    ).rejects.toThrow('ngang hoặc cao hơn');
    expect(remove).not.toHaveBeenCalled();
  });
  it.each([
    'pathologies',
    'structures',
    'species',
    'anatomy-systems',
    'quizzes',
  ])('blocks the unaudited legacy %s write API but keeps reads', (route) => {
    const guard = new RolesGuard({
      getAllAndOverride: () => undefined,
    } as unknown as Reflector);
    const context = (method: string) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            method,
            route: { path: '/api/' + route + '/:id' },
          }),
        }),
        getHandler: () => null,
        getClass: () => null,
      }) as unknown as ExecutionContext;
    expect(() => guard.canActivate(context('PATCH'))).toThrow(
      'Dùng API /admin',
    );
    expect(guard.canActivate(context('GET'))).toBe(true);
  });
});

describe('bulk review and recovery', () => {
  it('bulk and single approval enforce the same verified-source requirement', async () => {
    const f = fixture(),
      row = f.get().pathology;
    row.citations[0].source.status = 'archived';
    const prisma = {
      $transaction: (run: (tx: object) => Promise<unknown>) =>
        run({
          pathology: {
            findMany: () => Promise.resolve([row]),
            updateMany: jest.fn(),
          },
        }),
    } as unknown as PrismaService;
    await expect(
      new QueuesService(prisma, new AuditService(prisma)).bulkReview(
        actor,
        ['p'],
        true,
        { p: reviewRevision(row) },
      ),
    ).rejects.toThrow('chưa đủ điều kiện');
  });
  it('stale bulk approval is rejected before any update', async () => {
    const f = fixture(),
      updateMany = jest.fn(),
      prisma = {
        $transaction: (run: (tx: object) => Promise<unknown>) =>
          run({
            pathology: {
              findMany: () => Promise.resolve([f.get().pathology]),
              updateMany,
            },
          }),
      } as unknown as PrismaService;
    await expect(
      new QueuesService(prisma, new AuditService(prisma)).bulkReview(
        actor,
        ['p'],
        true,
        { p: 'stale' },
      ),
    ).rejects.toThrow('vừa thay đổi');
    expect(updateMany).not.toHaveBeenCalled();
  });
  it('restore preview never changes the original PDF path or a protected identifier', async () => {
    const f = fixture(),
      prisma = {
        auditLog: {
          findUnique: () =>
            Promise.resolve({
              entity: 'medical_source',
              entityId: 'old',
              before: {
                ...f.get().source,
                id: 'different',
                localFile: 'another.pdf',
                title: 'Earlier metadata',
              },
            }),
        },
        medicalSource: { findUnique: () => Promise.resolve(f.get().source) },
      } as unknown as PrismaService;
    const preview = await new AuditService(prisma).restorePreview('log');
    expect(preview.data.title).toBe('Earlier metadata');
    expect(preview.data).not.toHaveProperty('localFile');
    expect(preview.data).not.toHaveProperty('id');
    expect(preview.expectedRevision).toBe(
      revisionOf('medical_source', f.get().source),
    );
  });
  it('a restore cannot overwrite an edit made after its preview', async () => {
    const f = fixture(),
      audit = new AuditService(f.prisma);
    jest.spyOn(audit, 'restorePreview').mockResolvedValue({
      entity: 'pathology',
      entityId: 'p',
      data: { nameVi: 'Before' },
      current: { nameVi: 'Tim' },
      expectedRevision: 'stale',
    });
    await expect(audit.restore(actor, 'log', 'stale')).rejects.toThrow(
      'Phiên bản',
    );
    expect(f.get().pathology.nameVi).toBe('Tim');
  });
});
