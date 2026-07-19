// Seed dữ liệu thật đã có trong ứng dụng — không bịa, lấy từ Soma_Fe/src/lib/exploreContent.ts.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SystemSeed = {
  code: string;
  nameVi: string;
  nameEn: string;
  nameZh: string;
  latin?: string;
  order: number;
};

// Đúng thứ tự ưu tiên user đã nêu: Xương → Cơ → Thần kinh → Hô hấp → Bạch huyết → Nội tiết →
// Tiết niệu → Sinh sản → Mô liên kết → Mô mỡ → Mạc → Thính giác → Thị giác.
const systems: SystemSeed[] = [
  { code: "skeletal", nameVi: "Hệ xương", nameEn: "Skeletal system", nameZh: "骨骼系统", latin: "Systema skeletale", order: 1 },
  { code: "muscular", nameVi: "Hệ cơ", nameEn: "Muscular system", nameZh: "肌肉系统", latin: "Systema musculare", order: 2 },
  { code: "musculoskeletal", nameVi: "Hệ cơ xương", nameEn: "Musculoskeletal system", nameZh: "肌肉骨骼系统", order: 3 },
  { code: "nervous", nameVi: "Hệ thần kinh", nameEn: "Nervous system", nameZh: "神经系统", latin: "Systema nervosum", order: 4 },
  { code: "digestive", nameVi: "Hệ tiêu hóa", nameEn: "Digestive system", nameZh: "消化系统", latin: "Systema digestorium", order: 5 },
  { code: "respiratory", nameVi: "Hệ hô hấp", nameEn: "Respiratory system", nameZh: "呼吸系统", order: 6 },
  { code: "cardiovascular", nameVi: "Hệ tuần hoàn", nameEn: "Cardiovascular system", nameZh: "心血管系统", latin: "Systema cardiovasculare", order: 7 },
  { code: "lymphatic", nameVi: "Hệ bạch huyết", nameEn: "Lymphatic system", nameZh: "淋巴系统", order: 8 },
  { code: "endocrine", nameVi: "Hệ nội tiết", nameEn: "Endocrine system", nameZh: "内分泌系统", order: 9 },
  { code: "urinary", nameVi: "Hệ tiết niệu", nameEn: "Urinary system", nameZh: "泌尿系统", order: 10 },
  { code: "reproductive-female", nameVi: "Hệ sinh sản nữ", nameEn: "Female reproductive system", nameZh: "女性生殖系统", order: 11 },
  { code: "reproductive-male", nameVi: "Hệ sinh sản nam", nameEn: "Male reproductive system", nameZh: "男性生殖系统", order: 12 },
  { code: "connective", nameVi: "Mô liên kết", nameEn: "Connective tissue", nameZh: "结缔组织", order: 13 },
  { code: "fat", nameVi: "Mô mỡ", nameEn: "Fat", nameZh: "脂肪", order: 14 },
  { code: "fascia", nameVi: "Mạc", nameEn: "Fascia", nameZh: "筋膜", order: 15 },
  { code: "auditory", nameVi: "Hệ thính giác", nameEn: "Auditory system", nameZh: "听觉系统", order: 16 },
  { code: "visual", nameVi: "Hệ thị giác", nameEn: "Visual system", nameZh: "视觉系统", order: 17 },
];

