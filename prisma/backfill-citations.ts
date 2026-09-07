import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Đưa `pathologies.source` + `sourcePage` (chuỗi tự do) vào bảng
 * `pathology_citations` có khoá ngoại thật.
 *
 * Vì sao cần: schema tuyên bố "bệnh lý — luôn kèm nguồn trích dẫn", nhưng bảng
 * trích dẫn trống 100% và nguồn chỉ tồn tại dưới dạng một dòng chữ không ai
 * kiểm chứng được. Nối vào `medical_sources` thì trang quản trị mới rà được
 * từng trích dẫn, và mới biết bệnh nào đang dựa vào nguồn hết hiệu lực.
 *
 * `verified` để FALSE: máy chuyển chỗ chứ không đọc sách, người chuyên môn phải
 * tự bấm duyệt trong back office.
 *
 * Chạy lại nhiều lần vô hại — khoá duy nhất (pathologyId, sourceId, pageOrSection).
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Chuỗi nguồn tự do đang có trong DB → id trong `medical_sources`. */
const SOURCE_IDS: Record<string, string> = {
  "Bệnh học Nội khoa, tập 1 — Đại học Y Hà Nội (2020)": "hmu-benh-hoc-noi-khoa-1-2020",
  "Bệnh học Nội khoa, tập 2 — Đại học Y Hà Nội (2020)": "hmu-benh-hoc-noi-khoa-2-2020",
  "Sabiston Textbook of Surgery, 21st ed. (2022)": "sabiston-surgery-21e-2022",
  "Rutherford's Vascular Surgery and Endovascular Therapy, 10th ed. (2022)":
    "rutherford-vascular-10e-2022",
};

async function main() {
  const known = new Set((await prisma.medicalSource.findMany({ select: { id: true } })).map((s) => s.id));
  const missing = Object.values(SOURCE_IDS).filter((id) => !known.has(id));
  if (missing.length) {
    throw new Error(
      `Thiếu nguồn trong medical_sources: ${missing.join(", ")}. Chạy \`npm run kb:sync\` trước.`,
    );
  }

  const pathologies = await prisma.pathology.findMany({
    select: { id: true, slug: true, source: true, sourcePage: true },
  });

  let created = 0;
  const unmapped = new Set<string>();
  for (const p of pathologies) {
    const sourceId = SOURCE_IDS[p.source];
    if (!sourceId) {
      unmapped.add(p.source);
      continue;
    }
    const pageOrSection = p.sourcePage ? `tr. ${p.sourcePage}` : null;
    const existing = await prisma.pathologyCitation.findFirst({
      where: { pathologyId: p.id, sourceId, pageOrSection },
    });
    if (existing) continue;
    await prisma.pathologyCitation.create({
      data: { pathologyId: p.id, sourceId, pageOrSection, verified: false },
    });
    created += 1;
  }

  console.log(`Đã tạo ${created} trích dẫn cho ${pathologies.length} bệnh lý.`);
  if (unmapped.size) {
    console.warn(`Chưa ánh xạ được ${unmapped.size} chuỗi nguồn:`);
    for (const s of unmapped) console.warn(`  - ${s}`);
    process.exitCode = 1;
  }
}

main().finally(() => void prisma.$disconnect());
