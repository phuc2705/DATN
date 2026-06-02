import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Shield, FileText } from 'lucide-react';
import SEO from '../components/common/SEO';

const TABS = [
  { key: 'terms', label: 'Điều khoản sử dụng', Icon: FileText },
  { key: 'privacy', label: 'Chính sách bảo mật', Icon: Shield },
];

const TERMS_SECTIONS = [
  {
    title: '1. Chấp nhận điều khoản',
    content: `Bằng cách truy cập và sử dụng nền tảng CleanConnect ("Dịch vụ"), bạn đồng ý bị ràng buộc bởi các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không thể sử dụng Dịch vụ.`,
  },
  {
    title: '2. Mô tả dịch vụ',
    content: `CleanConnect là nền tảng kết nối khách hàng ("Người dùng") với người giúp việc gia đình ("Người giúp việc") để thực hiện các dịch vụ gia đình theo yêu cầu. CleanConnect đóng vai trò là trung gian kết nối và không trực tiếp cung cấp dịch vụ giúp việc.`,
  },
  {
    title: '3. Tài khoản người dùng',
    content: `Để sử dụng đầy đủ tính năng, bạn phải đăng ký tài khoản với thông tin chính xác và đầy đủ. Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động xảy ra dưới tài khoản của mình. Mỗi người chỉ được sở hữu một tài khoản khách hàng.`,
  },
  {
    title: '4. Đặt lịch và thanh toán',
    content: `Giá dịch vụ được hiển thị rõ ràng trước khi xác nhận đặt lịch. Khách hàng có thể thanh toán bằng tiền mặt, chuyển khoản ngân hàng hoặc VNPay. Mọi giao dịch được ghi lại và có thể tra cứu lại trong hệ thống.`,
  },
  {
    title: '5. Chính sách hủy lịch và hoàn tiền',
    content: `Hủy trước 2 tiếng: hoàn tiền 100%. Hủy trong vòng 2 tiếng trước giờ hẹn: hoàn tiền 50%. Không hoàn tiền sau khi người giúp việc đã check-in. Trường hợp người giúp việc không đến: hoàn tiền 100% và được ưu tiên đặt lại miễn phí.`,
  },
  {
    title: '6. Trách nhiệm của người dùng',
    content: `Người dùng cam kết: cung cấp thông tin chính xác khi đặt lịch, đảm bảo môi trường an toàn cho người giúp việc, không yêu cầu dịch vụ ngoài phạm vi đã đặt, không có hành vi quấy rối hoặc phân biệt đối xử. Vi phạm có thể dẫn đến khóa tài khoản vĩnh viễn.`,
  },
  {
    title: '7. Trách nhiệm của người giúp việc',
    content: `Người giúp việc cam kết: đến đúng giờ, thực hiện đúng dịch vụ đã đăng ký, không tiết lộ thông tin cá nhân của khách hàng, check-in/check-out trung thực qua hệ thống GPS, duy trì điểm đánh giá tối thiểu 3.5/5 để tiếp tục hoạt động trên nền tảng.`,
  },
  {
    title: '8. Giới hạn trách nhiệm',
    content: `CleanConnect không chịu trách nhiệm về mất mát tài sản, thương tích hoặc thiệt hại xảy ra trong quá trình cung cấp dịch vụ vượt quá giá trị của đơn hàng đó. Chúng tôi khuyến khích người dùng mua bảo hiểm bổ sung cho tài sản có giá trị cao.`,
  },
  {
    title: '9. Thay đổi điều khoản',
    content: `CleanConnect có quyền cập nhật Điều khoản Dịch vụ bất kỳ lúc nào. Thay đổi sẽ có hiệu lực sau 7 ngày kể từ khi thông báo qua email hoặc thông báo trong ứng dụng. Tiếp tục sử dụng dịch vụ sau thời gian này đồng nghĩa với việc chấp nhận điều khoản mới.`,
  },
];

