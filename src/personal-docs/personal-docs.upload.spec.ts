import { PersonalDocsService } from './personal-docs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { readDocument } from './document-reader';

jest.mock('./document-reader');
const mockReadDocument = jest.mocked(readDocument);

describe('personal PDF upload diagnostics', () => {
  const prisma = {
    personalDoc: {
      create: jest.fn(),
      update: jest.fn(),
    },
    personalQuestion: { createMany: jest.fn() },
  };
  const auth = { me: jest.fn() };
  const service = new PersonalDocsService(
    prisma as unknown as PrismaService,
    auth as unknown as AuthService,
  );
  const file = {
    originalname: 'document.pdf',
    mimetype: 'application/pdf',
    size: 10,
    buffer: Buffer.from('%PDF-test'),
  } as Express.Multer.File;
  const question = `Câu hỏi 1:
Liên quan đúng của tk giữa là:
A. Phương án một
B. Phương án hai
C. Phương án ba
D. Phương án bốn`;

  beforeEach(() => {
    jest.clearAllMocks();
    auth.me.mockResolvedValue({ user: { id: 'owner' } });
    prisma.personalDoc.create.mockResolvedValue({ id: 'doc1' });
    prisma.personalDoc.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'doc1', ...data }),
    );
  });

  it('saves real extracted questions as pending and keeps the original page', async () => {
    mockReadDocument.mockResolvedValue({
      pages: [question + '\nĐáp án: B'],
    });
    const result = await service.upload(file, 'session');
    expect(result.parsed).toBe(1);
    expect(result.doc.status).toBe('ready');
    expect(result.text).toBeNull();
    expect(prisma.personalQuestion.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 'owner',
          docId: 'doc1',
          stem: 'Liên quan đúng của tk giữa là:',
          options: {
            A: 'Phương án một',
            B: 'Phương án hai',
            C: 'Phương án ba',
            D: 'Phương án bốn',
          },
          answer: 'B',
          answers: ['B'],
          number: 1,
          sequence: 0,
          context: null,
          images: [],
          explanationImages: [],
          reviewNote: null,
          explanation: null,
          page: 1,
        },
      ],
    });
  });

  it('retains layout images, multiple keys and unkeyed questions for private review', async () => {
    const image = 'data:image/webp;base64,UklGRg==';
    const common = {
      number: 1,
      stem: 'Câu hỏi gốc đủ rõ để duyệt',
      options: { A: 'Một', B: 'Hai', C: 'Ba' },
      answer: 'A',
      answers: ['A', 'C'],
      explanation: 'Lời giải nguồn',
      page: 2,
      context: null,
      images: [],
      explanationImages: [image],
      reviewNote: null,
    };
    mockReadDocument.mockResolvedValue({
      pages: ['Văn bản nguồn đủ dài để đọc và kiểm tra trắc nghiệm'],
      questions: [
        common,
        {
          ...common,
          number: 2,
          answer: '',
          answers: [],
          reviewNote: 'Chưa có khóa đáp án đọc được trong nguồn.',
        },
      ],
    });
    const result = await service.upload(file, 'session');
    expect(result.parsed).toBe(2);
    expect(result.missingAnswer).toBe(1);
    expect(prisma.personalQuestion.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'owner',
          answers: ['A', 'C'],
          explanationImages: [image],
          sequence: 0,
        }),
        expect.objectContaining({
          userId: 'owner',
          answers: [],
          answer: '',
          sequence: 1,
        }),
      ],
    });
  });

  it('explains missing coloured keys without saving invented answers', async () => {
    mockReadDocument.mockResolvedValue({ pages: [question] });
    const result = await service.upload(file, 'session');
    expect(result.doc.status).toBe('failed');
    expect(result.doc.note).toContain('Nhận ra 1 câu');
    expect(result.doc.note).toContain('khoanh tròn');
    expect(result.missingAnswer).toBe(1);
    expect(prisma.personalQuestion.createMany).not.toHaveBeenCalled();
  });

  it('reports an image-only PDF and does not offer AI unreadable empty text', async () => {
    mockReadDocument.mockResolvedValue({ pages: ['', ''] });
    const result = await service.upload(file, 'session');
    expect(result.doc.status).toBe('failed');
    expect(result.doc.note).toContain('OCR');
    expect(result.text).toBeNull();
    expect(prisma.personalQuestion.createMany).not.toHaveBeenCalled();
  });
});
