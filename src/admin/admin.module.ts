import { SourcesService } from './sources.service';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AnatomyAdminController } from './anatomy.controller';
import { AnatomyAdminService } from './anatomy.service';
import { AuditService } from './audit.service';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { QueuesService } from './queues.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AnatomyAdminController, OpsController],
  providers: [
    AdminService,
    SourcesService,
    AnatomyAdminService,
    OpsService,
    QueuesService,
    AuditService,
  ],
  exports: [AuditService],
})
export class AdminModule {}