// 29 scene THẬT đã build (verify sạch, có model glTF thật) — code = slug href /giai-phau/mo-hinh/<slug>.
const structures: { code: string; nameVi: string; nameEn: string; nameZh: string; system: string }[] = [
  // Hệ tiêu hoá (9)
  { code: "mat-cat-ngang-bung", nameVi: "Mặt cắt ngang bụng", nameEn: "Abdomen Transverse Section", nameZh: "腹部横切面", system: "digestive" },
  { code: "giai-phau-gan", nameVi: "Giải phẫu Gan (phân thuỳ Couinaud)", nameEn: "Liver Anatomy (Couinaud Segments)", nameZh: "肝脏解剖（Couinaud分段）", system: "digestive" },
  { code: "mat-cat-da-day", nameVi: "Mặt cắt dạ dày", nameEn: "Stomach Cross Section", nameZh: "胃横切面", system: "digestive" },
  { code: "giai-phau-tuy", nameVi: "Giải phẫu Tuỵ", nameEn: "Pancreas Anatomy", nameZh: "胰腺解剖", system: "digestive" },
  { code: "mat-cat-ruot-non", nameVi: "Mặt cắt ruột non (hỗng tràng)", nameEn: "Small Intestine Cross Section (Jejunum)", nameZh: "小肠横切面（空肠）", system: "digestive" },
  { code: "mat-cat-ruot-gia", nameVi: "Đại-trực tràng và mặt cắt đại tràng xích-ma", nameEn: "Colorectal Anatomy and Sigmoid Colon Cross Section", nameZh: "大肠、直肠与乙状结肠横切面", system: "digestive" },
  { code: "co-that-hau-mon", nameVi: "Cơ thắt hậu môn và cơ nâng hậu môn", nameEn: "Anal Sphincter and Levator Ani Muscles", nameZh: "肛门括约肌与提肛肌", system: "digestive" },
  { code: "mat-cat-tui-mat", nameVi: "Mặt cắt túi mật", nameEn: "Gallbladder Cross Section", nameZh: "胆囊切面", system: "digestive" },
  { code: "tong-quan-he-tieu-hoa", nameVi: "Tổng quan hệ tiêu hoá (tạng bụng)", nameEn: "Digestive System Overview (Abdominal Viscera)", nameZh: "消化系统总览（腹腔脏器）", system: "digestive" },
  { code: "phuc-mac", nameVi: "Phúc mạc: mạc nối và mạc treo", nameEn: "Peritoneum: Omenta and Mesenteries", nameZh: "腹膜：网膜与系膜", system: "digestive" },
  // Hệ tuần hoàn (6)
  { code: "giai-phau-tim", nameVi: "Giải phẫu Tim", nameEn: "Heart Anatomy", nameZh: "心脏解剖", system: "cardiovascular" },
  { code: "mat-cat-vanh-tim", nameVi: "Mặt cắt vành tim", nameEn: "Heart Coronal Cross Section", nameZh: "心脏冠状切面", system: "cardiovascular" },
  { code: "dong-mach-vanh", nameVi: "Động mạch vành", nameEn: "Coronary Arteries", nameZh: "冠状动脉", system: "cardiovascular" },
  { code: "da-giac-willis", nameVi: "Đa giác Willis", nameEn: "Circle of Willis", nameZh: "威利斯环", system: "cardiovascular" },
  { code: "mat-cat-dong-mach", nameVi: "Mặt cắt động mạch chủ bụng", nameEn: "Abdominal Aorta Cross Section", nameZh: "腹主动脉横切面", system: "cardiovascular" },
  { code: "mat-cat-tinh-mach", nameVi: "Mặt cắt tĩnh mạch chủ dưới", nameEn: "Inferior Vena Cava Cross Section", nameZh: "下腔静脉横切面", system: "cardiovascular" },
  // Hệ xương (10)
  { code: "giai-phau-so", nameVi: "Giải phẫu Sọ", nameEn: "Skull Anatomy", nameZh: "颅骨解剖", system: "skeletal" },
  { code: "xuong-con-tai-giua", nameVi: "Xương con Tai giữa", nameEn: "Middle Ear Ossicles", nameZh: "中耳听小骨", system: "skeletal" },
  { code: "cot-song", nameVi: "Cột sống", nameEn: "Vertebral Column", nameZh: "脊柱", system: "skeletal" },
  { code: "long-nguc", nameVi: "Lồng ngực", nameEn: "Thoracic Cage", nameZh: "胸廓", system: "skeletal" },
  { code: "xuong-chau", nameVi: "Xương chậu", nameEn: "Pelvis Anatomy", nameZh: "骨盆解剖", system: "skeletal" },
  { code: "dai-vai-chi-tren", nameVi: "Đai vai và Chi trên", nameEn: "Shoulder Girdle and Upper Limb", nameZh: "肩带与上肢骨", system: "skeletal" },
  { code: "ban-tay", nameVi: "Xương Bàn tay", nameEn: "Hand Bones", nameZh: "手骨", system: "skeletal" },
  { code: "chi-duoi", nameVi: "Xương Chi dưới", nameEn: "Lower Limb Bones", nameZh: "下肢骨", system: "skeletal" },
  { code: "ban-chan", nameVi: "Xương Bàn chân", nameEn: "Foot Bones", nameZh: "足骨", system: "skeletal" },
  { code: "bo-rang", nameVi: "Bộ răng", nameEn: "Dentition", nameZh: "牙列", system: "skeletal" },
  // Hệ cơ (4, còn đang tiếp tục)
  { code: "co-mat", nameVi: "Cơ Mặt", nameEn: "Facial Muscles", nameZh: "面部肌肉", system: "muscular" },
  { code: "co-dui-mong", nameVi: "Cơ Đùi và Mông", nameEn: "Thigh and Gluteal Muscles", nameZh: "大腿与臀部肌肉", system: "muscular" },
  { code: "co-canh-tay", nameVi: "Cơ Cánh tay", nameEn: "Arm Muscles", nameZh: "上臂肌肉", system: "muscular" },
  { code: "co-bung", nameVi: "Cơ Thành bụng trước-bên", nameEn: "Abdominal Wall Muscles", nameZh: "腹前外侧壁肌肉", system: "muscular" },
  // Hệ hô hấp (3)
  { code: "giai-phau-phoi", nameVi: "Giải phẫu Phổi", nameEn: "Lung Anatomy", nameZh: "肺解剖", system: "respiratory" },
  { code: "thanh-quan", nameVi: "Giải phẫu Thanh quản", nameEn: "Larynx Anatomy", nameZh: "喉解剖", system: "respiratory" },
  { code: "co-hoanh", nameVi: "Cơ hoành", nameEn: "Diaphragm", nameZh: "膈肌", system: "respiratory" },
];

