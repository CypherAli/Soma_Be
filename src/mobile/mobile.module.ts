import { MobileLearningController } from './mobile-learning.controller';
import { MobileLearningService } from './mobile-learning.service';
import { MobileAccountController } from './mobile-account.controller';
import { MembershipModule } from '../membership/membership.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudyModule } from '../study/study.module';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';

@Module({
  imports: [
    AuthModule,
    ContentModule,
    PrismaModule,
    StudyModule,
    MembershipModule,
  ],
  controllers: [
    MobileController,
    MobileLearningController,
    MobileAccountController,
  ],
  providers: [MobileService, MobileLearningService],
})
export class MobileModule {}
