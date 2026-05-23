// Tự động khởi tạo schema, dữ liệu mẫu và chạy migration khi server khởi động
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// mysql2 không hỗ trợ DELIMITER (đó là lệnh MySQL CLI).
// Hàm này tách stored procedures/triggers ra khỏi SQL thường để chạy riêng.
function parseSqlWithDelimiters(sql) {
  const regularParts = [];
  const procedureSqls = [];
  const delimiterRegex = /DELIMITER\s*\$\$([\s\S]*?)DELIMITER\s*;/gi;
  let lastIndex = 0;
  let match;
  while ((match = delimiterRegex.exec(sql)) !== null) {
    regularParts.push(sql.slice(lastIndex, match.index));
    const stmts = match[1].split('$$').map(s => s.trim()).filter(Boolean);
    procedureSqls.push(...stmts);
    lastIndex = match.index + match[0].length;
  }
  regularParts.push(sql.slice(lastIndex));
  return { regularSql: regularParts.join('\n'), procedureSqls };
}

// Dữ liệu 12 dịch vụ đầy đủ cho migration v2
const SERVICES_V2 = [
  { id: 1, name: 'Giúp việc theo giờ', price: 60000, slug: 'giup-viec-theo-gio', unit: 'giờ',
    short: 'Dịch vụ dọn dẹp nhà cửa toàn diện theo khung giờ linh hoạt, thực hiện bởi đội ngũ người giúp việc được đào tạo bài bản và xác minh danh tính kỹ lưỡng. Chúng tôi sử dụng sản phẩm vệ sinh an toàn, thân thiện với trẻ em và thú cưng. Mỗi ca làm việc đều được ghi lại qua hệ thống check-in/check-out GPS để đảm bảo tính minh bạch và đúng giờ.',
    desc: 'Dịch vụ dọn dẹp nhà cửa toàn diện theo khung giờ linh hoạt, thực hiện bởi đội ngũ người giúp việc được đào tạo bài bản và xác minh danh tính kỹ lưỡng. Sử dụng sản phẩm vệ sinh an toàn, thân thiện với trẻ em và thú cưng. Mỗi ca làm việc được ghi lại qua hệ thống check-in/check-out GPS.\n\nBAO GỒM: Lau sàn toàn bộ các phòng; Vệ sinh nhà bếp (bếp, bồn rửa, tủ lạnh ngoài); Lau dọn nhà vệ sinh và phòng tắm; Hút bụi thảm và sofa; Lau kính cửa sổ và gương; Dọn và lau bàn ghế, kệ tủ; Đổ rác và thay túi rác; Quét mạng nhện trần nhà và quạt.\n\nKHÔNG BAO GỒM: Giặt ủi quần áo chuyên sâu, Vệ sinh điều hòa, Vệ sinh kính bên ngoài tòa nhà cao tầng.\n\nLƯU Ý: Đặt tối thiểu 2 giờ/ca. Tăng 20% vào cuối tuần hoặc sau 19h. Phụ phí 30.000 VND/buổi nếu yêu cầu mang theo dụng cụ.' },
  { id: 2, name: 'Giúp việc định kỳ', price: 55000, slug: 'giup-viec-dinh-ky', unit: 'giờ',
    short: 'Giải pháp tối ưu cho gia đình bận rộn muốn duy trì không gian sống sạch sẽ ổn định với một người giúp việc cố định theo lịch hẹn hàng tuần. Đội ngũ nhân sự được kiểm tra hồ sơ lý lịch nghiêm ngặt, cam kết đem lại sự an tâm tuyệt đối, tính gắn kết cao và tiết kiệm chi phí vượt trội so với đặt lẻ từng buổi.',
    desc: 'Giải pháp tối ưu cho gia đình bận rộn muốn duy trì không gian sống sạch sẽ ổn định. Hệ thống cố định một người giúp việc chuyên nghiệp theo lịch hẹn hàng tuần, đội ngũ nhân sự được kiểm tra hồ sơ lý lịch nghiêm ngặt, tiết kiệm chi phí hơn so với đặt lẻ từng buổi.\n\nBAO GỒM: Toàn bộ công việc của gói dọn dẹp theo giờ; Hỗ trợ gấp quần áo, dọn giường ngủ; Tự động ghi nhớ thói quen sắp đặt đồ đạc; Vệ sinh sâu các khu vực tích tụ bụi theo vòng lặp tuần.\n\nKHÔNG BAO GỒM: Nấu ăn (trừ khi đăng ký thêm), Giặt sấy rèm cửa, Di chuyển đồ đạc nặng trên 15kg.\n\nLƯU Ý: Áp dụng cho khách hàng ký hợp đồng từ 1 tháng trở lên, tần suất tối thiểu 2 buổi/tuần. Giá cố định, không tăng vào cuối tuần.' },
  { id: 3, name: 'Nấu ăn gia đình', price: 70000, slug: 'nau-an-gia-dinh', unit: 'giờ',
    short: 'Thưởng thức những bữa cơm nhà nóng hổi, chuẩn vị và đảm bảo vệ sinh an toàn thực phẩm mà không tốn thời gian vào bếp. Nhân viên của chúng tôi sẽ thay bạn lên thực đơn, chuẩn bị nguyên liệu tươi ngon, nấu nướng khéo léo và thu dọn sạch sẽ không gian bếp, mang lại sự ấm cúng trọn vẹn cho gia đình bạn.',
    desc: 'Thưởng thức những bữa cơm nhà nóng hổi, chuẩn vị và đảm bảo vệ sinh an toàn thực phẩm mà không tốn thời gian vào bếp. Nhân viên sẽ thay bạn lên thực đơn, chuẩn bị nguyên liệu, nấu nướng và dọn dẹp sạch sẽ không gian bếp sau khi hoàn thành.\n\nBAO GỒM: Sơ chế nguyên liệu tươi sống sạch sẽ; Nấu các món theo thực đơn yêu cầu (3–4 món cơ bản); Rửa sạch bát đĩa, xoong nồi phát sinh; Lau chùi mặt bếp, bồn rửa và bàn ăn sau khi nấu.\n\nKHÔNG BAO GỒM: Phục vụ rót nước/bưng bê tại bàn như nhà hàng, Tổ chức tiệc quy mô lớn trên 10 người.\n\nLƯU Ý: Đặt tối thiểu 2 giờ/buổi. Giá chưa bao gồm chi phí mua nguyên liệu thực phẩm.' },
  { id: 4, name: 'Trông trẻ tại nhà', price: 70000, slug: 'trong-tre-tai-nha', unit: 'giờ',
    short: 'Giải pháp giữ trẻ theo giờ an toàn, tin cậy cho các ông bố bà mẹ bận rộn hoặc có việc đột xuất. Đội ngũ bảo mẫu là các bạn sinh viên ngành mầm non/điều dưỡng hoặc các cô có kinh nghiệm lâu năm, yêu trẻ, giúp chăm sóc, chơi cùng bé một cách khoa học và xử lý tốt các tình huống cơ bản.',
    desc: 'Giải pháp giữ trẻ theo giờ an toàn, tin cậy cho các bậc phụ huynh bận rộn. Đội ngũ bảo mẫu là sinh viên ngành mầm non/điều dưỡng hoặc các cô có kinh nghiệm lâu năm, yêu trẻ, có kỹ năng sơ cứu cơ bản.\n\nBAO GỒM: Chơi cùng bé, đọc truyện, hướng dẫn bé học bài hoặc làm thủ công; Cho bé ăn sữa/ăn dặm/ăn cơm theo khung giờ; Hỗ trợ vệ sinh cá nhân, tắm rửa và thay quần áo; Canh chừng bé ngủ, đảm bảo an toàn tuyệt đối.\n\nKHÔNG BAO GỒM: Làm việc nhà nặng, Y tế chuyên sâu (tiêm thuốc), Đưa trẻ ra ngoài khu vực công cộng nếu chưa có sự đồng ý của cha mẹ.\n\nLƯU Ý: Đặt tối thiểu 3 giờ/buổi. Áp dụng cho bé từ 1 tuổi trở lên.' },
  { id: 5, name: 'Chăm sóc người cao tuổi', price: 75000, slug: 'cham-soc-nguoi-cao-tuoi', unit: 'giờ',
    short: 'San sẻ gánh nặng chăm sóc cha mẹ, ông bà khi bạn bận rộn với công việc. Nhân viên kiên nhẫn, am hiểu tâm lý người già và được đào tạo kỹ năng điều dưỡng cơ bản sẽ hỗ trợ ăn uống, nhắc nhở uống thuốc đúng giờ, theo dõi sức khỏe và bầu bạn, mang lại sự an tâm tuyệt đối cho gia đình bạn.',
    desc: 'San sẻ gánh nặng chăm sóc cha mẹ, ông bà khi bạn không có ở nhà. Nhân viên có sự kiên nhẫn, am hiểu tâm lý người già và được đào tạo kỹ năng điều dưỡng cơ bản.\n\nBAO GỒM: Trò chuyện, dìu người già đi dạo, tập thể dục nhẹ nhàng; Nhắc nhở và hỗ trợ uống thuốc đúng giờ, đúng liều; Hỗ trợ nấu món mềm (cháo, súp), đút cơm cho người yếu; Hỗ trợ vệ sinh cá nhân, thay đồ; Theo dõi huyết áp, đo thân nhiệt cơ bản hàng ngày.\n\nKHÔNG BAO GỒM: Thực hiện thủ thuật y khoa chuyên sâu (đặt ống thông, truyền dịch, tiêm tĩnh mạch).\n\nLƯU Ý: Tính theo giờ hoặc trọn gói ca ngày/đêm 12 tiếng. Gia đình cần cung cấp đơn thuốc và tiền sử bệnh lý.' },
  { id: 6, name: 'Tổng vệ sinh (Deep Clean)', price: 15000, slug: 'tong-ve-sinh-deep-clean', unit: 'm²',
    short: 'Dịch vụ làm sạch sâu toàn diện bằng máy móc công nghiệp dành cho nhà mới xây, mới sửa chữa, lâu ngày không dọn hoặc chuẩn bị đón Tết. Thực hiện bởi đội ngũ nhóm nhân viên chuyên nghiệp cùng trang thiết bị hiện đại, đánh bay mọi vết sơn, xi măng, vết ố cứng đầu nhất, trả lại không gian sạch bóng như mới.',
    desc: 'Dịch vụ làm sạch sâu toàn diện bằng máy móc công nghiệp dành cho nhà mới xây, mới sửa chữa, nhà lâu ngày không dọn hoặc chuẩn bị đón Tết. Thực hiện bởi đội nhóm 2–4 nhân viên cùng trang thiết bị chuyên dụng.\n\nBAO GỒM: Chà sàn bằng máy công nghiệp, tẩy vết sơn dính; Hút bụi và lau sạch sâu toàn bộ ngóc ngách, trần nhà; Tẩy ố kính, tẩy cặn canxi trên vách kính nhà tắm; Vệ sinh hệ thống cửa, khung cửa, ổ điện; Khử mùi toàn bộ căn nhà sau xây dựng.\n\nKHÔNG BAO GỒM: Phun thuốc diệt côn trùng, Giặt nệm/sofa (tính theo combo riêng), Sơn sửa hay dặm vá tường.\n\nLƯU Ý: Tính giá theo diện tích sàn (m²) hoặc trọn gói từ 1.200.000 VND. Đã bao gồm toàn bộ máy móc và hóa chất chuyên dụng.' },
];

