import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchHelpersApi } from '../../api/service.api';
import { suggestHelpersApi } from '../../api/booking.api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';
import {
  Zap, Search, User, Star, ArrowLeft, MapPin, Clock, CheckCircle2, SlidersHorizontal,
} from 'lucide-react';

const _API = import.meta.env.VITE_API_URL || '';
const resolveAvatar = (url) => (url?.startsWith('/uploads/') ? `${_API}${url}` : url);

const EXPERIENCE_LABEL = {
  beginner:     { text: 'Mới vào nghề',   color: 'bg-gray-100 text-gray-600' },
  intermediate: { text: 'Có kinh nghiệm', color: 'bg-blue-50 text-blue-600' },
  expert:       { text: 'Chuyên nghiệp',  color: 'bg-orange-50 text-orange-600' },
};

/* Nội tuyến badge điểm phù hợp */
function ScoreBadge({ score }) {
  const color =
    score >= 70 ? 'bg-green-50 text-green-700' :
    score >= 40 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-600';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}
    >
      <Zap className="w-3 h-3" />
      {score}/100
    </span>
  );
}

/* Hàng sao đánh giá */
function StarRow({ rating, count }) {
  const r = Number(rating) || 0;
  const filled = Math.round(r);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-[#222222] text-xs font-medium">{r.toFixed(1)}</span>
      {count != null && (
        <span className="text-[#6a6a6a] text-xs">· {count} lần làm</span>
      )}
    </div>
  );
}

