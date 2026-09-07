import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SpeciesModule } from './species/species.module';
import { AnatomySystemsModule } from './anatomy-systems/anatomy-systems.module';
import { StructuresModule } from './structures/structures.module';
import { PathologiesModule } from './pathologies/pathologies.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ChatMemoryModule } from './chat-memory/chat-memory.module';
import { MedicalKnowledgeModule } from './medical-knowledge/medical-knowledge.module';
import { StudyModule } from './study/study.module';
import { PersonalDocsModule } from './personal-docs/personal-docs.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SpeciesModule,
    AnatomySystemsModule,
    StructuresModule,
    PathologiesModule,
    QuizzesModule,
    HealthModule,
    AuthModule,
    MedicalKnowledgeModule,
    ChatMemoryModule,
    StudyModule,
    PersonalDocsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
