import { useEffect, useState } from 'react';
import {
  getAdminBookingsApi,
  assignHelperApi,
  getAvailableHelpersApi,
  cancelAdminBookingApi,
  getExpiringBookingsApi,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatPrice, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  Search, X, Eye, XCircle, ClipboardList, Clock,
  CheckCircle, TrendingUp, RefreshCw, User, Briefcase,
  Calendar, DollarSign, AlertTriangle,
} from 'lucide-react';

// ── Design tokens (Linear dark system) ───────────────────────────────────────
// canvas #010102 | surface-1 #0f1117 | surface-2 #16181f | surface-3 #1e2028
// hairline #23252a | ink #f7f8f8 | ink-muted #d0d6e0 | ink-subtle #8a8f98
// ink-tertiary #62666d | primary #5e6ad2 | primary-hover #828fff
// ─────────────────────────────────────────────────────────────────────────────

const STATUS = {
  pending:     { label: 'Chờ xác nhận', dot: 'bg-yellow-400',  badge: 'bg-yellow-400/10  text-yellow-300  border border-yellow-400/20'  },
  confirmed:   { label: 'Đã xác nhận',  dot: 'bg-blue-400',    badge: 'bg-blue-400/10    text-blue-300    border border-blue-400/20'    },
  in_progress: { label: 'Đang làm',     dot: 'bg-violet-400',  badge: 'bg-violet-400/10  text-violet-300  border border-violet-400/20'  },
  completed:   { label: 'Hoàn thành',   dot: 'bg-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' },
  cancelled:   { label: 'Đã hủy',       dot: 'bg-red-400',     badge: 'bg-red-400/10     text-red-400     border border-red-400/20'     },
};

