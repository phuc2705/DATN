
USE housekeeping_service;

-- ============================================================
-- 0. SERVICES (12 dịch vụ)
-- ============================================================
INSERT IGNORE INTO services (service_name, description, base_price, slug, is_active) VALUES
(
  'Giúp việc theo giờ',
  'Dịch vụ dọn dẹp nhà cửa toàn diện theo khung giờ linh hoạt, thực hiện bởi đội ngũ người giúp việc được đào tạo bài bản và xác minh danh tính kỹ lưỡng. Sử dụng sản phẩm vệ sinh an toàn, thân thiện với trẻ em và thú cưng. Mỗi ca làm việc được ghi lại qua hệ thống check-in/check-out GPS đảm bảo minh bạch và đúng giờ.\n\nBAO GỒM: Lau sàn toàn bộ các phòng; Vệ sinh nhà bếp (bếp, bồn rửa, tủ lạnh ngoài); Lau dọn nhà vệ sinh và phòng tắm; Hút bụi thảm và sofa; Lau kính cửa sổ và gương; Dọn và lau bàn ghế, kệ tủ; Đổ rác và thay túi rác; Quét mạng nhện trần nhà và quạt.\n\nKHÔNG BAO GỒM: Giặt ủi quần áo chuyên sâu, Vệ sinh điều hòa, Vệ sinh kính bên ngoài tòa nhà cao tầng.\n\nLƯU Ý: Đặt tối thiểu 2 giờ/ca. Tăng 20% vào cuối tuần hoặc sau 19h. Phụ phí 30.000 VND/buổi nếu yêu cầu mang theo dụng cụ.',
  60000.00, 'giup-viec-theo-gio', TRUE
),
(
  'Giúp việc định kỳ',
  'Giải pháp tối ưu cho gia đình bận rộn muốn duy trì không gian sống sạch sẽ ổn định. Hệ thống cố định một người giúp việc chuyên nghiệp theo lịch hẹn hàng tuần, đội ngũ nhân sự được kiểm tra hồ sơ lý lịch nghiêm ngặt, tiết kiệm chi phí hơn so với đặt lẻ từng buổi.\n\nBAO GỒM: Toàn bộ công việc của gói dọn dẹp theo giờ; Hỗ trợ gấp quần áo, dọn giường ngủ; Tự động ghi nhớ thói quen sắp đặt đồ đạc; Vệ sinh sâu các khu vực tích tụ bụi theo vòng lặp tuần.\n\nKHÔNG BAO GỒM: Nấu ăn (trừ khi đăng ký thêm), Giặt sấy rèm cửa, Di chuyển đồ đạc nặng trên 15kg.\n\nLƯU Ý: Áp dụng cho khách hàng ký hợp đồng từ 1 tháng trở lên, tần suất tối thiểu 2 buổi/tuần. Giá cố định, không tăng vào cuối tuần.',
  55000.00, 'giup-viec-dinh-ky', TRUE
),
(
  'Nấu ăn gia đình',
  'Thưởng thức những bữa cơm nhà nóng hổi, chuẩn vị và đảm bảo vệ sinh an toàn thực phẩm mà không tốn thời gian vào bếp. Nhân viên sẽ thay bạn lên thực đơn, chuẩn bị nguyên liệu, nấu nướng và dọn dẹp sạch sẽ không gian bếp sau khi hoàn thành. Phù hợp cho ngày bận rộn hoặc các bữa tiệc gia đình nhỏ.\n\nBAO GỒM: Sơ chế nguyên liệu tươi sống sạch sẽ; Nấu các món theo thực đơn yêu cầu (3–4 món cơ bản); Rửa sạch bát đĩa, xoong nồi phát sinh; Lau chùi mặt bếp, bồn rửa và bàn ăn sau khi nấu.\n\nKHÔNG BAO GỒM: Phục vụ rót nước/bưng bê tại bàn như nhà hàng, Tổ chức tiệc quy mô lớn trên 10 người.\n\nLƯU Ý: Đặt tối thiểu 2 giờ/buổi. Giá chưa bao gồm chi phí mua nguyên liệu thực phẩm.',
  70000.00, 'nau-an-gia-dinh', TRUE
),
(
  'Trông trẻ tại nhà',
  'Giải pháp giữ trẻ theo giờ an toàn, tin cậy cho các bậc phụ huynh bận rộn hoặc có việc đột xuất. Đội ngũ bảo mẫu là sinh viên ngành mầm non/điều dưỡng hoặc các cô có kinh nghiệm lâu năm, yêu trẻ, có kỹ năng sơ cứu cơ bản.\n\nBAO GỒM: Chơi cùng bé, đọc truyện, hướng dẫn bé học bài hoặc làm thủ công; Cho bé ăn sữa/ăn dặm/ăn cơm theo khung giờ; Hỗ trợ vệ sinh cá nhân, tắm rửa và thay quần áo; Canh chừng bé ngủ, đảm bảo an toàn tuyệt đối.\n\nKHÔNG BAO GỒM: Làm việc nhà nặng (chỉ dọn đồ chơi của bé), Y tế chuyên sâu (tiêm thuốc), Đưa trẻ ra ngoài khu vực công cộng nếu chưa có sự đồng ý của cha mẹ.\n\nLƯU Ý: Đặt tối thiểu 3 giờ/buổi. Áp dụng cho bé từ 1 tuổi trở lên.',
  70000.00, 'trong-tre-tai-nha', TRUE
),
(
  'Chăm sóc người cao tuổi',
  'San sẻ gánh nặng chăm sóc cha mẹ, ông bà khi bạn không có ở nhà. Nhân viên có sự kiên nhẫn, am hiểu tâm lý người già và được đào tạo kỹ năng điều dưỡng cơ bản, mang lại sự an tâm tuyệt đối cho gia đình.\n\nBAO GỒM: Trò chuyện, dìu người già đi dạo, tập thể dục nhẹ nhàng; Nhắc nhở và hỗ trợ uống thuốc đúng giờ, đúng liều; Hỗ trợ nấu món mềm (cháo, súp), đút cơm cho người yếu; Hỗ trợ vệ sinh cá nhân, thay đồ; Theo dõi huyết áp, đo thân nhiệt cơ bản hàng ngày.\n\nKHÔNG BAO GỒM: Thực hiện thủ thuật y khoa chuyên sâu (đặt ống thông, truyền dịch, tiêm tĩnh mạch), Đứng tên chịu trách nhiệm pháp lý tại bệnh viện.\n\nLƯU Ý: Tính theo giờ hoặc trọn gói ca ngày/đêm 12 tiếng (400.000–600.000 VND). Gia đình cần cung cấp đơn thuốc và tiền sử bệnh lý.',
  75000.00, 'cham-soc-nguoi-cao-tuoi', TRUE
),
(
  'Tổng vệ sinh (Deep Clean)',
  'Dịch vụ làm sạch sâu toàn diện bằng máy móc công nghiệp dành cho nhà mới xây, mới sửa chữa, nhà lâu ngày không dọn hoặc chuẩn bị đón Tết. Thực hiện bởi đội nhóm 2–4 nhân viên cùng trang thiết bị chuyên dụng, đánh bay mọi vết sơn, xi măng, vết ố cứng đầu.\n\nBAO GỒM: Chà sàn bằng máy công nghiệp, tẩy vết sơn dính; Hút bụi và lau sạch sâu toàn bộ ngóc ngách, trần nhà; Tẩy ố kính, tẩy cặn canxi trên vách kính nhà tắm; Vệ sinh hệ thống cửa, khung cửa, ổ điện; Khử mùi toàn bộ căn nhà sau xây dựng.\n\nKHÔNG BAO GỒM: Phun thuốc diệt côn trùng, Giặt nệm/sofa (tính theo combo riêng), Sơn sửa hay dặm vá tường.\n\nLƯU Ý: Tính giá theo diện tích sàn thực tế (m²) hoặc khảo sát trọn gói từ 1.200.000 VND. Đã bao gồm toàn bộ máy móc và hóa chất chuyên dụng.',
  15000.00, 'tong-ve-sinh-deep-clean', TRUE
),
(
  'Vệ sinh Sofa, Nệm & Rèm',
  'Đánh bay bụi mịn, vết ố bẩn và mùi hôi trên chất liệu vải, nỉ, da bằng công nghệ phun hút áp lực hiện đại. Áp dụng phương pháp sấy hơi nước nóng diệt khuẩn đến 99.9% ký sinh trùng, ẩm mốc, bảo vệ sức khỏe hệ hô hấp và làn da cho cả gia đình, đặc biệt nhà có trẻ nhỏ.\n\nBAO GỒM: Hút bụi mịn sâu trên bề mặt và các khe kẽ; Phun hóa chất tẩy ố sinh học an toàn cho sợi vải/da; Đánh tan vết bẩn bằng bàn chải mềm chuyên dụng; Phun hút áp lực tách nước bẩn; Phun hơi nước nóng diệt khuẩn và sấy khô 80–90%.\n\nKHÔNG BAO GỒM: Phục hồi vết rách, xước da, hoặc nhuộm lại màu vải bị phai.\n\nLƯU Ý: Giá tính theo đơn vị (bộ sofa, tấm nệm). Rèm cửa tính theo kg, bao gồm công tháo lắp và mang đi giặt sấy.',
  250000.00, 've-sinh-sofa-nem-rem', TRUE
),
(
  'Vệ sinh Điều hòa',
  'Đảm bảo không khí trong lành, tăng hiệu suất làm lạnh và tiết kiệm đến 30% điện năng tiêu thụ. Dịch vụ bảo dưỡng, xịt rửa điều hòa chuyên nghiệp bởi thợ điện lạnh tay nghề cao, sử dụng bạt hứng nước chuyên dụng không làm bẩn tường hay sàn nhà.\n\nBAO GỒM: Kiểm tra tình trạng hoạt động máy trước khi rửa; Tháo và xịt rửa lưới lọc bụi, vỏ máy bằng vòi áp lực; Xịt rửa giàn lạnh, thông tắc đường ống nước thải; Xịt rửa giàn nóng bên ngoài bằng bơm áp lực; Kiểm tra dòng điện và áp suất gas miễn phí.\n\nKHÔNG BAO GỒM: Sửa chữa bo mạch bị hỏng, Thay block máy, Chi phí giàn giáo nếu cục nóng ở vị trí nguy hiểm.\n\nLƯU Ý: Áp dụng cho máy treo tường 1–2.5 HP. Máy âm trần/áp trần khảo sát báo giá riêng (350.000–500.000 VND). Chưa bao gồm tiền nạp gas nếu máy bị hụt gas.',
  150000.00, 've-sinh-dieu-hoa', TRUE
),
(
  'Vệ sinh Máy giặt & Thiết bị bếp',
  'Loại bỏ hoàn toàn cặn xà phòng, nấm mốc đen bám bên ngoài lồng giặt và dầu mỡ đóng tảng trong máy hút mùi, tủ lạnh. Thợ chuyên kỹ thuật tháo rời toàn bộ linh kiện để cọ rửa sâu, kéo dài tuổi thọ thiết bị và bảo vệ quần áo, thực phẩm của gia đình.\n\nBAO GỒM: Tháo rời lồng máy giặt, dùng vòi áp lực đánh sạch mảng bám; Vệ sinh gioăng cao su, lưới lọc cặn, bồn chứa nước thải; Rã đông, lau chùi khử khuẩn các khay ngăn bên trong tủ lạnh; Tháo vỉ lọc, tẩy sạch dầu mỡ tích tụ trong máy hút mùi.\n\nKHÔNG BAO GỒM: Thay thế linh kiện hỏng, Sửa chữa lỗi bo mạch điện tử, Di dời vị trí lắp đặt thiết bị.\n\nLƯU Ý: Máy giặt lồng đứng (250k), lồng ngang (400k–450k). Thiết bị bếp tính lẻ theo chiếc.',
  250000.00, 've-sinh-may-giat-thiet-bi-bep', TRUE
),
(
  'Chăm sóc Thú cưng',
  'Dịch vụ "Pet Sitting" hoàn hảo khi bạn đi du lịch, công tác hoặc bận rộn cả ngày. Nhân viên yêu động vật đến tận nhà chăm sóc chó, mèo, đảm bảo các bé được ăn uống đúng giờ, không gian sống sạch sẽ và không bị cô đơn khi chủ vắng nhà.\n\nBAO GỒM: Cho thú cưng ăn, uống nước theo đúng định lượng và giờ giấc; Dọn dẹp khay cát (mèo), lau dọn khu vực vệ sinh của chó; Chải lông, chơi đùa với các bé để giảm stress; Dắt chó đi dạo (nếu yêu cầu ca 2 tiếng trở lên); Chụp ảnh, quay video báo cáo tình hình cho chủ mỗi ca.\n\nKHÔNG BAO GỒM: Tắm rửa cắt tỉa lông (Grooming chuyên nghiệp), Chữa bệnh hoặc tiêm vaccine tại nhà.\n\nLƯU Ý: Khách hàng cần chuẩn bị sẵn thức ăn, cát vệ sinh và dụng cụ riêng. Thú cưng không có bệnh truyền nhiễm hoặc tiền sử cắn người nguy hiểm.',
  65000.00, 'cham-soc-thu-cung', TRUE
),
(
  'Vệ sinh Văn phòng & Shop',
  'Duy trì không gian làm việc sạch sẽ, chuyên nghiệp để nâng cao hiệu suất nhân viên và tạo ấn tượng tốt với đối tác, khách hàng. Phù hợp cho văn phòng vừa và nhỏ, cửa hàng bán lẻ, showroom cần dọn dẹp định kỳ ngoài giờ làm việc hoặc hàng ngày.\n\nBAO GỒM: Quét và lau sàn toàn bộ khu vực làm việc, sảnh đón khách; Lau bụi bàn làm việc, tủ tài liệu, máy in, máy tính bên ngoài; Thu gom rác tại các bàn làm việc, thay túi rác mới và tập kết đúng nơi; Vệ sinh khu vực WC chung; Lau chùi khu vực Pantry (bồn rửa chén của nhân viên).\n\nKHÔNG BAO GỒM: Lau kính mặt ngoài tòa nhà cao tầng bằng dây đu, Sắp xếp lại tài liệu mật trên bàn làm việc.\n\nLƯU Ý: Có thể tính theo diện tích hoặc ký hợp đồng khoán theo giờ cố định hàng tháng. Thường thực hiện sáng sớm hoặc buổi tối sau khi đóng cửa.',
  12000.00, 've-sinh-van-phong-shop', TRUE
),
(
  'Phun khử khuẩn & Kiểm soát côn trùng',
  'Bảo vệ gia đình khỏi mầm bệnh truyền nhiễm và sự phiền toái từ côn trùng (muỗi, gián, kiến, mối). Sử dụng máy phun sương hạt siêu nhỏ (ULV) kết hợp thuốc sinh học nhập khẩu được Bộ Y Tế cấp phép, diệt tận gốc nhưng tuyệt đối an toàn cho người và vật nuôi.\n\nBAO GỒM: Che phủ bảo vệ giường chiếu, đồ ăn, bể cá trước khi phun; Phun tồn lưu dọc tường, khe kẽ, gầm tủ để diệt kiến, gián, mối; Phun không gian (sương mù) toàn bộ các phòng để diệt muỗi; Phun khử khuẩn Nano bạc toàn bộ bề mặt (nếu chọn gói combo); Bảo hành dịch vụ 1–3 tháng tùy khu vực.\n\nKHÔNG BAO GỒM: Đào hào chống mối cho móng nhà công trình lớn, Thu dọn xác chuột chết ẩn trong trần thạch cao.\n\nLƯU Ý: Diện tích phun tối thiểu từ 50m² trở lên. Sau khi phun, di tản khỏi nhà tối thiểu 1–2 tiếng.',
  5000.00, 'phun-khu-khuan-con-trung', TRUE
);

