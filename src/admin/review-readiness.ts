import { createHash } from 'node:crypto';
import { revisionOf } from './revisions';
/** Shared between the drawer and bulk queue: approval always describes the current content. */
export const REVIEW_INCLUDE = {
  content: true,
  citations: { include: { source: { select: { status: true } } } },
  relatedStructures: true,
} as const;
export function reviewReady(row: {
  content: {
    locale: string;
    description?: string | null;
    machineTranslated?: boolean;
  }[];
  citations: { verified: boolean; source: { status: string } }[];
}) {
  return (
    row.content.some(
      (c) =>
        c.locale === 'vi' && !!c.description?.trim() && !c.machineTranslated,
    ) && row.citations.some((c) => c.verified && c.source.status !== 'archived')
  );
}
export function reviewRevision(
  row: object & {
    content: object[];
    citations: object[];
    relatedStructures: object[];
    structureId?: string | null;
  },
) {
  const ordered = (rows: object[]) => rows.map((r) => JSON.stringify(r)).sort();
  return createHash('sha256')
    .update(
      JSON.stringify({
        meta: revisionOf('pathology', row),
        structureId: row.structureId ?? null,
        content: ordered(
          row.content.map((r) => {
            const c = r as { id: string; locale: string };
            return {
              id: c.id,
              locale: c.locale,
              revision: revisionOf('pathology_content', r),
            };
          }),
        ),
        citations: ordered(
          row.citations.map((r) => {
            const c = r as {
              id: string;
              sourceId: string;
              pageOrSection: string | null;
              quote: string | null;
              verified: boolean;
              source: { status: string };
            };
            return {
              id: c.id,
              sourceId: c.sourceId,
              page: c.pageOrSection,
              quote: c.quote,
              verified: c.verified,
              status: c.source.status,
            };
          }),
        ),
        related: ordered(
          row.relatedStructures.map((r) => {
            const link = r as { structureId: string };
            return { structureId: link.structureId };
          }),
        ),
      }),
    )
    .digest('hex');
}
