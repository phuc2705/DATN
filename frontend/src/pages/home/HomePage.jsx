import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllServicesApi } from '../../api/service.api';
import { getRecentReviewsApi } from '../../api/review.api';
import { formatPrice } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import SEO from '../../components/common/SEO';
import {
  Sparkles, Shirt, ChefHat, Baby, HeartHandshake, Building2,
  Wind, Droplets, PawPrint, Briefcase, Zap, Home, Layers,
  Users, ShieldCheck, CreditCard, MapPin, Star,
  Search, Calendar, CheckCircle, Check,
  ArrowRight, X, ChevronDown, Heart,
} from 'lucide-react';

// Ánh xạ slug dịch vụ → icon + màu gradient
const SERVICE_ICON_MAP = {
  'giup-viec-theo-gio':            { Icon: Sparkles,       bg: 'from-orange-400 to-orange-600'   },
  'giup-viec-dinh-ky':             { Icon: Home,           bg: 'from-amber-400 to-amber-600'     },
  'nau-an-gia-dinh':               { Icon: ChefHat,        bg: 'from-red-400 to-red-600'         },
  'trong-tre-tai-nha':             { Icon: Baby,           bg: 'from-pink-400 to-pink-600'       },
  'cham-soc-nguoi-cao-tuoi':       { Icon: HeartHandshake, bg: 'from-rose-400 to-rose-600'       },
  'tong-ve-sinh-deep-clean':       { Icon: Sparkles,       bg: 'from-blue-400 to-blue-600'       },
  've-sinh-sofa-nem-rem':          { Icon: Layers,         bg: 'from-violet-400 to-violet-600'   },
  've-sinh-dieu-hoa':              { Icon: Wind,           bg: 'from-sky-400 to-sky-600'         },
  've-sinh-may-giat-thiet-bi-bep': { Icon: Droplets,       bg: 'from-teal-400 to-teal-600'       },
  'cham-soc-thu-cung':             { Icon: PawPrint,       bg: 'from-lime-400 to-lime-600'       },
  've-sinh-van-phong-shop':        { Icon: Briefcase,      bg: 'from-indigo-400 to-indigo-600'   },
  'phun-khu-khuan-con-trung':      { Icon: Zap,            bg: 'from-green-400 to-green-600'     },
};
const DEFAULT_ICON = { Icon: Sparkles, bg: 'from-gray-400 to-gray-600' };
const getIconBySlug = (slug) => SERVICE_ICON_MAP[slug] || DEFAULT_ICON;

const SLUG_PHOTOS = {
  'giup-viec-theo-gio':            'https://plus.unsplash.com/premium_photo-1679500354595-0feead204a28?w=480&h=320&fit=crop&auto=format&q=80',
  'giup-viec-dinh-ky':             'https://plus.unsplash.com/premium_photo-1678304224523-d25b4117558f?w=480&h=320&fit=crop&auto=format&q=80',
  'nau-an-gia-dinh':               'https://plus.unsplash.com/premium_photo-1694714103696-25e10d1b907e?w=480&h=320&fit=crop&auto=format&q=80',
  'trong-tre-tai-nha':             'https://plus.unsplash.com/premium_photo-1661281306510-eee6c942a838?w=480&h=320&fit=crop&auto=format&q=80',
  'cham-soc-nguoi-cao-tuoi':       'https://plus.unsplash.com/premium_photo-1663036976879-4baf18adfd5b?w=480&h=320&fit=crop&auto=format&q=80',
  'tong-ve-sinh-deep-clean':       'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=480&h=320&fit=crop&auto=format&q=80',
  've-sinh-sofa-nem-rem':          'https://images.unsplash.com/photo-1686178827149-6d55c72d81df?w=480&h=320&fit=crop&auto=format&q=80',
  've-sinh-dieu-hoa':              'https://plus.unsplash.com/premium_photo-1679943423706-570c6462f9a4?w=480&h=320&fit=crop&auto=format&q=80',
  've-sinh-may-giat-thiet-bi-bep': 'https://plus.unsplash.com/premium_photo-1667520405114-47d3677f966e?w=480&h=320&fit=crop&auto=format&q=80',
  'cham-soc-thu-cung':             'https://plus.unsplash.com/premium_photo-1663012822996-ba7e04f3627a?w=480&h=320&fit=crop&auto=format&q=80',
  've-sinh-van-phong-shop':        'https://plus.unsplash.com/premium_photo-1663011218145-c1d0c3ba3542?w=480&h=320&fit=crop&auto=format&q=80',
  'phun-khu-khuan-con-trung':      'https://images.unsplash.com/photo-1593999094742-4f5280054b23?w=480&h=320&fit=crop&auto=format&q=80',
};

