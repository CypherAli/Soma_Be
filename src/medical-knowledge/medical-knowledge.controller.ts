import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MedicalKnowledgeService } from './medical-knowledge.service';

@ApiTags('medical-knowledge')
@Controller('medical-knowledge')
export class MedicalKnowledgeController {
  constructor(private readonly service: MedicalKnowledgeService) {}

  @Get('sources')
  @ApiOperation({ summary: 'Danh mục tài liệu y khoa' })
  sources() {
    return this.service.sources();
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm đoạn tài liệu kèm nguồn và số trang' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false })
  search(@Query('q') q = '', @Query('limit') limit = '10') {
    return this.service.search(
      q,
      Math.min(30, Math.max(1, Number(limit) || 10)),
    );
  }
}
