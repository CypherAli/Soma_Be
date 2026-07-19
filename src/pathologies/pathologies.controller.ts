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
import { PathologiesService } from './pathologies.service';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';

@ApiTags('pathologies')
@Controller('pathologies')
export class PathologiesController {
  constructor(private readonly pathologiesService: PathologiesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bệnh lý mới (bắt buộc có nguồn)' })
  create(@Body() dto: CreatePathologyDto) {
    return this.pathologiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách bệnh lý' })
  @ApiQuery({ name: 'structure', required: false, description: 'Lọc theo mã cấu trúc' })
  findAll(@Query('structure') structure?: string) {
    return this.pathologiesService.findAll(structure);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết 1 bệnh lý' })
  findOne(@Param('id') id: string) {
    return this.pathologiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bệnh lý' })
  update(@Param('id') id: string, @Body() dto: UpdatePathologyDto) {
    return this.pathologiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá bệnh lý' })
  remove(@Param('id') id: string) {
    return this.pathologiesService.remove(id);
  }
}
