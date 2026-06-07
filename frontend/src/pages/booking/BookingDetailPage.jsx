import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getBookingDetailApi, cancelBookingApi, getBookingSuggestionsApi } from '../../api/booking.api';
import FeedbackModal from '../../components/common/FeedbackModal';
import {
  confirmPaymentApi, createVNPayUrlApi, getBankTransferInfoApi,
  createVNPayDepositUrlApi, createVNPayRemainingUrlApi, confirmRemainingPaymentApi,
} from '../../api/payment.api';
import { createReviewApi } from '../../api/review.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { getSocket } from '../../socket/socket';
import toast from 'react-hot-toast';
import {
  ClipboardList, CheckCircle, Home, Trophy, XCircle,
  Calendar, Clock, MapPin, FileText, Phone,
  Building2, CreditCard, Wallet, Star,
  Frown, Loader2, ArrowLeft, X, ChevronRight, AlertTriangle, RefreshCw,
} from 'lucide-react';

// Tính thời điểm timeout của booking pending
function getTimeoutAt(booking) {
  if (!booking?.createdAt || !booking?.bookingDate || !booking?.startTime) return null;
  const created = new Date(booking.createdAt);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const bookingDay = new Date(booking.bookingDate + 'T00:00:00');
  const isSameDay = bookingDay.getTime() === today.getTime();
  const timeoutMs = isSameDay ? 2 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
  return new Date(created.getTime() + timeoutMs);
}

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = targetDate - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return remaining;
}