const PRIVACY_SECTIONS = [
  {
    title: '1. Thông tin chúng tôi thu thập',
    content: `Chúng tôi thu thập: (a) Thông tin tài khoản: họ tên, email, số điện thoại, địa chỉ; (b) Thông tin giao dịch: lịch sử đặt lịch, thanh toán; (c) Thông tin kỹ thuật: địa chỉ IP, loại thiết bị, nhật ký truy cập; (d) Vị trí GPS khi check-in/check-out (chỉ trong ca làm việc).`,
  },
  {
    title: '2. Cách chúng tôi sử dụng thông tin',
    content: `Thông tin của bạn được sử dụng để: xác minh danh tính và bảo mật tài khoản, thực hiện và quản lý đặt lịch, gửi thông báo liên quan đến dịch vụ, cải thiện trải nghiệm người dùng, phân tích xu hướng sử dụng, tuân thủ yêu cầu pháp lý.`,
  },
  {
    title: '3. Chia sẻ thông tin',
    content: `Chúng tôi KHÔNG bán thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ với: người giúp việc trong phạm vi cần thiết để thực hiện dịch vụ (tên, địa chỉ), đối tác thanh toán (VNPay, ngân hàng) để xử lý giao dịch, cơ quan pháp luật khi có yêu cầu hợp pháp.`,
  },
  {
    title: '4. Bảo mật dữ liệu',
    content: `Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành: mã hóa HTTPS cho mọi kết nối, mật khẩu được hash bcrypt, JWT token với thời hạn ngắn, kiểm soát truy cập phân quyền (Admin/Customer/Helper), và giám sát hoạt động bất thường 24/7.`,
  },
  {
    title: '5. Cookie và tracking',
    content: `Chúng tôi sử dụng cookies cần thiết để duy trì phiên đăng nhập và tùy chọn người dùng. Chúng tôi không sử dụng cookie theo dõi quảng cáo của bên thứ ba. Bạn có thể xóa cookie trong cài đặt trình duyệt nhưng điều này có thể ảnh hưởng đến trải nghiệm.`,
  },
  {
    title: '6. Quyền của người dùng',
    content: `Bạn có quyền: xem toàn bộ thông tin cá nhân đang lưu trữ, yêu cầu chỉnh sửa thông tin không chính xác, yêu cầu xóa tài khoản và dữ liệu (trong vòng 30 ngày), phản đối việc xử lý dữ liệu trong một số trường hợp. Gửi yêu cầu đến support@cleanconnect.vn.`,
  },
  {
    title: '7. Lưu trữ dữ liệu',
    content: `Dữ liệu tài khoản được lưu trữ trong suốt thời gian tài khoản hoạt động. Sau khi xóa tài khoản, dữ liệu được xóa hoàn toàn trong 30 ngày, ngoại trừ dữ liệu giao dịch tài chính phải lưu theo quy định pháp luật (tối thiểu 5 năm).`,
  },
  {
    title: '8. Liên hệ về quyền riêng tư',
    content: `Nếu có thắc mắc về chính sách bảo mật, liên hệ: Email: support@cleanconnect.vn — Hotline: 1800 1234 — Địa chỉ: 3 Cầu Giấy, Hà Nội. Chúng tôi sẽ phản hồi trong vòng 5 ngày làm việc.`,
  },
];

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState('terms');
  const sections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SEO
        title="Điều khoản & Chính sách bảo mật"
        description="Điều khoản sử dụng dịch vụ và chính sách bảo mật của CleanConnect. Cam kết bảo vệ quyền lợi người dùng và người giúp việc."
        canonical="/terms"
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">
          {activeTab === 'terms' ? 'Điều khoản sử dụng' : 'Chính sách bảo mật'}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Điều khoản & Chính sách</h1>
        <p className="text-gray-500">Cập nhật lần cuối: 01/01/2026</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Notice */}
      <div className={`flex items-start gap-3 p-4 rounded-xl mb-8 border ${
        activeTab === 'terms'
          ? 'bg-blue-50 border-blue-100'
          : 'bg-green-50 border-green-100'
      }`}>
        {activeTab === 'terms'
          ? <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          : <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        }
        <p className={`text-sm leading-relaxed ${
          activeTab === 'terms' ? 'text-blue-700' : 'text-green-700'
        }`}>
          {activeTab === 'terms'
            ? 'Vui lòng đọc kỹ các điều khoản này trước khi sử dụng dịch vụ. Việc tiếp tục sử dụng CleanConnect đồng nghĩa bạn đã đọc và chấp nhận toàn bộ điều khoản.'
            : 'Chúng tôi coi trọng quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.'
          }
        </p>
      </div>

      {/* Content */}
      <div className="space-y-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {sections.map((section, i) => (
          <div key={i} className={`p-6 ${i < sections.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <h2 className="font-bold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm mb-4">
          Có câu hỏi về {activeTab === 'terms' ? 'điều khoản' : 'chính sách bảo mật'}?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/help"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 border-2 border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 font-medium text-sm rounded-xl transition-colors"
          >
            Xem FAQ
          </Link>
          <a
            href="mailto:support@cleanconnect.vn"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
}
