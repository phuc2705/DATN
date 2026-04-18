import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getHelperProfileApi } from '../../api/user.api';
import { getHelperReviewsApi } from '../../api/review.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

export default function HelperProfilePage() {
  const { helperId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [helper, setHelper] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getHelperProfileApi(helperId),
      getHelperReviewsApi(helperId),
    ]).then(([{ data: h }, { data: r }]) => {
      setHelper(h.data);
      setReviews(r.data || []);
    }).finally(() => setLoading(false));
  }, [helperId]);

  if (loading) return <LoadingSpinner />;
  if (!helper) return <p className="text-center text-gray-500 py-10">Không tìm thấy thông tin.</p>;

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/bookings/new?helperId=${helperId}&serviceId=${serviceId || ''}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline text-sm mb-4 block">
        ← Quay lại
      </button>

      {/* Thông tin helper */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-4xl">
            {helper.avatarUrl
              ? <img src={helper.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              : '👩'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-800">{helper.fullName}</h1>
              {helper.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Đã xác minh</span>
              )}
            </div>
            <p className="text-yellow-400 text-lg">
              {'★'.repeat(Math.round(helper.ratingAverage || 0))}
              {'☆'.repeat(5 - Math.round(helper.ratingAverage || 0))}
              <span className="text-gray-500 text-sm ml-1">{helper.ratingAverage?.toFixed(1)} · {helper.totalBookings} lần làm</span>
            </p>
            <p className="text-primary-600 font-bold text-lg mt-1">{formatPrice(helper.hourlyRate)}/giờ</p>
            {helper.bio && <p className="text-gray-600 text-sm mt-2">{helper.bio}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div><span className="font-medium">Kinh nghiệm:</span> {helper.experienceYears} năm</div>
          <div><span className="font-medium">Trạng thái:</span> {helper.isAvailable ? '🟢 Đang nhận việc' : '🔴 Tạm nghỉ'}</div>
        </div>

        {user?.userType === 'customer' && helper.isAvailable && (
          <button
            onClick={handleBook}
            className="mt-5 w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold text-lg"
          >
            Đặt lịch ngay
          </button>
        )}
      </div>

      {/* Đánh giá */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Đánh giá ({reviews.length})</h2>
        {reviews.length === 0 && <p className="text-gray-400 text-sm">Chưa có đánh giá nào.</p>}
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.reviewId} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-800">{r.customerName || 'Khách hàng'}</span>
                <span className="text-yellow-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-gray-400 text-xs">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
