import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PersonalDocsController } from './personal-docs.controller';
import { PersonalDocsService } from './personal-docs.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PersonalDocsController],
  providers: [PersonalDocsService],
})
export class PersonalDocsModule {}