const NEW_SERVICES_V2 = [
  { name: 'Vệ sinh Sofa, Nệm & Rèm', price: 250000, slug: 've-sinh-sofa-nem-rem', unit: 'm²',
    short: 'Đánh bay bụi mịn, vết ố bẩn và mùi hôi trên chất liệu vải, nỉ, da bằng công nghệ phun hút áp lực hiện đại. Chúng tôi áp dụng phương pháp sấy hơi nước nóng diệt khuẩn đến 99.9% các loại ký sinh trùng, ẩm mốc ẩn sâu bên trong, bảo vệ tối đa sức khỏe hệ hô hấp và làn da cho cả gia đình bạn.',
    desc: 'Đánh bay bụi mịn, vết ố bẩn và mùi hôi trên chất liệu vải, nỉ, da bằng công nghệ phun hút áp lực hiện đại. Áp dụng phương pháp sấy hơi nước nóng diệt khuẩn đến 99.9% ký sinh trùng, ẩm mốc, bảo vệ sức khỏe hệ hô hấp cho cả gia đình.\n\nBAO GỒM: Hút bụi mịn sâu trên bề mặt và các khe kẽ; Phun hóa chất tẩy ố sinh học an toàn; Đánh tan vết bẩn bằng bàn chải mềm chuyên dụng; Phun hút áp lực tách nước bẩn; Phun hơi nước nóng diệt khuẩn và sấy khô 80–90%.\n\nKHÔNG BAO GỒM: Phục hồi vết rách, xước da, hoặc nhuộm lại màu vải bị phai.\n\nLƯU Ý: Giá tính theo đơn vị (bộ sofa, tấm nệm). Rèm cửa tính theo kg, bao gồm công tháo lắp và mang đi giặt sấy.' },
  { name: 'Vệ sinh Điều hòa', price: 150000, slug: 've-sinh-dieu-hoa', unit: 'lần',
    short: 'Đảm bảo nguồn không khí trong lành, tăng hiệu suất làm lạnh và tiết kiệm đến 30% điện năng tiêu thụ cho gia đình. Dịch vụ bảo dưỡng, xịt rửa điều hòa chuyên nghiệp được thực hiện bởi các thợ điện lạnh có tay nghề cao, sử dụng bạt hứng chuyên dụng cam kết không làm bẩn tường hay sàn nhà của bạn.',
    desc: 'Đảm bảo không khí trong lành, tăng hiệu suất làm lạnh và tiết kiệm đến 30% điện năng tiêu thụ. Thực hiện bởi thợ điện lạnh tay nghề cao, sử dụng bạt hứng nước chuyên dụng không làm bẩn tường hay sàn nhà.\n\nBAO GỒM: Kiểm tra tình trạng hoạt động máy trước khi rửa; Tháo và xịt rửa lưới lọc bụi, vỏ máy; Xịt rửa giàn lạnh, thông tắc đường ống nước thải; Xịt rửa giàn nóng bên ngoài; Kiểm tra dòng điện và áp suất gas miễn phí.\n\nKHÔNG BAO GỒM: Sửa chữa bo mạch bị hỏng, Thay block máy, Chi phí giàn giáo.\n\nLƯU Ý: Áp dụng cho máy treo tường 1–2.5 HP. Máy âm trần/áp trần báo giá riêng (350.000–500.000 VND). Chưa bao gồm tiền nạp gas nếu máy bị hụt gas.' },
  { name: 'Vệ sinh Máy giặt & Thiết bị bếp', price: 250000, slug: 've-sinh-may-giat-thiet-bi-bep', unit: 'lần',
    short: 'Loại bỏ hoàn toàn cặn xà phòng, nấm mốc đen bám ngoài lồng giặt và dầu mỡ đóng tảng trong máy hút mùi, tủ lạnh. Thợ kỹ thuật sẽ tiến hành tháo rời thiết bị để cọ rửa chuyên sâu bằng hóa chất tẩy rửa sinh học, giúp kéo dài tuổi thọ máy và bảo vệ sức khỏe gia đình từ quần áo đến thực phẩm.',
    desc: 'Loại bỏ hoàn toàn cặn xà phòng, nấm mốc đen bám lồng giặt và dầu mỡ đóng tảng trong máy hút mùi, tủ lạnh. Thợ chuyên kỹ thuật tháo rời toàn bộ linh kiện để cọ rửa sâu, kéo dài tuổi thọ thiết bị.\n\nBAO GỒM: Tháo rời lồng máy giặt, dùng vòi áp lực đánh sạch mảng bám; Vệ sinh gioăng cao su, lưới lọc cặn, bồn chứa nước thải; Rã đông, lau chùi khử khuẩn các khay ngăn bên trong tủ lạnh; Tháo vỉ lọc, tẩy sạch dầu mỡ trong máy hút mùi.\n\nKHÔNG BAO GỒM: Thay thế linh kiện hỏng, Sửa chữa lỗi bo mạch điện tử, Di dời vị trí lắp đặt.\n\nLƯU Ý: Máy giặt lồng đứng (250k), lồng ngang (400k–450k). Thiết bị bếp tính lẻ theo chiếc.' },
  { name: 'Chăm sóc Thú cưng', price: 65000, slug: 'cham-soc-thu-cung', unit: 'giờ',
    short: 'Dịch vụ chăm sóc thú cưng tại nhà hoàn hảo khi bạn đi du lịch, công tác hoặc bận rộn cả ngày. Nhân viên am hiểu và yêu động vật của chúng tôi sẽ đến tận nơi cho các bé ăn uống đúng giờ, dọn dẹp khay vệ sinh, chơi đùa cùng các bé để giảm stress, đảm bảo thú cưng luôn khỏe mạnh khi bạn vắng nhà.',
    desc: 'Dịch vụ Pet Sitting hoàn hảo khi bạn đi du lịch, công tác hoặc bận rộn cả ngày. Nhân viên yêu động vật đến tận nhà chăm sóc chó, mèo, đảm bảo các bé được ăn uống đúng giờ và không bị cô đơn khi chủ vắng.\n\nBAO GỒM: Cho thú cưng ăn, uống nước theo đúng định lượng và giờ giấc; Dọn dẹp khay cát (mèo), lau dọn khu vực vệ sinh của chó; Chải lông, chơi đùa với các bé để giảm stress; Dắt chó đi dạo (nếu yêu cầu ca 2 tiếng trở lên); Chụp ảnh, quay video báo cáo tình hình cho chủ mỗi ca.\n\nKHÔNG BAO GỒM: Tắm rửa cắt tỉa lông chuyên nghiệp, Chữa bệnh hoặc tiêm vaccine tại nhà.\n\nLƯU Ý: Khách hàng cần chuẩn bị sẵn thức ăn và dụng cụ riêng. Thú cưng không có bệnh truyền nhiễm hoặc tiền sử cắn người nguy hiểm.' },
  { name: 'Vệ sinh Văn phòng & Shop', price: 20000, slug: 've-sinh-van-phong-shop', unit: 'm²',
    short: 'Duy trì không gian làm việc sạch sẽ, chuyên nghiệp để nâng cao hiệu suất làm việc của nhân viên và tạo ấn tượng tốt với đối tác. Dịch vụ linh hoạt, kinh tế, phù hợp cho các văn phòng vừa và nhỏ, cửa hàng bán lẻ hoặc showroom cần dọn dẹp định kỳ hàng ngày ngoài giờ hành chính.',
    desc: 'Duy trì không gian làm việc sạch sẽ, chuyên nghiệp để nâng cao hiệu suất nhân viên và tạo ấn tượng tốt với đối tác, khách hàng. Phù hợp cho văn phòng vừa và nhỏ, cửa hàng bán lẻ, showroom cần dọn dẹp định kỳ.\n\nBAO GỒM: Quét và lau sàn toàn bộ khu vực làm việc, sảnh đón khách; Lau bụi bàn làm việc, tủ tài liệu, máy in, máy tính bên ngoài; Thu gom rác tại các bàn làm việc, thay túi rác mới; Vệ sinh khu vực WC chung; Lau chùi khu vực Pantry.\n\nKHÔNG BAO GỒM: Lau kính mặt ngoài tòa nhà cao tầng bằng dây đu, Sắp xếp lại tài liệu mật trên bàn làm việc.\n\nLƯU Ý: Có thể tính theo diện tích hoặc ký hợp đồng khoán theo giờ cố định hàng tháng. Thường thực hiện sáng sớm hoặc buổi tối sau khi đóng cửa.' },
  { name: 'Phun khử khuẩn & Kiểm soát côn trùng', price: 10000, slug: 'phun-khu-khuan-con-trung', unit: 'm²',
    short: 'Bảo vệ gia đình bạn khỏi các mầm bệnh truyền nhiễm và sự phiền toái từ côn trùng (muỗi, gián, kiến, mối). Chúng tôi sử dụng máy phun sương hạt siêu nhỏ (ULV) kết hợp với các loại thuốc sinh học cao cấp nhập khẩu, được Bộ Y Tế cấp phép, đảm bảo diệt tận gốc nhưng tuyệt đối an toàn cho sức khỏe con người và vật nuôi.',
    desc: 'Bảo vệ gia đình khỏi mầm bệnh truyền nhiễm và sự phiền toái từ côn trùng (muỗi, gián, kiến, mối). Sử dụng máy phun sương hạt siêu nhỏ (ULV) kết hợp thuốc sinh học nhập khẩu được Bộ Y Tế cấp phép, diệt tận gốc nhưng tuyệt đối an toàn cho người và vật nuôi.\n\nBAO GỒM: Che phủ bảo vệ giường chiếu, đồ ăn, bể cá trước khi phun; Phun tồn lưu dọc tường, khe kẽ, gầm tủ để diệt kiến, gián, mối; Phun không gian (sương mù) toàn bộ các phòng để diệt muỗi; Phun khử khuẩn Nano bạc toàn bộ bề mặt (gói combo); Bảo hành dịch vụ 1–3 tháng tùy khu vực.\n\nKHÔNG BAO GỒM: Đào hào chống mối cho móng nhà công trình lớn, Thu dọn xác chuột chết ẩn trong trần thạch cao.\n\nLƯU Ý: Diện tích phun tối thiểu từ 50m² trở lên. Sau khi phun, di tản khỏi nhà tối thiểu 1–2 tiếng.' },
];