// Nhóm dịch vụ theo loại
const SERVICE_GROUPS = [
  {
    id: 'housework',
    label: 'Dọn dẹp & Giúp việc',
    Icon: Home,
    chipColor: 'blue',
    slugs: ['giup-viec-theo-gio', 'giup-viec-dinh-ky', 'tong-ve-sinh-deep-clean'],
  },
  {
    id: 'care',
    label: 'Dịch vụ chăm sóc',
    Icon: Heart,
    chipColor: 'pink',
    slugs: ['trong-tre-tai-nha', 'cham-soc-nguoi-cao-tuoi', 'cham-soc-thu-cung'],
  },
  {
    id: 'cooking',
    label: 'Nấu ăn',
    Icon: ChefHat,
    chipColor: 'orange',
    slugs: ['nau-an-gia-dinh'],
  },
  {
    id: 'equipment',
    label: 'Vệ sinh thiết bị',
    Icon: Wrench,
    chipColor: 'teal',
    slugs: ['ve-sinh-sofa-nem-rem', 've-sinh-dieu-hoa', 've-sinh-may-giat-thiet-bi-bep'],
  },
  {
    id: 'office',
    label: 'Văn phòng & Khử khuẩn',
    Icon: ShieldCheck,
    chipColor: 'purple',
    slugs: ['ve-sinh-van-phong-shop', 'phun-khu-khuan-con-trung'],
  },
];

const STATS = [
  { value: '120+',    label: 'Khách hàng tin dùng',       Icon: Users,    color: 'text-blue-500',   bg: 'bg-blue-50 group-hover:bg-blue-500' },
  { value: '95%',     label: 'Tỷ lệ hài lòng',            Icon: Star,     color: 'text-yellow-500', bg: 'bg-yellow-50 group-hover:bg-yellow-500' },
  { value: '20+',     label: 'Người giúp việc xác minh',   Icon: Sparkles, color: 'text-orange-500', bg: 'bg-orange-50 group-hover:bg-orange-500' },
  { value: '350+',    label: 'Lịch đã hoàn thành',         Icon: Calendar, color: 'text-green-500',  bg: 'bg-green-50 group-hover:bg-green-500' },
];

const FEATURES = [
  {
    Icon: ShieldCheck, title: 'Đã xác minh danh tính',
    desc: 'Mọi người giúp việc đều được kiểm tra CCCD và lý lịch trước khi hoạt động trên nền tảng.',
    color: 'from-green-400 to-teal-500',
  },
  {
    Icon: Star, title: 'Đánh giá minh bạch',
    desc: 'Hệ thống đánh giá 2 chiều giúp bạn chọn được người phù hợp nhất với nhu cầu.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    Icon: CreditCard, title: 'Giá cả rõ ràng',
    desc: 'Giá hiển thị đầy đủ trước khi đặt, không phát sinh phí ẩn. Thanh toán linh hoạt.',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    Icon: MapPin, title: 'Check-in/Check-out GPS',
    desc: 'Theo dõi thời gian làm việc thực tế, đảm bảo quyền lợi và minh bạch cho cả hai bên.',
    color: 'from-pink-400 to-rose-500',
  },
];

const TESTIMONIALS_FALLBACK = [
  {
    customerName: 'Nguyễn Thị Lan', location: 'Q. Cầu Giấy, Hà Nội', rating: 5,
    comment: 'Chị Hương đến đúng giờ, làm rất kỹ. Nhà hơn 80m² mà sạch bong trong 3 tiếng. Đặt lịch tuần nào cũng ổn, tiện lắm!',
    serviceName: 'Dọn dẹp nhà',
  },
  {
    customerName: 'Trần Văn Minh', location: 'Q. Đống Đa, Hà Nội', rating: 5,
    comment: 'Đặt lịch qua app chỉ mất 2–3 phút. Mấy ngày bận không nấu được, gọi dịch vụ nấu cơm về nhà — cả nhà ai cũng khen ngon.',
    serviceName: 'Nấu ăn theo giờ',
  },
  {
    customerName: 'Lê Thị Mai', location: 'Q. Long Biên, Hà Nội', rating: 4,
    comment: 'Giá hợp lý, chị làm việc chăm chỉ và thân thiện. Chỉ có lần đầu chờ xác nhận hơi lâu, nhưng nói chung rất hài lòng, sẽ dùng lại.',
    serviceName: 'Giặt ủi',
  },
];