-- ============================================================
-- 1. USERS (25 users: 1 admin, 4 customers, 20 helpers)
-- Mật khẩu mẫu: "123456" -> hash bcrypt
INSERT INTO users (email, password_hash, full_name, phone, user_type, avatar_url, is_active) VALUES
-- Admin
('admin@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Quản Trị Viên', '0901234567', 'admin', 'https://via.placeholder.com/150', TRUE),

-- Customers (4)
('nguyenvanbay@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Nguyễn Văn Bảy', '0912345678', 'customer', 'https://via.placeholder.com/150', TRUE),
('tranthitoan@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Trần Thị Toán', '0923456789', 'customer', 'https://via.placeholder.com/150', TRUE),
('ngoquangnguyen@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Ngô Quang Nguyện', '0934567890', 'customer', 'https://via.placeholder.com/150', TRUE),
('phamthiqgiang@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Phạm Thị Quỳnh Giang', '0945678901', 'customer', 'https://via.placeholder.com/150', TRUE),

-- Helpers (12)
('nguyenthimai@gmail.com',      '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Nguyễn Thị Mai',       '0956789012', 'helper', '/avatars/helper-1.svg',  TRUE),
('tranthilan@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Trần Thị Lan',         '0967890123', 'helper', '/avatars/helper-2.svg',  TRUE),
('lethihuong@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Lê Thị Hương',         '0978901234', 'helper', '/avatars/helper-3.svg',  TRUE),
('phamthinga@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Phạm Thị Nga',         '0989012345', 'helper', '/avatars/helper-4.svg',  TRUE),
('hoangthily@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Hoàng Thị Ly',         '0990123456', 'helper', '/avatars/helper-5.svg',  TRUE),
('vuthithanh@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Vũ Thị Thanh',         '0901234568', 'helper', '/avatars/helper-6.svg',  TRUE),
('dothihoa@gmail.com',          '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Đỗ Thị Hoa',           '0912345679', 'helper', '/avatars/helper-7.svg',  TRUE),
('buithilinh@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Bùi Thị Linh',         '0923456780', 'helper', '/avatars/helper-8.svg',  TRUE),
('duongthiphuong@gmail.com',    '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Dương Thị Phương',     '0934567891', 'helper', '/avatars/helper-9.svg',  TRUE),
('ngothithao@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Ngô Thị Thảo',         '0945678902', 'helper', '/avatars/helper-10.svg', TRUE),
('dangthituyet@gmail.com',      '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Đặng Thị Tuyết',       '0956789013', 'helper', '/avatars/helper-11.svg', TRUE),
('dinhthuha@gmail.com',         '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Đinh Thị Thu Hà',      '0967890124', 'helper', '/avatars/helper-12.svg', TRUE),

