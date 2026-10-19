import { NotFoundException } from '@nestjs/common';
import { PersonalDocsService } from './personal-docs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('personal document lifecycle', () => {
  const tx = {
    personalQuestion: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    personalDoc: { deleteMany: jest.fn() },
    reviewItem: { deleteMany: jest.fn() },
  };
  const prisma = {
    personalQuestion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    personalDoc: { findFirst: jest.fn() },
    $transaction: jest.fn(
      async (operation: (client: typeof tx) => Promise<unknown>) =>
        operation(tx),
    ),
  };
  const auth = { me: jest.fn() };
  const service = new PersonalDocsService(
    prisma as unknown as PrismaService,
    auth as unknown as AuthService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    auth.me.mockResolvedValue({ user: { id: 'owner' } });
    tx.personalQuestion.deleteMany.mockResolvedValue({ count: 1 });
    tx.personalDoc.deleteMany.mockResolvedValue({ count: 1 });
    tx.personalQuestion.findMany.mockResolvedValue([
      { id: 'q1' },
      { id: 'q2' },
    ]);
    tx.reviewItem.deleteMany.mockResolvedValue({ count: 1 });
    prisma.personalQuestion.findFirst.mockResolvedValue({
      id: 'q1',
      options: { A: 'One', B: 'Two' },
      answer: 'A',
      approved: true,
    });
    prisma.personalDoc.findFirst.mockResolvedValue({ id: 'doc1' });
    tx.personalQuestion.update.mockResolvedValue({ id: 'q1', approved: true });
  });

  it('deletes only the owner question and its personal review queue entry atomically', async () => {
    await expect(service.deleteQuestion('q1', 'session')).resolves.toEqual({
      success: true,
    });
    expect(tx.personalQuestion.deleteMany).toHaveBeenCalledWith({
      where: { id: 'q1', userId: 'owner' },
    });
    expect(tx.reviewItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'owner', source: 'personal', itemKey: 'personal:q1' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('does not delete reviews for a question belonging to someone else', async () => {
    tx.personalQuestion.deleteMany.mockResolvedValue({ count: 0 });
    await expect(
      service.deleteQuestion('other-question', 'session'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.reviewItem.deleteMany).not.toHaveBeenCalled();
  });

  it('deleting a document removes reviews only for its owner-scoped question IDs', async () => {
    await service.deleteDoc('doc1', 'session');
    expect(tx.personalQuestion.findMany).toHaveBeenCalledWith({
      where: { docId: 'doc1', userId: 'owner' },
      select: { id: true },
    });
    expect(tx.personalDoc.deleteMany).toHaveBeenCalledWith({
      where: { id: 'doc1', userId: 'owner' },
    });
    expect(tx.reviewItem.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'owner',
        source: 'personal',
        itemKey: { in: ['personal:q1', 'personal:q2'] },
      },
    });
  });

  it('rejects deleting an unowned document without changing review rows', async () => {
    tx.personalDoc.deleteMany.mockResolvedValue({ count: 0 });
    await expect(
      service.deleteDoc('other-document', 'session'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.reviewItem.deleteMany).not.toHaveBeenCalled();
  });

  it('fails the transaction instead of confirming a partially cleaned deletion', async () => {
    tx.reviewItem.deleteMany.mockRejectedValue(
      new Error('storage unavailable'),
    );
    await expect(service.deleteQuestion('q1', 'session')).rejects.toThrow(
      'storage unavailable',
    );
  });

  it('unapproving a personal question removes it from the due queue', async () => {
    tx.personalQuestion.update.mockResolvedValue({ id: 'q1', approved: false });
    await service.editQuestion('q1', { approved: false }, 'session');
    expect(tx.reviewItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'owner', source: 'personal', itemKey: 'personal:q1' },
    });
  });

  it('editing an approved question preserves its existing review schedule', async () => {
    await service.editQuestion('q1', { stem: 'Corrected wording' }, 'session');
    expect(tx.reviewItem.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses bulk approval of a missing or unowned document', async () => {
    prisma.personalDoc.findFirst.mockResolvedValue(null);
    await expect(
      service.approveAll('foreign-doc', 'session'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.personalDoc.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-doc', userId: 'owner' },
      select: { id: true },
    });
    expect(prisma.personalQuestion.updateMany).not.toHaveBeenCalled();
  });

  it('bulk approval includes only questions with a usable answer', async () => {
    prisma.personalQuestion.findMany.mockResolvedValue([
      { id: 'valid', options: { A: 'One' }, answer: 'A' },
      { id: 'invalid', options: { B: 'Two' }, answer: 'A' },
    ]);
    await expect(service.approveAll('doc1', 'session')).resolves.toEqual({
      approved: 1,
      skipped: 1,
    });
    expect(prisma.personalQuestion.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['valid'] } },
      data: { approved: true },
    });
  });
});
