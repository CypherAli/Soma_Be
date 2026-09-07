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
import { CurrentUser } from '../auth/current-user.decorator';
import { MinRole } from '../auth/roles.decorator';
import type { AuthUser } from '../auth/roles';
import { AnatomyAdminService } from './anatomy.service';
import {
  LinkStructureDto,
  UpdateQuizDto,
  UpdateQuizOptionDto,
  AdminUpdateSpeciesDto,
  AdminUpdateStructureDto,
  UpdateSystemDto,
} from './dto/admin.dto';

/**
 * Khu quản trị dữ liệu giải phẫu và trắc nghiệm.
 *
 * Cùng tiền tố `/admin` và cùng mặc định `@MinRole(editor)` ở cấp controller như
 * `AdminController`, chỉ tách tệp cho dễ đọc. Không có endpoint TẠO MỚI và
 * không có XOÁ: loài, hệ và cấu trúc đến từ dữ liệu nguồn (seed + Z-Anatomy) và
 * phải khớp với model 3D thật; thêm một cấu trúc bằng tay ở đây là tạo ra một
 * bản ghi không có mesh nào tương ứng, tức là một mục chọn mãi không hiện gì.
 */
@ApiTags('admin')
@MinRole(UserRole.editor)
@Controller('admin')
export class AnatomyAdminController {
  constructor(private readonly anatomy: AnatomyAdminService) {}

  // ------------------------------------------------------------------- loài

  @Get('species')
  @ApiOperation({ summary: 'Loài, kèm số hệ và số cấu trúc của từng loài' })
  species() {
    return this.anatomy.species();
  }

  @Patch('species/:id')
  @ApiOperation({ summary: 'Sửa tên ba ngôn ngữ và tên Latin của một loài' })
  updateSpecies(
    @Param('id') id: string,
    @Body() dto: AdminUpdateSpeciesDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.updateSpecies(actor, id, dto);
  }

  // -------------------------------------------------------------- hệ cơ quan

  @Get('systems')
  @ApiOperation({ summary: 'Hệ cơ quan, kèm số cấu trúc và số câu hỏi' })
  @ApiQuery({ name: 'speciesId', required: false })
  @ApiQuery({ name: 'q', required: false })
  systems(@Query('speciesId') speciesId?: string, @Query('q') q?: string) {
    return this.anatomy.systems({ speciesId, q });
  }

  @Patch('systems/:id')
  @ApiOperation({ summary: 'Sửa tên và thứ tự hiển thị của một hệ cơ quan' })
  updateSystem(
    @Param('id') id: string,
    @Body() dto: UpdateSystemDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.updateSystem(actor, id, dto);
  }

  // ---------------------------------------------------------------- cấu trúc

  @Get('structures')
  @ApiOperation({ summary: 'Cấu trúc giải phẫu, tìm và lọc được' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'systemId', required: false })
  @ApiQuery({ name: 'speciesId', required: false })
  @ApiQuery({
    name: 'missingDescription',
    required: false,
    description: 'Chỉ lấy cấu trúc CHƯA có mô tả ở ngôn ngữ này (vi | en | zh)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  structures(
    @Query('q') q?: string,
    @Query('systemId') systemId?: string,
    @Query('speciesId') speciesId?: string,
    @Query('missingDescription') missingDescription?: string,
    @Query('page') page?: number,
  ) {
    return this.anatomy.structures({
      q,
      systemId,
      speciesId,
      missingDescription,
      page,
    });
  }

  @Patch('structures/:id')
  @ApiOperation({
    summary: 'Sửa tên, tên Latin, mã TA và mô tả ba ngôn ngữ của một cấu trúc',
  })
  updateStructure(
    @Param('id') id: string,
    @Body() dto: AdminUpdateStructureDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.updateStructure(actor, id, dto);
  }

  @Patch('pathologies/:id/structure')
  @ApiOperation({
    summary: 'Neo bệnh lý vào cấu trúc 3D theo mã cấu trúc, hoặc bỏ neo',
  })
  linkStructure(
    @Param('id') id: string,
    @Body() dto: LinkStructureDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.linkPathologyStructure(actor, id, dto);
  }

  @Post('pathologies/:id/related-structures')
  @ApiOperation({
    summary:
      'Thêm cấu trúc PHỤ mà bệnh còn ảnh hưởng tới (bệnh đa cơ quan), theo mã cấu trúc',
  })
  addRelated(
    @Param('id') id: string,
    @Body() dto: LinkStructureDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.addRelatedStructure(actor, id, dto.structureCode ?? '');
  }

  @Delete('pathologies/:id/related-structures/:structureId')
  @ApiOperation({ summary: 'Bỏ một cấu trúc phụ khỏi bệnh lý' })
  removeRelated(
    @Param('id') id: string,
    @Param('structureId') structureId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.removeRelatedStructure(actor, id, structureId);
  }

  // -------------------------------------------------------------- trắc nghiệm

  @Get('quizzes')
  @ApiOperation({ summary: 'Câu hỏi trắc nghiệm trong cơ sở dữ liệu' })
  @ApiQuery({ name: 'systemId', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  quizzes(
    @Query('systemId') systemId?: string,
    @Query('q') q?: string,
    @Query('page') page?: number,
  ) {
    return this.anatomy.quizzes({ systemId, q, page });
  }

  @Patch('quizzes/:id')
  @ApiOperation({ summary: 'Sửa đề bài, giải thích và nguồn của một câu hỏi' })
  updateQuiz(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.updateQuiz(actor, id, dto);
  }

  @Patch('quiz-options/:id')
  @ApiOperation({
    summary:
      'Sửa một phương án. Đặt đúng cho phương án này sẽ tự bỏ đúng ở các phương án còn lại.',
  })
  updateQuizOption(
    @Param('id') id: string,
    @Body() dto: UpdateQuizOptionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.anatomy.updateQuizOption(actor, id, dto);
  }
}
