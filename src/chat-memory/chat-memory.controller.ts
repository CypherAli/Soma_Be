import { Body, Controller, Delete, Get, Headers, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatMemoryService, Turn } from './chat-memory.service';

@ApiTags('chat-memory')
@ApiBearerAuth()
@Controller('chat-memory')
export class ChatMemoryController {
  constructor(private readonly service: ChatMemoryService) {}

  private token(value?: string) {
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }

  @Get()
  get(@Headers('authorization') auth?: string) {
    return this.service.get(this.token(auth));
  }

  @Put()
  save(
    @Body() body: { turns: Turn[] },
    @Headers('authorization') auth?: string,
  ) {
    return this.service.save(body?.turns ?? [], this.token(auth));
  }

  @Delete()
  clear(@Headers('authorization') auth?: string) {
    return this.service.clear(this.token(auth));
  }
}
