import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchHelpersApi } from '../../api/service.api';
import { suggestHelpersApi } from '../../api/booking.api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';
import { Zap, Search, User, Star, ArrowLeft } from 'lucide-react';

const _API = import.meta.env.VITE_API_URL || '';
const resolveAvatar = (url) => (url?.startsWith('/uploads/') ? `${_API}${url}` : url);

const EXPERIENCE_LABEL = {
  beginner:     { text: 'Mới vào nghề',    color: 'bg-gray-100 text-gray-600' },
  intermediate: { text: 'Có kinh nghiệm',  color: 'bg-blue-100 text-blue-700' },
  expert:       { text: 'Chuyên nghiệp',   color: 'bg-purple-100 text-purple-700' },
};

const ScoreBadge = ({ score }) => {
  const color = score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${color}`}>
      <Zap className="w-3 h-3" /> {score}/100
    </span>
  );
};

function StarRow({ rating, count }) {
  const r = Number(rating) || 0;
  const filled = Math.round(r);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-3.5 h-3.5 ${i < filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
        ))}
      </div>
      <span className="text-gray-500 text-xs">{r.toFixed(1)}</span>
      {count != null && <span className="text-gray-400 text-xs">· {count} lần làm</span>}
    </div>
  );
}

export default function SearchHelpersPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [city, setCity]             = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime]   = useState('');
  const [endTime, setEndTime]       = useState('');
  const [data, setData]             = useState(null);
  const [suggestedHelpers, setSuggestedHelpers] = useState(null);
  const [loading, setLoading]       = useState(false);

  const search = (cityValue) => {
    setLoading(true);
    setSuggestedHelpers(null);
    searchHelpersApi(serviceId, cityValue)
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const suggest = () => {
    if (!user || !bookingDate || !startTime || !endTime) return;
    setLoading(true);
    suggestHelpersApi({ serviceId, bookingDate, startTime, endTime })
      .then(({ data: res }) => setSuggestedHelpers(res.data?.helpers || []))
      .catch(() => setSuggestedHelpers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { search(''); }, [serviceId]);

  const isUsingMatch = suggestedHelpers !== null;
  const helpers = isUsingMatch ? suggestedHelpers : (data?.helpers || []);

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/')} className="text-orange-500 hover:text-orange-600 text-sm mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {data && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{data.service?.serviceName}</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5 flex-wrap">
            {helpers.length} người giúp việc
            {!isUsingMatch && (
              <> · Giá từ{' '}
                <span className="text-orange-500 font-semibold">
                  {formatPrice(Number(data.service?.basePrice))}/giờ
                </span>
              </>
            )}
            {isUsingMatch && (
              <span className="ml-1 text-green-600 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Xếp hạng theo độ phù hợp
              </span>
            )}
          </p>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 space-y-3">
        <div className="flex gap-3">
          <input
            type="text" value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(city)}
            placeholder="Lọc theo thành phố (vd: Hà Nội)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          />
          <button onClick={() => search(city)} className="btn-primary px-5 py-2.5 text-sm">
            Tìm kiếm
          </button>
        </div>

        {user && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              Tìm helper phù hợp theo lịch đặt — chọn ngày & giờ để xếp hạng chính xác hơn
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="date" value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
              <input
                type="time" value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Từ"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
              <input
                type="time" value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="Đến"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={suggest}
                disabled={!bookingDate || !startTime || !endTime}
                className="btn-primary px-5 py-2 text-sm disabled:opacity-40 flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" /> Tìm phù hợp nhất
              </button>
              {isUsingMatch && (
                <button
                  onClick={() => { setSuggestedHelpers(null); setBookingDate(''); setStartTime(''); setEndTime(''); }}
                  className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Xem tất cả
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : helpers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500">
            {isUsingMatch ? 'Không có helper trống lịch vào khung giờ này.' : 'Không tìm thấy người giúp việc phù hợp.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {helpers.map((h) => {
            const expLabel = EXPERIENCE_LABEL[h.experienceLevel] || EXPERIENCE_LABEL.beginner;
            return (
              <div
                key={h.helperId}
                onClick={() => navigate(`/helpers/${h.helperId}?serviceId=${serviceId}`)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 cursor-pointer transition-all duration-200 active:scale-[0.99]"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {h.avatarUrl
                      ? <img src={resolveAvatar(h.avatarUrl)} alt="" className="w-full h-full object-cover" />
                      : <User className="w-7 h-7 text-orange-400" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{h.fullName}</h3>
                      {h.isVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✓ Xác minh</span>
                      )}
                      {isUsingMatch && h.score != null && <ScoreBadge score={h.score} />}
                    </div>

                    <StarRow rating={h.ratingAverage} count={h.totalBookings} />

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {h.experienceYears != null && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          {h.experienceYears} năm KN
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${expLabel.color}`}>
                        {expLabel.text}
                      </span>
                    </div>

                    {h.bio && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-1">{h.bio}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-orange-500 font-bold text-base">
                      {formatPrice(Number(h.effectivePrice))}
                    </p>
                    <p className="text-gray-400 text-xs">/giờ</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
