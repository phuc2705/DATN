import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getHelperProfileApi } from '../../api/user.api';
import { getHelperReviewsApi } from '../../api/review.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import SEO from '../../components/common/SEO';
import {
  Star, User, Sprout, Trophy, Frown, MessageCircle, ArrowLeft,
  CheckCircle2, MapPin, Briefcase, Clock, ChevronDown, ChevronUp,
  Calendar,
} from 'lucide-react';

const _API = import.meta.env.VITE_API_URL || '';
const resolveAvatar = (url) => (url?.startsWith('/uploads/') ? `${_API}${url}` : url);

const EXPERIENCE_LABEL = {
  beginner:     { text: 'Mới vào nghề',   color: 'bg-gray-100 text-gray-600',   Icon: Sprout  },
  intermediate: { text: 'Có kinh nghiệm', color: 'bg-blue-50 text-blue-600',    Icon: Briefcase },
  expert:       { text: 'Chuyên nghiệp',  color: 'bg-orange-50 text-orange-600', Icon: Trophy  },
};

const GENDER_LABEL = { female: 'Nữ', male: 'Nam', other: 'Khác' };

/* Tính tuổi từ ngày sinh */
function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/* Hàng sao đánh giá */
function StarRow({ rating, size = 'md' }) {
  const r = Number(rating) || 0;
  const filled = Math.round(r);
  const sz = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${
            i < filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

/* Skeleton cho trang hồ sơ */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-8 w-24 bg-gray-100 rounded-full animate-pulse mb-8" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex gap-5">
              <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-6 bg-gray-100 rounded-full w-2/5 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded-full w-3/5 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded-full w-1/3 animate-pulse" />
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
              <div className="h-4 bg-gray-100 rounded-full w-4/5 animate-pulse" />
            </div>
          </div>
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HelperProfilePage() {
  const { helperId }     = useParams();
  const [searchParams]   = useSearchParams();
  const serviceId        = searchParams.get('serviceId');
  const navigate         = useNavigate();
  const { user }         = useAuth();

  const [helper, setHelper]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getHelperProfileApi(helperId)
      .then(({ data: h }) => {
        if (!h.data) { setError(true); return; }
        setHelper(h.data);
        /* Lấy reviews riêng — nếu lỗi chỉ ẩn section reviews */
        getHelperReviewsApi(helperId)
          .then(({ data: r }) =>
            setReviews(Array.isArray(r.data?.reviews) ? r.data.reviews : [])
          )
          .catch(() => {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [helperId]);

  if (loading) return <ProfileSkeleton />;

  if (error || !helper) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4">
          <Frown className="w-8 h-8 text-[#6a6a6a]" />
        </div>
        <p className="text-[#222222] font-semibold text-lg mb-1">Không tìm thấy hồ sơ</p>
        <p className="text-[#6a6a6a] text-sm mb-5">
          Người giúp việc này không tồn tại hoặc đã bị gỡ.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 h-12 px-6 bg-[#222222] hover:bg-[#444444] text-white text-sm font-medium rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
      </div>
    );
  }

  const age            = calcAge(helper.dateOfBirth);
  const rating         = Number(helper.ratingAverage) || 0;
  const currentService = helper.services?.find(
    (s) => String(s.serviceId) === String(serviceId)
  );
  const displayedReviews  = showAllReviews  ? reviews       : reviews.slice(0, 4);
  const displayedServices = showAllServices ? helper.services : helper.services?.slice(0, 4);

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/bookings/new?helperId=${helperId}&serviceId=${serviceId || ''}`);
  };

  const helperJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: helper.fullName,
    jobTitle: 'Người giúp việc gia đình',
    worksFor: { '@type': 'Organization', name: 'CleanConnect' },
    ...(helper.rating > 0 && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: helper.rating, reviewCount: helper.totalReviews || 0 },
    }),
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${helper.fullName} – Người giúp việc`}
        description={`${helper.fullName} – ${helper.experienceYears ?? 0} năm kinh nghiệm, ${helper.totalBookings || 0} lần làm việc, đánh giá ${helper.rating}/5. Đặt lịch ngay trên CleanConnect.`}
        canonical={`/helpers/${helperId}`}
        jsonLd={helperJsonLd}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[#222222] text-sm font-medium hover:text-[#6a6a6a] transition-colors mb-8 group"
        >
          <span className="w-8 h-8 rounded-full bg-white border border-[#dddddd] flex items-center justify-center group-hover:border-[#222222] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
          Quay lại danh sách
        </button>

        {/* Layout 2 cột */}
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Cột trái (70%) ── */}
          <div className="flex-1 min-w-0">

            {/* === Header: avatar + tên + thông tin cơ bản === */}
            <div className="flex items-start gap-6 pb-8 border-b border-[#dddddd]">
              {/* Avatar lớn */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-[#dddddd]">
                {helper.avatarUrl ? (
                  <img
                    src={resolveAvatar(helper.avatarUrl)}
                    alt={helper.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-orange-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Tên + badge xác minh */}
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-[28px] font-bold text-[#222222] leading-tight">
                    {helper.fullName}
                  </h1>
                  {helper.isVerified && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium border border-green-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã xác minh
                    </span>
                  )}
                </div>

                {/* Rating lớn — kiểu Airbnb listing detail */}
                <div className="flex items-center gap-2 mb-3">
                  <StarRow rating={rating} size="md" />
                  <span className="text-[#222222] font-semibold text-base">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-[#6a6a6a] text-sm">
                    · {reviews.length} đánh giá · {helper.totalBookings || 0} lần làm
                  </span>
                </div>

                {/* Trạng thái nhận việc */}
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${
                  helper.isAvailable
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-gray-100 text-[#6a6a6a] border border-[#ebebeb]'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    helper.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  {helper.isAvailable ? 'Đang nhận việc' : 'Tạm nghỉ'}
                </span>
              </div>
            </div>

            {/* === Thống kê nhanh === */}
            <div className="grid grid-cols-3 gap-0 py-8 border-b border-[#dddddd]">
              <div className="text-center px-4">
                <p className="text-3xl font-bold text-[#222222]">
                  {rating.toFixed(1)}
                </p>
                <div className="flex justify-center my-1">
                  <StarRow rating={rating} size="sm" />
                </div>
                <p className="text-xs text-[#6a6a6a]">Đánh giá TB</p>
              </div>
              <div className="text-center px-4 border-x border-[#dddddd]">
                <p className="text-3xl font-bold text-[#222222]">
                  {helper.totalBookings || 0}
                </p>
                <p className="text-xs text-[#6a6a6a] mt-2">Lần làm việc</p>
              </div>
              <div className="text-center px-4">
                <p className="text-3xl font-bold text-[#222222]">
                  {helper.experienceYears ?? 0}
                </p>
                <p className="text-xs text-[#6a6a6a] mt-2">Năm kinh nghiệm</p>
              </div>
            </div>

            {/* === Giới thiệu bản thân === */}
            {helper.bio && (
              <div className="py-8 border-b border-[#dddddd]">
                <h2 className="text-[22px] font-semibold text-[#222222] mb-4">
                  Giới thiệu
                </h2>
                <p className="text-[#3f3f3f] text-base leading-relaxed">
                  {helper.bio}
                </p>
              </div>
            )}

            {/* === Thông tin cá nhân === */}
            <div className="py-8 border-b border-[#dddddd]">
              <h2 className="text-[22px] font-semibold text-[#222222] mb-5">
                Thông tin cá nhân
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {age != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#6a6a6a]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6a6a6a]">Tuổi</p>
                      <p className="text-sm font-medium text-[#222222]">{age} tuổi</p>
                    </div>
                  </div>
                )}
                {helper.gender && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#6a6a6a]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6a6a6a]">Giới tính</p>
                      <p className="text-sm font-medium text-[#222222]">
                        {GENDER_LABEL[helper.gender] || helper.gender}
                      </p>
                    </div>
                  </div>
                )}
                {helper.city && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#6a6a6a]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6a6a6a]">Khu vực</p>
                      <p className="text-sm font-medium text-[#222222]">{helper.city}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#6a6a6a]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6a6a6a]">Kinh nghiệm</p>
                    <p className="text-sm font-medium text-[#222222]">
                      {helper.experienceYears ?? 0} năm
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* === Dịch vụ cung cấp === */}
            {helper.services?.length > 0 && (
              <div className="py-8 border-b border-[#dddddd]">
                <h2 className="text-[22px] font-semibold text-[#222222] mb-5">
                  Dịch vụ cung cấp
                </h2>
                <div className="space-y-3">
                  {displayedServices?.map((svc) => {
                    const lvl     = EXPERIENCE_LABEL[svc.experienceLevel] || EXPERIENCE_LABEL.beginner;
                    const LvlIcon = lvl.Icon;
                    const isActive = String(svc.serviceId) === String(serviceId);
                    return (
                      <div
                        key={svc.serviceId}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                          isActive
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-[#dddddd] bg-white hover:border-[#222222]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-orange-100' : 'bg-[#f7f7f7]'
                          }`}>
                            <LvlIcon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-[#6a6a6a]'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#222222]">
                              {svc.serviceName}
                              {isActive && (
                                <span className="ml-2 text-xs text-orange-500 font-medium">
                                  · Đang chọn
                                </span>
                              )}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lvl.color}`}>
                              {lvl.text}
                            </span>
                          </div>
                        </div>
                        <span className="text-[#222222] font-bold text-base flex-shrink-0">
                          {formatPrice(Number(svc.price))}
                          <span className="text-[#6a6a6a] text-xs font-normal">/giờ</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                {helper.services.length > 4 && (
                  <button
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#222222] font-medium underline hover:no-underline transition-all"
                  >
                    {showAllServices ? (
                      <><ChevronUp className="w-4 h-4" /> Thu gọn</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> Xem thêm {helper.services.length - 4} dịch vụ</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* === Đánh giá khách hàng === */}
            <div className="py-8">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[22px] font-semibold text-[#222222]">
                  Đánh giá
                </h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRow rating={rating} />
                    <span className="text-[#222222] font-semibold text-sm">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-[#6a6a6a] text-sm">
                      ({reviews.length} đánh giá)
                    </span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6 text-[#6a6a6a]" />
                  </div>
                  <p className="text-[#6a6a6a] text-sm">Chưa có đánh giá nào.</p>
                </div>
              ) : (
                <>
                  {/* Grid 2 cột trên desktop, kiểu Airbnb */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {displayedReviews.map((r) => (
                      <div key={r.reviewId} className="space-y-3">
                        {/* Author row */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-sm font-bold text-orange-500 flex-shrink-0 border border-[#dddddd]">
                            {(r.customerName || 'K')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#222222]">
                              {r.customerName || 'Khách hàng'}
                            </p>
                            <p className="text-xs text-[#6a6a6a]">
                              {formatDate(r.createdAt)}
                            </p>
                          </div>
                        </div>
                        {/* Star + comment */}
                        <div>
                          <StarRow rating={r.rating} size="sm" />
                          {r.comment && (
                            <p className="mt-2 text-sm text-[#3f3f3f] leading-relaxed line-clamp-3">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {reviews.length > 4 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="mt-6 inline-flex items-center gap-1.5 h-12 px-6 bg-white border border-[#222222] hover:bg-[#f7f7f7] text-[#222222] text-sm font-medium rounded-xl transition-colors"
                    >
                      {showAllReviews ? (
                        <><ChevronUp className="w-4 h-4" /> Thu gọn</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Xem tất cả {reviews.length} đánh giá</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Cột phải (30%) sticky — Booking widget ── */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div
              className="lg:sticky lg:top-8 bg-white rounded-2xl border border-[#dddddd] p-6"
              style={{ boxShadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px' }}
            >
              {/* Giá */}
              {currentService ? (
                <div className="mb-5">
                  <p className="text-[28px] font-bold text-[#222222] leading-tight">
                    {formatPrice(Number(currentService.price))}
                    <span className="text-base font-normal text-[#6a6a6a]"> / giờ</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRow rating={rating} size="sm" />
                    <span className="text-xs text-[#222222] font-medium">{rating.toFixed(1)}</span>
                    <span className="text-xs text-[#6a6a6a]">· {reviews.length} đánh giá</span>
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  <p className="text-lg font-semibold text-[#222222]">{helper.fullName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRow rating={rating} size="sm" />
                    <span className="text-xs text-[#222222] font-medium">{rating.toFixed(1)}</span>
                    <span className="text-xs text-[#6a6a6a]">· {reviews.length} đánh giá</span>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-[#dddddd] mb-5" />

              {/* Trạng thái nhận việc */}
              <div className={`flex items-center gap-2 p-3 rounded-xl mb-5 ${
                helper.isAvailable ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  helper.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  helper.isAvailable ? 'text-green-700' : 'text-[#6a6a6a]'
                }`}>
                  {helper.isAvailable ? 'Đang nhận việc' : 'Tạm thời không nhận việc'}
                </span>
              </div>

              {/* Thống kê nhanh trong widget */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#f7f7f7] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-[#222222]">{helper.totalBookings || 0}</p>
                  <p className="text-xs text-[#6a6a6a] mt-0.5">Lần làm việc</p>
                </div>
                <div className="bg-[#f7f7f7] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-[#222222]">{helper.experienceYears ?? 0}</p>
                  <p className="text-xs text-[#6a6a6a] mt-0.5">Năm kinh nghiệm</p>
                </div>
              </div>

              {/* Ghi chú lịch đặt trước */}
              <div className="flex items-start gap-2.5 p-3 bg-[#f7f7f7] rounded-xl mb-5">
                <Calendar className="w-4 h-4 text-[#6a6a6a] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6a6a6a] leading-relaxed">
                  Chọn ngày và giờ sau khi nhấn đặt lịch. Lịch sẽ được xác nhận trong vòng 24h.
                </p>
              </div>

              {/* CTA đặt lịch */}
              {user?.userType === 'customer' && helper.isAvailable && (
                <button
                  onClick={handleBook}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-medium rounded-xl transition-colors"
                >
                  Đặt lịch ngay
                </button>
              )}
              {user?.userType === 'customer' && !helper.isAvailable && (
                <button
                  disabled
                  className="w-full h-12 bg-gray-100 text-[#6a6a6a] text-base font-medium rounded-xl cursor-not-allowed"
                >
                  Hiện không nhận việc
                </button>
              )}
              {!user && (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-medium rounded-xl transition-colors"
                >
                  Đăng nhập để đặt lịch
                </button>
              )}

              {/* Lưu ý không tính phí */}
              <p className="text-xs text-[#6a6a6a] text-center mt-3">
                Không tính phí cho đến khi xác nhận lịch
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar — booking CTA */}
      {helper.isAvailable && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#dddddd] px-4 py-3 z-50"
          style={{ boxShadow: 'rgba(0,0,0,0.1) 0 -4px 12px' }}
        >
          <div className="flex items-center justify-between max-w-lg mx-auto gap-4">
            <div>
              {currentService && (
                <p className="text-[#222222] font-bold text-lg">
                  {formatPrice(Number(currentService.price))}
                  <span className="text-sm font-normal text-[#6a6a6a]">/giờ</span>
                </p>
              )}
              <div className="flex items-center gap-1">
                <StarRow rating={rating} size="sm" />
                <span className="text-xs text-[#6a6a6a]">{rating.toFixed(1)}</span>
              </div>
            </div>
            {user ? (
              <button
                onClick={handleBook}
                className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
              >
                Đặt lịch ngay
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
              >
                Đặt lịch
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
