import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';

@Injectable()
export class PathologiesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveStructureId(structureCode: string) {
    const structure = await this.prisma.structure.findUnique({
      where: { code: structureCode },
    });
    if (!structure)
      throw new NotFoundException(`Structure "${structureCode}" không tồn tại`);
    return structure.id;
  }

  async create(dto: CreatePathologyDto) {
    const { structureCode, ...rest } = dto;
    const structureId = structureCode
      ? await this.resolveStructureId(structureCode)
      : null;
    return this.prisma.pathology.create({ data: { ...rest, structureId } });
  }

  findAll(structureCode?: string) {
    return this.prisma.pathology.findMany({
      where: structureCode
        ? {
            structure: {
              OR: [{ code: structureCode }, { meshName: structureCode }],
            },
          }
        : undefined,
      include: {
        structure: {
          select: {
            code: true,
            meshName: true,
            nameVi: true,
            nameEn: true,
            nameZh: true,
            latin: true,
            system: {
              select: { code: true, nameVi: true, nameEn: true, nameZh: true },
            },
          },
        },
        content: true,
        citations: {
          include: { source: true },
          orderBy: { source: { year: 'desc' } },
        },
      },
      // Gom theo hệ lâm sàng trước, trong mỗi hệ xếp theo tên — khớp cách chỉ
      // mục hiển thị ngoài giao diện.
      orderBy: [{ clinicalSystem: 'asc' }, { nameVi: 'asc' }],
    });
  }

  async findOne(id: string) {
    const pathology = await this.prisma.pathology.findUnique({
      where: { id },
      // `content` BẮT BUỘC có: panel trong /viewer lấy bệnh qua endpoint này,
      // thiếu nó là panel báo "chưa có nội dung" dù dữ liệu đã có trong DB.
      include: {
        structure: true,
        content: true,
        citations: { include: { source: true } },
      },
    });
    if (!pathology)
      throw new NotFoundException(`Pathology "${id}" không tồn tại`);
    return pathology;
  }

  async update(id: string, dto: UpdatePathologyDto) {
    await this.findOne(id);
    const { structureCode, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (structureCode)
      data.structureId = await this.resolveStructureId(structureCode);
    return this.prisma.pathology.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.pathology.delete({ where: { id } });
    return { deleted: true, id };
  }
}