async function migrateServicesV2(connection) {
  // UPDATE 6 dịch vụ cũ (giữ nguyên ID)
  for (const s of SERVICES_V2) {
    await connection.query(
      'UPDATE services SET service_name=?, description=?, short_description=?, base_price=?, price_unit=?, slug=? WHERE service_id=?',
      [s.name, s.desc, s.short, s.price, s.unit, s.slug, s.id]
    );
  }
  // INSERT 6 dịch vụ mới (idempotent qua slug UNIQUE)
  for (const s of NEW_SERVICES_V2) {
    await connection.query(
      'INSERT IGNORE INTO services (service_name, description, short_description, base_price, price_unit, slug, is_active) VALUES (?,?,?,?,?,?,TRUE)',
      [s.name, s.desc, s.short, s.price, s.unit, s.slug]
    );
  }
  // Cập nhật short_description và price_unit cho dịch vụ mới đã tồn tại (khi INSERT IGNORE bỏ qua)
  for (const s of NEW_SERVICES_V2) {
    await connection.query(
      'UPDATE services SET short_description=?, price_unit=? WHERE slug=? AND (short_description IS NULL OR short_description = "")',
      [s.short, s.unit, s.slug]
    );
  }
}

// Migration idempotent: phone và password_hash cần nullable để hỗ trợ OAuth users
async function runMigrations(connection) {
  try {
    await connection.query('ALTER TABLE users MODIFY COLUMN phone VARCHAR(15) UNIQUE NULL');
    await connection.query('ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL');
  } catch (err) {
    // ignore — đã chạy rồi
  }

  // Thêm cột short_description nếu chưa tồn tại
  try {
    await connection.query('ALTER TABLE services ADD COLUMN short_description TEXT NULL AFTER description');
  } catch (err) {
    // ignore — cột đã tồn tại
  }

  // Thêm cột price_unit nếu chưa tồn tại
  try {
    await connection.query("ALTER TABLE services ADD COLUMN price_unit VARCHAR(10) NOT NULL DEFAULT 'giờ' AFTER base_price");
  } catch (err) {
    // ignore — cột đã tồn tại
  }

  // Sửa giá: Vệ sinh Văn phòng → 20.000/m², Phun khử khuẩn → 10.000/m²
  try {
    await connection.query("UPDATE services SET base_price=20000 WHERE slug='ve-sinh-van-phong-shop' AND base_price<>20000");
    await connection.query("UPDATE services SET base_price=10000 WHERE slug='phun-khu-khuan-con-trung' AND base_price<>10000");
  } catch (err) {
    // ignore
  }

  // Populate short_description và price_unit cho tất cả 12 dịch vụ (idempotent)
  try {
    const allServices = [...SERVICES_V2, ...NEW_SERVICES_V2];
    for (const s of allServices) {
      await connection.query(
        'UPDATE services SET short_description=?, price_unit=? WHERE slug=?',
        [s.short, s.unit, s.slug]
      );
    }
  } catch (err) {
    console.error('⚠️  Populate short_description/price_unit warning:', err.message);
  }

  // Migration v2: cập nhật 12 dịch vụ đầy đủ
  try {
    const [[svc1]] = await connection.query('SELECT service_name FROM services WHERE service_id = 1');
    if (svc1 && svc1.service_name !== 'Giúp việc theo giờ') {
      console.log('⚙️  Đang chạy migration services v2...');
      await migrateServicesV2(connection);
      console.log('✅ Migration services v2 hoàn tất — 12 dịch vụ đã cập nhật.');
    }
  } catch (err) {
    console.error('⚠️  Migration services v2 warning:', err.message);
  }

  // Thêm cột reminder_sent để theo dõi đã gửi nhắc nhở chưa
  try {
    await connection.query('ALTER TABLE bookings ADD COLUMN reminder_sent TINYINT NOT NULL DEFAULT 0');
  } catch (err) {
    // ignore — cột đã tồn tại
  }

  // Tạo bảng đăng ký ca làm việc theo ngày cụ thể (helper tự đăng ký)
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS helper_shift_registrations (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        helper_id   INT NOT NULL,
        shift_date  DATE NOT NULL,
        start_time  TIME NOT NULL,
        end_time    TIME NOT NULL,
        status      ENUM('active','cancelled') NOT NULL DEFAULT 'active',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY  uniq_shift (helper_id, shift_date, start_time),
        FOREIGN KEY (helper_id) REFERENCES helpers(helper_id) ON DELETE CASCADE,
        INDEX idx_helper_date (helper_id, shift_date, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (err) {
    // ignore — bảng đã tồn tại
  }

  // Tạo bảng cấu hình hệ thống
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key   VARCHAR(100) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.query(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value)
      VALUES ('platform_commission_rate', '0.10')
    `);
  } catch (err) {
    // ignore
  }

  // Thêm cột phân chia doanh thu vào payments
  try {
    await connection.query('ALTER TABLE payments ADD COLUMN commission_rate DECIMAL(5,4) NULL AFTER amount');
  } catch (err) { /* ignore — cột đã tồn tại */ }
  try {
    await connection.query('ALTER TABLE payments ADD COLUMN platform_fee_amount DECIMAL(10,2) NULL AFTER commission_rate');
  } catch (err) { /* ignore — cột đã tồn tại */ }
  try {
    await connection.query('ALTER TABLE payments ADD COLUMN helper_earning DECIMAL(10,2) NULL AFTER platform_fee_amount');
  } catch (err) { /* ignore — cột đã tồn tại */ }

  console.log('✅ Migrations hoàn tất.');
}

async function initDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'housekeeping_service',
      charset: 'utf8mb4',
      multipleStatements: true,
      ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
    });

    const [[{ cnt }]] = await connection.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
    );

    if (Number(cnt) > 0 && process.env.FORCE_REINIT === 'true') {
      // FORCE_REINIT=true → drop toàn bộ bảng rồi khởi tạo lại từ đầu
      console.log('⚠️  FORCE_REINIT=true — đang xóa toàn bộ bảng...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      const [tables] = await connection.query(
        'SELECT TABLE_NAME AS tname FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
      );
      for (const row of tables) {
        await connection.query(`DROP TABLE IF EXISTS \`${row.tname}\``);
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log(`✅ Đã xóa ${tables.length} bảng.`);
    } else if (Number(cnt) > 0) {
      // Bảng tồn tại → kiểm tra xem có user nào chưa
      const [[{ userCount }]] = await connection.query('SELECT COUNT(*) AS userCount FROM users');
      if (Number(userCount) === 0) {
        // Bảng có nhưng users rỗng → chỉ chạy seed data, không chạy lại schema
        console.log('⚙️  Bảng tồn tại nhưng chưa có dữ liệu — đang import dữ liệu mẫu...');
        const dataPath = path.join(__dirname, '../../../database/sample_data.sql');
        let data = fs.readFileSync(dataPath, 'utf8');
        data = data.replace(/USE\s+\w+;/gi, '');
        await connection.query(data);
        console.log('✅ Dữ liệu mẫu đã được import thành công.');
        console.log('   Admin  : admin@gmail.com / 123456');
        console.log('   Customer: nguyenvanbay@gmail.com / 123456');
        console.log('   Helper  : nguyenthimai@gmail.com / 123456');
      } else {
        console.log('✅ Database đã có dữ liệu, bỏ qua khởi tạo.');
      }
      // Luôn chạy migrations (idempotent) trước khi kết thúc
      await runMigrations(connection);
      return;
    }

    console.log('⚙️  Đang khởi tạo schema...');

    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    // Bỏ CREATE DATABASE và USE (Aiven đã tạo DB sẵn)
    schema = schema
      .replace(/CREATE\s+DATABASE\s[^;]+;/gi, '')
      .replace(/USE\s+\w+;/gi, '');

    // Chạy SQL thường (CREATE TABLE, INDEX...) với multipleStatements
    const { regularSql, procedureSqls } = parseSqlWithDelimiters(schema);
    await connection.query(regularSql);

    // Chạy từng stored procedure / trigger riêng lẻ (không dùng DELIMITER)
    for (const proc of procedureSqls) {
      if (proc.trim()) await connection.query(proc);
    }
    console.log('✅ Schema đã được tạo.');

    console.log('⚙️  Đang import dữ liệu mẫu...');
    const dataPath = path.join(__dirname, '../../../database/sample_data.sql');
    let data = fs.readFileSync(dataPath, 'utf8');
    data = data.replace(/USE\s+\w+;/gi, '');
    await connection.query(data);

    console.log('✅ Dữ liệu mẫu đã được import thành công.');
    console.log('   Admin  : admin@gmail.com / 123456');
    console.log('   Customer: nguyenvanbay@gmail.com / 123456');
    console.log('   Helper  : nguyenthimai@gmail.com / 123456');

    await runMigrations(connection);
  } catch (err) {
    console.error('❌ Lỗi khởi tạo database:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { initDatabase };