-- Helpers mới (user_id 18–25)
('lythibichngoc@gmail.com',    '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Lý Thị Bích Ngọc',     '0971234501', 'helper', '/avatars/helper-13.svg', TRUE),
('trinhthiminhchau@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Trịnh Thị Minh Châu',  '0982345602', 'helper', '/avatars/helper-14.svg', TRUE),
('caothithuthuy@gmail.com',    '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Cao Thị Thu Thủy',     '0993456703', 'helper', '/avatars/helper-15.svg', TRUE),
('luuthihongnhung@gmail.com',  '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Lưu Thị Hồng Nhung',   '0904567804', 'helper', '/avatars/helper-16.svg', TRUE),
('phungthidieulinh@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Phùng Thị Diệu Linh',  '0915678905', 'helper', '/avatars/helper-17.svg', TRUE),
('tothibaotran@gmail.com',     '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Tô Thị Bảo Trân',      '0926789006', 'helper', '/avatars/helper-18.svg', TRUE),
('quachthimyduyen@gmail.com',  '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Quách Thị Mỹ Duyên',   '0937890107', 'helper', '/avatars/helper-19.svg', TRUE),
('macthihaiyen@gmail.com',     '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Mạc Thị Hải Yến',      '0948901208', 'helper', '/avatars/helper-20.svg', TRUE);

