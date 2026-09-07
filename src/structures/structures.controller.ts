import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MinRole } from '../auth/roles.decorator';
import { StructuresService } from './structures.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

@ApiTags('structures')
@Controller('structures')
export class StructuresController {
  constructor(private readonly structuresService: StructuresService) {}

  @MinRole(UserRole.editor)
  @Post()
  @ApiOperation({ summary: 'Tạo cấu trúc giải phẫu mới' })
  create(@Body() dto: CreateStructureDto) {
    return this.structuresService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách cấu trúc (lọc theo hệ/loài/từ khoá)' })
  @ApiQuery({
    name: 'system',
    required: false,
    description: 'Lọc theo mã hệ cơ quan',
  })
  @ApiQuery({
    name: 'species',
    required: false,
    description: 'Lọc theo mã loài',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Tìm theo tên VI/EN/Latin',
  })
  findAll(
    @Query('system') system?: string,
    @Query('species') species?: string,
    @Query('q') q?: string,
  ) {
    return this.structuresService.findAll({ system, species, q });
  }

  @Get(':code')
  @ApiOperation({ summary: 'Chi tiết cấu trúc (kèm bệnh lý, cha/con)' })
  findOne(@Param('code') code: string) {
    return this.structuresService.findOne(code);
  }

  @MinRole(UserRole.editor)
  @Patch(':code')
  @ApiOperation({ summary: 'Cập nhật cấu trúc' })
  update(@Param('code') code: string, @Body() dto: UpdateStructureDto) {
    return this.structuresService.update(code, dto);
  }

  @MinRole(UserRole.admin)
  @Delete(':code')
  @ApiOperation({ summary: 'Xoá cấu trúc' })
  remove(@Param('code') code: string) {
    return this.structuresService.remove(code);
  }
}
