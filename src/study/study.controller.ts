import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { StudyService } from './study.service';
import { RecordAttemptDto } from './dto/record-attempt.dto';
import { SavePathDto } from './dto/save-path.dto';

@ApiTags('study')
@ApiBearerAuth()
@Controller('study')
export class StudyController {
  constructor(private readonly service: StudyService) {}

  private token(value?: string) {
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }

  @Post('attempts')
  @ApiOperation({
    summary: 'Ghi một lượt làm bài đã nộp và cập nhật lịch ôn cho từng câu',
  })
  record(
    @Body() dto: RecordAttemptDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.recordAttempt(dto, this.token(auth));
  }

  @Get('history')
  @ApiOperation({
    summary: 'Lịch sử làm bài, tỷ lệ đúng theo phạm vi, chuỗi ngày học',
  })
  history(@Headers('authorization') auth?: string) {
    return this.service.history(this.token(auth));
  }

  @Get('path')
  @ApiOperation({ summary: 'Lộ trình đang hoạt động kèm buổi học hôm nay' })
  getPath(@Headers('authorization') auth?: string) {
    return this.service.getPath(this.token(auth));
  }

  @Put('path')
  @ApiOperation({
    summary: 'Tạo hoặc cập nhật lộ trình (mỗi tài khoản một lộ trình)',
  })
  savePath(@Body() dto: SavePathDto, @Headers('authorization') auth?: string) {
    return this.service.savePath(dto, this.token(auth));
  }

  @Get('path/expand')
  @ApiOperation({
    summary: 'Bung một khối dàn bài xuống tầng mịn hơn (tháng→tuần, tuần→ngày)',
  })
  @ApiQuery({ name: 'block', description: 'số thứ tự khối, bắt đầu từ 1' })
  expandPath(
    @Query('block') block: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.expandPath(Number(block) || 1, this.token(auth));
  }

  @Delete('path')
  @ApiOperation({ summary: 'Xoá lộ trình' })
  deletePath(@Headers('authorization') auth?: string) {
    return this.service.deletePath(this.token(auth));
  }

  @Get('due')
  @ApiOperation({ summary: 'Các câu đã đến hạn ôn' })
  @ApiQuery({ name: 'limit', required: false })
  due(@Headers('authorization') auth?: string, @Query('limit') limit?: number) {
    return this.service.due(this.token(auth), Number(limit) || 60);
  }
}
