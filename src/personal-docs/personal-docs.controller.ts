import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PersonalDocsService } from './personal-docs.service';
import { EditQuestionDto } from './dto/edit-question.dto';
import { AiQuestionsDto } from './dto/ai-questions.dto';

@ApiTags('personal-docs')
@ApiBearerAuth()
@Controller('personal-docs')
export class PersonalDocsController {
  constructor(private readonly service: PersonalDocsService) {}

  private token(value?: string) {
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }

  @Post()
  @ApiOperation({
    summary:
      'Tải PDF lên, bóc câu hỏi (tệp gốc KHÔNG được lưu lại trên máy chủ)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  // Lưu trong BỘ NHỚ, không ghi ra đĩa: bóc xong là mất, đúng với lời hứa
  // riêng tư trên giao diện.
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: PersonalDocsService.MAX_BYTES, files: 1 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.upload(file, this.token(auth));
  }

  @Post(':id/ai-questions')
  @ApiOperation({
    summary:
      'Nhận câu do AI đọc hộ khi bộ luật không bóc được (vẫn vào trạng thái chờ duyệt)',
  })
  addAiQuestions(
    @Param('id') id: string,
    @Body() dto: AiQuestionsDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.addAiQuestions(id, dto, this.token(auth));
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tài liệu cá nhân' })
  list(@Headers('authorization') auth?: string) {
    return this.service.listDocs(this.token(auth));
  }

  @Get('bank')
  @ApiOperation({ summary: 'Ngân hàng đề cá nhân — chỉ câu đã duyệt' })
  bank(@Headers('authorization') auth?: string) {
    return this.service.bank(this.token(auth));
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Các câu bóc được từ một tài liệu, để duyệt' })
  questions(@Param('id') id: string, @Headers('authorization') auth?: string) {
    return this.service.questions(id, this.token(auth));
  }

  @Post(':id/approve-all')
  @ApiOperation({ summary: 'Duyệt hàng loạt các câu hợp lệ của một tài liệu' })
  approveAll(@Param('id') id: string, @Headers('authorization') auth?: string) {
    return this.service.approveAll(id, this.token(auth));
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Sửa hoặc duyệt một câu' })
  edit(
    @Param('id') id: string,
    @Body() dto: EditQuestionDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.editQuestion(id, dto, this.token(auth));
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Xoá một câu' })
  removeQuestion(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.deleteQuestion(id, this.token(auth));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá tài liệu và toàn bộ câu của nó' })
  removeDoc(@Param('id') id: string, @Headers('authorization') auth?: string) {
    return this.service.deleteDoc(id, this.token(auth));
  }
}
