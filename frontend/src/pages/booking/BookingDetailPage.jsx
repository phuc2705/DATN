import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingDetailApi, cancelBookingApi } from '../../api/booking.api';
import { confirmPaymentApi } from '../../api/payment.api';
import { createReviewApi } from '../../api/review.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReview, setShowReview] = useState(false);

  const refresh = () => {
    getBookingDetailApi(bookingId)
      .then(({ data }) => setBooking(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [bookingId]);

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return;
    try {
      await cancelBookingApi(bookingId);
      toast.success('Đã hủy đơn.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy');
    }
  };

  const handlePayment = async () => {
    try {
      await confirmPaymentApi(bookingId, { paymentMethod: 'cash' });
      toast.success('Xác nhận thanh toán thành công!');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thanh toán');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await createReviewApi({ bookingId: parseInt(bookingId), ...reviewForm });
      toast.success('Cảm ơn đánh giá của bạn!');
      setShowReview(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!booking) return <p className="text-center text-gray-500 py-10">Không tìm thấy đơn.</p>;

  const sl = BOOKING_STATUS_LABEL[booking.status] || {};
  const pl = PAYMENT_STATUS_LABEL[booking.paymentStatus] || {};

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline text-sm mb-4 block">
        ← Quay lại
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-xl font-bold text-gray-800">Đơn #{booking.bookingId}</h1>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${sl.color}`}>{sl.text}</span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between"><span>Ngày làm:</span><span className="font-medium text-gray-800">{formatDate(booking.bookingDate)}</span></div>
          <div className="flex justify-between"><span>Giờ:</span><span className="font-medium text-gray-800">{booking.startTime} – {booking.endTime} ({booking.hours}h)</span></div>
          <div className="flex justify-between"><span>Địa chỉ:</span><span className="font-medium text-gray-800 text-right max-w-xs">{booking.address}</span></div>
          <hr className="my-3" />
          <div className="flex justify-between"><span>Giá cơ bản:</span><span>{formatPrice(booking.basePrice)}</span></div>
          {booking.discountAmount > 0 && (
            <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-{formatPrice(booking.discountAmount)}</span></div>
          )}
          <div className="flex justify-between font-bold text-gray-800 text-base"><span>Tổng tiền:</span><span className="text-primary-600">{formatPrice(booking.totalPrice)}</span></div>
          <hr className="my-3" />
          <div className="flex justify-between">
            <span>Thanh toán:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${pl.color}`}>{pl.text}</span>
          </div>
        </div>

        {/* Actions cho customer */}
        {user?.userType === 'customer' && (
          <div className="mt-5 space-y-2">
            {booking.status === 'pending' && (
              <button onClick={handleCancel} className="w-full border border-red-300 text-red-500 py-2 rounded-xl hover:bg-red-50">
                Hủy đơn
              </button>
            )}
            {booking.status === 'completed' && booking.paymentStatus === 'unpaid' && (
              <button onClick={handlePayment} className="w-full bg-green-500 text-white py-2 rounded-xl hover:bg-green-600">
                Xác nhận thanh toán
              </button>
            )}
            {booking.status === 'completed' && !booking.hasReviewed && (
              <button
                onClick={() => setShowReview(true)}
                className="w-full bg-yellow-400 text-white py-2 rounded-xl hover:bg-yellow-500"
              >
                Đánh giá người giúp việc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form đánh giá */}
      {showReview && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Đánh giá dịch vụ</h2>
          <form onSubmit={handleReview} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đánh giá</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} sao {'★'.repeat(n)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét</label>
              <textarea
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-primary-500 text-white py-2 rounded-xl">Gửi đánh giá</button>
              <button type="button" onClick={() => setShowReview(false)} className="flex-1 border border-gray-300 py-2 rounded-xl text-gray-600">Hủy</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