/* Skeleton card khi đang tải */
function HelperCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#dddddd] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded-full w-2/5" />
          <div className="h-3 bg-gray-100 rounded-full w-3/5" />
          <div className="h-3 bg-gray-100 rounded-full w-1/4" />
        </div>
        <div className="w-16 space-y-2">
          <div className="h-5 bg-gray-100 rounded-full" />
          <div className="h-3 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function SearchHelpersPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [city, setCity]                 = useState('');
  const [bookingDate, setBookingDate]   = useState('');
  const [startTime, setStartTime]       = useState('');
  const [endTime, setEndTime]           = useState('');
  const [data, setData]                 = useState(null);
  const [suggestedHelpers, setSuggestedHelpers] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [showSmartFilter, setShowSmartFilter] = useState(false);

  /* Tìm kiếm theo thành phố */
  const search = (cityValue) => {
    setLoading(true);
    setSuggestedHelpers(null);
    searchHelpersApi(serviceId, cityValue)
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  /* Gợi ý helper theo khung giờ */
  const suggest = () => {
    if (!user || !bookingDate || !startTime || !endTime) return;
    setLoading(true);
    suggestHelpersApi({ serviceId, bookingDate, startTime, endTime })
      .then(({ data: res }) => setSuggestedHelpers(res.data?.helpers || []))
      .catch(() => setSuggestedHelpers([]))
      .finally(() => setLoading(false));
  };

  /* Xóa bộ lọc thông minh */
  const clearSuggest = () => {
    setSuggestedHelpers(null);
    setBookingDate('');
    setStartTime('');
    setEndTime('');
  };

  useEffect(() => { search(''); }, [serviceId]);

  const isUsingMatch = suggestedHelpers !== null;
  const helpers = isUsingMatch ? suggestedHelpers : (data?.helpers || []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Nút quay lại */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-[#222222] text-sm font-medium hover:text-[#6a6a6a] transition-colors mb-6 group"
        >
          <span className="w-8 h-8 rounded-full bg-white border border-[#dddddd] flex items-center justify-center group-hover:border-[#222222] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
          Quay lại
        </button>

        {/* Tiêu đề trang */}
        {data && (
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-[#222222] leading-tight">
              {data.service?.serviceName}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[#6a6a6a] text-base">
                {helpers.length} người giúp việc
              </span>
              {!isUsingMatch && data.service?.basePrice && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#dddddd]" />
                  <span className="text-[#6a6a6a] text-base">
                    Giá từ{' '}
                    <span className="text-[#222222] font-semibold">
                      {formatPrice(Number(data.service.basePrice))}/giờ
                    </span>
                  </span>
                </>
              )}
              {isUsingMatch && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#dddddd]" />
                  <span className="inline-flex items-center gap-1 text-sm text-orange-500 font-medium">
                    <Zap className="w-3.5 h-3.5" />
                    Xếp hạng theo độ phù hợp
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Thanh tìm kiếm + bộ lọc */}
        <div className="bg-white border border-[#dddddd] rounded-2xl p-5 mb-8"
          style={{ boxShadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px' }}
        >
          {/* Hàng tìm kiếm thành phố */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6a6a]" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search(city)}
                placeholder="Lọc theo thành phố (vd: Hà Nội)"
                className="w-full h-12 pl-10 pr-4 bg-white border border-[#dddddd] rounded-xl text-[#222222] text-sm placeholder-[#6a6a6a] focus:outline-none focus:border-2 focus:border-[#222222] transition-all"
              />
            </div>
            <button
              onClick={() => search(city)}
              className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              Tìm kiếm
            </button>
            {user && (
              <button
                onClick={() => setShowSmartFilter(!showSmartFilter)}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                  showSmartFilter
                    ? 'bg-[#222222] border-[#222222] text-white'
                    : 'bg-white border-[#dddddd] text-[#222222] hover:border-[#222222]'
                }`}
                title="Tìm theo lịch"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bộ lọc thông minh theo khung giờ */}
          {user && showSmartFilter && (
            <div className="mt-4 pt-4 border-t border-[#dddddd]">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-orange-500" />
                <p className="text-sm text-[#222222] font-medium">
                  Tìm helper trống lịch theo khung giờ của bạn
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6a6a]" />
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 bg-white border border-[#dddddd] rounded-xl text-[#222222] text-sm focus:outline-none focus:border-2 focus:border-[#222222] transition-all"
                  />
                </div>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-[#dddddd] rounded-xl text-[#222222] text-sm focus:outline-none focus:border-2 focus:border-[#222222] transition-all"
                  placeholder="Bắt đầu"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-[#dddddd] rounded-xl text-[#222222] text-sm focus:outline-none focus:border-2 focus:border-[#222222] transition-all"
                  placeholder="Kết thúc"
                />
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={suggest}
                  disabled={!bookingDate || !startTime || !endTime}
                  className="h-12 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Tìm phù hợp nhất
                </button>
                {isUsingMatch && (
                  <button
                    onClick={clearSuggest}
                    className="h-12 px-5 bg-white border border-[#dddddd] hover:border-[#222222] text-[#222222] text-sm font-medium rounded-xl transition-colors"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nội dung danh sách */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((k) => <HelperCardSkeleton key={k} />)}
          </div>
        ) : helpers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f7f7f7] flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-[#6a6a6a]" />
            </div>
            <p className="text-[#222222] font-medium text-lg mb-1">
              {isUsingMatch ? 'Không có helper trống lịch' : 'Không tìm thấy kết quả'}
            </p>
            <p className="text-[#6a6a6a] text-sm max-w-xs">
              {isUsingMatch
                ? 'Không có helper nào trống lịch trong khung giờ này. Hãy thử chọn khung giờ khác.'
                : 'Không có người giúp việc nào phù hợp với tiêu chí tìm kiếm.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {helpers.map((h) => {
              const expLabel = EXPERIENCE_LABEL[h.experienceLevel] || EXPERIENCE_LABEL.beginner;
              return (
                <div
                  key={h.helperId}
                  onClick={() => navigate(`/helpers/${h.helperId}?serviceId=${serviceId}`)}
                  className="bg-white rounded-2xl border border-[#dddddd] p-5 cursor-pointer transition-all duration-200 hover:border-[#222222] active:scale-[0.99]"
                  style={{ '--tw-shadow': 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#dddddd]">
                      {h.avatarUrl ? (
                        <img
                          src={resolveAvatar(h.avatarUrl)}
                          alt={h.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-orange-400" />
                      )}
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[#222222] text-base truncate">
                          {h.fullName}
                        </h3>
                        {h.isVerified && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Xác minh
                          </span>
                        )}
                      </div>

                      <StarRow rating={h.ratingAverage} count={h.totalBookings} />

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        {h.experienceYears != null && (
                          <span className="text-xs text-[#6a6a6a] bg-[#f7f7f7] px-2.5 py-1 rounded-full border border-[#ebebeb]">
                            {h.experienceYears} năm KN
                          </span>
                        )}
                        <span className={`text-xs px-2.5 py-1 rounded-full ${expLabel.color}`}>
                          {expLabel.text}
                        </span>
                        {isUsingMatch && h.score != null && (
                          <ScoreBadge score={h.score} />
                        )}
                      </div>

                      {h.bio && (
                        <p className="text-xs text-[#6a6a6a] mt-2 line-clamp-1 leading-relaxed">
                          {h.bio}
                        </p>
                      )}
                    </div>

                    {/* Giá */}
                    <div className="text-right flex-shrink-0 pl-2">
                      <p className="text-[#222222] font-bold text-base">
                        {formatPrice(Number(h.effectivePrice))}
                      </p>
                      <p className="text-[#6a6a6a] text-xs">/giờ</p>
                      <p className="text-xs text-orange-500 font-medium mt-2 whitespace-nowrap">
                        Xem hồ sơ →
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
