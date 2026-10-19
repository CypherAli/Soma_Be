import { BadRequestException } from '@nestjs/common';
export const SOURCE_STATUSES = [
  'downloaded',
  'official-link',
  'official-link-unavailable',
  'restricted-login',
  'commercial',
  'archived',
];
export function validateSourceMetadata(data: {
  title?: string;
  publisher?: string;
  url?: string;
  status?: string;
}) {
  if (
    data.title !== undefined &&
    (typeof data.title !== 'string' || !data.title.trim())
  )
    throw new BadRequestException('Nhập tên tài liệu');
  if (
    data.publisher !== undefined &&
    (typeof data.publisher !== 'string' || !data.publisher.trim())
  )
    throw new BadRequestException('Nhập nhà xuất bản');
  if (data.url) {
    try {
      const url = new URL(data.url);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
    } catch {
      throw new BadRequestException(
        'Liên kết tài liệu phải là http hoặc https',
      );
    }
  }
  if (data.status && !SOURCE_STATUSES.includes(data.status))
    throw new BadRequestException('Trạng thái tài liệu không hợp lệ');
}
