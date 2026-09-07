import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatMemoryController } from './chat-memory.controller';
import { ChatMemoryService } from './chat-memory.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChatMemoryController],
  providers: [ChatMemoryService],
})
export class ChatMemoryModule {}
