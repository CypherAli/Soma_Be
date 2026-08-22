import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMaxSize } from 'class-validator';

/**
 * Các câu do AI đọc từ tài liệu, gửi lên từ tầng web.
 *
 * Cố ý KHÔNG khai báo chặt từng trường ở đây: hình dạng câu do mô hình sinh ra
 * rất lệch lạc, mà `class-validator` trả về lỗi 400 chung chung thì cả lô câu
 * đúng cũng bị chặn theo. Việc lọc do `sanitiseQuestion` làm — nó bỏ đúng câu
 * hỏng và giữ lại phần dùng được.
 */
export class AiQuestionsDto {
  @ApiProperty({
    description: 'Danh sách câu: { stem, options: {A,B,C,D}, answer, explanation, page }',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  @ArrayMaxSize(1000)
  questions!: unknown[];
}