-- 2. CUSTOMERS

INSERT INTO customers (user_id, address, district, city, preferred_payment, loyalty_points) VALUES
(2, '123 Nguyễn Trãi, Phường Thượng Đình', 'Thanh Xuân', 'Hà Nội', 'cash', 100),
(3, '456 Trần Duy Hưng, Phường Trung Hòa', 'Cầu Giấy', 'Hà Nội', 'e_wallet', 50),
(4, '789 Láng Hạ, Phường Thành Công', 'Ba Đình', 'Hà Nội', 'bank_transfer', 200),
(5, '321 Giải Phóng, Phường Bách Khoa', 'Hai Bà Trưng', 'Hà Nội', 'cash', 0);

-- 3. HELPERS (20 người giúp việc tại Hà Nội)

INSERT INTO helpers (user_id, date_of_birth, gender, id_card_number, address, experience_years, rating_average, total_bookings, hourly_rate, is_verified, is_available, bio) VALUES
(6, '1990-05-15', 'female', '001090001234', '45 Hàng Bài, P. Tràng Tiền, Hoàn Kiếm, Hà Nội', 5, 4.80, 120, 70000.00, TRUE, TRUE, 'Tôi có 5 năm kinh nghiệm làm việc nhà, chuyên dọn dẹp và nấu ăn. Tận tâm và chu đáo.'),
(7, '1992-08-20', 'female', '001092002345', '78 Giảng Võ, P. Giảng Võ, Ba Đình, Hà Nội', 3, 4.50, 80, 65000.00, TRUE, TRUE, 'Tôi giỏi giặt ủi và chăm sóc trẻ em. Yêu trẻ con và rất kiên nhẫn.'),
(8, '1988-03-10', 'female', '001088003456', '123 Láng Hạ, P. Láng Hạ, Đống Đa, Hà Nội', 7, 4.90, 200, 80000.00, TRUE, TRUE, 'Chuyên gia dọn dẹp với 7 năm kinh nghiệm. Đảm bảo nhà sạch sẽ như mới.'),
(9, '1995-11-25', 'female', '001095004567', '56 Tôn Đức Thắng, P. Quốc Tử Giám, Đống Đa, Hà Nội', 2, 4.20, 45, 60000.00, TRUE, TRUE, 'Mới bắt đầu nhưng rất nhiệt tình. Học hỏi nhanh và làm việc chăm chỉ.'),
(10, '1985-07-30', 'female', '001085005678', '234 Nguyễn Chí Thanh, P. Láng Thượng, Đống Đa, Hà Nội', 8, 4.75, 180, 75000.00, TRUE, TRUE, 'Có 8 năm kinh nghiệm dọn dẹp và nấu ăn. Làm việc nhanh gọn và sạch sẽ.'),
(11, '1993-06-12', 'female', '001093006789', '89 Láng Hạ, P. Thành Công, Ba Đình, Hà Nội', 4, 4.60, 95, 68000.00, TRUE, TRUE, 'Tôi chuyên về giặt ủi và dọn dẹp nhà cửa. Luôn tận tâm với công việc.'),
(12, '1991-09-18', 'female', '001091007890', '167 Tây Sơn, P. Quang Trung, Đống Đa, Hà Nội', 6, 4.85, 150, 72000.00, TRUE, TRUE, 'Chuyên nấu ăn và dọn dẹp. Có thể nấu nhiều món ăn gia đình ngon.'),
(13, '1994-12-05', 'female', '001094008901', '45 Chùa Bộc, P. Quang Trung, Đống Đa, Hà Nội', 3, 4.40, 65, 63000.00, TRUE, TRUE, 'Tôi giỏi chăm sóc trẻ em và người già. Kiên nhẫn và tận tình.'),
(14, '1989-04-22', 'female', '001089009012', '78 Trần Duy Hưng, P. Trung Hòa, Cầu Giấy, Hà Nội', 7, 4.88, 190, 78000.00, TRUE, TRUE, 'Chuyên gia vệ sinh công nghiệp và dọn dẹp nhà cửa. Làm việc chuyên nghiệp.'),
(15, '1996-01-30', 'female', '001096010123', '123 Hoàng Quốc Việt, P. Nghĩa Đô, Cầu Giấy, Hà Nội', 2, 4.30, 40, 62000.00, TRUE, TRUE, 'Mới vào nghề nhưng rất cố gắng. Học hỏi nhanh và làm việc chăm chỉ.'),
(16, '1987-11-08', 'female', '001087011234', '234 Phạm Văn Đồng, P. Cổ Nhuế, Bắc Từ Liêm, Hà Nội', 9, 4.92, 220, 82000.00, TRUE, TRUE, 'Có 9 năm kinh nghiệm trong nghề. Chuyên tất cả các loại công việc nhà. Rất được khách hàng tin tưởng.'),
(17, '1986-03-25', 'female', '001086012345', '56 Nguyễn Văn Cừ, P. Gia Thụy, Long Biên, Hà Nội',              10, 4.95, 250, 85000.00, TRUE, TRUE, 'Thợ chuyên nghiệp với 10 năm kinh nghiệm. Chuyên vệ sinh công nghiệp, chăm sóc người già và sửa chữa nhỏ trong nhà.'),

