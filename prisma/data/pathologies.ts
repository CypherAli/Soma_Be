/**
 * 103 bệnh dựng từ MỤC LỤC THẬT của Bệnh học Nội khoa tập 1–2 (ĐH Y Hà Nội,
 * 2020), cộng 3 bệnh ngoại khoa đã có sẵn từ bản seed đầu.
 *
 * NGUYÊN TẮC — đọc trước khi sửa:
 *  • `nameVi` và `sourcePage` lấy nguyên văn từ mục lục, không diễn giải.
 *  • `nameEn` / `nameZh` là THUẬT NGỮ DỊCH, chưa có người chuyên môn duyệt →
 *    mọi bản ghi ở đây mang `needsReview: true`.
 *  • `icdCode` là **ICD-10** — hệ Bộ Y tế Việt Nam đang dùng, không phải ICD-11.
 *    Ghi ở mức chương/nhóm (3 ký tự) hoặc mục con khi bệnh ứng đúng một mục.
 *    Chương sách trải nhiều mã thì ghi DẢI (vd 'E10–E14', 'D50–D64').
 *    4 bài để trống vì không quy về mã nào cho đúng: hội chứng trung thất,
 *    rối loạn nhịp tim (trải I44–I49), nhiễm khuẩn cơ xương khớp, bệnh lý
 *    phần mềm cạnh khớp. Thà trống còn hơn gán sai.
 *  • `severity` chỉ đặt khi suy ra được từ chính cách sách xếp chương: các bài
 *    thuộc "Hồi sức cấp cứu" là cấp cứu theo định nghĩa. Còn lại để trống thay
 *    vì tự phán đoán mức độ nặng cho từng bệnh.
 *  • `structure` để trống khi bệnh không thuộc về một cấu trúc 3D đơn lẻ
 *    (huyết học, bệnh tự miễn hệ thống, rối loạn điện giải…).
 *
 * Nội dung bệnh học (mô tả, lâm sàng, hình ảnh, điều trị) KHÔNG nằm ở đây —
 * đổ riêng qua bảng `pathology_content` sau khi biên soạn và đối chiếu nguồn.
 */

export type SeedPathology = {
  slug: string;
  /** ICD-10 (không phải ICD-11). Bỏ trống nếu không quy về một mã cho đúng. */
  icdCode?: string;
  nameVi: string;
  nameEn: string;
  nameZh: string;
  clinicalSystem: string;
  source: string;
  sourcePage?: number;
  /** mã cấu trúc 3D chính; bỏ trống nếu không neo được */
  structure?: string;
  severity?: 'info' | 'warning' | 'critical';
};

const T1 = 'Bệnh học Nội khoa, tập 1 — Đại học Y Hà Nội (2020)';
const T2 = 'Bệnh học Nội khoa, tập 2 — Đại học Y Hà Nội (2020)';