const STATUS_TABS = [
  { value: '',            label: 'Tất cả'       },
  { value: 'pending',     label: 'Chờ xác nhận' },
  { value: 'confirmed',   label: 'Đã xác nhận'  },
  { value: 'in_progress', label: 'Đang làm'      },
  { value: 'completed',   label: 'Hoàn thành'   },
  { value: 'cancelled',   label: 'Đã hủy'        },
];

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS[status] ?? {
    label: status,
    dot: 'bg-gray-400',
    badge: 'bg-gray-400/10 text-gray-400 border border-gray-400/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── DetailModal ───────────────────────────────────────────────────────────────
function DetailModal({ booking, onClose, onAssign }) {
  const fields = [
    { Icon: User,          label: 'Khách hàng',      value: booking.customerName || '—'                    },
    { Icon: Briefcase,     label: 'Người giúp việc',  value: booking.helperName   || 'Chưa giao việc'      },
    { Icon: Calendar,      label: 'Ngày đặt',         value: formatDate(booking.bookingDate)                },
    { Icon: Clock,         label: 'Giờ làm',          value: `${booking.startTime} – ${booking.endTime}`   },
    { Icon: ClipboardList, label: 'Dịch vụ',          value: booking.serviceName  || '—'                   },
    { Icon: DollarSign,    label: 'Tổng tiền',        value: formatPrice(booking.totalPrice)                },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-lg bg-[#0f1117] border border-[#23252a] rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23252a]">
          <div>
            <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest mb-0.5">Đơn hàng</p>
            <h3 className="text-[#f7f8f8] font-semibold text-base" style={{ letterSpacing: '-0.3px' }}>
              {booking.bookingId}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#62666d] hover:text-[#f7f8f8] hover:bg-[#1e2028] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {fields.map(({ Icon, label, value }) => (
              <div key={label} className="bg-[#0a0b0f] border border-[#1e2028] rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3 h-3 text-[#62666d]" />
                  <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest">{label}</p>
                </div>
                <p className="text-sm text-[#f7f8f8] font-medium">{value}</p>
              </div>
            ))}
          </div>

          {booking.address && (
            <div className="bg-[#0a0b0f] border border-[#1e2028] rounded-md p-3">
              <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest mb-1.5">Địa chỉ</p>
              <p className="text-sm text-[#d0d6e0]">{booking.address}</p>
            </div>
          )}

          {booking.notes && (
            <div className="bg-[#0a0b0f] border border-[#1e2028] rounded-md p-3">
              <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest mb-1.5">Ghi chú</p>
              <p className="text-sm text-[#d0d6e0]">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#23252a] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"
          >
            Đóng
          </button>
          {booking.status === 'pending' && !booking.helperName && (
            <button
              onClick={() => onAssign(booking)}
              className="px-4 py-2 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md transition-colors"
            >
              Giao việc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CancelModal ───────────────────────────────────────────────────────────────
function CancelModal({ booking, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-sm bg-[#0f1117] border border-[#23252a] rounded-lg shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-md bg-red-400/10 border border-red-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-[#f7f8f8] font-semibold text-base" style={{ letterSpacing: '-0.3px' }}>
                Hủy đơn hàng
              </h3>
              <p className="text-[#8a8f98] text-xs mt-0.5">
                Đơn {booking.bookingId} · {booking.customerName}
              </p>
            </div>
          </div>

          <p className="text-sm text-[#d0d6e0] leading-relaxed mb-6">
            Hành động này không thể hoàn tác. Đơn hàng sẽ bị hủy và khách hàng sẽ được thông báo.
          </p>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-[#8a8f98] hover:text-[#f7f8f8] border border-[#23252a] rounded-md hover:bg-[#1e2028] transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-400/25 rounded-md transition-all disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AssignModal ───────────────────────────────────────────────────────────────
function AssignModal({ booking, onClose, onSaved }) {
  const [helpers, setHelpers] = useState([]);
  const [loadingHelpers, setLoadingHelpers] = useState(true);
  const [selectedHelper, setSelectedHelper] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAvailableHelpersApi(booking.bookingId)
      .then(({ data }) => {
        const list = Array.isArray(data.data)
          ? data.data
          : [...(data.data?.nearby || []), ...(data.data?.farAway || [])];
        setHelpers(list);
      })
      .catch(() => toast.error('Không thể tải danh sách helper'))
      .finally(() => setLoadingHelpers(false));
  }, [booking.bookingId]);

  const handleAssign = async () => {
    if (!selectedHelper) return;
    setSaving(true);
    try {
      await assignHelperApi(booking.bookingId, parseInt(selectedHelper));
      toast.success('Đã giao việc thành công!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Giao việc thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md bg-[#0f1117] border border-[#23252a] rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23252a]">
          <div>
            <h3 className="text-[#f7f8f8] font-semibold text-base" style={{ letterSpacing: '-0.3px' }}>
              Giao việc cho helper
            </h3>
            <p className="text-[#8a8f98] text-xs mt-0.5">
              Đơn {booking.bookingId} · {formatDate(booking.bookingDate)} · {booking.startTime}–{booking.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#62666d] hover:text-[#f7f8f8] hover:bg-[#1e2028] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          {loadingHelpers ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : helpers.length === 0 ? (
            <p className="text-center text-[#62666d] text-sm py-8">Không có helper phù hợp.</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto mb-4 -mx-1 px-1">
              {helpers.map((h) => {
                const id = String(h.helperId || h.helper_id);
                const selected = selectedHelper === id;
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                      selected
                        ? 'border-[#5e6ad2] bg-[#5e6ad2]/10'
                        : 'border-[#23252a] hover:border-[#2e3038] bg-[#0a0b0f]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="helper"
                      value={id}
                      checked={selected}
                      onChange={(e) => setSelectedHelper(e.target.value)}
                      className="hidden"
                    />
                    {/* Custom radio */}
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected ? 'border-[#5e6ad2]' : 'border-[#2e3038]'
                    }`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-[#5e6ad2]" />}
                    </div>
                    <Avatar name={h.fullName || h.full_name} avatarUrl={h.avatarUrl || h.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f7f8f8] truncate">{h.fullName || h.full_name}</p>
                      <p className="text-xs text-[#8a8f98]">
                        {Number(h.hourlyRate || h.hourly_rate || 0).toLocaleString()}đ/h
                        {h.distanceKm != null && ` · ${h.distanceKm}km`}
                        {(h.ratingAverage || h.rating_average)
                          ? ` · ★${Number(h.ratingAverage || h.rating_average).toFixed(1)}`
                          : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${
                      (h.isAvailable || h.is_available) ? 'text-emerald-400' : 'text-[#62666d]'
                    }`}>
                      {(h.isAvailable || h.is_available) ? 'Rảnh' : 'Bận'}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-[#8a8f98] hover:text-[#f7f8f8] border border-[#23252a] rounded-md hover:bg-[#1e2028] transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedHelper || saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#5e6ad2] hover:bg-[#828fff] text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang giao...' : 'Giao việc'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [expiring, setExpiring] = useState([]);

  const fetchBookings = (s) => {
    setLoading(true);
    const params = {};
    if (s) params.status = s;
    getAdminBookingsApi(params)
      .then(({ data }) => setBookings(data.data?.bookings || []))
      .catch(() => toast.error('Không thể tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(statusFilter); }, [statusFilter]);

  useEffect(() => {
    getExpiringBookingsApi()
      .then(({ data }) => setExpiring(data.data || []))
      .catch(() => {});
    const interval = setInterval(() => {
      getExpiringBookingsApi()
        .then(({ data }) => setExpiring(data.data || []))
        .catch(() => {});
    }, 60_000); // cập nhật mỗi phút
    return () => clearInterval(interval);
  }, []);

  const refresh = () => fetchBookings(statusFilter);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelAdminBookingApi(cancelTarget.bookingId);
      toast.success('Đã hủy đơn hàng');
      setCancelTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  // Lọc phía client theo tên khách hàng
  const displayed = search.trim()
    ? bookings.filter((b) => b.customerName?.toLowerCase().includes(search.toLowerCase()))
    : bookings;

  // Thống kê nhanh
  const statCards = [
    {
      label: 'Tổng đơn',
      value: bookings.length,
      Icon: ClipboardList,
      cls: 'text-[#f7f8f8]',
      iconCls: 'text-[#8a8f98]',
    },
    {
      label: 'Chờ xác nhận',
      value: bookings.filter((b) => b.status === 'pending').length,
      Icon: Clock,
      cls: 'text-yellow-300',
      iconCls: 'text-yellow-400/60',
    },
    {
      label: 'Hoàn thành',
      value: bookings.filter((b) => b.status === 'completed').length,
      Icon: CheckCircle,
      cls: 'text-emerald-400',
      iconCls: 'text-emerald-400/60',
    },
    {
      label: 'Doanh thu',
      value: formatPrice(
        bookings
          .filter((b) => b.status === 'completed')
          .reduce((s, b) => s + Number(b.totalPrice || 0), 0)
      ),
      Icon: TrendingUp,
      cls: 'text-[#828fff]',
      iconCls: 'text-[#5e6ad2]/70',
    },
  ];

  return (
    <div className="animate-fadeIn">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest mb-1.5">Admin</p>
          <h1
            className="text-2xl font-semibold text-[#f7f8f8]"
            style={{ letterSpacing: '-0.6px' }}
          >
            Quản lý đơn hàng
          </h1>
          <p className="text-sm text-[#8a8f98] mt-1">
            {bookings.length} đơn trong hệ thống
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#8a8f98] hover:text-[#f7f8f8] bg-[#0f1117] border border-[#23252a] rounded-md hover:bg-[#1e2028] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* ── Đơn sắp hết hạn — cần điều phối thủ công ───────────────────────── */}
      {expiring.length > 0 && (
        <div className="mb-6 border border-yellow-500/20 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-yellow-300">
              {expiring.length} đơn đang chờ — sắp hết hạn, cần điều phối thủ công
            </p>
          </div>
          <div className="divide-y divide-[#1e2028]">
            {expiring.map((b) => (
              <div key={b.booking_id} className="flex items-center gap-3 px-4 py-3 bg-[#0f1117] hover:bg-[#16181f] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#d0d6e0] truncate">
                    #{b.booking_id} · {b.service_name}
                  </p>
                  <p className="text-xs text-[#8a8f98] mt-0.5">
                    {b.customer_name} · {b.booking_date} {b.start_time}–{b.end_time}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                    b.minutes_left <= 15 ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {b.minutes_left > 0 ? `${b.minutes_left} phút` : 'Hết hạn'}
                  </span>
                  <button
                    onClick={() => setAssignTarget({
                      bookingId:    b.booking_id,
                      customerName: b.customer_name,
                      serviceName:  b.service_name,
                      bookingDate:  b.booking_date,
                      startTime:    b.start_time,
                      endTime:      b.end_time,
                    })}
                    className="text-xs px-2.5 py-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white rounded font-medium transition-colors"
                  >
                    Điều phối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ label, value, Icon, cls, iconCls }) => (
          <div key={label} className="bg-[#0f1117] border border-[#1e2028] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest">{label}</p>
              <Icon className={`w-4 h-4 ${iconCls}`} />
            </div>
            <p className={`text-2xl font-semibold ${cls}`} style={{ letterSpacing: '-0.4px' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter panel ───────────────────────────────────────────────────── */}
      <div className="bg-[#0f1117] border border-[#1e2028] rounded-lg mb-5 overflow-hidden">
        {/* Status tabs */}
        <div className="flex items-center gap-0.5 px-4 pt-1 overflow-x-auto border-b border-[#1e2028]">
          {STATUS_TABS.map(({ value, label }) => {
            const count = value
              ? bookings.filter((b) => b.status === value).length
              : bookings.length;
            const active = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px ${
                  active
                    ? 'border-[#5e6ad2] text-[#f7f8f8]'
                    : 'border-transparent text-[#8a8f98] hover:text-[#d0d6e0]'
                }`}
              >
                {label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    active
                      ? 'bg-[#5e6ad2]/25 text-[#828fff]'
                      : 'bg-[#1e2028] text-[#62666d]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="px-4 py-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#62666d]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên khách hàng..."
              className="w-full bg-[#0a0b0f] border border-[#23252a] rounded-md pl-9 pr-8 py-2 text-sm text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#62666d] hover:text-[#8a8f98] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table / Empty ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-[#0f1117] border border-[#1e2028] rounded-lg p-16 text-center">
          <ClipboardList className="w-7 h-7 text-[#62666d] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#8a8f98]">Không có đơn hàng nào</p>
          {(search || statusFilter) && (
            <p className="text-xs text-[#62666d] mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[#0f1117] border border-[#1e2028] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a0b0f] border-b border-[#1e2028]">
                  {[
                    'Mã đơn',
                    'Khách hàng',
                    'Người giúp việc',
                    'Dịch vụ',
                    'Ngày đặt',
                    'Tổng tiền',
                    'Trạng thái',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-medium text-[#62666d] uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((b, i) => (
                  <tr
                    key={b.bookingId}
                    className={`group border-b border-[#1e2028] last:border-0 hover:bg-[#131418] transition-colors ${
                      i % 2 !== 0 ? 'bg-[#0b0c10]/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-[#62666d] group-hover:text-[#8a8f98] transition-colors">
                        {b.bookingId}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-[#f7f8f8]">
                        {b.customerName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {b.helperName ? (
                        <span className="text-sm text-[#d0d6e0]">{b.helperName}</span>
                      ) : (
                        <span className="text-xs text-yellow-400/70 font-medium">Chưa giao</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-[#8a8f98]">{b.serviceName || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-[#8a8f98]">{formatDate(b.bookingDate)}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-[#f7f8f8]">
                        {formatPrice(b.totalPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {/* Hiện action khi hover vào dòng */}
                      <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDetailTarget(b)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#d0d6e0] bg-[#1e2028] hover:bg-[#272932] border border-[#2a2d38] rounded-md transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          Chi tiết
                        </button>
                        {!['cancelled', 'completed'].includes(b.status) && (
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/10 border border-red-400/20 rounded-md transition-all"
                          >
                            <XCircle className="w-3 h-3" />
                            Hủy đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {displayed.map((b) => (
              <div
                key={b.bookingId}
                className="bg-[#0f1117] border border-[#1e2028] rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-[#62666d]">{b.bookingId}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm font-medium text-[#f7f8f8] truncate">
                      {b.customerName || '—'}
                    </p>
                    <p className="text-xs text-[#8a8f98] mt-0.5">
                      {b.helperName || (
                        <span className="text-yellow-400/70">Chưa giao việc</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#f7f8f8] whitespace-nowrap flex-shrink-0">
                    {formatPrice(b.totalPrice)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#62666d]">
                    {formatDate(b.bookingDate)}&nbsp;·&nbsp;{b.serviceName || '—'}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailTarget(b)}
                      className="p-1.5 text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#1e2028] rounded-md transition-all"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!['cancelled', 'completed'].includes(b.status) && (
                      <button
                        onClick={() => setCancelTarget(b)}
                        className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                        title="Hủy đơn"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Kết quả */}
          <p className="text-xs text-[#62666d] mt-3 text-right">
            Hiển thị {displayed.length} / {bookings.length} đơn hàng
          </p>
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {detailTarget && (
        <DetailModal
          booking={detailTarget}
          onClose={() => setDetailTarget(null)}
          onAssign={(b) => { setDetailTarget(null); setAssignTarget(b); }}
        />
      )}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancel}
          loading={cancelling}
        />
      )}
      {assignTarget && (
        <AssignModal
          booking={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSaved={() => { setAssignTarget(null); refresh(); }}
        />
      )}
    </div>
  );
}
