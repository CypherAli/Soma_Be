import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SubmittedAnswerDto {
  @ApiProperty({
    description:
      'ID câu hỏi nguyên vẹn, bao gồm dạng #identify/#system/#latin của câu mô hình',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  questionId!: string;

  @ApiPropertyOptional({
    description: 'ID phương án đã chọn; bỏ trống nếu chưa trả lời',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  answerId?: string;
}

export class SubmitAttemptDto {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID giữ nguyên khi gửi lại cùng bài làm',
  })
  @IsUUID('4')
  clientRequestId!: string;

  @ApiProperty({ enum: ['model', 'book', 'atlas', 'personal', 'school'] })
  @IsIn(['model', 'book', 'atlas', 'personal', 'school'])
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(21600)
  seconds?: number;

  @ApiProperty({
    type: [SubmittedAnswerDto],
    description:
      'Máy chủ tự chấm; không nhận score, total hoặc correct từ client',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers!: SubmittedAnswerDto[];
}
