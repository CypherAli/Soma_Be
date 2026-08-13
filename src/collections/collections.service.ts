import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCollectionDto) {
    return this.prisma.collection.create({ data: dto });
  }

  findAll() {
    return this.prisma.collection.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });
    if (!collection)
      throw new NotFoundException(`Collection "${id}" không tồn tại`);
    return collection;
  }

  async update(id: string, dto: UpdateCollectionDto) {
    await this.findOne(id);
    return this.prisma.collection.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.collection.delete({ where: { id } });
    return { deleted: true, id };
  }
}
