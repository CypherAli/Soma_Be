import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { Severity } from '@prisma/client';

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

  @ApiPropertyOptional({ example: 'critical', enum: Severity })
  @IsOptional()
  @IsIn(Object.values(Severity))
  severity?: Severity;

  @ApiProperty({ example: 'nhoi-mau-co-tim', description: 'Định danh ổn định' })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiPropertyOptional({
    example: 'Tim mạch',
    description: 'Hệ lâm sàng theo giáo trình, khác hệ giải phẫu',
  })
  @IsOptional()
  @IsString()
  clinicalSystem?: string;

  @ApiPropertyOptional({
    example: 227,
    description: 'Trang trong tài liệu nguồn',
  })
  @IsOptional()
  @IsInt()
  sourcePage?: number;

  @ApiProperty({
    example: "Braunwald's Heart Disease, 12th ed.",
    description: 'Nguồn trích dẫn y khoa (BẮT BUỘC — không bịa nội dung)',
  })
  @IsString()
  @MinLength(3)
  source!: string;

  @ApiPropertyOptional({
    example: 'giai-phau-tim',
    description:
      'Mã cấu trúc 3D. ĐỂ TRỐNG ĐƯỢC: bệnh huyết học, rối loạn điện giải, ' +
      'bệnh tự miễn hệ thống không thuộc về một cấu trúc đơn lẻ nào.',
  })
  @IsOptional()
  @IsString()
  structureCode?: string;
}
