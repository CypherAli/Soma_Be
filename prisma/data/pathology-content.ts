/**
 * Nội dung bệnh học — TÓM LƯỢC do biên soạn, KHÔNG chép nguyên văn giáo trình.
 *
 * Vì sao không chép nguyên văn: đây là đồ án tốt nghiệp và site sẽ công khai.
 * Chép nguyên 106 chương sách vào database rồi phát hành là tái bản tác phẩm —
 * rủi ro bản quyền, và nặng hơn là rủi ro học thuật khi hội đồng đối chiếu.
 * Tóm lược có dẫn đúng trang vừa hợp lệ vừa là thứ một đồ án phải tự làm.
 *
 * Quy trình dựng mỗi bài:
 *   1. medical_kb/scripts/extract_textbooks.py  → OCR toàn văn (tesseract, vie)
 *   2. medical_kb/scripts/locate_sections.py    → cắt đúng đoạn của từng bệnh
 *   3. đọc đoạn đó, viết lại 5 mục dưới đây bằng lời của mình
 *
 * Ánh xạ khung mục của giáo trình sang 5 trường:
 *   ĐẠI CƯƠNG / ĐỊNH NGHĨA / NGUYÊN NHÂN / CƠ CHẾ BỆNH SINH → description
 *   LÂM SÀNG / CẬN LÂM SÀNG / CHẨN ĐOÁN                     → clinical
 *   X-quang, CLVT, siêu âm, nội soi                          → imaging
 *   TIÊN LƯỢNG / BIẾN CHỨNG / phân giai đoạn                 → progression
 *   ĐIỀU TRỊ                                                 → treatment
 *
 * MỌI BẢN GHI Ở ĐÂY VẪN CẦN NGƯỜI CÓ CHUYÊN MÔN DUYỆT trước khi bỏ cờ
 * `needsReview`. Nội dung nhằm phục vụ học tập, không phải phác đồ điều trị.
 */

export type SeedContent = {
  /** khớp `slug` trong pathologies.ts */
  slug: string;
  locale: 'vi' | 'en' | 'zh';
  description?: string;
  clinical?: string;
  imaging?: string;
  progression?: string;
  treatment?: string;
};

