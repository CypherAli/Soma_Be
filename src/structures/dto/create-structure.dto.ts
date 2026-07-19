import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStructureDto {
  @ApiProperty({ example: 'giai-phau-tim', description: 'Mã cấu trúc duy nhất (thường là slug scene)' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiPropertyOptional({ example: 'Heart', description: 'Tên mesh trong file glTF (khớp Z-Anatomy)' })
  @IsOptional()
  @IsString()
  meshName?: string;

  @ApiProperty({ example: 'Giải phẫu Tim' })
  @IsString()
  @MinLength(1)
  nameVi!: string;

  @ApiProperty({ example: 'Heart Anatomy' })
  @IsString()
  @MinLength(1)
  nameEn!: string;

  @ApiProperty({ example: '心脏解剖' })
  @IsString()
  @MinLength(1)
  nameZh!: string;

  @ApiPropertyOptional({ example: 'Cor', description: 'Tên Latin theo TA2' })
  @IsOptional()
  @IsString()
  latin?: string;

  @ApiPropertyOptional({ example: 'A12.1.00.001', description: 'Mã Terminologia Anatomica' })
  @IsOptional()
  @IsString()
  taCode?: string;

  @ApiPropertyOptional({ description: 'Mô tả tiếng Việt' })
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiPropertyOptional({ description: 'Mô tả tiếng Anh' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả tiếng Trung' })
  @IsOptional()
  @IsString()
  descriptionZh?: string;

  @ApiProperty({ example: 'cardiovascular', description: 'Mã hệ cơ quan chứa cấu trúc' })
  @IsString()
  systemCode!: string;

  @ApiProperty({ example: 'human', description: 'Mã loài' })
  @IsString()
  speciesCode!: string;

  @ApiPropertyOptional({ description: 'Mã cấu trúc cha (nếu là cấu trúc con)' })
  @IsOptional()
  @IsString()
  parentCode?: string;
}