const CITIES = ['Hà Nội'];

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

function StatItem({ value, label, Icon, color, bg, shouldStart }) {
  const displayed = useCountUp(value, 1200, shouldStart);
  return (
    <div className="text-center group">
      <div className={`w-12 h-12 ${bg} transition-all rounded-2xl flex items-center justify-center mx-auto mb-3`}>
        <Icon className={`w-6 h-6 ${color} group-hover:text-white transition-colors`} />
      </div>
      <div className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-orange-500 transition-colors">
        {displayed}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function ServiceCard({ svc, idx, onClick }) {
  const { bg, Icon } = getIconBySlug(svc.slug);
  const photo = SLUG_PHOTOS[svc.slug] || null;
  return (
    <button
      onClick={() => onClick(svc.serviceId)}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all duration-300 text-left active:scale-[0.98]"
    >
      <div className="relative w-full h-40 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={svc.serviceName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
            <Icon className="w-12 h-12 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-3 text-white text-xs font-semibold drop-shadow">
          Từ {formatPrice(svc.basePrice)}/{svc.priceUnit || 'giờ'}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">
          {svc.serviceName}
        </h3>
        {(svc.shortDescription || svc.description) && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {svc.shortDescription || svc.description}
          </p>
        )}
      </div>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [city, setCity]                   = useState(CITIES[0]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [activeGroup, setActiveGroup]     = useState('all');
  const [activeServiceFilter, setActiveServiceFilter] = useState([]);
  const [statsVisible, setStatsVisible]   = useState(false);
  const statsRef          = useRef(null);
  const serviceDropdownRef = useRef(null);
  const [testimonials, setTestimonials]   = useState(TESTIMONIALS_FALLBACK);

  useEffect(() => {
    getAllServicesApi()
      .then(({ data }) => setServices(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getRecentReviewsApi(6)
      .then(({ data }) => {
        const list = data.data || [];
        if (list.length === 0) return;
        const padded = list.length >= 3
          ? list.slice(0, 6)
          : [...list, ...TESTIMONIALS_FALLBACK.slice(list.length)];
        setTestimonials(padded);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target))
        setServiceDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleServiceClick = (serviceId) => navigate(`/services/${serviceId}`);

  const toggleServiceId = (id) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleHeroSearch = () => {
    setActiveServiceFilter([...selectedServiceIds]);
    setActiveGroup('all');
    setServiceDropdownOpen(false);
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearFilter = () => {
    setActiveServiceFilter([]);
    setSelectedServiceIds([]);
  };

  const handleGroupTab = (groupId) => {
    setActiveGroup(groupId);
    // Xóa hero filter khi chọn nhóm
    if (groupId !== 'all') {
      setActiveServiceFilter([]);
      setSelectedServiceIds([]);
    }
  };

  // Dịch vụ sau khi lọc theo hero search
  const heroFiltered = activeServiceFilter.length > 0
    ? services.filter(s => activeServiceFilter.includes(s.serviceId))
    : services;

  // Dịch vụ sau khi lọc theo nhóm tab
  const filteredServices = activeGroup === 'all'
    ? heroFiltered
    : heroFiltered.filter(s => {
        const g = SERVICE_GROUPS.find(g => g.id === activeGroup);
        return g ? g.slugs.includes(s.slug) : true;
      });

  // Dịch vụ theo nhóm để render khi "Tất cả"
  const servicesByGroup = SERVICE_GROUPS.map(g => ({
    ...g,
    services: heroFiltered.filter(s => g.slugs.includes(s.slug)),
  })).filter(g => g.services.length > 0);

  const selectedLabel = selectedServiceIds.length === 0
    ? 'Chọn dịch vụ...'
    : selectedServiceIds.length === 1
      ? services.find(s => s.serviceId === selectedServiceIds[0])?.serviceName
      : `${selectedServiceIds.length} dịch vụ đã chọn`;

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'CleanConnect',
    description: 'Nền tảng kết nối dịch vụ giúp việc gia đình theo giờ tại Hà Nội',
    url: 'https://connectclean.onrender.com',
    areaServed: { '@type': 'City', name: 'Hà Nội' },
    serviceType: 'Dịch vụ giúp việc gia đình',
    priceRange: 'từ 80.000đ/giờ',
  };

  return (
    <div className="animate-fadeIn -mt-2">
      <SEO
        canonical="/"
        jsonLd={homeJsonLd}
      />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white mb-10 shadow-2xl">
        {/* Layer trang trí riêng — overflow-hidden chỉ clip các hình tròn, không ảnh hưởng dropdown */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-10 right-40 w-20 h-20 bg-white/10 rounded-full" />
          <div className="absolute bottom-10 right-10 w-12 h-12 bg-white/15 rounded-full" />
        </div>

        <div className="relative px-6 py-14 md:py-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Đang phục vụ tại Hà Nội
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Giúp việc gia đình<br />
            <span className="text-orange-200">theo giờ, tiện lợi</span>
          </h1>
          <p className="text-orange-100 text-lg mb-8 max-w-xl leading-relaxed">
            Đặt lịch trong 3 phút. Người giúp việc được xác minh CCCD đến tận nhà bạn.
            Minh bạch, uy tín, giá cả rõ ràng.
          </p>

          {/* Search form */}
          <div className="bg-white rounded-2xl p-3 shadow-2xl max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Khu vực */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl sm:w-36 shrink-0">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="bg-transparent text-gray-700 text-sm font-medium w-full focus:outline-none">
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Chọn dịch vụ — checkbox dropdown theo nhóm */}
              <div ref={serviceDropdownRef} className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm text-left"
                >
                  <Sparkles className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className={`flex-1 truncate font-medium ${selectedServiceIds.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selectedLabel}
                  </span>
                  {selectedServiceIds.length > 0 ? (
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700 shrink-0"
                      onClick={e => { e.stopPropagation(); setSelectedServiceIds([]); setActiveServiceFilter([]); }}
                    />
                  ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${serviceDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {serviceDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full min-w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 rounded-t-2xl">
                      <p className="text-xs text-gray-500 font-medium">Chọn một hoặc nhiều dịch vụ</p>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {SERVICE_GROUPS.map(group => {
                        const groupSvcs = services.filter(s => group.slugs.includes(s.slug));
                        if (!groupSvcs.length) return null;
                        return (
                          <div key={group.id}>
                            {/* Group header */}
                            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                              <group.Icon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {group.label}
                              </span>
                            </div>
                            {/* Services in group */}
                            {groupSvcs.map(s => {
                              const checked = selectedServiceIds.includes(s.serviceId);
                              return (
                                <label
                                  key={s.serviceId}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors"
                                >
                                  <div
                                    onClick={() => toggleServiceId(s.serviceId)}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                      checked
                                        ? 'bg-orange-500 border-orange-500'
                                        : 'border-gray-300 hover:border-orange-400'
                                    }`}
                                  >
                                    {checked && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="text-sm text-gray-700 flex-1">{s.serviceName}</span>
                                  <span className="text-xs text-gray-400 shrink-0">
                                    {formatPrice(s.basePrice)}/{s.priceUnit || 'giờ'}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {selectedServiceIds.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-gray-100 bg-orange-50/60 flex items-center justify-between rounded-b-2xl">
                        <span className="text-xs text-orange-600 font-medium">
                          Đã chọn {selectedServiceIds.length} dịch vụ
                        </span>
                        <button
                          onClick={() => setSelectedServiceIds([])}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleHeroSearch}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all active:scale-95 whitespace-nowrap text-sm shadow-md"
              >
                Tìm ngay
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-orange-100">
            {[
              { Icon: CheckCircle, text: 'Xác minh CCCD' },
              { Icon: CreditCard,  text: 'Giá minh bạch' },
              { Icon: Zap,         text: 'Đặt lịch 3 phút' },
              { Icon: ShieldCheck, text: 'Bảo hiểm công việc' },
            ].map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ───────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => <StatItem key={s.label} {...s} shouldStart={statsVisible} />)}
        </div>
      </section>

      {/* ─── DỊCH VỤ ─────────────────────────────────────────────── */}
      <section id="services" className="mb-12">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-wide mb-1">Dịch vụ của chúng tôi</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Chọn dịch vụ phù hợp</h2>
            <p className="text-gray-500 text-sm mt-1">
              {activeServiceFilter.length > 0
                ? `Hiển thị ${filteredServices.length} / ${services.length} dịch vụ`
                : 'Đặt lịch nhanh chóng, người làm uy tín'}
            </p>
          </div>
          {activeServiceFilter.length > 0 && (
            <button
              onClick={clearFilter}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-orange-500 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Tab lọc theo nhóm dịch vụ */}
        {!loading && services.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => handleGroupTab('all')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                activeGroup === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              Tất cả
            </button>
            {SERVICE_GROUPS.map(g => (
              <button
                key={g.id}
                onClick={() => handleGroupTab(g.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  activeGroup === g.id
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                <g.Icon className="w-3.5 h-3.5" />
                {g.label}
              </button>
            ))}
          </div>
        )}

        {/* Nội dung dịch vụ */}
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
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy dịch vụ phù hợp.</p>
            <button onClick={() => { clearFilter(); setActiveGroup('all'); }} className="mt-3 text-orange-500 text-sm hover:underline">
              Xem tất cả dịch vụ
            </button>
          </div>
        ) : activeGroup === 'all' ? (
          /* Tất cả: chia theo nhóm với tiêu đề nhóm */
          <div className="space-y-8">
            {servicesByGroup.map(group => (
              <div key={group.id}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                    <group.Icon className="w-4 h-4 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-base">{group.label}</h3>
                  <div className="flex-1 h-px bg-gray-100 ml-1" />
                  <span className="text-xs text-gray-400">{group.services.length} dịch vụ</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {group.services.map((svc, idx) => (
                    <ServiceCard key={svc.serviceId} svc={svc} idx={idx} onClick={handleServiceClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Một nhóm cụ thể: grid phẳng */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {filteredServices.map((svc, idx) => (
              <ServiceCard key={svc.serviceId} svc={svc} idx={idx} onClick={handleServiceClick} />
            ))}
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
          <div className="hidden md:block absolute top-14 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200" />
          {[
            { step: '01', Icon: Search,      title: 'Chọn dịch vụ',    desc: 'Chọn loại dịch vụ và xem danh sách người giúp việc được xếp hạng phù hợp.' },
            { step: '02', Icon: Calendar,    title: 'Đặt lịch hẹn',    desc: 'Chọn ngày giờ, địa chỉ, phương thức thanh toán và xác nhận trong vài giây.' },
            { step: '03', Icon: CheckCircle, title: 'Nghỉ ngơi thôi!', desc: 'Người giúp việc đến đúng giờ. Đánh giá sau khi hoàn thành để giúp cộng đồng.' },
          ].map(({ step, Icon, title, desc }) => (
            <div key={step} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="absolute top-4 right-5 text-6xl font-black text-gray-50 select-none leading-none">{step}</div>
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <Icon className="w-8 h-8 text-white" />
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
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tại sao chọn CleanConnect?</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map(({ Icon, title, desc, color }) => (
            <div key={title} className="group flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all duration-200">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
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
          {testimonials.map((t, idx) => (
            <div key={t.reviewId ?? idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                  {t.customerAvatar
                    ? <img src={t.customerAvatar} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : t.customerName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t.customerName}</p>
                  <p className="text-xs text-gray-400">{t.location} · {t.serviceName}</p>
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
              Thu nhập từ <strong className="text-orange-400">65.000–95.000đ/giờ</strong>, nhận lương hàng tuần.
              Lịch làm việc linh hoạt, chủ động nhận ca qua app.
              Đã có hơn <strong className="text-orange-400">85 người</strong> đang làm việc cùng chúng tôi.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-300">
              {['Thu nhập ổn định', 'Lịch linh hoạt', 'Được đào tạo'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-400" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link to="/register/helper"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 text-center">
              Đăng ký ngay →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA CUỐI ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-10 text-center text-white mb-2">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-white" />
        </div>
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
              <Link to={user ? '/' : '/register/customer'}
                className="inline-block bg-white text-orange-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-orange-50 transition-all shadow-sm hover:shadow-md active:scale-95">
                {user ? 'Xem dịch vụ' : 'Đăng ký — Miễn phí'}
              </Link>
              {!user && (
                <Link to="/login"
                  className="inline-block bg-white/20 backdrop-blur-sm text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-white/30 transition-all border border-white/30">
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