function formatCountdown(ms) {
  if (ms == null || ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const STATUS_STEPS = [
  { key: 'pending',     label: 'Đã đặt lịch',   Icon: ClipboardList, desc: 'Đơn đang chờ người giúp việc nhận' },
  { key: 'confirmed',   label: 'Đã xác nhận',    Icon: CheckCircle,   desc: 'Người giúp việc đã nhận đơn' },
  { key: 'in_progress', label: 'Đang thực hiện', Icon: Home,          desc: 'Người giúp việc đang làm việc' },
  { key: 'completed',   label: 'Hoàn thành',     Icon: Trophy,        desc: 'Công việc đã hoàn thành' },
];

const STATUS_ORDER = { pending: 0, confirmed: 1, in_progress: 2, completed: 3 };

function StatusTimeline({ status, booking }) {
  if (status === 'cancelled') {
    const cancelLog = booking?.logs?.find(l =>
      l.newStatus === 'cancelled' || l.new_status === 'cancelled'
    );
    const isAutoCancel = cancelLog?.note?.includes('Tự động hủy');
    const isRefundPending     = booking?.paymentStatus === 'refund_pending';
    const isRefunded          = booking?.paymentStatus === 'refunded';
    const isDepositForfeited  = booking?.paymentStatus === 'deposit_forfeited';

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-red-700 text-sm">
              {isAutoCancel ? 'Đơn đã tự động hủy' : 'Đơn đã bị hủy'}
            </p>
            <p className="text-xs text-red-400 mt-0.5">
              {isAutoCancel
                ? 'Không tìm được người giúp việc trong thời gian quy định'
                : 'Đơn hàng này đã được hủy'}
            </p>
          </div>
        </div>
        {(isRefundPending || isRefunded) && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <RefreshCw className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-700">
                {isRefunded ? 'Đã hoàn tiền' : 'Đang xử lý hoàn cọc'}
              </p>
              <p className="text-xs text-blue-500 mt-0.5">
                {isRefunded
                  ? 'Tiền đã được hoàn lại vào tài khoản của bạn'
                  : 'Tiền cọc sẽ được hoàn lại trong 1–3 ngày làm việc'}
              </p>
            </div>
          </div>
        )}
        {isDepositForfeited && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Tiền cọc đã chuyển cho người giúp việc</p>
              <p className="text-xs text-red-500 mt-0.5">
                Do bạn hủy đơn sau khi người giúp việc đã nhận, tiền cọc 70% được dùng để bù đắp chi phí di chuyển của họ.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[status] ?? 0;

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, idx) => {
        const isDone    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;
        const IconComp  = step.Icon;

        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                isDone    ? 'bg-green-500 border-green-500 text-white' :
                isCurrent ? 'bg-orange-500 border-orange-500 text-white' :
                            'bg-white border-gray-200 text-gray-300'
              }`}>
                {isDone
                  ? <CheckCircle className="w-4 h-4" />
                  : <IconComp className="w-4 h-4" />}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 mt-1 rounded-full ${isDone ? 'bg-green-300' : 'bg-gray-100'}`} />
              )}
            </div>

            <div className="pb-5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm ${
                  isDone ? 'text-green-700' : isCurrent ? 'text-orange-600' : 'text-gray-300'
                }`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                    Hiện tại
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isPending ? 'text-gray-300' : 'text-gray-500'}`}>
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StarSelector({ value, onChange }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className="transition-transform active:scale-95">
          <Star className={`w-8 h-8 transition-colors ${
            n <= value ? 'text-orange-400 fill-orange-400' : 'text-gray-200 hover:text-gray-300'
          }`} />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = { 5: 'Xuất sắc!', 4: 'Tốt!', 3: 'Bình thường', 2: 'Không hài lòng', 1: 'Rất tệ' };

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { user }      = useAuth();
  const autoPayRef    = useRef(false);

  const [booking,      setBooking]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [reviewForm,   setReviewForm]   = useState({ rating: 5, comment: '' });
  const [showReview,   setShowReview]   = useState(false);
  const [bankInfo,     setBankInfo]     = useState(null);
  const [showBankQR,   setShowBankQR]   = useState(false);
  const [suggestions,  setSuggestions]  = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Countdown đến khi tự động hủy (chỉ áp dụng khi pending)
  const timeoutAt   = booking?.status === 'pending' ? getTimeoutAt(booking) : null;
  const countdownMs = useCountdown(timeoutAt);

  const refresh = () => {
    getBookingDetailApi(bookingId)
      .then(({ data }) => setBooking(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [bookingId]);

  // Tự động mở QR chuyển khoản nếu vừa đặt lịch xong với bank_transfer
  useEffect(() => {
    if (!booking || autoPayRef.current) return;
    if (searchParams.get('showPayment') !== '1') return;
    if (booking.paymentMethod === 'bank_transfer' && booking.paymentStatus === 'unpaid') {
      autoPayRef.current = true;
      getBankTransferInfoApi(bookingId)
        .then(({ data }) => { setBankInfo(data.data); setShowBankQR(true); })
        .catch(() => {});
    }
  }, [booking]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => {
      if (data.bookingId === parseInt(bookingId)) refresh();
    };
    socket.on('booking:update', handler);
    return () => socket.off('booking:update', handler);
  }, [bookingId]);

  // Tải gợi ý khung giờ thay thế khi đơn bị tự động hủy
  useEffect(() => {
    if (!booking) return;
    if (booking.status !== 'cancelled') return;
    const cancelLog = booking.logs?.find(l =>
      l.newStatus === 'cancelled' || l.new_status === 'cancelled'
    );
    if (!cancelLog?.note?.includes('Tự động hủy')) return;
    if (suggestions !== null) return; // đã load
    getBookingSuggestionsApi(bookingId)
      .then(({ data }) => setSuggestions(data.data?.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [booking]);

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

  // Thanh toán cọc 70% (khi booking ở trạng thái unpaid + deposit required)
  const handleVNPayDeposit = async () => {
    try {
      const { data } = await createVNPayDepositUrlApi(bookingId);
      window.location.href = data.data.paymentUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo link đặt cọc VNPay');
    }
  };

  // Thanh toán 30% còn lại qua VNPay
  const handleVNPayRemaining = async () => {
    try {
      const { data } = await createVNPayRemainingUrlApi(bookingId);
      window.location.href = data.data.paymentUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo link thanh toán');
    }
  };

  // Xác nhận thanh toán 30% còn lại bằng tiền mặt
  const handleCashRemaining = async () => {
    if (!confirm('Xác nhận khách đã thanh toán 30% còn lại bằng tiền mặt?')) return;
    try {
      await confirmRemainingPaymentApi(bookingId);
      toast.success('Xác nhận thanh toán thành công!');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xác nhận thanh toán');
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Frown className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">Không tìm thấy đơn hàng</p>
          <p className="text-sm text-gray-400 mt-1">Đơn hàng không tồn tại hoặc đã bị xóa</p>
        </div>
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Về danh sách đơn
        </button>
      </div>
    );
  }

  const sl = BOOKING_STATUS_LABEL[booking.status] || {};
  const pl = PAYMENT_STATUS_LABEL[booking.paymentStatus] || {};

  const paymentMethodDisplay = {
    vnpay:         { Icon: Building2, label: 'VNPay' },
    bank_transfer: { Icon: CreditCard, label: 'Chuyển khoản' },
    cash:          { Icon: Wallet, label: 'Tiền mặt' },
  }[booking.paymentMethod] || { Icon: Wallet, label: booking.paymentMethod };

  const PayIcon = paymentMethodDisplay.Icon;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Page title row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Đơn {booking.bookingId}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{booking.serviceName || 'Dịch vụ giúp việc'}</p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap ${sl.color}`}>
            {sl.text}
          </span>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — main info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Helper info card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Người giúp việc</h2>

              {booking.helperName ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {booking.helperAvatar
                      ? <img src={booking.helperAvatar} alt={booking.helperName} className="w-full h-full object-cover" />
                      : <span className="text-xl font-bold text-orange-600">{booking.helperName?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{booking.helperName}</p>
                    {booking.helperPhone && (
                      <a
                        href={`tel:${booking.helperPhone}`}
                        className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 mt-1 transition-colors w-fit"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {booking.helperPhone}
                      </a>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium border border-green-100 flex-shrink-0">
                    <CheckCircle className="w-3 h-3" /> Xác minh
                  </span>
                </div>
              ) : booking.status === 'pending' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800">Đang tìm người giúp việc</p>
                      <p className="text-xs text-amber-600 mt-0.5">Hệ thống đang phân công phù hợp nhất...</p>
                      {countdownMs != null && (
                        <p className="flex items-center gap-1 text-xs text-amber-700 mt-1.5">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="font-mono font-semibold">
                            {countdownMs > 0 ? formatCountdown(countdownMs) : '00:00'}
                          </span>
                          <span className="text-amber-500">còn lại trước khi tự động hủy</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {countdownMs != null && timeoutAt && (
                    <div className="h-1 bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.max(0, (countdownMs / (timeoutAt.getTime() - new Date(booking.createdAt).getTime())) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Chưa có người nhận đơn</p>
              )}
            </div>

            {/* Booking details card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Chi tiết đơn hàng</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Ngày làm</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDate(booking.bookingDate)}</p>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Thời gian</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {booking.startTime} – {booking.endTime}
                      <span className="text-gray-400 font-normal ml-1.5">({booking.hours}h)</span>
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Địa chỉ</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{booking.address}</p>
                  </div>
                </div>

                {booking.note && (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Ghi chú</p>
                        <p className="text-sm text-gray-600 italic mt-0.5">{booking.note}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status timeline card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Tiến trình đơn hàng</h2>
              <StatusTimeline status={booking.status} booking={booking} />
            </div>

            {/* Gợi ý khung giờ thay thế (chỉ hiện khi bị tự động hủy) */}
            {suggestions && suggestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-orange-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw className="w-4 h-4 text-orange-500" />
                  <h2 className="text-base font-semibold text-gray-900">Khung giờ thay thế</h2>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Các khung giờ sau đang có người giúp việc sẵn sàng:
                </p>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(`/book?date=${s.bookingDate}&start=${s.startTime}&serviceId=${booking.serviceId}`)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors group"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                          {new Date(s.bookingDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.startTime} – {s.endTime}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium border border-green-100">
                          {s.availableHelpers} người rảnh
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — summary & actions */}
          <div className="space-y-5">

            {/* Price breakdown card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Chi tiết thanh toán</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Giá cơ bản ({booking.hours}h)</span>
                  <span>{formatPrice(booking.basePrice)}</span>
                </div>

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>−{formatPrice(booking.discountAmount)}</span>
                  </div>
                )}

                <div className="h-px bg-gray-100" />

                <div className="flex justify-between font-bold text-base text-gray-900">
                  <span>Tổng tiền</span>
                  <span className="text-orange-500">{formatPrice(booking.totalPrice)}</span>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex justify-between text-gray-600">
                  <span>Phương thức</span>
                  <span className="font-medium flex items-center gap-1.5 text-gray-800">
                    <PayIcon className="w-3.5 h-3.5 text-gray-500" />
                    {paymentMethodDisplay.label}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>Trạng thái</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pl.color}`}>
                    {pl.text}
                  </span>
                </div>

                {/* Thông tin đặt cọc */}
                {booking.paymentStatus === 'deposit_paid' && booking.depositAmount && (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="bg-blue-50 rounded-xl p-3 space-y-1.5 text-sm">
                      <div className="flex justify-between text-blue-700">
                        <span className="font-medium">Đã cọc (70%)</span>
                        <span className="font-bold">{formatPrice(booking.depositAmount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Còn lại (30%)</span>
                        <span className="font-medium text-orange-600">
                          {formatPrice(booking.totalPrice - booking.depositAmount)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons — Customer */}
            {user?.userType === 'customer' && (
              <div className="space-y-3">
                {booking.status === 'pending' && (
                  <button
                    onClick={handleCancel}
                    className="w-full border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 h-12 rounded-lg font-medium text-sm transition-colors"
                  >
                    Hủy đơn hàng
                  </button>
                )}

                {booking.paymentStatus === 'unpaid' && (
                  <>
                    {booking.paymentMethod === 'vnpay' && (
                      <button
                        onClick={handleVNPayDeposit}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        Đặt cọc 70% qua VNPay
                      </button>
                    )}
                    {booking.paymentMethod === 'bank_transfer' && (
                      <button
                        onClick={handleShowBankQR}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        Xem thông tin chuyển khoản
                      </button>
                    )}
                    {booking.paymentMethod === 'cash' && booking.status === 'completed' && (
                      <button
                        onClick={handleCashPayment}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Wallet className="w-4 h-4" />
                        Xác nhận đã thanh toán tiền mặt
                      </button>
                    )}
                  </>
                )}

                {/* Thanh toán 30% còn lại khi dịch vụ hoàn thành */}
                {booking.paymentStatus === 'deposit_paid' && booking.status === 'completed' && (
                  <div className="space-y-2.5">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <p className="text-sm font-semibold text-orange-800 mb-0.5">Dịch vụ đã hoàn thành!</p>
                      <p className="text-xs text-orange-600">
                        Vui lòng thanh toán {formatPrice(booking.totalPrice - (booking.depositAmount || 0))} còn lại (30%)
                      </p>
                    </div>
                    <button
                      onClick={handleCashRemaining}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Đã trả 30% tiền mặt cho nhân viên
                    </button>
                    <button
                      onClick={handleVNPayRemaining}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Thanh toán 30% qua VNPay
                    </button>
                  </div>
                )}

                {/* Deposit đang chờ thanh toán (booking pending, deposit required) */}
                {booking.paymentStatus === 'unpaid' && booking.status === 'pending' && booking.paymentMethod === 'vnpay' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 font-medium">
                      Vui lòng hoàn tất đặt cọc để đơn được xử lý. Nhấn nút trên để thanh toán qua VNPay.
                    </p>
                  </div>
                )}

                {booking.status === 'completed' && booking.paymentStatus === 'paid' && !booking.hasReviewed && (
                  <button
                    onClick={() => setShowReview(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    Đánh giá người giúp việc
                  </button>
                )}

                {booking.status === 'completed' && booking.paymentStatus === 'paid' && booking.hasReviewed && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">Bạn đã đánh giá đơn này</p>
                  </div>
                )}
              </div>
            )}

            {/* Booking ID note */}
            <p className="text-xs text-gray-400 text-center">
              Mã đơn: <span className="font-mono font-semibold text-gray-600">{booking.bookingId}</span>
            </p>

            {/* Báo cáo vấn đề */}
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Báo cáo vấn đề với đơn này
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Bank Transfer QR */}
      {showBankQR && bankInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Thông tin chuyển khoản</h2>
              <button
                onClick={() => setShowBankQR(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-center">
                <img
                  src={bankInfo.qrUrl}
                  alt="QR Code"
                  className="w-48 h-48 rounded-xl border border-gray-200 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                {[
                  { label: 'Ngân hàng', value: bankInfo.bankName },
                  { label: 'Số TK', value: bankInfo.accountNo, mono: true },
                  { label: 'Chủ TK', value: bankInfo.accountName },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
                  </div>
                ))}

                <div className="h-px bg-gray-200" />

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Số tiền</span>
                  <span className="font-bold text-green-600 text-base">
                    {Number(bankInfo.amount).toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Nội dung CK</span>
                  <span className="font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg font-mono text-xs">
                    {bankInfo.transferContent}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Nhập đúng nội dung để đơn được xác nhận tự động
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleBankTransferConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11 rounded-lg font-medium text-sm transition-colors"
                >
                  Đã chuyển khoản
                </button>
                <button
                  onClick={() => setShowBankQR(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 h-11 rounded-lg font-medium text-sm transition-colors"
                >
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
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Đánh giá dịch vụ</h2>
              <button
                onClick={() => setShowReview(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReview} className="p-5 space-y-5">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Bạn hài lòng thế nào với <span className="font-semibold text-gray-800">{booking.helperName}</span>?
                </p>
                <StarSelector
                  value={reviewForm.rating}
                  onChange={(r) => setReviewForm(prev => ({ ...prev, rating: r }))}
                />
                <p className="text-sm font-medium text-orange-500 mt-2">
                  {RATING_LABELS[reviewForm.rating]}
                </p>
              </div>

              <textarea
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Chia sẻ trải nghiệm của bạn với người giúp việc..."
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-900 focus:outline-none resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-lg font-medium text-sm transition-colors"
                >
                  Gửi đánh giá
                </button>
                <button
                  type="button"
                  onClick={() => setShowReview(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 h-11 rounded-lg font-medium text-sm transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedback && (
        <FeedbackModal
          onClose={() => setShowFeedback(false)}
          userType="customer"
          bookingId={booking.bookingId}
        />
      )}
    </div>
  );
}
