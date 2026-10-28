import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Param,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { MobileLearningService } from './mobile-learning.service';
import { MobileChatDto, SourceAttemptDto } from './mobile-learning.dto';
const bearer = (value?: string) =>
  value?.startsWith('Bearer ') ? value.slice(7) : undefined;
@Controller('mobile')
export class MobileLearningController {
  constructor(private readonly learning: MobileLearningService) {}
  @Get('sources')
  @Header('Cache-Control', 'private, no-store')
  sources(@Headers('authorization') auth?: string) {
    return this.learning.sources(bearer(auth));
  }
  @Get('sources/:id')
  @Header('Cache-Control', 'private, no-store')
  bank(@Param('id') id: string, @Headers('authorization') auth?: string) {
    return this.learning.bank(id, bearer(auth));
  }
  @Get('source-images/:key')
  @Header('Cache-Control', 'public, max-age=86400')
  @Header('X-Content-Type-Options', 'nosniff')
  image(@Param('key') key: string) {
    return new StreamableFile(this.learning.image(key), { type: 'image/webp' });
  }
  @Post('source-attempts')
  @Header('Cache-Control', 'private, no-store')
  submit(
    @Body() dto: SourceAttemptDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.learning.submit(dto, bearer(auth));
  }
  @Post('assistant')
  @Header('Cache-Control', 'private, no-store')
  chat(@Body() dto: MobileChatDto, @Headers('authorization') auth?: string) {
    return this.learning.chat(dto, bearer(auth));
  }
}
