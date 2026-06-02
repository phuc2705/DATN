-- ============================================================
-- MIGRATION: Cập nhật 12 dịch vụ đầy đủ
-- Chạy trên production DB sau khi deploy
-- Lưu ý: UPDATE service_id 1-6 (giữ nguyên ID để không mất FK bookings)
--        INSERT service_id 7-12 (mới)
-- ============================================================

USE housekeeping_service;

-- ── Cập nhật 6 dịch vụ hiện có (giữ nguyên service_id) ─────────────────────

UPDATE services SET
  service_name = 'Giúp việc theo giờ',
  description  = 'Dịch vụ dọn dẹp nhà cửa toàn diện theo khung giờ linh hoạt, thực hiện bởi đội ngũ người giúp việc được đào tạo bài bản và xác minh danh tính kỹ lưỡng. Sử dụng sản phẩm vệ sinh an toàn, thân thiện với trẻ em và thú cưng. Mỗi ca làm việc được ghi lại qua hệ thống check-in/check-out GPS đảm bảo minh bạch và đúng giờ.\n\nBAO GỒM: Lau sàn toàn bộ các phòng; Vệ sinh nhà bếp (bếp, bồn rửa, tủ lạnh ngoài); Lau dọn nhà vệ sinh và phòng tắm; Hút bụi thảm và sofa; Lau kính cửa sổ và gương; Dọn và lau bàn ghế, kệ tủ; Đổ rác và thay túi rác; Quét mạng nhện trần nhà và quạt.\n\nKHÔNG BAO GỒM: Giặt ủi quần áo chuyên sâu, Vệ sinh điều hòa, Vệ sinh kính bên ngoài tòa nhà cao tầng.\n\nLƯU Ý: Đặt tối thiểu 2 giờ/ca. Tăng 20% vào cuối tuần hoặc sau 19h. Phụ phí 30.000 VND/buổi nếu yêu cầu mang theo dụng cụ.',
  base_price   = 60000.00,
  slug         = 'giup-viec-theo-gio'
WHERE service_id = 1;

UPDATE services SET
  service_name = 'Giúp việc định kỳ',
  description  = 'Giải pháp tối ưu cho gia đình bận rộn muốn duy trì không gian sống sạch sẽ ổn định. Hệ thống cố định một người giúp việc chuyên nghiệp theo lịch hẹn hàng tuần, đội ngũ nhân sự được kiểm tra hồ sơ lý lịch nghiêm ngặt, tiết kiệm chi phí hơn so với đặt lẻ từng buổi.\n\nBAO GỒM: Toàn bộ công việc của gói dọn dẹp theo giờ; Hỗ trợ gấp quần áo, dọn giường ngủ; Tự động ghi nhớ thói quen sắp đặt đồ đạc; Vệ sinh sâu các khu vực tích tụ bụi theo vòng lặp tuần.\n\nKHÔNG BAO GỒM: Nấu ăn (trừ khi đăng ký thêm), Giặt sấy rèm cửa, Di chuyển đồ đạc nặng trên 15kg.\n\nLƯU Ý: Áp dụng cho khách hàng ký hợp đồng từ 1 tháng trở lên, tần suất tối thiểu 2 buổi/tuần. Giá cố định, không tăng vào cuối tuần.',
  base_price   = 55000.00,
  slug         = 'giup-viec-dinh-ky'
WHERE service_id = 2;

UPDATE services SET
  service_name = 'Nấu ăn gia đình',
  description  = 'Thưởng thức những bữa cơm nhà nóng hổi, chuẩn vị và đảm bảo vệ sinh an toàn thực phẩm mà không tốn thời gian vào bếp. Nhân viên sẽ thay bạn lên thực đơn, chuẩn bị nguyên liệu, nấu nướng và dọn dẹp sạch sẽ không gian bếp sau khi hoàn thành.\n\nBAO GỒM: Sơ chế nguyên liệu tươi sống sạch sẽ; Nấu các món theo thực đơn yêu cầu (3–4 món cơ bản); Rửa sạch bát đĩa, xoong nồi phát sinh; Lau chùi mặt bếp, bồn rửa và bàn ăn sau khi nấu.\n\nKHÔNG BAO GỒM: Phục vụ rót nước/bưng bê tại bàn như nhà hàng, Tổ chức tiệc quy mô lớn trên 10 người.\n\nLƯU Ý: Đặt tối thiểu 2 giờ/buổi. Giá chưa bao gồm chi phí mua nguyên liệu thực phẩm.',
  base_price   = 70000.00,
  slug         = 'nau-an-gia-dinh'
