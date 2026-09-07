import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AnatomyAdminController } from './anatomy.controller';
import { AnatomyAdminService } from './anatomy.service';
import { AuditService } from './audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AnatomyAdminController],
  providers: [AdminService, AnatomyAdminService, AuditService],
  exports: [AuditService],
})
export class AdminModule {}
