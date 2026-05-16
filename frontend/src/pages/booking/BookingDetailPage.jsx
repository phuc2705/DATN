import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingDetailApi, cancelBookingApi } from '../../api/booking.api';
import { confirmPaymentApi, createVNPayUrlApi, getBankTransferInfoApi } from '../../api/payment.api';
import { createReviewApi } from '../../api/review.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, formatDateTime, BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { getSocket } from '../../socket/socket';
import toast from 'react-hot-toast';

// Định nghĩa các bước trong timeline theo thứ tự trạng thái
const STATUS_STEPS = [
  { key: 'pending',     label: 'Đã đặt lịch',     icon: '📋', desc: 'Đơn đang chờ người giúp việc nhận' },
  { key: 'confirmed',   label: 'Đã xác nhận',      icon: '✅', desc: 'Người giúp việc đã nhận đơn' },
  { key: 'in_progress', label: 'Đang thực hiện',   icon: '🏠', desc: 'Người giúp việc đang làm việc' },
  { key: 'completed',   label: 'Hoàn thành',        icon: '🎉', desc: 'Công việc đã hoàn thành' },
];

const STATUS_ORDER = { pending: 0, confirmed: 1, in_progress: 2, completed: 3 };

function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
        <span className="text-2xl">❌</span>
        <div>
          <p className="font-semibold text-red-700">Đơn đã bị hủy</p>
          <p className="text-sm text-red-500">Đơn hàng này đã được hủy</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[status] ?? 0;

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 transition-all ${
                isDone    ? 'bg-green-500 border-green-500 text-white' :
                isCurrent ? 'bg-orange-500 border-orange-500 text-white animate-pulse' :
                            'bg-white border-gray-200 text-gray-300'
              }`}>
                {isDone ? '✓' : step.icon}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-green-400' : 'bg-gray-100'}`} />
              )}
            </div>

            {/* Content */}
            <div className="pb-5 flex-1">
              <p className={`font-semibold text-sm ${isDone ? 'text-green-700' : isCurrent ? 'text-orange-600' : 'text-gray-300'}`}>
                {step.label}
                {isCurrent && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Hiện tại</span>}
              </p>
              <p className={`text-xs mt-0.5 ${isPending ? 'text-gray-300' : 'text-gray-500'}`}>{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StarSelector({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReview, setShowReview] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [showBankQR, setShowBankQR] = useState(false);

  const refresh = () => {
    getBookingDetailApi(bookingId)
      .then(({ data }) => setBooking(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [bookingId]);

  // Real-time: lắng nghe cập nhật trạng thái qua Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => {
      if (data.bookingId === parseInt(bookingId)) refresh();
    };
    socket.on('booking:update', handler);
    return () => socket.off('booking:update', handler);
  }, [bookingId]);

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

  const handleCashPayment = async () => {
    try {
      await confirmPaymentApi(bookingId, { paymentMethod: 'cash' });
      toast.success('Xác nhận thanh toán tiền mặt thành công!');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thanh toán');
    }
  };

  const handleVNPayPayment = async () => {
    try {
      const { data } = await createVNPayUrlApi(bookingId);
      window.location.href = data.data.paymentUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo link thanh toán VNPay');
    }
  };

  const handleShowBankQR = async () => {
    try {
      const { data } = await getBankTransferInfoApi(bookingId);
      setBankInfo(data.data);
      setShowBankQR(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lấy thông tin chuyển khoản');
    }
  };

  const handleBankTransferConfirm = async () => {
    try {
      await confirmPaymentApi(bookingId, { paymentMethod: 'bank_transfer' });
      toast.success('Đã xác nhận chuyển khoản. Cảm ơn bạn!');
      setShowBankQR(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xác nhận thanh toán');
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

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (!booking) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">😔</div>
      <p className="text-gray-500">Không tìm thấy đơn hàng.</p>
      <button onClick={() => navigate('/bookings')} className="mt-4 text-orange-500 hover:underline text-sm">
        ← Về danh sách đơn
      </button>
    </div>
  );

  const sl = BOOKING_STATUS_LABEL[booking.status] || {};
  const pl = PAYMENT_STATUS_LABEL[booking.paymentStatus] || {};

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      <button onClick={() => navigate(-1)} className="text-orange-500 hover:text-orange-600 text-sm mb-5 flex items-center gap-1 font-medium">
        ← Quay lại
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Đơn #{booking.bookingId}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{booking.serviceName || 'Dịch vụ giúp việc'}</p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${sl.color}`}>{sl.text}</span>
        </div>

        {/* Helper info */}
        {booking.helperName ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
            <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {booking.helperAvatar
                ? <img src={booking.helperAvatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl">👩</span>}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Người giúp việc</p>
              <p className="font-semibold text-gray-800 text-sm">{booking.helperName}</p>
              {booking.helperPhone && (
                <a href={`tel:${booking.helperPhone}`} className="text-xs text-orange-500 hover:underline flex items-center gap-1 mt-0.5">
                  📞 {booking.helperPhone}
                </a>
              )}
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ Xác minh</span>
          </div>
        ) : booking.status === 'pending' && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Đang tìm người giúp việc</p>
              <p className="text-xs text-amber-600 mt-0.5">Thuật toán matching đang phân công...</p>
            </div>
          </div>
        )}

        {/* Booking details */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">📅 Ngày làm</span>
            <span className="font-medium text-gray-800">{formatDate(booking.bookingDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">⏰ Giờ</span>
            <span className="font-medium text-gray-800">{booking.startTime} – {booking.endTime} ({booking.hours}h)</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-gray-500 flex items-center gap-1.5 flex-shrink-0">📍 Địa chỉ</span>
            <span className="font-medium text-gray-800 text-right">{booking.address}</span>
          </div>
          {booking.note && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-500 flex items-center gap-1.5 flex-shrink-0">📝 Ghi chú</span>
              <span className="text-gray-600 text-right italic">{booking.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-4">
        <h2 className="font-semibold text-gray-800 mb-4 text-sm">Tiến trình đơn hàng</h2>
        <StatusTimeline status={booking.status} />
      </div>

      {/* Pricing card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Chi tiết thanh toán</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Giá cơ bản ({booking.hours}h)</span>
            <span>{formatPrice(booking.basePrice)}</span>
          </div>
          {booking.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá</span>
              <span>-{formatPrice(booking.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 border-t pt-2">
            <span>Tổng tiền</span>
            <span className="text-orange-500">{formatPrice(booking.totalPrice)}</span>
          </div>
          <div className="flex justify-between text-gray-600 pt-1">
            <span>Phương thức</span>
            <span className="font-medium">
              {booking.paymentMethod === 'vnpay' ? '🏦 VNPay'
                : booking.paymentMethod === 'bank_transfer' ? '🏧 Chuyển khoản'
                : '💵 Tiền mặt'}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Trạng thái TT</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pl.color}`}>{pl.text}</span>
          </div>
        </div>
      </div>

      {/* Action buttons — Customer */}
      {user?.userType === 'customer' && (
        <div className="space-y-2 mb-4">
          {booking.status === 'pending' && (
            <button onClick={handleCancel}
              className="w-full border-2 border-red-200 text-red-500 py-3 rounded-xl hover:bg-red-50 font-medium transition-colors">
              Hủy đơn hàng
            </button>
          )}

          {booking.status === 'completed' && booking.paymentStatus === 'unpaid' && (
            <>
              {booking.paymentMethod === 'vnpay' && (
                <button onClick={handleVNPayPayment}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-colors">
                  🏦 Thanh toán qua VNPay
                </button>
              )}
              {booking.paymentMethod === 'bank_transfer' && (
                <button onClick={handleShowBankQR}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-semibold flex items-center justify-center gap-2 transition-colors">
                  🏧 Xem thông tin chuyển khoản
                </button>
              )}
              {booking.paymentMethod === 'cash' && (
                <button onClick={handleCashPayment}
                  className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 font-semibold transition-colors">
                  💵 Xác nhận đã thanh toán tiền mặt
                </button>
              )}
            </>
          )}

          {booking.status === 'completed' && booking.paymentStatus === 'paid' && !booking.hasReviewed && (
            <button onClick={() => setShowReview(true)}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-xl hover:from-yellow-500 hover:to-orange-500 font-semibold transition-all">
              ⭐ Đánh giá người giúp việc
            </button>
          )}
        </div>
      )}

      {/* Modal: Bank QR */}
      {showBankQR && bankInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-slideUp">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 text-lg">Thông tin chuyển khoản</h2>
              <button onClick={() => setShowBankQR(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center">
                <img src={bankInfo.qrUrl} alt="QR" className="w-48 h-48 rounded-xl border border-gray-200"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  { label: 'Ngân hàng', value: bankInfo.bankName },
                  { label: 'Số TK', value: bankInfo.accountNo, mono: true },
                  { label: 'Chủ TK', value: bankInfo.accountName },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-500">Số tiền</span>
                  <span className="font-bold text-green-600">{Number(bankInfo.amount).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Nội dung CK</span>
                  <span className="font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-mono text-xs">{bankInfo.transferContent}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">Nhập đúng nội dung để đơn được xác nhận tự động</p>
              <div className="flex gap-2">
                <button onClick={handleBankTransferConfirm}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  Đã chuyển khoản
                </button>
                <button onClick={() => setShowBankQR(false)}
                  className="flex-1 border border-gray-200 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Review */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-slideUp">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 text-lg">Đánh giá dịch vụ</h2>
              <button onClick={() => setShowReview(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
            </div>
            <form onSubmit={handleReview} className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">Bạn hài lòng thế nào với {booking.helperName}?</p>
                <StarSelector value={reviewForm.rating} onChange={(r) => setReviewForm(prev => ({ ...prev, rating: r }))} />
                <p className="text-xs text-gray-400 mt-2">
                  {reviewForm.rating === 5 ? '⭐ Xuất sắc!' : reviewForm.rating === 4 ? 'Tốt!' : reviewForm.rating === 3 ? 'Bình thường' : reviewForm.rating === 2 ? 'Không hài lòng' : '😞 Rất tệ'}
                </p>
              </div>
              <div>
                <textarea rows={3} value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Chia sẻ trải nghiệm của bạn với người giúp việc..."
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 btn-primary py-3">Gửi đánh giá</button>
                <button type="button" onClick={() => setShowReview(false)} className="flex-1 border border-gray-200 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
