import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveSystemId(systemCode: string) {
    const system = await this.prisma.anatomySystem.findUnique({
      where: { code: systemCode },
    });
    if (!system)
      throw new NotFoundException(
        `Anatomy system "${systemCode}" không tồn tại`,
      );
    return system.id;
  }

  async create(dto: CreateQuizDto) {
    const { systemCode, options, ...rest } = dto;
    const systemId = await this.resolveSystemId(systemCode);
    return this.prisma.quizQuestion.create({
      data: { ...rest, systemId, options: { create: options } },
      include: { options: true },
    });
  }

  findAll(systemCode?: string) {
    return this.prisma.quizQuestion.findMany({
      where: systemCode ? { system: { code: systemCode } } : undefined,
      include: {
        options: true,
        system: { select: { code: true, nameVi: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quizQuestion.findUnique({
      where: { id },
      include: { options: true, system: true },
    });
    if (!quiz) throw new NotFoundException(`Quiz "${id}" không tồn tại`);
    return quiz;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.quizQuestion.delete({ where: { id } });
    return { deleted: true, id };
  }
}
