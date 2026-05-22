import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays, Clock, CheckCircle, XCircle, Plus, AlertCircle,
} from 'lucide-react';
import {
  getHelperShiftsApi, registerShiftApi, cancelShiftApi,
} from '../../api/user.api';

/* ─── Hằng số ca làm ────────────────────────────────────────────── */
const SLOTS = [
  { label: 'Ca sáng sớm', start: '06:00', end: '09:00', color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' },
  { label: 'Ca sáng',     start: '09:00', end: '12:00', color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
  { label: 'Ca trưa',     start: '12:00', end: '15:00', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'     },
  { label: 'Ca chiều',    start: '15:00', end: '18:00', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'         },
  { label: 'Ca tối',      start: '18:00', end: '21:00', color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
  { label: 'Ca đêm',      start: '21:00', end: '23:00', color: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'        },
];

const RATE = 75_000;

/* ─── Helpers ────────────────────────────────────────────────────── */
function buildNextDays(n = 14) {
  const days = [];
  const DAY_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    days.push({
      value: `${yyyy}-${mm}-${dd}`,
      label: `${DAY_VI[d.getDay()]} ${dd}/${mm}`,
      isToday: i === 0,
    });
  }
  return days;
}

function slotHours(slot) {
  const [sh, sm] = slot.start.split(':').map(Number);
  const [eh, em] = slot.end.split(':').map(Number);
  return (eh * 60 + em - sh * 60 - sm) / 60;
}

function dateKey(shiftDate) {
  if (!shiftDate) return '';
  if (typeof shiftDate === 'string') return shiftDate.slice(0, 10);
  return new Date(shiftDate).toISOString().slice(0, 10);
}

function formatShiftDate(shiftDate) {
  const dateStr = dateKey(shiftDate);
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const DAY_VI = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return `${DAY_VI[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function canCancel(shiftDate, startTime) {
  if (!shiftDate || !startTime) return false;
  const shiftStart = new Date(`${dateKey(shiftDate)}T${startTime}`);
  return (shiftStart - Date.now()) / 36e5 >= 12;
}

/* ─── Slot button ─────────────────────────────────────────────────── */
function SlotButton({ slot, selected, registered, onClick }) {
  const baseClass = 'relative w-full border rounded-xl px-4 py-3 text-left transition-all';

  if (registered) {
    return (
      <div className={`${baseClass} bg-green-50 border-green-300 cursor-default`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-green-700">{slot.label}</p>
            <p className="text-xs text-green-500 mt-0.5">{slot.start} – {slot.end}</p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        </div>
        <span className="absolute -top-2 right-3 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">
          Đã đăng ký
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${slot.color} ${selected ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{slot.label}</p>
          <p className="text-xs mt-0.5 opacity-70">{slot.start} – {slot.end} · ~{slotHours(slot)}h</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${
          selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
        }`}>
          {selected && <span className="text-white text-[10px] leading-none">✓</span>}
        </div>
      </div>
    </button>
  );
}

/* ─── Shift row in registered list ───────────────────────────────── */
function ShiftRow({ shift, onCancel, cancelling }) {
  const cancellable = canCancel(shift.shiftDate, shift.startTime);
  const slotInfo    = SLOTS.find(s => s.start === shift.startTime);
  const label       = slotInfo?.label || `${shift.startTime} – ${shift.endTime}`;

  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-orange-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{formatShiftDate(shift.shiftDate)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {label} · {shift.startTime} – {shift.endTime}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {shift.status === 'cancelled' ? (
          <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-medium">
            Đã hủy
          </span>
        ) : cancellable ? (
          <button
            onClick={() => onCancel(shift.id)}
            disabled={cancelling === shift.id}
            className="flex items-center gap-1 text-xs bg-red-50 text-red-500 border border-red-100 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <XCircle className="w-3.5 h-3.5" />
            {cancelling === shift.id ? 'Đang hủy...' : 'Hủy ca'}
          </button>
        ) : (
          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
            Trong vòng 12h
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function HelperSchedulePage() {
  const DAYS = buildNextDays(14);

  const [selectedDate, setSelectedDate] = useState(DAYS[0].value);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [shifts,       setShifts]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [registering,  setRegistering]  = useState(false);
  const [cancelling,   setCancelling]   = useState(null);

  const fetchShifts = useCallback(() => {
    setLoading(true);
    getHelperShiftsApi()
      .then(({ data: res }) => setShifts(res.data?.shifts || []))
      .catch(() => toast.error('Không thể tải danh sách ca làm.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const registeredOnDate = shifts.filter(
    s => s.status === 'active' && dateKey(s.shiftDate) === selectedDate
  );

  const handleRegister = async () => {
    if (!selectedSlot) return toast.error('Vui lòng chọn một ca làm.');
    setRegistering(true);
    try {
      await registerShiftApi({
        shiftDate: selectedDate,
        startTime: selectedSlot.start,
        endTime:   selectedSlot.end,
      });
      toast.success('Đăng ký ca làm thành công!');
      setSelectedSlot(null);
      fetchShifts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async (shiftId) => {
    setCancelling(shiftId);
    try {
      await cancelShiftApi(shiftId);
      toast.success('Đã hủy ca làm.');
      fetchShifts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hủy ca thất bại.');
    } finally {
      setCancelling(null);
    }
  };

  const activeShifts = shifts.filter(s => s.status === 'active');
  const totalHours   = activeShifts.reduce((sum, s) => {
    const slot = SLOTS.find(sl => sl.start === s.startTime);
    return sum + (slot ? slotHours(slot) : 0);
  }, 0);
  const estEarnings  = totalHours * RATE;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký ca làm việc</h1>
          <p className="text-sm text-gray-500 mt-0.5">Chọn ngày và ca muốn làm, có thể hủy trước 12 tiếng</p>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-800">{activeShifts.length} ca sắp tới</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">{totalHours}h tổng</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-green-600">
              ~{(estEarnings / 1_000_000).toFixed(1)}M ước tính
            </span>
          </div>
        </div>

        {/* Step 1: Date picker */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <h2 className="font-semibold text-gray-900">Chọn ngày</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => { setSelectedDate(day.value); setSelectedSlot(null); }}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedDate === day.value
                    ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                <span>{day.label.split(' ')[0]}</span>
                <span className={`text-[11px] ${selectedDate === day.value ? 'text-orange-100' : 'text-gray-400'}`}>
                  {day.label.split(' ')[1]}
                </span>
                {day.isToday && (
                  <span className={`text-[9px] font-bold ${selectedDate === day.value ? 'text-orange-100' : 'text-orange-500'}`}>
                    HÔM NAY
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Slot picker */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <h2 className="font-semibold text-gray-900">Chọn ca làm</h2>
            <span className="ml-auto text-xs text-gray-400">
              {DAYS.find(d => d.value === selectedDate)?.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SLOTS.map((slot) => {
              const regShift = registeredOnDate.find(s => s.startTime === slot.start);
              return (
                <SlotButton
                  key={slot.start}
                  slot={slot}
                  selected={selectedSlot?.start === slot.start}
                  registered={regShift}
                  onClick={() => setSelectedSlot(selectedSlot?.start === slot.start ? null : slot)}
                />
              );
            })}
          </div>

          <button
            onClick={handleRegister}
            disabled={!selectedSlot || registering}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl py-3 transition-all"
          >
            {registering ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {selectedSlot
                  ? `Đăng ký ca ${selectedSlot.start}–${selectedSlot.end}`
                  : 'Chọn một ca để đăng ký'}
              </>
            )}
          </button>
        </div>

        {/* Step 3: Registered shifts */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <h2 className="font-semibold text-gray-900">Ca đã đăng ký</h2>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {activeShifts.length} ca sắp tới
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-600">Chưa có ca nào được đăng ký</p>
              <p className="text-xs text-gray-400 mt-1">Chọn ngày và ca ở trên để bắt đầu</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {shifts.map((shift) => (
                <ShiftRow
                  key={shift.id}
                  shift={shift}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-600">
            Ca làm chỉ có thể hủy trước giờ bắt đầu ít nhất <strong>12 tiếng</strong>.
            Thu nhập ước tính ~<strong>75.000đ/giờ</strong> (bạn nhận 90% sau phí nền tảng).
          </p>
        </div>
      </div>
    </div>
  );
}
