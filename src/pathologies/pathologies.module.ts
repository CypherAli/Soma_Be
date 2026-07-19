import { Module } from '@nestjs/common';
import { PathologiesController } from './pathologies.controller';
import { PathologiesService } from './pathologies.service';

@Module({
  controllers: [PathologiesController],
  providers: [PathologiesService],
})
export class PathologiesModule {}
