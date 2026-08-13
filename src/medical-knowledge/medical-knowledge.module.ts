import { Module } from '@nestjs/common';
import { MedicalKnowledgeController } from './medical-knowledge.controller';
import { MedicalKnowledgeService } from './medical-knowledge.service';
@Module({
  controllers: [MedicalKnowledgeController],
  providers: [MedicalKnowledgeService],
})
export class MedicalKnowledgeModule {}
