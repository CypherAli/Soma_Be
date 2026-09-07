/**
 * Bệnh → mesh của ĐÚNG vị trí tổn thương trong model TOÀN THÂN của /viewer.
 *
 * BẪY ĐÃ DÍNH, ĐỪNG LẶP LẠI: /viewer KHÔNG nạp model theo scene
 * (liver_anatomy.glb, foot_bones.glb…). Nó nạp 7 model toàn thân khai báo ở
 * Soma_Fe/src/components/viewer/ModelScene.tsx: skeletal, muscular, nervous,
 * cardiovascular, visceral (+ visceral_gut_bp3d), lymphoid, joints.
 * Mesh phải có trong ĐÚNG model của `system`, nếu không viewer cô lập vào hư vô.
 *
 * KIỂM TRƯỚC KHI COMMIT:  cd Soma_Fe && npm run verify:lesions
 * Script đối chiếu từng tên với scripts/meshes.json (đọc thẳng từ file .glb).
 *
 * CHỈ neo khi mesh vừa có thật vừa ĐÚNG về giải phẫu. Đã cố ý BỎ TRỐNG:
 *  • 15 bệnh hô hấp — model không có mesh nhu mô phổi, chỉ có phế quản và
 *    mạch phổi. Neo viêm phổi vào một nhánh phế quản là sai.
 *  • 11 bệnh thận — không có mesh nhu mô thận, chỉ có động/tĩnh mạch trong thận.
 *  • Cường giáp / suy giáp — tra "thyroid" chỉ ra `Thyroid cartilage`, đó là
 *    sụn giáp của thanh quản, KHÔNG phải tuyến giáp.
 *  • Phì đại tuyến tiền liệt — không có mesh tuyến tiền liệt.
 *  • Toàn bộ huyết học và hồi sức cấp cứu — không khu trú về một mesh.
 */

export type LesionAnchor = {
  /** khớp `slug` trong pathologies.ts */
  slug: string;
  /** tên mesh GỐC trong glTF (chưa sanitize khoảng trắng thành "_") */
  mesh: string;
  /** hệ phải bật để mesh hiện ra */
  system:
    | 'skeletal'
    | 'muscular'
    | 'nervous'
    | 'cardiovascular'
    | 'visceral'
    | 'lymphoid'
    | 'joints';
  /** vì sao neo vào đây — để người sau kiểm lại được lập luận */
  why: string;
};

