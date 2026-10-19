import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MobileAnswerDto {
  @ApiProperty({ example: 'model:ban-tay/scaphoid-l' })
  @IsString()
  @Length(1, 200)
  itemKey!: string;

  @ApiProperty({
    description: 'SHA-256 of the exact published question shown to the learner',
  })
  @IsString()
  @Length(64, 64)
  version!: string;

  @ApiProperty({
    description: 'Stable option identifier, independent of displayed order',
  })
  @IsString()
  @Length(1, 200)
  answerId!: string;
}

export class SubmitMobileAttemptDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Keep the same UUID and answers when retrying after a timeout',
  })
  @IsUUID('4')
  clientRequestId!: string;

  @ApiProperty({ type: [MobileAnswerDto], minItems: 1, maxItems: 20 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => MobileAnswerDto)
  answers!: MobileAnswerDto[];

  @ApiProperty({ minimum: 0, maximum: 21600 })
  @IsInt()
  @Min(0)
  @Max(21600)
  seconds!: number;

  @ApiProperty({
    example: 'skeletal',
    description: 'System key, or all for a mixed practice',
  })
  @IsString()
  @MaxLength(64)
  scope!: string;
}
