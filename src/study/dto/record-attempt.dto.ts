import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class GradedItemDto {
  @ApiProperty({
    description:
      'Khoá ổn định của câu, có tiền tố nguồn: "model:<factId>", "book:<qid>", "atlas:<id>", "personal:<id>", "vet:<factId>", "school:<schoolId>:<qid>"',
    example: 'book:yhn-anatomy-head_neck-004',
  })
  @IsString()
  @MaxLength(200)
  itemKey!: string;

  @ApiProperty({
    enum: ['model', 'book', 'atlas', 'personal', 'vet', 'school'],
  })
  @IsIn(['model', 'book', 'atlas', 'personal', 'vet', 'school'])
  source!: string;

  @ApiPropertyOptional({ description: 'Mã hệ cơ quan hoặc tên vùng cơ thể' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  scope?: string;

  @ApiProperty()
  @IsBoolean()
  correct!: boolean;
}

export class RecordAttemptDto {
  @ApiPropertyOptional({
    description: 'UUID stable across retries of the same submission',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  clientRequestId?: string;

  @ApiProperty({
    enum: ['model', 'book', 'atlas', 'personal', 'vet', 'school'],
  })
  @IsIn(['model', 'book', 'atlas', 'personal', 'vet', 'school'])
  source!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  scope?: string;

  @ApiPropertyOptional({ enum: ['practice', 'exam'] })
  @IsOptional()
  @IsIn(['practice', 'exam'])
  mode?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  score!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(500)
  total!: number;

  @ApiPropertyOptional({ description: 'Số giây thực làm' })
  @IsOptional()
  @IsInt()
  @Min(0)
  seconds?: number;

  @ApiPropertyOptional({
    type: [GradedItemDto],
    description:
      'Kết quả từng câu — dùng để cập nhật lịch ôn. Bỏ trống thì chỉ ghi điểm, không đổi hàng đợi.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => GradedItemDto)
  items?: GradedItemDto[];
}
