import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, MapPin,
  User, X, Banknote, RefreshCw, Plus, Trash2, CheckCircle,
  Info,
} from 'lucide-react';
import { getHelperBookingsApi } from '../../api/booking.api';
import { getHelperShiftsApi, registerShiftApi, cancelShiftApi } from '../../api/user.api';
import { formatPrice, BOOKING_STATUS_LABEL } from '../../utils/format';

/* ─── Ca cố định ~4 tiếng ────────────────────────────────────────── */
const PREDEFINED_SHIFTS = [
  { id: 'morning', label: 'Ca sáng',  time: '06:00 – 10:00', start: '06:00', end: '10:00' },
  { id: 'noon',    label: 'Ca trưa',  time: '10:00 – 14:00', start: '10:00', end: '14:00' },
  { id: 'evening', label: 'Ca chiều', time: '14:00 – 18:00', start: '14:00', end: '18:00' },
  { id: 'night',   label: 'Ca tối',   time: '18:00 – 22:00', start: '18:00', end: '22:00' },
];

/* ─── Hằng số ─────────────────────────────────────────────────────── */
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const STATUS_BLOCK = {
  pending:     { bg: 'bg-yellow-50 border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  confirmed:   { bg: 'bg-blue-50 border-blue-300',    text: 'text-blue-800',   dot: 'bg-blue-500'   },
  in_progress: { bg: 'bg-orange-50 border-orange-300',text: 'text-orange-800', dot: 'bg-orange-500' },
  completed:   { bg: 'bg-green-50 border-green-300',  text: 'text-green-800',  dot: 'bg-green-500'  },
  cancelled:   { bg: 'bg-gray-100 border-gray-300',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
};

/* ─── Tiện ích ngày tháng ─────────────────────────────────────────── */
function getMonday(d) {
  const date = new Date(d);
  const diff = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtDayMonth(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtFull(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

// Giờ VN hiện tại (UTC+7)
function getVNNow() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

// Ca đã hết hạn: ngày trước hôm nay, hoặc hôm nay nhưng giờ kết thúc đã qua
function isShiftExpired(shiftDate, endTime, todayISO) {
  if (!shiftDate) return false;
  if (shiftDate < todayISO) return true;
  if (shiftDate === todayISO) {
    const vn = getVNNow();
    const nowMins = vn.getUTCHours() * 60 + vn.getUTCMinutes();
    const [h, m] = String(endTime).split(':').map(Number);
    return (h * 60 + m) <= nowMins;
  }
  return false;
}

/* ─── Modal chi tiết booking ─────────────────────────────────────── */
function BookingModal({ booking, onClose }) {
  const navigate = useNavigate();
  if (!booking) return null;
  const sl    = BOOKING_STATUS_LABEL[booking.status] || { text: booking.status, color: 'bg-gray-100 text-gray-700' };
  const block = STATUS_BLOCK[booking.status] || STATUS_BLOCK.cancelled;
  const dateObj = new Date(booking.bookingDate + 'T00:00:00');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`px-5 py-4 border-b-2 flex items-center justify-between ${block.bg}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${block.dot}`} />
            <span className={`text-sm font-semibold ${block.text}`}>{sl.text}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="font-semibold text-gray-900 text-base">{booking.serviceName || `Đơn #${booking.bookingId}`}</p>
          <div className="space-y-2">
            <InfoRow icon={Calendar} label={fmtFull(dateObj)} />
            <InfoRow icon={Clock} label={`${booking.startTime} – ${booking.endTime} (${booking.hours}h)`} />
            {booking.address && <InfoRow icon={MapPin} label={booking.address} />}
            {booking.customerName && <InfoRow icon={User} label={booking.customerName} />}
            <InfoRow icon={Banknote} label={formatPrice(booking.totalPrice)} highlight />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Đóng</button>
          <button onClick={() => navigate(`/bookings/${booking.bookingId}`)} className="flex-1 h-10 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-sm font-medium transition-colors">Xem chi tiết</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, highlight }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <span className={`text-sm ${highlight ? 'font-bold text-[#ff385c]' : 'text-gray-700'}`}>{label}</span>
    </div>
  );
}

/* ─── Modal đăng ký ca làm (ca cố định ~4 tiếng) ────────────────── */
function RegisterShiftModal({ onClose, onSuccess, todayISO }) {
  const maxDate  = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return toISODate(d);
  }, []);

  const [shiftDate,     setShiftDate]     = useState(todayISO);
  const [selectedShift, setSelectedShift] = useState(null);
  const [submitting,    setSubmitting]    = useState(false);

  // Tính ca nào hết hạn theo ngày và giờ VN hiện tại
  const expiredShiftIds = useMemo(() => {
    return PREDEFINED_SHIFTS
      .filter((s) => isShiftExpired(shiftDate, s.end, todayISO))
      .map((s) => s.id);
  }, [shiftDate, todayISO]);

  const handleDateChange = (e) => {
    setShiftDate(e.target.value);
    setSelectedShift(null);
  };

  const handleSubmit = async () => {
    if (!shiftDate || !selectedShift) return toast.error('Vui lòng chọn ngày và ca làm.');
    setSubmitting(true);
    try {
      await registerShiftApi({ shiftDate, startTime: selectedShift.start, endTime: selectedShift.end });
      toast.success('Đăng ký ca làm thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đăng ký ca.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Đăng ký ca làm</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ưu tiên nhận đơn trong khung giờ này</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Ngày làm việc */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Ngày làm việc</label>
            <input
              type="date"
              min={todayISO}
              max={maxDate}
              value={shiftDate}
              onChange={handleDateChange}
              className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#ff385c] transition-colors"
            />
          </div>

          {/* Chọn ca */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Chọn ca</label>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_SHIFTS.map((shift) => {
                const expired  = expiredShiftIds.includes(shift.id);
                const selected = selectedShift?.id === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    disabled={expired}
                    onClick={() => !expired && setSelectedShift(shift)}
                    className={`border rounded-xl p-3 text-left transition-all relative ${
                      expired
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-70'
                        : selected
                          ? 'border-[#ff385c] bg-rose-50 ring-1 ring-[#ff385c]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm font-semibold ${expired ? 'text-gray-400' : 'text-gray-800'}`}>{shift.label}</p>
                      {expired && (
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full shrink-0">hết hạn</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${expired ? 'text-gray-400' : 'text-gray-500'}`}>{shift.time}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ghi chú */}
          <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
            <Info className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-green-700">Bạn sẽ được <strong>ưu tiên +15 điểm</strong> khi hệ thống phân đơn vào khung giờ đăng ký.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedShift}
            className="flex-1 h-11 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {submitting ? 'Đang đăng ký...' : 'Đăng ký ca'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Block booking trong ô ngày ─────────────────────────────────── */
function BookingBlock({ booking, onClick }) {
  const block = STATUS_BLOCK[booking.status] || STATUS_BLOCK.cancelled;
  return (
    <button
      onClick={() => onClick(booking)}
      className={`w-full text-left border rounded-lg px-2 py-1.5 mb-1 transition-shadow hover:shadow-md ${block.bg} ${block.text}`}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">{booking.serviceName || `Đơn #${booking.bookingId}`}</p>
      <p className="text-[10px] mt-0.5 opacity-80">{booking.startTime}–{booking.endTime}</p>
    </button>
  );
}

/* ─── Block ca đăng ký trong ô ngày ─────────────────────────────── */
function ShiftBlock({ shift, onCancel, expired }) {
  return (
    <div className={`w-full border rounded-lg px-2 py-1.5 mb-1 flex items-center justify-between gap-1 group ${
      expired ? 'border-gray-300 bg-gray-100' : 'border-green-300 bg-green-50'
    }`}>
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <p className={`text-[11px] font-semibold leading-tight ${expired ? 'text-gray-400' : 'text-green-800'}`}>Ca đăng ký</p>
          {expired && <span className="text-[9px] font-semibold text-gray-400 bg-gray-200 px-1 rounded">hết hạn</span>}
        </div>
        <p className={`text-[10px] mt-0.5 ${expired ? 'text-gray-400' : 'text-green-600'}`}>
          {String(shift.startTime).slice(0, 5)}–{String(shift.endTime).slice(0, 5)}
        </p>
      </div>
      {!expired && onCancel && (
        <button
          onClick={() => onCancel(shift)}
          className="w-5 h-5 rounded-full hover:bg-green-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          title="Hủy ca"
        >
          <X className="w-3 h-3 text-green-700" />
        </button>
      )}
    </div>
  );
}

/* ─── Chú thích legend ───────────────────────────────────────────── */
function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {[
        { status: 'pending',     label: 'Chờ xác nhận',  dot: 'bg-yellow-400' },
        { status: 'confirmed',   label: 'Đã xác nhận',   dot: 'bg-blue-500'   },
        { status: 'in_progress', label: 'Đang làm',      dot: 'bg-orange-500' },
        { status: 'completed',   label: 'Hoàn thành',    dot: 'bg-green-500'  },
      ].map(({ status, label, dot }) => (
        <div key={status} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${dot}`} />
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-green-300 border border-green-400" />
        <span className="text-xs text-gray-500">Ca đăng ký</span>
      </div>
    </div>
  );
}

/* ─── Grid lịch tuần (desktop: 7 cột) ───────────────────────────── */
function WeekGrid({ days, bookingsByDate, shiftsByDate, today, onClickBooking, onCancelShift }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => {
        const key     = toISODate(d);
        const isToday = key === today;
        const isPast  = key < today;
        return (
          <div key={i} className="text-center pb-1.5">
            <p className={`text-[11px] font-medium ${isToday ? 'text-[#ff385c]' : isPast ? 'text-gray-300' : 'text-gray-400'}`}>{DAY_LABELS[i]}</p>
            <p className={`text-sm font-bold mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isToday ? 'bg-[#ff385c] text-white' : isPast ? 'text-gray-300' : 'text-gray-800'}`}>
              {d.getDate()}
            </p>
          </div>
        );
      })}

      {days.map((d, i) => {
        const key     = toISODate(d);
        const bks     = bookingsByDate[key] || [];
        const shfs    = shiftsByDate[key]   || [];
        const isToday = key === today;
        const isPast  = key < today;

        return (
          <div key={i} className={`min-h-[120px] rounded-xl p-1.5 ${
            isToday ? 'bg-rose-50 border border-rose-200'
            : isPast ? 'bg-gray-50 border border-gray-100 opacity-60'
            : 'bg-white border border-gray-100'
          }`}>
            {/* Ca đăng ký (xanh lá / xám nếu hết hạn) */}
            {shfs.map((s) => {
              const expired = isShiftExpired(key, s.endTime, today);
              return (
                <ShiftBlock key={s.id} shift={s} expired={expired} onCancel={expired ? undefined : onCancelShift} />
              );
            })}
            {/* Đơn hàng */}
            {bks.map((b) => (
              <BookingBlock key={b.bookingId} booking={b} onClick={onClickBooking} />
            ))}
            {shfs.length === 0 && bks.length === 0 && (
              <p className="text-[10px] text-gray-300 text-center mt-6 select-none">{isPast ? '—' : 'Trống'}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Grid lịch tuần (mobile: 1 cột list) ───────────────────────── */
function WeekList({ days, bookingsByDate, shiftsByDate, today, onClickBooking, onCancelShift }) {
  return (
    <div className="space-y-3">
      {days.map((d, i) => {
        const key     = toISODate(d);
        const bks     = bookingsByDate[key] || [];
        const shfs    = shiftsByDate[key]   || [];
        const isToday = key === today;
        const isPast  = key < today;
        const total   = bks.length + shfs.length;

        return (
          <div key={i} className={`rounded-2xl border overflow-hidden ${
            isToday ? 'border-rose-200 bg-rose-50'
            : isPast ? 'border-gray-100 bg-gray-50 opacity-70'
            : 'border-gray-200 bg-white'
          }`}>
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${isToday ? 'border-rose-200' : 'border-gray-100'}`}>
              <div className={`w-9 h-9 rounded-full flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-[#ff385c] text-white' : isPast ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
                <span className="text-[9px] font-medium leading-none">{DAY_LABELS[i]}</span>
                <span className="text-sm font-bold leading-tight">{d.getDate()}</span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${isToday ? 'text-[#ff385c]' : isPast ? 'text-gray-400' : 'text-gray-800'}`}>
                  {DAY_LABELS[i]}, {fmtDayMonth(d)}
                  {isToday && <span className="ml-2 text-xs font-normal">Hôm nay</span>}
                  {isPast && <span className="ml-2 text-xs font-normal text-gray-400">Đã qua</span>}
                </p>
                <p className="text-xs text-gray-400">
                  {bks.length > 0 && `${bks.length} đơn`}
                  {bks.length > 0 && shfs.length > 0 && ' · '}
                  {shfs.length > 0 && <span className="text-green-600">{shfs.length} ca đăng ký</span>}
                  {total === 0 && 'Trống'}
                </p>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {/* Ca đăng ký */}
              {shfs.map((s) => {
                const expired = isShiftExpired(key, s.endTime, today);
                return (
                  <div key={s.id} className={`flex items-center justify-between border rounded-xl px-3 py-2.5 ${
                    expired ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${expired ? 'text-gray-300' : 'text-green-500'}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-semibold ${expired ? 'text-gray-400' : 'text-green-800'}`}>Ca đăng ký</p>
                          {expired && (
                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">hết hạn</span>
                          )}
                        </div>
                        <p className={`text-xs ${expired ? 'text-gray-400' : 'text-green-600'}`}>
                          {String(s.startTime).slice(0, 5)} – {String(s.endTime).slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    {!expired && !isPast && (
                      <button
                        onClick={() => onCancelShift(s)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Hủy
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Đơn hàng */}
              {bks.map((b) => {
                const block = STATUS_BLOCK[b.status] || STATUS_BLOCK.cancelled;
                const sl    = BOOKING_STATUS_LABEL[b.status] || { text: b.status, color: '' };
                return (
                  <button
                    key={b.bookingId}
                    onClick={() => onClickBooking(b)}
                    className={`w-full text-left border rounded-xl p-3 transition-shadow hover:shadow-md ${block.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${block.text}`}>{b.serviceName || `Đơn #${b.bookingId}`}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {b.startTime} – {b.endTime}
                        </p>
                        {b.address && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{b.address}</span>
                          </p>
                        )}
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${sl.color}`}>{sl.text}</span>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm font-bold text-[#ff385c]">{formatPrice(b.totalPrice)}</span>
                    </div>
                  </button>
                );
              })}

              {total === 0 && <p className="text-xs text-gray-300 text-center py-2">Không có lịch</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Panel ca đăng ký (sidebar) ────────────────────────────────── */
function ShiftsPanel({ shifts, loading, onCancel, onRegister }) {
  const upcoming = shifts.filter(s => s.status === 'active');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Ca làm đã đăng ký</h3>
          <p className="text-xs text-gray-400 mt-0.5">Được ưu tiên nhận đơn</p>
        </div>
        <button
          onClick={onRegister}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#ff385c] hover:bg-[#e00b41] text-white px-3 h-8 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm ca
        </button>
      </div>

      {/* Danh sách ca */}
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="w-5 h-5 border-2 border-rose-200 border-t-[#ff385c] rounded-full animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-8 px-4">
            <CheckCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Chưa có ca nào</p>
            <p className="text-xs text-gray-300 mt-1">Đăng ký ca để ưu tiên nhận đơn</p>
          </div>
        ) : (
          upcoming.map((s) => {
            // shiftDate từ API là string 'YYYY-MM-DD' (đã fix bằng DATE_FORMAT ở backend)
            const dateStr = String(s.shiftDate || '').slice(0, 10);
            const dateObj = dateStr ? new Date(dateStr + 'T00:00:00') : null;
            const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const expired = isShiftExpired(dateStr, s.endTime, todayStr);
            return (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-3 transition-colors group ${expired ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${expired ? 'bg-gray-100' : 'bg-green-50'}`}>
                  <CheckCircle className={`w-4 h-4 ${expired ? 'text-gray-300' : 'text-green-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${expired ? 'text-gray-400' : 'text-gray-800'}`}>{dateObj ? fmtFull(dateObj) : dateStr}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className={`text-xs font-semibold ${expired ? 'text-gray-400' : 'text-green-600'}`}>
                      {String(s.startTime).slice(0, 5)} – {String(s.endTime).slice(0, 5)}
                    </p>
                    {expired && <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">hết hạn</span>}
                  </div>
                </div>
                {!expired && (
                  <button
                    onClick={() => onCancel(s)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-all"
                    title="Hủy ca"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function HelperSchedulePage() {
  const [monday,   setMonday]   = useState(() => getMonday(new Date()));
  const [bookings, setBookings] = useState([]);
  const [shifts,   setShifts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);

  // Dùng giờ VN (UTC+7) để tránh lệch ngày vào đêm khuya
  const todayISO = useMemo(() => {
    const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    return vnNow.toISOString().slice(0, 10);
  }, []);
  const weekDays = useMemo(() => buildWeekDays(monday), [monday]);

  // Tải đơn hàng
  const fetchBookings = useCallback(() => {
    setLoading(true);
    getHelperBookingsApi()
      .then(({ data: res }) => setBookings(res.data || []))
      .catch(() => toast.error('Không thể tải lịch làm việc'))
      .finally(() => setLoading(false));
  }, []);

  // Tải ca đăng ký
  const fetchShifts = useCallback(() => {
    setShiftLoading(true);
    getHelperShiftsApi()
      .then(({ data: res }) => setShifts(res.data?.shifts || []))
      .catch(() => {})
      .finally(() => setShiftLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); fetchShifts(); }, [fetchBookings, fetchShifts]);

  // Nhóm booking theo ngày (tuần hiện tại)
  const bookingsByDate = useMemo(() => {
    const map = {};
    const weekStart = toISODate(weekDays[0]);
    const weekEnd   = toISODate(weekDays[6]);
    bookings.forEach((b) => {
      if (!b.bookingDate) return;
      const key = b.bookingDate.slice(0, 10);
      if (key < weekStart || key > weekEnd) return;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
    return map;
  }, [bookings, weekDays]);

  // Nhóm ca theo ngày (tuần hiện tại)
  const shiftsByDate = useMemo(() => {
    const map = {};
    const weekStart = toISODate(weekDays[0]);
    const weekEnd   = toISODate(weekDays[6]);
    shifts.forEach((s) => {
      if (!s.shiftDate) return;
      const key = s.shiftDate.slice(0, 10);
      if (key < weekStart || key > weekEnd) return;
      if (s.status !== 'active') return;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
    return map;
  }, [shifts, weekDays]);

  const weekTotal    = useMemo(() => weekDays.reduce((s, d) => s + (bookingsByDate[toISODate(d)]?.length || 0), 0), [weekDays, bookingsByDate]);
  const weekShifts   = useMemo(() => weekDays.reduce((s, d) => s + (shiftsByDate[toISODate(d)]?.length || 0), 0), [weekDays, shiftsByDate]);
  const weekEarnings = useMemo(() => weekDays.reduce((sum, d) => {
    return sum + (bookingsByDate[toISODate(d)] || [])
      .filter(b => b.status === 'completed')
      .reduce((s, b) => s + Number(b.totalPrice || 0) * 0.8, 0);
  }, 0), [weekDays, bookingsByDate]);

  const handleCancelShift = async (shift) => {
    if (!window.confirm(`Hủy ca ${String(shift.startTime).slice(0,5)}–${String(shift.endTime).slice(0,5)} vào ${shift.shiftDate?.slice(0,10) || ''}?`)) return;
    try {
      await cancelShiftApi(shift.id);
      toast.success('Đã hủy ca làm.');
      fetchShifts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy ca này.');
    }
  };

  const goPrevWeek = () => { const prev = new Date(monday); prev.setDate(monday.getDate() - 7); setMonday(prev); };
  const goNextWeek = () => { const next = new Date(monday); next.setDate(monday.getDate() + 7); setMonday(next); };
  const goToday    = () => setMonday(getMonday(new Date()));

  const weekNum     = getISOWeek(monday);
  const weekEndDate = weekDays[6];
  const weekLabel   = `Tuần ${weekNum} · ${fmtDayMonth(monday)} – ${fmtFull(weekEndDate)}`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Tiêu đề */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lịch làm việc</h1>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý đơn hàng và ca đăng ký của bạn</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRegModal(true)}
              className="flex items-center gap-2 text-sm font-semibold bg-[#ff385c] hover:bg-[#e00b41] text-white h-9 px-4 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">Đăng ký ca</span>
            </button>
            <button
              onClick={() => { fetchBookings(); fetchShifts(); }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white h-9 px-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:block">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ff385c]" />
            <span className="text-sm font-semibold text-gray-800">{weekTotal} đơn tuần này</span>
          </div>
          <div className="bg-white border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-gray-800">{weekShifts} ca đăng ký</span>
          </div>
          {weekEarnings > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-800">~{formatPrice(Math.round(weekEarnings))}</span>
            </div>
          )}
        </div>

        {/* Layout: calendar + sidebar */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Cột chính: Calendar */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Điều hướng tuần */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <button onClick={goPrevWeek} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 text-center">
                  <p className="text-sm font-semibold text-gray-900">{weekLabel}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={goToday} className="hidden sm:block text-xs text-[#ff385c] border border-rose-200 px-3 h-8 rounded-lg hover:bg-rose-50 transition-colors font-medium">Hôm nay</button>
                  <button onClick={goNextWeek} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid / List */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center py-20">
                <span className="w-8 h-8 border-2 border-rose-200 border-t-[#ff385c] rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="hidden md:block bg-white rounded-2xl border border-gray-200 p-4">
                  <WeekGrid
                    days={weekDays}
                    bookingsByDate={bookingsByDate}
                    shiftsByDate={shiftsByDate}
                    today={todayISO}
                    onClickBooking={setSelected}
                    onCancelShift={handleCancelShift}
                  />
                </div>
                <div className="md:hidden">
                  <WeekList
                    days={weekDays}
                    bookingsByDate={bookingsByDate}
                    shiftsByDate={shiftsByDate}
                    today={todayISO}
                    onClickBooking={setSelected}
                    onCancelShift={handleCancelShift}
                  />
                </div>
              </>
            )}

            {/* Legend */}
            {!loading && (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <Legend />
              </div>
            )}
          </div>

          {/* Sidebar: danh sách ca đăng ký */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0">
            <ShiftsPanel
              shifts={shifts}
              loading={shiftLoading}
              onCancel={handleCancelShift}
              onRegister={() => setShowRegModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Modal chi tiết đơn */}
      {selected && <BookingModal booking={selected} onClose={() => setSelected(null)} />}

      {/* Modal đăng ký ca */}
      {showRegModal && (
        <RegisterShiftModal
          todayISO={todayISO}
          onClose={() => setShowRegModal(false)}
          onSuccess={fetchShifts}
        />
      )}
    </div>
  );
}
