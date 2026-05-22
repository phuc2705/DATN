import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, ArrowLeft, Search, ClipboardList } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickLinks = [
    { to: '/', Icon: Home, label: 'Trang chủ', desc: 'Khám phá dịch vụ' },
    ...(user?.userType === 'customer'
      ? [{ to: '/bookings', Icon: ClipboardList, label: 'Đơn hàng của tôi', desc: 'Xem lịch đặt' }]
      : []),
    { to: '/services/1', Icon: Search, label: 'Xem dịch vụ', desc: 'Dọn dẹp nhà theo giờ' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="text-[120px] font-extrabold text-gray-100 leading-none select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
        </div>
      </div>

      {/* Text */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
        Trang không tồn tại
      </h1>
      <p className="text-gray-500 text-base text-center max-w-sm mb-8 leading-relaxed">
        Trang bạn đang tìm kiếm có thể đã bị di chuyển, xóa hoặc không tồn tại.
        Hãy kiểm tra lại địa chỉ URL hoặc quay về trang chủ.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 border-2 border-gray-200 text-gray-700 font-medium text-sm rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>

      {/* Quick links */}
      <div className="w-full max-w-sm">
        <p className="text-xs text-gray-400 text-center uppercase tracking-wider mb-4 font-semibold">
          Có thể bạn muốn đến
        </p>
        <div className="space-y-2">
          {quickLinks.map(({ to, Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center flex-shrink-0 transition-colors">
                <Icon className="w-4 h-4 text-gray-500 group-hover:text-orange-500 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
