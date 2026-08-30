// NẠP SÁU LOÀI THÚ Y VÀO DATABASE
//
//   npm run db:seed:vet
//
// Nguồn là prisma/data/vet.json — bản DẪN XUẤT, sinh ra từ kho tri thức bên web
// (`Soma_Fe/src/lib/vet/`) bằng `npm run export:vet`. KHÔNG sửa tay tệp json:
// sửa nội dung thì sửa ở bên web rồi xuất lại, nếu không `npm run test:vet-kb`
// bên đó sẽ báo lệch.
//
// Vì sao mã hệ và mã cấu trúc đều mang tiền tố "vet-": `AnatomySystem.code` và
// `Structure.code` là unique TOÀN CỤC (mọi service tra `where: { code }`), mà
// bên người đã chiếm "muscular", "nervous"… Tách bằng tiền tố thay vì đổi sang
// unique-theo-loài — đổi thì phải sửa cả loạt endpoint đang chạy.
//
// Chạy được nhiều lần: toàn upsert theo `code`, không sinh bản trùng.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type VetExport = {
  format: number;
  species: { code: string; nameVi: string; nameEn: string; nameZh: string; latin: string }[];
  systems: {
    code: string;
    speciesCode: string;
    nameVi: string;
    nameEn: string;
    nameZh: string;
    order: number;
  }[];
  structures: {
    code: string;
    speciesCode: string;
    systemCode: string;
    nameVi: string;
    nameEn: string;
    nameZh: string;
    latin: string;
    descriptionVi: string;
    descriptionEn: string;
    descriptionZh: string;
  }[];
};

const FILE = path.join(__dirname, 'data', 'vet.json');

async function main() {
  let data: VetExport;
  try {
    data = JSON.parse(readFileSync(FILE, 'utf8')) as VetExport;
  } catch {
    throw new Error(
      `Không đọc được ${FILE}. Sinh nó từ bên web trước: (trong Soma_Fe) npm run export:vet`,
    );
  }
  if (data.format !== 1) {
    throw new Error(
      `vet.json khai format ${data.format}, bộ nạp này chỉ hiểu format 1. Cập nhật seed-vet.ts.`,
    );
  }

  const speciesIdByCode = new Map<string, string>();
  for (const s of data.species) {
    const row = await prisma.species.upsert({
      where: { code: s.code },
      update: { nameVi: s.nameVi, nameEn: s.nameEn, nameZh: s.nameZh, latin: s.latin },
      create: s,
    });
    speciesIdByCode.set(s.code, row.id);
  }

  const systemIdByCode = new Map<string, string>();
  for (const sys of data.systems) {
    const speciesId = speciesIdByCode.get(sys.speciesCode);
    if (!speciesId) throw new Error(`Hệ ${sys.code} trỏ tới loài lạ: ${sys.speciesCode}`);
    const row = await prisma.anatomySystem.upsert({
      where: { code: sys.code },
      update: {
        nameVi: sys.nameVi,
        nameEn: sys.nameEn,
        nameZh: sys.nameZh,
        order: sys.order,
        speciesId,
      },
      create: {
        code: sys.code,
        nameVi: sys.nameVi,
        nameEn: sys.nameEn,
        nameZh: sys.nameZh,
        order: sys.order,
        speciesId,
      },
    });
    systemIdByCode.set(sys.code, row.id);
  }

  for (const st of data.structures) {
    const speciesId = speciesIdByCode.get(st.speciesCode);
    const systemId = systemIdByCode.get(st.systemCode);
    // Dừng hẳn chứ không bỏ qua: một cấu trúc trỏ tới hệ không tồn tại nghĩa là
    // bản xuất hỏng, nạp tiếp chỉ tạo ra một database thiếu mảng mà không ai biết.
    if (!speciesId) throw new Error(`Cấu trúc ${st.code} trỏ tới loài lạ: ${st.speciesCode}`);
    if (!systemId) throw new Error(`Cấu trúc ${st.code} trỏ tới hệ lạ: ${st.systemCode}`);
    await prisma.structure.upsert({
      where: { code: st.code },
      update: {
        nameVi: st.nameVi,
        nameEn: st.nameEn,
        nameZh: st.nameZh,
        latin: st.latin,
        descriptionVi: st.descriptionVi,
        descriptionEn: st.descriptionEn,
        descriptionZh: st.descriptionZh,
        systemId,
        speciesId,
      },
      create: {
        code: st.code,
        nameVi: st.nameVi,
        nameEn: st.nameEn,
        nameZh: st.nameZh,
        latin: st.latin,
        descriptionVi: st.descriptionVi,
        descriptionEn: st.descriptionEn,
        descriptionZh: st.descriptionZh,
        systemId,
        speciesId,
      },
    });
  }

  console.log(
    `Đã nạp thú y: ${data.species.length} loài, ${data.systems.length} hệ, ` +
      `${data.structures.length} cấu trúc.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
