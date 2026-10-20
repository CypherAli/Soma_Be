import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';
import { ContentModule } from '../content/content.module';
import { WebAttemptsService } from './web-attempts.service';

@Module({
  imports: [PrismaModule, AuthModule, ContentModule],
  controllers: [StudyController],
  providers: [StudyService, WebAttemptsService],
  exports: [StudyService],
})
export class StudyModule {}