export const seedContent: SeedContent[] = [
  {
    slug: 'xo-gan',
    locale: 'vi',
    description:
      'Xơ gan là quá trình xơ hoá lan toả kèm hình thành các nốt tân tạo, làm đảo lộn cấu trúc tiểu thuỳ gan và khiến gan mất dần chức năng. Đây là hậu quả cuối cùng của mọi tổn thương gan mạn tính kéo dài. Cần phân biệt với xơ hoá gan đơn thuần — xơ hoá có thể gặp trong suy tim, tắc mật hay bệnh sán máng mà không tiến triển thành xơ gan thực sự. Nguyên nhân hàng đầu ở Việt Nam là viêm gan virus B và C, rượu, và gan nhiễm mỡ không do rượu.',
    clinical:
      'Chia hai giai đoạn có ý nghĩa tiên lượng khác hẳn nhau. Xơ gan còn bù triệu chứng mờ nhạt: mệt mỏi, chán ăn, đau hạ sườn phải, sao mạch, lòng bàn tay son. Xơ gan mất bù khi xuất hiện ít nhất một trong các dấu hiệu cổ trướng, xuất huyết tiêu hoá, bệnh não gan hoặc vàng da. Cận lâm sàng thường thấy giảm tiểu cầu, giảm albumin, tăng bilirubin, kéo dài thời gian prothrombin; men gan có thể chỉ tăng nhẹ hoặc bình thường nên không dùng để loại trừ.',
    imaging:
      'Siêu âm cho hình ảnh gan bờ không đều, nhu mô thô, kèm dấu hiệu tăng áp lực tĩnh mạch cửa như lách to, giãn tĩnh mạch cửa, dịch ổ bụng. Nội soi thực quản — dạ dày để tìm và phân độ giãn tĩnh mạch, là thăm dò bắt buộc vì quyết định chỉ định dự phòng chảy máu. Đo độ đàn hồi gan và chụp cắt lớp vi tính hỗ trợ đánh giá mức xơ hoá và tầm soát ung thư biểu mô tế bào gan.',
    progression:
      'Tiên lượng phụ thuộc chủ yếu vào việc còn bù hay đã mất bù: thời gian sống trung bình khoảng 12 năm khi còn bù, giảm còn khoảng 2 năm khi đã mất bù. Phân tầng bằng thang điểm Child-Pugh và MELD. Các biến chứng thường gặp gồm cổ trướng, xuất huyết do vỡ giãn tĩnh mạch thực quản, bệnh não gan, nhiễm trùng dịch cổ trướng tiên phát, hội chứng gan thận và ung thư biểu mô tế bào gan.',
    treatment:
      'Điều trị nguyên nhân là ưu tiên hàng đầu — thuốc kháng virus cho viêm gan B, C; ngừng rượu tuyệt đối. Chế độ ăn đủ đạm trừ khi có bệnh não gan, hạn chế muối khi có cổ trướng. Cổ trướng dùng lợi tiểu kháng aldosteron phối hợp furosemid, chọc tháo khi căng to. Dự phòng vỡ giãn tĩnh mạch bằng chẹn beta không chọn lọc hoặc thắt vòng cao su. Ghép gan là biện pháp triệt để cho trường hợp có chỉ định.',
  },
  {
    slug: 'copd',
    locale: 'vi',
    description:
      'Bệnh phổi tắc nghẽn mạn tính đặc trưng bởi giới hạn lưu lượng khí thở không hồi phục hoàn toàn, tiến triển từ từ, liên quan đến phản ứng viêm bất thường của đường thở và nhu mô phổi trước các hạt và khí độc hại. Hút thuốc lá là yếu tố nguy cơ hàng đầu; ngoài ra còn khói bếp than củi, bụi nghề nghiệp, ô nhiễm không khí và thiếu hụt alpha-1 antitrypsin. Tổn thương giải phẫu bệnh gồm viêm dày thành phế quản nhỏ và khí phế thũng phá huỷ vách phế nang.',
    clinical:
      'Ho khạc đờm mạn tính và khó thở gắng sức tăng dần là bộ ba triệu chứng cốt lõi, thường ở người trên 40 tuổi có tiền sử phơi nhiễm. Khám thấy lồng ngực hình thùng, rì rào phế nang giảm, ran rít ran ngáy. Chẩn đoán xác định bắt buộc dựa vào hô hấp ký sau test giãn phế quản với FEV1/FVC dưới 0,70. Mức độ tắc nghẽn phân theo FEV1, còn đánh giá toàn diện dùng nhóm ABCD kết hợp triệu chứng (thang mMRC hoặc CAT) với nguy cơ đợt cấp.',
    imaging:
      'X-quang phổi có thể thấy trường phổi sáng, vòm hoành hạ thấp và dẹt, khoang liên sườn giãn rộng, bóng tim hình giọt nước; giá trị chính là loại trừ bệnh khác chứ không đủ để chẩn đoán. Chụp cắt lớp vi tính lồng ngực đánh giá khí phế thũng, giãn phế quản kèm theo và tầm soát ung thư phổi. Điện tâm đồ và siêu âm Doppler tim tìm dấu hiệu tăng áp động mạch phổi và tâm phế mạn.',
    progression:
      'Bệnh tiến triển không hồi phục, FEV1 giảm dần theo thời gian, nhanh hơn rõ rệt ở người tiếp tục hút thuốc. Đợt cấp là biến cố quyết định tiên lượng: mỗi đợt cấp nhập viện đều làm xấu chức năng phổi và tăng tỷ lệ tử vong. Biến chứng gồm suy hô hấp mạn, tăng áp động mạch phổi và tâm phế mạn, tràn khí màng phổi do vỡ bóng khí. Bệnh đồng mắc tim mạch, loãng xương, trầm cảm rất thường gặp và cần kiểm soát song song.',
    treatment:
      'Cai thuốc lá là can thiệp duy nhất làm chậm được tốc độ suy giảm chức năng phổi, phải đặt lên hàng đầu. Điều trị giai đoạn ổn định dùng thuốc giãn phế quản tác dụng kéo dài (LAMA, LABA) làm nền, thêm corticoid dạng hít cho nhóm nguy cơ đợt cấp cao. Tiêm vaccine cúm và phế cầu, phục hồi chức năng hô hấp, thở oxy dài hạn tại nhà khi có suy hô hấp mạn. Đợt cấp xử trí bằng tăng liều giãn phế quản, corticoid toàn thân, kháng sinh khi có bằng chứng nhiễm khuẩn, và thông khí không xâm nhập khi suy hô hấp nặng.',
  },
  {
    slug: 'tang-huyet-ap',
    locale: 'vi',
    description:
      'Tăng huyết áp được xác định khi huyết áp tâm thu từ 140 mmHg hoặc tâm trương từ 90 mmHg trở lên, đo đúng quy trình ở ít nhất hai lần khám khác nhau. Trên 90% trường hợp là tăng huyết áp nguyên phát không tìm được nguyên nhân. Số còn lại là thứ phát, hay gặp do bệnh nhu mô thận, hẹp động mạch thận, cường aldosteron, u tuỷ thượng thận hoặc hội chứng ngừng thở khi ngủ — cần nghĩ tới khi bệnh khởi phát ở người trẻ, huyết áp rất cao hoặc kháng trị.',
    clinical:
      'Phần lớn bệnh nhân không có triệu chứng và được phát hiện tình cờ, nên tăng huyết áp được gọi là "kẻ giết người thầm lặng". Khi có, thường là đau đầu vùng chẩm buổi sáng, chóng mặt, hồi hộp. Khám và xét nghiệm nhằm ba mục tiêu: khẳng định chẩn đoán, tìm nguyên nhân thứ phát, và đánh giá tổn thương cơ quan đích cùng các yếu tố nguy cơ tim mạch phối hợp. Đo huyết áp lưu động 24 giờ giúp phát hiện tăng huyết áp áo choàng trắng và tăng huyết áp ẩn giấu.',
    imaging:
      'Điện tâm đồ và siêu âm tim tìm phì đại thất trái — dấu hiệu tổn thương cơ quan đích quan trọng nhất và có giá trị tiên lượng độc lập. Siêu âm Doppler động mạch thận khi nghi hẹp động mạch thận. Soi đáy mắt đánh giá bệnh võng mạc do tăng huyết áp. Siêu âm động mạch cảnh đo bề dày lớp nội trung mạc ở bệnh nhân cần phân tầng nguy cơ chi tiết hơn.',
    progression:
      'Nguy cơ biến chứng tăng liên tục theo mức huyết áp, không có ngưỡng an toàn tuyệt đối. Tổn thương cơ quan đích gồm phì đại thất trái tiến tới suy tim, bệnh thận mạn, bệnh võng mạc, và xơ vữa động mạch lan toả. Biến cố chính là đột quỵ não, nhồi máu cơ tim, suy tim và suy thận giai đoạn cuối. Cơn tăng huyết áp cấp cứu có tổn thương cơ quan đích tiến triển là tình huống cần xử trí ngay.',
    treatment:
      'Thay đổi lối sống áp dụng cho mọi bệnh nhân: giảm muối dưới 5 g mỗi ngày, giảm cân, hạn chế rượu, tăng vận động, bỏ thuốc lá. Thuốc nền gồm bốn nhóm chính là ức chế men chuyển hoặc ức chế thụ thể, chẹn kênh calci, lợi tiểu thiazid và chẹn beta; xu hướng hiện nay ưu tiên phối hợp hai thuốc liều thấp ngay từ đầu thay vì tăng liều đơn trị. Lựa chọn thuốc cân nhắc theo bệnh đồng mắc. Điều trị là suốt đời, cần theo dõi tuân thủ và tác dụng phụ.',
  },
  {
    slug: 'viem-gan-b-man',
    locale: 'vi',
    description:
      'Viêm gan virus B mạn tính là tình trạng nhiễm HBV kéo dài trên 6 tháng, xác định bằng HBsAg dương tính. Virus lây qua đường máu, quan hệ tình dục và mẹ truyền sang con — đường mẹ con là cơ chế chính duy trì tỷ lệ nhiễm cao ở Việt Nam. Diễn biến tự nhiên đi qua các giai đoạn dung nạp miễn dịch, thải trừ miễn dịch, mang virus không hoạt động và tái hoạt động; chính giai đoạn chứ không riêng tải lượng virus quyết định chỉ định điều trị.',
    clinical:
      'Phần lớn không triệu chứng, phát hiện khi khám sức khoẻ hoặc hiến máu. Khi có thì mệt mỏi, chán ăn, đau tức hạ sườn phải, vàng da từng đợt. Bộ xét nghiệm cốt lõi gồm HBsAg, HBeAg và anti-HBe, HBV DNA định lượng, ALT/AST, cùng đánh giá mức xơ hoá gan. Cần sàng lọc đồng nhiễm HIV, HCV, HDV vì làm thay đổi hẳn phác đồ.',
    imaging:
      'Siêu âm gan định kỳ mỗi 6 tháng để tầm soát ung thư biểu mô tế bào gan, phối hợp định lượng AFP. Đo độ đàn hồi gan thay thế sinh thiết trong đa số trường hợp để đánh giá mức xơ hoá. Chụp cắt lớp vi tính hoặc cộng hưởng từ có tiêm thuốc khi siêu âm phát hiện tổn thương khu trú.',
    progression:
      'Nguy cơ tiến triển xơ gan và ung thư gan tăng theo tải lượng virus, mức xơ hoá nền và tuổi. Ung thư biểu mô tế bào gan có thể xuất hiện ngay cả khi chưa xơ gan — đây là lý do phải tầm soát suốt đời chứ không dừng khi virus đã bị ức chế. Đợt bùng phát viêm gan cấp có thể xảy ra khi ngừng thuốc đột ngột hoặc khi dùng thuốc ức chế miễn dịch.',
    treatment:
      'Thuốc kháng virus nhóm đồng đẳng nucleos(t)ide như tenofovir và entecavir là lựa chọn nền, dùng kéo dài, rào cản kháng thuốc cao. Interferon dạng pegyl hoá cân nhắc cho nhóm chọn lọc vì có thời hạn điều trị hữu hạn. Chỉ định dựa trên phối hợp tải lượng HBV DNA, ALT và mức xơ hoá. Dự phòng lây truyền mẹ con và tiêm vaccine cho trẻ sơ sinh là biện pháp hiệu quả nhất ở cộng đồng.',
  },
  {
    slug: 'viem-gan-c',
    locale: 'vi',
    description:
      'Viêm gan virus C do HCV, lây chủ yếu qua đường máu — tiêm chích, truyền máu trước thời kỳ sàng lọc, thủ thuật y tế không vô khuẩn. Khác với HBV, khoảng 70–80% trường hợp nhiễm cấp chuyển sang mạn tính vì virus biến đổi kháng nguyên nhanh, né tránh được miễn dịch. HCV không tích hợp vào bộ gen tế bào gan nên về nguyên tắc có thể loại trừ hoàn toàn bằng thuốc.',
    clinical:
      'Diễn biến âm thầm nhiều năm, phần lớn phát hiện tình cờ qua anti-HCV dương tính. Triệu chứng nếu có thường mơ hồ: mệt mỏi, đau cơ khớp, rối loạn tiêu hoá. Chẩn đoán xác định cần HCV RNA dương tính, vì anti-HCV vẫn tồn tại sau khi đã khỏi bệnh. Định type virus giúp chọn phác đồ, tuy các thuốc thế hệ mới đã bớt phụ thuộc vào type.',
    imaging:
      'Siêu âm và đo độ đàn hồi gan đánh giá mức xơ hoá, quyết định tần suất theo dõi sau điều trị. Người đã xơ gan vẫn phải tầm soát ung thư gan bằng siêu âm mỗi 6 tháng, kể cả sau khi đã đạt đáp ứng virus bền vững.',
    progression:
      'Xơ hoá tiến triển chậm trong 20–30 năm, nhanh hơn ở người uống rượu, đồng nhiễm HIV hoặc HBV, hoặc có gan nhiễm mỡ. Khi đã xơ gan thì nguy cơ ung thư biểu mô tế bào gan tồn tại lâu dài. Ngoài gan, HCV còn gây cryoglobulin máu, viêm cầu thận và một số bệnh lý tự miễn.',
    treatment:
      'Thuốc kháng virus tác dụng trực tiếp đường uống cho tỷ lệ khỏi trên 95% sau 8–12 tuần, dung nạp tốt, đã thay thế hoàn toàn phác đồ interferon cũ. Đích điều trị là đáp ứng virus bền vững — HCV RNA âm tính 12 tuần sau khi kết thúc. Cần rà soát tương tác thuốc trước khi kê. Chưa có vaccine nên dự phòng dựa vào kiểm soát đường lây qua máu.',
  },
  {
    slug: 'benh-gan-do-ruou',
    locale: 'vi',
    description:
      'Bệnh gan do rượu là phổ tổn thương từ gan nhiễm mỡ đơn thuần, viêm gan do rượu, đến xơ gan. Cơ chế gồm độc tính trực tiếp của acetaldehyde, stress oxy hoá và rối loạn chuyển hoá lipid tại tế bào gan. Ngưỡng nguy cơ thường nêu là trên 40 g cồn mỗi ngày ở nam và 20 g ở nữ, kéo dài nhiều năm; nữ nhạy cảm hơn với cùng một lượng cồn.',
    clinical:
      'Gan nhiễm mỡ thường không triệu chứng, chỉ thấy gan to. Viêm gan do rượu biểu hiện vàng da, sốt, gan to đau, có thể suy gan cấp trên nền mạn. Xét nghiệm gợi ý mạnh là tỷ lệ AST/ALT trên 2, kèm tăng GGT và tăng thể tích trung bình hồng cầu. Bộ câu hỏi AUDIT giúp lượng giá mức lạm dụng rượu một cách hệ thống thay vì hỏi ước chừng.',
    imaging:
      'Siêu âm thấy gan tăng âm lan toả trong gan nhiễm mỡ, bờ không đều và dấu hiệu tăng áp cửa khi đã xơ. Sinh thiết gan chỉ đặt ra khi chẩn đoán chưa rõ hoặc cần loại trừ nguyên nhân phối hợp.',
    progression:
      'Ngừng rượu có thể đảo ngược hoàn toàn giai đoạn gan nhiễm mỡ. Viêm gan do rượu nặng có tỷ lệ tử vong ngắn hạn cao, lượng giá bằng chỉ số Maddrey, MELD hoặc thang điểm Glasgow. Nếu tiếp tục uống thì tiến triển tới xơ gan và các biến chứng của nó là gần như chắc chắn.',
    treatment:
      'Ngừng rượu tuyệt đối là điều trị nền và là yếu tố tiên lượng mạnh nhất — cần phối hợp hỗ trợ cai nghiện chứ không chỉ khuyên bảo. Chế độ ăn giàu năng lượng và đạm, bổ sung vitamin nhóm B, đặc biệt thiamin. Corticoid cân nhắc cho viêm gan do rượu nặng theo chỉ số Maddrey, sau khi đã loại trừ nhiễm trùng và xuất huyết tiêu hoá. Ghép gan đòi hỏi thời gian kiêng rượu theo quy định của từng trung tâm.',
  },
  {
    slug: 'ap-xe-gan',
    locale: 'vi',
    description:
      'Áp xe gan là ổ mủ khu trú trong nhu mô gan, với hai nhóm nguyên nhân chính là amip và vi khuẩn. Áp xe amip gặp nhiều ở vùng dịch tễ, do Entamoeba histolytica theo tĩnh mạch cửa lên gan, thường ở thuỳ phải và thường đơn ổ. Áp xe vi khuẩn hay thứ phát sau nhiễm khuẩn đường mật, viêm ruột thừa, viêm túi thừa hoặc nhiễm khuẩn huyết, và thường đa ổ.',
    clinical:
      'Tam chứng kinh điển là sốt, đau hạ sườn phải và gan to đau. Rung gan và ấn kẽ sườn đau là dấu hiệu khám có giá trị. Xét nghiệm thấy bạch cầu tăng, CRP tăng, phosphatase kiềm tăng. Huyết thanh chẩn đoán amip dương tính hỗ trợ phân biệt; cấy máu và cấy mủ định hướng kháng sinh cho thể vi khuẩn.',
    imaging:
      'Siêu âm là thăm dò đầu tay: ổ giảm âm hoặc trống âm trong nhu mô gan, xác định số lượng, kích thước và vị trí để chọc hút. Chụp cắt lớp vi tính có tiêm thuốc phân định rõ hơn ranh giới ổ áp xe và giúp tìm nguồn nhiễm khuẩn trong ổ bụng.',
    progression:
      'Biến chứng đáng ngại nhất là vỡ ổ áp xe vào khoang màng bụng, màng phổi hoặc màng ngoài tim. Áp xe vi khuẩn kèm nhiễm khuẩn huyết có tiên lượng nặng hơn thể amip. Điều trị đúng và sớm cho kết quả tốt ở đa số trường hợp.',
    treatment:
      'Áp xe amip đáp ứng tốt với metronidazol, thường không cần dẫn lưu trừ khi ổ lớn, doạ vỡ hoặc không đáp ứng thuốc. Áp xe vi khuẩn cần kháng sinh phổ rộng theo kinh nghiệm rồi điều chỉnh theo kháng sinh đồ, phối hợp chọc hút hoặc dẫn lưu dưới hướng dẫn siêu âm. Phải tìm và xử trí ổ nhiễm khuẩn nguyên phát, đặc biệt là đường mật.',
  },
  {
    slug: 'ung-thu-bieu-mo-te-bao-gan',
    locale: 'vi',
    description:
      'Ung thư biểu mô tế bào gan là u ác tính xuất phát từ tế bào gan, đứng hàng đầu trong các ung thư ở nam giới Việt Nam. Trên 80% phát sinh trên nền gan đã xơ, với ba yếu tố nguy cơ chính là viêm gan virus B, viêm gan virus C và rượu. Aflatoxin trong thực phẩm mốc là yếu tố nguy cơ bổ sung đáng kể ở khu vực nhiệt đới.',
    clinical:
      'Giai đoạn sớm không triệu chứng, phát hiện qua chương trình tầm soát ở người xơ gan hoặc viêm gan virus mạn. Khi đã có triệu chứng thì thường muộn: đau hạ sườn phải, sụt cân, gan to chắc, hoặc mất bù đột ngột ở người xơ gan vốn ổn định. AFP tăng hỗ trợ chẩn đoán nhưng có thể bình thường ở khối u nhỏ nên không dùng để loại trừ.',
    imaging:
      'Chẩn đoán có thể xác lập bằng hình ảnh mà không cần sinh thiết khi khối u trên nền gan xơ có kiểu bắt thuốc điển hình trên cắt lớp vi tính hoặc cộng hưởng từ có tiêm thuốc: ngấm mạnh thì động mạch rồi thải thuốc nhanh thì tĩnh mạch cửa. Siêu âm là công cụ tầm soát định kỳ mỗi 6 tháng cho nhóm nguy cơ.',
    progression:
      'Tiên lượng phụ thuộc đồng thời vào giai đoạn u và chức năng gan nền — điểm khác biệt so với hầu hết ung thư khác, và là lý do dùng hệ phân giai đoạn BCLC kết hợp cả hai yếu tố. Khối u xâm lấn tĩnh mạch cửa hoặc di căn ngoài gan làm tiên lượng xấu rõ rệt.',
    treatment:
      'Giai đoạn rất sớm và sớm có thể điều trị triệt để bằng phẫu thuật cắt gan, đốt sóng cao tần hoặc ghép gan. Giai đoạn trung gian dùng nút mạch hoá chất qua động mạch gan. Giai đoạn tiến triển dùng điều trị toàn thân. Song song phải kiểm soát bệnh gan nền và nguyên nhân. Dự phòng hiệu quả nhất là tiêm vaccine viêm gan B và điều trị viêm gan virus mạn.',
  },
  {
    slug: 'soi-mat',
    locale: 'vi',
    description:
      'Sỏi mật là sỏi hình thành trong túi mật hoặc đường mật. Sỏi cholesterol chiếm ưu thế ở phương Tây, còn ở Việt Nam sỏi sắc tố và sỏi đường mật liên quan nhiễm khuẩn, ký sinh trùng đường mật gặp nhiều hơn. Cơ chế gồm mất cân bằng thành phần dịch mật, ứ trệ túi mật và yếu tố nhiễm khuẩn. Yếu tố nguy cơ kinh điển gồm nữ giới, tuổi cao, béo phì, sinh đẻ nhiều, sụt cân nhanh.',
    clinical:
      'Phần lớn sỏi túi mật không triệu chứng và được phát hiện tình cờ. Khi có, biểu hiện điển hình là cơn đau quặn mật: đau đột ngột hạ sườn phải hoặc thượng vị, lan lên vai phải, kéo dài vài giờ, thường sau bữa ăn nhiều mỡ. Sốt và vàng da gợi ý đã có biến chứng viêm túi mật hoặc sỏi ống mật chủ. Dấu Murphy dương tính trong viêm túi mật cấp.',
    imaging:
      'Siêu âm là thăm dò đầu tay, độ nhạy cao với sỏi túi mật: hình tăng âm kèm bóng cản, di động theo tư thế. Cộng hưởng từ đường mật dựng hình cây đường mật khi nghi sỏi ống mật chủ. Nội soi mật tuỵ ngược dòng vừa chẩn đoán vừa can thiệp lấy sỏi đường mật.',
    progression:
      'Sỏi không triệu chứng phần lớn giữ nguyên tình trạng đó trong nhiều năm. Biến chứng gồm viêm túi mật cấp, viêm đường mật, viêm tuỵ cấp do sỏi, và hiếm hơn là tắc ruột do sỏi mật. Sỏi túi mật lâu năm làm tăng nhẹ nguy cơ ung thư túi mật.',
    treatment:
      'Sỏi túi mật không triệu chứng nói chung chỉ theo dõi. Khi có triệu chứng hoặc đã biến chứng thì cắt túi mật nội soi là điều trị chuẩn. Sỏi ống mật chủ lấy qua nội soi mật tuỵ ngược dòng. Thuốc tan sỏi hiệu quả hạn chế, chỉ dành cho nhóm rất chọn lọc.',
  },
  {
    slug: 'loet-da-day-ta-trang',
    locale: 'vi',
    description:
      'Loét dạ dày tá tràng là tổn thương mất niêm mạc ăn sâu qua lớp cơ niêm, do mất cân bằng giữa yếu tố tấn công là acid và pepsin với yếu tố bảo vệ là chất nhầy, bicarbonat và tưới máu niêm mạc. Hai nguyên nhân áp đảo là nhiễm Helicobacter pylori và dùng thuốc chống viêm không steroid. Loét tá tràng thường gặp hơn loét dạ dày và ít liên quan tới ung thư hơn.',
    clinical:
      'Đau thượng vị có tính chu kỳ là triệu chứng cốt lõi: loét tá tràng đau khi đói và giảm sau ăn, loét dạ dày đau tăng sau ăn. Kèm ợ hơi, ợ chua, buồn nôn. Nhiều trường hợp, nhất là người dùng thuốc chống viêm và người cao tuổi, không đau và biểu hiện đầu tiên chính là biến chứng. Cần tìm H. pylori bằng test hơi thở, xét nghiệm phân hoặc sinh thiết.',
    imaging:
      'Nội soi dạ dày tá tràng là tiêu chuẩn chẩn đoán: xác định vị trí, kích thước, giai đoạn ổ loét và lấy sinh thiết. Mọi ổ loét dạ dày đều phải sinh thiết để loại trừ ung thư và nội soi kiểm tra lại sau điều trị — nguyên tắc này không áp dụng bắt buộc cho loét tá tràng.',
    progression:
      'Biến chứng gồm xuất huyết tiêu hoá, thủng ổ loét, hẹp môn vị do sẹo xơ, và ung thư hoá ở loét dạ dày. Diệt H. pylori thành công làm giảm mạnh tỷ lệ tái phát, từ trên 70% mỗi năm xuống mức rất thấp.',
    treatment:
      'Phác đồ diệt H. pylori phối hợp thuốc ức chế bơm proton với hai hoặc ba kháng sinh, thời gian 14 ngày, lựa chọn theo tình hình kháng thuốc tại địa phương. Ngừng thuốc chống viêm không steroid nếu được, hoặc phối hợp thuốc bảo vệ khi bắt buộc phải dùng. Kiểm tra diệt trừ sau ít nhất 4 tuần ngừng thuốc. Phẫu thuật hiện chỉ còn dành cho biến chứng.',
  },
  {
    slug: 'xhth-tang-ap-luc-tinh-mach-cua',
    locale: 'vi',
    description:
      'Xuất huyết tiêu hoá do tăng áp lực tĩnh mạch cửa xảy ra khi các búi giãn tĩnh mạch thực quản hoặc phình vị vỡ ra. Cơ chế là tăng áp cửa do xơ gan làm máu tìm đường về tuần hoàn hệ thống qua các vòng nối, gây giãn tĩnh mạch dưới niêm mạc thực quản. Nguy cơ vỡ tăng theo kích thước búi giãn, dấu đỏ trên bề mặt và mức độ suy gan.',
    clinical:
      'Biểu hiện là nôn ra máu đỏ tươi số lượng lớn và đi ngoài phân đen, thường đột ngột trên nền bệnh nhân đã biết xơ gan. Đánh giá ban đầu tập trung vào huyết động: mạch, huyết áp, tri giác, dấu hiệu sốc. Xét nghiệm cần công thức máu, đông máu, chức năng gan thận và nhóm máu. Phải phân biệt với xuất huyết do loét dạ dày tá tràng vì xử trí khác hẳn.',
    imaging:
      'Nội soi thực quản dạ dày cấp cứu trong vòng 12 giờ vừa xác định nguồn chảy máu vừa can thiệp cầm máu. Ngoài đợt cấp, nội soi định kỳ để phân độ búi giãn và quyết định dự phòng. Siêu âm Doppler đánh giá dòng chảy tĩnh mạch cửa và tìm huyết khối.',
    progression:
      'Đây là biến chứng nặng nhất của tăng áp cửa, tỷ lệ tử vong trong đợt đầu vẫn cao dù đã có nhiều tiến bộ. Nguy cơ chảy máu lại trong 6 tuần đầu rất lớn nếu không dự phòng. Chảy máu thường kéo theo bệnh não gan, nhiễm trùng và suy thận.',
    treatment:
      'Hồi sức tuần hoàn thận trọng, tránh truyền máu quá mức vì làm tăng áp cửa và tăng nguy cơ chảy máu lại. Thuốc co mạch tạng như somatostatin hoặc terlipressin dùng sớm ngay khi nghi ngờ. Kháng sinh dự phòng là bắt buộc vì làm giảm tỷ lệ tử vong. Thắt búi giãn qua nội soi là can thiệp chuẩn. Dự phòng tái phát bằng thắt vòng lặp lại phối hợp chẹn beta không chọn lọc; TIPS dành cho trường hợp thất bại.',
  },
  {
    slug: 'viem-ruot-thua-cap',
    locale: 'vi',
    description:
      'Viêm ruột thừa cấp là cấp cứu ngoại khoa ổ bụng thường gặp nhất. Cơ chế khởi đầu là tắc lòng ruột thừa do sỏi phân, tăng sản mô lympho hoặc dị vật, dẫn tới ứ dịch, tăng áp lực trong lòng, thiếu máu thành ruột thừa rồi nhiễm khuẩn và hoại tử. Bệnh gặp ở mọi lứa tuổi, đỉnh ở tuổi thiếu niên và người trẻ.',
    clinical:
      'Diễn biến kinh điển là đau khởi phát quanh rốn hoặc thượng vị rồi khu trú xuống hố chậu phải sau vài giờ, kèm chán ăn, buồn nôn, sốt nhẹ. Khám thấy ấn đau và phản ứng thành bụng tại điểm McBurney. Bạch cầu và CRP tăng. Vị trí ruột thừa bất thường, phụ nữ có thai và người cao tuổi làm bệnh cảnh không điển hình và dễ chẩn đoán muộn.',
    imaging:
      'Siêu âm là lựa chọn đầu tay, nhất là ở trẻ em và phụ nữ có thai: ruột thừa đường kính trên 6 mm, thành dày, không xẹp khi ép. Chụp cắt lớp vi tính có độ chính xác cao hơn, dùng khi siêu âm không kết luận được hoặc cần loại trừ chẩn đoán khác.',
    progression:
      'Không xử trí kịp thì ruột thừa hoại tử và thủng, gây viêm phúc mạc khu trú thành áp xe ruột thừa hoặc viêm phúc mạc toàn thể. Thủng làm tăng rõ rệt tỷ lệ biến chứng và thời gian nằm viện. Đám quánh ruột thừa là thể diễn biến đặc biệt, xử trí khác với viêm ruột thừa cấp thông thường.',
    treatment:
      'Cắt ruột thừa nội soi là điều trị chuẩn, thực hiện sớm sau khi chẩn đoán. Kháng sinh trước mổ làm giảm nhiễm khuẩn vết mổ. Áp xe ruột thừa có thể dẫn lưu kèm kháng sinh rồi cắt ruột thừa trì hoãn. Điều trị kháng sinh đơn thuần chỉ đặt ra cho thể không biến chứng ở nhóm chọn lọc và cần theo dõi sát.',
  },
  {
    slug: 'benh-tri',
    locale: 'vi',
    description:
      'Trĩ là tình trạng giãn quá mức các đám rối tĩnh mạch ở vùng hậu môn trực tràng. Đám rối trĩ vốn là cấu trúc bình thường tham gia kiểm soát tự chủ hậu môn; bệnh xuất hiện khi mô nâng đỡ suy yếu và áp lực trong lòng tăng kéo dài. Yếu tố thuận lợi gồm táo bón mạn, rặn nhiều, ngồi lâu, mang thai và tăng áp lực ổ bụng.',
    clinical:
      'Trĩ nội phân độ theo mức sa: độ I chưa sa, độ II sa khi rặn và tự co lên, độ III phải đẩy lên, độ IV sa thường xuyên. Triệu chứng chính là chảy máu đỏ tươi khi đại tiện và khối sa. Trĩ ngoại gây đau khi có huyết khối. Thăm khám hậu môn trực tràng và soi hậu môn là bắt buộc.',
    imaging:
      'Nội soi đại trực tràng cần đặt ra khi chảy máu ở người trên 40 tuổi, có thay đổi thói quen đại tiện, thiếu máu hoặc tiền sử gia đình ung thư đại trực tràng — quy kết mọi trường hợp chảy máu cho trĩ là sai lầm hay gặp và có thể bỏ sót ung thư.',
    progression:
      'Bệnh tiến triển mạn tính, thành từng đợt. Biến chứng gồm huyết khối búi trĩ gây đau cấp, sa nghẹt, và thiếu máu mạn do chảy máu kéo dài. Trĩ không tiến triển thành ung thư.',
    treatment:
      'Nền tảng là điều chỉnh chế độ ăn nhiều chất xơ, uống đủ nước, tránh rặn và ngồi lâu — áp dụng cho mọi mức độ. Thuốc trợ tĩnh mạch và thuốc đặt tại chỗ giảm triệu chứng đợt cấp. Thủ thuật như thắt vòng cao su hay tiêm xơ dành cho độ I đến III. Phẫu thuật cắt trĩ đặt ra với độ III đến IV hoặc khi có biến chứng.',
  },
  {
    slug: 'viem-tuy-cap',
    locale: 'vi',
    description:
      'Viêm tuỵ cấp là quá trình viêm cấp tính của tuyến tuỵ do men tuỵ được hoạt hoá ngay trong nhu mô, gây tự tiêu huỷ mô tuỵ và phản ứng viêm toàn thân. Hai nguyên nhân chiếm phần lớn là sỏi mật và rượu; các nguyên nhân khác gồm tăng triglycerid máu, sau nội soi mật tuỵ ngược dòng, thuốc và chấn thương.',
    clinical:
      'Đau bụng thượng vị dữ dội, lan ra sau lưng, kèm nôn nhiều mà không đỡ đau. Khám thấy bụng chướng, phản ứng thành bụng vùng trên rốn. Chẩn đoán xác định khi có ít nhất hai trong ba yếu tố: đau điển hình, amylase hoặc lipase máu tăng trên ba lần giới hạn trên, và hình ảnh phù hợp. Lipase đặc hiệu hơn amylase và tăng kéo dài hơn.',
    imaging:
      'Siêu âm bụng làm sớm để tìm sỏi mật — nguyên nhân cần can thiệp riêng. Chụp cắt lớp vi tính có tiêm thuốc đánh giá mức hoại tử, tốt nhất sau 72 giờ vì làm quá sớm sẽ đánh giá thấp tổn thương. Cộng hưởng từ đường mật khi nghi sỏi ống mật chủ.',
    progression:
      'Phần lớn là thể nhẹ, tự giới hạn trong vòng một tuần. Thể nặng có hoại tử tuỵ, suy đa tạng và tỷ lệ tử vong cao. Biến chứng tại chỗ gồm ổ tụ dịch, nang giả tuỵ và hoại tử nhiễm khuẩn. Phân tầng nặng nhẹ dựa trên suy tạng kéo dài chứ không chỉ dựa vào mức men tuỵ.',
    treatment:
      'Điều trị nền là bù dịch tích cực trong 24 đến 48 giờ đầu, giảm đau đầy đủ và nuôi dưỡng đường ruột sớm khi dung nạp được — nhịn ăn kéo dài không còn được khuyến cáo. Không dùng kháng sinh dự phòng thường quy, chỉ dùng khi có bằng chứng nhiễm khuẩn. Viêm tuỵ do sỏi kèm viêm đường mật cần nội soi mật tuỵ ngược dòng sớm, và cắt túi mật ngay trong đợt nằm viện để tránh tái phát.',
  },
  {
    slug: 'dai-thao-duong',
    locale: 'vi',
    description:
      'Đái tháo đường là nhóm bệnh rối loạn chuyển hoá đặc trưng bởi tăng glucose máu mạn tính do khiếm khuyết tiết insulin, khiếm khuyết tác dụng của insulin, hoặc cả hai. Type 1 do phá huỷ tế bào beta đảo tuỵ qua cơ chế tự miễn, dẫn tới thiếu insulin tuyệt đối. Type 2 chiếm trên 90%, cơ chế là đề kháng insulin phối hợp suy giảm dần chức năng tế bào beta, liên quan chặt với béo phì và lối sống tĩnh tại.',
    clinical:
      'Type 1 khởi phát rầm rộ với ăn nhiều, uống nhiều, tiểu nhiều, sụt cân nhanh, có thể vào viện vì nhiễm toan ceton. Type 2 diễn biến âm thầm nhiều năm, thường phát hiện tình cờ hoặc khi đã có biến chứng. Tiêu chuẩn chẩn đoán gồm glucose máu đói từ 7,0 mmol/L, glucose 2 giờ sau nghiệm pháp dung nạp từ 11,1 mmol/L, HbA1c từ 6,5%, hoặc glucose bất kỳ từ 11,1 mmol/L kèm triệu chứng điển hình.',
    imaging:
      'Không có chẩn đoán hình ảnh cho bản thân bệnh; thăm dò tập trung vào biến chứng. Soi đáy mắt định kỳ tìm bệnh võng mạc. Siêu âm Doppler mạch chi dưới và mạch cảnh khi nghi bệnh động mạch. Điện tâm đồ và siêu âm tim đánh giá biến chứng tim mạch.',
    progression:
      'Biến chứng cấp gồm nhiễm toan ceton, tăng áp lực thẩm thấu và hạ glucose máu do điều trị. Biến chứng mạn chia thành mạch nhỏ là võng mạc, thận, thần kinh; và mạch lớn là động mạch vành, mạch não, mạch chi dưới. Bàn chân đái tháo đường là hậu quả phối hợp của bệnh thần kinh, bệnh mạch máu và nhiễm khuẩn, là nguyên nhân cắt cụt chi hàng đầu ngoài chấn thương.',
    treatment:
      'Thay đổi lối sống là nền tảng cho mọi bệnh nhân: chế độ ăn, vận động, giảm cân. Metformin là thuốc khởi đầu cho type 2 nếu không chống chỉ định; các nhóm mới như ức chế SGLT2 và đồng vận GLP-1 được ưu tiên khi có bệnh tim mạch hoặc bệnh thận đi kèm. Type 1 bắt buộc dùng insulin theo phác đồ nền và bữa ăn. Kiểm soát đồng thời huyết áp và lipid máu quan trọng không kém kiểm soát glucose. Tầm soát biến chứng định kỳ hằng năm.',
  },
  {
    slug: 'hen-phe-quan',
    locale: 'vi',
    description:
      'Hen phế quản là bệnh viêm mạn tính đường thở, gây tăng đáp ứng phế quản với nhiều tác nhân, dẫn tới tắc nghẽn lan toả có hồi phục — tự nhiên hoặc sau dùng thuốc. Về giải phẫu bệnh, đường thở dày lên do phù nề, thâm nhiễm bạch cầu ái toan, tăng sinh cơ trơn và nút nhầy lấp lòng phế quản. Yếu tố khởi phát gồm dị nguyên, nhiễm virus, gắng sức, khí lạnh, khói thuốc và một số thuốc.',
    clinical:
      'Bộ triệu chứng gợi ý là khò khè, khó thở, nặng ngực và ho, thay đổi theo thời gian và cường độ, nặng lên về đêm hoặc gần sáng. Khám trong cơn nghe ran rít lan toả hai phổi, thì thở ra kéo dài; ngoài cơn phổi có thể hoàn toàn bình thường nên khám bình thường không loại trừ được hen. Chẩn đoán xác định cần chứng minh tắc nghẽn có hồi phục: FEV1 tăng trên 12% và trên 200 mL sau test giãn phế quản, hoặc dao động lưu lượng đỉnh trong ngày.',
    imaging:
      'X-quang phổi chủ yếu để loại trừ bệnh khác và tìm biến chứng như tràn khí màng phổi hay xẹp phổi do nút nhầy; trong hen ổn định thường bình thường hoặc chỉ thấy ứ khí. Đo oxid nitric khí thở ra hỗ trợ nhận diện viêm đường thở tăng bạch cầu ái toan và theo dõi đáp ứng corticoid.',
    progression:
      'Bệnh diễn biến từng đợt trên nền viêm mạn tính. Kiểm soát tốt thì chức năng phổi được bảo tồn; kiểm soát kém kéo dài dẫn tới tái cấu trúc đường thở và tắc nghẽn cố định giống COPD. Cơn hen nặng và cơn hen nguy kịch là tình huống đe doạ tính mạng, đặc biệt ở người có tiền sử phải đặt nội khí quản hoặc lạm dụng thuốc cắt cơn.',
    treatment:
      'Điều trị nền theo phác đồ bậc thang, trục chính là corticoid dạng hít — không dùng thuốc cắt cơn đơn thuần kéo dài vì làm tăng nguy cơ tử vong. Phối hợp corticoid hít với thuốc giãn phế quản tác dụng kéo dài khi cần nâng bậc. Song song phải tránh yếu tố khởi phát, hướng dẫn kỹ thuật dùng bình xịt và lập kế hoạch hành động khi lên cơn. Cơn cấp xử trí bằng thuốc giãn phế quản tác dụng nhanh, corticoid toàn thân sớm và oxy; cơn nguy kịch cần hỗ trợ hô hấp.',
  },
  {
    slug: 'lao-phoi',
    locale: 'vi',
    description:
      'Lao phổi do Mycobacterium tuberculosis, vi khuẩn kháng cồn kháng toan, sinh sản chậm và có khả năng tồn tại ở trạng thái ngủ trong cơ thể nhiều năm. Lây qua đường hô hấp từ người bệnh có vi khuẩn trong đờm khi ho, hắt hơi, nói. Tổn thương đặc trưng là nang lao với hoại tử bã đậu ở trung tâm. Việt Nam vẫn nằm trong nhóm nước có gánh nặng lao cao.',
    clinical:
      'Triệu chứng toàn thân gồm sốt nhẹ về chiều, ra mồ hôi đêm, gầy sút, chán ăn kéo dài. Triệu chứng hô hấp là ho khạc đờm trên hai tuần, có thể ho ra máu, đau ngực, khó thở. Bất kỳ ai ho kéo dài trên hai tuần đều phải nghĩ tới lao và làm xét nghiệm đờm. Chẩn đoán dựa vào tìm vi khuẩn: nhuộm soi trực tiếp, Xpert MTB/RIF cho kết quả nhanh kèm phát hiện kháng rifampicin, và nuôi cấy là tiêu chuẩn vàng.',
    imaging:
      'X-quang phổi thường thấy tổn thương thâm nhiễm, nốt hoặc hang ở vùng đỉnh và hạ đòn — vị trí gợi ý mạnh. Tổn thương đa dạng, có thể xơ hoá, vôi hoá hoặc phối hợp nhiều dạng. Hình ảnh không đặc hiệu nên không thay thế được xét nghiệm vi khuẩn học. Chụp cắt lớp vi tính giúp phát hiện tổn thương nhỏ và hạch trung thất.',
    progression:
      'Không điều trị thì lao phổi phá huỷ nhu mô tiến triển, tạo hang, gây ho ra máu, suy hô hấp và tử vong. Điều trị đúng phác đồ và đủ thời gian cho tỷ lệ khỏi cao. Bỏ trị giữa chừng là nguyên nhân chính sinh lao kháng thuốc — điều trị khó hơn, lâu hơn và tốn kém hơn nhiều. Di chứng gồm xơ phổi, giãn phế quản và suy hô hấp mạn.',
    treatment:
      'Phác đồ chuẩn phối hợp nhiều thuốc, chia giai đoạn tấn công và duy trì, tổng thời gian tối thiểu 6 tháng cho lao phổi nhạy cảm thuốc. Nguyên tắc bắt buộc là phối hợp đủ thuốc, đúng liều, đều đặn và đủ thời gian. Cần theo dõi chức năng gan và thị lực tuỳ thuốc. Sàng lọc và điều trị lao tiềm ẩn cho người tiếp xúc gần và nhóm nguy cơ cao. Kiểm soát lây nhiễm và tiêm BCG cho trẻ sơ sinh là biện pháp dự phòng.',
  },
  {
    slug: 'viem-phoi-cong-dong',
    locale: 'vi',
    description:
      'Viêm phổi cộng đồng là nhiễm khuẩn nhu mô phổi mắc phải ngoài bệnh viện hoặc trong vòng 48 giờ đầu nhập viện. Tác nhân hay gặp nhất là Streptococcus pneumoniae, kế đến là Haemophilus influenzae, Mycoplasma pneumoniae, Chlamydia pneumoniae và virus hô hấp. Đường vào chủ yếu là hít phải dịch tiết hầu họng có chứa vi khuẩn.',
    clinical:
      'Khởi phát cấp tính với sốt cao, rét run, ho khạc đờm mủ, đau ngực kiểu màng phổi và khó thở. Khám thấy hội chứng đông đặc: rung thanh tăng, gõ đục, ran nổ khu trú. Ở người cao tuổi bệnh cảnh có thể chỉ là lú lẫn, ngã hoặc suy giảm toàn trạng mà không sốt. Thang điểm CURB-65 giúp quyết định điều trị ngoại trú hay nhập viện — đây là bước phân tầng quan trọng nhất.',
    imaging:
      'X-quang phổi là thăm dò bắt buộc để xác định chẩn đoán: hình mờ thâm nhiễm khu trú theo thuỳ hoặc phân thuỳ, có thể kèm tràn dịch màng phổi. Chụp cắt lớp vi tính khi X-quang không rõ hoặc bệnh không đáp ứng điều trị. Cần chụp lại sau điều trị ở nhóm nguy cơ để loại trừ ung thư phổi nằm dưới.',
    progression:
      'Phần lớn đáp ứng tốt trong 48 đến 72 giờ đầu. Không cải thiện sau thời gian này phải xem lại chẩn đoán, tác nhân và biến chứng. Biến chứng gồm tràn dịch màng phổi cận viêm, mủ màng phổi, áp xe phổi, nhiễm khuẩn huyết và suy hô hấp. Tiên lượng xấu hơn ở người cao tuổi, có bệnh nền và biểu hiện suy tạng.',
    treatment:
      'Kháng sinh theo kinh nghiệm cần bắt đầu sớm, lựa chọn dựa trên mức độ nặng, bệnh nền và dịch tễ kháng thuốc tại chỗ, rồi điều chỉnh khi có kết quả vi sinh. Điều trị hỗ trợ gồm bù dịch, hạ sốt, oxy khi có giảm oxy máu. Chuyển từ đường tĩnh mạch sang uống khi lâm sàng ổn định. Dự phòng bằng tiêm vaccine phế cầu và cúm cho nhóm nguy cơ, cai thuốc lá.',
  },
  {
    slug: 'viem-phoi-benh-vien',
    locale: 'vi',
    description:
      'Viêm phổi bệnh viện là viêm phổi xuất hiện sau 48 giờ nhập viện, không trong thời kỳ ủ bệnh lúc vào. Viêm phổi liên quan thở máy là thể riêng, xuất hiện sau 48 giờ đặt nội khí quản. Tác nhân khác hẳn viêm phổi cộng đồng: trực khuẩn Gram âm như Pseudomonas aeruginosa, Acinetobacter baumannii, Klebsiella, cùng tụ cầu vàng kháng methicillin — đều có tỷ lệ kháng thuốc cao.',
    clinical:
      'Nghi ngờ khi bệnh nhân nằm viện xuất hiện sốt mới, tăng tiết đờm mủ, tăng bạch cầu và giảm oxy máu. Ở bệnh nhân thở máy, dấu hiệu có thể chỉ là tăng nhu cầu oxy hoặc thay đổi tính chất dịch hút. Cần lấy bệnh phẩm đường hô hấp dưới để nuôi cấy định lượng TRƯỚC khi dùng kháng sinh, vì kết quả này quyết định việc xuống thang sau đó.',
    imaging:
      'X-quang tại giường thấy thâm nhiễm mới hoặc tiến triển. Hình ảnh ở bệnh nhân nặng thường khó diễn giải do phù phổi, xẹp phổi và hội chứng suy hô hấp cấp cùng tồn tại — vì vậy không chẩn đoán chỉ dựa trên hình ảnh. Chụp cắt lớp vi tính khi cần phân định.',
    progression:
      'Tỷ lệ tử vong cao hơn hẳn viêm phổi cộng đồng, một phần do bệnh nền nặng, một phần do vi khuẩn đa kháng. Kéo dài thời gian thở máy và nằm hồi sức. Biến chứng gồm sốc nhiễm khuẩn, mủ màng phổi và suy đa tạng.',
    treatment:
      'Kháng sinh theo kinh nghiệm phải phủ được tác nhân đa kháng nghi ngờ, dựa trên dữ liệu vi sinh của chính khoa phòng đó chứ không theo phác đồ chung. Xuống thang ngay khi có kháng sinh đồ, rút ngắn thời gian điều trị khi đáp ứng tốt. Dự phòng có hiệu lực chứng minh gồm nâng đầu giường, vệ sinh răng miệng, cai thở máy sớm và vệ sinh tay — quan trọng không kém việc chọn kháng sinh.',
  },
  {
    slug: 'tran-dich-mang-phoi',
    locale: 'vi',
    description:
      'Tràn dịch màng phổi là tình trạng tích tụ dịch bất thường trong khoang màng phổi. Cơ chế gồm tăng áp lực thuỷ tĩnh, giảm áp lực keo, tăng tính thấm màng phổi hoặc giảm dẫn lưu bạch huyết. Phân biệt dịch thấm và dịch tiết là bước định hướng nguyên nhân quan trọng nhất: dịch thấm hay do suy tim, xơ gan, hội chứng thận hư; dịch tiết do nhiễm khuẩn, lao, ung thư, bệnh tự miễn.',
    clinical:
      'Đau ngực kiểu màng phổi, khó thở tăng dần và ho khan. Khám thấy hội chứng ba giảm bên tổn thương: rì rào phế nang giảm, rung thanh giảm, gõ đục. Lượng dịch ít có thể không có triệu chứng. Chọc dò màng phổi là thủ thuật then chốt, xét nghiệm dịch theo tiêu chuẩn Light để phân loại thấm hay tiết, kèm tế bào học, sinh hoá, nuôi cấy và tìm vi khuẩn lao.',
    imaging:
      'X-quang phổi thẳng thấy mờ góc sườn hoành, đường cong Damoiseau khi lượng dịch trung bình; cần khoảng 200 mL mới thấy trên phim thẳng. Siêu âm màng phổi nhạy hơn nhiều, phát hiện được lượng dịch nhỏ, đánh giá vách hoá và hướng dẫn chọc dò an toàn. Chụp cắt lớp vi tính tìm nguyên nhân như u, dày màng phổi, tổn thương nhu mô.',
    progression:
      'Tiên lượng phụ thuộc hoàn toàn vào nguyên nhân. Tràn dịch cận viêm có thể tiến triển thành mủ màng phổi và vách hoá nếu dẫn lưu muộn. Tràn dịch do ung thư thường tái phát nhanh sau chọc tháo. Dịch tồn tại lâu gây dày dính màng phổi và hạn chế thông khí.',
    treatment:
      'Điều trị nguyên nhân là chính. Chọc tháo giảm triệu chứng khi khó thở nhiều, không tháo quá nhanh và quá nhiều một lần để tránh phù phổi do tái giãn nở. Tràn dịch cận viêm phức tạp và mủ màng phổi cần dẫn lưu sớm bằng ống. Tràn dịch ác tính tái phát cân nhắc gây dính màng phổi hoặc đặt ống dẫn lưu lưu trú.',
  },
  {
    slug: 'tran-khi-mang-phoi',
    locale: 'vi',
    description:
      'Tràn khí màng phổi là sự có mặt của khí trong khoang màng phổi làm phổi xẹp lại. Thể tự phát nguyên phát gặp ở người trẻ, cao gầy, hút thuốc, do vỡ bóng khí dưới màng phổi vùng đỉnh. Thể tự phát thứ phát xảy ra trên nền bệnh phổi có sẵn như COPD, lao, xơ phổi, và nặng hơn nhiều vì dự trữ hô hấp đã kém. Ngoài ra còn thể do chấn thương và do thủ thuật y tế.',
    clinical:
      'Khởi phát đột ngột với đau ngực chói bên tổn thương và khó thở. Khám thấy lồng ngực bên tổn thương giãn, rì rào phế nang giảm hoặc mất, gõ vang, rung thanh giảm. Tràn khí màng phổi áp lực là cấp cứu tối khẩn: khó thở dữ dội, tụt huyết áp, tĩnh mạch cổ nổi, khí quản bị đẩy lệch — phải chọc giảm áp ngay mà không chờ phim.',
    imaging:
      'X-quang phổi thẳng thấy đường viền màng phổi tạng tách khỏi thành ngực, vùng ngoài không có vân phổi. Phim chụp ở thì thở ra làm rõ tràn khí lượng ít. Siêu âm tại giường có độ nhạy cao trong cấp cứu. Chụp cắt lớp vi tính đánh giá bóng khí và bệnh phổi nền, định hướng chỉ định can thiệp phòng tái phát.',
    progression:
      'Lượng khí ít ở thể nguyên phát có thể tự hấp thu. Nguy cơ tái phát cao, khoảng 30% sau lần đầu và tăng dần sau mỗi lần. Thể thứ phát có tỷ lệ biến chứng và tử vong cao hơn nhiều. Biến chứng nguy hiểm nhất là tràn khí áp lực gây suy tuần hoàn.',
    treatment:
      'Lượng khí ít, không triệu chứng ở thể nguyên phát có thể theo dõi và thở oxy để tăng hấp thu. Lượng nhiều hoặc có triệu chứng thì chọc hút hoặc dẫn lưu khoang màng phổi. Tràn khí áp lực phải giảm áp cấp cứu ngay bằng kim rồi mới dẫn lưu. Can thiệp phòng tái phát bằng gây dính màng phổi hoặc phẫu thuật nội soi cắt bóng khí, chỉ định khi tái phát hoặc thể thứ phát. Bỏ thuốc lá làm giảm rõ nguy cơ tái phát.',
  },
  {
    slug: 'ung-thu-phoi',
    locale: 'vi',
    description:
      'Ung thư phổi là nguyên nhân tử vong hàng đầu trong các bệnh ung thư trên toàn cầu. Hút thuốc lá gây khoảng 85% số ca; các yếu tố khác gồm hút thuốc thụ động, amiăng, radon, ô nhiễm không khí và tiền sử xạ trị lồng ngực. Phân loại mô bệnh học chia hai nhóm có tiên lượng và cách điều trị khác hẳn nhau: ung thư phổi không tế bào nhỏ chiếm khoảng 85%, và ung thư phổi tế bào nhỏ khoảng 15%.',
    clinical:
      'Giai đoạn sớm thường không triệu chứng. Về sau có ho kéo dài hoặc thay đổi tính chất ho, ho ra máu, đau ngực, khó thở, sụt cân. Triệu chứng do xâm lấn tại chỗ gồm khàn tiếng do liệt dây thần kinh quặt ngược, hội chứng tĩnh mạch chủ trên, hội chứng Pancoast. Hội chứng cận ung thư như tăng calci máu hoặc hạ natri máu có thể là biểu hiện đầu tiên. Chẩn đoán xác định bắt buộc dựa vào mô bệnh học.',
    imaging:
      'X-quang phổi phát hiện ban đầu nhưng độ nhạy thấp với tổn thương nhỏ. Chụp cắt lớp vi tính lồng ngực có tiêm thuốc đánh giá khối u, hạch trung thất và xâm lấn. PET/CT giúp phân giai đoạn và phát hiện di căn xa. Nội soi phế quản, sinh thiết xuyên thành ngực dưới hướng dẫn hình ảnh hoặc siêu âm nội soi để lấy bệnh phẩm. Chụp cộng hưởng từ sọ não tìm di căn não.',
    progression:
      'Tiên lượng phụ thuộc giai đoạn lúc chẩn đoán, mà phần lớn bệnh nhân đến khi đã muộn. Ung thư tế bào nhỏ tiến triển rất nhanh, di căn sớm nhưng nhạy với hoá xạ trị ban đầu. Di căn hay gặp ở não, xương, gan và tuyến thượng thận.',
    treatment:
      'Ung thư không tế bào nhỏ giai đoạn sớm điều trị bằng phẫu thuật, có thể kèm hoá trị bổ trợ. Giai đoạn tiến xa dùng hoá trị, xạ trị, và ngày càng nhiều liệu pháp nhắm đích theo đột biến gen hoặc liệu pháp miễn dịch — nên xét nghiệm phân tử là bước bắt buộc trước khi chọn phác đồ. Ung thư tế bào nhỏ chủ yếu hoá xạ trị. Dự phòng hiệu quả nhất là không hút thuốc; tầm soát bằng cắt lớp vi tính liều thấp cho nhóm nguy cơ rất cao.',
  },
  {
    slug: 'gian-phe-quan',
    locale: 'vi',
    description:
      'Giãn phế quản là tình trạng giãn không hồi phục và thường xuyên của một hoặc nhiều phế quản, do phá huỷ thành phế quản. Vòng xoắn bệnh lý gồm nhiễm khuẩn, viêm, phá huỷ cấu trúc và ứ đọng dịch tiết, rồi lại tạo điều kiện cho nhiễm khuẩn tiếp theo. Nguyên nhân gồm di chứng nhiễm khuẩn hô hấp nặng thời thơ ấu, lao, tắc nghẽn phế quản, suy giảm miễn dịch, và các bệnh di truyền như xơ nang.',
    clinical:
      'Triệu chứng cốt lõi là ho khạc đờm mạn tính số lượng nhiều, đờm mủ, khạc nhiều vào buổi sáng và thay đổi theo tư thế. Ho ra máu là biểu hiện thường gặp, đôi khi ồ ạt. Khám nghe ran ẩm, ran nổ khu trú cố định một vùng qua nhiều lần khám — dấu hiệu định hướng tốt. Cấy đờm định kỳ để theo dõi vi khuẩn thường trú, đặc biệt Pseudomonas aeruginosa.',
    imaging:
      'Chụp cắt lớp vi tính lớp mỏng độ phân giải cao là tiêu chuẩn chẩn đoán: đường kính phế quản lớn hơn động mạch đi kèm tạo hình nhẫn, thành phế quản dày, phế quản vẫn thấy được ở gần màng phổi. X-quang phổi thường ít giá trị, chỉ thấy hình đường ray hoặc hình tổ ong khi tổn thương nặng.',
    progression:
      'Bệnh mạn tính, tiến triển qua các đợt bội nhiễm. Suy giảm chức năng phổi dần theo số đợt cấp. Biến chứng gồm ho ra máu nặng do vỡ động mạch phế quản, áp xe phổi, mủ màng phổi, suy hô hấp mạn và tâm phế mạn. Định cư Pseudomonas làm bệnh nặng lên rõ rệt.',
    treatment:
      'Trọng tâm là dẫn lưu đờm hằng ngày bằng vỗ rung, tư thế dẫn lưu và kỹ thuật ho có kiểm soát — đây là biện pháp nền, quan trọng ngang thuốc. Kháng sinh cho đợt bội nhiễm, chọn theo cấy đờm. Tiêm vaccine cúm và phế cầu. Ho ra máu nặng cần nút động mạch phế quản. Phẫu thuật cắt bỏ chỉ đặt ra khi tổn thương khu trú một vùng và triệu chứng nặng dù đã điều trị nội khoa tối ưu.',
  },
  {
    slug: 'ap-xe-phoi',
    locale: 'vi',
    description:
      'Áp xe phổi là ổ mủ trong nhu mô phổi hình thành sau hoại tử tổ chức, thường do nhiễm khuẩn. Cơ chế hay gặp nhất là hít phải dịch tiết hầu họng ở người có rối loạn nuốt, hôn mê, nghiện rượu hoặc vệ sinh răng miệng kém. Vi khuẩn thường là vi khuẩn kỵ khí phối hợp với vi khuẩn hiếu khí. Ngoài ra còn áp xe thứ phát sau tắc nghẽn phế quản do u, hoặc theo đường máu trong nhiễm khuẩn huyết.',
    clinical:
      'Khởi đầu như viêm phổi với sốt cao, đau ngực, ho. Giai đoạn ộc mủ là dấu hiệu đặc trưng: khạc ra lượng lớn mủ thối, sau đó sốt giảm và toàn trạng cải thiện. Đờm có mùi thối gợi ý mạnh vi khuẩn kỵ khí. Xét nghiệm thấy bạch cầu tăng cao, CRP tăng, có thể thiếu máu khi bệnh kéo dài. Cần cấy đờm và cấy máu trước khi dùng kháng sinh.',
    imaging:
      'X-quang phổi thấy hình hang có mức nước hơi trong vùng đông đặc — hình ảnh gần như đặc trưng. Vị trí hay gặp là phân thuỳ sau thuỳ trên hoặc phân thuỳ trên thuỳ dưới, phù hợp cơ chế hít. Chụp cắt lớp vi tính xác định rõ số lượng, kích thước ổ áp xe, phân biệt với mủ màng phổi khu trú và tìm nguyên nhân tắc nghẽn.',
    progression:
      'Điều trị nội khoa đúng và đủ thời gian cho kết quả tốt ở đa số trường hợp. Biến chứng gồm mủ màng phổi khi ổ áp xe vỡ vào khoang màng phổi, ho ra máu, giãn phế quản di chứng và nhiễm khuẩn huyết. Áp xe do tắc nghẽn bởi khối u có tiên lượng theo bệnh nền.',
    treatment:
      'Kháng sinh kéo dài, thường nhiều tuần cho tới khi hình hang trên phim biến mất, phải phủ được vi khuẩn kỵ khí. Dẫn lưu tư thế và vỗ rung hỗ trợ tống mủ. Nội soi phế quản khi nghi tắc nghẽn do u hoặc dị vật, đồng thời lấy bệnh phẩm. Dẫn lưu qua da hoặc phẫu thuật chỉ đặt ra khi thất bại điều trị nội khoa, ổ quá lớn hoặc có biến chứng.',
  },
  {
    slug: 'viem-phe-quan-cap',
    locale: 'vi',
    description:
      'Viêm phế quản cấp là tình trạng viêm cấp tính niêm mạc phế quản ở người trước đó không có bệnh phổi mạn tính. Nguyên nhân chủ yếu là virus hô hấp — cúm, á cúm, virus hợp bào hô hấp, adenovirus, rhinovirus; vi khuẩn chỉ chiếm tỷ lệ nhỏ. Bệnh thường tự giới hạn. Yếu tố thuận lợi gồm thời tiết lạnh, khói thuốc, ô nhiễm không khí.',
    clinical:
      'Khởi đầu bằng triệu chứng viêm đường hô hấp trên rồi chuyển xuống với ho là triệu chứng nổi bật, ban đầu ho khan sau khạc đờm trong hoặc đục. Có thể sốt nhẹ, đau rát sau xương ức khi ho. Khám phổi thường bình thường hoặc chỉ có ran rít ran ngáy rải rác; không có hội chứng đông đặc — điểm phân biệt then chốt với viêm phổi. Ho có thể kéo dài đến ba tuần sau khi hết các triệu chứng khác.',
    imaging:
      'Không cần chụp X-quang phổi thường quy. Chỉ chụp khi nghi viêm phổi: sốt cao kéo dài, khó thở, mạch nhanh, hoặc khám có hội chứng đông đặc; và ở người cao tuổi, người có bệnh nền.',
    progression:
      'Đại đa số khỏi hoàn toàn sau một đến ba tuần mà không để lại di chứng. Ở người có bệnh phổi nền, viêm phế quản cấp có thể khởi phát đợt cấp COPD hoặc cơn hen. Bội nhiễm vi khuẩn hoặc tiến triển thành viêm phổi là biến chứng cần theo dõi.',
    treatment:
      'Chủ yếu là điều trị triệu chứng: nghỉ ngơi, uống đủ nước, hạ sốt giảm đau, giảm ho khi ho ảnh hưởng giấc ngủ. KHÔNG dùng kháng sinh thường quy vì nguyên nhân phần lớn do virus — lạm dụng kháng sinh ở đây là một trong những nguồn kháng thuốc lớn nhất trong cộng đồng. Chỉ cân nhắc kháng sinh khi nghi ngờ tác nhân vi khuẩn hoặc ở người có nguy cơ cao. Bỏ thuốc lá và tránh khói bụi.',
  },
  {
    slug: 'tam-phe-man',
    locale: 'vi',
    description:
      'Tâm phế mạn là phì đại và giãn thất phải thứ phát sau bệnh lý của nhu mô phổi, mạch phổi hoặc lồng ngực gây tăng áp động mạch phổi — không bao gồm trường hợp do bệnh tim trái hay bệnh tim bẩm sinh. Nguyên nhân hàng đầu là COPD; ngoài ra còn giãn phế quản, lao xơ phổi, bệnh phổi kẽ, gù vẹo cột sống và hội chứng ngừng thở khi ngủ. Cơ chế trung tâm là co mạch phổi do thiếu oxy kéo dài, dẫn tới tái cấu trúc mạch phổi.',
    clinical:
      'Giai đoạn đầu bị che lấp bởi triệu chứng bệnh phổi nền: khó thở gắng sức, ho khạc đờm. Khi suy tim phải xuất hiện thì có phù chi dưới, gan to đau, tĩnh mạch cổ nổi, phản hồi gan tĩnh mạch cổ dương tính. Khám tim nghe T2 mạnh ở ổ van động mạch phổi. Khí máu động mạch thấy giảm oxy máu, có thể kèm tăng CO2 — yếu tố thúc đẩy chính.',
    imaging:
      'X-quang phổi thấy cung động mạch phổi phồng, bóng tim to về phía phải, kèm hình ảnh bệnh phổi nền. Điện tâm đồ có dấu hiệu dày nhĩ phải và thất phải, trục phải. Siêu âm Doppler tim là thăm dò then chốt: ước lượng áp lực động mạch phổi, đánh giá kích thước và chức năng thất phải, đồng thời loại trừ bệnh tim trái.',
    progression:
      'Là biểu hiện của bệnh phổi mạn giai đoạn muộn nên tiên lượng gắn với bệnh nền. Xuất hiện suy tim phải đánh dấu tiên lượng xấu đi rõ rệt. Các đợt bội nhiễm hô hấp thường thúc đẩy mất bù cấp.',
    treatment:
      'Điều trị bệnh phổi nền là gốc rễ. Thở oxy dài hạn tại nhà là biện pháp duy nhất chứng minh kéo dài được thời gian sống ở bệnh nhân COPD có giảm oxy máu mạn — chỉ định theo khí máu chứ không theo cảm giác khó thở. Lợi tiểu thận trọng khi có ứ trệ, tránh gây giảm thể tích và cô đặc máu. Điều trị tích cực các đợt bội nhiễm. Phục hồi chức năng hô hấp và cai thuốc lá.',
  },
  {
    slug: 'ho-ra-mau',
    locale: 'vi',
    description:
      'Ho ra máu là khạc ra máu có nguồn gốc từ đường hô hấp dưới, từ thanh quản trở xuống. Cần phân biệt với nôn ra máu và chảy máu đường hô hấp trên. Nguồn chảy máu phần lớn từ hệ động mạch phế quản vốn có áp lực cao, giải thích vì sao ho ra máu có thể ồ ạt. Nguyên nhân hay gặp ở Việt Nam gồm lao phổi và di chứng lao, giãn phế quản, ung thư phổi, viêm phổi hoại tử, và bệnh tim mạch như hẹp van hai lá.',
    clinical:
      'Máu ho ra thường đỏ tươi, có bọt, lẫn đờm, kèm cảm giác ngứa cổ và ho trước đó, phản ứng kiềm. Đánh giá đầu tiên là mức độ: ít, trung bình hay nặng — ho ra máu nặng là cấp cứu vì nguy cơ tử vong do ngạt chứ không do mất máu. Khai thác tiền sử lao, hút thuốc, dùng thuốc chống đông. Xét nghiệm gồm công thức máu, đông máu, nhóm máu, và tìm vi khuẩn lao trong đờm.',
    imaging:
      'X-quang phổi làm ngay để định hướng bên và vị trí tổn thương. Chụp cắt lớp vi tính lồng ngực có tiêm thuốc là thăm dò chính, xác định nguyên nhân và dựng hình động mạch phế quản trước khi can thiệp. Nội soi phế quản xác định bên chảy máu, hút máu đông và can thiệp cầm máu tại chỗ.',
    progression:
      'Ho ra máu ít thường tự cầm nhưng luôn phải tìm nguyên nhân, đặc biệt loại trừ lao và ung thư. Ho ra máu nặng có tỷ lệ tử vong cao, cơ chế tử vong là ngập máu đường thở gây ngạt. Tái phát thường gặp nếu không xử trí được nguyên nhân.',
    treatment:
      'Ưu tiên tuyệt đối là bảo vệ đường thở: nằm nghiêng về bên tổn thương để tránh máu tràn sang phổi lành, thở oxy, hút đờm máu, đặt nội khí quản khi cần. Thuốc cầm máu và điều chỉnh rối loạn đông máu. Nút động mạch phế quản là can thiệp hiệu quả cho ho ra máu nặng. Nội soi phế quản can thiệp cầm máu tại chỗ. Phẫu thuật là lựa chọn cuối khi tổn thương khu trú và các biện pháp khác thất bại. Sau cùng phải điều trị triệt để nguyên nhân.',
  },
  {
    slug: 'nhoi-mau-co-tim',
    locale: 'vi',
    description:
      'Hội chứng vành cấp là nhóm bệnh cảnh do mảng xơ vữa động mạch vành nứt vỡ, hình thành huyết khối gây tắc hoặc hẹp cấp tính lòng mạch. Chia ba thể theo điện tâm đồ và men tim: đau thắt ngực không ổn định, nhồi máu cơ tim không ST chênh lên, và nhồi máu cơ tim ST chênh lên. Nhồi máu cơ tim ST chênh lên tương ứng tắc hoàn toàn một nhánh vành, là thể cần tái tưới máu khẩn cấp nhất.',
    clinical:
      'Đau ngực sau xương ức kiểu đè ép, lan lên vai trái, hàm hoặc tay trái, kéo dài trên 20 phút, không đỡ khi nghỉ hoặc dùng nitrat. Kèm vã mồ hôi, buồn nôn, khó thở, cảm giác hoảng sợ. Người đái tháo đường, người cao tuổi và phụ nữ có thể không đau điển hình hoặc không đau. Điện tâm đồ 12 chuyển đạo phải làm trong vòng 10 phút từ khi tiếp xúc y tế. Troponin siêu nhạy tăng động học là tiêu chuẩn sinh hoá của hoại tử cơ tim.',
    imaging:
      'Siêu âm tim đánh giá rối loạn vận động vùng, chức năng thất trái và biến chứng cơ học. Chụp động mạch vành qua da vừa chẩn đoán vừa can thiệp, là thăm dò quyết định. Chụp cắt lớp vi tính động mạch vành dùng cho nhóm nguy cơ thấp đến trung bình để loại trừ bệnh mạch vành.',
    progression:
      'Tử vong cao nhất ở giờ đầu, chủ yếu do rung thất — nên thời gian đến bệnh viện quyết định tiên lượng hơn bất kỳ yếu tố nào khác. Biến chứng gồm rối loạn nhịp, suy tim cấp, sốc tim, biến chứng cơ học như thủng vách liên thất, đứt cơ nhú, vỡ thành tự do. Về lâu dài là suy tim do tái cấu trúc thất trái và đột tử.',
    treatment:
      'Nhồi máu cơ tim ST chênh lên cần tái tưới máu càng sớm càng tốt: can thiệp mạch vành qua da tiên phát là lựa chọn ưu tiên, tiêu sợi huyết khi không thể can thiệp kịp thời gian khuyến cáo. Điều trị nội khoa nền gồm kháng kết tập tiểu cầu kép, chống đông, statin liều cao, chẹn beta và ức chế men chuyển khi không chống chỉ định. Sau giai đoạn cấp cần phục hồi chức năng tim mạch và kiểm soát triệt để các yếu tố nguy cơ.',
  },
  {
    slug: 'suy-tim',
    locale: 'vi',
    description:
      'Suy tim là hội chứng lâm sàng do bất thường cấu trúc hoặc chức năng tim làm giảm cung lượng tim hoặc tăng áp lực đổ đầy, không đáp ứng đủ nhu cầu chuyển hoá của cơ thể. Phân loại hiện nay dựa vào phân suất tống máu thất trái: suy tim phân suất tống máu giảm, giảm nhẹ và bảo tồn — cách chia này quyết định lựa chọn thuốc. Nguyên nhân hàng đầu là bệnh động mạch vành và tăng huyết áp; ngoài ra có bệnh van tim, bệnh cơ tim, rối loạn nhịp kéo dài.',
    clinical:
      'Triệu chứng cơ năng gồm khó thở gắng sức tăng dần, khó thở khi nằm, cơn khó thở kịch phát về đêm, mệt mỏi và giảm khả năng gắng sức. Thực thể có tĩnh mạch cổ nổi, ran ẩm ở phổi, gan to, phù chi dưới, tiếng T3. Phân độ chức năng theo NYHA. NT-proBNP hoặc BNP tăng hỗ trợ chẩn đoán và có giá trị loại trừ cao khi bình thường ở bệnh nhân chưa điều trị.',
    imaging:
      'Siêu âm Doppler tim là thăm dò then chốt: đo phân suất tống máu, đánh giá kích thước buồng tim, chức năng tâm trương, bệnh van tim và áp lực động mạch phổi. X-quang ngực thấy bóng tim to, ứ huyết phổi, có thể tràn dịch màng phổi. Cộng hưởng từ tim khi cần xác định nguyên nhân bệnh cơ tim. Thăm dò thiếu máu cơ tim khi nghi nguyên nhân mạch vành.',
    progression:
      'Bệnh tiến triển với các đợt mất bù xen kẽ giai đoạn ổn định. Mỗi lần nhập viện vì mất bù đều làm xấu tiên lượng. Yếu tố thúc đẩy mất bù thường gặp gồm bỏ thuốc, ăn mặn, nhiễm khuẩn, rối loạn nhịp nhanh, thiếu máu và dùng thuốc chống viêm không steroid. Biến chứng gồm rối loạn nhịp, đột tử, huyết khối tắc mạch, suy thận và suy gan do ứ huyết.',
    treatment:
      'Suy tim phân suất tống máu giảm có bốn nhóm thuốc nền chứng minh giảm tử vong: ức chế hệ renin-angiotensin hoặc ARNI, chẹn beta, kháng aldosteron và ức chế SGLT2 — nên khởi trị sớm cả bốn nhóm rồi chỉnh liều. Lợi tiểu dùng để kiểm soát triệu chứng ứ huyết, không cải thiện tiên lượng. Hạn chế muối, theo dõi cân nặng hằng ngày, tiêm vaccine. Thiết bị như máy tạo nhịp tái đồng bộ hoặc máy phá rung cấy được cho nhóm có chỉ định. Ghép tim cho giai đoạn cuối.',
  },
  {
    slug: 'hep-van-hai-la',
    locale: 'vi',
    description:
      'Hẹp van hai lá là tình trạng giảm diện tích lỗ van hai lá gây cản trở dòng máu từ nhĩ trái xuống thất trái. Nguyên nhân áp đảo ở Việt Nam vẫn là di chứng thấp tim, với tổn thương dày dính mép van, xơ hoá và vôi hoá lá van cùng dây chằng. Hậu quả huyết động là tăng áp lực nhĩ trái, ứ huyết phổi và về sau là tăng áp động mạch phổi rồi suy tim phải.',
    clinical:
      'Khó thở gắng sức tăng dần là triệu chứng sớm nhất, sau đó khó thở khi nằm và cơn khó thở kịch phát về đêm. Có thể ho ra máu, khàn tiếng do nhĩ trái to chèn dây thần kinh quặt ngược. Nghe tim có rung tâm trương ở mỏm, tiếng T1 đanh, clac mở van; nghe được rõ nhất ở tư thế nghiêng trái. Rung nhĩ xuất hiện thường làm triệu chứng nặng lên đột ngột.',
    imaging:
      'Siêu âm Doppler tim là tiêu chuẩn chẩn đoán: đo diện tích lỗ van, chênh áp qua van, đánh giá hình thái van để chọn phương pháp can thiệp, và tìm huyết khối trong nhĩ trái bằng siêu âm qua thực quản trước khi nong van. X-quang ngực thấy nhĩ trái to, cung động mạch phổi phồng, ứ huyết phổi. Điện tâm đồ có dấu hiệu dày nhĩ trái hoặc rung nhĩ.',
    progression:
      'Diễn biến âm thầm nhiều năm sau đợt thấp tim rồi biểu hiện ở tuổi trung niên. Biến chứng chính là rung nhĩ, huyết khối nhĩ trái gây tắc mạch đặc biệt là đột quỵ não, phù phổi cấp, tăng áp động mạch phổi và suy tim phải. Viêm nội tâm mạc nhiễm khuẩn có thể xảy ra trên nền van tổn thương.',
    treatment:
      'Điều trị nội khoa kiểm soát triệu chứng: lợi tiểu giảm ứ huyết, chẹn beta hoặc chẹn kênh calci làm chậm nhịp để kéo dài thời gian đổ đầy. Rung nhĩ trên nền hẹp van hai lá bắt buộc chống đông bằng kháng vitamin K. Can thiệp khi hẹp khít có triệu chứng: nong van hai lá bằng bóng qua da nếu hình thái van thuận lợi và không có huyết khối, ngược lại phẫu thuật sửa hoặc thay van. Dự phòng thấp tim tái phát bằng kháng sinh kéo dài.',
  },
  {
    slug: 'viem-noi-tam-mac-nhiem-khuan',
    locale: 'vi',
    description:
      'Viêm nội tâm mạc nhiễm khuẩn là nhiễm khuẩn lớp nội mạc tim, thường khu trú ở van tim, tạo tổn thương đặc trưng là sùi gồm fibrin, tiểu cầu và vi khuẩn. Điều kiện thuận lợi là tổn thương nội mạc sẵn có kết hợp với vãng khuẩn huyết. Tác nhân hay gặp là liên cầu nhóm viridans, tụ cầu vàng và cầu khuẩn ruột. Nhóm nguy cơ gồm người có van nhân tạo, bệnh van tim, tim bẩm sinh, tiêm chích ma tuý và người có thiết bị cấy trong tim.',
    clinical:
      'Sốt kéo dài không rõ nguyên nhân kèm tiếng thổi mới ở tim là bộ đôi phải nghĩ ngay tới bệnh này. Kèm mệt mỏi, sụt cân, thiếu máu, lách to. Biểu hiện ngoại biên do tắc mạch và phức hợp miễn dịch gồm nốt Osler, tổn thương Janeway, chấm xuất huyết dưới móng và nốt Roth ở đáy mắt. Cấy máu nhiều mẫu ở các thời điểm khác nhau TRƯỚC khi dùng kháng sinh là bước quyết định. Chẩn đoán theo tiêu chuẩn Duke cải tiến.',
    imaging:
      'Siêu âm tim qua thành ngực làm đầu tiên, nhưng siêu âm qua thực quản có độ nhạy cao hơn nhiều để phát hiện sùi, áp xe vòng van và tổn thương van nhân tạo — cần làm khi nghi ngờ lâm sàng cao dù siêu âm qua thành ngực âm tính. Chụp cắt lớp vi tính hoặc cộng hưởng từ tìm ổ tắc mạch ở não, lách, thận.',
    progression:
      'Bệnh nặng, tỷ lệ tử vong đáng kể dù điều trị đúng. Biến chứng gồm suy tim cấp do hỏng van, tắc mạch hệ thống đặc biệt là đột quỵ, áp xe quanh van, phình mạch nấm và viêm cầu thận. Tụ cầu vàng và viêm nội tâm mạc trên van nhân tạo có tiên lượng xấu hơn.',
    treatment:
      'Kháng sinh đường tĩnh mạch liều cao, kéo dài thường 4 đến 6 tuần, chọn theo tác nhân và kháng sinh đồ. Phẫu thuật đặt ra khi suy tim do hỏng van, nhiễm khuẩn không kiểm soát được, áp xe quanh van, hoặc sùi lớn nguy cơ tắc mạch cao. Dự phòng bằng kháng sinh trước thủ thuật nha khoa chỉ áp dụng cho nhóm nguy cơ rất cao. Giữ vệ sinh răng miệng tốt quan trọng hơn kháng sinh dự phòng.',
  },
  {
    slug: 'viem-mang-ngoai-tim',
    locale: 'vi',
    description:
      'Viêm màng ngoài tim là tình trạng viêm của lớp màng bao quanh tim, có thể kèm hoặc không kèm tràn dịch màng ngoài tim. Nguyên nhân thường gặp gồm virus và vô căn, lao — vẫn quan trọng ở Việt Nam, bệnh tự miễn, urê máu cao, sau nhồi máu cơ tim, sau phẫu thuật tim và ung thư di căn.',
    clinical:
      'Đau ngực kiểu màng, đau nhói sau xương ức, tăng khi hít sâu và khi nằm ngửa, giảm khi ngồi cúi ra trước — tính chất tư thế này là điểm phân biệt quan trọng với đau thắt ngực. Nghe tim có tiếng cọ màng ngoài tim, đặc hiệu nhưng thoáng qua. Điện tâm đồ thấy ST chênh lên đồng hướng lan toả và PR chênh xuống. Khi tràn dịch nhiều thì điện thế thấp và luân phiên điện học.',
    imaging:
      'Siêu âm tim là thăm dò chính để phát hiện và định lượng dịch màng ngoài tim, đồng thời tìm dấu hiệu ép tim: đè xẹp nhĩ phải và thất phải thì tâm trương, thay đổi dòng chảy qua van theo hô hấp. X-quang ngực thấy bóng tim to hình bình khi dịch nhiều. Cắt lớp vi tính hoặc cộng hưởng từ đánh giá dày, vôi hoá màng ngoài tim và tìm nguyên nhân.',
    progression:
      'Viêm màng ngoài tim do virus thường tự khỏi trong vài tuần. Biến chứng cấp nguy hiểm nhất là ép tim cấp — cấp cứu nội khoa. Biến chứng muộn là viêm màng ngoài tim co thắt, hay gặp sau lao, gây suy tim phải mạn tính. Tái phát gặp ở khoảng một phần ba trường hợp.',
    treatment:
      'Thể virus và vô căn điều trị bằng thuốc chống viêm không steroid liều cao phối hợp colchicin — colchicin làm giảm rõ rệt tỷ lệ tái phát nên được khuyến cáo thường quy. Hạn chế gắng sức trong giai đoạn cấp. Corticoid chỉ dùng khi có chỉ định đặc hiệu vì làm tăng nguy cơ tái phát. Ép tim cần chọc dẫn lưu dịch cấp cứu. Viêm màng ngoài tim do lao điều trị theo phác đồ chống lao. Thể co thắt cần phẫu thuật bóc màng ngoài tim.',
  },
  {
    slug: 'huyet-khoi-tinh-mach-sau',
    locale: 'vi',
    description:
      'Huyết khối tĩnh mạch sâu chi dưới là sự hình thành cục máu đông trong hệ tĩnh mạch sâu, thường bắt đầu từ tĩnh mạch bắp chân rồi lan lên. Cơ chế theo tam chứng Virchow: ứ trệ dòng máu, tổn thương nội mạc và tăng đông. Yếu tố nguy cơ gồm bất động kéo dài, phẫu thuật lớn nhất là chỉnh hình, chấn thương, ung thư, mang thai, thuốc tránh thai, và các bệnh lý tăng đông di truyền hoặc mắc phải.',
    clinical:
      'Đau và sưng một bên chi dưới, chênh lệch chu vi bắp chân, chi nóng đỏ, tĩnh mạch nông giãn, dấu Homans dương tính. Tuy nhiên triệu chứng lâm sàng có độ đặc hiệu thấp, nhiều trường hợp im lặng và biểu hiện đầu tiên lại là thuyên tắc phổi. Thang điểm Wells giúp phân tầng xác suất trước xét nghiệm. D-dimer có giá trị loại trừ cao ở nhóm xác suất thấp nhưng không dùng để khẳng định.',
    imaging:
      'Siêu âm Doppler tĩnh mạch chi dưới với nghiệm pháp ép là thăm dò đầu tay: tĩnh mạch không xẹp khi ép là dấu hiệu chẩn đoán. Chụp cắt lớp vi tính động mạch phổi khi nghi thuyên tắc phổi kèm theo. Chụp tĩnh mạch cản quang hiện ít dùng.',
    progression:
      'Biến chứng cấp nguy hiểm nhất là thuyên tắc phổi, có thể gây tử vong đột ngột. Biến chứng muộn là hội chứng hậu huyết khối với đau, phù, loạn dưỡng da và loét chân do suy van tĩnh mạch mạn tính. Nguy cơ tái phát cao, đặc biệt khi huyết khối không có yếu tố thúc đẩy rõ ràng.',
    treatment:
      'Chống đông là điều trị nền, khởi đầu bằng heparin trọng lượng phân tử thấp hoặc thuốc chống đông đường uống thế hệ mới, thời gian tối thiểu 3 tháng và kéo dài hơn tuỳ yếu tố nguy cơ tồn tại. Vận động sớm và mang tất áp lực giúp giảm hội chứng hậu huyết khối. Lưới lọc tĩnh mạch chủ dưới chỉ đặt ra khi có chống chỉ định chống đông. Dự phòng huyết khối ở bệnh nhân nội trú nguy cơ cao là biện pháp hiệu quả nhất.',
  },
  {
    slug: 'cuong-giap',
    locale: 'vi',
    description:
      'Cường giáp là tình trạng tuyến giáp sản xuất quá mức hormon giáp, gây nhiễm độc giáp. Nguyên nhân hay gặp nhất là bệnh Basedow — bệnh tự miễn với kháng thể kích thích thụ thể TSH, đặc trưng bởi bướu giáp lan toả kèm bệnh mắt. Các nguyên nhân khác gồm bướu giáp nhân độc, viêm giáp và do dùng iod hoặc hormon giáp quá liều.',
    clinical:
      'Hội chứng nhiễm độc giáp gồm gầy sút dù ăn nhiều, sợ nóng, ra nhiều mồ hôi, hồi hộp đánh trống ngực, run tay biên độ nhỏ tần số nhanh, bồn chồn, mất ngủ, tiêu chảy. Khám thấy bướu giáp, da ấm ẩm, nhịp tim nhanh, có thể rung nhĩ ở người cao tuổi. Bệnh mắt Basedow với lồi mắt, phù mi, nhìn đôi là dấu hiệu đặc hiệu. Xét nghiệm: TSH giảm rất thấp, FT4 và FT3 tăng; kháng thể TRAb dương tính trong Basedow.',
    imaging:
      'Siêu âm tuyến giáp đánh giá kích thước, cấu trúc và tăng sinh mạch. Xạ hình tuyến giáp phân biệt các nguyên nhân theo mức bắt xạ: tăng lan toả trong Basedow, khu trú trong bướu nhân độc, giảm trong viêm giáp — đây là bước phân định quan trọng vì điều trị khác hẳn nhau.',
    progression:
      'Không điều trị dẫn tới rung nhĩ, suy tim, loãng xương và bệnh cơ do nhiễm độc giáp. Cơn bão giáp là biến chứng cấp tính đe doạ tính mạng, thường khởi phát do nhiễm khuẩn, phẫu thuật hoặc ngừng thuốc đột ngột, biểu hiện sốt cao, nhịp nhanh, rối loạn ý thức. Bệnh mắt có thể tiến triển độc lập với chức năng giáp.',
    treatment:
      'Ba lựa chọn chính là thuốc kháng giáp tổng hợp, iod phóng xạ và phẫu thuật; lựa chọn tuỳ nguyên nhân, mức độ, tuổi, ý muốn có thai và mức độ bệnh mắt. Thuốc kháng giáp dùng kéo dài 12 đến 18 tháng cho Basedow, cần theo dõi công thức bạch cầu và men gan vì nguy cơ mất bạch cầu hạt. Chẹn beta kiểm soát nhanh triệu chứng tim mạch trong khi chờ thuốc kháng giáp có tác dụng. Cơn bão giáp là cấp cứu, điều trị phối hợp tại hồi sức.',
  },
  {
    slug: 'suy-giap',
    locale: 'vi',
    description:
      'Suy giáp là tình trạng thiếu hormon giáp tác dụng lên mô đích. Suy giáp tiên phát do bệnh tại tuyến giáp chiếm đại đa số, hay gặp nhất là viêm giáp Hashimoto tự miễn, sau đó là hậu quả của điều trị cường giáp bằng iod phóng xạ hoặc phẫu thuật, và thiếu iod ở vùng dịch tễ. Suy giáp thứ phát do bệnh lý tuyến yên hoặc vùng dưới đồi thì hiếm hơn nhiều.',
    clinical:
      'Triệu chứng khởi phát âm thầm và không đặc hiệu nên dễ bỏ sót: mệt mỏi, sợ lạnh, tăng cân, táo bón, da khô, rụng tóc, giọng khàn, chậm chạp, giảm trí nhớ, rối loạn kinh nguyệt. Khám thấy phù niêm, nhịp tim chậm, phản xạ gân xương giảm với pha giãn kéo dài. Xét nghiệm quyết định là TSH tăng kèm FT4 giảm trong suy giáp tiên phát; TSH tăng đơn độc với FT4 bình thường là suy giáp dưới lâm sàng.',
    imaging:
      'Siêu âm tuyến giáp thấy nhu mô không đồng nhất, giảm âm trong viêm giáp Hashimoto. Kháng thể kháng TPO dương tính hỗ trợ chẩn đoán nguyên nhân tự miễn. Chụp cộng hưởng từ tuyến yên khi nghi suy giáp thứ phát.',
    progression:
      'Không điều trị dẫn tới rối loạn lipid máu và tăng nguy cơ tim mạch, thiếu máu, vô sinh và biến chứng thai kỳ. Suy giáp ở phụ nữ mang thai ảnh hưởng phát triển thần kinh của thai nên phải phát hiện và điều trị sớm. Hôn mê phù niêm là biến chứng cấp hiếm gặp nhưng tỷ lệ tử vong rất cao.',
    treatment:
      'Levothyroxin thay thế, uống lúc đói, xa các thuốc và thực phẩm ảnh hưởng hấp thu như sắt, calci. Liều khởi đầu thận trọng ở người cao tuổi và người có bệnh mạch vành để tránh khởi phát thiếu máu cơ tim. Chỉnh liều theo TSH sau mỗi 6 đến 8 tuần cho tới khi đạt đích, sau đó theo dõi định kỳ. Nhu cầu tăng trong thai kỳ nên cần điều chỉnh sớm khi có thai. Điều trị thường là suốt đời.',
  },
  {
    slug: 'hoi-chung-cushing',
    locale: 'vi',
    description:
      'Hội chứng Cushing là tập hợp biểu hiện lâm sàng do tiếp xúc kéo dài với lượng glucocorticoid quá mức. Nguyên nhân phổ biến nhất trong thực hành là do dùng thuốc corticoid kéo dài. Thể nội sinh chia hai nhóm: phụ thuộc ACTH — chủ yếu là u tuyến yên tiết ACTH gọi là bệnh Cushing, hoặc tiết ACTH lạc chỗ; và không phụ thuộc ACTH do u hoặc tăng sản tuyến thượng thận.',
    clinical:
      'Béo trung tâm với mặt tròn như mặt trăng, gồ mỡ sau gáy trong khi chi teo nhỏ do teo cơ gốc chi. Da mỏng, dễ bầm tím, vết rạn da màu đỏ tím rộng. Kèm tăng huyết áp, đái tháo đường hoặc rối loạn dung nạp glucose, loãng xương, rối loạn tâm thần, rậm lông và rối loạn kinh nguyệt ở nữ. Xét nghiệm sàng lọc gồm cortisol tự do nước tiểu 24 giờ, cortisol nước bọt lúc nửa đêm và nghiệm pháp ức chế bằng dexamethason liều thấp; sau đó định lượng ACTH để phân định nguyên nhân.',
    imaging:
      'Chụp cộng hưởng từ tuyến yên tìm u khi ACTH không bị ức chế. Chụp cắt lớp vi tính tuyến thượng thận khi ACTH thấp. Lấy máu xoang đá dưới định lượng ACTH là thăm dò phân định khi hình ảnh không kết luận được. Chụp cắt lớp ngực bụng tìm nguồn tiết ACTH lạc chỗ.',
    progression:
      'Không điều trị thì tỷ lệ tử vong cao do biến chứng tim mạch, nhiễm khuẩn và huyết khối. Loãng xương gây gãy xương bệnh lý. Suy giảm miễn dịch làm tăng nhiễm khuẩn cơ hội. Sau khi điều trị thành công, bệnh nhân có thể trải qua giai đoạn suy thượng thận cần thay thế hormon tạm thời.',
    treatment:
      'Thể do thuốc cần giảm liều corticoid từ từ, tuyệt đối không ngừng đột ngột vì nguy cơ suy thượng thận cấp. Bệnh Cushing điều trị bằng phẫu thuật nội soi qua xoang bướm lấy u tuyến yên. U thượng thận thì cắt bỏ tuyến. Thuốc ức chế tổng hợp steroid dùng khi chưa phẫu thuật được hoặc phẫu thuật thất bại. Song song phải kiểm soát tăng huyết áp, đái tháo đường, loãng xương và dự phòng huyết khối.',
  },
  {
    slug: 'ha-glucose-huyet',
    locale: 'vi',
    description:
      'Hạ glucose huyết là tình trạng nồng độ glucose máu giảm dưới ngưỡng gây triệu chứng, thường lấy mốc dưới 3,9 mmol/L ở người đái tháo đường. Nguyên nhân hay gặp nhất trong thực hành là biến chứng của điều trị đái tháo đường bằng insulin hoặc nhóm sulfonylurea, đặc biệt khi bỏ bữa, vận động quá mức hoặc uống rượu. Nguyên nhân khác gồm u tiết insulin, suy thượng thận, suy gan nặng và bệnh lý ác tính.',
    clinical:
      'Triệu chứng chia hai nhóm. Nhóm thần kinh tự chủ xuất hiện trước: vã mồ hôi, run tay, hồi hộp, đói cồn cào, lo lắng — đây là dấu hiệu cảnh báo. Nhóm thiếu glucose lên não xuất hiện sau: nhìn mờ, lú lẫn, nói khó, co giật, hôn mê. Người đái tháo đường lâu năm có thể mất cảm nhận hạ glucose, tức mất hẳn nhóm triệu chứng cảnh báo, nên hôn mê là biểu hiện đầu tiên — tình huống rất nguy hiểm. Chẩn đoán theo tam chứng Whipple.',
    imaging:
      'Không có vai trò trong xử trí cấp. Khi nghi u tiết insulin ở người không đái tháo đường, cần định lượng insulin, C-peptid và proinsulin lúc hạ glucose, sau đó chụp cắt lớp vi tính hoặc cộng hưởng từ tuỵ, siêu âm nội soi để định vị khối u.',
    progression:
      'Hạ glucose kéo dài và nặng gây tổn thương não không hồi phục và có thể tử vong. Các đợt lặp lại làm giảm dần khả năng nhận biết, tạo vòng xoắn nguy hiểm. Ở người cao tuổi, hạ glucose làm tăng nguy cơ ngã, biến cố tim mạch và suy giảm nhận thức.',
    treatment:
      'Người còn tỉnh và nuốt được: cho ngay 15 đến 20 g đường hấp thu nhanh, kiểm tra lại sau 15 phút và lặp lại nếu chưa cải thiện, sau đó ăn bữa có tinh bột phức để tránh tái phát. Người rối loạn ý thức: tiêm glucose ưu trương đường tĩnh mạch hoặc glucagon tiêm bắp, tuyệt đối không cho ăn uống đường miệng. Hạ glucose do sulfonylurea cần theo dõi kéo dài vì nguy cơ tái phát do thuốc thải chậm. Sau đó phải rà soát lại phác đồ và giáo dục người bệnh nhận biết dấu hiệu sớm.',
  },
  {
    slug: 'nhiem-khuan-tiet-nieu',
    locale: 'vi',
    description:
      'Nhiễm khuẩn tiết niệu là tình trạng vi khuẩn xâm nhập và phát triển trong đường tiết niệu. Phân loại theo vị trí thành nhiễm khuẩn đường tiết niệu dưới là viêm bàng quang, và trên là viêm thận bể thận; theo mức độ phức tạp thành thể không biến chứng và có biến chứng. Tác nhân hàng đầu là Escherichia coli, chiếm khoảng 80%. Đường lây chủ yếu là ngược dòng từ niệu đạo lên.',
    clinical:
      'Viêm bàng quang biểu hiện tiểu buốt, tiểu rắt, tiểu gấp, đau vùng trên xương mu, nước tiểu đục, không sốt. Viêm thận bể thận có thêm sốt cao rét run, đau vùng thắt lưng, vỗ hông lưng đau — dấu hiệu phân định quan trọng vì thay đổi hẳn thời gian và đường dùng kháng sinh. Xét nghiệm nước tiểu thấy bạch cầu niệu, nitrit dương tính. Cấy nước tiểu định danh vi khuẩn và làm kháng sinh đồ, cần thiết ở thể có biến chứng và tái phát.',
    imaging:
      'Thể không biến chứng ở phụ nữ trẻ không cần chẩn đoán hình ảnh. Siêu âm hệ tiết niệu chỉ định khi nhiễm khuẩn tái phát, nam giới, trẻ em, hoặc khi không đáp ứng điều trị — nhằm tìm sỏi, ứ nước, dị dạng hay áp xe. Chụp cắt lớp vi tính khi nghi áp xe thận hoặc viêm thận bể thận sinh hơi.',
    progression:
      'Viêm bàng quang không biến chứng đáp ứng nhanh và hiếm để lại hậu quả. Viêm thận bể thận có thể dẫn tới nhiễm khuẩn huyết, sốc nhiễm khuẩn và áp xe thận. Nhiễm khuẩn tái phát nhiều lần trên nền tắc nghẽn hoặc trào ngược có thể gây sẹo thận và bệnh thận mạn.',
    treatment:
      'Viêm bàng quang không biến chứng dùng kháng sinh ngắn ngày theo phác đồ kinh nghiệm phù hợp dịch tễ kháng thuốc địa phương. Viêm thận bể thận cần kháng sinh kéo dài hơn, khởi đầu đường tĩnh mạch khi có dấu hiệu nặng, sau đó chuyển uống. Phải giải quyết yếu tố tắc nghẽn như sỏi hoặc ứ nước, nếu không thì kháng sinh khó thành công. Uống đủ nước, đi tiểu sau giao hợp và không nhịn tiểu giúp giảm tái phát. Không điều trị vi khuẩn niệu không triệu chứng, trừ phụ nữ mang thai và trước can thiệp tiết niệu.',
  },
  {
    slug: 'benh-gout',
    locale: 'vi',
    description:
      'Gout là bệnh viêm khớp do lắng đọng tinh thể monosodium urat trong khớp và mô quanh khớp, hậu quả của tăng acid uric máu kéo dài. Tăng acid uric do giảm bài tiết qua thận ở khoảng 90% trường hợp, phần còn lại do tăng sản xuất. Yếu tố thúc đẩy cơn cấp gồm rượu bia, thực phẩm giàu purin, thuốc lợi tiểu, chấn thương, phẫu thuật và mất nước.',
    clinical:
      'Cơn gout cấp điển hình khởi phát đột ngột về đêm, đau dữ dội một khớp, hay gặp nhất là khớp bàn ngón chân cái, khớp sưng nóng đỏ, chạm nhẹ cũng đau. Cơn tự giảm sau vài ngày đến hai tuần kể cả không điều trị. Giai đoạn muộn có hạt tophi ở vành tai, quanh khớp và tổn thương nhiều khớp. Tiêu chuẩn vàng là soi dịch khớp thấy tinh thể urat hình kim, lưỡng chiết quang âm. Acid uric máu có thể bình thường ngay trong cơn cấp nên không dùng để loại trừ.',
    imaging:
      'X-quang giai đoạn sớm bình thường; muộn có hình khuyết xương hình móc câu, bờ rõ, khe khớp còn bảo tồn tương đối. Siêu âm khớp thấy dấu đường đôi trên bề mặt sụn — dấu hiệu khá đặc hiệu. Chụp cắt lớp vi tính năng lượng kép phát hiện và định lượng lắng đọng urat mà không cần chọc dịch khớp.',
    progression:
      'Không kiểm soát thì các cơn cấp thưa dần chuyển sang gout mạn có hạt tophi, huỷ khớp và biến dạng. Biến chứng ngoài khớp gồm sỏi thận urat và bệnh thận do urat. Gout thường đi kèm hội chứng chuyển hoá, tăng huyết áp và bệnh tim mạch — nên đánh giá đồng thời các bệnh này là bắt buộc chứ không phải tuỳ chọn.',
    treatment:
      'Cơn cấp điều trị bằng colchicin liều thấp, thuốc chống viêm không steroid hoặc corticoid, dùng càng sớm càng hiệu quả; tuyệt đối không khởi đầu thuốc hạ acid uric trong cơn cấp. Điều trị nền là hạ acid uric bằng allopurinol hoặc febuxostat, chỉnh liều tới đích dưới 360 micromol/L, thấp hơn nữa khi có tophi, kèm dự phòng cơn cấp bằng colchicin liều thấp trong vài tháng đầu. Chế độ ăn hạn chế purin, bỏ rượu bia, giảm cân, uống đủ nước.',
  },
  {
    slug: 'viem-khop-dang-thap',
    locale: 'vi',
    description:
      'Viêm khớp dạng thấp là bệnh tự miễn hệ thống, tổn thương chính là viêm màng hoạt dịch mạn tính, tiến triển gây phá huỷ sụn khớp và xương dưới sụn, dẫn tới dính và biến dạng khớp. Bệnh gặp nhiều ở nữ tuổi trung niên. Cơ chế liên quan tự kháng thể, đặc biệt yếu tố dạng thấp và kháng thể kháng peptid citrullin vòng, cùng các cytokine viêm như TNF-alpha và IL-6.',
    clinical:
      'Viêm nhiều khớp đối xứng, ưu thế ở các khớp nhỏ bàn tay như khớp bàn ngón và ngón gần, kèm cứng khớp buổi sáng kéo dài trên một giờ — thời gian cứng khớp là dấu hiệu phân biệt quan trọng với thoái hoá khớp. Về sau có biến dạng đặc trưng: bàn tay gió thổi, ngón hình cổ thiên nga, ngón hình khuy áo. Biểu hiện ngoài khớp gồm hạt dưới da, viêm mạch, tổn thương phổi kẽ, khô mắt khô miệng. Chẩn đoán theo tiêu chuẩn ACR/EULAR kết hợp lâm sàng, huyết thanh, viêm và thời gian.',
    imaging:
      'X-quang bàn tay hai bên thấy mất chất khoáng đầu xương cạnh khớp, hẹp khe khớp và bào mòn xương; tổn thương bào mòn thường xuất hiện muộn nên phim bình thường không loại trừ bệnh giai đoạn sớm. Siêu âm và cộng hưởng từ nhạy hơn nhiều trong phát hiện viêm màng hoạt dịch và bào mòn sớm, hỗ trợ chẩn đoán và theo dõi.',
    progression:
      'Không điều trị sớm thì tổn thương cấu trúc xảy ra ngay trong hai năm đầu và không hồi phục — đây là cơ sở của nguyên tắc điều trị sớm và tích cực. Biến chứng gồm mất chức năng vận động, loãng xương thứ phát và tăng nguy cơ tim mạch do viêm hệ thống mạn tính.',
    treatment:
      'Nguyên tắc là khởi trị thuốc chống thấp khớp làm thay đổi diễn tiến bệnh ngay khi chẩn đoán, với methotrexat là thuốc nền. Điều trị theo đích, đánh giá định kỳ bằng chỉ số hoạt động bệnh và chỉnh trị cho tới khi lui bệnh hoặc hoạt động bệnh thấp. Thuốc sinh học hoặc ức chế JAK khi thất bại với thuốc kinh điển. Corticoid liều thấp dùng bắc cầu ngắn hạn. Kết hợp vật lý trị liệu và phòng loãng xương.',
  },
  {
    slug: 'lupus-ban-do-he-thong',
    locale: 'vi',
    description:
      'Lupus ban đỏ hệ thống là bệnh tự miễn tổn thương nhiều cơ quan, đặc trưng bởi sự hình thành tự kháng thể và phức hợp miễn dịch lắng đọng ở mô. Bệnh gặp chủ yếu ở nữ trong độ tuổi sinh đẻ. Yếu tố khởi phát gồm di truyền, hormon sinh dục, tia cực tím, nhiễm khuẩn và một số thuốc. Biểu hiện rất đa dạng nên bệnh được mệnh danh là kẻ bắt chước nhiều bộ mặt.',
    clinical:
      'Biểu hiện thường gặp gồm ban cánh bướm ở mặt, nhạy cảm ánh sáng, loét miệng không đau, rụng tóc, viêm khớp không bào mòn, viêm thanh mạc. Tổn thương nội tạng quyết định tiên lượng: viêm thận lupus, tổn thương thần kinh tâm thần, giảm các dòng tế bào máu. Xét nghiệm có kháng thể kháng nhân dương tính độ nhạy cao nhưng không đặc hiệu; kháng thể kháng dsDNA và kháng Sm đặc hiệu hơn. Bổ thể C3, C4 giảm trong đợt hoạt động.',
    imaging:
      'Không có hình ảnh đặc hiệu cho bệnh. Thăm dò hướng theo cơ quan tổn thương: siêu âm tim tìm tràn dịch màng ngoài tim và viêm nội tâm mạc, X-quang hoặc cắt lớp vi tính ngực tìm viêm màng phổi và tổn thương phổi kẽ, cộng hưởng từ sọ não khi có biểu hiện thần kinh. Sinh thiết thận là bắt buộc để phân loại tổn thương và chọn phác đồ khi có viêm thận lupus.',
    progression:
      'Bệnh diễn biến từng đợt bùng phát xen kẽ giai đoạn lui bệnh. Tiên lượng đã cải thiện nhiều nhưng viêm thận lupus và tổn thương thần kinh trung ương vẫn là yếu tố nặng. Biến chứng lâu dài gồm bệnh thận mạn, xơ vữa động mạch sớm, nhiễm khuẩn do ức chế miễn dịch và loãng xương do corticoid. Hội chứng kháng phospholipid đi kèm gây huyết khối và sảy thai liên tiếp.',
    treatment:
      'Hydroxychloroquin dùng cho hầu hết bệnh nhân vì giảm bùng phát và cải thiện sống còn. Corticoid dùng theo mức độ, luôn hướng tới giảm liều thấp nhất có thể. Thuốc ức chế miễn dịch như mycophenolat, cyclophosphamid, azathioprin cho thể có tổn thương nội tạng; thuốc sinh học cho thể kháng trị. Bắt buộc tránh nắng, dùng kem chống nắng, tiêm vaccine trước khi ức chế miễn dịch, và tư vấn kế hoạch mang thai vào giai đoạn bệnh ổn định.',
  },
  {
    slug: 'thoai-hoa-khop',
    locale: 'vi',
    description:
      'Thoái hoá khớp là bệnh của toàn bộ khớp với tổn thương trung tâm là thoái hoá sụn khớp, kèm xơ xương dưới sụn, tạo gai xương và viêm màng hoạt dịch mức độ nhẹ. Đây không đơn thuần là hao mòn do tuổi mà là quá trình chuyển hoá chủ động của sụn. Yếu tố nguy cơ gồm tuổi cao, béo phì, chấn thương khớp, nghề nghiệp mang vác nặng, lệch trục chi và yếu tố di truyền. Vị trí hay gặp là khớp gối, háng, cột sống và bàn tay.',
    clinical:
      'Đau khớp kiểu cơ học: tăng khi vận động và chịu lực, giảm khi nghỉ; đây là điểm phân biệt căn bản với viêm khớp dạng thấp. Cứng khớp buổi sáng ngắn dưới 30 phút. Khám thấy lạo xạo khi vận động khớp, hạn chế biên độ, có thể tràn dịch khớp gối, biến dạng trục. Xét nghiệm viêm thường bình thường — nếu tăng cao phải nghĩ tới chẩn đoán khác.',
    imaging:
      'X-quang là thăm dò chính, bốn dấu hiệu kinh điển: hẹp khe khớp không đồng đều, đặc xương dưới sụn, gai xương ở rìa và hốc xương dưới sụn. Mức độ tổn thương trên phim thường không tương xứng với mức đau, nên quyết định điều trị dựa vào lâm sàng chứ không chỉ dựa vào phim. Cộng hưởng từ chỉ dùng khi nghi tổn thương sụn chêm, dây chằng hoặc hoại tử vô khuẩn.',
    progression:
      'Tiến triển chậm nhiều năm, xen kẽ đợt đau tăng. Hậu quả là hạn chế vận động, giảm chất lượng sống và mất chức năng, đặc biệt ở khớp gối và háng. Béo phì làm bệnh tiến triển nhanh hơn rõ rệt và là yếu tố can thiệp được.',
    treatment:
      'Nền tảng là biện pháp không dùng thuốc: giảm cân, tập cơ tứ đầu đùi và các bài tập chịu lực phù hợp, dùng dụng cụ trợ giúp, giáo dục người bệnh — hiệu quả không kém thuốc và không có tác dụng phụ. Giảm đau bằng paracetamol, thuốc chống viêm không steroid ưu tiên đường tại chỗ để hạn chế tác dụng phụ toàn thân. Tiêm corticoid nội khớp cho đợt viêm cấp, không lạm dụng. Thay khớp nhân tạo khi đau nhiều và mất chức năng dù đã điều trị nội khoa đầy đủ.',
  },
  {
    slug: 'loang-xuong',
    locale: 'vi',
    description:
      'Loãng xương là bệnh lý xương hệ thống đặc trưng bởi giảm khối lượng xương và tổn hại vi cấu trúc mô xương, làm xương giòn và tăng nguy cơ gãy. Loãng xương nguyên phát gồm thể sau mãn kinh do thiếu estrogen và thể ở người cao tuổi. Loãng xương thứ phát do corticoid kéo dài, cường giáp, cường cận giáp, bệnh tiêu hoá kém hấp thu, bất động lâu và một số thuốc.',
    clinical:
      'Bệnh diễn biến hoàn toàn thầm lặng cho tới khi xảy ra gãy xương — vì vậy được gọi là bệnh dịch thầm lặng. Biểu hiện muộn gồm đau cột sống, giảm chiều cao, gù lưng do xẹp đốt sống. Ba vị trí gãy xương đặc trưng là cột sống, cổ xương đùi và đầu dưới xương quay. Cần khai thác yếu tố nguy cơ và dùng công cụ FRAX để ước tính nguy cơ gãy xương 10 năm.',
    imaging:
      'Đo mật độ xương bằng phương pháp DXA tại cột sống thắt lưng và cổ xương đùi là tiêu chuẩn chẩn đoán, với chỉ số T-score từ âm 2,5 trở xuống. X-quang thường chỉ phát hiện được khi đã mất trên 30% khối lượng xương nên không dùng để chẩn đoán sớm, nhưng hữu ích để phát hiện xẹp đốt sống. Xét nghiệm loại trừ nguyên nhân thứ phát gồm calci, phospho, vitamin D, chức năng thận và tuyến giáp.',
    progression:
      'Gãy xương là hậu quả quan trọng nhất. Gãy cổ xương đùi ở người cao tuổi có tỷ lệ tử vong trong năm đầu cao và phần lớn người sống sót không hồi phục được chức năng như trước. Đã gãy một lần thì nguy cơ gãy tiếp theo tăng vọt, nên phòng gãy xương thứ phát là ưu tiên hàng đầu.',
    treatment:
      'Bổ sung đủ calci và vitamin D là nền cho mọi phác đồ. Thuốc chống huỷ xương nhóm bisphosphonat là lựa chọn đầu tay; denosumab và thuốc tạo xương dành cho nguy cơ rất cao hoặc thất bại điều trị. Song song phải phòng ngã: cải thiện thị lực, rà soát thuốc gây chóng mặt, tập thăng bằng, bố trí nhà ở an toàn. Vận động chịu trọng lực, bỏ thuốc lá, hạn chế rượu.',
  },
  {
    slug: 'viem-cot-song-dinh-khop',
    locale: 'vi',
    description:
      'Viêm cột sống dính khớp là bệnh viêm mạn tính thuộc nhóm bệnh lý cột sống huyết thanh âm tính, tổn thương chủ yếu ở khớp cùng chậu, cột sống và các khớp gốc chi. Bệnh liên quan chặt với kháng nguyên HLA-B27. Đặc trưng bệnh học là viêm tại điểm bám gân vào xương, dẫn tới cốt hoá và dính khớp. Bệnh khởi phát ở người trẻ, ưu thế nam giới.',
    clinical:
      'Đau lưng kiểu viêm là dấu hiệu định hướng: khởi phát âm thầm trước tuổi 40, kéo dài trên ba tháng, đau tăng khi nghỉ và về đêm, giảm khi vận động, kèm cứng cột sống buổi sáng kéo dài — ngược hẳn với đau lưng cơ học. Khám thấy hạn chế vận động cột sống thắt lưng, nghiệm pháp Schober giảm, giãn nở lồng ngực giảm. Biểu hiện ngoài khớp gồm viêm màng bồ đào trước, viêm khớp ngoại biên và viêm điểm bám gân gót.',
    imaging:
      'X-quang khớp cùng chậu tìm viêm khớp cùng chậu hai bên, nhưng thay đổi trên X-quang xuất hiện muộn sau nhiều năm. Cộng hưởng từ khớp cùng chậu phát hiện phù tuỷ xương ở giai đoạn sớm, cho phép chẩn đoán sớm hơn nhiều năm. Cột sống giai đoạn muộn có hình ảnh cầu xương và cột sống hình cây tre.',
    progression:
      'Tiến triển dần tới dính cột sống, mất đường cong sinh lý, gù cố định và hạn chế hô hấp do cứng lồng ngực. Cột sống đã dính trở nên giòn, dễ gãy ngay cả sau chấn thương nhẹ. Biến chứng khác gồm loãng xương, bệnh van động mạch chủ và bệnh phổi đỉnh.',
    treatment:
      'Vật lý trị liệu và tập luyện đều đặn suốt đời là nền tảng, mục tiêu giữ tư thế và biên độ vận động — đây là phần bệnh nhân phải tự làm hằng ngày. Thuốc chống viêm không steroid là điều trị dùng thuốc đầu tay và có hiệu quả rõ với đau kiểu viêm. Thuốc sinh học ức chế TNF hoặc IL-17 khi đáp ứng kém. Thuốc chống thấp khớp kinh điển ít hiệu quả với tổn thương trục nhưng có vai trò với khớp ngoại biên. Bỏ thuốc lá vì làm bệnh nặng hơn.',
  },
  {
    slug: 'thoat-vi-dia-dem-that-lung',
    locale: 'vi',
    description:
      'Thoát vị đĩa đệm cột sống thắt lưng là tình trạng nhân nhầy đĩa đệm thoát ra khỏi vòng xơ, chèn ép rễ thần kinh hoặc ống sống. Tầng hay gặp nhất là L4-L5 và L5-S1 vì chịu tải trọng lớn nhất và có biên độ vận động cao. Yếu tố thuận lợi gồm thoái hoá đĩa đệm theo tuổi, mang vác nặng sai tư thế, chấn thương, rung xóc kéo dài và béo phì.',
    clinical:
      'Đau thắt lưng lan xuống chân theo đường đi của rễ thần kinh, thường một bên; đau tăng khi ho, hắt hơi, rặn. Chèn ép rễ L5 gây đau mặt ngoài đùi cẳng chân tới mu chân và yếu duỗi ngón cái; chèn ép rễ S1 gây đau mặt sau đùi tới gót và giảm phản xạ gân gót. Nghiệm pháp Lasègue dương tính. Phải tìm dấu hiệu báo động: rối loạn cơ tròn, tê vùng yên ngựa, yếu liệt tiến triển — gợi ý hội chứng đuôi ngựa cần mổ cấp cứu.',
    imaging:
      'Cộng hưởng từ cột sống thắt lưng là thăm dò chính, xác định vị trí, mức độ thoát vị và tương quan với rễ thần kinh. Điều quan trọng là hình ảnh thoát vị rất hay gặp ở người không triệu chứng, nên chỉ có giá trị khi phù hợp với lâm sàng — chỉ định mổ dựa trên tương ứng lâm sàng và hình ảnh chứ không dựa trên phim đơn thuần. X-quang thường quy để loại trừ nguyên nhân khác.',
    progression:
      'Phần lớn cải thiện tự nhiên trong vòng 6 đến 12 tuần với điều trị bảo tồn, do nhân nhầy thoát vị bị tiêu dần. Một số ít tiến triển tới yếu liệt hoặc đau dai dẳng ảnh hưởng sinh hoạt. Hội chứng đuôi ngựa là biến chứng hiếm nhưng để lại di chứng nặng nếu mổ muộn.',
    treatment:
      'Điều trị bảo tồn là lựa chọn ban đầu cho hầu hết trường hợp: giảm đau, thuốc chống viêm không steroid, giãn cơ, vận động sớm trong giới hạn chịu đựng thay vì nằm bất động kéo dài, kết hợp vật lý trị liệu và hướng dẫn tư thế. Tiêm corticoid ngoài màng cứng cho đau rễ dai dẳng. Phẫu thuật đặt ra khi có hội chứng đuôi ngựa, liệt tiến triển, hoặc đau không chịu nổi kéo dài trên 6 đến 12 tuần dù điều trị đầy đủ.',
  },
  {
    slug: 'viem-quanh-khop-vai',
    locale: 'vi',
    description:
      'Viêm quanh khớp vai là nhóm bệnh lý của phần mềm quanh khớp vai gồm gân, bao gân, bao thanh dịch và bao khớp, không tổn thương đầu xương và sụn khớp. Các thể chính gồm viêm gân chóp xoay, viêm gân đầu dài cơ nhị đầu, thể đông cứng khớp vai và thể có lắng đọng calci. Yếu tố thuận lợi gồm vận động vai lặp lại, chấn thương, tuổi trung niên và đái tháo đường.',
    clinical:
      'Đau vùng vai lan xuống cánh tay, tăng khi vận động và về đêm khi nằm nghiêng bên đau. Hạn chế vận động là điểm phân định thể bệnh: thể đơn thuần chỉ hạn chế vận động chủ động, còn thể đông cứng hạn chế cả chủ động lẫn thụ động theo mọi hướng. Các nghiệm pháp khám chóp xoay giúp xác định gân tổn thương. Xét nghiệm viêm bình thường.',
    imaging:
      'X-quang khớp vai chủ yếu để loại trừ tổn thương xương khớp và phát hiện calci hoá gân. Siêu âm là thăm dò đầu tay đánh giá gân chóp xoay, gân nhị đầu và dịch bao thanh dịch, có ưu điểm khảo sát động. Cộng hưởng từ khi nghi rách chóp xoay hoàn toàn hoặc trước khi cân nhắc phẫu thuật.',
    progression:
      'Thể đơn thuần đáp ứng tốt và hồi phục trong vài tuần đến vài tháng. Thể đông cứng diễn biến qua ba giai đoạn đau, đông cứng và tan đông, kéo dài có thể tới hai năm nhưng phần lớn hồi phục. Rách chóp xoay không điều trị có thể tiến triển và ảnh hưởng chức năng lâu dài.',
    treatment:
      'Giảm đau và chống viêm trong giai đoạn cấp, kết hợp nghỉ tương đối chứ không bất động hoàn toàn vì bất động kéo dài chính là yếu tố gây đông cứng. Vật lý trị liệu và tập vận động khớp vai là điều trị then chốt, cần kiên trì. Tiêm corticoid tại chỗ dưới hướng dẫn siêu âm cho trường hợp đau nhiều. Phẫu thuật nội soi khi rách chóp xoay lớn hoặc thất bại điều trị bảo tồn kéo dài.',
  },
  {
    slug: 'benh-nhuoc-co',
    locale: 'vi',
    description:
      'Nhược cơ là bệnh tự miễn của khớp thần kinh cơ, do tự kháng thể chủ yếu kháng thụ thể acetylcholin ở màng sau khớp thần kinh cơ, làm giảm số lượng thụ thể hoạt động và giảm dẫn truyền. Bệnh có liên quan chặt với bất thường tuyến ức: tăng sản tuyến ức ở người trẻ và u tuyến ức ở khoảng 10 đến 15% trường hợp.',
    clinical:
      'Đặc điểm cốt lõi là yếu cơ dao động, tăng lên khi vận động lặp lại và về cuối ngày, giảm sau nghỉ ngơi — tính chất mỏi cơ này là chìa khoá chẩn đoán. Khởi đầu thường ở cơ vận nhãn với sụp mi và nhìn đôi, sau lan tới cơ hành tuỷ gây nói khó, nuốt khó, và cơ gốc chi. Nghiệm pháp mỏi cơ khi nhìn lên kéo dài. Xét nghiệm kháng thể kháng thụ thể acetylcholin và điện cơ kích thích lặp lại thấy hiện tượng giảm biên độ.',
    imaging:
      'Chụp cắt lớp vi tính hoặc cộng hưởng từ trung thất là bắt buộc ở mọi bệnh nhân mới chẩn đoán để tìm u tuyến ức — phát hiện u thay đổi hẳn hướng điều trị.',
    progression:
      'Bệnh diễn biến dao động, có đợt nặng lên do nhiễm khuẩn, phẫu thuật, stress, thai nghén hoặc một số thuốc như aminoglycosid và chẹn beta. Cơn nhược cơ là biến chứng đe doạ tính mạng với suy hô hấp do yếu cơ hô hấp, cần hỗ trợ thông khí. Thể chỉ khu trú ở mắt có tiên lượng nhẹ hơn nhưng nhiều trường hợp lan toàn thân trong hai năm đầu.',
    treatment:
      'Thuốc kháng cholinesterase như pyridostigmin cải thiện triệu chứng nhưng không thay đổi diễn tiến bệnh. Điều trị nền là ức chế miễn dịch bằng corticoid phối hợp thuốc tiết kiệm corticoid. Cắt tuyến ức có chỉ định khi có u tuyến ức, và cũng có lợi ở thể toàn thân có kháng thể dương tính ở người trẻ. Cơn nhược cơ điều trị bằng thay huyết tương hoặc globulin miễn dịch tĩnh mạch, kèm hỗ trợ hô hấp. Cần danh sách thuốc cần tránh và giáo dục người bệnh nhận biết dấu hiệu cơn nặng.',
  },
  {
    slug: 'viem-khop-phan-ung',
    locale: 'vi',
    description:
      'Viêm khớp phản ứng là viêm khớp vô khuẩn xuất hiện sau một nhiễm khuẩn ở nơi khác trong cơ thể, thường là đường tiêu hoá hoặc đường tiết niệu sinh dục, cách vài tuần. Bản thân khớp không có vi khuẩn — đây là điểm phân biệt căn bản với viêm khớp nhiễm khuẩn. Bệnh thuộc nhóm bệnh lý cột sống huyết thanh âm tính và liên quan HLA-B27. Tác nhân khởi phát hay gặp gồm Chlamydia, Salmonella, Shigella, Yersinia, Campylobacter.',
    clinical:
      'Viêm khớp không đối xứng, ưu thế chi dưới, khớp gối và cổ chân, xuất hiện 1 đến 4 tuần sau nhiễm khuẩn. Kèm viêm điểm bám gân, viêm ngón hình khúc dồi. Tam chứng Reiter kinh điển gồm viêm khớp, viêm niệu đạo và viêm kết mạc tuy không phải lúc nào cũng đủ. Cần khai thác kỹ tiền sử tiêu chảy hoặc viêm niệu đạo trước đó. Dịch khớp có tính chất viêm nhưng nuôi cấy âm tính.',
    imaging:
      'X-quang giai đoạn sớm bình thường. Trường hợp mạn tính có thể thấy viêm khớp cùng chậu không đối xứng, viêm điểm bám gân với hình cựa xương ở gót. Siêu âm và cộng hưởng từ phát hiện viêm điểm bám gân và viêm màng hoạt dịch sớm.',
    progression:
      'Phần lớn tự khỏi trong 3 đến 12 tháng. Khoảng 15 đến 30% chuyển sang thể mạn tính hoặc tái phát, đặc biệt ở người mang HLA-B27. Một số tiến triển thành bệnh lý cột sống mạn tính.',
    treatment:
      'Thuốc chống viêm không steroid là điều trị đầu tay. Tiêm corticoid nội khớp cho khớp viêm dai dẳng. Kháng sinh chỉ có vai trò khi còn nhiễm khuẩn hoạt động, đặc biệt nhiễm Chlamydia đường sinh dục — cần điều trị cả bạn tình; kháng sinh không rút ngắn được diễn biến viêm khớp đã khởi phát. Thể mạn tính dùng sulfasalazin hoặc methotrexat, thuốc sinh học khi kháng trị.',
  },
  {
    slug: 'loan-duong-co',
    locale: 'vi',
    description:
      'Loạn dưỡng cơ là nhóm bệnh cơ di truyền đặc trưng bởi thoái hoá và hoại tử sợi cơ tiến triển, dẫn tới yếu cơ và teo cơ không hồi phục. Thể hay gặp và nặng nhất là loạn dưỡng cơ Duchenne, di truyền lặn liên kết nhiễm sắc thể X do đột biến gen dystrophin, biểu hiện ở trẻ trai. Thể Becker do đột biến cùng gen nhưng còn giữ được một phần chức năng protein nên nhẹ hơn và khởi phát muộn hơn.',
    clinical:
      'Trẻ chậm biết đi, hay ngã, khó leo cầu thang, dáng đi lạch bạch. Dấu hiệu Gowers đặc trưng: trẻ phải chống tay lên đùi để đứng dậy từ tư thế ngồi. Giả phì đại cơ bắp chân do mô cơ bị thay bằng mô mỡ và xơ. Yếu cơ gốc chi đối xứng, tiến triển dần. Creatine kinase máu tăng rất cao ngay từ giai đoạn sớm, thường gấp hàng chục lần bình thường. Chẩn đoán xác định bằng xét nghiệm gen; sinh thiết cơ khi cần.',
    imaging:
      'Cộng hưởng từ cơ đánh giá mức độ thay thế mỡ và phân bố nhóm cơ tổn thương, hỗ trợ chọn vị trí sinh thiết và theo dõi tiến triển. Siêu âm tim và điện tâm đồ định kỳ là bắt buộc vì bệnh cơ tim đi kèm thường xuất hiện trước khi có triệu chứng.',
    progression:
      'Thể Duchenne tiến triển đều đặn, trẻ mất khả năng đi lại thường quanh tuổi thiếu niên, sau đó là biến chứng hô hấp do yếu cơ hô hấp và vẹo cột sống, cùng bệnh cơ tim giãn. Chăm sóc đa chuyên khoa hiện nay đã kéo dài đáng kể thời gian sống. Thể Becker tiến triển chậm hơn nhiều.',
    treatment:
      'Chưa có điều trị khỏi. Corticoid kéo dài làm chậm mất chức năng vận động và là can thiệp có bằng chứng mạnh nhất hiện nay. Chăm sóc đa chuyên khoa gồm vật lý trị liệu duy trì tầm vận động và phòng co rút, hỗ trợ hô hấp không xâm nhập khi suy hô hấp, thuốc tim mạch dự phòng bệnh cơ tim, phẫu thuật chỉnh vẹo cột sống, và phòng loãng xương do corticoid. Tư vấn di truyền cho gia đình là phần không thể thiếu.',
  },
  {
    slug: 'tao-bon',
    locale: 'vi',
    description:
      'Táo bón là rối loạn chức năng đại tiện với đặc điểm đi ngoài ít hơn ba lần mỗi tuần, phân cứng, phải rặn nhiều hoặc cảm giác đi không hết. Táo bón chức năng chiếm đa số, cơ chế gồm rối loạn vận động đại tràng và rối loạn chức năng cơ sàn chậu. Táo bón thứ phát do tổn thương thực thể như u đại trực tràng, hẹp, hoặc do bệnh toàn thân như suy giáp, đái tháo đường, bệnh thần kinh, và do thuốc như opioid, thuốc kháng cholinergic, sắt.',
    clinical:
      'Chẩn đoán táo bón chức năng theo tiêu chuẩn Rome dựa trên tần suất, tính chất phân và cảm giác khi đại tiện, kéo dài ít nhất ba tháng. Thăm khám hậu môn trực tràng là bắt buộc để đánh giá trương lực cơ thắt, tìm khối u và phát hiện rối loạn tống phân. Phải tìm dấu hiệu báo động: khởi phát mới ở người trên 50 tuổi, sụt cân, đi ngoài ra máu, thiếu máu, tiền sử gia đình ung thư đại trực tràng.',
    imaging:
      'Không cần chẩn đoán hình ảnh cho táo bón chức năng điển hình ở người trẻ. Nội soi đại trực tràng chỉ định khi có dấu hiệu báo động hoặc theo chương trình tầm soát ung thư đại trực tràng theo tuổi. Đo áp lực hậu môn trực tràng và nghiệm pháp tống bóng khi nghi rối loạn tống phân do mất đồng vận cơ sàn chậu.',
    progression:
      'Táo bón mạn tính ảnh hưởng chất lượng sống, gây trĩ, nứt kẽ hậu môn, sa trực tràng. Ở người cao tuổi có thể dẫn tới ứ phân, tắc ruột do phân và tiêu chảy giả do phân lỏng chảy vòng qua khối phân cứng. Lạm dụng thuốc nhuận tràng kích thích kéo dài làm giảm đáp ứng của đại tràng.',
    treatment:
      'Bước đầu là thay đổi lối sống: tăng chất xơ từ từ tới 25 đến 30 g mỗi ngày, uống đủ nước, vận động đều, tập thói quen đại tiện đúng giờ và không nhịn. Thuốc nhuận tràng thẩm thấu như macrogol hoặc lactulose là lựa chọn ưu tiên vì an toàn khi dùng dài. Nhuận tràng kích thích dùng ngắn hạn. Rối loạn tống phân đáp ứng tốt với phản hồi sinh học tập cơ sàn chậu chứ không phải thuốc nhuận tràng. Ngừng hoặc đổi các thuốc gây táo bón nếu được.',
  },
  {
    slug: 'hoi-chung-than-hu',
    locale: 'vi',
    description:
      'Hội chứng thận hư là hội chứng lâm sàng và sinh hoá do tổn thương màng lọc cầu thận làm mất protein qua nước tiểu số lượng lớn. Tiêu chuẩn gồm protein niệu trên 3,5 g trong 24 giờ, albumin máu dưới 30 g/L, phù và rối loạn lipid máu. Nguyên nhân nguyên phát gồm bệnh cầu thận thay đổi tối thiểu, xơ hoá cầu thận ổ đoạn, bệnh cầu thận màng. Thứ phát do đái tháo đường, lupus, amyloid, nhiễm khuẩn và thuốc.',
    clinical:
      'Phù là triệu chứng nổi bật: phù trắng, mềm, ấn lõm, bắt đầu ở mặt và mi mắt buổi sáng rồi lan toàn thân, có thể tràn dịch đa màng. Nước tiểu ít, có bọt. Xét nghiệm thấy protein niệu ngưỡng thận hư, albumin máu giảm nặng, cholesterol và triglycerid tăng, có thể trụ mỡ trong nước tiểu. Cần tìm nguyên nhân thứ phát bằng đường máu, kháng thể kháng nhân, huyết thanh viêm gan và điện di protein.',
    imaging:
      'Siêu âm hệ tiết niệu đánh giá kích thước và cấu trúc thận, loại trừ tắc nghẽn — thận thường kích thước bình thường hoặc hơi to. Sinh thiết thận là thăm dò quyết định để xác định týp mô bệnh học và chọn phác đồ, chỉ định ở người lớn và ở trẻ em khi không đáp ứng corticoid.',
    progression:
      'Diễn biến tuỳ týp mô bệnh học: bệnh cầu thận thay đổi tối thiểu đáp ứng corticoid rất tốt, còn xơ hoá cầu thận ổ đoạn hay tiến triển tới bệnh thận mạn. Biến chứng gồm nhiễm khuẩn do mất globulin miễn dịch, huyết khối tĩnh mạch do mất antithrombin III, suy thận cấp trước thận do giảm thể tích, và suy dinh dưỡng do mất protein kéo dài.',
    treatment:
      'Điều trị đặc hiệu theo mô bệnh học, thường là corticoid phối hợp thuốc ức chế miễn dịch khi kháng hoặc phụ thuộc corticoid. Điều trị hỗ trợ gồm hạn chế muối, lợi tiểu thận trọng để tránh giảm thể tích, và thuốc ức chế men chuyển hoặc ức chế thụ thể để giảm protein niệu. Statin kiểm soát rối loạn lipid. Dự phòng huyết khối ở người albumin máu rất thấp. Tiêm vaccine trước khi dùng thuốc ức chế miễn dịch.',
  },
  {
    slug: 'viem-cau-than-cap-sau-lien-cau',
    locale: 'vi',
    description:
      'Viêm cầu thận cấp sau nhiễm liên cầu là viêm cầu thận do phức hợp miễn dịch, xuất hiện sau nhiễm liên cầu tan huyết beta nhóm A ở họng hoặc da. Thời gian tiềm tàng khoảng 1 đến 2 tuần sau viêm họng, hoặc 3 đến 6 tuần sau nhiễm khuẩn da. Cơ chế là phức hợp kháng nguyên kháng thể lắng đọng ở cầu thận, hoạt hoá bổ thể gây viêm. Bệnh gặp chủ yếu ở trẻ em và người trẻ.',
    clinical:
      'Hội chứng viêm cầu thận cấp gồm phù, tăng huyết áp, đái máu và thiểu niệu. Đái máu đại thể làm nước tiểu màu nước rửa thịt là dấu hiệu điển hình. Xét nghiệm nước tiểu thấy hồng cầu biến dạng, trụ hồng cầu — dấu hiệu chỉ điểm nguồn gốc cầu thận. Bổ thể C3 giảm và trở về bình thường sau 6 đến 8 tuần; ASLO tăng chứng minh nhiễm liên cầu trước đó.',
    imaging:
      'Siêu âm thận thường thấy hai thận kích thước bình thường hoặc hơi to, tăng âm nhẹ; vai trò chính là loại trừ nguyên nhân khác. Sinh thiết thận không cần thiết trong thể điển hình ở trẻ em, chỉ đặt ra khi diễn biến không điển hình, bổ thể không hồi phục sau 8 tuần, hoặc suy thận tiến triển nhanh.',
    progression:
      'Tiên lượng ở trẻ em rất tốt, trên 95% hồi phục hoàn toàn. Đái máu vi thể có thể tồn tại vài tháng, không đồng nghĩa bệnh chưa khỏi. Biến chứng cấp gồm phù phổi cấp do quá tải dịch, bệnh não do tăng huyết áp và suy thận cấp. Ở người lớn tỷ lệ tiến triển tới bệnh thận mạn cao hơn.',
    treatment:
      'Chủ yếu là điều trị hỗ trợ: nghỉ ngơi trong giai đoạn cấp, hạn chế muối và nước, lợi tiểu khi phù và tăng huyết áp, thuốc hạ áp khi cần. Kháng sinh diệt liên cầu để loại ổ nhiễm khuẩn — không làm thay đổi diễn biến viêm cầu thận đã khởi phát nhưng cắt nguồn lây. Không dùng corticoid trong thể điển hình. Theo dõi huyết áp, nước tiểu và bổ thể cho tới khi hồi phục.',
  },
  {
    slug: 'benh-than-man',
    locale: 'vi',
    description:
      'Bệnh thận mạn là bất thường về cấu trúc hoặc chức năng thận kéo dài trên 3 tháng, phân giai đoạn theo mức lọc cầu thận ước tính và mức albumin niệu. Nguyên nhân hàng đầu hiện nay là đái tháo đường và tăng huyết áp, tiếp đến là viêm cầu thận, bệnh thận đa nang và bệnh thận tắc nghẽn. Cơ chế tiến triển chung là giảm số nephron hoạt động dẫn tới tăng lọc bù ở nephron còn lại, rồi xơ hoá cầu thận tiếp diễn.',
    clinical:
      'Giai đoạn sớm hoàn toàn không triệu chứng, chỉ phát hiện qua xét nghiệm — vì vậy tầm soát ở nhóm nguy cơ là cách duy nhất phát hiện kịp. Giai đoạn muộn có hội chứng urê máu cao: mệt mỏi, chán ăn, buồn nôn, ngứa, mất ngủ, chuột rút. Kèm thiếu máu, tăng huyết áp, phù. Xét nghiệm gồm creatinin và mức lọc cầu thận ước tính, tỷ lệ albumin trên creatinin niệu, điện giải, calci phospho và PTH.',
    imaging:
      'Siêu âm hệ tiết niệu là thăm dò cơ bản: hai thận thường teo nhỏ, tăng âm, mất phân biệt tuỷ vỏ; thận không teo gợi ý bệnh thận đa nang, bệnh thận đái tháo đường hoặc thận ứ nước. Siêu âm cũng loại trừ tắc nghẽn — nguyên nhân có thể hồi phục nên phải tìm sớm.',
    progression:
      'Bệnh tiến triển không hồi phục qua các giai đoạn tới suy thận giai đoạn cuối cần điều trị thay thế. Tốc độ tiến triển phụ thuộc nguyên nhân, mức protein niệu và kiểm soát huyết áp. Biến chứng gồm thiếu máu do thiếu erythropoietin, rối loạn chuyển hoá xương khoáng, toan chuyển hoá, tăng kali máu, và đặc biệt là bệnh tim mạch — nguyên nhân tử vong hàng đầu, vượt xa suy thận giai đoạn cuối.',
    treatment:
      'Trọng tâm là làm chậm tiến triển: kiểm soát huyết áp chặt, dùng ức chế men chuyển hoặc ức chế thụ thể để giảm protein niệu, thêm ức chế SGLT2 đã chứng minh bảo vệ thận. Kiểm soát đường máu ở người đái tháo đường. Chế độ ăn giảm đạm vừa phải, hạn chế muối, kali và phospho theo giai đoạn. Điều trị thiếu máu, rối loạn xương khoáng và toan chuyển hoá. Tránh thuốc độc thận, đặc biệt thuốc chống viêm không steroid và thuốc cản quang. Chuẩn bị đường mạch máu và tư vấn phương thức thay thế thận sớm.',
  },
  {
    slug: 'suy-than-cap',
    locale: 'vi',
    description:
      'Tổn thương thận cấp là suy giảm chức năng thận xảy ra trong vòng vài giờ đến vài ngày, biểu hiện bằng tăng creatinin máu hoặc giảm lượng nước tiểu. Phân ba nhóm nguyên nhân có hướng xử trí khác hẳn nhau: trước thận do giảm tưới máu, tại thận do tổn thương nhu mô mà hay gặp nhất là hoại tử ống thận cấp, và sau thận do tắc nghẽn đường tiết niệu.',
    clinical:
      'Biểu hiện tuỳ nguyên nhân và mức độ: thiểu niệu hoặc vô niệu, phù, tăng huyết áp, dấu hiệu quá tải dịch. Hội chứng urê máu cao xuất hiện khi suy nặng. Việc phân định ba nhóm nguyên nhân dựa vào bệnh sử, đánh giá thể tích tuần hoàn, xét nghiệm nước tiểu và phân suất bài tiết natri. Cần đặt sonde bàng quang và siêu âm sớm để không bỏ sót nguyên nhân tắc nghẽn — đây là nhóm hồi phục hoàn toàn nếu giải quyết kịp.',
    imaging:
      'Siêu âm hệ tiết niệu là thăm dò bắt buộc và làm sớm, nhằm loại trừ tắc nghẽn: thận ứ nước, sỏi, u chèn ép. Kích thước thận bình thường gợi ý tổn thương cấp, thận teo nhỏ gợi ý bệnh thận mạn có sẵn. Chụp cắt lớp vi tính hạn chế dùng thuốc cản quang vì nguy cơ độc thận.',
    progression:
      'Nhóm trước thận và sau thận hồi phục tốt nếu xử trí sớm. Hoại tử ống thận cấp thường qua ba giai đoạn khởi đầu, thiểu niệu và đái nhiều trở lại, hồi phục dần trong vài tuần. Biến chứng đe doạ tính mạng gồm tăng kali máu gây rối loạn nhịp, phù phổi cấp do quá tải dịch và toan chuyển hoá nặng. Một tỷ lệ đáng kể chuyển thành bệnh thận mạn về sau nên cần theo dõi dài hạn.',
    treatment:
      'Xử trí nguyên nhân là gốc: bù dịch cho thể trước thận, giải phóng tắc nghẽn cho thể sau thận, ngừng thuốc độc thận. Cân bằng dịch và điện giải chặt chẽ, theo dõi cân nặng và lượng nước tiểu hằng ngày. Tăng kali máu là ưu tiên xử trí ngay. Chỉ định lọc máu cấp cứu khi có quá tải dịch không đáp ứng lợi tiểu, tăng kali máu kháng trị, toan chuyển hoá nặng hoặc hội chứng urê máu cao có biến chứng.',
  },
  {
    slug: 'soi-tiet-nieu',
    locale: 'vi',
    description:
      'Sỏi tiết niệu là sự hình thành sỏi trong đường tiết niệu do quá bão hoà các chất tạo sỏi trong nước tiểu. Sỏi calci oxalat chiếm đa số, tiếp đến là sỏi acid uric, sỏi struvite liên quan nhiễm khuẩn và sỏi cystin do rối loạn di truyền. Yếu tố nguy cơ gồm uống ít nước, khí hậu nóng, chế độ ăn nhiều muối và đạm động vật, nhiễm khuẩn tiết niệu tái phát và bất thường giải phẫu gây ứ đọng.',
    clinical:
      'Cơn đau quặn thận là biểu hiện điển hình: đau dữ dội vùng thắt lưng lan xuống hố chậu và bộ phận sinh dục, bệnh nhân vật vã không tìm được tư thế giảm đau, kèm buồn nôn. Có thể đái máu đại thể hoặc vi thể, đái buốt đái rắt khi sỏi xuống thấp. Sốt kèm đau là dấu hiệu báo động nhiễm khuẩn trên nền tắc nghẽn — tình huống cấp cứu tiết niệu.',
    imaging:
      'Chụp cắt lớp vi tính không tiêm thuốc là tiêu chuẩn vàng, phát hiện gần như mọi loại sỏi kể cả sỏi không cản quang, đồng thời đánh giá mức ứ nước. Siêu âm là lựa chọn đầu tay ở phụ nữ có thai và trẻ em, phát hiện tốt sỏi thận và ứ nước nhưng kém nhạy với sỏi niệu quản đoạn giữa. X-quang bụng không chuẩn bị chỉ thấy sỏi cản quang.',
    progression:
      'Sỏi nhỏ dưới 5 mm phần lớn tự ra ngoài. Sỏi lớn hoặc tắc nghẽn kéo dài gây ứ nước thận, teo nhu mô và suy giảm chức năng thận. Nhiễm khuẩn trên nền tắc nghẽn có thể dẫn tới nhiễm khuẩn huyết và sốc nhiễm khuẩn. Tỷ lệ tái phát rất cao nếu không dự phòng, khoảng một nửa trong 5 đến 10 năm.',
    treatment:
      'Cơn đau quặn thận xử trí bằng thuốc chống viêm không steroid là lựa chọn hiệu quả nhất, kết hợp giảm đau khác khi cần. Sỏi nhỏ điều trị tống sỏi nội khoa kèm uống nhiều nước. Sỏi lớn hoặc gây tắc nghẽn cần tán sỏi ngoài cơ thể, tán sỏi nội soi ngược dòng hoặc lấy sỏi qua da tuỳ vị trí và kích thước. Tắc nghẽn kèm nhiễm khuẩn phải dẫn lưu cấp cứu trước, không tán sỏi ngay. Dự phòng tái phát bằng uống đủ nước để đạt trên 2 lít nước tiểu mỗi ngày, giảm muối, và điều trị theo thành phần sỏi sau khi phân tích.',
  },
  {
    slug: 'benh-than-da-nang',
    locale: 'vi',
    description:
      'Bệnh thận đa nang di truyền trội trên nhiễm sắc thể thường là bệnh di truyền thận thường gặp nhất, do đột biến gen PKD1 hoặc PKD2. Đặc trưng là hình thành và lớn dần vô số nang ở cả hai thận, chèn ép và thay thế nhu mô lành. Bệnh còn biểu hiện ngoài thận với nang gan, nang tuỵ và phình mạch não. Tiền sử gia đình là manh mối quan trọng nhất.',
    clinical:
      'Thường không triệu chứng tới tuổi trung niên. Biểu hiện gồm đau vùng thắt lưng âm ỉ do thận to, đái máu do vỡ nang, nhiễm khuẩn nang, sỏi thận và tăng huyết áp — tăng huyết áp thường xuất hiện sớm trước khi chức năng thận giảm. Khám có thể sờ thấy hai thận to. Xét nghiệm theo dõi creatinin và protein niệu.',
    imaging:
      'Siêu âm là thăm dò chẩn đoán chính, tiêu chuẩn số lượng nang thay đổi theo tuổi và tiền sử gia đình. Chụp cắt lớp vi tính hoặc cộng hưởng từ đánh giá chính xác hơn thể tích thận toàn phần — chỉ số tiên lượng tốc độ tiến triển. Chụp mạch não sàng lọc phình mạch chỉ định ở người có tiền sử gia đình vỡ phình mạch hoặc nghề nghiệp nguy cơ cao.',
    progression:
      'Thận to dần và chức năng suy giảm từ từ, phần lớn tiến tới suy thận giai đoạn cuối ở tuổi 50 đến 70; đột biến PKD1 tiến triển nhanh hơn PKD2. Biến chứng gồm nhiễm khuẩn nang khó điều trị, vỡ nang gây đau và đái máu, sỏi thận. Biến chứng ngoài thận nguy hiểm nhất là vỡ phình mạch não gây xuất huyết dưới nhện.',
    treatment:
      'Kiểm soát huyết áp chặt bằng ức chế men chuyển hoặc ức chế thụ thể là biện pháp nền làm chậm tiến triển. Uống nhiều nước, hạn chế muối. Tolvaptan làm chậm tăng thể tích thận và suy giảm chức năng ở nhóm tiến triển nhanh, cần theo dõi men gan. Điều trị nhiễm khuẩn nang cần kháng sinh thấm được vào nang và thời gian dài. Chuẩn bị điều trị thay thế thận khi tới giai đoạn cuối. Tư vấn di truyền cho gia đình.',
  },
  {
    slug: 'benh-than-lupus',
    locale: 'vi',
    description:
      'Bệnh thận lupus là tổn thương thận trong lupus ban đỏ hệ thống, do phức hợp miễn dịch lắng đọng ở cầu thận. Đây là một trong những yếu tố quyết định tiên lượng của lupus. Tổn thương được phân thành sáu nhóm theo mô bệnh học, từ tổn thương gian mạch tối thiểu tới viêm cầu thận tăng sinh lan toả và xơ hoá giai đoạn cuối — phân nhóm này quyết định trực tiếp phác đồ nên sinh thiết là bắt buộc.',
    clinical:
      'Biểu hiện rất thay đổi, từ protein niệu hoặc đái máu vi thể đơn thuần tới hội chứng thận hư đầy đủ hoặc viêm cầu thận tiến triển nhanh. Kèm biểu hiện lupus ngoài thận. Cần theo dõi định kỳ protein niệu, cặn nước tiểu, creatinin, kháng thể kháng dsDNA và bổ thể C3 C4 ở mọi bệnh nhân lupus vì tổn thương thận thường âm thầm.',
    imaging:
      'Siêu âm thận đánh giá kích thước và loại trừ nguyên nhân khác. Sinh thiết thận là thăm dò quyết định, chỉ định khi có protein niệu đáng kể, cặn nước tiểu hoạt động hoặc suy giảm chức năng thận không giải thích được — kết quả phân nhóm mô bệnh học định hướng toàn bộ điều trị.',
    progression:
      'Nhóm tăng sinh có nguy cơ tiến triển tới suy thận giai đoạn cuối cao nhất nếu không điều trị tích cực. Bệnh diễn biến từng đợt bùng phát, mỗi đợt đều để lại tổn thương tích luỹ. Tiên lượng đã cải thiện nhiều nhờ điều trị ức chế miễn dịch nhưng nhiễm khuẩn do ức chế miễn dịch là nguyên nhân tử vong quan trọng.',
    treatment:
      'Chia hai giai đoạn: tấn công để kiểm soát viêm và duy trì để phòng bùng phát. Nhóm tăng sinh dùng corticoid phối hợp mycophenolat hoặc cyclophosphamid, hiện thêm các thuốc mới như belimumab hoặc voclosporin. Duy trì bằng mycophenolat hoặc azathioprin kéo dài nhiều năm. Nền tảng cho mọi bệnh nhân là hydroxychloroquin, kiểm soát huyết áp và giảm protein niệu bằng ức chế hệ renin angiotensin. Dự phòng nhiễm khuẩn và loãng xương do corticoid.',
  },
  {
    slug: 'benh-than-iga',
    locale: 'vi',
    description:
      'Bệnh thận IgA là viêm cầu thận nguyên phát thường gặp nhất trên thế giới, đặc trưng bởi lắng đọng IgA ở vùng gian mạch cầu thận. Cơ chế liên quan IgA1 bị khiếm khuyết glycosyl hoá, tạo phức hợp miễn dịch lắng đọng tại cầu thận và hoạt hoá bổ thể. Bệnh hay gặp ở người trẻ, đặc biệt phổ biến ở châu Á.',
    clinical:
      'Hai bệnh cảnh kinh điển: đái máu đại thể tái diễn xuất hiện đồng thời hoặc ngay sau nhiễm khuẩn hô hấp trên — khác với viêm cầu thận sau liên cầu vốn có thời gian tiềm tàng vài tuần; và đái máu vi thể kèm protein niệu phát hiện tình cờ. Một số biểu hiện bằng hội chứng thận hư hoặc viêm cầu thận tiến triển nhanh. Bổ thể huyết thanh bình thường, IgA máu tăng ở một phần bệnh nhân nhưng không dùng để chẩn đoán.',
    imaging:
      'Siêu âm thận chủ yếu để loại trừ nguyên nhân khác của đái máu như sỏi và u. Chẩn đoán xác định chỉ có thể bằng sinh thiết thận với miễn dịch huỳnh quang thấy lắng đọng IgA ưu thế ở gian mạch. Phân loại Oxford trên mô bệnh học có giá trị tiên lượng.',
    progression:
      'Diễn biến rất thay đổi: một số ổn định nhiều năm, khoảng 20 đến 40% tiến tới suy thận giai đoạn cuối sau 20 năm. Yếu tố tiên lượng xấu gồm protein niệu kéo dài trên 1 g mỗi ngày, tăng huyết áp, mức lọc cầu thận đã giảm lúc chẩn đoán và tổn thương xơ hoá trên sinh thiết.',
    treatment:
      'Nền tảng là điều trị hỗ trợ tối ưu: kiểm soát huyết áp chặt, ức chế men chuyển hoặc ức chế thụ thể liều tối đa dung nạp để giảm protein niệu dưới 1 g mỗi ngày, hạn chế muối, bỏ thuốc lá, kiểm soát cân nặng. Ức chế SGLT2 bổ sung lợi ích bảo vệ thận. Corticoid cân nhắc cho người còn protein niệu cao dù đã điều trị hỗ trợ tối ưu, cân nhắc kỹ nguy cơ nhiễm khuẩn. Thể tiến triển nhanh cần ức chế miễn dịch mạnh.',
  },
  {
    slug: 'ton-thuong-than-cap',
    locale: 'vi',
    description:
      'Tổn thương thận cấp được định nghĩa theo tiêu chuẩn KDIGO dựa trên mức tăng creatinin máu hoặc giảm lượng nước tiểu trong khoảng thời gian xác định, chia ba giai đoạn nặng dần. Định nghĩa dựa trên biến thiên chứ không dựa trên một ngưỡng tuyệt đối, nên cần biết giá trị creatinin nền để so sánh. Nguyên nhân chia trước thận, tại thận và sau thận.',
    clinical:
      'Có thể hoàn toàn không triệu chứng ở giai đoạn đầu và chỉ phát hiện qua xét nghiệm — đây là lý do phải theo dõi creatinin chủ động ở bệnh nhân nguy cơ như người nằm hồi sức, sau phẫu thuật lớn, dùng thuốc độc thận. Khi nặng có thiểu niệu, phù, quá tải dịch, hội chứng urê máu cao. Đánh giá thể tích tuần hoàn là bước khám quan trọng nhất để phân định nguyên nhân.',
    imaging:
      'Siêu âm hệ tiết niệu làm sớm để loại trừ tắc nghẽn ở mọi trường hợp không rõ nguyên nhân. Doppler mạch thận khi nghi tắc mạch thận. Hạn chế tối đa thuốc cản quang; nếu buộc phải dùng thì bù dịch trước và sau.',
    progression:
      'Mức độ và thời gian tổn thương quyết định khả năng hồi phục. Ngay cả đợt tổn thương nhẹ cũng làm tăng nguy cơ bệnh thận mạn và tử vong về sau, nên cần theo dõi chức năng thận sau khi ra viện chứ không coi là đã xong. Biến chứng cấp gồm tăng kali máu, quá tải dịch, toan chuyển hoá và hội chứng urê máu cao.',
    treatment:
      'Nguyên tắc là xử trí nguyên nhân và tránh tổn thương thêm: tối ưu huyết động, ngừng thuốc độc thận, chỉnh liều thuốc theo mức lọc cầu thận, giải phóng tắc nghẽn. Theo dõi sát cân bằng dịch, điện giải và thăng bằng kiềm toan. Không dùng lợi tiểu để cải thiện chức năng thận, chỉ dùng để kiểm soát quá tải dịch. Lọc máu khi có chỉ định cấp cứu về dịch, kali, toan hoặc urê máu cao có biến chứng.',
  },
  {
    slug: 'suy-than-giai-doan-cuoi',
    locale: 'vi',
    description:
      'Suy thận giai đoạn cuối là mức lọc cầu thận giảm dưới 15 mL/phút/1,73 m2, khi thận không còn duy trì được nội môi và người bệnh cần điều trị thay thế thận để sống. Đây là điểm đến chung của mọi bệnh thận mạn tiến triển. Việc chuẩn bị phải bắt đầu từ giai đoạn trước đó chứ không đợi tới khi có triệu chứng urê máu cao.',
    clinical:
      'Hội chứng urê máu cao biểu hiện ở nhiều cơ quan: mệt mỏi, chán ăn, buồn nôn, ngứa, mất ngủ, giảm tập trung, viêm màng ngoài tim urê, bệnh thần kinh ngoại biên. Kèm thiếu máu, tăng huyết áp, quá tải dịch, toan chuyển hoá, tăng kali và rối loạn chuyển hoá xương khoáng. Đánh giá cần đầy đủ về dinh dưỡng, tim mạch và tình trạng đường mạch máu.',
    imaging:
      'Siêu âm thận thường thấy hai thận teo nhỏ, mất phân biệt tuỷ vỏ. Siêu âm Doppler mạch máu chi trên để lập kế hoạch tạo cầu nối động tĩnh mạch. Siêu âm tim đánh giá chức năng tim và phì đại thất trái trước khi vào chương trình lọc máu hoặc ghép thận.',
    progression:
      'Không điều trị thay thế thì tử vong trong thời gian ngắn. Với điều trị thay thế, tiên lượng phụ thuộc bệnh nền, tuổi và bệnh đồng mắc; nguyên nhân tử vong hàng đầu vẫn là bệnh tim mạch. Ghép thận cho chất lượng sống và thời gian sống tốt hơn lọc máu ở người đủ điều kiện.',
    treatment:
      'Ba phương thức thay thế thận là thận nhân tạo, lọc màng bụng và ghép thận; lựa chọn theo tình trạng bệnh nhân, bệnh đồng mắc và điều kiện thực tế. Điều trị bảo tồn tối ưu vẫn tiếp tục song song: kiểm soát huyết áp, thiếu máu bằng thuốc kích thích tạo hồng cầu và sắt, rối loạn xương khoáng bằng thuốc gắn phospho và vitamin D, toan chuyển hoá bằng bicarbonat. Chế độ ăn kiểm soát muối, kali, phospho và đủ năng lượng. Tạo cầu nối động tĩnh mạch trước khi cần lọc máu vài tháng. Điều trị giảm nhẹ là lựa chọn hợp lý cho người rất cao tuổi nhiều bệnh nền.',
  },
  {
    slug: 'dot-quy-nao',
    locale: 'vi',
    description:
      'Đột quỵ não là tình trạng thiếu sót thần kinh khởi phát đột ngột do tổn thương mạch máu não. Hai thể chính là nhồi máu não chiếm khoảng 80% do tắc mạch, và chảy máu não khoảng 20% do vỡ mạch — phân biệt hai thể là bắt buộc trước mọi điều trị vì hướng xử trí ngược nhau hoàn toàn. Yếu tố nguy cơ gồm tăng huyết áp, rung nhĩ, đái tháo đường, rối loạn lipid máu, hút thuốc và tuổi cao.',
    clinical:
      'Khởi phát đột ngột với liệt nửa người, méo miệng, nói khó hoặc thất ngôn, rối loạn cảm giác, mất thị trường, chóng mặt mất thăng bằng. Công cụ nhận biết nhanh tại cộng đồng là FAST. Chảy máu não thường có đau đầu dữ dội, nôn và rối loạn ý thức sớm hơn. Đánh giá mức độ bằng thang điểm NIHSS. Xác định chính xác thời điểm khởi phát là thông tin quyết định khả năng can thiệp tái tưới máu.',
    imaging:
      'Chụp cắt lớp vi tính sọ não không tiêm thuốc phải làm ngay, mục đích trước hết là phân biệt nhồi máu với chảy máu. Chụp mạch cắt lớp vi tính tìm tắc mạch lớn để chỉ định lấy huyết khối cơ học. Cộng hưởng từ khuếch tán nhạy hơn nhiều với nhồi máu giai đoạn tối cấp. Siêu âm tim và Holter điện tâm đồ tìm nguồn huyết khối từ tim.',
    progression:
      'Đây là nguyên nhân tàn phế hàng đầu ở người trưởng thành. Tổn thương não không hồi phục tiến triển theo từng phút nên thời gian là yếu tố quyết định kết cục. Biến chứng sớm gồm phù não, chuyển dạng chảy máu, co giật, viêm phổi hít và huyết khối tĩnh mạch sâu. Nguy cơ tái phát cao nếu không dự phòng thứ phát.',
    treatment:
      'Nhồi máu não trong cửa sổ thời gian cho phép được điều trị tiêu sợi huyết đường tĩnh mạch, và lấy huyết khối cơ học khi tắc mạch lớn. Chảy máu não tập trung kiểm soát huyết áp, đảo ngược thuốc chống đông và cân nhắc phẫu thuật theo vị trí, thể tích khối máu tụ. Chăm sóc chung gồm kiểm soát đường máu, thân nhiệt, phòng hít sặc, vận động sớm và phục hồi chức năng. Dự phòng thứ phát bằng chống kết tập tiểu cầu hoặc chống đông nếu do rung nhĩ, statin và kiểm soát toàn diện yếu tố nguy cơ.',
  },
  {
    slug: 'sa-sut-tri-tue',
    locale: 'vi',
    description:
      'Sa sút trí tuệ là hội chứng suy giảm nhận thức mắc phải, tiến triển, đủ nặng để ảnh hưởng hoạt động sống hằng ngày, không do rối loạn ý thức. Nguyên nhân thường gặp nhất là bệnh Alzheimer, tiếp đến là sa sút trí tuệ mạch máu, thể Lewy và thể trán thái dương; nhiều trường hợp có bệnh học phối hợp. Cần phân biệt với suy giảm nhận thức nhẹ và với sảng vốn khởi phát cấp và dao động.',
    clinical:
      'Alzheimer khởi đầu bằng giảm trí nhớ gần, quên tên, lặp câu hỏi, rồi lan tới ngôn ngữ, định hướng không gian và chức năng điều hành. Thể mạch máu tiến triển theo bậc thang kèm dấu hiệu thần kinh khu trú. Thể Lewy có ảo thị, dao động nhận thức và hội chứng ngoại tháp. Đánh giá bằng thang điểm như MMSE hoặc MoCA, kèm hỏi người chăm sóc. Bắt buộc loại trừ nguyên nhân hồi phục được: suy giáp, thiếu vitamin B12, trầm cảm, tác dụng thuốc.',
    imaging:
      'Chụp cắt lớp vi tính hoặc cộng hưởng từ sọ não để loại trừ tổn thương choán chỗ, tụ máu dưới màng cứng mạn, não úng thuỷ áp lực bình thường, và đánh giá teo não vùng hải mã cùng tổn thương chất trắng do mạch máu. Chụp PET và dấu ấn sinh học dịch não tuỷ dành cho trường hợp chẩn đoán khó hoặc khởi phát sớm.',
    progression:
      'Bệnh tiến triển không hồi phục qua các giai đoạn nhẹ, trung bình và nặng, thời gian trung bình nhiều năm. Giai đoạn muộn mất hoàn toàn khả năng tự chăm sóc, rối loạn nuốt, nằm liệt giường. Nguyên nhân tử vong thường là viêm phổi hít và nhiễm khuẩn. Rối loạn hành vi và tâm thần là gánh nặng lớn nhất với người chăm sóc.',
    treatment:
      'Chưa có điều trị khỏi. Thuốc ức chế cholinesterase và memantin cải thiện triệu chứng ở mức khiêm tốn. Can thiệp không dùng thuốc là trọng tâm: duy trì hoạt động thể chất và trí óc, giữ nếp sinh hoạt ổn định, môi trường an toàn, hỗ trợ và huấn luyện người chăm sóc. Rối loạn hành vi ưu tiên xử trí bằng biện pháp không dùng thuốc trước, thuốc an thần kinh chỉ dùng khi thật cần và liều thấp nhất vì làm tăng tử vong ở người cao tuổi. Kiểm soát yếu tố nguy cơ mạch máu giúp làm chậm tiến triển.',
  },
  {
    slug: 'phi-dai-lanh-tinh-tuyen-tien-liet',
    locale: 'vi',
    description:
      'Phì đại lành tính tuyến tiền liệt là tăng sinh lành tính của mô đệm và biểu mô vùng chuyển tiếp tuyến tiền liệt, gây chèn ép niệu đạo và triệu chứng đường tiểu dưới. Bệnh liên quan tuổi và androgen, tỷ lệ tăng dần theo tuổi. Cần phân biệt rõ với ung thư tuyến tiền liệt vốn thường xuất phát từ vùng ngoại vi — hai bệnh có thể cùng tồn tại.',
    clinical:
      'Triệu chứng đường tiểu dưới chia hai nhóm: nhóm tắc nghẽn gồm tia tiểu yếu, tiểu ngập ngừng, tiểu ngắt quãng, tiểu không hết; nhóm kích thích gồm tiểu nhiều lần, tiểu gấp, tiểu đêm. Lượng giá bằng thang điểm IPSS. Thăm trực tràng đánh giá kích thước, mật độ và bề mặt tuyến — mật độ cứng hoặc nhân gợi ý ung thư. Xét nghiệm PSA và creatinin, cấy nước tiểu khi nghi nhiễm khuẩn.',
    imaging:
      'Siêu âm đánh giá kích thước tuyến tiền liệt, lượng nước tiểu tồn dư sau tiểu và tình trạng đường tiết niệu trên. Niệu dòng đồ đo tốc độ dòng tiểu để khách quan hoá mức tắc nghẽn. Sinh thiết tuyến tiền liệt khi PSA tăng hoặc thăm trực tràng nghi ngờ, thường có hướng dẫn của cộng hưởng từ.',
    progression:
      'Bệnh tiến triển chậm, nhiều trường hợp ổn định lâu dài. Biến chứng gồm bí tiểu cấp, nhiễm khuẩn tiết niệu tái phát, sỏi bàng quang, đái máu, và về lâu dài là ứ nước thận hai bên gây suy thận sau thận. Bí tiểu cấp là biến cố cần can thiệp ngay.',
    treatment:
      'Triệu chứng nhẹ chỉ cần theo dõi và điều chỉnh lối sống: hạn chế uống nước buổi tối, tránh rượu và cà phê, rà soát thuốc gây bí tiểu. Thuốc chẹn alpha cải thiện triệu chứng nhanh; thuốc ức chế 5-alpha reductase làm nhỏ tuyến, hiệu quả sau vài tháng và phù hợp với tuyến to. Phẫu thuật cắt đốt nội soi qua niệu đạo là điều trị chuẩn khi thuốc thất bại hoặc đã có biến chứng như bí tiểu tái phát, sỏi bàng quang, suy thận do tắc nghẽn.',
  },
  {
    slug: 'suy-tinh-mach-man-tinh',
    locale: 'vi',
    description:
      'Suy tĩnh mạch mạn tính chi dưới là tình trạng máu tĩnh mạch không trở về tim hiệu quả do suy van tĩnh mạch, tắc nghẽn hoặc rối loạn bơm cơ cẳng chân, dẫn tới tăng áp lực tĩnh mạch kéo dài. Nguyên nhân gồm suy van tiên phát và hậu quả của huyết khối tĩnh mạch sâu. Yếu tố nguy cơ gồm tuổi, nữ giới, mang thai nhiều lần, béo phì, đứng lâu và tiền sử gia đình.',
    clinical:
      'Triệu chứng cơ năng gồm nặng chân, mỏi, chuột rút về đêm, cảm giác kiến bò, tăng lên khi đứng lâu và cuối ngày, giảm khi kê cao chân. Thực thể theo phân loại CEAP từ giãn mao mạch, giãn tĩnh mạch nông, phù, biến đổi da như xạm da và xơ mỡ da, đến loét. Loét tĩnh mạch điển hình ở vùng trên mắt cá trong, bờ không đều, nền có mô hạt.',
    imaging:
      'Siêu âm Doppler tĩnh mạch chi dưới là thăm dò tiêu chuẩn: xác định dòng trào ngược, đánh giá hệ tĩnh mạch nông và sâu, tìm huyết khối cũ và lập bản đồ trước can thiệp. Đây là bước bắt buộc trước mọi chỉ định phẫu thuật hoặc can thiệp nội tĩnh mạch.',
    progression:
      'Bệnh tiến triển chậm nhưng liên tục nếu không can thiệp, dẫn tới biến đổi da không hồi phục và loét mạn tính khó lành, tái phát nhiều lần. Biến chứng khác gồm viêm tĩnh mạch nông huyết khối, chảy máu do vỡ búi giãn và chàm tĩnh mạch.',
    treatment:
      'Nền tảng là băng ép hoặc tất áp lực y khoa với áp lực phù hợp — biện pháp có hiệu quả nhất và phải duy trì lâu dài, cần loại trừ bệnh động mạch chi dưới trước khi dùng. Kết hợp kê cao chân, tập vận động cổ chân, giảm cân, tránh đứng ngồi lâu. Thuốc trợ tĩnh mạch giảm triệu chứng. Can thiệp loại bỏ tĩnh mạch suy bằng laser hoặc sóng cao tần nội tĩnh mạch, tiêm xơ hoặc phẫu thuật khi có trào ngược đáng kể và triệu chứng nhiều. Loét tĩnh mạch điều trị bằng băng ép kết hợp chăm sóc vết thương.',
  },
  {
    slug: 'thieu-mau',
    locale: 'vi',
    description:
      'Thiếu máu là tình trạng giảm nồng độ hemoglobin dưới ngưỡng theo tuổi và giới, làm giảm khả năng vận chuyển oxy của máu. Đây là hội chứng chứ không phải một bệnh, nên tìm nguyên nhân là bắt buộc. Phân loại theo thể tích trung bình hồng cầu giúp định hướng nhanh: hồng cầu nhỏ gợi ý thiếu sắt và thalassemia, hồng cầu to gợi ý thiếu vitamin B12 hoặc acid folic, hồng cầu bình thường gợi ý thiếu máu do bệnh mạn tính, mất máu cấp hoặc suy tuỷ.',
    clinical:
      'Triệu chứng do thiếu oxy mô và do cơ chế bù trừ: da niêm mạc nhợt, mệt mỏi, hoa mắt chóng mặt, khó thở gắng sức, hồi hộp, nhịp tim nhanh. Mức độ triệu chứng phụ thuộc tốc độ xuất hiện hơn là con số hemoglobin — thiếu máu mạn tính có thể dung nạp tốt ở mức rất thấp. Bộ xét nghiệm gồm công thức máu với các chỉ số hồng cầu, hồng cầu lưới, sắt huyết thanh, ferritin, vitamin B12 và folat, cùng tìm nguồn mất máu.',
    imaging:
      'Không có chẩn đoán hình ảnh cho bản thân thiếu máu; thăm dò hướng vào nguyên nhân. Nội soi dạ dày và đại tràng là bắt buộc ở người trưởng thành thiếu máu thiếu sắt không giải thích được, nhằm tìm ung thư đường tiêu hoá. Siêu âm bụng và phụ khoa khi nghi nguồn mất máu khác.',
    progression:
      'Thiếu máu kéo dài gây suy tim cung lượng cao, giảm khả năng lao động và ảnh hưởng phát triển thể chất trí tuệ ở trẻ em. Tiên lượng hoàn toàn phụ thuộc nguyên nhân nền: thiếu sắt do mất máu tiêu hoá có thể là dấu hiệu đầu tiên của ung thư đại trực tràng.',
    treatment:
      'Nguyên tắc là điều trị nguyên nhân, không chỉ bù máu. Thiếu sắt bổ sung sắt đường uống, uống lúc đói kèm vitamin C để tăng hấp thu, tiếp tục thêm 3 tháng sau khi hemoglobin về bình thường để làm đầy kho dự trữ. Thiếu B12 và folat bổ sung theo đường phù hợp với cơ chế. Truyền máu chỉ đặt ra khi thiếu máu nặng có triệu chứng hoặc mất máu cấp, không dựa máy móc vào một ngưỡng hemoglobin.',
  },
  {
    slug: 'thieu-mau-tan-mau',
    locale: 'vi',
    description:
      'Thiếu máu tan máu là thiếu máu do hồng cầu bị phá huỷ sớm, đời sống hồng cầu rút ngắn dưới 120 ngày, vượt quá khả năng bù của tuỷ xương. Phân loại theo nguyên nhân tại hồng cầu hay ngoài hồng cầu: nhóm di truyền gồm thalassemia, thiếu men G6PD, bệnh hồng cầu hình cầu; nhóm mắc phải gồm tan máu tự miễn, tan máu do thuốc, do nhiễm khuẩn, do van tim nhân tạo và tan máu vi mạch.',
    clinical:
      'Tam chứng gợi ý là thiếu máu, vàng da và lách to. Vàng da kiểu tăng bilirubin gián tiếp, nước tiểu sẫm màu nhưng phân không bạc màu — điểm phân biệt với vàng da tắc mật. Xét nghiệm đặc trưng gồm tăng hồng cầu lưới, tăng bilirubin gián tiếp, tăng LDH và giảm haptoglobin. Nghiệm pháp Coombs trực tiếp phân định tan máu tự miễn với các nguyên nhân khác — đây là bước rẽ nhánh quan trọng nhất.',
    imaging:
      'Siêu âm bụng đánh giá kích thước lách và tìm sỏi mật sắc tố — biến chứng thường gặp do tăng bilirubin kéo dài. Điện di huyết sắc tố khi nghi thalassemia hoặc bệnh huyết sắc tố khác. Tiêu bản máu ngoại vi có giá trị định hướng cao qua hình thái hồng cầu.',
    progression:
      'Thể mạn tính gây sỏi mật sắc tố, ứ sắt do truyền máu nhiều lần, chậm phát triển ở trẻ em và biến dạng xương trong thalassemia thể nặng. Cơn tan máu cấp có thể gây suy thận cấp và thiếu máu nặng đe doạ tính mạng. Tan máu tự miễn có thể là biểu hiện của lupus hoặc bệnh lý lympho ác tính nên phải tìm bệnh nền.',
    treatment:
      'Điều trị theo nguyên nhân. Tan máu tự miễn dùng corticoid là lựa chọn đầu tay, sau đó là rituximab hoặc cắt lách khi kháng trị. Thiếu men G6PD chủ yếu là phòng bệnh: tránh danh sách thuốc và thực phẩm gây tan máu, đặc biệt đậu tằm. Thalassemia thể nặng cần truyền máu định kỳ kèm thải sắt. Bổ sung acid folic cho mọi thể tan máu mạn vì nhu cầu tăng. Truyền máu thận trọng ở tan máu tự miễn vì khó tìm máu hoà hợp.',
  },
  {
    slug: 'suy-tuy-xuong',
    locale: 'vi',
    description:
      'Suy tuỷ xương là tình trạng tuỷ xương giảm hoặc mất khả năng sinh máu, dẫn tới giảm cả ba dòng tế bào máu ngoại vi trong khi tuỷ nghèo tế bào. Phần lớn là suy tuỷ mắc phải qua cơ chế miễn dịch, tế bào lympho T tấn công tế bào gốc tạo máu. Nguyên nhân xác định được gồm thuốc, hoá chất như benzen, tia xạ, virus viêm gan; thể di truyền như thiếu máu Fanconi gặp ở trẻ em.',
    clinical:
      'Triệu chứng phản ánh sự thiếu hụt của cả ba dòng: thiếu máu gây mệt mỏi da xanh; giảm bạch cầu hạt gây sốt và nhiễm khuẩn tái diễn; giảm tiểu cầu gây xuất huyết dưới da, chảy máu chân răng, rong kinh. Điểm khác biệt quan trọng với lơ xê mi là KHÔNG có gan lách hạch to. Chẩn đoán xác định bằng chọc hút và sinh thiết tuỷ xương thấy tuỷ nghèo tế bào, thay bằng mô mỡ.',
    imaging:
      'Sinh thiết tuỷ xương là thăm dò quyết định, đánh giá mật độ tế bào tuỷ mà chọc hút đơn thuần không làm được. Chụp cắt lớp vi tính khi tìm ổ nhiễm khuẩn ở bệnh nhân sốt giảm bạch cầu hạt. Xét nghiệm di truyền tế bào để loại trừ hội chứng rối loạn sinh tuỷ.',
    progression:
      'Suy tuỷ nặng không điều trị có tỷ lệ tử vong rất cao trong năm đầu, nguyên nhân chủ yếu là nhiễm khuẩn và xuất huyết. Phân độ nặng dựa trên số lượng bạch cầu hạt, tiểu cầu và hồng cầu lưới — quyết định chọn ghép tuỷ hay điều trị ức chế miễn dịch. Một tỷ lệ chuyển thành hội chứng rối loạn sinh tuỷ hoặc lơ xê mi cấp về sau.',
    treatment:
      'Ghép tế bào gốc tạo máu từ người cho phù hợp HLA là điều trị triệt để, ưu tiên cho người trẻ có anh chị em ruột hoà hợp. Không có người cho thì điều trị ức chế miễn dịch bằng globulin kháng tế bào tuyến ức phối hợp ciclosporin. Điều trị hỗ trợ rất quan trọng: truyền khối hồng cầu và tiểu cầu, kháng sinh phổ rộng ngay khi sốt giảm bạch cầu hạt, phòng nhiễm khuẩn. Ngừng ngay thuốc hoặc hoá chất nghi ngờ.',
  },
  {
    slug: 'xuat-huyet-giam-tieu-cau-vo-can',
    locale: 'vi',
    description:
      'Xuất huyết giảm tiểu cầu miễn dịch là bệnh tự miễn trong đó tự kháng thể gắn lên tiểu cầu, làm tiểu cầu bị phá huỷ ở lách và đồng thời ức chế sinh tiểu cầu ở tuỷ. Đây là chẩn đoán loại trừ — phải loại các nguyên nhân giảm tiểu cầu khác trước. Thể cấp hay gặp ở trẻ em sau nhiễm virus và thường tự khỏi; thể mạn gặp ở người lớn, ưu thế nữ.',
    clinical:
      'Xuất huyết dưới da dạng chấm và mảng bầm tím, chảy máu chân răng, chảy máu mũi, rong kinh. Nguy hiểm nhất là xuất huyết nội sọ tuy hiếm. Đặc điểm quan trọng: ngoài dấu hiệu xuất huyết thì khám hoàn toàn bình thường, KHÔNG gan lách hạch to — có gan lách to phải nghĩ tới chẩn đoán khác. Công thức máu chỉ giảm tiểu cầu đơn độc, các dòng khác bình thường. Tuỷ đồ thấy mẫu tiểu cầu bình thường hoặc tăng.',
    imaging:
      'Siêu âm bụng để xác nhận lách không to. Không có hình ảnh đặc hiệu. Cần xét nghiệm loại trừ: HIV, viêm gan C, Helicobacter pylori, kháng thể kháng nhân, và loại trừ giảm tiểu cầu do thuốc bằng khai thác tiền sử dùng thuốc kỹ lưỡng.',
    progression:
      'Thể ở trẻ em phần lớn tự khỏi trong vài tháng. Thể ở người lớn thường mạn tính, diễn biến từng đợt. Nguy cơ chảy máu nặng tăng rõ khi tiểu cầu dưới 20 G/L, nhưng nhiều bệnh nhân dung nạp tốt mức tiểu cầu thấp — quyết định điều trị dựa vào chảy máu chứ không chỉ dựa vào con số.',
    treatment:
      'Không điều trị khi tiểu cầu còn đủ cao và không chảy máu. Điều trị đầu tay là corticoid; globulin miễn dịch tĩnh mạch dùng khi cần nâng tiểu cầu nhanh như trước phẫu thuật hoặc đang chảy máu nặng. Thất bại corticoid thì dùng thuốc đồng vận thụ thể thrombopoietin, rituximab, hoặc cắt lách. Tránh thuốc ảnh hưởng chức năng tiểu cầu như aspirin và thuốc chống viêm không steroid. Truyền tiểu cầu chỉ dùng khi chảy máu đe doạ tính mạng vì tiểu cầu truyền vào cũng bị phá huỷ nhanh.',
  },
  {
    slug: 'hemophilia',
    locale: 'vi',
    description:
      'Hemophilia là bệnh rối loạn đông máu di truyền lặn liên kết nhiễm sắc thể X, do thiếu hụt yếu tố đông máu: hemophilia A thiếu yếu tố VIII, hemophilia B thiếu yếu tố IX. Bệnh biểu hiện ở nam giới, nữ thường là người mang gen. Mức độ nặng phân theo nồng độ yếu tố còn lại: thể nặng dưới 1%, trung bình 1 đến 5%, nhẹ trên 5%.',
    clinical:
      'Đặc trưng là chảy máu vào khớp và cơ chứ không phải xuất huyết dưới da dạng chấm — điểm phân biệt với rối loạn tiểu cầu. Chảy máu khớp tái diễn ở khớp gối, khuỷu, cổ chân gây đau, sưng, hạn chế vận động. Chảy máu kéo dài sau chấn thương nhỏ, sau nhổ răng hoặc phẫu thuật. Xét nghiệm thấy APTT kéo dài trong khi PT và số lượng tiểu cầu bình thường; định lượng yếu tố VIII hoặc IX xác định chẩn đoán và mức độ.',
    imaging:
      'Siêu âm khớp đánh giá tràn máu khớp cấp và viêm màng hoạt dịch mạn. Cộng hưởng từ đánh giá tổn thương sụn và bệnh khớp do hemophilia ở giai đoạn sớm. Chụp cắt lớp vi tính khẩn khi nghi chảy máu nội sọ — biến chứng nguy hiểm nhất.',
    progression:
      'Chảy máu khớp tái diễn dẫn tới bệnh khớp mạn tính, huỷ sụn, biến dạng và tàn phế — đây là gánh nặng chính của bệnh. Biến chứng nguy hiểm cấp tính là chảy máu nội sọ và chảy máu vùng cổ gây chèn ép đường thở. Biến chứng điều trị đáng ngại nhất là xuất hiện chất ức chế kháng yếu tố truyền vào, làm điều trị thay thế mất hiệu lực.',
    treatment:
      'Điều trị nền là bổ sung yếu tố đông máu thiếu hụt, theo hai chiến lược: điều trị theo nhu cầu khi có chảy máu, và điều trị dự phòng định kỳ cho thể nặng — dự phòng làm giảm rõ rệt bệnh khớp về sau nên được ưu tiên. Desmopressin có thể dùng cho hemophilia A thể nhẹ. Tuyệt đối tránh tiêm bắp, aspirin và thuốc chống viêm không steroid. Chăm sóc răng miệng và vật lý trị liệu duy trì chức năng khớp. Tư vấn di truyền cho gia đình.',
  },
  {
    slug: 'lo-xe-mi-cap',
    locale: 'vi',
    description:
      'Lơ xê mi cấp là bệnh ác tính của tế bào gốc tạo máu, đặc trưng bởi tăng sinh không kiểm soát các tế bào non ác tính trong tuỷ xương, lấn át quá trình sinh máu bình thường. Chia hai nhóm lớn là lơ xê mi cấp dòng tuỷ và dòng lympho, phân biệt bằng hình thái, hoá học tế bào, dấu ấn miễn dịch và di truyền tế bào. Yếu tố nguy cơ gồm tia xạ, hoá chất, hoá trị trước đó và một số hội chứng di truyền.',
    clinical:
      'Bệnh cảnh khởi phát nhanh trong vài tuần, do suy tuỷ và do thâm nhiễm. Hội chứng thiếu máu, hội chứng nhiễm khuẩn do giảm bạch cầu hạt, hội chứng xuất huyết do giảm tiểu cầu. Hội chứng thâm nhiễm gồm gan lách hạch to, phì đại lợi, đau xương, thâm nhiễm da và thần kinh trung ương. Máu ngoại vi thấy tế bào non; chẩn đoán xác định bằng tuỷ đồ với tỷ lệ tế bào non vượt ngưỡng, kèm dấu ấn miễn dịch và di truyền để phân nhóm.',
    imaging:
      'X-quang hoặc cắt lớp vi tính ngực tìm khối trung thất trong thể lympho T. Chụp cắt lớp vi tính hoặc cộng hưởng từ sọ não khi có triệu chứng thần kinh; chọc dịch não tuỷ đánh giá thâm nhiễm màng não. Siêu âm bụng đánh giá gan lách hạch.',
    progression:
      'Không điều trị thì tử vong trong vài tuần đến vài tháng. Tiên lượng phụ thuộc mạnh vào nhóm di truyền tế bào và phân tử, tuổi và đáp ứng điều trị ban đầu. Biến chứng cấp gồm hội chứng ly giải u, đông máu rải rác trong lòng mạch đặc biệt ở thể tiền tuỷ bào, và nhiễm khuẩn nặng trong giai đoạn giảm bạch cầu hạt sau hoá trị.',
    treatment:
      'Hoá trị theo phác đồ nhiều giai đoạn gồm tấn công, củng cố và duy trì tuỳ thể bệnh. Thể tiền tuỷ bào cấp có điều trị đặc hiệu bằng ATRA phối hợp arsenic, tiên lượng tốt hơn hẳn nếu chẩn đoán và xử trí sớm. Ghép tế bào gốc tạo máu cho nhóm nguy cơ cao. Điều trị hỗ trợ quyết định sống còn: truyền chế phẩm máu, kháng sinh phổ rộng khi sốt giảm bạch cầu hạt, dự phòng và xử trí hội chứng ly giải u, chăm sóc đường truyền trung tâm.',
  },
  {
    slug: 'lo-xe-mi-kinh-dong-bach-cau-hat',
    locale: 'vi',
    description:
      'Lơ xê mi kinh dòng bạch cầu hạt là bệnh tăng sinh tuỷ ác tính đặc trưng bởi nhiễm sắc thể Philadelphia, kết quả của chuyển đoạn giữa nhiễm sắc thể 9 và 22 tạo gen lai BCR-ABL1. Gen này mã hoá một tyrosine kinase hoạt động liên tục, thúc đẩy tăng sinh dòng bạch cầu hạt. Đây là bệnh đầu tiên có thuốc nhắm đích phân tử thành công, làm thay đổi hoàn toàn tiên lượng.',
    clinical:
      'Giai đoạn mạn thường phát hiện tình cờ qua công thức máu hoặc với triệu chứng mơ hồ: mệt mỏi, sụt cân, ra mồ hôi đêm, đầy bụng do lách to. Lách to là dấu hiệu thực thể nổi bật, có thể rất to. Công thức máu thấy tăng bạch cầu rất cao với đủ các giai đoạn trưởng thành của dòng hạt, tăng bạch cầu ưa acid và ưa base. Chẩn đoán xác định bằng tìm nhiễm sắc thể Philadelphia hoặc gen BCR-ABL1.',
    imaging:
      'Siêu âm bụng đo kích thước lách, theo dõi đáp ứng điều trị. Không có hình ảnh đặc hiệu khác. Theo dõi điều trị dựa vào định lượng BCR-ABL1 bằng kỹ thuật phân tử theo thang quốc tế — đây mới là công cụ theo dõi chính, không phải hình ảnh.',
    progression:
      'Bệnh diễn biến ba giai đoạn: mạn, tăng tốc và chuyển cấp. Trước kia hầu hết chuyển sang giai đoạn cấp trong vài năm và tử vong; với thuốc ức chế tyrosine kinase, phần lớn bệnh nhân giai đoạn mạn có thời gian sống gần như người bình thường. Giai đoạn chuyển cấp có tiên lượng xấu tương tự lơ xê mi cấp.',
    treatment:
      'Thuốc ức chế tyrosine kinase là điều trị nền, dùng đường uống kéo dài; imatinib là thế hệ đầu, các thế hệ sau dùng khi kháng hoặc không dung nạp. Theo dõi đáp ứng phân tử định kỳ để phát hiện sớm kháng thuốc; kháng thuốc cần xét nghiệm đột biến để chọn thuốc thay thế. Ghép tế bào gốc dành cho trường hợp kháng nhiều dòng thuốc hoặc giai đoạn tiến triển. Tuân thủ thuốc là yếu tố quyết định kết quả.',
  },
  {
    slug: 'hoi-chung-roi-loan-sinh-tuy',
    locale: 'vi',
    description:
      'Hội chứng rối loạn sinh tuỷ là nhóm bệnh lý dòng tế bào gốc tạo máu, đặc trưng bởi sinh máu không hiệu lực: tuỷ xương giàu tế bào nhưng máu ngoại vi lại giảm tế bào, kèm bất thường hình thái các dòng. Bệnh chủ yếu gặp ở người cao tuổi. Có thể nguyên phát hoặc thứ phát sau hoá trị và xạ trị. Nguy cơ chuyển thành lơ xê mi cấp dòng tuỷ là đặc điểm quan trọng của nhóm bệnh này.',
    clinical:
      'Biểu hiện do giảm tế bào máu: thiếu máu là triệu chứng thường gặp nhất và thường là biểu hiện đầu tiên, kèm nhiễm khuẩn tái diễn và xuất huyết khi giảm bạch cầu hạt và tiểu cầu. Tiêu bản máu ngoại vi và tuỷ đồ thấy bất thường hình thái ở một hoặc nhiều dòng. Sinh thiết tuỷ và di truyền tế bào là bắt buộc để phân nhóm và tính điểm tiên lượng.',
    imaging:
      'Không có hình ảnh đặc hiệu. Cần loại trừ các nguyên nhân giảm tế bào máu khác bằng xét nghiệm: thiếu vitamin B12 và folat, nhiễm HIV, bệnh gan, rượu, thuốc. Xét nghiệm di truyền tế bào và giải trình tự gen ngày càng quan trọng trong phân tầng tiên lượng.',
    progression:
      'Diễn biến rất khác nhau giữa các nhóm nguy cơ, từ ổn định nhiều năm tới chuyển lơ xê mi cấp nhanh chóng. Phân tầng bằng hệ thống điểm IPSS-R dựa trên di truyền tế bào, tỷ lệ tế bào non và mức độ giảm tế bào máu. Nguyên nhân tử vong chính là biến chứng của giảm tế bào máu và chuyển dạng lơ xê mi.',
    treatment:
      'Nhóm nguy cơ thấp tập trung điều trị hỗ trợ: truyền máu, thuốc kích thích tạo hồng cầu, thải sắt khi truyền máu nhiều. Nhóm nguy cơ cao dùng thuốc giảm methyl hoá như azacitidin. Ghép tế bào gốc tạo máu là biện pháp duy nhất có khả năng chữa khỏi nhưng chỉ áp dụng được cho số ít bệnh nhân đủ điều kiện. Quyết định điều trị cân nhắc tuổi, bệnh đồng mắc và nguyện vọng người bệnh.',
  },
  {
    slug: 'da-hong-cau-tien-phat',
    locale: 'vi',
    description:
      'Đa hồng cầu tiên phát là bệnh tăng sinh tuỷ ác tính với tăng sản xuất chủ yếu dòng hồng cầu, độc lập với erythropoietin. Trên 95% trường hợp mang đột biến gen JAK2 — phát hiện này đã đơn giản hoá hẳn chẩn đoán. Cần phân biệt với đa hồng cầu thứ phát do thiếu oxy mạn tính như bệnh phổi, tim bẩm sinh, ở người sống vùng cao, hoặc do u tiết erythropoietin.',
    clinical:
      'Triệu chứng do tăng độ nhớt máu: đau đầu, chóng mặt, ù tai, nhìn mờ, đỏ da và niêm mạc đặc biệt vùng mặt. Ngứa sau khi tắm nước ấm là triệu chứng khá đặc trưng. Lách to gặp ở nhiều bệnh nhân. Xét nghiệm thấy tăng hemoglobin và hematocrit, thường kèm tăng bạch cầu và tiểu cầu; erythropoietin huyết thanh giảm — điểm phân biệt then chốt với đa hồng cầu thứ phát.',
    imaging:
      'Siêu âm bụng đánh giá lách to và loại trừ u thận hoặc u gan tiết erythropoietin. Thăm dò chức năng hô hấp và khí máu khi cần loại trừ nguyên nhân thiếu oxy mạn.',
    progression:
      'Biến chứng chính là huyết khối động mạch và tĩnh mạch, gồm nhồi máu cơ tim, đột quỵ, huyết khối tĩnh mạch cửa và tĩnh mạch trên gan — đây là nguyên nhân tử vong hàng đầu. Ngoài ra có nguy cơ chảy máu nghịch lý. Về lâu dài bệnh có thể chuyển thành xơ tuỷ hoặc lơ xê mi cấp.',
    treatment:
      'Trích máu để duy trì hematocrit dưới ngưỡng mục tiêu là biện pháp nền và có hiệu quả phòng huyết khối rõ rệt. Aspirin liều thấp cho hầu hết bệnh nhân nếu không chống chỉ định. Thuốc giảm tế bào như hydroxyurea cho nhóm nguy cơ cao gồm người trên 60 tuổi hoặc đã có tiền sử huyết khối. Kiểm soát đồng thời các yếu tố nguy cơ tim mạch khác.',
  },
  {
    slug: 'tang-tieu-cau-tien-phat',
    locale: 'vi',
    description:
      'Tăng tiểu cầu tiên phát là bệnh tăng sinh tuỷ ác tính với tăng sinh chủ yếu dòng mẫu tiểu cầu, dẫn tới tăng số lượng tiểu cầu kéo dài trong máu. Các đột biến hay gặp gồm JAK2, CALR và MPL. Phải phân biệt với tăng tiểu cầu phản ứng — thường gặp hơn nhiều, do nhiễm khuẩn, viêm mạn, thiếu sắt, sau cắt lách hoặc sau phẫu thuật, và không mang nguy cơ huyết khối tương tự.',
    clinical:
      'Nhiều bệnh nhân không triệu chứng và phát hiện tình cờ qua công thức máu. Khi có, biểu hiện là biến cố huyết khối hoặc chảy máu. Triệu chứng vi tuần hoàn gồm đau đầu, chóng mặt, dị cảm đầu chi và hồng ban đau đầu chi. Lách to mức độ vừa. Chẩn đoán cần loại trừ nguyên nhân phản ứng và các bệnh tăng sinh tuỷ khác, kết hợp xét nghiệm đột biến và sinh thiết tuỷ.',
    imaging:
      'Siêu âm bụng đánh giá lách. Siêu âm Doppler khi nghi huyết khối. Không có hình ảnh đặc hiệu cho bệnh; giá trị chính là phát hiện biến chứng huyết khối.',
    progression:
      'Nguy cơ chính là huyết khối động mạch và tĩnh mạch. Nghịch lý là khi tiểu cầu tăng rất cao thì lại tăng nguy cơ chảy máu do hội chứng von Willebrand mắc phải. Bệnh tiến triển chậm, một tỷ lệ nhỏ chuyển thành xơ tuỷ hoặc lơ xê mi cấp sau nhiều năm.',
    treatment:
      'Phân tầng nguy cơ huyết khối theo tuổi, tiền sử huyết khối và tình trạng đột biến để quyết định mức can thiệp. Aspirin liều thấp cho phần lớn bệnh nhân. Thuốc giảm tiểu cầu như hydroxyurea hoặc anagrelide cho nhóm nguy cơ cao. Kiểm soát yếu tố nguy cơ tim mạch. Thận trọng dùng aspirin khi tiểu cầu quá cao vì nguy cơ chảy máu.',
  },
  {
    slug: 'da-u-tuy-xuong',
    locale: 'vi',
    description:
      'Đa u tuỷ xương là bệnh ác tính của tương bào, tăng sinh trong tuỷ xương và tiết ra protein đơn dòng. Hậu quả là huỷ xương, suy thận, thiếu máu và tăng calci máu. Bệnh chủ yếu gặp ở người trên 60 tuổi. Thường đi trước bởi giai đoạn bệnh gammopathy đơn dòng ý nghĩa chưa xác định, tiến triển dần thành đa u tuỷ có triệu chứng.',
    clinical:
      'Bộ tứ triệu chứng kinh điển viết tắt là CRAB: tăng Calci máu, suy thận, thiếu máu và tổn thương xương. Đau xương đặc biệt ở cột sống và xương sườn là triệu chứng thường gặp nhất, có thể gãy xương bệnh lý sau chấn thương nhẹ. Xét nghiệm thấy tăng protein toàn phần với khoảng trống anion globulin, điện di protein huyết thanh và nước tiểu thấy đỉnh đơn dòng, tăng chuỗi nhẹ tự do. Tuỷ đồ thấy tương bào tăng.',
    imaging:
      'Trước kia dùng chụp X-quang hệ thống xương tìm hình khuyết xương hình đục lỗ. Hiện nay cắt lớp vi tính liều thấp toàn thân, cộng hưởng từ hoặc PET/CT nhạy hơn nhiều trong phát hiện tổn thương xương sớm và tổn thương ngoài tuỷ, nên được ưu tiên. Cộng hưởng từ cột sống bắt buộc khi nghi chèn ép tuỷ sống.',
    progression:
      'Bệnh chưa chữa khỏi được nhưng thời gian sống đã cải thiện rõ rệt nhờ các thuốc mới. Biến chứng cần xử trí cấp gồm tăng calci máu, suy thận cấp do chuỗi nhẹ, chèn ép tuỷ sống và hội chứng tăng độ nhớt máu. Nhiễm khuẩn tái diễn do suy giảm miễn dịch dịch thể là nguyên nhân tử vong quan trọng.',
    treatment:
      'Phác đồ hiện nay phối hợp nhiều nhóm thuốc gồm thuốc ức chế proteasome, thuốc điều hoà miễn dịch, kháng thể đơn dòng và corticoid. Ghép tế bào gốc tự thân cho bệnh nhân đủ điều kiện sau điều trị tấn công, tiếp theo là điều trị duy trì. Điều trị hỗ trợ rất quan trọng: bisphosphonat phòng biến cố xương, bù dịch và xử trí tăng calci, xạ trị giảm đau tại ổ tổn thương, dự phòng huyết khối và nhiễm khuẩn.',
  },
  {
    slug: 'u-lympho-ac-tinh',
    locale: 'vi',
    description:
      'U lympho ác tính là nhóm bệnh ác tính xuất phát từ tế bào lympho, chia hai nhóm lớn là u lympho Hodgkin và u lympho không Hodgkin. Hai nhóm khác nhau về mô bệnh học, kiểu lan tràn và tiên lượng: Hodgkin lan theo trình tự các nhóm hạch kề nhau và có tỷ lệ chữa khỏi cao; không Hodgkin đa dạng hơn nhiều, có thể lan tràn không theo trình tự và tổn thương ngoài hạch.',
    clinical:
      'Hạch to không đau, chắc, tiến triển tăng dần là biểu hiện thường gặp nhất, hay ở vùng cổ và trung thất. Triệu chứng B gồm sốt không rõ nguyên nhân, ra mồ hôi đêm nhiều và sụt cân trên 10% trong 6 tháng — có giá trị phân giai đoạn và tiên lượng. Có thể gan lách to, tổn thương ngoài hạch ở dạ dày ruột, da, thần kinh. Chẩn đoán bắt buộc bằng sinh thiết trọn hạch, không dùng chọc hút kim nhỏ vì không đánh giá được cấu trúc.',
    imaging:
      'PET/CT là tiêu chuẩn phân giai đoạn và đánh giá đáp ứng điều trị cho phần lớn thể bệnh. Chụp cắt lớp vi tính cổ ngực bụng chậu khi không có PET. Sinh thiết tuỷ xương đánh giá xâm lấn tuỷ. Chọc dịch não tuỷ ở thể có nguy cơ xâm lấn thần kinh trung ương.',
    progression:
      'Tiên lượng rất khác nhau theo thể mô bệnh học và giai đoạn. U lympho Hodgkin có tỷ lệ chữa khỏi cao kể cả giai đoạn muộn. Nhóm không Hodgkin trải từ thể tiến triển chậm gần như mạn tính tới thể rất ác tính cần điều trị khẩn. Biến chứng muộn của điều trị gồm ung thư thứ phát, bệnh tim mạch và vô sinh — cần tư vấn bảo tồn khả năng sinh sản trước hoá trị.',
    treatment:
      'Điều trị theo thể bệnh và giai đoạn, thường phối hợp hoá trị nhiều thuốc, có thể kèm xạ trị vùng tổn thương. Kháng thể đơn dòng kháng CD20 là thành phần chuẩn cho nhiều thể u lympho tế bào B. Thể tiến triển chậm không triệu chứng có thể chỉ theo dõi. Điều trị nhắm đích và liệu pháp tế bào CAR-T cho thể tái phát hoặc kháng trị. Dự phòng hội chứng ly giải u và nhiễm khuẩn trong quá trình điều trị.',
  },
  {
    slug: 'soc',
    locale: 'vi',
    description:
      'Sốc là tình trạng suy tuần hoàn cấp làm giảm tưới máu mô, dẫn tới thiếu oxy tế bào và rối loạn chuyển hoá. Phân bốn nhóm theo cơ chế: sốc giảm thể tích do mất máu hoặc mất dịch, sốc tim do bơm hỏng, sốc phân bố mà hay gặp nhất là sốc nhiễm khuẩn, và sốc tắc nghẽn do ép tim hoặc thuyên tắc phổi lớn. Phân nhóm đúng quyết định xử trí vì bù dịch có lợi ở nhóm này lại có hại ở nhóm khác.',
    clinical:
      'Dấu hiệu chung gồm tụt huyết áp, mạch nhanh nhỏ, thiểu niệu, rối loạn ý thức và dấu hiệu giảm tưới máu ngoại vi như da lạnh ẩm, thời gian đổ đầy mao mạch kéo dài. Sốc phân bố giai đoạn đầu lại có da ấm và mạch nảy. Lactat máu tăng là chỉ dấu thiếu oxy mô và có giá trị theo dõi đáp ứng điều trị. Cần đánh giá nhanh đồng thời hô hấp, tuần hoàn và tri giác.',
    imaging:
      'Siêu âm tại giường là công cụ then chốt để phân nhóm nhanh: đánh giá co bóp tim, kích thước và độ xẹp của tĩnh mạch chủ dưới, tìm dịch màng ngoài tim gây ép tim, tràn dịch màng phổi, dịch ổ bụng. Điện tâm đồ, X-quang ngực và chụp cắt lớp vi tính động mạch phổi khi nghi thuyên tắc phổi.',
    progression:
      'Sốc kéo dài dẫn tới suy đa tạng và tử vong. Thời gian từ khi khởi phát tới khi hồi phục tưới máu là yếu tố tiên lượng quan trọng nhất, nên nhận diện sớm quan trọng hơn mọi biện pháp điều trị tinh vi về sau. Sốc nhiễm khuẩn có tỷ lệ tử vong cao ngay cả khi điều trị đúng.',
    treatment:
      'Song song ba việc: bảo đảm hô hấp và cung cấp oxy, khôi phục tưới máu, và xử trí nguyên nhân. Bù dịch tinh thể cho sốc giảm thể tích và sốc nhiễm khuẩn, đánh giá đáp ứng từng đợt thay vì truyền ồ ạt. Thuốc vận mạch khi bù dịch chưa đủ, noradrenalin là lựa chọn đầu tay cho phần lớn thể sốc. Sốc tim cần thuốc tăng co bóp và giải quyết nguyên nhân. Sốc nhiễm khuẩn phải cấy máu rồi dùng kháng sinh phổ rộng sớm và loại bỏ ổ nhiễm khuẩn. Sốc tắc nghẽn cần giải áp cấp cứu.',
  },
  {
    slug: 'cap-cuu-ngung-tuan-hoan',
    locale: 'vi',
    description:
      'Ngừng tuần hoàn là tình trạng tim ngừng hoạt động bơm hiệu quả, làm ngừng tưới máu não và các tạng. Bốn rối loạn nhịp gây ngừng tuần hoàn chia hai nhóm theo khả năng sốc điện: nhóm sốc được gồm rung thất và nhịp nhanh thất vô mạch, nhóm không sốc được gồm vô tâm thu và hoạt động điện vô mạch. Nguyên nhân hay gặp nhất ở người lớn là bệnh động mạch vành.',
    clinical:
      'Ba dấu hiệu nhận biết là mất ý thức đột ngột, ngừng thở hoặc thở ngáp, và mất mạch cảnh. Không được mất thời gian bắt mạch quá 10 giây — nghi ngờ thì coi như đã ngừng tuần hoàn và ép tim ngay. Trong lúc hồi sinh phải tìm nguyên nhân hồi phục được theo nhóm 4H và 4T: thiếu oxy, giảm thể tích, rối loạn kali, hạ thân nhiệt, tràn khí màng phổi áp lực, ép tim, ngộ độc và thuyên tắc.',
    imaging:
      'Siêu âm tại giường trong lúc tạm ngừng ép tim để tìm nguyên nhân hồi phục được như ép tim hoặc giảm thể tích nặng, nhưng tuyệt đối không làm gián đoạn ép tim quá thời gian cho phép. Sau khi tái lập tuần hoàn, chụp mạch vành cấp nếu nghi nhồi máu cơ tim, và cắt lớp vi tính sọ não hoặc động mạch phổi tuỳ nguyên nhân nghi ngờ.',
    progression:
      'Tỷ lệ sống phụ thuộc chuỗi sống còn: nhận biết và gọi cấp cứu sớm, ép tim sớm và đúng kỹ thuật, sốc điện sớm, hồi sinh nâng cao và chăm sóc sau ngừng tuần hoàn. Mỗi phút chậm sốc điện với rung thất làm giảm rõ rệt khả năng sống. Tổn thương não do thiếu oxy là di chứng nặng nề nhất ở người sống sót.',
    treatment:
      'Ép tim chất lượng cao là nền tảng: đủ tần số, đủ độ sâu, để lồng ngực nở lại hoàn toàn và hạn chế tối đa gián đoạn. Sốc điện ngay khi có nhịp sốc được. Adrenalin theo chu kỳ; amiodaron cho rung thất kháng sốc điện. Bảo đảm đường thở và thông khí. Sau khi tái lập tuần hoàn thì tập trung vào chăm sóc sau ngừng tuần hoàn: kiểm soát oxy và CO2 theo đích, ổn định huyết động, kiểm soát thân nhiệt và tìm xử trí nguyên nhân.',
  },
  {
    slug: 'phu-phoi-cap',
    locale: 'vi',
    description:
      'Phù phổi cấp huyết động là tình trạng dịch tràn từ mao mạch phổi vào khoảng kẽ rồi vào phế nang do tăng áp lực mao mạch phổi, thường là hậu quả của suy tim trái cấp. Cần phân biệt với hội chứng suy hô hấp cấp tiến triển vốn do tăng tính thấm màng phế nang mao mạch chứ không do tăng áp lực. Yếu tố thúc đẩy gồm cơn tăng huyết áp, hội chứng vành cấp, rối loạn nhịp nhanh, bỏ thuốc và ăn mặn.',
    clinical:
      'Khó thở dữ dội khởi phát đột ngột, thường về đêm, bệnh nhân phải ngồi dậy để thở, vã mồ hôi, lo lắng hoảng hốt, ho khạc bọt hồng. Khám nghe ran ẩm dâng lên từ đáy phổi hai bên như thuỷ triều dâng. Có thể nghe tiếng T3 và tiếng thổi của bệnh van tim nền. Đo bão hoà oxy giảm, khí máu có giảm oxy máu. NT-proBNP tăng hỗ trợ phân biệt với nguyên nhân hô hấp.',
    imaging:
      'X-quang ngực thấy hình mờ lan toả hai phổi kiểu cánh bướm quanh rốn phổi, đường Kerley B, có thể tràn dịch màng phổi và bóng tim to. Siêu âm phổi tại giường thấy nhiều đường B lan toả — nhanh và nhạy hơn X-quang trong cấp cứu. Siêu âm tim tìm nguyên nhân: rối loạn vận động vùng, bệnh van tim, chức năng thất trái.',
    progression:
      'Đây là cấp cứu nội khoa, nếu không xử trí kịp thì suy hô hấp tiến triển nhanh tới ngừng thở. Đáp ứng điều trị thường nhanh nếu can thiệp đúng và sớm. Tiên lượng lâu dài phụ thuộc bệnh tim nền; mỗi đợt phù phổi cấp là dấu hiệu bệnh nền chưa được kiểm soát tốt.',
    treatment:
      'Cho bệnh nhân ngồi thõng chân, thở oxy, theo dõi liên tục. Thuốc giãn mạch nhóm nitrat đặc biệt hiệu quả khi có tăng huyết áp, làm giảm nhanh tiền gánh và hậu gánh. Lợi tiểu quai đường tĩnh mạch để giảm quá tải dịch. Thông khí không xâm nhập với áp lực dương làm giảm rõ nhu cầu đặt nội khí quản và nên dùng sớm. Song song phải tìm và xử trí yếu tố thúc đẩy: hội chứng vành cấp, rối loạn nhịp, cơn tăng huyết áp.',
  },
  {
    slug: 'roi-loan-kali-mau',
    locale: 'vi',
    description:
      'Kali là ion nội bào chính, chỉ khoảng 2% nằm ngoài tế bào, nên nồng độ kali máu không phản ánh trực tiếp tổng lượng kali cơ thể. Tăng kali máu hay do suy thận, thuốc ức chế hệ renin angiotensin, lợi tiểu giữ kali, toan chuyển hoá và huỷ tế bào. Hạ kali máu do mất qua đường tiêu hoá, qua thận vì lợi tiểu, cường aldosteron, hoặc do kali chuyển vào trong tế bào khi kiềm máu và khi dùng insulin.',
    clinical:
      'Cả hai rối loạn đều biểu hiện chủ yếu ở cơ và tim. Tăng kali gây yếu cơ, dị cảm, và nguy hiểm nhất là rối loạn nhịp tim tới ngừng tim. Hạ kali gây mệt mỏi, yếu cơ, chuột rút, liệt ruột cơ năng, và cũng gây rối loạn nhịp đặc biệt ở người dùng digoxin. Cần đánh giá đồng thời magie vì hạ magie làm hạ kali kháng trị.',
    imaging:
      'Không dùng chẩn đoán hình ảnh. Điện tâm đồ là thăm dò then chốt và phải làm ngay: tăng kali cho sóng T cao nhọn, PR dài, QRS giãn rộng rồi thành sóng hình sin; hạ kali cho sóng T dẹt, xuất hiện sóng U, ST chênh xuống. Biến đổi điện tâm đồ quyết định mức khẩn cấp chứ không phải riêng con số xét nghiệm.',
    progression:
      'Tăng kali nặng có thể gây ngừng tim đột ngột mà không báo trước nhiều — đây là rối loạn điện giải nguy hiểm nhất trong cấp cứu. Hạ kali nặng gây liệt cơ hô hấp và loạn nhịp thất. Cả hai đều hồi phục tốt nếu xử trí kịp và giải quyết nguyên nhân.',
    treatment:
      'Tăng kali có biến đổi điện tâm đồ cần calci tĩnh mạch ngay để ổn định màng tế bào cơ tim — biện pháp này không hạ kali nhưng mua thời gian. Tiếp theo là đẩy kali vào trong tế bào bằng insulin kèm glucose và khí dung salbutamol, rồi thải kali ra khỏi cơ thể bằng lợi tiểu, nhựa trao đổi ion hoặc lọc máu. Hạ kali bù kali đường uống khi nhẹ, đường tĩnh mạch pha loãng và truyền chậm qua đường truyền lớn khi nặng, đồng thời bù magie. Luôn phải xử trí nguyên nhân nền.',
  },
  {
    slug: 'roi-loan-nuoc-natri',
    locale: 'vi',
    description:
      'Natri là ion ngoại bào chính, quyết định áp lực thẩm thấu huyết tương, nên rối loạn natri thực chất là rối loạn cân bằng NƯỚC chứ không phải rối loạn lượng muối. Hạ natri máu do thừa nước tương đối, phân loại theo tình trạng thể tích: giảm thể tích do mất dịch, đẳng thể tích như hội chứng tiết ADH không thích hợp, tăng thể tích như suy tim, xơ gan, hội chứng thận hư. Tăng natri máu do thiếu nước, hay gặp ở người già và người không tự uống được.',
    clinical:
      'Triệu chứng chủ yếu là thần kinh do dịch chuyển nước qua màng tế bào não: đau đầu, buồn nôn, lú lẫn, co giật, hôn mê. Mức độ triệu chứng phụ thuộc TỐC ĐỘ thay đổi hơn là con số tuyệt đối — hạ natri mạn tính rất thấp có thể ít triệu chứng, còn hạ nhanh vừa phải đã gây phù não. Đánh giá bắt buộc gồm tình trạng thể tích, áp lực thẩm thấu máu và nước tiểu, natri niệu.',
    imaging:
      'Không có vai trò trong chẩn đoán rối loạn natri. Chụp cắt lớp vi tính sọ não khi có rối loạn ý thức để loại trừ nguyên nhân khác. Chụp sọ não cũng cần khi nghi hội chứng huỷ myelin do điều chỉnh natri quá nhanh.',
    progression:
      'Biến chứng nguy hiểm nhất không phải bản thân rối loạn mà là ĐIỀU CHỈNH QUÁ NHANH. Nâng natri quá nhanh ở người hạ natri mạn gây hội chứng huỷ myelin cầu não với di chứng thần kinh nặng nề, thường không hồi phục. Ngược lại hạ natri quá nhanh ở người tăng natri mạn gây phù não.',
    treatment:
      'Nguyên tắc bao trùm là điều chỉnh CHẬM và có giới hạn tốc độ mỗi 24 giờ, trừ khi có triệu chứng thần kinh nặng thì được nâng nhanh một mức nhỏ ban đầu bằng natri ưu trương rồi quay lại tốc độ chậm. Hạ natri có giảm thể tích thì bù muối đẳng trương; hội chứng tiết ADH không thích hợp thì hạn chế nước; thể tăng thể tích thì hạn chế nước và lợi tiểu. Tăng natri bù nước tự do theo đường uống hoặc truyền, tính toán lượng thiếu hụt. Theo dõi natri máu nhiều lần trong ngày là bắt buộc.',
  },
  {
    slug: 'roi-loan-toan-kiem',
    locale: 'vi',
    description:
      'Thăng bằng toan kiềm được duy trì bởi hệ đệm, phổi và thận. Bốn rối loạn cơ bản là toan chuyển hoá, kiềm chuyển hoá, toan hô hấp và kiềm hô hấp; trên lâm sàng thường gặp rối loạn phối hợp. Phân tích cần đọc theo trình tự: pH xác định toan hay kiềm, sau đó xem PaCO2 và bicarbonat để xác định rối loạn tiên phát, rồi đánh giá mức bù trừ có phù hợp hay không.',
    clinical:
      'Triệu chứng phần lớn là của bệnh nền chứ không đặc hiệu cho rối loạn toan kiềm. Toan chuyển hoá nặng gây thở nhanh sâu kiểu Kussmaul, tụt huyết áp, giảm co bóp cơ tim. Kiềm chuyển hoá gây dị cảm, co cứng cơ, rối loạn nhịp. Toan hô hấp gây lơ mơ, đau đầu do giãn mạch não. Tính khoảng trống anion là bước bắt buộc trong toan chuyển hoá để phân định nguyên nhân.',
    imaging:
      'Không có vai trò trực tiếp. Thăm dò hướng theo nguyên nhân: X-quang ngực trong toan hô hấp do bệnh phổi, siêu âm và cắt lớp vi tính bụng khi nghi thiếu máu mạc treo gây toan lactic, xét nghiệm độc chất khi nghi ngộ độc methanol hoặc ethylene glycol.',
    progression:
      'Toan máu nặng làm giảm co bóp cơ tim, giảm đáp ứng với thuốc vận mạch và tăng nguy cơ loạn nhịp, tạo vòng xoắn bệnh lý với sốc. Tiên lượng phụ thuộc nguyên nhân nền chứ không phụ thuộc riêng mức pH: toan lactic do sốc nhiễm khuẩn nặng hơn nhiều so với toan do nhiễm toan ceton đái tháo đường ở cùng mức pH.',
    treatment:
      'Nguyên tắc là điều trị nguyên nhân, không đuổi theo con số pH. Toan chuyển hoá do nhiễm toan ceton cần bù dịch và insulin; do sốc cần khôi phục tưới máu; do suy thận có thể cần lọc máu. Bicarbonat chỉ dùng hạn chế trong toan chuyển hoá rất nặng vì có thể gây toan nội bào nghịch lý và quá tải natri. Toan hô hấp cần cải thiện thông khí, có thể phải hỗ trợ hô hấp. Kiềm chuyển hoá do nôn và lợi tiểu thì bù dịch, kali và chloride.',
  },
  {
    slug: 'ngo-doc-cap-thuong-gap',
    locale: 'vi',
    description:
      'Ngộ độc cấp là tình trạng bệnh lý do chất độc vào cơ thể trong thời gian ngắn. Ở Việt Nam hay gặp ngộ độc thuốc trừ sâu phospho hữu cơ, ngộ độc thuốc an thần và thuốc ngủ, ngộ độc paracetamol, ngộ độc rượu methanol, ngộ độc thức ăn và ngộ độc khí CO. Nguyên tắc chung là cấp cứu ổn định chức năng sống trước, xác định chất độc sau — không chờ chẩn đoán xác định mới hồi sức.',
    clinical:
      'Khai thác hoàn cảnh, thời điểm và loại chất là thông tin quyết định, thường phải hỏi người nhà. Nhận diện các hội chứng ngộ độc đặc trưng giúp định hướng nhanh: hội chứng cường cholinergic với đồng tử co, tăng tiết, co thắt phế quản trong ngộ độc phospho hữu cơ; hội chứng kháng cholinergic với đồng tử giãn, da khô đỏ, sảng; hội chứng opioid với đồng tử co nhỏ, ức chế hô hấp. Xét nghiệm gồm khí máu, điện giải, khoảng trống anion và khoảng trống thẩm thấu, chức năng gan thận.',
    imaging:
      'X-quang ngực khi nghi hít sặc hoặc phù phổi do độc chất. Chụp cắt lớp vi tính sọ não khi rối loạn ý thức chưa giải thích được. Điện tâm đồ bắt buộc vì nhiều chất độc gây kéo dài QRS hoặc QT và loạn nhịp.',
    progression:
      'Tiên lượng phụ thuộc loại chất, liều, thời gian tới khi được cấp cứu và có thuốc giải độc đặc hiệu hay không. Ngộ độc paracetamol nguy hiểm ở chỗ giai đoạn đầu gần như không triệu chứng nhưng suy gan xuất hiện sau vài ngày — dễ chủ quan bỏ lỡ thời điểm dùng thuốc giải độc. Ngộ độc methanol gây mù và toan chuyển hoá nặng.',
    treatment:
      'Bốn hướng song song: hồi sức chức năng sống, hạn chế hấp thu, tăng thải trừ, và thuốc giải độc đặc hiệu. Than hoạt dùng sớm trong vài giờ đầu với chất hấp phụ được. Thuốc giải độc đặc hiệu gồm N-acetylcystein cho paracetamol, atropin và pralidoxim cho phospho hữu cơ, naloxon cho opioid, ethanol hoặc fomepizol cho methanol. Lọc máu cho một số chất. Đánh giá tâm thần và tư vấn phòng ngừa sau khi ổn định, đặc biệt với trường hợp tự tử.',
  },
  {
    slug: 'ran-doc-can',
    locale: 'vi',
    description:
      'Rắn độc cắn là tai nạn thường gặp ở vùng nông thôn Việt Nam. Hai nhóm nọc chính có bệnh cảnh khác hẳn nhau: nhóm rắn lục gây rối loạn đông máu và hoại tử tại chỗ; nhóm rắn hổ gây liệt thần kinh cơ tiến triển. Xác định loại rắn nếu được giúp chọn huyết thanh kháng nọc đúng, nhưng không được vì thế mà trì hoãn cấp cứu.',
    clinical:
      'Tại chỗ có dấu răng, đau, sưng nề lan nhanh, có thể bọng nước và hoại tử — nổi bật ở nhóm rắn lục. Toàn thân với nhóm rắn hổ là sụp mi, nói khó, nuốt khó rồi liệt cơ hô hấp; với nhóm rắn lục là chảy máu chân răng, xuất huyết dưới da, đái máu. Xét nghiệm đông máu toàn bộ và nghiệm pháp đông máu 20 phút tại giường là công cụ đơn giản mà có giá trị cao để phát hiện rối loạn đông máu.',
    imaging:
      'Siêu âm phần mềm đánh giá mức lan của phù nề và tìm ổ tụ dịch, hỗ trợ theo dõi hội chứng khoang. Không có hình ảnh đặc hiệu. Theo dõi lâm sàng lặp lại quan trọng hơn hình ảnh vì bệnh cảnh tiến triển theo giờ.',
    progression:
      'Liệt cơ hô hấp do nhóm rắn hổ có thể xuất hiện trong vài giờ và gây tử vong nếu không hỗ trợ thông khí kịp. Rối loạn đông máu do nhóm rắn lục có thể kéo dài nhiều ngày và tái phát. Biến chứng tại chỗ gồm hội chứng khoang, hoại tử phải cắt lọc, nhiễm khuẩn thứ phát và di chứng chức năng chi.',
    treatment:
      'Sơ cứu đúng: trấn an, bất động chi bị cắn ở tư thế thấp hơn tim, chuyển viện nhanh. Tuyệt đối KHÔNG rạch hút nọc, không garo chặt, không đắp thuốc lá — các biện pháp này làm nặng thêm tổn thương. Huyết thanh kháng nọc đặc hiệu là điều trị quyết định, chỉ định theo mức độ nhiễm độc và dùng càng sớm càng tốt, chuẩn bị sẵn phương tiện xử trí phản vệ. Hỗ trợ hô hấp khi liệt cơ. Tiêm phòng uốn ván, chăm sóc vết thương, theo dõi đông máu lặp lại.',
  },
  {
    slug: 'dien-giat',
    locale: 'vi',
    description:
      'Điện giật là tổn thương do dòng điện đi qua cơ thể. Mức tổn thương phụ thuộc cường độ dòng, loại dòng xoay chiều hay một chiều, đường đi của dòng qua cơ thể, thời gian tiếp xúc và điện trở mô. Dòng xoay chiều nguy hiểm hơn dòng một chiều cùng cường độ vì gây co cứng cơ liên tục làm nạn nhân không buông được nguồn điện. Đường đi qua tim hoặc qua não là nguy hiểm nhất.',
    clinical:
      'Tổn thương da tại điểm vào và điểm ra thường nhỏ nhưng không phản ánh mức tổn thương sâu — đây là điểm dễ đánh giá thấp. Bên trong có thể hoại tử cơ lan rộng, tiêu cơ vân. Tim có thể rung thất, vô tâm thu hoặc rối loạn nhịp muộn. Thần kinh có mất ý thức, co giật, liệt. Xét nghiệm cần creatine kinase, myoglobin niệu, chức năng thận và điện giải.',
    imaging:
      'Điện tâm đồ bắt buộc ngay và theo dõi liên tục ở trường hợp có nguy cơ. X-quang khi nghi gãy xương hoặc trật khớp do co cứng cơ mạnh — cơ chế này hay bị bỏ sót. Chụp cắt lớp vi tính sọ não khi có rối loạn ý thức. Siêu âm hoặc chụp mạch khi nghi tổn thương mạch.',
    progression:
      'Nguyên nhân tử vong tức thì là rung thất và ngừng thở do liệt trung tâm hô hấp. Biến chứng sớm gồm tiêu cơ vân dẫn tới suy thận cấp, hội chứng khoang cần rạch giải áp. Di chứng muộn gồm đục thuỷ tinh thể, rối loạn thần kinh ngoại biên và rối loạn tâm thần.',
    treatment:
      'Việc đầu tiên là ngắt nguồn điện, tuyệt đối bảo đảm an toàn cho người cứu trước khi tiếp cận nạn nhân. Hồi sinh tim phổi ngay khi ngừng tuần hoàn, và kiên trì hơn thông thường vì nạn nhân điện giật thường trẻ và có khả năng hồi phục tốt. Bù dịch tích cực khi tiêu cơ vân để phòng suy thận, theo dõi nước tiểu. Xử trí bỏng và tổn thương phối hợp, rạch giải áp khi hội chứng khoang. Theo dõi điện tâm đồ đủ thời gian ở nhóm nguy cơ.',
  },
  {
    slug: 'ngat-nuoc',
    locale: 'vi',
    description:
      'Ngạt nước là suy hô hấp do chìm trong môi trường nước. Cơ chế chính là co thắt thanh quản rồi hít nước vào phổi, làm mất surfactant, xẹp phế nang và rối loạn trao đổi khí, dẫn tới thiếu oxy máu. Sự phân biệt kinh điển giữa nước ngọt và nước mặn ít có ý nghĩa thực hành — hậu quả chi phối vẫn là thiếu oxy. Cần luôn tìm nguyên nhân dẫn tới đuối nước như co giật, rối loạn nhịp, chấn thương cột sống cổ khi nhảy cắm đầu, hoặc rượu.',
    clinical:
      'Biểu hiện trải từ ho, khó thở nhẹ tới suy hô hấp nặng, hôn mê và ngừng tuần hoàn. Nghe phổi có ran ẩm, ran rít. Hạ thân nhiệt rất thường gặp và ảnh hưởng cả tiên lượng lẫn cách hồi sức. Đánh giá thần kinh ban đầu có giá trị tiên lượng quan trọng nhất. Xét nghiệm gồm khí máu, điện giải, và theo dõi bão hoà oxy liên tục.',
    imaging:
      'X-quang ngực có thể bình thường lúc đầu rồi xấu dần trong nhiều giờ — vì vậy phim ban đầu bình thường không cho phép loại trừ tổn thương phổi. Hình ảnh muộn là thâm nhiễm lan toả hai phổi. Chụp cắt lớp vi tính cột sống cổ khi cơ chế chấn thương nghi ngờ, và sọ não khi rối loạn ý thức kéo dài.',
    progression:
      'Tiên lượng phụ thuộc thời gian chìm và thời gian thiếu oxy trước khi được cấp cứu. Hạ thân nhiệt sâu trong nước lạnh có thể bảo vệ não, nên hồi sức phải kiên trì và không kết luận sớm ở nạn nhân hạ thân nhiệt. Biến chứng muộn gồm hội chứng suy hô hấp cấp tiến triển, viêm phổi hít và tổn thương não do thiếu oxy.',
    treatment:
      'Ưu tiên tuyệt đối là khôi phục thông khí và oxy hoá — với ngạt nước thì thổi ngạt có vai trò quan trọng ngay từ đầu, khác với ngừng tuần hoàn do tim. Không cố ép nước ra khỏi dạ dày vì làm tăng nguy cơ hít sặc. Bất động cột sống cổ khi nghi chấn thương. Ủ ấm và xử trí hạ thân nhiệt. Thở oxy, thông khí không xâm nhập hoặc đặt nội khí quản tuỳ mức độ. Theo dõi tại viện đủ lâu kể cả khi triệu chứng ban đầu nhẹ, vì tổn thương phổi có thể xuất hiện muộn.',
  },
  {
    slug: 'ngung-tho-khi-ngu',
    locale: 'vi',
    description:
      'Hội chứng ngừng thở khi ngủ là các đợt ngừng thở hoặc giảm thở lặp lại trong khi ngủ. Thể tắc nghẽn chiếm đa số, do xẹp đường hô hấp trên khi trương lực cơ hầu họng giảm lúc ngủ. Yếu tố nguy cơ gồm béo phì, cổ ngắn và to, bất thường hàm mặt, amidan quá phát, nam giới, tuổi và uống rượu hoặc thuốc an thần buổi tối. Thể trung ương hiếm hơn, do rối loạn điều khiển hô hấp từ trung tâm.',
    clinical:
      'Ban đêm có ngáy to ngắt quãng, cơn ngừng thở người nhà chứng kiến, thức giấc sặc sụa. Ban ngày có buồn ngủ quá mức, đau đầu buổi sáng, giảm tập trung và trí nhớ — lượng giá bằng thang điểm Epworth. Khám tìm béo phì, chu vi cổ lớn, đường thở hẹp. Chẩn đoán xác định bằng đa ký giấc ngủ với chỉ số ngừng giảm thở AHI; phân độ nhẹ, trung bình, nặng theo chỉ số này.',
    imaging:
      'Nội soi tai mũi họng đánh giá vị trí hẹp đường hô hấp trên. Chụp cắt lớp vi tính hoặc cộng hưởng từ vùng hầu họng khi cân nhắc phẫu thuật. Siêu âm tim và điện tâm đồ tìm biến chứng tim mạch ở thể nặng kéo dài.',
    progression:
      'Bệnh làm tăng rõ rệt nguy cơ tăng huyết áp kháng trị, rung nhĩ, đột quỵ, nhồi máu cơ tim và đái tháo đường type 2. Buồn ngủ ban ngày làm tăng tai nạn giao thông và tai nạn lao động — hậu quả xã hội đáng kể thường bị bỏ qua. Thể nặng kéo dài dẫn tới tăng áp động mạch phổi và tâm phế mạn.',
    treatment:
      'Giảm cân là can thiệp nền và có thể cải thiện đáng kể ở người thừa cân. Tránh rượu và thuốc an thần buổi tối, nằm nghiêng thay vì nằm ngửa. Thở áp lực dương liên tục qua mặt nạ khi ngủ là điều trị hiệu quả nhất cho thể trung bình đến nặng; tuân thủ là yếu tố quyết định thành công. Dụng cụ đẩy hàm dưới cho thể nhẹ. Phẫu thuật khi có bất thường giải phẫu rõ ràng như amidan quá phát.',
  },
  {
    slug: 'hoi-chung-trung-that',
    locale: 'vi',
    description:
      'Hội chứng trung thất là tập hợp triệu chứng do khối choán chỗ trong trung thất chèn ép các cấu trúc đi qua vùng này: tĩnh mạch chủ trên, khí phế quản, thực quản, dây thần kinh quặt ngược, thần kinh hoành và chuỗi giao cảm cổ. Định khu theo tầng trung thất giúp thu hẹp chẩn đoán: tầng trước hay gặp u tuyến ức, u lympho, u tế bào mầm và bướu giáp chìm; tầng giữa hay gặp hạch, nang; tầng sau hay gặp u thần kinh.',
    clinical:
      'Hội chứng tĩnh mạch chủ trên là biểu hiện nổi bật nhất: phù áo khoác vùng mặt cổ và chi trên, tĩnh mạch cổ và tĩnh mạch ngực nổi, tím mặt, nặng lên khi cúi. Kèm khó thở, ho, khàn tiếng do liệt dây thần kinh quặt ngược, nuốt nghẹn, nấc do kích thích thần kinh hoành, và hội chứng Claude Bernard-Horner khi tổn thương chuỗi giao cảm cổ.',
    imaging:
      'Chụp cắt lớp vi tính lồng ngực có tiêm thuốc là thăm dò chính, xác định vị trí, kích thước, bản chất khối và mức độ chèn ép mạch máu. Cộng hưởng từ đánh giá tốt hơn khối tầng sau và xâm lấn thần kinh. Sinh thiết qua nội soi trung thất, qua siêu âm nội soi hoặc xuyên thành ngực để có chẩn đoán mô bệnh học — bắt buộc trước điều trị đặc hiệu.',
    progression:
      'Tiên lượng hoàn toàn phụ thuộc bản chất khối. Hội chứng tĩnh mạch chủ trên tiến triển nhanh có thể gây phù não và suy hô hấp, là tình huống cần can thiệp khẩn. Chèn ép khí quản nặng gây suy hô hấp cấp và làm việc gây mê trở nên nguy hiểm — cần lưu ý trước mọi thủ thuật.',
    treatment:
      'Ưu tiên trước hết là bảo đảm đường thở và tuần hoàn nếu chèn ép nặng. Điều trị theo bản chất khối: hoá trị và xạ trị cho u lympho và ung thư tế bào nhỏ vốn rất nhạy; phẫu thuật cho u tuyến ức, u thần kinh và nang. Đặt stent tĩnh mạch chủ trên giúp giảm nhanh triệu chứng khi chèn ép nặng. Corticoid và nâng cao đầu giường hỗ trợ tạm thời. Cố gắng lấy bệnh phẩm trước khi dùng corticoid vì thuốc làm thay đổi hình thái mô u lympho.',
  },
  {
    slug: 'roi-loan-nhip-tim',
    locale: 'vi',
    description:
      'Rối loạn nhịp tim là bất thường về tần số, tính đều đặn hoặc nguồn gốc của xung động điện tim. Phân loại theo tần số thành nhịp nhanh và nhịp chậm, theo vị trí thành trên thất và thất. Cơ chế gồm rối loạn tạo xung, vòng vào lại và hoạt động khởi kích. Yếu tố thúc đẩy thường gặp là thiếu máu cơ tim, rối loạn điện giải đặc biệt kali và magie, cường giáp, thuốc, rượu và bệnh tim cấu trúc.',
    clinical:
      'Triệu chứng gồm hồi hộp đánh trống ngực, choáng váng, ngất, khó thở, đau ngực; nhiều trường hợp không triệu chứng và phát hiện tình cờ. Ngất khi gắng sức hoặc ngất không có tiền triệu là dấu hiệu báo động gợi ý rối loạn nhịp thất nguy hiểm. Điện tâm đồ 12 chuyển đạo trong cơn là bằng chứng quyết định; ngoài cơn dùng Holter hoặc máy ghi biến cố kéo dài.',
    imaging:
      'Siêu âm tim đánh giá bệnh tim cấu trúc nền — yếu tố quyết định tiên lượng và lựa chọn điều trị. Cộng hưởng từ tim tìm bệnh cơ tim và sẹo. Thăm dò điện sinh lý khi cần xác định cơ chế và đồng thời triệt đốt. Xét nghiệm điện giải và chức năng tuyến giáp là bắt buộc vì đây là các nguyên nhân điều chỉnh được.',
    progression:
      'Tiên lượng trải rất rộng: ngoại tâm thu lành tính trên tim bình thường hầu như không ảnh hưởng, trong khi nhịp nhanh thất trên nền bệnh tim cấu trúc có nguy cơ đột tử cao. Rung nhĩ làm tăng nguy cơ đột quỵ do huyết khối nhĩ trái và gây bệnh cơ tim do nhịp nhanh nếu tần số không kiểm soát.',
    treatment:
      'Nguyên tắc đầu tiên là xử trí yếu tố thúc đẩy và bệnh nền. Nhịp nhanh có rối loạn huyết động cần sốc điện chuyển nhịp cấp cứu. Rung nhĩ điều trị theo ba trục: chống đông theo thang điểm nguy cơ đột quỵ, kiểm soát tần số hoặc kiểm soát nhịp. Triệt đốt qua ống thông là điều trị triệt để cho nhiều loại nhịp nhanh trên thất và ngày càng dùng cho rung nhĩ. Máy tạo nhịp cho nhịp chậm có triệu chứng; máy phá rung cấy được cho người nguy cơ đột tử cao.',
  },
  {
    slug: 'xhth-do-loet-da-day-ta-trang',
    locale: 'vi',
    description:
      'Xuất huyết tiêu hoá do loét dạ dày tá tràng là biến chứng thường gặp nhất của bệnh loét và là nguyên nhân hàng đầu của xuất huyết tiêu hoá trên không do tăng áp cửa. Cơ chế là ổ loét ăn mòn vào mạch máu ở đáy ổ loét. Yếu tố nguy cơ gồm nhiễm Helicobacter pylori, dùng thuốc chống viêm không steroid, aspirin, thuốc chống đông và stress ở bệnh nhân nặng.',
    clinical:
      'Nôn ra máu và đi ngoài phân đen là biểu hiện chính; mất máu nhiều có thể đi ngoài ra máu đỏ. Đánh giá ban đầu tập trung vào huyết động và mức độ mất máu chứ không vào chẩn đoán nguyên nhân. Phân tầng nguy cơ bằng thang điểm Glasgow-Blatchford giúp quyết định nhập viện hay theo dõi ngoại trú. Xét nghiệm gồm công thức máu, đông máu, urê, creatinin và nhóm máu; urê tăng không tương xứng creatinin gợi ý chảy máu tiêu hoá trên.',
    imaging:
      'Nội soi dạ dày tá tràng trong vòng 24 giờ là thăm dò quyết định, vừa xác định nguồn chảy máu vừa can thiệp cầm máu, đồng thời phân loại Forrest để tiên lượng chảy máu lại. Chụp mạch số hoá xoá nền và nút mạch khi nội soi thất bại. Sinh thiết ổ loét dạ dày sau khi ổn định để loại trừ ung thư.',
    progression:
      'Nguy cơ chảy máu lại cao nhất trong 72 giờ đầu và phụ thuộc phân loại Forrest của tổn thương. Tuổi cao, bệnh đồng mắc và sốc lúc nhập viện là các yếu tố tiên lượng xấu. Diệt Helicobacter pylori thành công làm giảm mạnh nguy cơ chảy máu tái phát về sau.',
    treatment:
      'Hồi sức tuần hoàn trước, truyền máu theo ngưỡng hạn chế vì truyền quá nhiều làm tăng nguy cơ chảy máu lại. Thuốc ức chế bơm proton liều cao đường tĩnh mạch bắt đầu sớm. Nội soi cầm máu bằng kẹp clip, tiêm cầm máu hoặc đốt điện, thường phối hợp hai phương pháp. Sau đó tiếp tục ức chế bơm proton đường uống, tìm và diệt Helicobacter pylori, ngừng hoặc thay thế thuốc chống viêm không steroid. Rà soát lại chỉ định thuốc chống đông cùng bác sĩ tim mạch.',
  },
  {
    slug: 'hoi-chung-ruot-kich-thich',
    locale: 'vi',
    description:
      'Hội chứng ruột kích thích là rối loạn chức năng ruột mạn tính, đặc trưng bởi đau bụng liên quan đại tiện kèm thay đổi tần suất hoặc hình dạng phân, mà không có tổn thương thực thể giải thích được. Cơ chế đa yếu tố gồm rối loạn vận động ruột, tăng nhạy cảm tạng, rối loạn trục não ruột, thay đổi hệ vi sinh và yếu tố tâm lý. Bệnh rất thường gặp và ảnh hưởng nhiều tới chất lượng sống.',
    clinical:
      'Chẩn đoán theo tiêu chuẩn Rome: đau bụng tái diễn ít nhất một ngày mỗi tuần trong 3 tháng gần đây, kèm ít nhất hai trong ba đặc điểm là liên quan đại tiện, thay đổi tần suất phân, thay đổi hình dạng phân. Phân thể theo tính chất phân ưu thế: táo bón, tiêu chảy, hỗn hợp. Quan trọng nhất là tìm dấu hiệu báo động: khởi phát sau 50 tuổi, sụt cân, đi ngoài ra máu, thiếu máu, sốt, tiền sử gia đình ung thư đại trực tràng hoặc bệnh viêm ruột.',
    imaging:
      'Không cần thăm dò hình ảnh nếu tiêu chuẩn điển hình và không có dấu hiệu báo động — làm nhiều xét nghiệm không cần thiết còn củng cố lo lắng của người bệnh. Có dấu hiệu báo động thì nội soi đại trực tràng. Xét nghiệm sàng lọc hợp lý gồm công thức máu, CRP, calprotectin phân để phân biệt với bệnh viêm ruột, và huyết thanh bệnh celiac ở nơi có tỷ lệ đáng kể.',
    progression:
      'Bệnh mạn tính, diễn biến từng đợt, thường liên quan stress và chế độ ăn. Không tiến triển thành ung thư và không làm giảm tuổi thọ — thông tin này cần được nói rõ với người bệnh vì giải toả lo lắng đã là một phần điều trị. Gánh nặng chính là chất lượng sống và chi phí khám chữa lặp lại.',
    treatment:
      'Nền tảng là quan hệ điều trị tin cậy, giải thích rõ bản chất bệnh. Điều chỉnh chế độ ăn, chế độ ăn giảm FODMAP có bằng chứng tốt nhưng nên có hướng dẫn của chuyên gia dinh dưỡng và không kéo dài. Thuốc theo triệu chứng ưu thế: chống co thắt cho đau, thuốc nhuận tràng thẩm thấu cho thể táo bón, thuốc cầm tiêu chảy cho thể tiêu chảy. Thuốc chống trầm cảm ba vòng hoặc SSRI liều thấp có tác dụng điều hoà đau tạng. Liệu pháp tâm lý và thôi miên ruột có hiệu quả ở thể kháng trị.',
  },
  {
    slug: 'xo-cung-bi',
    locale: 'vi',
    description:
      'Xơ cứng bì hệ thống là bệnh tự miễn đặc trưng bởi ba quá trình: tổn thương vi mạch, hoạt hoá miễn dịch và xơ hoá lan toả da cùng nội tạng. Chia hai thể theo mức lan của tổn thương da: thể lan toả xơ hoá da vượt quá khuỷu và gối, tiến triển nhanh, hay tổn thương nội tạng sớm; thể khu trú giới hạn ở đầu chi và mặt, tiến triển chậm hơn nhưng có nguy cơ tăng áp động mạch phổi.',
    clinical:
      'Hiện tượng Raynaud gần như luôn có và thường là triệu chứng đầu tiên, xuất hiện trước nhiều năm. Da dày cứng, mất nếp nhăn, ngón tay hình que, loét đầu ngón, calci hoá dưới da, giãn mao mạch. Tổn thương nội tạng gồm trào ngược và giảm nhu động thực quản, bệnh phổi kẽ, tăng áp động mạch phổi, và cơn thận cấp. Kháng thể kháng Scl-70 gặp ở thể lan toả, kháng thể kháng centromere ở thể khu trú.',
    imaging:
      'Soi mao mạch nền móng phát hiện bất thường vi mạch rất sớm, có giá trị chẩn đoán và tiên lượng. Chụp cắt lớp vi tính độ phân giải cao lồng ngực tìm bệnh phổi kẽ; đo chức năng hô hấp với khuếch tán khí theo dõi định kỳ. Siêu âm tim tầm soát tăng áp động mạch phổi hằng năm — phát hiện sớm thay đổi hẳn tiên lượng. Chụp thực quản đánh giá rối loạn nhu động.',
    progression:
      'Xơ hoá da ở thể lan toả có thể ổn định hoặc thoái lui sau vài năm, nhưng tổn thương nội tạng thì không hồi phục. Hai nguyên nhân tử vong hàng đầu hiện nay là bệnh phổi kẽ và tăng áp động mạch phổi. Cơn thận cấp do xơ cứng bì là cấp cứu với tăng huyết áp ác tính và suy thận tiến triển nhanh.',
    treatment:
      'Chưa có thuốc chữa khỏi; điều trị hướng theo từng tổn thương cơ quan. Raynaud dùng chẹn kênh calci, giữ ấm, bỏ thuốc lá. Bệnh phổi kẽ dùng mycophenolat hoặc cyclophosphamid, thêm thuốc chống xơ. Tăng áp động mạch phổi dùng thuốc giãn mạch phổi đặc hiệu. Trào ngược dùng ức chế bơm proton liều cao. Cơn thận cấp bắt buộc dùng ức chế men chuyển ngay và không được ngừng — đây là tiến bộ đã làm thay đổi tiên lượng của biến chứng này.',
  },
  {
    slug: 'viem-da-co-viem-da-co-tu-mien',
    locale: 'vi',
    description:
      'Viêm đa cơ và viêm da cơ là bệnh cơ viêm tự miễn, đặc trưng bởi yếu cơ gốc chi đối xứng do viêm và huỷ sợi cơ. Viêm da cơ có thêm tổn thương da đặc trưng và cơ chế tổn thương vi mạch. Bệnh có liên quan đáng kể với ung thư tiềm ẩn, đặc biệt viêm da cơ ở người trên 40 tuổi — nên tầm soát ung thư là một phần bắt buộc của chẩn đoán chứ không phải tuỳ chọn.',
    clinical:
      'Yếu cơ gốc chi tiến triển trong vài tuần đến vài tháng: khó leo cầu thang, khó đứng lên từ ghế, khó chải đầu. Yếu cơ hầu họng gây nuốt khó và nguy cơ hít sặc. Tổn thương da của viêm da cơ gồm ban tím quanh mi mắt kèm phù, sẩn Gottron trên khớp ngón tay, ban chữ V ở cổ ngực. Xét nghiệm thấy creatine kinase tăng cao; điện cơ có hình ảnh bệnh cơ; kháng thể đặc hiệu bệnh cơ giúp phân nhóm và tiên lượng.',
    imaging:
      'Cộng hưởng từ cơ đùi phát hiện phù cơ và hướng dẫn vị trí sinh thiết — hữu ích vì tổn thương phân bố loang lổ. Sinh thiết cơ là tiêu chuẩn chẩn đoán. Chụp cắt lớp vi tính lồng ngực tìm bệnh phổi kẽ đi kèm. Tầm soát ung thư toàn diện theo tuổi và giới, lặp lại trong vài năm đầu.',
    progression:
      'Đáp ứng điều trị thường tốt nhưng cần thời gian dài và hay tái phát khi giảm liều. Biến chứng nặng gồm viêm phổi hít do yếu cơ hầu họng, bệnh phổi kẽ tiến triển nhanh đặc biệt ở nhóm kháng thể MDA5, và biến chứng của corticoid kéo dài. Tiên lượng xấu hơn rõ khi có ung thư kèm theo.',
    treatment:
      'Corticoid liều cao là điều trị khởi đầu, giảm liều chậm theo đáp ứng lâm sàng và creatine kinase. Phối hợp sớm thuốc tiết kiệm corticoid như methotrexat hoặc azathioprin. Globulin miễn dịch tĩnh mạch cho thể nặng, có nuốt khó hoặc kháng trị. Vật lý trị liệu ngay khi kiểm soát được viêm để phục hồi sức cơ. Chống nắng và điều trị tại chỗ cho tổn thương da. Dự phòng loãng xương và nhiễm khuẩn cơ hội.',
  },
  {
    slug: 'viem-khop-tu-phat-thieu-nien',
    locale: 'vi',
    description:
      'Viêm khớp tự phát thiếu niên là nhóm bệnh viêm khớp mạn tính khởi phát trước 16 tuổi và kéo dài trên 6 tuần, sau khi loại trừ các nguyên nhân khác. Đây là chẩn đoán loại trừ. Nhóm bệnh gồm nhiều thể với biểu hiện và tiên lượng khác nhau: thể ít khớp, thể nhiều khớp, thể hệ thống, thể viêm khớp vảy nến và thể liên quan viêm điểm bám gân.',
    clinical:
      'Trẻ có sưng đau khớp kéo dài, cứng khớp buổi sáng, đi khập khiễng hoặc bỏ chơi. Trẻ nhỏ ít kêu đau nên dấu hiệu thường là thay đổi vận động và hành vi — dễ bị bỏ sót. Thể hệ thống có sốt cao dao động hằng ngày, ban dạng cá hồi thoáng qua, gan lách hạch to, viêm thanh mạc. Xét nghiệm viêm tăng; kháng thể kháng nhân dương tính liên quan nguy cơ viêm màng bồ đào.',
    imaging:
      'Siêu âm khớp phát hiện viêm màng hoạt dịch và tràn dịch nhạy hơn khám lâm sàng. Cộng hưởng từ đánh giá tổn thương sụn và xương sớm. X-quang giai đoạn muộn thấy hẹp khe khớp, bào mòn, và rối loạn phát triển đầu xương. Khám mắt bằng đèn khe định kỳ là bắt buộc để phát hiện viêm màng bồ đào — bệnh này thường không triệu chứng nhưng có thể gây mù.',
    progression:
      'Diễn biến rất khác nhau theo thể. Biến chứng đặc thù ở trẻ em gồm rối loạn tăng trưởng toàn thân và tại chỗ như chênh lệch chiều dài chi, biến dạng khớp, loãng xương. Viêm màng bồ đào mạn có thể dẫn tới đục thuỷ tinh thể, glaucoma và mù. Thể hệ thống có thể biến chứng hội chứng hoạt hoá đại thực bào — cấp cứu đe doạ tính mạng.',
    treatment:
      'Thuốc chống viêm không steroid cho thể nhẹ; tiêm corticoid nội khớp rất hiệu quả cho thể ít khớp. Methotrexat là thuốc nền cho thể nhiều khớp. Thuốc sinh học ức chế TNF, IL-1 hoặc IL-6 cho thể kháng trị và thể hệ thống. Hạn chế tối đa corticoid toàn thân kéo dài vì ảnh hưởng tăng trưởng. Vật lý trị liệu duy trì chức năng và phòng co rút, phối hợp chăm sóc đa chuyên khoa gồm nhãn khoa và dinh dưỡng.',
  },
  {
    slug: 'nhiem-khuan-co-xuong-khop',
    locale: 'vi',
    description:
      'Nhiễm khuẩn cơ xương khớp gồm viêm khớp nhiễm khuẩn, viêm xương tuỷ xương và nhiễm khuẩn phần mềm. Đường vào gồm theo đường máu, lan từ ổ nhiễm khuẩn kề cận, hoặc trực tiếp sau chấn thương và thủ thuật. Tác nhân hàng đầu là tụ cầu vàng. Nhóm nguy cơ gồm người đái tháo đường, suy giảm miễn dịch, tiêm chích ma tuý, có khớp nhân tạo hoặc phương tiện kết hợp xương.',
    clinical:
      'Viêm khớp nhiễm khuẩn biểu hiện một khớp sưng nóng đỏ đau dữ dội, hạn chế vận động hoàn toàn, kèm sốt. Đây là cấp cứu nội khoa vì sụn khớp bị phá huỷ nhanh trong vài ngày. Viêm xương tuỷ có đau xương khu trú, sốt, có thể rò mủ ở thể mạn. Chọc dịch khớp là thủ thuật quyết định: dịch đục, bạch cầu rất cao ưu thế đa nhân, soi và cấy tìm vi khuẩn. Cấy máu trước khi dùng kháng sinh.',
    imaging:
      'X-quang giai đoạn sớm bình thường nên không dùng để loại trừ. Siêu âm phát hiện tràn dịch khớp và hướng dẫn chọc hút. Cộng hưởng từ là thăm dò nhạy nhất cho viêm xương tuỷ giai đoạn sớm và áp xe phần mềm. Xạ hình xương khi cộng hưởng từ không thực hiện được.',
    progression:
      'Chậm điều trị dẫn tới phá huỷ sụn khớp không hồi phục, dính khớp và mất chức năng vĩnh viễn. Viêm xương tuỷ có thể chuyển mạn tính với xương chết và đường rò, rất khó điều trị dứt điểm. Nhiễm khuẩn khớp nhân tạo thường phải tháo bỏ phương tiện. Nhiễm khuẩn huyết và sốc là biến chứng toàn thân.',
    treatment:
      'Nguyên tắc là dẫn lưu mủ kết hợp kháng sinh — kháng sinh đơn thuần không đủ khi đã có ổ mủ. Chọc hút dịch khớp lặp lại hoặc nội soi rửa khớp, phẫu thuật làm sạch với viêm xương tuỷ. Kháng sinh khởi đầu theo kinh nghiệm phủ tụ cầu, điều chỉnh theo kháng sinh đồ, dùng kéo dài nhiều tuần. Bất động tương đối giai đoạn cấp rồi vận động sớm để tránh dính khớp. Tìm và xử trí ổ nhiễm khuẩn nguyên phát.',
  },
  {
    slug: 'viem-co-nhiem-khuan',
    locale: 'vi',
    description:
      'Viêm cơ nhiễm khuẩn là nhiễm khuẩn tạo mủ trong cơ vân, hay gặp ở cơ lớn của chi dưới như cơ tứ đầu đùi và cơ mông. Tác nhân chủ yếu là tụ cầu vàng. Bệnh phổ biến hơn ở vùng khí hậu nhiệt đới. Yếu tố thuận lợi gồm chấn thương cơ, đái tháo đường, suy giảm miễn dịch, nghiện chích và suy dinh dưỡng.',
    clinical:
      'Diễn biến qua ba giai đoạn: giai đoạn đầu đau cơ mơ hồ và sốt nhẹ, dễ nhầm với căng cơ; giai đoạn tạo mủ với sưng đau rõ, sốt cao, khối căng; giai đoạn muộn có nhiễm khuẩn huyết. Chẩn đoán ở giai đoạn đầu khó vì da phía trên thường không đỏ — khác với viêm mô tế bào. Xét nghiệm thấy bạch cầu và CRP tăng; creatine kinase có thể chỉ tăng nhẹ, không tương xứng mức tổn thương.',
    imaging:
      'Siêu âm phát hiện ổ dịch trong cơ và hướng dẫn chọc hút. Cộng hưởng từ là thăm dò tốt nhất, phân định rõ phù cơ giai đoạn sớm với ổ áp xe đã hình thành — điều này quyết định có cần dẫn lưu hay không. Chụp cắt lớp vi tính khi không có cộng hưởng từ. Cấy máu và cấy mủ định danh vi khuẩn.',
    progression:
      'Chẩn đoán muộn dẫn tới áp xe lan rộng, nhiễm khuẩn huyết, sốc nhiễm khuẩn và di căn nhiễm khuẩn tới các cơ quan khác. Điều trị đúng ở giai đoạn sớm có thể khỏi hoàn toàn chỉ với kháng sinh. Biến chứng muộn gồm xơ hoá cơ và giảm chức năng vận động.',
    treatment:
      'Giai đoạn viêm chưa tạo mủ có thể khỏi với kháng sinh đường tĩnh mạch đơn thuần. Đã tạo áp xe thì phải dẫn lưu, qua da dưới hướng dẫn hình ảnh hoặc phẫu thuật tuỳ kích thước và vị trí. Kháng sinh khởi đầu phủ tụ cầu bao gồm cả tụ cầu kháng methicillin ở nơi có tỷ lệ cao, sau đó theo kháng sinh đồ, kéo dài nhiều tuần. Kiểm soát bệnh nền như đái tháo đường và cải thiện dinh dưỡng.',
  },
  {
    slug: 'viem-dia-dem-dot-song',
    locale: 'vi',
    description:
      'Viêm đĩa đệm đốt sống do vi khuẩn là nhiễm khuẩn đĩa đệm và hai thân đốt sống kề bên. Đường vào chủ yếu theo đường máu; ngoài ra có thể sau phẫu thuật cột sống hoặc thủ thuật xâm lấn. Tác nhân hàng đầu là tụ cầu vàng; ở Việt Nam cần luôn nghĩ tới lao cột sống với diễn biến bán cấp và tổn thương đặc trưng. Vị trí hay gặp là cột sống thắt lưng.',
    clinical:
      'Đau lưng liên tục, tăng về đêm và không giảm khi nghỉ — khác hẳn đau lưng cơ học. Kèm sốt, sụt cân, có thể có dấu hiệu thần kinh khi chèn ép. Khám thấy ấn đau khu trú mỏm gai và co cứng cơ cạnh sống. Chẩn đoán thường muộn vì triệu chứng giống đau lưng thông thường. Xét nghiệm CRP và tốc độ máu lắng tăng là chỉ dấu nhạy để nghi ngờ và theo dõi. Cấy máu và sinh thiết đĩa đệm dưới hướng dẫn hình ảnh để định danh tác nhân.',
    imaging:
      'Cộng hưởng từ cột sống có tiêm thuốc là tiêu chuẩn chẩn đoán, nhạy ngay từ giai đoạn sớm: phù tuỷ xương hai thân đốt kề nhau, tổn thương đĩa đệm, áp xe cạnh sống hoặc ngoài màng cứng. X-quang chỉ thay đổi sau vài tuần nên không dùng để loại trừ. Chụp cắt lớp vi tính hướng dẫn sinh thiết.',
    progression:
      'Không điều trị dẫn tới phá huỷ thân đốt, xẹp đốt sống, gù biến dạng và mất vững cột sống. Áp xe ngoài màng cứng chèn ép tuỷ là biến chứng cấp cần phẫu thuật khẩn để tránh liệt vĩnh viễn. Nhiễm khuẩn huyết và ổ di căn nhiễm khuẩn ở nơi khác.',
    treatment:
      'Kháng sinh theo tác nhân phân lập được, đường tĩnh mạch rồi chuyển uống, tổng thời gian thường 6 đến 12 tuần — cố gắng lấy bệnh phẩm trước khi dùng kháng sinh vì sau đó rất khó phân lập. Lao cột sống điều trị theo phác đồ chống lao kéo dài. Bất động tương đối và áo nẹp hỗ trợ. Phẫu thuật khi có chèn ép thần kinh, áp xe lớn, mất vững cột sống hoặc thất bại điều trị nội khoa. Theo dõi CRP để đánh giá đáp ứng.',
  },
  {
    slug: 'benh-ly-phan-mem-canh-khop',
    locale: 'vi',
    description:
      'Bệnh lý phần mềm cạnh khớp là nhóm rối loạn của gân, bao gân, bao thanh dịch, dây chằng và điểm bám gân quanh khớp, không tổn thương sụn và xương khớp. Cơ chế chủ yếu là quá tải cơ học lặp lại và thoái hoá gân theo tuổi, chứ không phải viêm đơn thuần — hiểu đúng điều này quan trọng vì nó định hướng điều trị sang phục hồi chức năng thay vì chỉ chống viêm.',
    clinical:
      'Đau khu trú quanh khớp, tăng khi vận động chủ động theo hướng liên quan gân bị tổn thương, ấn đau đúng điểm bám gân. Vận động thụ động thường ít đau hơn vận động chủ động có kháng — đây là đặc điểm phân biệt với bệnh của chính khớp. Các thể hay gặp gồm viêm gân chóp xoay, viêm mỏm trên lồi cầu ngoài xương cánh tay, viêm gân gót, viêm cân gan chân, hội chứng ống cổ tay. Xét nghiệm viêm bình thường.',
    imaging:
      'Siêu âm là thăm dò đầu tay, khảo sát động, đánh giá được cấu trúc gân, dịch bao gân, calci hoá và rách gân, đồng thời hướng dẫn tiêm chính xác. Cộng hưởng từ khi nghi rách lớn hoặc trước phẫu thuật. X-quang chủ yếu để loại trừ tổn thương xương khớp và phát hiện calci hoá.',
    progression:
      'Phần lớn hồi phục với điều trị bảo tồn, tuy có thể kéo dài nhiều tháng. Không điều trị hoặc tiếp tục quá tải dẫn tới thoái hoá gân tiến triển, rách gân và hạn chế chức năng lâu dài. Tái phát thường gặp nếu không sửa được yếu tố cơ học gây bệnh.',
    treatment:
      'Trọng tâm là điều chỉnh hoạt động gây quá tải và tập phục hồi chức năng, đặc biệt bài tập ly tâm cho bệnh lý gân — đây là biện pháp có bằng chứng tốt nhất chứ không phải thuốc. Giảm đau bằng paracetamol và thuốc chống viêm không steroid dạng bôi tại chỗ. Tiêm corticoid tại chỗ giúp giảm đau ngắn hạn nhưng lạm dụng làm yếu gân và tăng nguy cơ đứt, nên hạn chế số lần. Phẫu thuật chỉ đặt ra khi rách lớn hoặc thất bại điều trị bảo tồn kéo dài.',
  },
  {
    slug: 'dai-thao-nhat',
    locale: 'vi',
    description:
      'Đái tháo nhạt là tình trạng mất khả năng cô đặc nước tiểu, gây tiểu nhiều nước tiểu loãng và khát nhiều. Hai thể có cơ chế và điều trị khác hẳn: thể trung ương do thiếu hormon chống bài niệu ADH từ vùng dưới đồi và tuyến yên sau, nguyên nhân gồm u, chấn thương, phẫu thuật, thâm nhiễm; thể do thận là do thận không đáp ứng với ADH, nguyên nhân gồm di truyền, lithium, tăng calci máu và hạ kali máu.',
    clinical:
      'Tiểu nhiều số lượng lớn cả ngày lẫn đêm, có thể trên 3 lít mỗi ngày, nước tiểu nhạt màu như nước lã, kèm khát dữ dội và uống nhiều. Cần phân biệt với đái tháo đường bằng đường máu, và với chứng uống nhiều do tâm lý. Xét nghiệm thấy áp lực thẩm thấu nước tiểu thấp trong khi áp lực thẩm thấu máu bình thường hoặc tăng. Nghiệm pháp nhịn nước có kiểm soát rồi dùng desmopressin phân định thể trung ương với thể do thận.',
    imaging:
      'Chụp cộng hưởng từ vùng dưới đồi và tuyến yên là bắt buộc ở thể trung ương để tìm u, tổn thương thâm nhiễm hoặc di căn; mất tín hiệu sáng bình thường của tuyến yên sau là dấu hiệu gợi ý. Siêu âm hệ tiết niệu đánh giá hậu quả của đa niệu kéo dài như giãn đài bể thận và bàng quang.',
    progression:
      'Nếu người bệnh tỉnh táo và tiếp cận được nước thì có thể duy trì cân bằng nhiều năm. Nguy hiểm xuất hiện khi mất khả năng uống theo nhu cầu — người hôn mê, trẻ nhỏ, người cao tuổi — dẫn tới mất nước nặng và tăng natri máu cấp. Tiên lượng thể trung ương phụ thuộc bệnh nền của vùng dưới đồi tuyến yên.',
    treatment:
      'Thể trung ương điều trị thay thế bằng desmopressin đường xịt mũi hoặc uống, chỉnh liều theo lượng nước tiểu và natri máu, tránh dùng quá liều gây hạ natri máu. Thể do thận thì desmopressin không hiệu quả; xử trí bằng loại bỏ nguyên nhân như ngừng lithium, điều chỉnh calci và kali, kết hợp chế độ ăn giảm muối và lợi tiểu thiazid theo cơ chế nghịch lý. Bảo đảm tiếp cận nước tự do là biện pháp nền cho mọi thể.',
  },
  {
    slug: 'hoi-chung-sheehan',
    locale: 'vi',
    description:
      'Hội chứng Sheehan là suy tuyến yên do hoại tử thuỳ trước tuyến yên sau băng huyết nặng lúc sinh. Cơ chế là tuyến yên phì đại sinh lý trong thai kỳ trở nên nhạy cảm với thiếu máu, nên tụt huyết áp nặng gây nhồi máu tuyến. Bệnh vẫn còn gặp ở nơi chăm sóc sản khoa còn hạn chế. Đây là nguyên nhân suy tuyến yên có thể phòng được hoàn toàn bằng xử trí băng huyết sau sinh tốt.',
    clinical:
      'Dấu hiệu sớm nhất và gợi ý nhất là không tiết được sữa sau sinh, tiếp theo là không có kinh trở lại. Về sau xuất hiện triệu chứng suy các tuyến đích: suy giáp thứ phát gây mệt mỏi sợ lạnh, suy thượng thận thứ phát gây yếu mệt tụt huyết áp, suy sinh dục gây rụng lông mu và lông nách. Chẩn đoán dựa trên định lượng hormon tuyến yên thấp cùng hormon tuyến đích thấp — điểm phân biệt với suy tuyến đích tiên phát vốn có hormon tuyến yên tăng bù.',
    imaging:
      'Chụp cộng hưởng từ tuyến yên thấy tuyến teo nhỏ, giai đoạn muộn có hình hố yên rỗng. Hình ảnh giúp loại trừ u tuyến yên và các nguyên nhân suy tuyến yên khác. Cần đánh giá đầy đủ các trục hormon bằng xét nghiệm cơ bản và nghiệm pháp động khi cần.',
    progression:
      'Bệnh diễn biến âm thầm, chẩn đoán thường muộn nhiều năm sau sinh vì triệu chứng không đặc hiệu. Nguy hiểm nhất là cơn suy thượng thận cấp khi có stress như nhiễm khuẩn, phẫu thuật hoặc chấn thương ở người chưa được chẩn đoán — có thể tử vong. Điều trị thay thế đầy đủ cho chất lượng sống gần bình thường.',
    treatment:
      'Thay thế hormon suốt đời theo từng trục bị suy. Nguyên tắc quan trọng: phải bù corticoid TRƯỚC khi bù hormon giáp, vì bù giáp trước sẽ làm tăng chuyển hoá và thúc đẩy cơn suy thượng thận cấp. Levothyroxin chỉnh liều theo FT4 chứ không theo TSH vì TSH đã mất giá trị trong suy tuyến yên. Estrogen và progesteron thay thế cho phụ nữ còn trẻ. Người bệnh cần mang thẻ nhận dạng và biết cách tăng liều corticoid khi ốm.',
  },
  {
    slug: 'benh-to-cac-vien-cuc',
    locale: 'vi',
    description:
      'Bệnh to các viễn cực là hậu quả của tăng tiết hormon tăng trưởng kéo dài ở người trưởng thành, gần như luôn do u tuyến yên tiết GH. Ở người đã đóng sụn tiếp hợp thì xương không dài thêm mà dày lên và phần mềm phì đại, tạo bộ mặt và bàn tay bàn chân đặc trưng. Nếu xảy ra trước tuổi dậy thì thì gây bệnh khổng lồ. Bệnh tiến triển rất chậm nên chẩn đoán thường muộn nhiều năm.',
    clinical:
      'Thay đổi hình thái từ từ: trán dô, cung mày gồ, mũi và môi dày, hàm dưới nhô, răng thưa, bàn tay bàn chân to lên phải đổi cỡ nhẫn và giày. So sánh ảnh cũ là công cụ chẩn đoán rất hữu ích. Kèm đau đầu, đau khớp, hội chứng ống cổ tay, ngừng thở khi ngủ, tăng huyết áp và đái tháo đường. Xét nghiệm sàng lọc là IGF-1 tăng theo tuổi giới; khẳng định bằng nghiệm pháp dung nạp glucose không ức chế được GH.',
    imaging:
      'Chụp cộng hưởng từ tuyến yên xác định kích thước u, phần lớn là u lớn tại thời điểm chẩn đoán. Đánh giá thị trường khi u chèn giao thoa thị giác. Siêu âm tim tìm bệnh cơ tim to; nội soi đại tràng tầm soát polyp và ung thư đại trực tràng vì nguy cơ tăng.',
    progression:
      'Không điều trị thì tỷ lệ tử vong tăng rõ, chủ yếu do biến chứng tim mạch, hô hấp và chuyển hoá. Biến chứng gồm bệnh cơ tim, tăng huyết áp, đái tháo đường, ngừng thở khi ngủ, bệnh khớp nặng và tăng nguy cơ một số ung thư. Kiểm soát được nồng độ hormon đưa tỷ lệ tử vong về gần mức dân số chung.',
    treatment:
      'Phẫu thuật nội soi qua xoang bướm lấy u là điều trị đầu tay và có thể chữa khỏi khi u nhỏ. Thuốc đồng vận somatostatin dùng khi phẫu thuật không triệt để hoặc không mổ được; thuốc đối kháng thụ thể GH cho trường hợp kháng trị. Xạ trị là lựa chọn sau cùng do hiệu quả chậm và nguy cơ suy tuyến yên. Song song phải điều trị các biến chứng tim mạch, chuyển hoá và theo dõi lâu dài bằng IGF-1.',
  },
  {
    slug: 'buou-giap-don-thuan',
    locale: 'vi',
    description:
      'Bướu giáp đơn thuần là tuyến giáp to lan toả mà chức năng giáp vẫn bình thường và không do viêm hay u. Nguyên nhân phổ biến nhất trên thế giới là thiếu iod trong chế độ ăn, dẫn tới tăng tiết TSH bù trừ và kích thích tuyến giáp phì đại. Việt Nam từng là vùng dịch tễ bướu cổ; chương trình muối iod toàn dân đã làm giảm mạnh tỷ lệ mắc — đây là ví dụ điển hình của y tế dự phòng hiệu quả.',
    clinical:
      'Tuyến giáp to đều hai thuỳ, mật độ mềm, không đau, di động theo nhịp nuốt, không có tiếng thổi. Người bệnh bình giáp trên lâm sàng. Bướu lớn có thể gây chèn ép: nuốt vướng, khó thở khi nằm, khàn tiếng. Xét nghiệm TSH và FT4 bình thường là tiêu chuẩn phân định với cường giáp và suy giáp. Cần khám kỹ tìm nhân giáp vì xử trí khác hẳn.',
    imaging:
      'Siêu âm tuyến giáp đánh giá thể tích, cấu trúc nhu mô và phát hiện nhân — nếu có nhân thì không còn là bướu giáp đơn thuần và phải đánh giá nguy cơ ác tính theo phân loại TIRADS. Xạ hình tuyến giáp khi cần đánh giá chức năng vùng. Chụp cắt lớp vi tính khi bướu chìm sau xương ức hoặc có dấu hiệu chèn ép.',
    progression:
      'Bướu có thể ổn định nhiều năm hoặc to dần, đặc biệt trong dậy thì, thai kỳ và mãn kinh. Bướu lâu năm có xu hướng hình thành nhân và có thể chuyển thành bướu giáp nhân độc gây cường giáp. Bướu rất to gây chèn ép khí quản và thực quản, và bướu chìm sau xương ức có thể gây khó thở tư thế.',
    treatment:
      'Bảo đảm cung cấp đủ iod là biện pháp gốc, chủ yếu qua muối iod. Bướu nhỏ, bình giáp, không chèn ép thì chỉ theo dõi định kỳ. Levothyroxin ức chế TSH hiệu quả hạn chế và có nguy cơ ở người cao tuổi, hiện ít dùng thường quy. Phẫu thuật cắt tuyến giáp khi bướu quá to gây chèn ép, bướu chìm sau xương ức, hoặc vì lý do thẩm mỹ. Iod phóng xạ là lựa chọn thay thế phẫu thuật ở một số trường hợp.',
  },
  {
    slug: 'suy-thuong-than-man-tinh',
    locale: 'vi',
    description:
      'Suy thượng thận mạn tính là tình trạng thiếu hụt hormon vỏ thượng thận kéo dài. Thể tiên phát hay bệnh Addison là do tổn thương tại tuyến thượng thận, phổ biến nhất hiện nay là viêm tự miễn, ngoài ra có lao thượng thận vẫn còn gặp ở Việt Nam. Thể thứ phát do thiếu ACTH từ tuyến yên, mà nguyên nhân thường gặp nhất trong thực hành là dùng corticoid kéo dài rồi ngừng đột ngột.',
    clinical:
      'Triệu chứng âm thầm và không đặc hiệu nên dễ bỏ sót: mệt mỏi tăng dần, chán ăn, sụt cân, buồn nôn, đau bụng, tụt huyết áp tư thế. Dấu hiệu đặc trưng riêng của thể tiên phát là sạm da lan toả, rõ ở nếp gấp, sẹo và niêm mạc miệng — do ACTH tăng cao; thể thứ phát KHÔNG có sạm da. Xét nghiệm thấy hạ natri, tăng kali trong thể tiên phát; cortisol máu buổi sáng thấp; nghiệm pháp kích thích bằng ACTH tổng hợp để khẳng định.',
    imaging:
      'Chụp cắt lớp vi tính tuyến thượng thận tìm nguyên nhân ở thể tiên phát: tuyến teo nhỏ trong viêm tự miễn, tuyến to có vôi hoá gợi ý lao hoặc nấm, khối u hoặc di căn. Chụp cộng hưởng từ tuyến yên ở thể thứ phát. Xét nghiệm kháng thể kháng vỏ thượng thận hỗ trợ chẩn đoán nguyên nhân tự miễn.',
    progression:
      'Không chẩn đoán thì bệnh tiến triển tới cơn suy thượng thận cấp — cấp cứu với tụt huyết áp nặng, hạ đường huyết, rối loạn ý thức, có thể tử vong. Cơn thường khởi phát bởi nhiễm khuẩn, phẫu thuật, chấn thương hoặc bỏ thuốc. Với điều trị thay thế đầy đủ, tiên lượng tốt và tuổi thọ gần bình thường.',
    treatment:
      'Thay thế glucocorticoid suốt đời, chia liều mô phỏng nhịp tiết sinh lý. Thể tiên phát cần thêm mineralocorticoid là fludrocortison. Nguyên tắc sống còn là quy tắc liều khi ốm: tăng gấp đôi đến gấp ba liều corticoid khi sốt, nhiễm khuẩn, phẫu thuật; chuyển đường tiêm khi nôn không uống được. Người bệnh phải được giáo dục kỹ, mang thẻ nhận dạng và có sẵn thuốc tiêm dự phòng tại nhà. Cơn cấp xử trí bằng hydrocortison tĩnh mạch và bù dịch ngay, không chờ kết quả xét nghiệm.',
  },
  {
    slug: 'cuong-aldosteron',
    locale: 'vi',
    description:
      'Cường aldosteron tiên phát là tình trạng tuyến thượng thận tiết aldosteron quá mức, độc lập với hệ renin angiotensin. Hai nguyên nhân chính là tăng sản thượng thận hai bên và u tuyến tiết aldosteron một bên — phân biệt hai thể này là bước quyết định vì thể một bên có thể chữa khỏi bằng phẫu thuật còn thể hai bên điều trị nội khoa. Đây là nguyên nhân tăng huyết áp thứ phát thường gặp nhất, và bị chẩn đoán thiếu nhiều.',
    clinical:
      'Tăng huyết áp thường khó kiểm soát, cần nhiều thuốc. Hạ kali máu là dấu hiệu kinh điển gây yếu cơ, chuột rút, tiểu nhiều — nhưng phần lớn bệnh nhân có kali bình thường, nên không được dùng kali bình thường để loại trừ chẩn đoán. Cần sàng lọc ở người tăng huyết áp kháng trị, tăng huyết áp kèm hạ kali, tăng huyết áp khởi phát sớm, hoặc có u thượng thận tình cờ. Xét nghiệm sàng lọc là tỷ lệ aldosteron trên renin huyết tương.',
    imaging:
      'Chụp cắt lớp vi tính tuyến thượng thận lớp mỏng tìm u tuyến. Tuy nhiên hình ảnh đơn thuần không đủ để quyết định phẫu thuật vì u tình cờ rất thường gặp và tăng sản hai bên có thể không đối xứng. Lấy máu tĩnh mạch thượng thận hai bên định lượng aldosteron là tiêu chuẩn vàng để xác định bên tiết — bước này quyết định có mổ hay không.',
    progression:
      'Aldosteron dư thừa gây tổn thương cơ quan đích nặng hơn tăng huyết áp nguyên phát cùng mức huyết áp: phì đại thất trái, xơ hoá cơ tim, rung nhĩ, đột quỵ và bệnh thận mạn. Đây là lý do phải chẩn đoán và điều trị đặc hiệu chứ không chỉ hạ huyết áp đơn thuần.',
    treatment:
      'Thể một bên do u tuyến điều trị bằng phẫu thuật nội soi cắt tuyến thượng thận, có thể chữa khỏi hoặc cải thiện rõ huyết áp. Thể hai bên điều trị bằng thuốc đối kháng thụ thể mineralocorticoid như spironolacton hoặc eplerenon, kèm bổ sung kali khi cần và kiểm soát huyết áp phối hợp. Lưu ý nhiều thuốc hạ huyết áp ảnh hưởng tới xét nghiệm sàng lọc nên cần điều chỉnh thuốc trước khi làm.',
  },
  {
    slug: 'u-tuy-thuong-than',
    locale: 'vi',
    description:
      'U tuỷ thượng thận là u xuất phát từ tế bào ưa crôm của tuỷ thượng thận, tiết catecholamin gây tăng huyết áp và các cơn kịch phát. U cùng loại nằm ngoài thượng thận gọi là u cận hạch. Bệnh hiếm nhưng quan trọng vì có thể chữa khỏi bằng phẫu thuật, và ngược lại nếu bỏ sót thì có thể gây tử vong trong gây mê hoặc thủ thuật. Một tỷ lệ đáng kể liên quan hội chứng di truyền nên cần tư vấn xét nghiệm gen.',
    clinical:
      'Tam chứng kinh điển là đau đầu dữ dội, vã mồ hôi và hồi hộp đánh trống ngực, xuất hiện thành cơn trên nền tăng huyết áp. Cơn có thể khởi phát bởi gắng sức, sờ nắn bụng, một số thuốc hoặc thủ thuật. Tăng huyết áp có thể dao động hoặc thường xuyên. Xét nghiệm chẩn đoán là định lượng metanephrin tự do huyết tương hoặc metanephrin niệu 24 giờ — có độ nhạy cao hơn định lượng catecholamin trực tiếp.',
    imaging:
      'Chỉ chụp hình ảnh SAU khi có bằng chứng sinh hoá, không làm ngược lại. Chụp cắt lớp vi tính hoặc cộng hưởng từ ổ bụng định vị khối. Xạ hình MIBG hoặc PET với chất đánh dấu đặc hiệu để tìm u ngoài thượng thận, u nhiều ổ và di căn. Xét nghiệm gen cho bệnh nhân và người thân khi nghi hội chứng di truyền.',
    progression:
      'Cơn tăng huyết áp kịch phát có thể gây đột quỵ, phù phổi cấp, rối loạn nhịp và bệnh cơ tim do catecholamin. Nguy hiểm đặc biệt là cơn bão catecholamin khi phẫu thuật mà chưa chuẩn bị thuốc chẹn alpha — có thể tử vong. Một tỷ lệ u là ác tính với di căn, cần theo dõi lâu dài kể cả sau mổ.',
    treatment:
      'Phẫu thuật cắt u là điều trị triệt để, nhưng CHUẨN BỊ TRƯỚC MỔ mới là khâu quyết định an toàn: dùng thuốc chẹn alpha ít nhất 10 đến 14 ngày trước mổ để kiểm soát huyết áp và bù lại thể tích tuần hoàn, chỉ thêm chẹn beta SAU khi đã chẹn alpha đủ — dùng chẹn beta trước sẽ gây cơn tăng huyết áp nguy hiểm. Bù dịch và muối trước mổ. Theo dõi metanephrin định kỳ sau mổ vì nguy cơ tái phát và di căn muộn.',
  },
  {
    slug: 'phinh-dong-mach-chu-bung',
    locale: 'vi',
    description:
      'Phình động mạch chủ bụng là giãn khu trú đường kính động mạch chủ bụng vượt quá 1,5 lần đường kính bình thường, thực hành thường lấy mốc từ 3 cm. Cơ chế là thoái hoá lớp áo giữa với phá huỷ elastin và collagen, làm thành mạch yếu dần. Yếu tố nguy cơ mạnh nhất là hút thuốc lá, kèm tuổi cao, nam giới, tăng huyết áp, xơ vữa động mạch và tiền sử gia đình.',
    clinical:
      'Phần lớn không triệu chứng và phát hiện tình cờ — đây là lý do có chương trình tầm soát bằng siêu âm ở nam giới cao tuổi từng hút thuốc. Khi có thể sờ thấy khối đập theo nhịp mạch ở vùng bụng. Bộ ba đau bụng hoặc đau lưng đột ngột, tụt huyết áp và khối đập ở bụng gợi ý VỠ PHÌNH — cấp cứu ngoại khoa tối khẩn, không được trì hoãn để làm thêm thăm dò khi huyết động không ổn định.',
    imaging:
      'Siêu âm bụng là công cụ tầm soát và theo dõi: rẻ, không xâm lấn, đo đường kính chính xác. Chụp cắt lớp vi tính có tiêm thuốc là thăm dò trước can thiệp, xác định hình thái, vị trí so với động mạch thận và lập kế hoạch đặt stent graft. Ở người nghi vỡ mà huyết động ổn thì chụp cắt lớp nhanh; huyết động không ổn thì chuyển mổ ngay.',
    progression:
      'Phình lớn dần theo thời gian, tốc độ tăng nhanh hơn khi đường kính đã lớn và ở người tiếp tục hút thuốc. Nguy cơ vỡ tăng vọt theo đường kính — đây là cơ sở của ngưỡng chỉ định can thiệp. Vỡ phình có tỷ lệ tử vong rất cao, phần lớn tử vong trước khi đến được bệnh viện.',
    treatment:
      'Phình nhỏ thì theo dõi bằng siêu âm định kỳ với khoảng cách tuỳ đường kính, đồng thời bỏ thuốc lá, kiểm soát huyết áp và dùng statin — bỏ thuốc lá là can thiệp làm chậm tiến triển rõ nhất. Can thiệp khi đường kính vượt ngưỡng, tăng nhanh, hoặc có triệu chứng. Hai phương pháp là đặt stent graft nội mạch với hồi phục nhanh nhưng cần theo dõi rò nội mạch suốt đời, và phẫu thuật mở thay đoạn động mạch chủ bền vững hơn nhưng xâm lấn hơn. Vỡ phình cần mổ cấp cứu ngay.',
  },
];
