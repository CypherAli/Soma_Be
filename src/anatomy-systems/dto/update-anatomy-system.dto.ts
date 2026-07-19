import { PartialType } from '@nestjs/swagger';
import { CreateAnatomySystemDto } from './create-anatomy-system.dto';

export class UpdateAnatomySystemDto extends PartialType(CreateAnatomySystemDto) {}
