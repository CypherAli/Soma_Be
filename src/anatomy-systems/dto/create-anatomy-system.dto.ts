import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateAnatomySystemDto {
  @ApiProperty({ example: 'skeletal', description: 'Mã hệ cơ quan duy nhất' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'Hệ xương' })
  @IsString()
  @MinLength(1)
  nameVi!: string;

  @ApiProperty({ example: 'Skeletal system' })
  @IsString()
  @MinLength(1)
  nameEn!: string;

  @ApiProperty({ example: '骨骼系统' })
  @IsString()
  @MinLength(1)
  nameZh!: string;

  @ApiPropertyOptional({ example: 'Systema skeletale' })
  @IsOptional()
  @IsString()
  latin?: string;

  @ApiPropertyOptional({ example: 1, description: 'Thứ tự hiển thị' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ example: 'human', description: 'Mã loài chứa hệ này' })
  @IsString()
  speciesCode!: string;
}
