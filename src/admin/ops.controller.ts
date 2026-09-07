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
import { CurrentUser } from '../auth/current-user.decorator';
import { MinRole } from '../auth/roles.decorator';
import type { AuthUser } from '../auth/roles';
import { OpsService } from './ops.service';
import { QueuesService } from './queues.service';
import { BulkFlagDto } from './dto/admin.dto';

/**
 * Vận hành và các hàng đợi công việc.
 *
 * Cùng tiền tố `/admin`, cùng mặc định `@MinRole(editor)` ở cấp controller.
 * Những khu chạm vào dữ liệu người dùng (tài liệu cá nhân, phiên đăng nhập) thì
 * khai đè lên `admin` — đè về phía CHẶT hơn, quên cũng không thành lỗ hổng.
 */
@ApiTags('admin')
@MinRole(UserRole.editor)
@Controller('admin')
export class OpsController {
  constructor(
    private readonly ops: OpsService,
    private readonly queues: QueuesService,
  ) {}

  // ------------------------------------------------------------- vận hành

  @Get('system')
  @ApiOperation({
    summary:
      'Tình trạng hệ thống: cơ sở dữ liệu, chỉ số tri thức y khoa, thời gian chạy',
  })
  system() {
    return this.ops.system();
  }

  @MinRole(UserRole.admin)
  @Get('learning')
  @ApiOperation({
    summary: 'Hoạt động học tập TỔNG HỢP — không có hồ sơ của từng người',
  })
  learning() {
    return this.ops.learning();
  }

  @MinRole(UserRole.admin)
  @Get('personal-docs')
  @ApiOperation({
    summary:
      'Tài liệu cá nhân: CHỈ phần kê khai (tên tệp, số trang, trạng thái bóc). Không trả nội dung.',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  personalDocs(@Query('status') status?: string, @Query('page') page?: number) {
    return this.ops.personalDocs({ status, page });
  }

  @MinRole(UserRole.admin)
  @Get('sessions')
  @ApiOperation({ summary: 'Phiên đăng nhập còn hiệu lực' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  sessions(@Query('page') page?: number) {
    return this.ops.sessions({ page });
  }

  @MinRole(UserRole.admin)
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Thu hồi một phiên đăng nhập' })
  revokeSession(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.ops.revokeSession(actor, id);
  }

  // ---------------------------------------------------- hàng chờ duyệt

  @Get('review-queue')
  @ApiOperation({ summary: 'Bệnh lý đang chờ người chuyên môn duyệt' })
  @ApiQuery({ name: 'clinicalSystem', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  reviewQueue(
    @Query('clinicalSystem') clinicalSystem?: string,
    @Query('q') q?: string,
    @Query('page') page?: number,
  ) {
    return this.queues.reviewQueue({ clinicalSystem, q, page });
  }

  @MinRole(UserRole.admin)
  @Post('review-queue/bulk')
  @ApiOperation({
    summary:
      'Duyệt hoặc trả về hàng chờ nhiều bài một lượt (tối đa 50). value: true = ĐÃ DUYỆT, cùng chiều với endpoint trích dẫn.',
  })
  bulkReview(@Body() dto: BulkFlagDto, @CurrentUser() actor: AuthUser) {
    return this.queues.bulkReview(actor, dto.ids, dto.value);
  }

  // ------------------------------------------------------- trích dẫn

  @Get('citations')
  @ApiOperation({ summary: 'Toàn bộ trích dẫn, lọc theo trạng thái đối chiếu' })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'sourceId', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  citations(
    @Query('verified') verified?: boolean,
    @Query('sourceId') sourceId?: string,
    @Query('q') q?: string,
    @Query('page') page?: number,
  ) {
    return this.queues.citations({ verified, sourceId, q, page });
  }

  @MinRole(UserRole.admin)
  @Post('citations/bulk')
  @ApiOperation({
    summary: 'Đánh dấu đã/chưa đối chiếu nhiều trích dẫn một lượt (tối đa 50)',
  })
  bulkVerify(@Body() dto: BulkFlagDto, @CurrentUser() actor: AuthUser) {
    return this.queues.bulkVerifyCitations(actor, dto.ids, dto.value);
  }

  // --------------------------------------------------------- bản dịch

  @Get('translations')
  @ApiOperation({
    summary: 'Hàng đợi dịch: bản đích đặt cạnh bản gốc tiếng Việt',
  })
  @ApiQuery({ name: 'locale', required: true, description: 'en | zh' })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'missing | machine | reviewed',
  })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  translations(
    @Query('locale') locale: string,
    @Query('state') state?: 'missing' | 'machine' | 'reviewed',
    @Query('q') q?: string,
    @Query('page') page?: number,
  ) {
    return this.queues.translations({ locale, state, q, page });
  }
}
