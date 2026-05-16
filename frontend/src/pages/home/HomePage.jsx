import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllServicesApi } from '../../api/service.api';
import { formatPrice } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

// Icon cho từng dịch vụ
const SERVICE_ICONS = [
  { bg: 'from-orange-400 to-orange-600', emoji: '🧹', light: 'bg-orange-50' },
  { bg: 'from-blue-400 to-blue-600',   emoji: '🪟', light: 'bg-blue-50'   },
  { bg: 'from-green-400 to-green-600', emoji: '🌿', light: 'bg-green-50'  },
  { bg: 'from-purple-400 to-purple-600', emoji: '👕', light: 'bg-purple-50'},
  { bg: 'from-pink-400 to-pink-600',   emoji: '🍳', light: 'bg-pink-50'   },
  { bg: 'from-yellow-400 to-yellow-600', emoji: '✨', light: 'bg-yellow-50'},
  { bg: 'from-teal-400 to-teal-600',   emoji: '🚿', light: 'bg-teal-50'   },
  { bg: 'from-red-400 to-red-600',     emoji: '🛁', light: 'bg-red-50'    },
];

const STATS = [
  { value: '50.000+', label: 'Khách hàng tin dùng', icon: '👥' },
  { value: '98%',     label: 'Tỷ lệ hài lòng',      icon: '⭐' },
  { value: '500+',    label: 'Người giúp việc',      icon: '🧹' },
  { value: '3 phút',  label: 'Đặt lịch nhanh chóng', icon: '⚡' },
];

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Đã xác minh danh tính',
    desc: 'Mọi người giúp việc đều được kiểm tra CCCD và lý lịch trước khi hoạt động trên nền tảng.',
    color: 'from-green-400 to-teal-500',
  },
  {
    icon: '⭐',
    title: 'Đánh giá minh bạch',
    desc: 'Hệ thống đánh giá 2 chiều giúp bạn chọn được người phù hợp nhất với nhu cầu.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: '💳',
    title: 'Giá cả rõ ràng',
    desc: 'Giá hiển thị đầy đủ trước khi đặt, không phát sinh phí ẩn. Thanh toán linh hoạt.',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    icon: '📍',
    title: 'Check-in/Check-out GPS',
    desc: 'Theo dõi thời gian làm việc thực tế, đảm bảo quyền lợi và minh bạch cho cả hai bên.',
    color: 'from-pink-400 to-rose-500',
  },
];

const TESTIMONIALS = [
  {
    name: 'Nguyễn Thị Lan',
    location: 'Hà Nội',
    avatar: 'L',
    rating: 5,
    text: 'Dịch vụ rất tốt! Chị giúp việc đến đúng giờ, làm việc tỉ mỉ. Tôi đặt lịch định kỳ hàng tuần luôn rồi.',
    service: 'Dọn dẹp nhà',
  },
  {
    name: 'Trần Văn Minh',
    location: 'Hà Nội',
    avatar: 'M',
    rating: 5,
    text: 'Ứng dụng dễ dùng, đặt lịch chỉ mất 2 phút. Người giúp việc được xác minh nên rất yên tâm.',
    service: 'Nấu ăn theo giờ',
  },
  {
    name: 'Phạm Thị Hoa',
    location: 'Hà Nội',
    avatar: 'H',
    rating: 5,
    text: 'Lần đầu dùng dịch vụ đã thích ngay. Giá cả hợp lý, nhân viên thân thiện. Sẽ tiếp tục ủng hộ!',
    service: 'Giặt ủi quần áo',
  },
];

const CITIES = ['Hà Nội'];

// Hook đếm số lên animation
function useCountUp(target, duration = 1500, shouldStart = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    const num = parseInt(target.replace(/\D/g, '')) || 0;
    if (!num) { setCount(target); return; }
    let start = 0;
    const step = Math.ceil(num / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(target); clearInterval(timer); }
      else setCount(start.toLocaleString('vi-VN') + (target.includes('+') ? '+' : '') + (target.includes('%') ? '%' : ''));
    }, 16);
    return () => clearInterval(timer);
  }, [shouldStart]);
  return count || target;
}

