import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSpeciesDto {
  @ApiProperty({ example: 'human', description: 'Mã định danh duy nhất (human, canine, feline...)' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'Người' })
  @IsString()
  @MinLength(1)
  nameVi!: string;

  @ApiProperty({ example: 'Human' })
  @IsString()
  @MinLength(1)
  nameEn!: string;

  @ApiProperty({ example: '人类' })
  @IsString()
  @MinLength(1)
  nameZh!: string;

  @ApiPropertyOptional({ example: 'Homo sapiens', description: 'Tên Latin (nhị thức)' })
  @IsOptional()
  @IsString()
  latin?: string;
}
