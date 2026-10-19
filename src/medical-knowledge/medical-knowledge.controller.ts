import { Controller, Get, Param, Query, Res, Header } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MedicalKnowledgeService } from './medical-knowledge.service';
import * as express from 'express';
import { createReadStream } from 'node:fs';
import { SearchMedicalKnowledgeDto } from './dto/search-medical-knowledge.dto';

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
  search(@Query() query: SearchMedicalKnowledgeDto) {
    return this.service.search(query.q, query.limit);
  }

  @Get('pdf/:filename')
  @ApiOperation({ summary: 'Stream một file PDF từ kho tài liệu' })
  @Header('Cache-Control', 'public, max-age=86400')
  async pdf(@Param('filename') filename: string, @Res() res: express.Response) {
    const managed = await this.service.managedPdf(filename);
    const path = managed ? null : this.service.getPdfPath(filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(filename)}"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (managed) res.send(managed);
    else createReadStream(path!).pipe(res);
  }
}
