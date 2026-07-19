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
import { AnatomySystemsService } from './anatomy-systems.service';
import { CreateAnatomySystemDto } from './dto/create-anatomy-system.dto';
import { UpdateAnatomySystemDto } from './dto/update-anatomy-system.dto';

@ApiTags('anatomy-systems')
@Controller('anatomy-systems')
export class AnatomySystemsController {
  constructor(private readonly anatomySystemsService: AnatomySystemsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hệ cơ quan mới' })
  create(@Body() dto: CreateAnatomySystemDto) {
    return this.anatomySystemsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách hệ cơ quan (kèm số cấu trúc)' })
  @ApiQuery({ name: 'species', required: false, description: 'Lọc theo mã loài' })
  findAll(@Query('species') species?: string) {
    return this.anatomySystemsService.findAll(species);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Chi tiết 1 hệ (kèm danh sách cấu trúc)' })
  findOne(@Param('code') code: string) {
    return this.anatomySystemsService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Cập nhật 1 hệ' })
  update(@Param('code') code: string, @Body() dto: UpdateAnatomySystemDto) {
    return this.anatomySystemsService.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Xoá 1 hệ' })
  remove(@Param('code') code: string) {
    return this.anatomySystemsService.remove(code);
  }
}
