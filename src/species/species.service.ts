import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';

@Injectable()
export class SpeciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSpeciesDto) {
    const exists = await this.prisma.species.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`Species code "${dto.code}" đã tồn tại`);
    return this.prisma.species.create({ data: dto });
  }

  findAll() {
    return this.prisma.species.findMany({ orderBy: { code: 'asc' } });
  }

  async findOne(code: string) {
    const species = await this.prisma.species.findUnique({
      where: { code },
      include: { _count: { select: { systems: true, structures: true } } },
    });
    if (!species) throw new NotFoundException(`Species "${code}" không tồn tại`);
    return species;
  }

  async update(code: string, dto: UpdateSpeciesDto) {
    await this.findOne(code);
    return this.prisma.species.update({ where: { code }, data: dto });
  }

  async remove(code: string) {
    await this.findOne(code);
    await this.prisma.species.delete({ where: { code } });
    return { deleted: true, code };
  }
}
