import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Nhập bản dịch EN/ZH vào bảng pathology_content.
 *
 * Nguồn: medical_kb/translations/<lang>.json — do người hoặc mô hình dịch từ
 * medical_kb/translations/source_vi.json.
 *
 * BẢN TIẾNG VIỆT KHÔNG BAO GIỜ BỊ ĐỘNG TỚI. Script này chỉ tạo/cập nhật bản
 * ghi của locale khác, và luôn đặt machineTranslated = true — bản dịch chưa
 * qua thẩm định chuyên môn thì phải nói ra, giao diện có băng cảnh báo dựa
 * đúng vào cờ này.
 *
 * Chạy:
 *   npx ts-node -P prisma/tsconfig.seed.json prisma/import-translations.ts en
 */
// Prisma 7 bắt buộc truyền driver adapter — dùng đúng kiểu PrismaService của
// backend để hai bên nói chuyện với cùng một cấu hình kết nối.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const FIELDS = ['description', 'clinical', 'imaging', 'progression', 'treatment'] as const;
type Field = (typeof FIELDS)[number];

async function main() {
  const lang = process.argv[2];
  if (lang !== 'en' && lang !== 'zh') {
    throw new Error('Dùng: import-translations.ts <en|zh>');
  }

  const path = join(__dirname, '..', '..', 'medical_kb', 'translations', `${lang}.json`);
  if (!existsSync(path)) throw new Error(`Không thấy ${path}`);

  const data = JSON.parse(readFileSync(path, 'utf8')) as Record<string, Partial<Record<Field, string>>>;
  const slugs = Object.keys(data);
  console.log(`${slugs.length} bệnh trong ${lang}.json`);

  let written = 0;
  let missing = 0;

  for (const slug of slugs) {
    const pathology = await prisma.pathology.findUnique({ where: { slug } });
    if (!pathology) {
      console.warn(`  bỏ qua ${slug}: không có bệnh này trong DB`);
      missing++;
      continue;
    }

    const body: Partial<Record<Field, string>> = {};
    for (const f of FIELDS) {
      const v = data[slug][f];
      // Chuỗi rỗng khác với "chưa dịch": ghi rỗng vào DB thì giao diện tưởng
      // mục đó vốn không có nội dung.
      if (typeof v === 'string' && v.trim()) body[f] = v.trim();
    }
    if (Object.keys(body).length === 0) continue;

    await prisma.pathologyContent.upsert({
      where: { pathologyId_locale: { pathologyId: pathology.id, locale: lang } },
      create: { pathologyId: pathology.id, locale: lang, machineTranslated: true, ...body },
      update: { machineTranslated: true, ...body },
    });
    written++;
  }

  console.log(`đã ghi ${written} bản ghi locale=${lang}${missing ? `, ${missing} slug lạ` : ''}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