-- Helpers mới (helper_id 13–20, user_id 18–25)
(18, '1993-07-14', 'female', '001093013456', '12 Nguyễn Tam Trinh, P. Hoàng Văn Thụ, Hoàng Mai, Hà Nội',     4, 4.55, 90,  66000.00, TRUE, TRUE, 'Chăm chỉ, cẩn thận trong từng công việc. Chuyên dọn dẹp và giặt ủi, luôn hoàn thành đúng giờ.'),
(19, '1990-02-28', 'female', '001090014567', '34 Trường Chinh, P. Phương Liệt, Thanh Xuân, Hà Nội',          6, 4.70, 140, 73000.00, TRUE, TRUE, 'Giàu kinh nghiệm nấu ăn gia đình. Có thể nấu nhiều món miền Bắc, miền Trung theo yêu cầu.'),
(20, '1997-05-09', 'female', '001097015678', '78 Thụy Khuê, P. Thụy Khuê, Tây Hồ, Hà Nội',                  3, 4.35, 60,  62000.00, TRUE, TRUE, 'Trẻ trung, năng động. Giỏi chăm sóc trẻ nhỏ và làm việc nhà. Thân thiện và được các gia đình tin tưởng.'),
(21, '1988-11-17', 'female', '001088016789', '90 Lê Văn Lương, P. Nhân Chính, Nam Từ Liêm, Hà Nội',          8, 4.82, 175, 77000.00, TRUE, TRUE, 'Chuyên vệ sinh công nghiệp và dọn dẹp tổng thể. Từng làm việc cho nhiều công ty dịch vụ lớn tại Hà Nội.'),
(22, '1992-04-03', 'female', '001092017890', '15 Quang Trung, P. Quang Trung, Hà Đông, Hà Nội',              5, 4.65, 110, 69000.00, TRUE, TRUE, 'Kinh nghiệm 5 năm chăm sóc người già và làm việc nhà. Nhẹ nhàng, kiên nhẫn và tận tụy với công việc.'),
(23, '1995-08-22', 'female', '001095018901', '23 Ngọc Hồi, P. Hoàng Liệt, Thanh Trì, Hà Nội',               3, 4.45, 70,  64000.00, TRUE, TRUE, 'Siêng năng, trung thực. Có kinh nghiệm dọn dẹp và nấu ăn cho hộ gia đình. Sẵn sàng làm thêm giờ khi cần.'),
(24, '1991-01-30', 'female', '001091019012', '67 Ngô Gia Tự, P. Đức Giang, Gia Lâm, Hà Nội',                 6, 4.78, 130, 74000.00, TRUE, TRUE, 'Chuyên giặt ủi và dọn dẹp nhà cửa. Làm việc tỉ mỉ, gọn gàng. Đã phục vụ nhiều gia đình lâu dài.'),
(25, '1989-09-11', 'female', '001089020123', '101 Xuân Nộn, TT. Đông Anh, Đông Anh, Hà Nội',                 7, 4.88, 165, 79000.00, TRUE, TRUE, 'Nhiều năm kinh nghiệm trong nghề. Chuyên dọn dẹp, nấu ăn và chăm sóc trẻ. Được nhiều gia đình đặt lịch định kỳ.');

-- 4. HELPER_SERVICES (Liên kết helper với service)

INSERT INTO helper_services (helper_id, service_id, experience_level, custom_price) VALUES
-- Helper 1 (Nguyễn Thị Mai)
(1, 1, 'expert', NULL),      -- Dọn dẹp
(1, 2, 'intermediate', NULL), -- Giặt ủi
(1, 3, 'expert', NULL),      -- Nấu ăn

-- Helper 2 (Trần Thị Lan)
(2, 1, 'intermediate', NULL), -- Dọn dẹp
(2, 2, 'expert', NULL),      -- Giặt ủi
(2, 4, 'intermediate', NULL), -- Chăm sóc trẻ

-- Helper 3 (Lê Thị Hương)
(3, 1, 'expert', NULL),      -- Dọn dẹp
(3, 6, 'expert', NULL),      -- Vệ sinh công nghiệp

-- Helper 4 (Phạm Thị Nga)
(4, 1, 'beginner', NULL),    -- Dọn dẹp
(4, 2, 'beginner', NULL),    -- Giặt ủi
(4, 3, 'intermediate', NULL), -- Nấu ăn

-- Helper 5 (Hoàng Thị Ly)
(5, 1, 'expert', NULL),      -- Dọn dẹp
(5, 2, 'intermediate', NULL), -- Giặt ủi
(5, 3, 'expert', NULL),      -- Nấu ăn

-- Helper 6 (Vũ Thị Thanh)
(6, 1, 'intermediate', NULL), -- Dọn dẹp
(6, 2, 'expert', NULL),      -- Giặt ủi
(6, 4, 'beginner', NULL),    -- Chăm sóc trẻ

