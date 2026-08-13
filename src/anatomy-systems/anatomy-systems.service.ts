import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnatomySystemDto } from './dto/create-anatomy-system.dto';
import { UpdateAnatomySystemDto } from './dto/update-anatomy-system.dto';

@Injectable()
export class AnatomySystemsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveSpeciesId(speciesCode: string) {
    const species = await this.prisma.species.findUnique({
      where: { code: speciesCode },
    });
    if (!species)
      throw new NotFoundException(`Species "${speciesCode}" không tồn tại`);
    return species.id;
  }

  async create(dto: CreateAnatomySystemDto) {
    const exists = await this.prisma.anatomySystem.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`Anatomy system "${dto.code}" đã tồn tại`);
    const { speciesCode, ...rest } = dto;
    const speciesId = await this.resolveSpeciesId(speciesCode);
    return this.prisma.anatomySystem.create({ data: { ...rest, speciesId } });
  }

  findAll(speciesCode?: string) {
    return this.prisma.anatomySystem.findMany({
      where: speciesCode ? { species: { code: speciesCode } } : undefined,
      orderBy: { order: 'asc' },
      include: { _count: { select: { structures: true } } },
    });
  }

  async findOne(code: string) {
    const system = await this.prisma.anatomySystem.findUnique({
      where: { code },
      include: { structures: { orderBy: { nameVi: 'asc' } }, species: true },
    });
    if (!system)
      throw new NotFoundException(`Anatomy system "${code}" không tồn tại`);
    return system;
  }

  async update(code: string, dto: UpdateAnatomySystemDto) {
    await this.findOne(code);
    const { speciesCode, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (speciesCode) data.speciesId = await this.resolveSpeciesId(speciesCode);
    return this.prisma.anatomySystem.update({ where: { code }, data });
  }

  async remove(code: string) {
    await this.findOne(code);
    await this.prisma.anatomySystem.delete({ where: { code } });
    return { deleted: true, code };
  }
}