export const lesionMap: LesionAnchor[] = [
  // ─── Gan mật ────────────────────────────────────────────────────────────
  { slug: 'xo-gan', mesh: 'Liver', system: 'visceral', why: 'xơ hoá lan toả toàn bộ nhu mô — cả tạng là đúng phạm vi' },
  { slug: 'viem-gan-b-man', mesh: 'Liver', system: 'visceral', why: 'viêm lan toả nhu mô gan' },
  { slug: 'viem-gan-c', mesh: 'Liver', system: 'visceral', why: 'viêm lan toả nhu mô gan' },
  { slug: 'benh-gan-do-ruou', mesh: 'Liver', system: 'visceral', why: 'tổn thương lan toả nhu mô gan' },
  { slug: 'ap-xe-gan', mesh: 'Liver', system: 'visceral', why: 'ổ mủ trong nhu mô gan' },
  { slug: 'ung-thu-bieu-mo-te-bao-gan', mesh: 'Liver', system: 'visceral', why: 'u xuất phát từ tế bào gan' },
  { slug: 'soi-mat', mesh: 'Gallbladder', system: 'visceral', why: 'sỏi hình thành trong túi mật' },

  // ─── Ống tiêu hoá ───────────────────────────────────────────────────────
  { slug: 'loet-da-day-ta-trang', mesh: 'Stomach', system: 'visceral', why: 'ổ loét ở niêm mạc dạ dày' },
  { slug: 'xhth-do-loet-da-day-ta-trang', mesh: 'Duodenum', system: 'visceral', why: 'loét tá tràng là nguồn chảy máu hay gặp nhất' },
  { slug: 'xhth-tang-ap-luc-tinh-mach-cua', mesh: 'Oesophagus.001', system: 'visceral', why: 'búi giãn tĩnh mạch thực quản mới là chỗ chảy máu, không phải gan' },
  { slug: 'viem-ruot-thua-cap', mesh: 'Vermiform appendix', system: 'visceral', why: 'viêm khu trú ở ruột thừa' },
  { slug: 'benh-tri', mesh: 'Rectum', system: 'visceral', why: 'búi trĩ ở đoạn cuối trực tràng — ống hậu môn (mesh từ visceral_gut_bp3d)' },

  // ─── Tuỵ ────────────────────────────────────────────────────────────────
  { slug: 'viem-tuy-cap', mesh: 'Pancreas', system: 'visceral', why: 'viêm toàn bộ tuyến tuỵ' },
  { slug: 'dai-thao-duong', mesh: 'Pancreas', system: 'visceral', why: 'đảo tuỵ nằm trong tuyến tuỵ; model không tách riêng đảo Langerhans' },
  { slug: 'ha-glucose-huyet', mesh: 'Pancreas', system: 'visceral', why: 'rối loạn tiết insulin từ đảo tuỵ' },

  // ─── Tiết niệu ──────────────────────────────────────────────────────────
  { slug: 'nhiem-khuan-tiet-nieu', mesh: 'Urinary bladder', system: 'visceral', why: 'viêm bàng quang là thể hay gặp nhất' },

  // ─── Tim mạch ───────────────────────────────────────────────────────────
  { slug: 'hep-van-hai-la', mesh: 'Posterior leaflet of left atrioventricular valve', system: 'cardiovascular', why: 'van hai lá = van nhĩ thất trái theo danh pháp TA; model chỉ có lá sau' },

  // ─── Cơ xương khớp ──────────────────────────────────────────────────────
  { slug: 'benh-gout', mesh: 'First metatarsal bone', system: 'skeletal', why: 'gout điển hình khởi phát ở khớp bàn-ngón chân cái; model chỉ có xương, không có mesh khớp' },
  { slug: 'thoat-vi-dia-dem-that-lung', mesh: 'Intervertebral disc L4-L5', system: 'joints', why: 'L4-L5 là tầng thoát vị hay gặp nhất gây đau thần kinh toạ' },

  // ─── Bổ sung 25/08/2026 ─────────────────────────────────────────────────
  // Ghi chú ở đầu tệp từng nói "không có mesh nhu mô phổi / nhu mô thận /
  // tuyến giáp". Điều đó ĐÚNG VỚI BẢN MODEL CŨ. Bản dựng lại của 7 model toàn
  // thân đã có: 5 thuỳ phổi, Kidney.l/.r, Thyroid gland, Suprarenal gland,
  // tuyến yên, các đoạn đại tràng, màng phổi. Đã kiểm từng tên bằng
  // `npm run verify:lesions` (đọc thẳng .glb) trước khi thêm vào đây.

  // Hô hấp — chỉ neo bệnh có Ổ TỔN THƯƠNG KHU TRÚ; hen và COPD là bệnh của
  // đường thở lan toả nên vẫn để trống, neo vào một thuỳ là sai.
  { slug: 'viem-phoi-cong-dong', mesh: 'Inferior lobe of right lung', system: 'visceral', why: 'viêm phổi thuỳ hay gặp nhất ở thuỳ dưới phải — phế quản gốc phải dốc và thẳng hơn nên dịch hít vào rơi xuống đó' },
  { slug: 'viem-phoi-benh-vien', mesh: 'Inferior lobe of right lung', system: 'visceral', why: 'cùng cơ chế hít sặc ở người nằm lâu; thuỳ dưới phải là vị trí điển hình' },
  { slug: 'ap-xe-phoi', mesh: 'Inferior lobe of right lung', system: 'visceral', why: 'ổ mủ khu trú, hay ở phân thuỳ sau thuỳ dưới phải sau hít sặc' },
  { slug: 'lao-phoi', mesh: 'Superior lobe of right lung', system: 'visceral', why: 'lao phổi người lớn ưu thế ở phân thuỳ đỉnh – sau thuỳ trên, nơi phân áp oxy cao nhất' },
  { slug: 'tran-dich-mang-phoi', mesh: 'Pleura', system: 'visceral', why: 'dịch đọng trong khoang giữa hai lá màng phổi' },
  { slug: 'tran-khi-mang-phoi', mesh: 'Pleura', system: 'visceral', why: 'khí vào khoang màng phổi làm mất áp lực âm' },

  // Nội tiết
  { slug: 'buou-giap-don-thuan', mesh: 'Thyroid gland', system: 'visceral', why: 'tuyến giáp to lan toả, không có nhân' },
  { slug: 'cuong-giap', mesh: 'Thyroid gland', system: 'visceral', why: 'tăng sản và tăng tiết của chính tuyến giáp' },
  { slug: 'suy-giap', mesh: 'Thyroid gland', system: 'visceral', why: 'suy giảm chức năng tuyến giáp (nguyên phát tại tuyến là thể hay gặp nhất)' },
  { slug: 'hoi-chung-cushing', mesh: 'Suprarenal gland.r', system: 'visceral', why: 'tăng tiết cortisol từ vỏ thượng thận; model không tách vỏ với tuỷ nên neo cả tuyến' },
  { slug: 'suy-thuong-than-man-tinh', mesh: 'Suprarenal gland.r', system: 'visceral', why: 'phá huỷ vỏ thượng thận hai bên (bệnh Addison)' },
  { slug: 'cuong-aldosteron', mesh: 'Suprarenal gland.r', system: 'visceral', why: 'u hoặc tăng sản lớp cầu vỏ thượng thận' },
  { slug: 'u-tuy-thuong-than', mesh: 'Suprarenal gland.r', system: 'visceral', why: 'u tế bào ưa crôm của TUỶ thượng thận' },
  { slug: 'hoi-chung-sheehan', mesh: 'Adenohypophysis', system: 'visceral', why: 'hoại tử thuỳ trước tuyến yên sau băng huyết sản khoa — đúng thuỳ trước, không phải thuỳ sau' },
  { slug: 'benh-to-cac-vien-cuc', mesh: 'Adenohypophysis', system: 'visceral', why: 'u tuyến yên tiết hormone tăng trưởng, xuất phát từ thuỳ trước' },
  { slug: 'dai-thao-nhat', mesh: 'Neurohypophysis', system: 'visceral', why: 'thiếu hormone chống bài niệu do tổn thương thuỳ SAU tuyến yên' },

  // Thận – tiết niệu
  { slug: 'viem-cau-than-cap-sau-lien-cau', mesh: 'Kidney.r', system: 'visceral', why: 'viêm cầu thận hai bên lan toả; model không tách cầu thận nên neo cả thận' },
  { slug: 'hoi-chung-than-hu', mesh: 'Kidney.r', system: 'visceral', why: 'tổn thương màng lọc cầu thận, lan toả cả hai thận' },
  { slug: 'benh-than-iga', mesh: 'Kidney.r', system: 'visceral', why: 'lắng đọng IgA ở gian mạch cầu thận' },
  { slug: 'benh-than-da-nang', mesh: 'Kidney.r', system: 'visceral', why: 'nang phát triển trong nhu mô cả hai thận' },
  { slug: 'ton-thuong-than-cap', mesh: 'Kidney.r', system: 'visceral', why: 'tổn thương ống thận cấp lan toả' },
  { slug: 'benh-than-man', mesh: 'Kidney.r', system: 'visceral', why: 'xơ hoá và teo nhu mô cả hai thận' },
  { slug: 'soi-tiet-nieu', mesh: 'Ureter.r.001', system: 'visceral', why: 'sỏi gây cơn đau quặn khi kẹt trong niệu quản — ba chỗ hẹp của niệu quản là nơi kẹt' },

  // Tim mạch – mạch máu
  { slug: 'nhoi-mau-co-tim', mesh: 'Anterior interventricular artery.001', system: 'cardiovascular', why: 'nhánh liên thất trước là mạch bị tắc hay gặp nhất và nuôi vùng cơ tim rộng nhất' },
  { slug: 'phinh-dong-mach-chu-bung', mesh: 'Abdominal aorta.001', system: 'cardiovascular', why: 'phình hay gặp ở đoạn dưới chỗ tách động mạch thận' },
  { slug: 'huyet-khoi-tinh-mach-sau', mesh: 'Popliteal vein.r.001', system: 'cardiovascular', why: 'huyết khối lan từ tĩnh mạch cẳng chân lên tĩnh mạch khoeo — mốc ép của siêu âm chẩn đoán' },
  { slug: 'suy-tinh-mach-man-tinh', mesh: 'Great saphenous vein.r.001', system: 'cardiovascular', why: 'hở van chỗ đổ hiển – đùi là khởi đầu của giãn tĩnh mạch nông' },

  // Tiêu hoá
  { slug: 'hoi-chung-ruot-kich-thich', mesh: 'Sigmoid colon', system: 'visceral', why: 'rối loạn vận động ưu thế ở đại tràng sigma — nơi đau quặn khu trú hố chậu trái' },
  { slug: 'tao-bon', mesh: 'Descending colon', system: 'visceral', why: 'phân ứ đọng ở đại tràng xuống và sigma' },

  // Huyết học – bạch huyết
  { slug: 'u-lympho-ac-tinh', mesh: 'Spleen', system: 'lymphoid', why: 'lách là cơ quan lympho lớn nhất và hay có tổn thương; hạch lan toả nên không neo được vào một hạch' },
];
