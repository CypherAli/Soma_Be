import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SavePathDto {
  @ApiProperty({ example: 'Nắm vững giải phẫu theo hệ cơ quan' })
  @IsString()
  @MaxLength(200)
  goal!: string;

  @ApiProperty({ minimum: 1, maximum: 7 })
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek!: number;

  @ApiProperty({ minimum: 10, maximum: 180 })
  @IsInt()
  @Min(10)
  @Max(180)
  minutesPerDay!: number;

  @ApiPropertyOptional({ description: 'Hệ ưu tiên, hoặc "all"' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  systemKey?: string;

  @ApiPropertyOptional({
    description:
      'Độ dài quãng học: 7 = một tuần, 28 = một tháng, 365 = một năm',
    minimum: 1,
    maximum: 366,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(366)
  horizonDays?: number;

  @ApiPropertyOptional({
    description: 'Thứ tự hệ cơ quan muốn học trước',
    example: ['nervous', 'visceral'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusSystems?: string[];

  @ApiPropertyOptional({
    description: 'Mô tả mục tiêu bằng lời, nếu nhờ AI lập kế hoạch',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  brief?: string;
}
