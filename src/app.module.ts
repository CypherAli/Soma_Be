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
import { CollectionsModule } from './collections/collections.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MedicalKnowledgeModule } from './medical-knowledge/medical-knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SpeciesModule,
    AnatomySystemsModule,
    StructuresModule,
    PathologiesModule,
    QuizzesModule,
    CollectionsModule,
    HealthModule,
    AuthModule,
    MedicalKnowledgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
