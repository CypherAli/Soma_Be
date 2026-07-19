import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpeciesService } from './species.service';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';

@ApiTags('species')
@Controller('species')
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo loài mới' })
  create(@Body() dto: CreateSpeciesDto) {
    return this.speciesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tất cả loài' })
  findAll() {
    return this.speciesService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Chi tiết 1 loài theo mã' })
  findOne(@Param('code') code: string) {
    return this.speciesService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Cập nhật 1 loài' })
  update(@Param('code') code: string, @Body() dto: UpdateSpeciesDto) {
    return this.speciesService.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Xoá 1 loài' })
  remove(@Param('code') code: string) {
    return this.speciesService.remove(code);
  }
}
