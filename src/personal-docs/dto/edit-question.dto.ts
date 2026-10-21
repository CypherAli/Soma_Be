import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  ArrayUnique,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class EditQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  stem?: string;

  @ApiPropertyOptional({
    description:
      'Bảng phương án theo nhãn chữ cái, ví dụ { "A": "...", "B": "..." }',
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Nhãn phương án đúng: A–F' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-F]$/, { message: 'Đáp án phải là một chữ cái A–F' })
  answer?: string;

  @ApiPropertyOptional({
    description: 'Các nhãn đáp án đúng trong nguồn',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @Matches(/^[A-F]$/, { each: true })
  answers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  explanation?: string;

  @ApiPropertyOptional({ description: 'Duyệt câu này cho phép ra đề' })
  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}
