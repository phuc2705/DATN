import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getHelperProfileApi } from '../../api/user.api';
const _API = import.meta.env.VITE_API_URL || '';
const resolveAvatar = (url) => (url?.startsWith('/uploads/') ? `${_API}${url}` : url);
import { getHelperReviewsApi } from '../../api/review.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

const EXPERIENCE_LABEL = {
  beginner:     { text: 'Mới vào nghề',    color: 'bg-gray-100 text-gray-600',   icon: '🌱' },
  intermediate: { text: 'Có kinh nghiệm',  color: 'bg-blue-100 text-blue-700',   icon: '⭐' },
  expert:       { text: 'Chuyên nghiệp',   color: 'bg-purple-100 text-purple-700', icon: '🏆' },
};

const GENDER_LABEL = { female: 'Nữ', male: 'Nam', other: 'Khác' };

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function StarRow({ rating, size = 'md' }) {
  const r = Number(rating) || 0;
  const cls = size === 'sm' ? 'text-xs' : 'text-base';
  return (
    <span className={`text-yellow-400 ${cls}`}>
      {'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))}
    </span>
  );
}

export default function HelperProfilePage() {
  const { helperId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [helper, setHelper] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getHelperProfileApi(helperId)
      .then(({ data: h }) => {
        if (!h.data) { setError(true); return; }
        setHelper(h.data);
        // Lấy reviews riêng — nếu lỗi thì chỉ ẩn phần reviews, không ảnh hưởng profile
        getHelperReviewsApi(helperId)
          .then(({ data: r }) =>
            setReviews(Array.isArray(r.data?.reviews) ? r.data.reviews : [])
          )
          .catch(() => {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [helperId]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  if (error || !helper) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">😔</div>
        <p className="text-gray-500">Không tìm thấy thông tin người giúp việc.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-orange-500 hover:underline text-sm">
          ← Quay lại
        </button>
      </div>
    );
  }

  const age = calcAge(helper.dateOfBirth);
  const rating = Number(helper.ratingAverage) || 0;

  // Tìm dịch vụ đang xem (nếu có serviceId)
  const currentService = helper.services?.find(
    (s) => String(s.serviceId) === String(serviceId)
  );

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/bookings/new?helperId=${helperId}&serviceId=${serviceId || ''}`);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <button onClick={() => navigate(-1)} className="text-orange-500 hover:text-orange-600 text-sm mb-5 flex items-center gap-1">
        ← Quay lại danh sách
      </button>

      {/* Card thông tin chính */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-gray-100">
        {/* Header: avatar + tên + badge */}
        <div className="flex items-start gap-5 mb-5">
          <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
            {helper.avatarUrl
              ? <img src={resolveAvatar(helper.avatarUrl)} alt="" className="w-full h-full object-cover" />
              : '👩'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900">{helper.fullName}</h1>
              {helper.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Đã xác minh</span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-2">
              <StarRow rating={rating} />
              <span className="text-gray-700 font-semibold text-sm">{rating.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">· {helper.totalBookings || 0} lần làm</span>
            </div>

            {/* Trạng thái */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
              helper.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${helper.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
              {helper.isAvailable ? 'Đang nhận việc' : 'Tạm nghỉ'}
            </span>
          </div>

          {/* Giá dịch vụ */}
          {currentService && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-extrabold text-orange-500">{formatPrice(Number(currentService.price))}</p>
              <p className="text-gray-400 text-xs">/giờ</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {helper.bio && (
          <p className="text-gray-600 text-sm leading-relaxed mb-5 p-4 bg-orange-50 rounded-xl border border-orange-100">
            "{helper.bio}"
          </p>
        )}

        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {age != null && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{age}</p>
              <p className="text-xs text-gray-500 mt-0.5">Tuổi</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{helper.experienceYears ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Năm kinh nghiệm</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{helper.totalBookings || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Lần làm việc</p>
          </div>
          {helper.gender && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{GENDER_LABEL[helper.gender] || helper.gender}</p>
              <p className="text-xs text-gray-500 mt-0.5">Giới tính</p>
            </div>
          )}
        </div>

        {/* Dịch vụ cung cấp */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ cung cấp</h3>
          {helper.services?.length > 0 ? (
            <div className="space-y-2">
              {helper.services.map((svc) => {
                const lvl = EXPERIENCE_LABEL[svc.experienceLevel] || EXPERIENCE_LABEL.beginner;
                const isActive = String(svc.serviceId) === String(serviceId);
                return (
                  <div
                    key={svc.serviceId}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isActive ? 'border-orange-300 bg-orange-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lvl.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{svc.serviceName}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${lvl.color}`}>{lvl.text}</span>
                      </div>
                    </div>
                    <span className="text-orange-500 font-bold text-sm">{formatPrice(Number(svc.price))}/giờ</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-xl">
              Chưa đăng ký dịch vụ.
            </p>
          )}
        </div>

        {/* Nút đặt lịch */}
        {user?.userType === 'customer' && helper.isAvailable && (
          <button
            onClick={handleBook}
            className="w-full btn-primary py-3.5 text-base font-semibold rounded-xl"
          >
            Đặt lịch ngay
          </button>
        )}
        {!user && (
          <button
            onClick={() => navigate('/login')}
            className="w-full btn-primary py-3.5 text-base font-semibold rounded-xl"
          >
            Đăng nhập để đặt lịch
          </button>
        )}
      </div>

      {/* Đánh giá của khách hàng */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Đánh giá của khách hàng</h2>
          <div className="flex items-center gap-2">
            <StarRow rating={rating} />
            <span className="text-gray-700 font-semibold">{rating.toFixed(1)}</span>
            <span className="text-gray-400 text-sm">({reviews.length})</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-gray-400 text-sm">Chưa có đánh giá nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.reviewId} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                {/* Avatar khách */}
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">
                  {(r.customerName || 'K')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{r.customerName || 'Khách hàng'}</span>
                    <div className="flex items-center gap-1.5">
                      <StarRow rating={r.rating} size="sm" />
                      <span className="text-gray-400 text-xs">{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
