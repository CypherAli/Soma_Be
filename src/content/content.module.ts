import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentService } from './content.service';
import {
  ContentAdminController,
  PublicContentController,
} from './content.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ContentAdminController, PublicContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
