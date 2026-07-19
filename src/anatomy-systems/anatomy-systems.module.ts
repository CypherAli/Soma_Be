import { Module } from "@nestjs/common";
import { AnatomySystemsController } from "./anatomy-systems.controller";
import { AnatomySystemsService } from "./anatomy-systems.service";

@Module({
  controllers: [AnatomySystemsController],
  providers: [AnatomySystemsService],
})
export class AnatomySystemsModule {}
