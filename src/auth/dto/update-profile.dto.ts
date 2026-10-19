import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Tên hiển thị', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên hiển thị phải có ít nhất 2 ký tự' })
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    description:
      'Ảnh đại diện dạng data URL (PNG/JPEG/WEBP, tối đa 200 KB). Gửi null để gỡ ảnh.',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phải là chuỗi data URL' })
  @MaxLength(300_000)
  avatar?: string | null;
}
