import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePathologyDto {
  @ApiProperty({ example: 'Nhồi máu cơ tim' })
  @IsString()
  @MinLength(1)
  nameVi!: string;

  @ApiProperty({ example: 'Myocardial infarction' })
  @IsString()
  @MinLength(1)
  nameEn!: string;

  @ApiProperty({ example: '心肌梗死' })
  @IsString()
  @MinLength(1)
  nameZh!: string;

  @ApiPropertyOptional({ example: 'Infarctus myocardii' })
  @IsOptional()
  @IsString()
  latin?: string;

  @ApiPropertyOptional({ example: 'BA41', description: 'Mã ICD-11' })
  @IsOptional()
  @IsString()
  icdCode?: string;

  @ApiPropertyOptional({ example: 'critical', enum: ['info', 'warning', 'critical'] })
  @IsOptional()
  @IsIn(['info', 'warning', 'critical'])
  severity?: string;

  @ApiPropertyOptional({ description: 'Mô tả bệnh lý (tiếng Việt)' })
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiProperty({
    example: "Braunwald's Heart Disease, 12th ed.",
    description: 'Nguồn trích dẫn y khoa (BẮT BUỘC — không bịa nội dung)',
  })
  @IsString()
  @MinLength(3)
  source!: string;

  @ApiProperty({ example: 'giai-phau-tim', description: 'Mã cấu trúc mà bệnh lý gắn vào' })
  @IsString()
  structureCode!: string;
}
