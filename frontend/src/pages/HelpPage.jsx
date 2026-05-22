import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, Phone, Mail, MessageCircle, Home } from 'lucide-react';

const FAQS = [
  {
    category: 'Đặt lịch & Dịch vụ',
    icon: '📋',
    items: [
      {
        q: 'Tôi có thể đặt lịch giúp việc như thế nào?',
        a: 'Rất đơn giản! Chọn dịch vụ bạn cần → chọn ngày giờ → cung cấp địa chỉ → thanh toán. Toàn bộ quy trình mất khoảng 2-3 phút. Chúng tôi sẽ tự động ghép bạn với người giúp việc phù hợp nhất trong khu vực.',
      },
      {
        q: 'CleanConnect cung cấp những dịch vụ nào?',
        a: 'Chúng tôi cung cấp đa dạng dịch vụ: dọn dẹp nhà theo giờ, dọn dẹp định kỳ, tổng vệ sinh, nấu ăn theo giờ, giặt ủi, trông trẻ, chăm sóc người cao tuổi, vệ sinh điều hòa, vệ sinh sofa/nệm/rèm, vệ sinh máy giặt và nhiều dịch vụ khác.',
      },
      {
        q: 'Tôi có thể yêu cầu cùng một người giúp việc không?',
        a: 'Có! Nếu bạn hài lòng với người giúp việc và họ đã từng làm việc cho bạn, bạn có thể chọn họ trực tiếp khi đặt lịch. Điều này giúp tiết kiệm thời gian vì người giúp việc đã quen nhà và sở thích của bạn.',
      },
      {
        q: 'Có thể đặt lịch trước bao lâu?',
        a: 'Bạn có thể đặt lịch trước bất cứ khi nào, miễn là từ ngày hiện tại trở đi. Chúng tôi khuyến khích đặt trước ít nhất 2-4 tiếng để đảm bảo có người giúp việc sẵn sàng.',
      },
    ],
  },
  {
    category: 'Người giúp việc',
    icon: '👤',
    items: [
      {
        q: 'Người giúp việc trên CleanConnect có được xác minh không?',
        a: 'Có. Mọi người giúp việc đều phải trải qua quy trình xác minh nghiêm ngặt: kiểm tra CCCD/CMND, kiểm tra lý lịch tư pháp, phỏng vấn trực tiếp, và phải đạt điểm đánh giá tối thiểu sau giai đoạn thử việc. Chúng tôi hiển thị badge "Đã xác minh" trên hồ sơ của những người này.',
      },
      {
        q: 'Làm sao để tìm người giúp việc phù hợp nhất?',
        a: 'Hệ thống matching của chúng tôi tự động gợi ý người giúp việc dựa trên: điểm đánh giá (40%), kinh nghiệm (30%), khối lượng công việc hiện tại (20%), và mức độ sẵn sàng (10%). Bạn cũng có thể xem hồ sơ chi tiết, đánh giá thực tế từ khách hàng trước để tự chọn.',
      },
      {
        q: 'Nếu người giúp việc không đến, tôi phải làm gì?',
        a: 'Liên hệ hotline 1800 1234 ngay lập tức. Chúng tôi cam kết xử lý trong 30 phút và điều phối người giúp việc thay thế hoặc hoàn tiền 100% nếu không thể sắp xếp.',
      },
    ],
  },
  {
    category: 'Thanh toán & Giá cả',
    icon: '💳',
    items: [
      {
        q: 'Giá được tính như thế nào?',
        a: 'Giá được tính theo giờ làm việc thực tế, dựa trên loại dịch vụ và số giờ bạn chọn. Giá hiển thị đầy đủ trước khi xác nhận — không có phí ẩn. Thời gian làm việc được xác nhận qua hệ thống check-in/check-out GPS.',
      },
      {
        q: 'Các hình thức thanh toán được chấp nhận?',
        a: 'Chúng tôi hỗ trợ 3 hình thức: (1) Tiền mặt — trả trực tiếp sau khi hoàn thành, (2) Chuyển khoản ngân hàng — quét QR VietQR, (3) VNPay — thanh toán online an toàn qua thẻ ATM/Visa/MasterCard.',
      },
      {
        q: 'Có mã giảm giá không?',
        a: 'Có! Khi đặt lịch, bạn có thể nhập mã khuyến mãi tại bước thanh toán. Các mã hiện tại được thông báo qua email và thông báo trong ứng dụng. Admin cũng có thể tạo mã giảm giá theo sự kiện.',
      },
      {
        q: 'Chính sách hoàn tiền như thế nào?',
        a: 'Hoàn tiền 100% nếu: hủy trước 2 tiếng so với giờ hẹn, hoặc người giúp việc không đến. Hoàn tiền 50% nếu hủy trong vòng 2 tiếng trước giờ hẹn. Không hoàn tiền sau khi công việc đã bắt đầu (check-in).',
      },
    ],
  },
  {
    category: 'Tài khoản & Bảo mật',
    icon: '🔒',
    items: [
      {
        q: 'Tôi quên mật khẩu, phải làm gì?',
        a: 'Nhấn vào "Quên mật khẩu?" tại trang đăng nhập, nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP xác minh. Sau khi nhập đúng OTP, bạn có thể đặt mật khẩu mới.',
      },
      {
        q: 'Thông tin cá nhân của tôi có được bảo mật không?',
        a: 'Tuyệt đối. Chúng tôi không bao giờ chia sẻ thông tin cá nhân với bên thứ ba ngoài mục đích thực hiện dịch vụ. Dữ liệu được mã hóa và lưu trữ an toàn theo tiêu chuẩn bảo mật OWASP.',
      },
      {
        q: 'Tôi có thể đăng ký bằng Google không?',
        a: 'Có! Bạn có thể đăng nhập/đăng ký nhanh bằng tài khoản Google qua nút "Tiếp tục với Google" trên trang đăng nhập. Nhanh hơn, tiện lợi hơn, không cần nhớ mật khẩu.',
      },
    ],
  },
  {
    category: 'Trở thành người giúp việc',
    icon: '🌟',
    items: [
      {
        q: 'Làm thế nào để đăng ký làm người giúp việc?',
        a: 'Nhấn "Đăng ký làm người giúp việc" tại trang chủ, điền thông tin cá nhân, upload ảnh CCCD và ảnh đại diện, chọn các dịch vụ bạn có thể cung cấp. Admin sẽ xét duyệt trong 1-2 ngày làm việc.',
      },
      {
        q: 'Thu nhập của người giúp việc trên nền tảng như thế nào?',
        a: 'Người giúp việc nhận từ 70-85% giá trị mỗi đơn hàng (tùy theo dịch vụ và mức đánh giá). Thanh toán được thực hiện qua chuyển khoản ngân hàng hàng tuần hoặc hàng tháng theo tùy chọn.',
      },
      {
        q: 'Yêu cầu để trở thành người giúp việc trên CleanConnect?',
        a: 'Bạn cần: (1) Có CCCD/CMND hợp lệ, (2) Không có tiền án tiền sự, (3) Có kinh nghiệm hoặc kỹ năng phù hợp với dịch vụ đăng ký, (4) Có smartphone để dùng ứng dụng check-in/check-out, (5) Cam kết đến đúng giờ và làm việc chuyên nghiệp.',
      },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-3 py-5 text-left group"
      >
        <span className={`text-sm font-medium leading-relaxed transition-colors ${
          open ? 'text-orange-600' : 'text-gray-900 group-hover:text-orange-600'
        }`}>{q}</span>
        <span className="flex-shrink-0 mt-0.5">
          {open
            ? <ChevronUp className="w-4 h-4 text-orange-500" />
            : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
          }
        </span>
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) =>
    (!activeCategory || cat.category === activeCategory) &&
    cat.items.length > 0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Câu hỏi thường gặp</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Câu hỏi thường gặp</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Tìm câu trả lời nhanh cho các thắc mắc phổ biến. Không tìm thấy? Liên hệ đội hỗ trợ của chúng tôi.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm câu hỏi..."
          className="w-full pl-11 pr-4 h-12 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none transition-colors bg-white"
        />
      </div>

      {/* Category filter */}
      {!search && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {FAQS.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category === activeCategory ? null : cat.category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.category
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.category}
            </button>
          ))}
        </div>
      )}

      {/* FAQ list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl mb-3">🔍</p>
          <p className="text-gray-500">Không tìm thấy câu hỏi phù hợp.</p>
          <button
            onClick={() => setSearch('')}
            className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Xóa tìm kiếm
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((cat) => (
            <div key={cat.category} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900">
                  {cat.icon} {cat.category}
                </h2>
              </div>
              <div className="px-6">
                {cat.items.map((item, i) => (
                  <FaqItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-12 bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
        <p className="text-xl font-bold text-gray-900 mb-2">Vẫn cần hỗ trợ?</p>
        <p className="text-gray-500 text-sm mb-6">
          Đội ngũ hỗ trợ của chúng tôi sẵn sàng 24/7 để giúp bạn.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:18001234"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl transition-colors"
          >
            <Phone className="w-4 h-4" />
            Gọi 1800 1234
          </a>
          <a
            href="mailto:support@connectclean.vn"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 border-2 border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 font-medium text-sm rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            Gửi email hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
}