WHERE service_id = 3;

UPDATE services SET
  service_name = 'Trông trẻ tại nhà',
  description  = 'Giải pháp giữ trẻ theo giờ an toàn, tin cậy cho các bậc phụ huynh bận rộn. Đội ngũ bảo mẫu là sinh viên ngành mầm non/điều dưỡng hoặc các cô có kinh nghiệm lâu năm, yêu trẻ, có kỹ năng sơ cứu cơ bản.\n\nBAO GỒM: Chơi cùng bé, đọc truyện, hướng dẫn bé học bài hoặc làm thủ công; Cho bé ăn sữa/ăn dặm/ăn cơm theo khung giờ; Hỗ trợ vệ sinh cá nhân, tắm rửa và thay quần áo; Canh chừng bé ngủ, đảm bảo an toàn tuyệt đối.\n\nKHÔNG BAO GỒM: Làm việc nhà nặng, Y tế chuyên sâu (tiêm thuốc), Đưa trẻ ra ngoài khu vực công cộng nếu chưa có sự đồng ý của cha mẹ.\n\nLƯU Ý: Đặt tối thiểu 3 giờ/buổi. Áp dụng cho bé từ 1 tuổi trở lên.',
  base_price   = 70000.00,
  slug         = 'trong-tre-tai-nha'
WHERE service_id = 4;

UPDATE services SET
  service_name = 'Chăm sóc người cao tuổi',
  description  = 'San sẻ gánh nặng chăm sóc cha mẹ, ông bà khi bạn không có ở nhà. Nhân viên có sự kiên nhẫn, am hiểu tâm lý người già và được đào tạo kỹ năng điều dưỡng cơ bản.\n\nBAO GỒM: Trò chuyện, dìu người già đi dạo, tập thể dục nhẹ nhàng; Nhắc nhở và hỗ trợ uống thuốc đúng giờ, đúng liều; Hỗ trợ nấu món mềm (cháo, súp), đút cơm cho người yếu; Hỗ trợ vệ sinh cá nhân, thay đồ; Theo dõi huyết áp, đo thân nhiệt cơ bản hàng ngày.\n\nKHÔNG BAO GỒM: Thực hiện thủ thuật y khoa chuyên sâu (đặt ống thông, truyền dịch, tiêm tĩnh mạch).\n\nLƯU Ý: Tính theo giờ hoặc trọn gói ca ngày/đêm 12 tiếng. Gia đình cần cung cấp đơn thuốc và tiền sử bệnh lý.',
  base_price   = 75000.00,
  slug         = 'cham-soc-nguoi-cao-tuoi'
WHERE service_id = 5;

UPDATE services SET
  service_name = 'Tổng vệ sinh (Deep Clean)',
  description  = 'Dịch vụ làm sạch sâu toàn diện bằng máy móc công nghiệp dành cho nhà mới xây, mới sửa chữa, nhà lâu ngày không dọn hoặc chuẩn bị đón Tết. Thực hiện bởi đội nhóm 2–4 nhân viên cùng trang thiết bị chuyên dụng.\n\nBAO GỒM: Chà sàn bằng máy công nghiệp, tẩy vết sơn dính; Hút bụi và lau sạch sâu toàn bộ ngóc ngách, trần nhà; Tẩy ố kính, tẩy cặn canxi trên vách kính nhà tắm; Vệ sinh hệ thống cửa, khung cửa, ổ điện; Khử mùi toàn bộ căn nhà sau xây dựng.\n\nKHÔNG BAO GỒM: Phun thuốc diệt côn trùng, Giặt nệm/sofa (tính theo combo riêng), Sơn sửa hay dặm vá tường.\n\nLƯU Ý: Tính giá theo diện tích sàn (m²) hoặc trọn gói từ 1.200.000 VND. Đã bao gồm toàn bộ máy móc và hóa chất chuyên dụng.',
  base_price   = 15000.00,
  slug         = 'tong-ve-sinh-deep-clean'
