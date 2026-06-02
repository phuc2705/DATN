import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import {
  Users, Star, Calendar, ShieldCheck, Heart, Target, Award,
  Phone, Mail, MapPin, Home, ArrowRight,
} from 'lucide-react';

// Số liệu điều chỉnh theo quy mô pilot tại Hà Nội
// Tham khảo: BTaskee VnExpress 8/2024; GSO Q4/2024; ILO Vietnam
const STATS = [
  { value: '1.200+', label: 'Khách hàng tin dùng',      Icon: Users,      color: 'text-blue-500',   bg: 'bg-blue-50' },
  { value: '85+',    label: 'Người giúp việc xác minh', Icon: ShieldCheck, color: 'text-green-500',  bg: 'bg-green-50' },
  { value: '97%',    label: 'Tỷ lệ hài lòng',           Icon: Star,        color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { value: '4.500+', label: 'Lịch đã hoàn thành',       Icon: Calendar,    color: 'text-orange-500', bg: 'bg-orange-50' },
];

const VALUES = [
  {
    Icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50',
    title: 'Minh bạch & Tin cậy',
    desc: 'Mọi người giúp việc đều được xác minh danh tính, kiểm tra lý lịch. Chúng tôi không giấu bất kỳ thông tin nào — giá cả, lịch sử công việc, đánh giá đều hiển thị rõ ràng.',
  },
  {
    Icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50',
    title: 'Tận tâm phục vụ',
    desc: 'Chúng tôi không chỉ là một app đặt lịch. Chúng tôi kết nối những con người thật — người cần sự hỗ trợ và người muốn tạo thu nhập bền vững bằng kỹ năng của mình.',
  },
  {
    Icon: Target, color: 'text-purple-600', bg: 'bg-purple-50',
    title: 'Chất lượng đồng đều',
    desc: 'Hệ thống đánh giá 2 chiều và thuật toán matching thông minh đảm bảo mỗi ca làm việc đều đạt chất lượng tốt nhất, phù hợp nhất với nhu cầu của từng khách hàng.',
  },
  {
    Icon: Award, color: 'text-orange-600', bg: 'bg-orange-50',
    title: 'Trao quyền cho người lao động',
    desc: 'Người giúp việc chủ động chọn ca làm, tự đặt lịch, và nhận được mức thu nhập công bằng. Chúng tôi tin rằng một nền kinh tế chia sẻ lành mạnh phải có lợi cho tất cả các bên.',
  },
];

const TEAM = [
  { name: 'Nguyễn Trọng Phúc', role: 'Founder & Developer', avatar: 'P', bg: 'from-orange-400 to-orange-600', desc: 'Sinh viên CNTT, đam mê xây dựng sản phẩm công nghệ giải quyết vấn đề thực tế trong cuộc sống.' },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SEO
        title="Về CleanConnect – Nền tảng giúp việc gia đình"
        description="CleanConnect là nền tảng số hóa dịch vụ giúp việc gia đình theo giờ tại Hà Nội. Kết nối khách hàng với người giúp việc được xác minh danh tính, giá minh bạch."
        canonical="/about"
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Về chúng tôi</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-sm font-semibold px-4 py-2 rounded-full border border-orange-100 mb-5">
          <Heart className="w-4 h-4 fill-orange-500 text-orange-500" />
          Được làm với tâm huyết
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Kết nối gia đình Việt<br />với dịch vụ giúp việc đáng tin
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          CleanConnect ra đời để giải quyết bài toán đau đầu của hàng triệu gia đình Việt Nam:
          tìm người giúp việc uy tín, giá minh bạch, đúng giờ và dễ dàng đặt lịch.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 md:p-12 text-white mb-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <p className="text-orange-200 text-sm font-semibold uppercase tracking-wider mb-3">Sứ mệnh</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            "Số hóa dịch vụ giúp việc gia đình,<br className="hidden md:block" />
            tạo ra giá trị bền vững cho cả hai phía"
          </h2>
          <p className="text-orange-100 max-w-xl leading-relaxed">
            Chúng tôi tin rằng công nghệ có thể làm cho cuộc sống gia đình tiện lợi hơn, đồng thời
            tạo ra cơ hội việc làm chính đáng và thu nhập ổn định cho người lao động phổ thông.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {STATS.map(({ value, label, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Câu chuyện của chúng tôi</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4 text-gray-600 leading-relaxed">
          <p>
            Theo ILO (2023), chỉ <strong className="text-gray-900">19%</strong> lao động giúp việc tại Việt Nam
            tiếp cận việc làm qua kênh chính thức — phần còn lại chủ yếu qua mạng xã hội, Zalo nhóm và
            truyền miệng. Điều này dẫn đến thiếu minh bạch về giá, không có cơ chế đánh giá tin cậy,
            và khó kiểm soát chất lượng. CleanConnect ra đời để giải quyết bài toán này.
          </p>
          <p>
            Nền tảng được xây dựng với trọng tâm là <strong className="text-gray-900">giá cả minh bạch — hiển thị đầy đủ trước khi đặt</strong>,
            <strong className="text-gray-900"> xác minh danh tính nghiêm ngặt</strong> (CCCD + lý lịch tư pháp),
            và <strong className="text-gray-900"> theo dõi công việc thực tế</strong> qua hệ thống check-in/check-out GPS.
            Khung giá tham khảo thị trường hiện tại: <strong className="text-gray-900">80.000–150.000 đ/giờ</strong> cho dịch vụ dọn dẹp
            (VietnamTeachingJobs.com, 11/2024).
          </p>
          <p>
            Thuật toán matching tự động ghép cặp dựa trên điểm đánh giá, kinh nghiệm, khu vực và
            lịch trống — giảm thiểu thời gian chờ và tăng chất lượng từng ca làm việc.
            Người giúp việc nhận <strong className="text-gray-900">65.000–95.000 đ/giờ</strong>,
            tương đương mô hình chia sẻ doanh thu ~78% như các nền tảng tương tự tại Việt Nam.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Giá trị cốt lõi</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {VALUES.map(({ Icon, color, bg, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Đội ngũ</h2>
        <div className="flex flex-wrap gap-5">
          {TEAM.map(({ name, role, avatar, bg, desc }) => (
            <div key={name} className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 max-w-md">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                {avatar}
              </div>
              <div>
                <p className="font-bold text-gray-900">{name}</p>
                <p className="text-sm text-orange-500 font-medium mb-2">{role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Liên hệ</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { Icon: Phone, label: 'Hotline', value: '1800 1234', href: 'tel:18001234' },
            { Icon: Mail, label: 'Email', value: 'support@cleanconnect.vn', href: 'mailto:support@cleanconnect.vn' },
            { Icon: MapPin, label: 'Địa chỉ', value: '3 Cầu Giấy, Hà Nội', href: '#' },
          ].map(({ Icon, label, value, href }) => (
            <a key={label} href={href} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 transition-colors group">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                <Icon className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/help"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 border-2 border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 font-medium text-sm rounded-xl transition-colors"
          >
            Câu hỏi thường gặp
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Đặt lịch ngay
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
