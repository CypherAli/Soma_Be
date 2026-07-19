import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuizOptionDto {
  @ApiProperty({ example: '4 buồng' })
  @IsString()
  @MinLength(1)
  textVi!: string;

  @ApiProperty({ example: '4 chambers' })
  @IsString()
  @MinLength(1)
  textEn!: string;

  @ApiProperty({ example: '4个腔' })
  @IsString()
  @MinLength(1)
  textZh!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  latin?: string;

  @ApiProperty({ example: true, description: 'Đáp án đúng?' })
  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuizDto {
  @ApiProperty({ example: 'Tim người có bao nhiêu buồng?' })
  @IsString()
  @MinLength(1)
  promptVi!: string;

  @ApiProperty({ example: 'How many chambers does the human heart have?' })
  @IsString()
  @MinLength(1)
  promptEn!: string;

  @ApiProperty({ example: '人的心脏有几个腔？' })
  @IsString()
  @MinLength(1)
  promptZh!: string;

  @ApiPropertyOptional({ description: 'Giải thích đáp án' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: "Gray's Anatomy, 42nd ed." })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ example: 'cardiovascular', description: 'Mã hệ cơ quan' })
  @IsString()
  systemCode!: string;

  @ApiProperty({ type: [CreateQuizOptionDto], description: 'Danh sách đáp án (ít nhất 2)' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  options!: CreateQuizOptionDto[];
}
