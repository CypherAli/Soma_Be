import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Giải phẫu tim mạch nâng cao' })
  @IsString()
  @MinLength(1)
  titleVi!: string;

  @ApiProperty({ example: 'Advanced Cardiovascular Anatomy' })
  @IsString()
  @MinLength(1)
  titleEn!: string;

  @ApiProperty({ example: '高级心血管解剖' })
  @IsString()
  @MinLength(1)
  titleZh!: string;

  @ApiPropertyOptional({ example: 'TS. Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  authorName?: string;

  @ApiPropertyOptional({ example: 'Bác sĩ tim mạch' })
  @IsOptional()
  @IsString()
  authorRole?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    example: 'blue',
    description: 'Màu footer card: blue/purple/teal',
  })
  @IsOptional()
  @IsString()
  coverColor?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
