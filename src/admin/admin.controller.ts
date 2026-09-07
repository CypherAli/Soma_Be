import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { MinRole } from '../auth/roles.decorator';
import type { AuthUser } from '../auth/roles';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import {
  CreateCitationDto,
  SetDisabledDto,
  UpdatePathologyMetaDto,
  UpdateRoleDto,
  UpdateSourceDto,
  UpsertContentDto,
} from './dto/admin.dto';

/**
 * Back office.
 *
 * `@MinRole` đặt ở CẤP CONTROLLER: mặc định của cả khu này là "phải là editor
 * trở lên", nên một endpoint mới thêm vào sau sẽ được khoá sẵn thay vì mở sẵn.
 * Endpoint nào cần quyền cao hơn thì tự khai đè — đè lên phía chặt hơn thì
 * quên cũng không thành lỗ hổng.
 */
@ApiTags('admin')
@MinRole(UserRole.editor)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Số liệu bảng điều khiển, kèm phần dữ liệu còn hổng',
  })
  overview() {
    return this.admin.overview();
  }

  // -------------------------------------------------------------- người dùng

  @MinRole(UserRole.admin)
  @Get('users')
  @ApiOperation({ summary: 'Danh sách tài khoản' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  users(@Query('q') q?: string, @Query('page') page?: number) {
    return this.admin.users({ q, page });
  }

  @MinRole(UserRole.super_admin)
  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Đổi vai của một tài khoản (chỉ super admin)' })
  setRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.setRole(actor, id, dto.role);
  }

  @MinRole(UserRole.admin)
  @Patch('users/:id/disabled')
  @ApiOperation({
    summary:
      'Khoá hoặc mở khoá tài khoản. Khoá sẽ cắt luôn mọi phiên đang đăng nhập.',
  })
  setDisabled(
    @Param('id') id: string,
    @Body() dto: SetDisabledDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.setDisabled(actor, id, dto.disabled);
  }

  // ----------------------------------------------------------------- bệnh lý

  @Get('pathologies')
  @ApiOperation({ summary: 'Bệnh lý kèm chỗ còn thiếu của từng bài' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'clinicalSystem', required: false })
  @ApiQuery({ name: 'needsReview', required: false, type: Boolean })
  @ApiQuery({
    name: 'missingLocale',
    required: false,
    description: 'Chỉ lấy bệnh CHƯA có nội dung ở ngôn ngữ này (vi | en | zh)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  pathologies(
    @Query('q') q?: string,
    @Query('clinicalSystem') clinicalSystem?: string,
    @Query('needsReview') needsReview?: boolean,
    @Query('missingLocale') missingLocale?: string,
    @Query('page') page?: number,
  ) {
    return this.admin.pathologies({
      q,
      clinicalSystem,
      needsReview,
      missingLocale,
      page,
    });
  }

  @Get('clinical-systems')
  @ApiOperation({ summary: 'Hệ lâm sàng đang có, để đổ vào bộ lọc' })
  clinicalSystems() {
    return this.admin.clinicalSystems();
  }

  @Get('pathologies/:id')
  @ApiOperation({ summary: 'Một bệnh lý: nội dung 3 ngôn ngữ + trích dẫn' })
  pathology(@Param('id') id: string) {
    return this.admin.pathology(id);
  }

  @Patch('pathologies/:id')
  @ApiOperation({
    summary:
      'Sửa trường của bản ghi bệnh lý (tên, ICD, mức độ, hệ lâm sàng, nguồn)',
  })
  updatePathology(
    @Param('id') id: string,
    @Body() dto: UpdatePathologyMetaDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.updatePathology(actor, id, dto);
  }

  @Put('pathologies/:id/content/:locale')
  @ApiOperation({ summary: 'Soạn nội dung bệnh lý cho một ngôn ngữ' })
  upsertContent(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body() dto: UpsertContentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.upsertContent(actor, id, locale, dto);
  }

  @MinRole(UserRole.admin)
  @Patch('pathologies/:id/reviewed')
  @ApiOperation({
    summary:
      'Đánh dấu đã có người chuyên môn duyệt (tắt cờ needsReview) hoặc trả về hàng chờ',
  })
  setReviewed(
    @Param('id') id: string,
    @Body() body: { needsReview: boolean },
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.setReviewed(actor, id, body.needsReview);
  }

  // --------------------------------------------------------------- trích dẫn

  @Post('pathologies/:id/citations')
  @ApiOperation({ summary: 'Thêm trích dẫn cho một bệnh lý' })
  addCitation(
    @Param('id') id: string,
    @Body() dto: CreateCitationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.addCitation(actor, id, dto);
  }

  @MinRole(UserRole.admin)
  @Patch('citations/:id/verified')
  @ApiOperation({ summary: 'Xác nhận đã đối chiếu trích dẫn với tài liệu gốc' })
  verifyCitation(
    @Param('id') id: string,
    @Body() body: { verified: boolean },
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.verifyCitation(actor, id, body.verified);
  }

  @MinRole(UserRole.admin)
  @Delete('citations/:id')
  @ApiOperation({ summary: 'Xoá một trích dẫn' })
  removeCitation(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.admin.removeCitation(actor, id);
  }

  // ------------------------------------------------------------------- nguồn

  @Get('sources')
  @ApiOperation({ summary: 'Danh mục tài liệu y khoa và số bệnh đang dựa vào' })
  sources() {
    return this.admin.sources();
  }

  @Patch('sources/:id')
  @ApiOperation({ summary: 'Sửa thông tin một tài liệu' })
  updateSource(
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.updateSource(actor, id, dto);
  }

  // ----------------------------------------------------------------- nhật ký

  @MinRole(UserRole.admin)
  @Get('audit')
  @ApiOperation({ summary: 'Nhật ký thao tác quản trị' })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'actorEmail', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  auditLog(
    @Query('entity') entity?: string,
    @Query('actorEmail') actorEmail?: string,
    @Query('page') page?: number,
  ) {
    return this.audit.list({ entity, actorEmail, page });
  }
}