-- Helper 7 (Đỗ Thị Hoa)
(7, 1, 'expert', NULL),      -- Dọn dẹp
(7, 3, 'expert', NULL),      -- Nấu ăn
(7, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 8 (Bùi Thị Linh)
(8, 4, 'intermediate', NULL), -- Chăm sóc trẻ
(8, 5, 'beginner', NULL),    -- Chăm sóc người già
(8, 1, 'beginner', NULL),    -- Dọn dẹp

-- Helper 9 (Dương Thị Phương)
(9, 1, 'expert', NULL),      -- Dọn dẹp
(9, 6, 'expert', NULL),      -- Vệ sinh công nghiệp
(9, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 10 (Ngô Thị Thảo)
(10, 1, 'beginner', NULL),   -- Dọn dẹp
(10, 2, 'beginner', NULL),   -- Giặt ủi
(10, 4, 'beginner', NULL),   -- Chăm sóc trẻ

-- Helper 11 (Đặng Thị Tuyết)
(11, 1, 'expert', NULL),     -- Dọn dẹp
(11, 3, 'expert', NULL),     -- Nấu ăn
(11, 5, 'intermediate', NULL), -- Chăm sóc người già

-- Helper 12 (Đinh Thị Thu Hà)
(12, 5, 'expert', NULL),     -- Chăm sóc người già
(12, 6, 'expert', NULL),     -- Vệ sinh công nghiệp
(12, 1, 'expert', NULL),     -- Dọn dẹp

-- Helper 13 (Lý Thị Bích Ngọc) — Hoàng Mai
(13, 1, 'intermediate', NULL), -- Dọn dẹp
(13, 2, 'expert', NULL),       -- Giặt ủi
(13, 3, 'intermediate', NULL), -- Nấu ăn

-- Helper 14 (Trịnh Thị Minh Châu) — Đống Đa
(14, 3, 'expert', NULL),       -- Nấu ăn
(14, 1, 'expert', NULL),       -- Dọn dẹp
(14, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 15 (Cao Thị Thu Thủy) — Tây Hồ
(15, 4, 'intermediate', NULL), -- Chăm sóc trẻ
(15, 1, 'beginner', NULL),     -- Dọn dẹp
(15, 2, 'beginner', NULL),     -- Giặt ủi

-- Helper 16 (Lưu Thị Hồng Nhung) — Nam Từ Liêm
(16, 6, 'expert', NULL),       -- Vệ sinh công nghiệp
(16, 1, 'expert', NULL),       -- Dọn dẹp
(16, 2, 'expert', NULL),       -- Giặt ủi

-- Helper 17 (Phùng Thị Diệu Linh) — Hà Đông
(17, 5, 'expert', NULL),       -- Chăm sóc người già
(17, 1, 'intermediate', NULL), -- Dọn dẹp
(17, 3, 'intermediate', NULL), -- Nấu ăn

-- Helper 18 (Tô Thị Bảo Trân) — Thanh Trì
(18, 1, 'intermediate', NULL), -- Dọn dẹp
(18, 3, 'beginner', NULL),     -- Nấu ăn
(18, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 19 (Quách Thị Mỹ Duyên) — Gia Lâm
(19, 2, 'expert', NULL),       -- Giặt ủi
(19, 1, 'expert', NULL),       -- Dọn dẹp
(19, 4, 'beginner', NULL),     -- Chăm sóc trẻ

-- Helper 20 (Mạc Thị Hải Yến) — Đông Anh
(20, 1, 'expert', NULL),       -- Dọn dẹp
(20, 3, 'expert', NULL),       -- Nấu ăn
(20, 4, 'intermediate', NULL); -- Chăm sóc trẻ

-- 5. SCHEDULES (Lịch làm việc của 12 helpers)

INSERT INTO schedules (helper_id, day_of_week, start_time, end_time, is_available) VALUES
-- Helper 1 (Nguyễn Thị Mai): Làm từ Thứ 2 đến Thứ 6
(1, 'monday', '08:00:00', '17:00:00', TRUE),
(1, 'tuesday', '08:00:00', '17:00:00', TRUE),
(1, 'wednesday', '08:00:00', '17:00:00', TRUE),
(1, 'thursday', '08:00:00', '17:00:00', TRUE),
(1, 'friday', '08:00:00', '17:00:00', TRUE),

-- Helper 2 (Trần Thị Lan): Làm cả tuần
(2, 'monday', '07:00:00', '18:00:00', TRUE),
(2, 'tuesday', '07:00:00', '18:00:00', TRUE),
(2, 'wednesday', '07:00:00', '18:00:00', TRUE),
(2, 'thursday', '07:00:00', '18:00:00', TRUE),
(2, 'friday', '07:00:00', '18:00:00', TRUE),
(2, 'saturday', '08:00:00', '16:00:00', TRUE),
(2, 'sunday', '08:00:00', '16:00:00', TRUE),

-- Helper 3 (Lê Thị Hương): Làm Thứ 2, 4, 6
(3, 'monday', '09:00:00', '18:00:00', TRUE),
(3, 'wednesday', '09:00:00', '18:00:00', TRUE),
(3, 'friday', '09:00:00', '18:00:00', TRUE),

-- Helper 4 (Phạm Thị Nga): Làm buổi sáng Thứ 2-6
(4, 'monday', '06:00:00', '12:00:00', TRUE),
(4, 'tuesday', '06:00:00', '12:00:00', TRUE),
(4, 'wednesday', '06:00:00', '12:00:00', TRUE),
(4, 'thursday', '06:00:00', '12:00:00', TRUE),
(4, 'friday', '06:00:00', '12:00:00', TRUE),

-- Helper 5 (Hoàng Thị Ly): Làm Thứ 2-6
(5, 'monday', '08:00:00', '17:00:00', TRUE),
(5, 'tuesday', '08:00:00', '17:00:00', TRUE),
(5, 'wednesday', '08:00:00', '17:00:00', TRUE),
(5, 'thursday', '08:00:00', '17:00:00', TRUE),
(5, 'friday', '08:00:00', '17:00:00', TRUE),

-- Helper 6 (Vũ Thị Thanh): Làm Thứ 3, 5, 7
(6, 'tuesday', '08:00:00', '17:00:00', TRUE),
(6, 'thursday', '08:00:00', '17:00:00', TRUE),
(6, 'saturday', '08:00:00', '17:00:00', TRUE),

-- Helper 7 (Đỗ Thị Hoa): Làm cả tuần
(7, 'monday', '07:30:00', '17:30:00', TRUE),
(7, 'tuesday', '07:30:00', '17:30:00', TRUE),
(7, 'wednesday', '07:30:00', '17:30:00', TRUE),
(7, 'thursday', '07:30:00', '17:30:00', TRUE),
(7, 'friday', '07:30:00', '17:30:00', TRUE),
(7, 'saturday', '09:00:00', '15:00:00', TRUE),
(7, 'sunday', '09:00:00', '15:00:00', TRUE),

-- Helper 8 (Bùi Thị Linh): Làm buổi chiều Thứ 2-6
(8, 'monday', '13:00:00', '19:00:00', TRUE),
(8, 'tuesday', '13:00:00', '19:00:00', TRUE),
(8, 'wednesday', '13:00:00', '19:00:00', TRUE),
(8, 'thursday', '13:00:00', '19:00:00', TRUE),
(8, 'friday', '13:00:00', '19:00:00', TRUE),

-- Helper 9 (Dương Thị Phương): Làm Thứ 2-6
(9, 'monday', '08:00:00', '18:00:00', TRUE),
(9, 'tuesday', '08:00:00', '18:00:00', TRUE),
(9, 'wednesday', '08:00:00', '18:00:00', TRUE),
(9, 'thursday', '08:00:00', '18:00:00', TRUE),
(9, 'friday', '08:00:00', '18:00:00', TRUE),

-- Helper 10 (Ngô Thị Thảo): Làm cuối tuần
(10, 'saturday', '08:00:00', '18:00:00', TRUE),
(10, 'sunday', '08:00:00', '18:00:00', TRUE),

-- Helper 11 (Đặng Thị Tuyết): Làm Thứ 2-6
(11, 'monday', '09:00:00', '17:00:00', TRUE),
(11, 'tuesday', '09:00:00', '17:00:00', TRUE),
(11, 'wednesday', '09:00:00', '17:00:00', TRUE),
(11, 'thursday', '09:00:00', '17:00:00', TRUE),
(11, 'friday', '09:00:00', '17:00:00', TRUE),

-- Helper 12 (Đinh Thị Thu Hà): Làm cả tuần
(12, 'monday', '06:00:00', '18:00:00', TRUE),
(12, 'tuesday', '06:00:00', '18:00:00', TRUE),
(12, 'wednesday', '06:00:00', '18:00:00', TRUE),
(12, 'thursday', '06:00:00', '18:00:00', TRUE),
(12, 'friday', '06:00:00', '18:00:00', TRUE),
(12, 'saturday', '07:00:00', '17:00:00', TRUE),
(12, 'sunday', '07:00:00', '17:00:00', TRUE),

-- Helper 13 (Lý Thị Bích Ngọc): Thứ 2–6
(13, 'monday', '08:00:00', '17:00:00', TRUE),
(13, 'tuesday', '08:00:00', '17:00:00', TRUE),
(13, 'wednesday', '08:00:00', '17:00:00', TRUE),
(13, 'thursday', '08:00:00', '17:00:00', TRUE),
(13, 'friday', '08:00:00', '17:00:00', TRUE),

-- Helper 14 (Trịnh Thị Minh Châu): Cả tuần
(14, 'monday', '07:00:00', '18:00:00', TRUE),
(14, 'tuesday', '07:00:00', '18:00:00', TRUE),
(14, 'wednesday', '07:00:00', '18:00:00', TRUE),
(14, 'thursday', '07:00:00', '18:00:00', TRUE),
(14, 'friday', '07:00:00', '18:00:00', TRUE),
(14, 'saturday', '08:00:00', '16:00:00', TRUE),
(14, 'sunday', '08:00:00', '16:00:00', TRUE),

-- Helper 15 (Cao Thị Thu Thủy): Thứ 2, 4, 6, 7
(15, 'monday', '09:00:00', '17:00:00', TRUE),
(15, 'wednesday', '09:00:00', '17:00:00', TRUE),
(15, 'friday', '09:00:00', '17:00:00', TRUE),
(15, 'saturday', '09:00:00', '17:00:00', TRUE),

-- Helper 16 (Lưu Thị Hồng Nhung): Thứ 2–6
(16, 'monday', '07:30:00', '17:30:00', TRUE),
(16, 'tuesday', '07:30:00', '17:30:00', TRUE),
(16, 'wednesday', '07:30:00', '17:30:00', TRUE),
(16, 'thursday', '07:30:00', '17:30:00', TRUE),
(16, 'friday', '07:30:00', '17:30:00', TRUE),

-- Helper 17 (Phùng Thị Diệu Linh): Thứ 2–6 buổi sáng
(17, 'monday', '06:00:00', '12:00:00', TRUE),
(17, 'tuesday', '06:00:00', '12:00:00', TRUE),
(17, 'wednesday', '06:00:00', '12:00:00', TRUE),
(17, 'thursday', '06:00:00', '12:00:00', TRUE),
(17, 'friday', '06:00:00', '12:00:00', TRUE),

-- Helper 18 (Tô Thị Bảo Trân): Thứ 3, 5, 7
(18, 'tuesday', '08:00:00', '17:00:00', TRUE),
(18, 'thursday', '08:00:00', '17:00:00', TRUE),
(18, 'saturday', '08:00:00', '17:00:00', TRUE),

-- Helper 19 (Quách Thị Mỹ Duyên): Thứ 2–6
(19, 'monday', '08:00:00', '18:00:00', TRUE),
(19, 'tuesday', '08:00:00', '18:00:00', TRUE),
(19, 'wednesday', '08:00:00', '18:00:00', TRUE),
(19, 'thursday', '08:00:00', '18:00:00', TRUE),
(19, 'friday', '08:00:00', '18:00:00', TRUE),

-- Helper 20 (Mạc Thị Hải Yến): Cả tuần
(20, 'monday', '06:00:00', '18:00:00', TRUE),
(20, 'tuesday', '06:00:00', '18:00:00', TRUE),
(20, 'wednesday', '06:00:00', '18:00:00', TRUE),
(20, 'thursday', '06:00:00', '18:00:00', TRUE),
(20, 'friday', '06:00:00', '18:00:00', TRUE),
(20, 'saturday', '07:00:00', '17:00:00', TRUE),
(20, 'sunday', '07:00:00', '17:00:00', TRUE);

-- 6. BOOKINGS (Lịch sử đặt dịch vụ)

INSERT INTO bookings (customer_id, helper_id, service_id, booking_date, start_time, end_time, hours, address, base_price, total_price, status, note) VALUES
-- Completed bookings (để test reviews)
(1, 1, 1, '2026-01-15', '09:00:00', '12:00:00', 3.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội', 360000.00, 360000.00, 'completed', 'Dọn dẹp nhà cửa tổng quát'),
(1, 2, 2, '2026-01-20', '14:00:00', '17:00:00', 3.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội', 315000.00, 315000.00, 'completed', 'Giặt ủi quần áo'),
(2, 3, 1, '2026-01-25', '08:00:00', '12:00:00', 4.00, '456 Trần Duy Hưng, P. Trung Hòa, Cầu Giấy, Hà Nội',  520000.00, 520000.00, 'completed', 'Dọn dẹp sau sửa nhà'),

-- In progress bookings
(3, 1, 3, '2026-03-12', '10:00:00', '13:00:00', 3.00, '789 Láng Hạ, P. Thành Công, Ba Đình, Hà Nội',         390000.00, 390000.00, 'in_progress', 'Nấu cơm trưa'),
(4, 2, 1, '2026-03-12', '14:00:00', '16:00:00', 2.00, '321 Giải Phóng, P. Bách Khoa, Hai Bà Trưng, Hà Nội',  230000.00, 230000.00, 'in_progress', 'Dọn dẹp nhanh'),

-- Confirmed bookings (sắp diễn ra)
(1, 3, 6, '2026-03-15', '09:00:00', '17:00:00', 8.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội',1080000.00,1080000.00, 'confirmed', 'Vệ sinh tổng thể căn hộ'),
(2, 1, 1, '2026-03-17', '08:00:00', '11:00:00', 3.00, '456 Trần Duy Hưng, P. Trung Hòa, Cầu Giấy, Hà Nội',  360000.00, 360000.00, 'confirmed', 'Dọn dẹp hàng tuần'),

-- Pending bookings (chờ xác nhận)
(3, 4, 3, '2026-03-20', '11:00:00', '14:00:00', 3.00, '789 Láng Hạ, P. Thành Công, Ba Đình, Hà Nội',         360000.00, 360000.00, 'pending', 'Nấu ăn cho gia đình'),
(4, 2, 4, '2026-03-25', '08:00:00', '18:00:00', 10.00,'321 Giải Phóng, P. Bách Khoa, Hai Bà Trưng, Hà Nội', 1350000.00,1350000.00, 'pending', 'Chăm sóc trẻ cả ngày'),

-- Cancelled booking
(1, 1, 1, '2026-01-30', '09:00:00', '12:00:00', 3.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội', 360000.00, 360000.00, 'cancelled', 'Khách hủy do có việc gấp');

-- 7. PAYMENTS (Tự động tạo qua trigger, nhưng update status)

-- Cập nhật payment status cho completed bookings
UPDATE payments SET payment_status = 'paid', paid_at = '2026-01-15 12:30:00' WHERE booking_id = 1;
UPDATE payments SET payment_status = 'paid', paid_at = '2026-01-20 17:30:00' WHERE booking_id = 2;
UPDATE payments SET payment_status = 'paid', paid_at = '2026-01-25 12:30:00' WHERE booking_id = 3;

-- In progress bookings: chưa thanh toán
-- booking_id 4, 5: payment_status = 'unpaid'

-- Confirmed bookings: chưa thanh toán
-- booking_id 6, 7: payment_status = 'unpaid'

-- Pending bookings: chưa thanh toán
-- booking_id 8, 9: payment_status = 'unpaid'

-- Cancelled booking: refund
UPDATE payments SET payment_status = 'refunded' WHERE booking_id = 10;

-- 8. REVIEWS (Chỉ review cho completed bookings)

INSERT INTO reviews (booking_id, customer_id, helper_id, rating, comment) VALUES
(1, 1, 1, 5, 'Chị Mai làm việc rất sạch sẽ và nhanh gọn. Tôi rất hài lòng!'),
(2, 1, 2, 4, 'Chị Lan giặt ủi khá tốt, tuy nhiên hơi lâu một chút.'),
(3, 2, 3, 5, 'Chị Hương làm việc chuyên nghiệp, nhà sạch bong như mới. Sẽ book lại!');

-- Cập nhật is_reviewed cho bookings đã đánh giá
UPDATE bookings SET is_reviewed = TRUE WHERE booking_id IN (1, 2, 3);

-- Trigger sẽ tự động cập nhật rating_average của helpers

-- KIỂM TRA DỮ LIỆU

-- Xem tổng số records (kỳ vọng: 25 users, 4 customers, 20 helpers, 6 services, 10 bookings, 3 reviews)
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT COUNT(*) FROM helpers) AS total_helpers,
    (SELECT COUNT(*) FROM services) AS total_services,
    (SELECT COUNT(*) FROM bookings) AS total_bookings,
    (SELECT COUNT(*) FROM reviews) AS total_reviews;

-- Xem danh sách helpers với rating
SELECT * FROM view_helpers_full ORDER BY rating_average DESC;

-- Xem danh sách bookings
SELECT * FROM view_bookings_detail ORDER BY booking_date DESC;

-- Xem thống kê helpers
SELECT * FROM view_helper_statistics ORDER BY rating_average DESC;

-- TEST STORED PROCEDURES

-- Test 1: Tính giá booking
-- Helper 1 (70k/h) + Service 1 (50k/h) × 3h = 360k
CALL calculate_booking_price(1, 1, 3, @price);
SELECT @price AS calculated_price;

-- Test 2: Kiểm tra availability
-- Helper 1 có available vào ngày 2026-02-20 từ 9h-12h không?
CALL check_helper_availability(1, '2026-02-20', '09:00:00', '12:00:00', @available);
SELECT @available AS is_helper_available;

-- Test 3: Kiểm tra conflict
-- Helper 1 đã có booking vào 2026-02-08, kiểm tra xem có conflict không
CALL check_helper_availability(1, '2026-02-08', '09:00:00', '12:00:00', @available);
SELECT @available AS has_conflict;

SELECT 'Dữ liệu mẫu đã được thêm thành công!' AS message;
