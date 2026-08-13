import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

@Injectable()
export class StructuresService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveRefs(dto: Partial<CreateStructureDto>) {
    const data: Record<string, unknown> = {};
    if (dto.systemCode) {
      const system = await this.prisma.anatomySystem.findUnique({
        where: { code: dto.systemCode },
      });
      if (!system)
        throw new NotFoundException(
          `Anatomy system "${dto.systemCode}" không tồn tại`,
        );
      data.systemId = system.id;
    }
    if (dto.speciesCode) {
      const species = await this.prisma.species.findUnique({
        where: { code: dto.speciesCode },
      });
      if (!species)
        throw new NotFoundException(
          `Species "${dto.speciesCode}" không tồn tại`,
        );
      data.speciesId = species.id;
    }
    if (dto.parentCode !== undefined) {
      if (dto.parentCode === null || dto.parentCode === '') {
        data.parentId = null;
      } else {
        const parent = await this.prisma.structure.findUnique({
          where: { code: dto.parentCode },
        });
        if (!parent)
          throw new NotFoundException(
            `Structure cha "${dto.parentCode}" không tồn tại`,
          );
        data.parentId = parent.id;
      }
    }
    return data;
  }

  async create(dto: CreateStructureDto) {
    const exists = await this.prisma.structure.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`Structure "${dto.code}" đã tồn tại`);
    const { systemCode, speciesCode, parentCode, ...rest } = dto;
    const refs = await this.resolveRefs({
      systemCode,
      speciesCode,
      parentCode,
    });
    return this.prisma.structure.create({
      data: { ...rest, ...(refs as object) } as never,
    });
  }

  findAll(params: { system?: string; species?: string; q?: string }) {
    const { system, species, q } = params;
    return this.prisma.structure.findMany({
      where: {
        system: system ? { code: system } : undefined,
        species: species ? { code: species } : undefined,
        ...(q
          ? {
              OR: [
                { nameVi: { contains: q, mode: 'insensitive' } },
                { nameEn: { contains: q, mode: 'insensitive' } },
                { latin: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { system: true },
      orderBy: { nameVi: 'asc' },
    });
  }

  async findOne(code: string) {
    const structure = await this.prisma.structure.findUnique({
      where: { code },
      include: {
        system: true,
        pathologies: true,
        parent: true,
        children: { orderBy: { nameVi: 'asc' } },
      },
    });
    if (!structure)
      throw new NotFoundException(`Structure "${code}" không tồn tại`);
    return structure;
  }

  async update(code: string, dto: UpdateStructureDto) {
    await this.findOne(code);
    const { systemCode, speciesCode, parentCode, ...rest } = dto;
    const refs = await this.resolveRefs({
      systemCode,
      speciesCode,
      parentCode,
    });
    return this.prisma.structure.update({
      where: { code },
      data: { ...rest, ...(refs as object) } as never,
    });
  }

  async remove(code: string) {
    await this.findOne(code);
    await this.prisma.structure.delete({ where: { code } });
    return { deleted: true, code };
  }
}