async function main() {
  const human = await prisma.species.upsert({
    where: { code: "human" },
    update: {},
    create: { code: "human", nameVi: "Người", nameEn: "Human", nameZh: "人类", latin: "Homo sapiens" },
  });

  const systemIdByCode = new Map<string, string>();
  for (const s of systems) {
    const row = await prisma.anatomySystem.upsert({
      where: { code: s.code },
      update: { nameVi: s.nameVi, nameEn: s.nameEn, nameZh: s.nameZh, latin: s.latin, order: s.order },
      create: { ...s, speciesId: human.id },
    });
    systemIdByCode.set(s.code, row.id);
  }

  const structureIdByCode = new Map<string, string>();
  for (const st of structures) {
    const systemId = systemIdByCode.get(st.system);
    if (!systemId) throw new Error(`Unknown system code: ${st.system}`);
    const row = await prisma.structure.upsert({
      where: { code: st.code },
      update: { nameVi: st.nameVi, nameEn: st.nameEn, nameZh: st.nameZh, systemId, speciesId: human.id },
      create: {
        code: st.code,
        nameVi: st.nameVi,
        nameEn: st.nameEn,
        nameZh: st.nameZh,
        systemId,
        speciesId: human.id,
      },
    });
    structureIdByCode.set(st.code, row.id);
  }

  // --- Bệnh lý: chỉ dùng sự kiện y khoa đã được xác lập + NGUỒN TRÍCH DẪN CÓ THẬT.
  // KHÔNG bịa mã ICD (bỏ trống thay vì đoán sai). Idempotent: xoá sạch rồi tạo lại.
  const pathologies: {
    structure: string;
    nameVi: string;
    nameEn: string;
    nameZh: string;
    severity: string;
    source: string;
  }[] = [
    {
      structure: 'giai-phau-tim',
      nameVi: 'Nhồi máu cơ tim',
      nameEn: 'Myocardial infarction',
      nameZh: '心肌梗死',
      severity: 'critical',
      source: "Braunwald's Heart Disease: A Textbook of Cardiovascular Medicine, 12th ed. (2021)",
    },
    {
      structure: 'giai-phau-gan',
      nameVi: 'Xơ gan',
      nameEn: 'Cirrhosis of the liver',
      nameZh: '肝硬化',
      severity: 'warning',
      source: "Sherlock's Diseases of the Liver and Biliary System, 13th ed. (2018)",
    },
    {
      structure: 'mat-cat-tui-mat',
      nameVi: 'Sỏi mật',
      nameEn: 'Cholelithiasis',
      nameZh: '胆石症',
      severity: 'info',
      source: 'Sabiston Textbook of Surgery, 21st ed. (2022)',
    },
    {
      structure: 'mat-cat-ruot-gia',
      nameVi: 'Viêm ruột thừa cấp',
      nameEn: 'Acute appendicitis',
      nameZh: '急性阑尾炎',
      severity: 'warning',
      source: 'Sabiston Textbook of Surgery, 21st ed. (2022)',
    },
    {
      structure: 'mat-cat-dong-mach',
      nameVi: 'Phình động mạch chủ bụng',
      nameEn: 'Abdominal aortic aneurysm',
      nameZh: '腹主动脉瘤',
      severity: 'critical',
      source: "Rutherford's Vascular Surgery and Endovascular Therapy, 10th ed. (2022)",
    },
  ];

  await prisma.pathology.deleteMany({});
  for (const p of pathologies) {
    const structureId = structureIdByCode.get(p.structure);
    if (!structureId) throw new Error(`Unknown structure for pathology: ${p.structure}`);
    await prisma.pathology.create({
      data: {
        nameVi: p.nameVi,
        nameEn: p.nameEn,
        nameZh: p.nameZh,
        severity: p.severity,
        source: p.source,
        structureId,
      },
    });
  }

  // --- Trắc nghiệm: chỉ sự kiện giải phẫu chuẩn sách giáo khoa (Gray's Anatomy 42e).
  const quizzes: {
    system: string;
    promptVi: string;
    promptEn: string;
    promptZh: string;
    explanation: string;
    options: { textVi: string; textEn: string; textZh: string; isCorrect: boolean }[];
  }[] = [
    {
      system: 'cardiovascular',
      promptVi: 'Tim người có bao nhiêu buồng?',
      promptEn: 'How many chambers does the human heart have?',
      promptZh: '人的心脏有几个腔？',
      explanation: '2 tâm nhĩ nhận máu về + 2 tâm thất bơm máu đi = 4 buồng.',
      options: [
        { textVi: '4 buồng', textEn: '4 chambers', textZh: '4个腔', isCorrect: true },
        { textVi: '2 buồng', textEn: '2 chambers', textZh: '2个腔', isCorrect: false },
        { textVi: '3 buồng', textEn: '3 chambers', textZh: '3个腔', isCorrect: false },
        { textVi: '5 buồng', textEn: '5 chambers', textZh: '5个腔', isCorrect: false },
      ],
    },
    {
      system: 'cardiovascular',
      promptVi: 'Thành cơ của buồng tim nào dày nhất?',
      promptEn: 'Which heart chamber has the thickest muscular wall?',
      promptZh: '哪个心腔的肌壁最厚？',
      explanation: 'Tâm thất trái bơm máu đi toàn thân với áp lực cao nên thành dày nhất.',
      options: [
        { textVi: 'Tâm thất trái', textEn: 'Left ventricle', textZh: '左心室', isCorrect: true },
        { textVi: 'Tâm thất phải', textEn: 'Right ventricle', textZh: '右心室', isCorrect: false },
        { textVi: 'Tâm nhĩ trái', textEn: 'Left atrium', textZh: '左心房', isCorrect: false },
        { textVi: 'Tâm nhĩ phải', textEn: 'Right atrium', textZh: '右心房', isCorrect: false },
      ],
    },
    {
      system: 'digestive',
      promptVi: 'Gan được chia thành bao nhiêu phân thuỳ chức năng theo Couinaud?',
      promptEn: 'Into how many functional segments is the liver divided by the Couinaud system?',
      promptZh: '按 Couinaud 分段，肝脏分为几个功能段？',
      explanation: 'Hệ Couinaud chia gan thành 8 phân thuỳ độc lập về mạch máu và đường mật.',
      options: [
        { textVi: '8 phân thuỳ', textEn: '8 segments', textZh: '8个段', isCorrect: true },
        { textVi: '4 phân thuỳ', textEn: '4 segments', textZh: '4个段', isCorrect: false },
        { textVi: '6 phân thuỳ', textEn: '6 segments', textZh: '6个段', isCorrect: false },
        { textVi: '10 phân thuỳ', textEn: '10 segments', textZh: '10个段', isCorrect: false },
      ],
    },
    {
      system: 'skeletal',
      promptVi: 'Mỗi bàn tay người có bao nhiêu xương?',
      promptEn: 'How many bones are there in each human hand?',
      promptZh: '每只手有多少块骨？',
      explanation: '8 xương cổ tay + 5 xương bàn tay + 14 xương ngón = 27 xương.',
      options: [
        { textVi: '27 xương', textEn: '27 bones', textZh: '27块', isCorrect: true },
        { textVi: '26 xương', textEn: '26 bones', textZh: '26块', isCorrect: false },
        { textVi: '28 xương', textEn: '28 bones', textZh: '28块', isCorrect: false },
        { textVi: '30 xương', textEn: '30 bones', textZh: '30块', isCorrect: false },
      ],
    },
    {
      system: 'skeletal',
      promptVi: 'Cột sống người trưởng thành điển hình gồm bao nhiêu đốt sống (tính cả cùng-cụt đã dính)?',
      promptEn: 'How many vertebrae are in a typical adult spine (including the fused sacrum and coccyx)?',
      promptZh: '成人脊柱典型有多少块椎骨（含融合的骶尾骨）？',
      explanation: '7 cổ + 12 ngực + 5 thắt lưng + 5 cùng (dính) + 4 cụt (dính) = 33.',
      options: [
        { textVi: '33 đốt', textEn: '33 vertebrae', textZh: '33块', isCorrect: true },
        { textVi: '24 đốt', textEn: '24 vertebrae', textZh: '24块', isCorrect: false },
        { textVi: '26 đốt', textEn: '26 vertebrae', textZh: '26块', isCorrect: false },
        { textVi: '32 đốt', textEn: '32 vertebrae', textZh: '32块', isCorrect: false },
      ],
    },
  ];

  await prisma.quizQuestion.deleteMany({}); // options tự xoá theo cascade
  for (const q of quizzes) {
    const systemId = systemIdByCode.get(q.system);
    if (!systemId) throw new Error(`Unknown system for quiz: ${q.system}`);
    await prisma.quizQuestion.create({
      data: {
        promptVi: q.promptVi,
        promptEn: q.promptEn,
        promptZh: q.promptZh,
        explanation: q.explanation,
        source: "Gray's Anatomy, 42nd ed. (2020)",
        systemId,
        options: { create: q.options },
      },
    });
  }

  console.log(
    `Seeded: 1 species, ${systems.length} systems, ${structures.length} structures, ` +
      `${pathologies.length} pathologies, ${quizzes.length} quizzes.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
