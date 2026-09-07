// Seed dữ liệu thật đã có trong ứng dụng — không bịa, lấy từ Soma_Fe/src/lib/exploreContent.ts.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { seedPathologies } from "./data/pathologies";
import { seedContent } from "./data/pathology-content";
import { lesionMap } from "./data/lesion-map";

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
  // Hệ tiết niệu (1)
  { code: "he-tiet-nieu", nameVi: "Hệ tiết niệu", nameEn: "Urinary System", nameZh: "泌尿系统", system: "urinary" },
  // Hệ thị giác (1)
  { code: "giai-phau-mat", nameVi: "Giải phẫu Mắt", nameEn: "Eye Anatomy", nameZh: "眼解剖", system: "visual" },
  // Hệ nội tiết (1)
  { code: "he-noi-tiet", nameVi: "Hệ nội tiết", nameEn: "Endocrine System", nameZh: "内分泌系统", system: "endocrine" },
  // Hệ thính giác (1)
  { code: "he-thinh-giac", nameVi: "Hệ thính giác", nameEn: "Auditory System", nameZh: "听觉系统", system: "auditory" },
  // Hệ sinh sản (1) — chỉ có nam; nguồn dữ liệu không có cơ quan sinh dục nữ
  { code: "he-sinh-san-nam", nameVi: "Hệ sinh sản nam", nameEn: "Male Reproductive System", nameZh: "男性生殖系统", system: "reproductive-male" },
  // Mạc (1)
  { code: "he-mac", nameVi: "Hệ mạc", nameEn: "Fascial System", nameZh: "筋膜系统", system: "fascia" },
  // Mô liên kết (1)
  { code: "mo-lien-ket", nameVi: "Mô liên kết đặc", nameEn: "Dense Connective Tissue", nameZh: "致密结缔组织", system: "connective" },
  // Hệ thần kinh (3, còn đang tiếp tục)
  { code: "than-nao-day-so", nameVi: "Thân não & 12 Đôi Dây Thần Kinh Sọ", nameEn: "Brainstem & 12 Cranial Nerves", nameZh: "脑干与12对脑神经", system: "nervous" },
  { code: "tieu-nao", nameVi: "Tiểu Não", nameEn: "Cerebellum", nameZh: "小脑", system: "nervous" },
  { code: "gian-nao-he-vien", nameVi: "Gian Não, Nhân Nền & Hệ Viền", nameEn: "Diencephalon, Basal Ganglia & Limbic System", nameZh: "间脑、基底核与边缘系统", system: "nervous" },

  // ─── Đồng bộ 25/08/2026 với atlas hiện có ────────────────────────────────
  // Danh sách trên là bản seed đời đầu (43 mã, ứng với atlas lúc đó). Atlas nay
  // có 121 model, nên 92 mã dưới đây được sinh THẲNG TỪ danh sách scene của
  // Soma_Fe (`src/lib/scenes/*.ts` + `catalog.ts`) — nhờ vậy mọi bệnh đều neo
  // được vào đúng model của nó, không còn cảnh "bệnh có model mà không gắn
  // được vì thiếu mã cấu trúc".
  //
  // 14 mã cũ KHÔNG còn scene tương ứng (mat-cat-da-day, giai-phau-tuy,
  // mat-cat-ruot-non, mat-cat-ruot-gia, co-that-hau-mon, mat-cat-tui-mat,
  // phuc-mac, mat-cat-vanh-tim, mat-cat-dong-mach, mat-cat-tinh-mach,
  // xuong-con-tai-giua, xuong-chau, chi-duoi, co-hoanh) vẫn giữ nguyên: xoá đi
  // là mất liên kết của những bệnh đang trỏ vào chúng, mà nội dung bệnh thì
  // không sai. Khi dựng lại các model đó thì mã sẵn sàng dùng tiếp.
  { code: "giai-phau-dau", nameVi: "Giải phẫu Đầu", nameEn: "Head Anatomy", nameZh: "头部解剖", system: "skeletal" },
  { code: "giai-phau-co", nameVi: "Giải phẫu Cổ", nameEn: "Neck Anatomy", nameZh: "颈部解剖", system: "muscular" },
  { code: "giai-phau-than", nameVi: "Giải phẫu Thân trên", nameEn: "Trunk Anatomy", nameZh: "躯干解剖", system: "muscular" },
  { code: "giai-phau-canh-tay", nameVi: "Giải phẫu Cánh tay", nameEn: "Arm Anatomy", nameZh: "上肢解剖", system: "muscular" },
  { code: "giai-phau-dai-vai", nameVi: "Giải phẫu Đai vai – Nách", nameEn: "Shoulder Girdle & Axilla", nameZh: "肩带与腋区解剖", system: "muscular" },
  { code: "giai-phau-cang-tay", nameVi: "Giải phẫu Cẳng tay – Bàn tay", nameEn: "Forearm & Hand Anatomy", nameZh: "前臂与手解剖", system: "muscular" },
  { code: "giai-phau-ban-tay", nameVi: "Bàn tay chi tiết", nameEn: "The Hand in Detail", nameZh: "手部精细解剖", system: "muscular" },
  { code: "khop-vai-khuyu", nameVi: "Khớp vai và khớp khuỷu", nameEn: "Shoulder & Elbow Joints", nameZh: "肩关节与肘关节", system: "skeletal" },
  { code: "so-nen-so", nameVi: "Sọ và nền sọ", nameEn: "Skull & Cranial Base", nameZh: "颅骨与颅底", system: "skeletal" },
  { code: "hoc-mat", nameVi: "Mắt và hốc mắt", nameEn: "The Eye & Orbit", nameZh: "眼与眼眶", system: "visual" },
  { code: "tai-day-du", nameVi: "Tai ngoài – giữa – trong", nameEn: "Outer, Middle & Inner Ear", nameZh: "外耳·中耳·内耳", system: "auditory" },
  { code: "mui-xoang", nameVi: "Mũi và xoang cạnh mũi", nameEn: "Nose & Paranasal Sinuses", nameZh: "鼻与鼻窦", system: "respiratory" },
  { code: "mieng-luoi-rang", nameVi: "Miệng, lưỡi và răng", nameEn: "Mouth, Tongue & Teeth", nameZh: "口腔·舌·牙", system: "digestive" },
  { code: "hau-thanh-quan", nameVi: "Hầu và thanh quản", nameEn: "Pharynx & Larynx", nameZh: "咽与喉", system: "respiratory" },
  { code: "co-hoanh-day-du", nameVi: "Cơ hoành và cơ hô hấp", nameEn: "Diaphragm & Respiratory Muscles", nameZh: "膈肌与呼吸肌", system: "respiratory" },
  { code: "thanh-bung", nameVi: "Thành bụng", nameEn: "The Abdominal Wall", nameZh: "腹壁", system: "muscular" },
  { code: "dai-nao", nameVi: "Đại não: thuỳ, hồi và não thất", nameEn: "Cerebrum: Lobes, Gyri & Ventricles", nameZh: "大脑：脑叶、脑回与脑室", system: "nervous" },
  { code: "than-nao-day-so-full", nameVi: "Thân não và nhân dây thần kinh sọ", nameEn: "Brainstem & Cranial Nerve Nuclei", nameZh: "脑干与脑神经核", system: "nervous" },
  { code: "tieu-nao-day-du", nameVi: "Tiểu não", nameEn: "The Cerebellum", nameZh: "小脑", system: "nervous" },
  { code: "tuy-song-dam-roi", nameVi: "Tuỷ sống và các đám rối thần kinh", nameEn: "Spinal Cord & Nerve Plexuses", nameZh: "脊髓与神经丛", system: "nervous" },
  { code: "he-dong-mach-chu", nameVi: "Cây động mạch chủ và vòng Willis", nameEn: "The Aortic Tree & Circle of Willis", nameZh: "主动脉树与Willis环", system: "cardiovascular" },
  { code: "he-bach-huyet", nameVi: "Hệ bạch huyết", nameEn: "The Lymphatic System", nameZh: "淋巴系统", system: "cardiovascular" },
  { code: "tim-day-du", nameVi: "Tim: buồng, van và mạch vành", nameEn: "The Heart: Chambers, Valves & Coronaries", nameZh: "心脏：心腔、瓣膜与冠脉", system: "cardiovascular" },
  { code: "phoi-cay-phe-quan", nameVi: "Phổi và cây phế quản", nameEn: "Lungs & Bronchial Tree", nameZh: "肺与支气管树", system: "respiratory" },
  { code: "trung-that", nameVi: "Trung thất", nameEn: "The Mediastinum", nameZh: "纵隔", system: "respiratory" },
  { code: "gan-duong-mat", nameVi: "Gan và đường mật", nameEn: "Liver & Biliary Tree", nameZh: "肝与胆道", system: "digestive" },
  { code: "da-day-ta-trang", nameVi: "Dạ dày và tá tràng", nameEn: "Stomach & Duodenum", nameZh: "胃与十二指肠", system: "digestive" },
  { code: "ruot-non-ruot-gia", nameVi: "Ruột non và ruột già", nameEn: "Small & Large Intestine", nameZh: "小肠与大肠", system: "digestive" },
  { code: "tuy-lach", nameVi: "Tuỵ và lách", nameEn: "Pancreas & Spleen", nameZh: "胰与脾", system: "digestive" },
  { code: "than-nieu-quan", nameVi: "Thận, niệu quản và tuyến thượng thận", nameEn: "Kidneys, Ureters & Adrenal Glands", nameZh: "肾·输尿管·肾上腺", system: "urinary" },
  { code: "phuc-mac-mac-treo", nameVi: "Phúc mạc và mạc treo", nameEn: "Peritoneum & Mesenteries", nameZh: "腹膜与系膜", system: "digestive" },
  { code: "khop-goi", nameVi: "Khớp gối", nameEn: "The Knee Joint", nameZh: "膝关节", system: "skeletal" },
  { code: "khop-hang-dui", nameVi: "Khớp háng và vùng đùi", nameEn: "Hip Joint & Thigh", nameZh: "髋关节与大腿", system: "muscular" },
  { code: "cang-chan-ban-chan", nameVi: "Cẳng chân và bàn chân", nameEn: "Leg & Foot", nameZh: "小腿与足", system: "muscular" },
  { code: "co-vung-gay", nameVi: "Vùng gáy và cơ sau cổ", nameEn: "The Nuchal Region & Posterior Neck Muscles", nameZh: "项区与颈后肌群", system: "muscular" },
  { code: "khop-uc-don", nameVi: "Khớp ức đòn", nameEn: "The Sternoclavicular Joint", nameZh: "胸锁关节", system: "skeletal" },
  { code: "dong-mach-chi-tren", nameVi: "Cây động mạch chi trên", nameEn: "Arterial Tree of the Upper Limb", nameZh: "上肢动脉树", system: "cardiovascular" },
  { code: "tinh-mach-chi-tren", nameVi: "Hệ tĩnh mạch chi trên", nameEn: "Veins of the Upper Limb", nameZh: "上肢静脉系统", system: "cardiovascular" },
  { code: "dong-mach-chi-duoi", nameVi: "Cây động mạch chi dưới", nameEn: "Arterial Tree of the Lower Limb", nameZh: "下肢动脉树", system: "cardiovascular" },
  { code: "ho-khuyu", nameVi: "Hố khuỷu", nameEn: "The Cubital Fossa", nameZh: "肘窝", system: "muscular" },
  { code: "mach-mac-treo", nameVi: "Mạch mạc treo và ruột", nameEn: "Mesenteric Vessels & the Gut", nameZh: "肠系膜血管与肠管", system: "digestive" },
  { code: "goc-cau-tieu-nao", nameVi: "Góc cầu tiểu não", nameEn: "The Cerebellopontine Angle", nameZh: "桥小脑角", system: "nervous" },
  { code: "dai-chau-chay", nameVi: "Dải chậu chày và vùng đùi ngoài", nameEn: "The Iliotibial Tract & Lateral Thigh", nameZh: "髂胫束与大腿外侧", system: "muscular" },
  { code: "than-kinh-toa", nameVi: "Đường đi thần kinh toạ", nameEn: "Course of the Sciatic Nerve", nameZh: "坐骨神经走行", system: "nervous" },
  { code: "can-nguc-that-lung", nameVi: "Cân ngực – thắt lưng và khối cơ dựng sống", nameEn: "Thoracolumbar Fascia & the Erector Spinae", nameZh: "胸腰筋膜与竖脊肌", system: "muscular" },
  { code: "moc-xuong-chi-tren", nameVi: "Mốc bám cơ chi trên", nameEn: "Muscle Attachments of the Upper Limb", nameZh: "上肢肌肉附着点", system: "skeletal" },
  { code: "moc-xuong-chi-duoi", nameVi: "Mốc bám cơ chi dưới", nameEn: "Muscle Attachments of the Lower Limb", nameZh: "下肢肌肉附着点", system: "skeletal" },
  { code: "chau-hong-day-chau", nameVi: "Chậu hông và đáy chậu", nameEn: "Pelvis & Perineum", nameZh: "骨盆与会阴", system: "skeletal" },
  { code: "vung-lung", nameVi: "Vùng lưng và cơ lưng", nameEn: "The Back & Its Muscles", nameZh: "背部与背肌", system: "muscular" },
  { code: "thanh-nguc", nameVi: "Thành ngực và khoang gian sườn", nameEn: "Thoracic Wall & Intercostal Space", nameZh: "胸壁与肋间隙", system: "skeletal" },
  { code: "vai-ho-nach", nameVi: "Vai và hố nách", nameEn: "Shoulder & Axilla", nameZh: "肩部与腋窝", system: "muscular" },
  { code: "vung-ben", nameVi: "Vùng bẹn và ống bẹn", nameEn: "Inguinal Region & Canal", nameZh: "腹股沟区与腹股沟管", system: "muscular" },
  { code: "co-mat-than-kinh-vii", nameVi: "Cơ bám da mặt và thần kinh VII", nameEn: "Facial Muscles & the Facial Nerve", nameZh: "面部表情肌与面神经", system: "muscular" },
  { code: "khop-thai-duong-ham", nameVi: "Khớp thái dương hàm và cơ nhai", nameEn: "Temporomandibular Joint & Muscles of Mastication", nameZh: "颞下颌关节与咀嚼肌", system: "skeletal" },
  { code: "cot-song-co", nameVi: "Cột sống cổ", nameEn: "The Cervical Spine", nameZh: "颈椎", system: "skeletal" },
  { code: "cot-song-that-lung", nameVi: "Cột sống thắt lưng", nameEn: "The Lumbar Spine", nameZh: "腰椎", system: "skeletal" },
  { code: "nao-that-mang-nao", nameVi: "Não thất và màng não", nameEn: "Ventricles & Meninges", nameZh: "脑室与脑膜", system: "nervous" },
  { code: "he-tinh-mach-chu-cua", nameVi: "Hệ tĩnh mạch chủ và tĩnh mạch cửa", nameEn: "Caval & Portal Venous Systems", nameZh: "腔静脉与门静脉系统", system: "cardiovascular" },
  { code: "tuyen-noi-tiet", nameVi: "Tuyến nội tiết và mốc cột sống", nameEn: "Endocrine Glands & Vertebral Landmarks", nameZh: "内分泌腺与脊柱定位标志", system: "endocrine" },
  { code: "dam-roi-that-lung-cung", nameVi: "Đám rối thắt lưng – cùng", nameEn: "Lumbosacral Plexus", nameZh: "腰骶丛", system: "nervous" },
  { code: "co-tay-ong-co-tay", nameVi: "Cổ tay và ống cổ tay", nameEn: "Wrist & Carpal Tunnel", nameZh: "腕与腕管", system: "skeletal" },
  { code: "vung-mong", nameVi: "Vùng mông", nameEn: "The Gluteal Region", nameZh: "臀区", system: "muscular" },
  { code: "co-quan-sinh-duc-nam", nameVi: "Cơ quan sinh dục nam", nameEn: "Male Genital Organs", nameZh: "男性生殖器官", system: "reproductive-male" },
  { code: "tuyen-nuoc-bot", nameVi: "Tuyến nước bọt và vùng mang tai", nameEn: "Salivary Glands & Parotid Region", nameZh: "唾液腺与腮腺区", system: "digestive" },
  { code: "xoang-tinh-mach-mang-cung", nameVi: "Xoang tĩnh mạch màng cứng", nameEn: "Dural Venous Sinuses", nameZh: "硬脑膜静脉窦", system: "cardiovascular" },
  { code: "ho-khoeo", nameVi: "Hố khoeo", nameEn: "The Popliteal Fossa", nameZh: "腘窝", system: "muscular" },
  { code: "tam-giac-co", nameVi: "Các tam giác cổ", nameEn: "Triangles of the Neck", nameZh: "颈部三角", system: "muscular" },
  { code: "khoang-sau-phuc-mac", nameVi: "Khoang sau phúc mạc", nameEn: "The Retroperitoneum", nameZh: "腹膜后间隙", system: "urinary" },
  { code: "khop-khuyu", nameVi: "Khớp khuỷu", nameEn: "The Elbow Joint", nameZh: "肘关节", system: "skeletal" },
  { code: "khop-co-chan", nameVi: "Khớp cổ chân", nameEn: "The Ankle Joint", nameZh: "踝关节", system: "skeletal" },
  { code: "khop-hang", nameVi: "Khớp háng", nameEn: "The Hip Joint", nameZh: "髋关节", system: "skeletal" },
  { code: "cot-song-nguc", nameVi: "Cột sống ngực và khớp sườn–đốt sống", nameEn: "Thoracic Spine & Costovertebral Joints", nameZh: "胸椎与肋椎关节", system: "skeletal" },
  { code: "ban-chan-chi-tiet", nameVi: "Bàn chân chi tiết", nameEn: "The Foot in Detail", nameZh: "足部精细解剖", system: "skeletal" },
  { code: "dam-roi-canh-tay", nameVi: "Đám rối thần kinh cánh tay", nameEn: "The Brachial Plexus", nameZh: "臂丛", system: "nervous" },
  { code: "than-kinh-tu-chu", nameVi: "Thần kinh tự chủ: chuỗi hạch giao cảm và dây X", nameEn: "Autonomic Nerves: Sympathetic Trunk and Vagus", nameZh: "自主神经：交感干与迷走神经", system: "nervous" },
  { code: "duong-thi-giac", nameVi: "Đường dẫn truyền thị giác", nameEn: "The Visual Pathway", nameZh: "视觉传导通路", system: "visual" },
  { code: "dong-mach-canh", nameVi: "Động mạch cảnh và tam giác cảnh", nameEn: "Carotid Arteries & the Carotid Triangle", nameZh: "颈动脉与颈动脉三角", system: "cardiovascular" },
  { code: "hach-co", nameVi: "Hạch bạch huyết vùng cổ", nameEn: "Cervical Lymph Nodes", nameZh: "颈部淋巴结", system: "cardiovascular" },
  { code: "tuyen-giap", nameVi: "Tuyến giáp và tuyến cận giáp", nameEn: "Thyroid & Parathyroid Glands", nameZh: "甲状腺与甲状旁腺", system: "endocrine" },
  { code: "vung-nguc-tuyen-vu", nameVi: "Vùng ngực trước và tuyến vú", nameEn: "Pectoral Region & the Breast", nameZh: "胸前区与乳房", system: "muscular" },
  { code: "thuc-quan", nameVi: "Thực quản", nameEn: "The Oesophagus", nameZh: "食管", system: "digestive" },
  { code: "mang-phoi", nameVi: "Màng phổi và khoang màng phổi", nameEn: "The Pleura & Pleural Cavity", nameZh: "胸膜与胸膜腔", system: "respiratory" },
  { code: "bang-quang-tien-liet", nameVi: "Bàng quang, tuyến tiền liệt và đường tiểu dưới", nameEn: "Bladder, Prostate & Lower Urinary Tract", nameZh: "膀胱、前列腺与下尿路", system: "urinary" },
  { code: "khop-cung-chau", nameVi: "Khớp cùng chậu và vòng dây chằng chậu", nameEn: "Sacroiliac Joint & the Pelvic Ligaments", nameZh: "骶髂关节与骨盆韧带环", system: "skeletal" },
  { code: "chop-xoay-vai", nameVi: "Chóp xoay và khớp vai", nameEn: "The Rotator Cuff & Shoulder Joint", nameZh: "肩袖与肩关节", system: "muscular" },
  { code: "gan-got-ong-co-chan", nameVi: "Gân gót và ống cổ chân", nameEn: "Achilles Tendon & the Tarsal Tunnel", nameZh: "跟腱与踝管", system: "muscular" },
  { code: "tinh-mach-hien", nameVi: "Hệ tĩnh mạch nông chi dưới", nameEn: "Superficial Veins of the Lower Limb", nameZh: "下肢浅静脉系统", system: "cardiovascular" },
  { code: "than-kinh-sinh-ba", nameVi: "Thần kinh sinh ba (V)", nameEn: "The Trigeminal Nerve (V)", nameZh: "三叉神经（V）", system: "nervous" },
  { code: "le-dao", nameVi: "Bộ lệ và đường dẫn nước mắt", nameEn: "The Lacrimal Apparatus", nameZh: "泪器与泪道", system: "visual" },
  { code: "ho-duoi-thai-duong", nameVi: "Hố dưới thái dương", nameEn: "The Infratemporal Fossa", nameZh: "颞下窝", system: "muscular" },
  { code: "ong-song-that-lung", nameVi: "Ống sống thắt lưng và bao màng cứng", nameEn: "Lumbar Spinal Canal & the Dural Sac", nameZh: "腰段椎管与硬膜囊", system: "nervous" },
  { code: "tam-giac-dui", nameVi: "Tam giác đùi và ống cơ khép", nameEn: "The Femoral Triangle & Adductor Canal", nameZh: "股三角与收肌管", system: "muscular" },
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


  // Mã cấu trúc lạ = lỗi dữ liệu, phải dừng. Nhưng KHÔNG có cấu trúc là hợp lệ:
  // 22 bệnh huyết học và hồi sức không thuộc về một cấu trúc 3D đơn lẻ nào.
  const unknown = seedPathologies
    .filter((p) => p.structure && !structureIdByCode.has(p.structure))
    .map((p) => `${p.slug} → ${p.structure}`);
  if (unknown.length) {
    throw new Error(`Mã cấu trúc không tồn tại:\n  ${unknown.join('\n  ')}`);
  }

  for (const p of seedPathologies) {
    const data = {
      nameVi: p.nameVi,
      nameEn: p.nameEn,
      nameZh: p.nameZh,
      icdCode: p.icdCode ?? null,
      clinicalSystem: p.clinicalSystem,
      severity: p.severity ?? null,
      source: p.source,
      sourcePage: p.sourcePage ?? null,
      needsReview: true,
      structureId: p.structure ? (structureIdByCode.get(p.structure) ?? null) : null,
    };
    await prisma.pathology.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
  }

  // Dọn bản ghi cũ không còn trong danh sách (bản seed đầu chưa có slug).
  await prisma.pathology.deleteMany({
    where: { slug: { notIn: seedPathologies.map((p) => p.slug) } },
  });

  const known = new Set(seedPathologies.map((p) => p.slug));

  // Vị trí tổn thương trên model toàn thân. Tên mesh đã được
  // `cd Soma_Fe && npm run verify:lesions` đối chiếu với file .glb thật.
  const unknownLesion = lesionMap.filter((l) => !known.has(l.slug)).map((l) => l.slug);
  if (unknownLesion.length) throw new Error(`lesion-map trỏ slug không tồn tại: ${unknownLesion.join(", ")}`);
  for (const l of lesionMap) {
    await prisma.pathology.update({
      where: { slug: l.slug },
      data: { lesionMesh: l.mesh, lesionSystem: l.system },
    });
  }

  // Nội dung bệnh học — tóm lược tự biên soạn, tách theo ngôn ngữ.
  const orphan = seedContent.filter((c) => !known.has(c.slug)).map((c) => c.slug);
  if (orphan.length) throw new Error(`Nội dung trỏ tới slug không tồn tại: ${orphan.join(", ")}`);

  for (const c of seedContent) {
    const target = await prisma.pathology.findUnique({ where: { slug: c.slug } });
    if (!target) continue;
    const body = {
      description: c.description ?? null,
      clinical: c.clinical ?? null,
      imaging: c.imaging ?? null,
      progression: c.progression ?? null,
      treatment: c.treatment ?? null,
    };
    await prisma.pathologyContent.upsert({
      where: { pathologyId_locale: { pathologyId: target.id, locale: c.locale } },
      update: body,
      create: { pathologyId: target.id, locale: c.locale, ...body },
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
      `${seedPathologies.length} pathologies (${seedContent.length} có nội dung, ${lesionMap.length} có vị trí tổn thương), ${quizzes.length} quizzes.`,
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
