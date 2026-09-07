import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MinRole } from '../auth/roles.decorator';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @MinRole(UserRole.editor)
  @Post()
  @ApiOperation({ summary: 'Tạo câu hỏi trắc nghiệm (kèm đáp án)' })
  create(@Body() dto: CreateQuizDto) {
    return this.quizzesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách câu hỏi (lọc theo hệ)' })
  @ApiQuery({
    name: 'system',
    required: false,
    description: 'Lọc theo mã hệ cơ quan',
  })
  findAll(@Query('system') system?: string) {
    return this.quizzesService.findAll(system);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết 1 câu hỏi' })
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @MinRole(UserRole.admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xoá câu hỏi' })
  remove(@Param('id') id: string) {
    return this.quizzesService.remove(id);
  }
}