function StatItem({ value, label, icon, shouldStart }) {
  const displayed = useCountUp(value, 1200, shouldStart);
  return (
    <div className="text-center group">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-orange-500 transition-colors">
        {displayed}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(CITIES[0]);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    getAllServicesApi()
      .then(({ data }) => setServices(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Kích hoạt đếm số khi stats section hiện ra viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleServiceClick = (serviceId) => {
    navigate(`/bookings/new?serviceId=${serviceId}`);
  };

  return (
    <div className="animate-fadeIn -mt-2">

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white mb-10 shadow-2xl">
        {/* Background decoration */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-sm" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-10 right-40 w-20 h-20 bg-white/10 rounded-full" />
        <div className="absolute bottom-10 right-10 w-12 h-12 bg-white/15 rounded-full" />

        <div className="relative px-6 py-14 md:py-20 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Đang phục vụ tại Hà Nội
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Giúp việc gia đình<br />
            <span className="text-orange-200">theo giờ, tiện lợi</span>
          </h1>
          <p className="text-orange-100 text-lg mb-8 max-w-xl leading-relaxed">
            Đặt lịch trong 3 phút. Người giúp việc được xác minh CCCD đến tận nhà bạn.
            Minh bạch, uy tín, giá cả rõ ràng.
          </p>

          {/* Quick booking form */}
          <div className="bg-white rounded-2xl p-3 shadow-2xl max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <span className="text-gray-400 text-lg">📍</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent text-gray-700 text-sm font-medium flex-1 focus:outline-none"
                >
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <span className="text-gray-400 text-lg">🧹</span>
                <select className="bg-transparent text-gray-700 text-sm font-medium flex-1 focus:outline-none">
                  <option value="">Chọn dịch vụ...</option>
                  {services.map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>{s.serviceName}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all active:scale-95 whitespace-nowrap text-sm shadow-md"
              >
                Tìm ngay
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-orange-100">
            <span className="flex items-center gap-1.5"><span>✅</span> Xác minh CCCD</span>
            <span className="flex items-center gap-1.5"><span>💰</span> Giá minh bạch</span>
            <span className="flex items-center gap-1.5"><span>⚡</span> Đặt lịch 3 phút</span>
            <span className="flex items-center gap-1.5"><span>🔒</span> Bảo hiểm công việc</span>
          </div>
        </div>
      </section>

      {/* ─── STATS ───────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} shouldStart={statsVisible} />
          ))}
        </div>
      </section>

      {/* ─── DỊCH VỤ ─────────────────────────────────────────────── */}
      <section id="services" className="mb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-wide mb-1">Dịch vụ của chúng tôi</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Chọn dịch vụ phù hợp</h2>
            <p className="text-gray-500 text-sm mt-1">Đặt lịch nhanh chóng, người làm uy tín</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-40 animate-pulse border border-gray-100">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {services.map((svc, idx) => {
              const { bg, emoji, light } = SERVICE_ICONS[idx % SERVICE_ICONS.length];
              return (
                <button
                  key={svc.serviceId}
                  onClick={() => handleServiceClick(svc.serviceId)}
                  className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-300 text-left active:scale-[0.98]"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {emoji}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-orange-600 transition-colors">{svc.serviceName}</h3>
                  {svc.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{svc.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-orange-500 font-bold text-sm">
                      Từ {formatPrice(svc.basePrice)}/giờ
                    </span>
                    <span className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all duration-200">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── QUY TRÌNH ───────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wide mb-1">Đơn giản & nhanh chóng</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Chỉ 3 bước để có nhà sạch</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-14 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200" />

          {[
            { step: '01', icon: '🔍', title: 'Chọn dịch vụ', desc: 'Chọn loại dịch vụ và xem danh sách người giúp việc được xếp hạng phù hợp.', color: 'bg-orange-500' },
            { step: '02', icon: '📅', title: 'Đặt lịch hẹn',  desc: 'Chọn ngày giờ, địa chỉ, phương thức thanh toán và xác nhận trong vài giây.', color: 'bg-orange-500' },
            { step: '03', icon: '✅', title: 'Nghỉ ngơi thôi!', desc: 'Người giúp việc đến đúng giờ. Đánh giá sau khi hoàn thành để giúp cộng đồng.', color: 'bg-orange-500' },
          ].map(({ step, icon, title, desc, color }) => (
            <div key={step} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="absolute top-4 right-5 text-6xl font-black text-gray-50 select-none leading-none">{step}</div>
              <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-md`}>
                {icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VÌ SAO CHỌN CHÚNG TÔI ──────────────────────────────── */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wide mb-1">Cam kết chất lượng</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tại sao chọn ConnectClean?</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map(({ icon, title, desc, color }) => (
            <div key={title} className="group flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all duration-200">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-base">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ĐÁNH GIÁ KHÁCH HÀNG ────────────────────────────────── */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wide mb-1">Khách hàng nói gì?</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Hàng nghìn khách tin dùng mỗi ngày</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {/* Quote */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              {/* User */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location} · {t.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ĐĂNG KÝ LÀM NGƯỜI GIÚP VIỆC ───────────────────────── */}
      <section className="mb-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 md:p-10 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-wide mb-2">Cơ hội việc làm</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Trở thành người giúp việc</h2>
            <p className="text-gray-300 text-sm max-w-md">
              Thu nhập từ 120.000đ/giờ. Lịch làm việc linh hoạt, chủ động nhận việc qua app.
              Đã có hơn <strong className="text-orange-400">500 người</strong> đang làm việc cùng chúng tôi.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-300">
              <span className="flex items-center gap-1.5">✅ Thu nhập ổn định</span>
              <span className="flex items-center gap-1.5">✅ Lịch linh hoạt</span>
              <span className="flex items-center gap-1.5">✅ Được đào tạo</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link
              to="/register/helper"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 text-center"
            >
              Đăng ký ngay →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA CUỐI ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-10 text-center text-white mb-2">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Sẵn sàng có ngôi nhà sạch sẽ?</h2>
        <p className="text-orange-100 mb-6 max-w-md mx-auto">
          {user?.userType === 'customer'
            ? 'Chọn dịch vụ và đặt lịch ngay bây giờ!'
            : 'Đăng ký miễn phí và đặt lịch đầu tiên ngay hôm nay.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user?.userType === 'customer' ? (
            <button
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-block bg-white text-orange-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-orange-50 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              Chọn dịch vụ ngay
            </button>
          ) : (
            <>
              <Link
                to={user ? '/' : '/register/customer'}
                className="inline-block bg-white text-orange-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-orange-50 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                {user ? 'Xem dịch vụ' : 'Đăng ký — Miễn phí'}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="inline-block bg-white/20 backdrop-blur-sm text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-white/30 transition-all border border-white/30"
                >
                  Đăng nhập
                </Link>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
