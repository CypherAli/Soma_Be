import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Severity, UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** Ba ngôn ngữ giao diện đang phục vụ; nội dung bệnh lý tách theo đúng bộ này. */
export const LOCALES = ['vi', 'en', 'zh'] as const;

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsIn(Object.values(UserRole))
  role!: UserRole;
}

export class SetDisabledDto {
  @ApiProperty({ description: 'true = khoá tài khoản, false = mở lại' })
  @IsBoolean()
  disabled!: boolean;
}

/** Một mục nội dung bệnh lý của MỘT ngôn ngữ. */
export class UpsertContentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clinical?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imaging?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() progression?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() treatment?: string;

  @ApiPropertyOptional({
    description:
      'Bản dịch máy chưa có người duyệt. Giao diện người đọc dựa vào cờ này để hiện băng cảnh báo, nên đừng tắt khi chưa thật sự đọc lại.',
  })
  @IsOptional()
  @IsBoolean()
  machineTranslated?: boolean;
}

export class CreateCitationDto {
  @ApiProperty({ description: 'id trong bảng medical_sources' })
  @IsString()
  sourceId!: string;

  @ApiPropertyOptional({ description: 'Trang hoặc mục, ví dụ "tr. 214"' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pageOrSection?: string;

  @ApiPropertyOptional({ description: 'Trích nguyên văn để đối chiếu' })
  @IsOptional()
  @IsString()
  quote?: string;
}

export class UpdateSourceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() publisher?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() year?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() licenseNote?: string;
}

export class ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
}

/**
 * Các trường của chính bản ghi bệnh lý mà back office cho sửa.
 *
 * KHÔNG có `lesionMesh` / `lesionSystem`: hai trường đó phải khớp tên mesh thật
 * trong model glTF, và cái giữ cho chúng khớp là script `npm run verify:lesions`
 * ở phía web. Cho gõ tay qua API thì một cái sai chính tả sẽ làm điểm tổn thương
 * im lặng biến mất trong /viewer — không lỗi, không cảnh báo, không ai biết.
 *
 * Cũng KHÔNG có `slug`: slug đang là địa chỉ công khai của bài bệnh và nằm
 * trong `data/slug-alias.json`; đổi ở đây là làm chết liên kết ngoài.
 */
export class UpdatePathologyMetaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameVi?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameZh?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  latin?: string;

  @ApiPropertyOptional({ description: 'Mã ICD-11' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  icdCode?: string;

  @ApiPropertyOptional({ enum: Severity })
  @IsOptional()
  @IsIn(Object.values(Severity))
  severity?: Severity;

  @ApiPropertyOptional({ description: 'Hệ lâm sàng theo giáo trình' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicalSystem?: string;

  @ApiPropertyOptional({
    description: 'Nguồn trích dẫn dạng chữ trên chính bản ghi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  source?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() sourcePage?: number;
}