export const seedPathologies: SeedPathology[] = [
  // ─── Hô hấp (15) ────────────────────────────────────────────────────────
  { slug: 'viem-phe-quan-cap', icdCode: 'J20', nameVi: 'Viêm phế quản cấp', nameEn: 'Acute bronchitis', nameZh: '急性支气管炎', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 9, structure: 'giai-phau-phoi' },
  { slug: 'ap-xe-phoi', icdCode: 'J85', nameVi: 'Áp xe phổi', nameEn: 'Lung abscess', nameZh: '肺脓肿', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 14, structure: 'giai-phau-phoi' },
  { slug: 'copd', icdCode: 'J44', nameVi: 'Bệnh phổi tắc nghẽn mạn tính', nameEn: 'Chronic obstructive pulmonary disease', nameZh: '慢性阻塞性肺疾病', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 28, structure: 'giai-phau-phoi' },
  { slug: 'hen-phe-quan', icdCode: 'J45', nameVi: 'Hen phế quản', nameEn: 'Asthma', nameZh: '支气管哮喘', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 50, structure: 'giai-phau-phoi' },
  { slug: 'ngung-tho-khi-ngu', icdCode: 'G47.3', nameVi: 'Hội chứng ngừng thở khi ngủ', nameEn: 'Sleep apnoea syndrome', nameZh: '睡眠呼吸暂停综合征', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 63, structure: 'thanh-quan' },
  { slug: 'viem-phoi-benh-vien', icdCode: 'J18', nameVi: 'Viêm phổi bệnh viện', nameEn: 'Hospital-acquired pneumonia', nameZh: '医院获得性肺炎', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 69, structure: 'giai-phau-phoi' },
  { slug: 'viem-phoi-cong-dong', icdCode: 'J18', nameVi: 'Viêm phổi cộng đồng', nameEn: 'Community-acquired pneumonia', nameZh: '社区获得性肺炎', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 74, structure: 'giai-phau-phoi' },
  { slug: 'lao-phoi', icdCode: 'A15', nameVi: 'Lao phổi', nameEn: 'Pulmonary tuberculosis', nameZh: '肺结核', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 89, structure: 'giai-phau-phoi' },
  { slug: 'gian-phe-quan', icdCode: 'J47', nameVi: 'Giãn phế quản', nameEn: 'Bronchiectasis', nameZh: '支气管扩张症', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 101, structure: 'giai-phau-phoi' },
  { slug: 'tam-phe-man', icdCode: 'I27', nameVi: 'Tâm phế mạn', nameEn: 'Chronic cor pulmonale', nameZh: '慢性肺源性心脏病', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 113, structure: 'giai-phau-tim' },
  { slug: 'tran-dich-mang-phoi', icdCode: 'J90', nameVi: 'Tràn dịch màng phổi', nameEn: 'Pleural effusion', nameZh: '胸腔积液', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 125, structure: 'giai-phau-phoi' },
  { slug: 'tran-khi-mang-phoi', icdCode: 'J93', nameVi: 'Tràn khí màng phổi', nameEn: 'Pneumothorax', nameZh: '气胸', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 137, structure: 'giai-phau-phoi' },
  { slug: 'hoi-chung-trung-that', nameVi: 'Hội chứng trung thất', nameEn: 'Mediastinal syndrome', nameZh: '纵隔综合征', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 148, structure: 'trung-that' /* hội chứng do khối choán chỗ trong trung thất — atlas nay có model trung thất riêng */ },
  { slug: 'ung-thu-phoi', icdCode: 'C34', nameVi: 'Ung thư phổi', nameEn: 'Lung cancer', nameZh: '肺癌', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 159, structure: 'giai-phau-phoi' },
  { slug: 'ho-ra-mau', icdCode: 'R04.2', nameVi: 'Ho ra máu', nameEn: 'Haemoptysis', nameZh: '咯血', clinicalSystem: 'Hô hấp', source: T1, sourcePage: 171, structure: 'giai-phau-phoi' },

  // ─── Tim mạch (8) ───────────────────────────────────────────────────────
  { slug: 'hep-van-hai-la', icdCode: 'I05.0', nameVi: 'Hẹp van hai lá', nameEn: 'Mitral stenosis', nameZh: '二尖瓣狭窄', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 183, structure: 'mat-cat-vanh-tim' },
  { slug: 'tang-huyet-ap', icdCode: 'I10', nameVi: 'Tăng huyết áp', nameEn: 'Hypertension', nameZh: '高血压', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 200, structure: 'mat-cat-dong-mach' },
  { slug: 'nhoi-mau-co-tim', icdCode: 'I21', nameVi: 'Nhồi máu cơ tim và hội chứng vành cấp', nameEn: 'Myocardial infarction and acute coronary syndrome', nameZh: '心肌梗死与急性冠脉综合征', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 227, structure: 'dong-mach-vanh', severity: 'critical' },
  { slug: 'suy-tim', icdCode: 'I50', nameVi: 'Suy tim', nameEn: 'Heart failure', nameZh: '心力衰竭', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 256, structure: 'giai-phau-tim' },
  { slug: 'viem-noi-tam-mac-nhiem-khuan', icdCode: 'I33', nameVi: 'Viêm nội tâm mạc nhiễm khuẩn', nameEn: 'Infective endocarditis', nameZh: '感染性心内膜炎', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 280, structure: 'mat-cat-vanh-tim' },
  { slug: 'viem-mang-ngoai-tim', icdCode: 'I30', nameVi: 'Viêm màng ngoài tim', nameEn: 'Pericarditis', nameZh: '心包炎', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 297, structure: 'giai-phau-tim' },
  { slug: 'roi-loan-nhip-tim', nameVi: 'Rối loạn nhịp tim thường gặp', nameEn: 'Common cardiac arrhythmias', nameZh: '常见心律失常', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 309, structure: 'giai-phau-tim' },
  { slug: 'huyet-khoi-tinh-mach-sau', icdCode: 'I80.2', nameVi: 'Huyết khối tĩnh mạch sâu chi dưới', nameEn: 'Deep vein thrombosis of the lower limb', nameZh: '下肢深静脉血栓形成', clinicalSystem: 'Tim mạch', source: T1, sourcePage: 349, structure: 'mat-cat-tinh-mach' },

  // ─── Thận – Tiết niệu (11) ──────────────────────────────────────────────
  { slug: 'viem-cau-than-cap-sau-lien-cau', icdCode: 'N00', nameVi: 'Viêm cầu thận cấp sau nhiễm liên cầu', nameEn: 'Post-streptococcal acute glomerulonephritis', nameZh: '链球菌感染后急性肾小球肾炎', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 387, structure: 'he-tiet-nieu' },
  { slug: 'hoi-chung-than-hu', icdCode: 'N04', nameVi: 'Hội chứng thận hư', nameEn: 'Nephrotic syndrome', nameZh: '肾病综合征', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 394, structure: 'he-tiet-nieu' },
  { slug: 'benh-than-lupus', icdCode: 'M32.1', nameVi: 'Bệnh thận lupus', nameEn: 'Lupus nephritis', nameZh: '狼疮性肾炎', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 404, structure: 'he-tiet-nieu' },
  { slug: 'benh-than-iga', icdCode: 'N02', nameVi: 'Bệnh thận IgA', nameEn: 'IgA nephropathy', nameZh: 'IgA 肾病', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 417, structure: 'he-tiet-nieu' },
  { slug: 'nhiem-khuan-tiet-nieu', icdCode: 'N39.0', nameVi: 'Nhiễm khuẩn tiết niệu', nameEn: 'Urinary tract infection', nameZh: '尿路感染', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 425, structure: 'he-tiet-nieu' },
  { slug: 'benh-than-da-nang', icdCode: 'Q61', nameVi: 'Bệnh thận đa nang', nameEn: 'Polycystic kidney disease', nameZh: '多囊肾病', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 449, structure: 'he-tiet-nieu' },
  { slug: 'soi-tiet-nieu', icdCode: 'N20', nameVi: 'Sỏi tiết niệu', nameEn: 'Urolithiasis', nameZh: '尿路结石', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 456, structure: 'he-tiet-nieu' },
  { slug: 'ton-thuong-than-cap', icdCode: 'N17', nameVi: 'Tổn thương thận cấp', nameEn: 'Acute kidney injury', nameZh: '急性肾损伤', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 474, structure: 'he-tiet-nieu' },
  { slug: 'benh-than-man', icdCode: 'N18', nameVi: 'Bệnh thận mạn và suy thận mạn tính', nameEn: 'Chronic kidney disease and chronic renal failure', nameZh: '慢性肾脏病与慢性肾衰竭', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 493, structure: 'he-tiet-nieu' },
  { slug: 'suy-than-giai-doan-cuoi', icdCode: 'N18.5', nameVi: 'Suy thận giai đoạn cuối — điều trị bảo tồn và thay thế thận', nameEn: 'End-stage renal disease — conservative and replacement therapy', nameZh: '终末期肾病——保守治疗与肾脏替代治疗', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 508, structure: 'he-tiet-nieu' },
  { slug: 'suy-than-cap', icdCode: 'N17', nameVi: 'Suy thận cấp', nameEn: 'Acute renal failure', nameZh: '急性肾衰竭', clinicalSystem: 'Thận - Tiết niệu', source: T1, sourcePage: 523, structure: 'he-tiet-nieu' },

  // ─── Lão khoa (4) ───────────────────────────────────────────────────────
  { slug: 'sa-sut-tri-tue', icdCode: 'F03', nameVi: 'Sa sút trí tuệ', nameEn: 'Dementia', nameZh: '痴呆', clinicalSystem: 'Lão khoa', source: T1, sourcePage: 560, structure: 'gian-nao-he-vien' },
  { slug: 'suy-tinh-mach-man-tinh', icdCode: 'I87.2', nameVi: 'Suy tĩnh mạch mạn tính', nameEn: 'Chronic venous insufficiency', nameZh: '慢性静脉功能不全', clinicalSystem: 'Lão khoa', source: T1, sourcePage: 576, structure: 'mat-cat-tinh-mach' },
  { slug: 'phi-dai-lanh-tinh-tuyen-tien-liet', icdCode: 'N40', nameVi: 'Phì đại lành tính tuyến tiền liệt', nameEn: 'Benign prostatic hyperplasia', nameZh: '良性前列腺增生', clinicalSystem: 'Lão khoa', source: T1, sourcePage: 592, structure: 'he-sinh-san-nam' },
  { slug: 'dot-quy-nao', icdCode: 'I64', nameVi: 'Đột quỵ não', nameEn: 'Stroke', nameZh: '脑卒中', clinicalSystem: 'Lão khoa', source: T1, sourcePage: 599, structure: 'da-giac-willis', severity: 'critical' },

  // ─── Tiêu hoá (13) ──────────────────────────────────────────────────────
  { slug: 'viem-gan-b-man', icdCode: 'B18.1', nameVi: 'Viêm gan virus B mạn tính', nameEn: 'Chronic hepatitis B', nameZh: '慢性乙型病毒性肝炎', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 9, structure: 'giai-phau-gan' },
  { slug: 'viem-gan-c', icdCode: 'B18.2', nameVi: 'Viêm gan virus C', nameEn: 'Hepatitis C', nameZh: '丙型病毒性肝炎', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 19, structure: 'giai-phau-gan' },
  { slug: 'xo-gan', icdCode: 'K74', nameVi: 'Xơ gan', nameEn: 'Cirrhosis of the liver', nameZh: '肝硬化', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 32, structure: 'giai-phau-gan', severity: 'warning' },
  { slug: 'ung-thu-bieu-mo-te-bao-gan', icdCode: 'C22.0', nameVi: 'Ung thư biểu mô tế bào gan', nameEn: 'Hepatocellular carcinoma', nameZh: '肝细胞癌', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 45, structure: 'giai-phau-gan' },
  { slug: 'loet-da-day-ta-trang', icdCode: 'K27', nameVi: 'Loét dạ dày tá tràng', nameEn: 'Peptic ulcer disease', nameZh: '消化性溃疡', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 52, structure: 'mat-cat-da-day' },
  { slug: 'xhth-tang-ap-luc-tinh-mach-cua', icdCode: 'I85.0', nameVi: 'Xuất huyết tiêu hoá trên do tăng áp lực tĩnh mạch cửa', nameEn: 'Upper GI bleeding from portal hypertension', nameZh: '门静脉高压所致上消化道出血', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 59, structure: 'giai-phau-gan' },
  { slug: 'xhth-do-loet-da-day-ta-trang', icdCode: 'K27.4', nameVi: 'Xuất huyết tiêu hoá do loét dạ dày tá tràng', nameEn: 'Upper GI bleeding from peptic ulcer', nameZh: '消化性溃疡所致消化道出血', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 64, structure: 'mat-cat-da-day' },
  { slug: 'ap-xe-gan', icdCode: 'K75.0', nameVi: 'Áp xe gan', nameEn: 'Liver abscess', nameZh: '肝脓肿', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 72, structure: 'giai-phau-gan' },
  { slug: 'viem-tuy-cap', icdCode: 'K85', nameVi: 'Viêm tụy cấp', nameEn: 'Acute pancreatitis', nameZh: '急性胰腺炎', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 81, structure: 'giai-phau-tuy' },
  { slug: 'benh-gan-do-ruou', icdCode: 'K70', nameVi: 'Bệnh gan do rượu', nameEn: 'Alcoholic liver disease', nameZh: '酒精性肝病', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 92, structure: 'giai-phau-gan' },
  { slug: 'benh-tri', icdCode: 'K64', nameVi: 'Bệnh trĩ', nameEn: 'Haemorrhoids', nameZh: '痔', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 99, structure: 'co-that-hau-mon' },
  { slug: 'tao-bon', icdCode: 'K59.0', nameVi: 'Táo bón', nameEn: 'Constipation', nameZh: '便秘', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 102, structure: 'mat-cat-ruot-gia' },
  { slug: 'hoi-chung-ruot-kich-thich', icdCode: 'K58', nameVi: 'Hội chứng ruột kích thích', nameEn: 'Irritable bowel syndrome', nameZh: '肠易激综合征', clinicalSystem: 'Tiêu hóa', source: T2, sourcePage: 106, structure: 'mat-cat-ruot-gia' },

  // ─── Cơ xương khớp (18) ─────────────────────────────────────────────────
  { slug: 'viem-khop-dang-thap', icdCode: 'M06', nameVi: 'Viêm khớp dạng thấp', nameEn: 'Rheumatoid arthritis', nameZh: '类风湿关节炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 115, structure: 'ban-tay' },
  { slug: 'lupus-ban-do-he-thong', icdCode: 'M32', nameVi: 'Lupus ban đỏ hệ thống', nameEn: 'Systemic lupus erythematosus', nameZh: '系统性红斑狼疮', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 132 },
  { slug: 'xo-cung-bi', icdCode: 'M34', nameVi: 'Xơ cứng bì', nameEn: 'Systemic sclerosis', nameZh: '系统性硬化症', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 145 },
  { slug: 'viem-da-co-viem-da-co-tu-mien', icdCode: 'M33', nameVi: 'Viêm đa cơ và viêm da cơ tự miễn', nameEn: 'Polymyositis and dermatomyositis', nameZh: '多发性肌炎与皮肌炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 153, structure: 'co-dui-mong' },
  { slug: 'viem-cot-song-dinh-khop', icdCode: 'M45', nameVi: 'Viêm cột sống dính khớp', nameEn: 'Ankylosing spondylitis', nameZh: '强直性脊柱炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 160, structure: 'cot-song' },
  { slug: 'viem-khop-tu-phat-thieu-nien', icdCode: 'M08', nameVi: 'Bệnh viêm khớp tự phát thiếu niên', nameEn: 'Juvenile idiopathic arthritis', nameZh: '幼年特发性关节炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 171, structure: 'khop-goi' /* thể ít khớp hay gặp nhất ở trẻ và gối là khớp điển hình */ },
  { slug: 'benh-gout', icdCode: 'M10', nameVi: 'Bệnh gout', nameEn: 'Gout', nameZh: '痛风', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 182, structure: 'ban-chan' },
  { slug: 'thoai-hoa-khop', icdCode: 'M19', nameVi: 'Thoái hoá khớp', nameEn: 'Osteoarthritis', nameZh: '骨关节炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 202, structure: 'chi-duoi' },
  { slug: 'loang-xuong', icdCode: 'M81', nameVi: 'Loãng xương', nameEn: 'Osteoporosis', nameZh: '骨质疏松症', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 210, structure: 'cot-song' },
  { slug: 'benh-nhuoc-co', icdCode: 'G70.0', nameVi: 'Bệnh nhược cơ', nameEn: 'Myasthenia gravis', nameZh: '重症肌无力', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 221, structure: 'tuyen-noi-tiet' /* u hoặc tăng sản tuyến ức gặp ở phần lớn bệnh nhân — tuyến ức nằm trong model tuyến nội tiết */ },
  { slug: 'loan-duong-co', icdCode: 'G71.0', nameVi: 'Loạn dưỡng cơ', nameEn: 'Muscular dystrophy', nameZh: '肌营养不良', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 227, structure: 'co-dui-mong' },
  { slug: 'nhiem-khuan-co-xuong-khop', nameVi: 'Nhiễm khuẩn cơ xương khớp', nameEn: 'Musculoskeletal infection', nameZh: '骨与关节感染', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 235, structure: 'khop-goi' /* viêm khớp nhiễm khuẩn ở người lớn hay gặp nhất tại khớp gối */ },
  { slug: 'viem-co-nhiem-khuan', icdCode: 'M60.0', nameVi: 'Viêm cơ nhiễm khuẩn', nameEn: 'Pyomyositis', nameZh: '化脓性肌炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 245, structure: 'co-dui-mong' },
  { slug: 'viem-dia-dem-dot-song', icdCode: 'M46.4', nameVi: 'Viêm đĩa đệm đốt sống do vi khuẩn', nameEn: 'Bacterial spondylodiscitis', nameZh: '细菌性椎间盘炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 251, structure: 'cot-song' },
  { slug: 'thoat-vi-dia-dem-that-lung', icdCode: 'M51.1', nameVi: 'Đau vùng thắt lưng và đau thần kinh toạ do thoát vị đĩa đệm', nameEn: 'Low back pain and sciatica from disc herniation', nameZh: '椎间盘突出所致腰痛与坐骨神经痛', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 267, structure: 'cot-song' },
  { slug: 'viem-quanh-khop-vai', icdCode: 'M75', nameVi: 'Viêm quanh khớp vai', nameEn: 'Periarthritis of the shoulder', nameZh: '肩关节周围炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 281, structure: 'dai-vai-chi-tren' },
  { slug: 'viem-khop-phan-ung', icdCode: 'M02', nameVi: 'Viêm khớp phản ứng', nameEn: 'Reactive arthritis', nameZh: '反应性关节炎', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 292, structure: 'khop-goi' /* viêm ít khớp chi dưới, gối là khớp bị nhiều nhất */ },
  { slug: 'benh-ly-phan-mem-canh-khop', nameVi: 'Bệnh lý phần mềm cạnh khớp', nameEn: 'Periarticular soft tissue disorders', nameZh: '关节周围软组织病变', clinicalSystem: 'Cơ xương khớp', source: T2, sourcePage: 297, structure: 'he-mac' },

  // ─── Nội tiết (12) ──────────────────────────────────────────────────────
  { slug: 'dai-thao-nhat', icdCode: 'E23.2', nameVi: 'Đái tháo nhạt', nameEn: 'Diabetes insipidus', nameZh: '尿崩症', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 308, structure: 'he-noi-tiet' },
  { slug: 'hoi-chung-sheehan', icdCode: 'E23.0', nameVi: 'Hội chứng Sheehan', nameEn: "Sheehan's syndrome", nameZh: '席汉综合征', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 315, structure: 'he-noi-tiet' },
  { slug: 'benh-to-cac-vien-cuc', icdCode: 'E22.0', nameVi: 'Bệnh to các viễn cực', nameEn: 'Acromegaly', nameZh: '肢端肥大症', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 326, structure: 'he-noi-tiet' },
  { slug: 'buou-giap-don-thuan', icdCode: 'E04', nameVi: 'Bướu giáp đơn thuần', nameEn: 'Simple goitre', nameZh: '单纯性甲状腺肿', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 335, structure: 'he-noi-tiet' },
  { slug: 'cuong-giap', icdCode: 'E05', nameVi: 'Bệnh cường giáp', nameEn: 'Hyperthyroidism', nameZh: '甲状腺功能亢进症', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 342, structure: 'he-noi-tiet' },
  { slug: 'suy-giap', icdCode: 'E03', nameVi: 'Bệnh suy giáp', nameEn: 'Hypothyroidism', nameZh: '甲状腺功能减退症', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 353, structure: 'he-noi-tiet' },
  { slug: 'dai-thao-duong', icdCode: 'E10–E14', nameVi: 'Đái tháo đường', nameEn: 'Diabetes mellitus', nameZh: '糖尿病', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 361, structure: 'giai-phau-tuy' },
  { slug: 'ha-glucose-huyet', icdCode: 'E16.2', nameVi: 'Hạ glucose huyết', nameEn: 'Hypoglycaemia', nameZh: '低血糖症', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 383, structure: 'giai-phau-tuy' },
  { slug: 'hoi-chung-cushing', icdCode: 'E24', nameVi: 'Hội chứng Cushing', nameEn: "Cushing's syndrome", nameZh: '库欣综合征', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 387, structure: 'he-noi-tiet' },
  { slug: 'suy-thuong-than-man-tinh', icdCode: 'E27.1', nameVi: 'Suy thượng thận mạn tính', nameEn: 'Chronic adrenal insufficiency', nameZh: '慢性肾上腺皮质功能减退症', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 398, structure: 'he-noi-tiet' },
  { slug: 'cuong-aldosteron', icdCode: 'E26', nameVi: 'Cường aldosteron', nameEn: 'Hyperaldosteronism', nameZh: '醛固酮增多症', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 412, structure: 'he-noi-tiet' },
  { slug: 'u-tuy-thuong-than', icdCode: 'D35.0', nameVi: 'U tuỷ thượng thận', nameEn: 'Phaeochromocytoma', nameZh: '嗜铬细胞瘤', clinicalSystem: 'Nội tiết', source: T2, sourcePage: 417, structure: 'he-noi-tiet' },

  // ─── Huyết học (12) — chưa có cấu trúc 3D nào để neo ────────────────────
  { slug: 'thieu-mau', icdCode: 'D50–D64', nameVi: 'Thiếu máu', nameEn: 'Anaemia', nameZh: '贫血', clinicalSystem: 'Huyết học', source: T2, sourcePage: 430 },
  { slug: 'thieu-mau-tan-mau', icdCode: 'D55–D59', nameVi: 'Thiếu máu tan máu', nameEn: 'Haemolytic anaemia', nameZh: '溶血性贫血', clinicalSystem: 'Huyết học', source: T2, sourcePage: 439 },
  { slug: 'suy-tuy-xuong', icdCode: 'D61', nameVi: 'Suy tuỷ xương', nameEn: 'Aplastic anaemia', nameZh: '再生障碍性贫血', clinicalSystem: 'Huyết học', source: T2, sourcePage: 452 },
  { slug: 'xuat-huyet-giam-tieu-cau-vo-can', icdCode: 'D69.3', nameVi: 'Xuất huyết giảm tiểu cầu vô căn', nameEn: 'Immune thrombocytopenic purpura', nameZh: '特发性血小板减少性紫癜', clinicalSystem: 'Huyết học', source: T2, sourcePage: 458 },
  { slug: 'hemophilia', icdCode: 'D66–D67', nameVi: 'Bệnh hemophilia', nameEn: 'Haemophilia', nameZh: '血友病', clinicalSystem: 'Huyết học', source: T2, sourcePage: 463 },
  { slug: 'hoi-chung-roi-loan-sinh-tuy', icdCode: 'D46', nameVi: 'Hội chứng rối loạn sinh tuỷ', nameEn: 'Myelodysplastic syndrome', nameZh: '骨髓增生异常综合征', clinicalSystem: 'Huyết học', source: T2, sourcePage: 471 },
  { slug: 'lo-xe-mi-cap', icdCode: 'C95.0', nameVi: 'Lơ xê mi cấp', nameEn: 'Acute leukaemia', nameZh: '急性白血病', clinicalSystem: 'Huyết học', source: T2, sourcePage: 479 },
  { slug: 'lo-xe-mi-kinh-dong-bach-cau-hat', icdCode: 'C92.1', nameVi: 'Lơ xê mi kinh dòng bạch cầu hạt', nameEn: 'Chronic myeloid leukaemia', nameZh: '慢性髓细胞白血病', clinicalSystem: 'Huyết học', source: T2, sourcePage: 490 },
  { slug: 'da-hong-cau-tien-phat', icdCode: 'D45', nameVi: 'Bệnh đa hồng cầu tiên phát', nameEn: 'Polycythaemia vera', nameZh: '真性红细胞增多症', clinicalSystem: 'Huyết học', source: T2, sourcePage: 495 },
  { slug: 'tang-tieu-cau-tien-phat', icdCode: 'D47.3', nameVi: 'Tăng tiểu cầu tiên phát', nameEn: 'Essential thrombocythaemia', nameZh: '原发性血小板增多症', clinicalSystem: 'Huyết học', source: T2, sourcePage: 499 },
  { slug: 'da-u-tuy-xuong', icdCode: 'C90.0', nameVi: 'Bệnh đa u tuỷ xương', nameEn: 'Multiple myeloma', nameZh: '多发性骨髓瘤', clinicalSystem: 'Huyết học', source: T2, sourcePage: 504, structure: 'cot-song' /* tổn thương tiêu xương và xẹp đốt sống là biểu hiện xương hay gặp nhất */ },
  { slug: 'u-lympho-ac-tinh', icdCode: 'C81–C85', nameVi: 'U lympho ác tính', nameEn: 'Malignant lymphoma', nameZh: '恶性淋巴瘤', clinicalSystem: 'Huyết học', source: T2, sourcePage: 508, structure: 'he-bach-huyet' /* bệnh của hệ bạch huyết; model hệ bạch huyết cho thấy chuỗi hạch và lách */ },

  // ─── Hồi sức cấp cứu (10) — sách xếp vào chương cấp cứu ⇒ critical ──────
  { slug: 'phu-phoi-cap', icdCode: 'J81', nameVi: 'Phù phổi cấp', nameEn: 'Acute pulmonary oedema', nameZh: '急性肺水肿', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 534, structure: 'giai-phau-phoi', severity: 'critical' },
  { slug: 'soc', icdCode: 'R57', nameVi: 'Sốc', nameEn: 'Shock', nameZh: '休克', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 542, severity: 'critical' },
  { slug: 'ngo-doc-cap-thuong-gap', icdCode: 'T36–T65', nameVi: 'Một số ngộ độc cấp thường gặp', nameEn: 'Common acute poisonings', nameZh: '常见急性中毒', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 562, severity: 'critical' },
  { slug: 'roi-loan-toan-kiem', icdCode: 'E87.2–E87.4', nameVi: 'Rối loạn thăng bằng toan kiềm', nameEn: 'Acid–base disorders', nameZh: '酸碱平衡紊乱', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 582, severity: 'critical' },
  { slug: 'roi-loan-nuoc-natri', icdCode: 'E87.0–E87.1', nameVi: 'Rối loạn nước và natri', nameEn: 'Water and sodium disorders', nameZh: '水与钠代谢紊乱', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 592, severity: 'critical' },
  { slug: 'roi-loan-kali-mau', icdCode: 'E87.5–E87.6', nameVi: 'Rối loạn kali máu', nameEn: 'Potassium disorders', nameZh: '血钾紊乱', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 600, severity: 'critical' },
  { slug: 'ran-doc-can', icdCode: 'T63.0', nameVi: 'Rắn độc cắn', nameEn: 'Venomous snakebite', nameZh: '毒蛇咬伤', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 608, severity: 'critical' },
  { slug: 'dien-giat', icdCode: 'T75.4', nameVi: 'Điện giật', nameEn: 'Electrical injury', nameZh: '电击伤', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 619, severity: 'critical' },
  { slug: 'ngat-nuoc', icdCode: 'T75.1', nameVi: 'Ngạt nước', nameEn: 'Drowning', nameZh: '溺水', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 623, severity: 'critical' },
  { slug: 'cap-cuu-ngung-tuan-hoan', icdCode: 'I46', nameVi: 'Cấp cứu ngừng tuần hoàn', nameEn: 'Cardiac arrest and resuscitation', nameZh: '心搏骤停与复苏', clinicalSystem: 'Hồi sức cấp cứu', source: T2, sourcePage: 630, severity: 'critical' },

  // ─── Ngoại khoa: giữ từ bản seed đầu, nguồn riêng, không có trong 2 tập ──
  { slug: 'soi-mat', icdCode: 'K80', nameVi: 'Sỏi mật', nameEn: 'Cholelithiasis', nameZh: '胆石症', clinicalSystem: 'Tiêu hóa', source: 'Sabiston Textbook of Surgery, 21st ed. (2022)', structure: 'mat-cat-tui-mat', severity: 'info' },
  { slug: 'viem-ruot-thua-cap', icdCode: 'K35', nameVi: 'Viêm ruột thừa cấp', nameEn: 'Acute appendicitis', nameZh: '急性阑尾炎', clinicalSystem: 'Tiêu hóa', source: 'Sabiston Textbook of Surgery, 21st ed. (2022)', structure: 'mat-cat-ruot-gia', severity: 'warning' },
  { slug: 'phinh-dong-mach-chu-bung', icdCode: 'I71.4', nameVi: 'Phình động mạch chủ bụng', nameEn: 'Abdominal aortic aneurysm', nameZh: '腹主动脉瘤', clinicalSystem: 'Tim mạch', source: "Rutherford's Vascular Surgery and Endovascular Therapy, 10th ed. (2022)", structure: 'mat-cat-dong-mach', severity: 'critical' },
];
