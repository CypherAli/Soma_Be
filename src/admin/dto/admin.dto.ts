import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Severity, UserRole } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Ba ngôn ngữ giao diện đang phục vụ; nội dung bệnh lý tách theo đúng bộ này. */
export const LOCALES = ['vi', 'en', 'zh'] as const;

export class RevisionDto {
  @ApiProperty({ description: 'Phiên bản nhận khi mở biểu mẫu' })
  @IsString()
  expectedRevision!: string;
}

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
export class UpsertContentDto extends RevisionDto {
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

export class UpdateSourceDto extends RevisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() publisher?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() year?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() licenseNote?: string;
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
export class UpdatePathologyMetaDto extends RevisionDto {
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
  icdCode?: string | null;

  @ApiPropertyOptional({ enum: Severity })
  @IsOptional()
  @IsIn(Object.values(Severity))
  severity?: Severity | null;

  @ApiPropertyOptional({ description: 'Hệ lâm sàng theo giáo trình' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicalSystem?: string | null;

  @ApiPropertyOptional({
    description: 'Nguồn trích dẫn dạng chữ trên chính bản ghi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  source?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() sourcePage?: number | null;
}

/** Tên ba ngôn ngữ + Latin — dùng chung cho loài, hệ cơ quan và cấu trúc. */
class MultilingualNameDto extends RevisionDto {
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

  @ApiPropertyOptional({ description: 'Tên Latin theo TA2' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  latin?: string;
}

/**
 * Tiền tố `Admin`: `src/species/dto/update-species.dto.ts` đã có một
 * `UpdateSpeciesDto` khác hình dạng (nó nhận cả `code`). Hai class cùng tên
 * trong cùng tài liệu Swagger làm Nest cảnh báo "Duplicate DTO detected" và
 * lấy hình dạng của một trong hai một cách không xác định — tức tài liệu API
 * nói sai về endpoint này. Nest cũng đã báo việc đó SẼ THÀNH LỖI ở phiên bản
 * lớn kế tiếp.
 */
export class AdminUpdateSpeciesDto extends MultilingualNameDto {}

export class UpdateSystemDto extends MultilingualNameDto {
  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị, nhỏ hơn thì lên trước',
  })
  @IsOptional()
  @IsInt()
  order?: number;
}

/**
 * Cấu trúc giải phẫu.
 *
 * KHÔNG có `meshName`: cùng loại rủi ro với `lesionMesh` — nó phải khớp đúng tên
 * mesh mà Z-Anatomy gắn trong file glTF, và cái giữ cho khớp là script
 * `npm run verify:scenes` / `verify:models` ở phía web. Gõ tay sai một ký tự thì
 * cấu trúc mất khả năng chọn trong /viewer mà không có lỗi nào báo ra.
 *
 * Cũng KHÔNG có `code`, `systemId`, `speciesId`, `parentId`: đổi mã là làm chết
 * mọi thứ đang trỏ tới nó (hotspot trong scene, bệnh lý, cây cha-con), còn dời
 * cây phân cấp là việc của dữ liệu nguồn chứ không phải một ô chọn.
 *
 * Tiền tố `Admin` vì `src/structures/dto/update-structure.dto.ts` đã dùng tên
 * `UpdateStructureDto` — xem chú thích ở [AdminUpdateSpeciesDto].
 */
export class AdminUpdateStructureDto extends MultilingualNameDto {
  @ApiPropertyOptional({ description: 'Mã Terminologia Anatomica' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() descriptionVi?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionZh?: string;
}

/** Neo một bệnh lý vào cấu trúc 3D, hoặc bỏ neo. */
export class LinkStructureDto extends RevisionDto {
  @ApiPropertyOptional({
    description:
      'Mã cấu trúc. Để trống hoặc null nghĩa là BỎ neo — nhiều bệnh (huyết học, rối loạn điện giải) không thuộc về một cấu trúc đơn lẻ nào và neo bừa thì tệ hơn để trống.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  structureCode?: string | null;
}

export class UpdateQuizDto extends RevisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() promptVi?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() promptEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() promptZh?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  source?: string;
}

export class UpdateQuizOptionDto extends RevisionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  textVi?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  textEn?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  textZh?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  latin?: string;

  @ApiPropertyOptional({
    description:
      'Đặt true sẽ tự BỎ đúng ở mọi phương án khác của cùng câu: một câu trắc nghiệm có hai đáp án đúng là một câu không thể trả lời.',
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

/**
 * Thao tác bật/tắt một cờ cho NHIỀU bản ghi một lượt.
 *
 * Trần 50 khai ngay ở tầng DTO, không chỉ ở service: ràng buộc nằm cả ở hợp
 * đồng API thì tài liệu Swagger nói đúng, và lời gọi vượt trần bị chặn trước
 * khi chạm vào cơ sở dữ liệu.
 */
export class BulkFlagDto {
  @IsOptional() @IsObject() revisions?: Record<string, string>;
  @ApiProperty({ type: [String], maxItems: 50 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({ description: 'Giá trị mới của cờ (duyệt / đã đối chiếu)' })
  @IsBoolean()
  value!: boolean;
}

export class SetReviewedDto {
  @IsBoolean() needsReview!: boolean;
  @IsString() expectedReviewRevision!: string;
}
