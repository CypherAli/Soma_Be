import {
  documentExcerpt,
  rankDocumentChunks,
  textbookChunks,
  type DocumentChunk,
} from './retrieval';
const chunks: DocumentChunk[] = [
  {
    id: 'liver',
    sourceFile: 'a.pdf',
    page: 12,
    text: 'Gan nằm ở vùng bụng. Gan có các thùy.',
  },
  {
    id: 'tendon',
    sourceFile: 'a.pdf',
    page: 18,
    text: 'Gân gót là gân chung của cơ tam đầu cẳng chân.',
  },
  {
    id: 'skull',
    sourceFile: 'b.pdf',
    page: 4,
    text: 'Sọ có các đường khớp. Khớp dọc nằm giữa hai xương đỉnh.',
  },
];
describe('document retrieval', () => {
  it('splits textbook pages without losing the source PDF page', () => {
    const result = textbookChunks(
      '[[page 393]]\nXương bướm\n[[page 394]]\nLỗ bầu dục',
      'skull.pdf',
    );
    expect(
      result.map((chunk) => [chunk.sourceFile, chunk.page, chunk.text]),
    ).toEqual([
      ['skull.pdf', 393, 'Xương bướm'],
      ['skull.pdf', 394, 'Lỗ bầu dục'],
    ]);
  });
  it('returns one strongest passage per source page', () => {
    const a = { id: 'a', sourceFile: 'a.pdf', page: 1, text: 'Lỗ bầu dục' };
    expect(
      rankDocumentChunks([a, { ...a, id: 'b' }], 'lo bau duc', 10),
    ).toHaveLength(1);
  });
  it('keeps the searched term visible in a bounded excerpt', () => {
    const text =
      'Mở đầu. '.repeat(300) +
      'Lỗ bầu dục ở xương bướm. ' +
      'Đoạn sau. '.repeat(300);
    expect(documentExcerpt(text, 'lo bau duc')).toContain('Lỗ bầu dục');
    expect(documentExcerpt(text, 'lo bau duc').length).toBeLessThanOrEqual(
      1202,
    );
  });
  it('accepts two-character Vietnamese terms and unaccented queries', () => {
    expect(rankDocumentChunks(chunks, 'sọ', 3)[0].chunk.id).toBe('skull');
    expect(rankDocumentChunks(chunks, 'khop doc', 3)[0].chunk.id).toBe('skull');
  });
  it('prioritizes exact accents over a folded homonym', () => {
    expect(rankDocumentChunks(chunks, 'gan', 3)[0].chunk.id).toBe('liver');
    expect(rankDocumentChunks(chunks, 'gân', 3)[0].chunk.id).toBe('tendon');
  });
  it('does not match a query as a substring of another word', () => {
    expect(
      rankDocumentChunks(chunks, 'gót', 3).map((hit) => hit.chunk.id),
    ).toEqual(['tendon']);
    expect(rankDocumentChunks(chunks, 'unknownxyz', 3)).toEqual([]);
  });
  it('preserves source and page metadata and handles empty input', () => {
    expect(rankDocumentChunks(chunks, 'sọ', 1)[0].chunk).toEqual(chunks[2]);
    expect(rankDocumentChunks(chunks, '   ', 3)).toEqual([]);
  });
  it('prioritizes clinical prose over a bibliography repeating the term', () => {
    const clinical = {
      id: 'clinical',
      sourceFile: 'c.pdf',
      page: 4,
      text: 'Acute appendicitis diagnosis uses a clinical assessment and imaging.',
    };
    const references = {
      id: 'references',
      sourceFile: 'c.pdf',
      page: 38,
      text:
        'References ' +
        'Author et al. Appendicitis. J Surg. 2020. doi 123. '.repeat(20),
    };
    expect(
      rankDocumentChunks([references, clinical], 'appendicitis', 2)[0].chunk.id,
    ).toBe('clinical');
  });
});
