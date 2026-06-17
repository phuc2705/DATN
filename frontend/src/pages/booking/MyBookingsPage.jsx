import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookingsApi, cancelBookingApi } from '../../api/booking.api';
import CancelBookingModal from '../../components/common/CancelBookingModal';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  Plus,
  Clock,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';

// ─── Filter tabs ──────────────────────────────────────────────────────
const TABS = [
  { key: 'all',         label: 'Tất cả' },
  { key: 'pending',     label: 'Chờ xác nhận' },
  { key: 'confirmed',   label: 'Đã xác nhận' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'completed',   label: 'Hoàn thành' },
  { key: 'cancelled',   label: 'Đã hủy' },
];

// ─── Left border accent per status ───────────────────────────────────
const STATUS_ACCENT = {
  pending:     'border-l-yellow-400',
  confirmed:   'border-l-blue-400',
  in_progress: 'border-l-indigo-500',
  completed:   'border-l-green-500',
  cancelled:   'border-l-red-400',
};

// ─── Statuses that allow cancellation ────────────────────────────────
const CANCELLABLE = new Set(['pending', 'confirmed']);

// ─── Booking card ─────────────────────────────────────────────────────
function BookingCard({ booking: b, onNavigate, onCancel, cancelling }) {
  const sl = BOOKING_STATUS_LABEL[b.status] || { text: b.status, color: 'bg-gray-100 text-gray-600' };
  const accentBorder = STATUS_ACCENT[b.status] || 'border-l-gray-300';
  const canCancel = CANCELLABLE.has(b.status);

  const handleCancelClick = (e) => {
    e.stopPropagation();
    onCancel(b.bookingId);
  };

  return (
    <div
      onClick={() => onNavigate(b.bookingId)}
      className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${accentBorder}
        cursor-pointer transition-all duration-150
        hover:shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px,rgba(0,0,0,0.1)_0_4px_8px]
        active:scale-[0.995]`}
    >
      <div className="p-5">
        {/* Top row: title + status badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#222222] text-base truncate">
                {b.serviceName || `Đơn #${b.bookingId}`}
              </h3>
              <span className="text-xs text-[#6a6a6a] flex-shrink-0">{b.bookingId}</span>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1 flex-shrink-0 ${sl.color}`}>
            {sl.text}
          </span>
        </div>

        {/* Meta rows */}
        <div className="space-y-1.5 text-sm text-[#6a6a6a]">
          {/* Date & time */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />
            <span>{formatDate(b.bookingDate)}</span>
            <span className="text-[#dddddd]">·</span>
            <Clock className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />
            <span>{b.startTime} – {b.endTime}</span>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />
            <span className="truncate">{b.address}</span>
          </div>

          {/* Helper */}
          {b.helperName && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-orange-500" />
              </div>
              <span className="text-[#222222] font-medium">{b.helperName}</span>
            </div>
          )}
        </div>

        {/* Bottom row: price + actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-orange-500">{formatPrice(b.totalPrice)}</span>
            {b.paymentStatus === 'unpaid' && b.status === 'completed' && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Chưa thanh toán
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={cancelling === b.bookingId}
                className="flex items-center gap-1 text-xs font-medium text-[#6a6a6a] hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {cancelling === b.bookingId ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Hủy
              </button>
            )}
            <div className="flex items-center gap-1 text-xs font-medium text-orange-500 border border-orange-200 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors">
              Chi tiết
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────
function EmptyState({ tab, onNewBooking }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ClipboardList className="w-8 h-8 text-gray-400" />
      </div>
      <p className="font-semibold text-[#222222] mb-1">Chưa có đơn hàng nào</p>
      <p className="text-sm text-[#6a6a6a] mb-6">
        {tab === 'all'
          ? 'Bạn chưa đặt lịch giúp việc nào.'
          : 'Không có đơn hàng ở trạng thái này.'}
      </p>
      <button
        onClick={onNewBooking}
        className="inline-flex items-center gap-2 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm px-5 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Đặt lịch ngay
      </button>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────
function BookingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="h-5 bg-gray-100 rounded w-40" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-56" />
            <div className="h-4 bg-gray-100 rounded w-48" />
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="h-5 bg-gray-100 rounded w-24" />
            <div className="h-8 bg-gray-100 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────
export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    getMyBookingsApi()
      .then(({ data }) => setBookings(data.data || []))
      .catch(() => toast.error('Không thể tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);
  const countByStatus = (key) =>
    key === 'all' ? bookings.length : bookings.filter((b) => b.status === key).length;

  const [cancelTargetId, setCancelTargetId] = useState(null);

  const handleCancel = (id) => setCancelTargetId(id);

  const handleCancelConfirm = async (reason) => {
    const id = cancelTargetId;
    setCancelling(id);
    try {
      await cancelBookingApi(id, reason);
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === id ? { ...b, status: 'cancelled' } : b))
      );
      toast.success('Đã hủy đơn hàng');
      setCancelTargetId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-[fadeIn_0.2s_ease]">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#222222] leading-tight">Lịch đặt của tôi</h1>
          <p className="text-sm text-[#6a6a6a] mt-1">
            {loading ? 'Đang tải...' : `${bookings.length} đơn hàng`}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm px-4 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Đặt lịch mới</span>
          <span className="sm:hidden">Đặt mới</span>
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {TABS.map((t) => {
          const count = countByStatus(t.key);
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 h-9 rounded-full text-sm font-medium transition-all flex-shrink-0
                ${active
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-[#6a6a6a] border border-gray-200 hover:border-orange-300 hover:text-orange-500'
                }`}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-bold
                    ${active ? 'bg-white/25 text-white' : 'bg-gray-100 text-[#6a6a6a]'}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <BookingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} onNewBooking={() => navigate('/')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard
              key={b.bookingId}
              booking={b}
              onNavigate={(id) => navigate(`/bookings/${id}`)}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))}
        </div>
      )}

      {cancelTargetId && (
        <CancelBookingModal
          loading={cancelling === cancelTargetId}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTargetId(null)}
        />
      )}
    </div>
  );
}
