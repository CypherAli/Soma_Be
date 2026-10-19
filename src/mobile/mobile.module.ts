import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudyModule } from '../study/study.module';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';

@Module({
  imports: [AuthModule, ContentModule, PrismaModule, StudyModule],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}
