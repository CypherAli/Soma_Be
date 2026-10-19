export type DocumentChunk = {
  id: string;
  sourceFile: string;
  page: number;
  printedPage?: number;
  text: string;
};

/** Keep the source PDF page when splitting the user's locally extracted textbook. */
export function textbookChunks(
  text: string,
  sourceFile: string,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const match of text.matchAll(
    /\[\[page (\d+)\]\]([\s\S]*?)(?=\[\[page \d+\]\]|$)/g,
  )) {
    const page = Number(match[1]);
    const content = match[2].replace(/\f/g, '').trim();
    let start = 0;
    while (start < content.length) {
      let end = Math.min(start + 1600, content.length);
      if (end < content.length) {
        const boundary = content.lastIndexOf('\n', end);
        if (boundary > start + 800) end = boundary;
      }
      const passage = content.slice(start, end).trim();
      if (passage)
        chunks.push({
          id: `textbook:${sourceFile}:${page}:${start}`,
          sourceFile,
          page,
          text: passage,
        });
      start = end;
    }
  }
  return chunks;
}
const normalize = (value: string) => value.normalize('NFC').toLowerCase();
const fold = (value: string) =>
  normalize(value).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
const words = (value: string) => value.match(/[\p{L}\p{N}]+/gu) ?? [];

export function rankDocumentChunks(
  chunks: DocumentChunk[],
  query: string,
  limit: number,
) {
  const terms = [
    ...new Set(words(normalize(query)).filter((term) => term.length >= 2)),
  ];
  if (!terms.length) return [];
  const foldedTerms = terms.map(fold);
  const candidates = chunks.map((chunk) => {
    const exact = words(normalize(chunk.text)),
      folded = exact.map(fold);
    const matches = terms.map((term, index) => {
      const exactCount = exact.filter((word) => word === term).length;
      const foldedCount = folded.filter(
        (word) => word === foldedTerms[index],
      ).length;
      return exactCount * 2 + Math.max(0, foldedCount - exactCount);
    });
    const coverage = matches.filter(Boolean).length / terms.length;
    const phrase = normalize(chunk.text)
      .replace(/\s+/g, ' ')
      .includes(normalize(query).trim());
    const score =
      coverage * 12 +
      matches.reduce((sum, count) => sum + Math.min(count, 6), 0) /
        Math.sqrt(Math.max(1, exact.length) / 100) +
      (phrase ? 8 : 0);
    const bibliography =
      (chunk.text.match(/\bet al\b|\bdoi\b|\bJ Surg\b/gi) ?? []).length > 8;
    return { chunk, score: bibliography ? score * 0.1 : score, coverage };
  });
  const seenPages = new Set<string>();
  return candidates
    .filter((hit) => hit.coverage > 0)
    .sort((a, b) => b.score - a.score || a.chunk.page - b.chunk.page)
    .filter(({ chunk }) => {
      const key = `${chunk.sourceFile}:${chunk.page}`;
      if (seenPages.has(key)) return false;
      seenPages.add(key);
      return true;
    })
    .slice(0, Math.max(1, Math.min(30, limit)));
}

/** Return a bounded excerpt containing the strongest query match, not just the page start. */
export function documentExcerpt(
  text: string,
  query: string,
  maximum = 1200,
): string {
  if (text.length <= maximum) return text;
  const terms = new Set(words(fold(query)).filter((term) => term.length >= 2));
  const matches = [...text.matchAll(/[\p{L}\p{N}]+/gu)].filter((match) =>
    terms.has(fold(match[0])),
  );
  let anchor = matches[0]?.index ?? 0;
  let best = 0;
  for (const match of matches) {
    const position = match.index;
    const coverage = new Set(
      matches
        .filter(
          (other) =>
            other.index >= position && other.index < position + maximum - 200,
        )
        .map((other) => fold(other[0])),
    ).size;
    if (coverage > best) {
      best = coverage;
      anchor = position;
    }
  }
  const start = Math.min(Math.max(0, anchor - 150), text.length - maximum);
  return `${start ? '…' : ''}${text.slice(start, start + maximum).trim()}${start + maximum < text.length ? '…' : ''}`;
}