WHERE service_id = 6;

-- ── Thêm 6 dịch vụ mới (service_id 7-12) ──────────────────────────────────

INSERT IGNORE INTO services (service_name, description, base_price, slug, is_active) VALUES
(
  'Vệ sinh Sofa, Nệm & Rèm',
  'Đánh bay bụi mịn, vết ố bẩn và mùi hôi trên chất liệu vải, nỉ, da bằng công nghệ phun hút áp lực hiện đại. Áp dụng phương pháp sấy hơi nước nóng diệt khuẩn đến 99.9% ký sinh trùng, ẩm mốc, bảo vệ sức khỏe hệ hô hấp cho cả gia đình.\n\nBAO GỒM: Hút bụi mịn sâu trên bề mặt và các khe kẽ; Phun hóa chất tẩy ố sinh học an toàn; Đánh tan vết bẩn bằng bàn chải mềm chuyên dụng; Phun hút áp lực tách nước bẩn; Phun hơi nước nóng diệt khuẩn và sấy khô 80–90%.\n\nKHÔNG BAO GỒM: Phục hồi vết rách, xước da, hoặc nhuộm lại màu vải bị phai.\n\nLƯU Ý: Giá tính theo đơn vị (bộ sofa, tấm nệm). Rèm cửa tính theo kg, bao gồm công tháo lắp và mang đi giặt sấy.',
  150000.00, 've-sinh-sofa-nem-rem', TRUE
),
(
  'Vệ sinh Điều hòa',
  'Đảm bảo không khí trong lành, tăng hiệu suất làm lạnh và tiết kiệm đến 30% điện năng tiêu thụ. Thực hiện bởi thợ điện lạnh tay nghề cao, sử dụng bạt hứng nước chuyên dụng không làm bẩn tường hay sàn nhà.\n\nBAO GỒM: Kiểm tra tình trạng hoạt động máy trước khi rửa; Tháo và xịt rửa lưới lọc bụi, vỏ máy; Xịt rửa giàn lạnh, thông tắc đường ống nước thải; Xịt rửa giàn nóng bên ngoài; Kiểm tra dòng điện và áp suất gas miễn phí.\n\nKHÔNG BAO GỒM: Sửa chữa bo mạch bị hỏng, Thay block máy, Chi phí giàn giáo.\n\nLƯU Ý: Áp dụng cho máy treo tường 1–2.5 HP. Máy âm trần/áp trần báo giá riêng (350.000–500.000 VND). Chưa bao gồm tiền nạp gas nếu máy bị hụt gas.',
  150000.00, 've-sinh-dieu-hoa', TRUE
),
(
  'Vệ sinh Máy giặt & Thiết bị bếp',
  'Loại bỏ hoàn toàn cặn xà phòng, nấm mốc đen bám lồng giặt và dầu mỡ đóng tảng trong máy hút mùi, tủ lạnh. Thợ chuyên kỹ thuật tháo rời toàn bộ linh kiện để cọ rửa sâu, kéo dài tuổi thọ thiết bị.\n\nBAO GỒM: Tháo rời lồng máy giặt, dùng vòi áp lực đánh sạch mảng bám; Vệ sinh gioăng cao su, lưới lọc cặn, bồn chứa nước thải; Rã đông, lau chùi khử khuẩn các khay ngăn bên trong tủ lạnh; Tháo vỉ lọc, tẩy sạch dầu mỡ trong máy hút mùi.\n\nKHÔNG BAO GỒM: Thay thế linh kiện hỏng, Sửa chữa lỗi bo mạch điện tử, Di dời vị trí lắp đặt.\n\nLƯU Ý: Máy giặt lồng đứng (250k), lồng ngang (400k–450k). Thiết bị bếp tính lẻ theo chiếc.',
  250000.00, 've-sinh-may-giat-thiet-bi-bep', TRUE
),
(
  'Chăm sóc Thú cưng',
  'Dịch vụ Pet Sitting hoàn hảo khi bạn đi du lịch, công tác hoặc bận rộn cả ngày. Nhân viên yêu động vật đến tận nhà chăm sóc chó, mèo, đảm bảo các bé được ăn uống đúng giờ và không bị cô đơn khi chủ vắng.\n\nBAO GỒM: Cho thú cưng ăn, uống nước theo đúng định lượng và giờ giấc; Dọn dẹp khay cát (mèo), lau dọn khu vực vệ sinh của chó; Chải lông, chơi đùa với các bé để giảm stress; Dắt chó đi dạo (nếu yêu cầu ca 2 tiếng trở lên); Chụp ảnh, quay video báo cáo tình hình cho chủ mỗi ca.\n\nKHÔNG BAO GỒM: Tắm rửa cắt tỉa lông chuyên nghiệp, Chữa bệnh hoặc tiêm vaccine tại nhà.\n\nLƯU Ý: Khách hàng cần chuẩn bị sẵn thức ăn và dụng cụ riêng. Thú cưng không có bệnh truyền nhiễm hoặc tiền sử cắn người nguy hiểm.',
  65000.00, 'cham-soc-thu-cung', TRUE
),
(
  'Vệ sinh Văn phòng & Shop',
  'Duy trì không gian làm việc sạch sẽ, chuyên nghiệp để nâng cao hiệu suất nhân viên và tạo ấn tượng tốt với đối tác, khách hàng. Phù hợp cho văn phòng vừa và nhỏ, cửa hàng bán lẻ, showroom cần dọn dẹp định kỳ.\n\nBAO GỒM: Quét và lau sàn toàn bộ khu vực làm việc, sảnh đón khách; Lau bụi bàn làm việc, tủ tài liệu, máy in, máy tính bên ngoài; Thu gom rác tại các bàn làm việc, thay túi rác mới; Vệ sinh khu vực WC chung; Lau chùi khu vực Pantry (bồn rửa chén của nhân viên).\n\nKHÔNG BAO GỒM: Lau kính mặt ngoài tòa nhà cao tầng bằng dây đu, Sắp xếp lại tài liệu mật trên bàn làm việc.\n\nLƯU Ý: Có thể tính theo diện tích hoặc ký hợp đồng khoán theo giờ cố định hàng tháng. Thường thực hiện sáng sớm hoặc buổi tối sau khi đóng cửa.',
  12000.00, 've-sinh-van-phong-shop', TRUE
),
(
  'Phun khử khuẩn & Kiểm soát côn trùng',
  'Bảo vệ gia đình khỏi mầm bệnh truyền nhiễm và sự phiền toái từ côn trùng (muỗi, gián, kiến, mối). Sử dụng máy phun sương hạt siêu nhỏ (ULV) kết hợp thuốc sinh học nhập khẩu được Bộ Y Tế cấp phép, diệt tận gốc nhưng tuyệt đối an toàn cho người và vật nuôi.\n\nBAO GỒM: Che phủ bảo vệ giường chiếu, đồ ăn, bể cá trước khi phun; Phun tồn lưu dọc tường, khe kẽ, gầm tủ để diệt kiến, gián, mối; Phun không gian (sương mù) toàn bộ các phòng để diệt muỗi; Phun khử khuẩn Nano bạc toàn bộ bề mặt (nếu chọn gói combo); Bảo hành dịch vụ 1–3 tháng tùy khu vực.\n\nKHÔNG BAO GỒM: Đào hào chống mối cho móng nhà công trình lớn, Thu dọn xác chuột chết ẩn trong trần thạch cao.\n\nLƯU Ý: Diện tích phun tối thiểu từ 50m² trở lên. Sau khi phun, di tản khỏi nhà tối thiểu 1–2 tiếng.',
  5000.00, 'phun-khu-khuan-con-trung', TRUE
);
