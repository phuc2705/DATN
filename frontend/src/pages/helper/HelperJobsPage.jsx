import { useEffect, useState, useCallback } from 'react';
import {
  getHelperBookingsApi,
  getAvailableJobsApi,
  acceptJobApi,
  checkInApi,
  checkOutApi,
} from '../../api/booking.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FeedbackModal from '../../components/common/FeedbackModal';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';
import { getSocket } from '../../socket/socket';
import toast from 'react-hot-toast';
import {
  ClipboardList, Calendar, MapPin, User, FileText,
  CheckCircle, Home, Flag, Loader2, RefreshCw,
  Clock, Banknote, ChevronRight, MessageSquare, LocateFixed, Star,
} from 'lucide-react';

// Lấy tọa độ GPS của thiết bị — trả null nếu bị từ chối hoặc lỗi
const requestGPS = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 10000, maximumAge: 30000 }
    );
  });

const SCHEDULE_TABS = [
  { key: 'confirmed',   label: 'Cần check-in', badge: 'bg-blue-100 text-blue-700' },
  { key: 'in_progress', label: 'Đang làm',     badge: 'bg-orange-100 text-orange-700' },
  { key: 'completed',   label: 'Hoàn thành',   badge: 'bg-green-100 text-green-700' },
];

/* ─── Available Job Card ─────────────────────────────────────────── */
function JobCard({ job, onAccept }) {
  const [accepting, setAccepting] = useState(false);

  const handle = async () => {
    setAccepting(true);
    try {
      await onAccept(job.bookingId);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-900 text-base">{job.serviceName}</p>
            {job.isRequested ? (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                Yêu cầu riêng
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                Đặt mở
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(job.bookingDate)} · {job.startTime} – {job.endTime}
            <span className="text-gray-400 ml-1">({job.hours}h)</span>
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-orange-500">{formatPrice(job.totalPrice)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatPrice(Math.round(job.totalPrice / job.hours))}/giờ
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
          <span className="line-clamp-1">{job.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span>{job.customerName}</span>
        </div>
        {job.note && (
          <div className="flex items-start gap-2 text-sm text-gray-400 italic">
            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{job.note}</span>
          </div>
        )}
      </div>

      <button
        onClick={handle}
        disabled={accepting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
      >
        {accepting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang nhận...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Nhận việc ngay
          </>
        )}
      </button>
    </div>
  );
}

/* ─── Schedule Card ──────────────────────────────────────────────── */
function ScheduleCard({ booking, onCheckin, onCheckout }) {
  const [loading, setLoading]       = useState(false);
  const [gpsPhase, setGpsPhase]     = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const sl = BOOKING_STATUS_LABEL[booking.status] || {};

  const handleGPSAction = async (apiFn) => {
    setGpsPhase(true);
    const coords = await requestGPS();
    setGpsPhase(false);
    if (!coords) toast('Không lấy được GPS — vẫn tiếp tục ghi nhận.', { icon: '📍', duration: 3000 });
    setLoading(true);
    try { await apiFn(coords); }
    finally { setLoading(false); }
  };

  const borderAccent = {
    confirmed:   'border-l-blue-400',
    in_progress: 'border-l-orange-400',
    completed:   'border-l-green-400',
  }[booking.status] || 'border-l-gray-200';

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${borderAccent} p-5 hover:shadow-sm transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-semibold text-gray-900">
            {booking.serviceName || `Đơn #${booking.bookingId}`}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(booking.bookingDate)}</span>
            <span className="text-gray-300">·</span>
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{booking.startTime} – {booking.endTime}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{booking.address}</span>
          </div>
          {booking.customerName && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{booking.customerName}</span>
            </div>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sl.color}`}>
            {sl.text}
          </span>
          <p className="text-orange-500 font-bold text-sm mt-2">
            {formatPrice(booking.totalPrice)}
          </p>
        </div>
      </div>

      {/* Action area */}
      {booking.status === 'confirmed' && (
        <button
          onClick={() => handleGPSAction(onCheckin)}
          disabled={loading || gpsPhase}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors mt-2"
        >
          {gpsPhase ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Đang lấy vị trí GPS...</>
          ) : loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Đang check-in...</>
          ) : (
            <><LocateFixed className="w-4 h-4" />Check-in GPS khi đến nơi</>
          )}
        </button>
      )}

      {booking.status === 'in_progress' && (
        <div className="mt-2 space-y-2.5">
          <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg">
            <Home className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-orange-700">Đang thực hiện công việc...</p>
          </div>
          <button
            onClick={() => handleGPSAction(onCheckout)}
            disabled={loading || gpsPhase}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {gpsPhase ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Đang lấy vị trí GPS...</>
            ) : loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Đang check-out...</>
            ) : (
              <><Flag className="w-4 h-4" />Check-out GPS khi hoàn thành</>
            )}
          </button>
        </div>
      )}

      {booking.status === 'completed' && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-700">Hoàn thành</p>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center justify-center gap-2 border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 h-8 rounded-lg text-xs transition-colors"
          >
            <MessageSquare className="w-3 h-3" /> Báo cáo vấn đề
          </button>
        </div>
      )}

      {showFeedback && (
        <FeedbackModal
          onClose={() => setShowFeedback(false)}
          userType="helper"
          bookingId={booking.bookingId}
        />
      )}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, subtitle, extra }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      {extra}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function HelperJobsPage() {
  const [tab,             setTab]             = useState('board');
  const [scheduleTab,     setScheduleTab]     = useState('confirmed');
  const [jobs,            setJobs]            = useState([]);
  const [bookings,        setBookings]        = useState([]);
  const [jobsLoading,     setJobsLoading]     = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const loadJobs = useCallback(() => {
    setJobsLoading(true);
    getAvailableJobsApi()
      .then(({ data }) => setJobs(data.data || []))
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, []);

  const loadBookings = useCallback(() => {
    setBookingsLoading(true);
    getHelperBookingsApi()
      .then(({ data }) => setBookings(data.data || []))
      .finally(() => setBookingsLoading(false));
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { if (tab === 'schedule') loadBookings(); }, [tab, loadBookings]);

  // Real-time: Socket.io events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onBookingUpdate = () => {
      loadJobs();
      if (tab === 'schedule') loadBookings();
    };

    const onNewJob = ({ svcName, bookingDate, startTime, endTime } = {}) => {
      loadJobs();
      toast('Có đơn đặt lịch mới!' + (svcName ? ` (${svcName} · ${bookingDate} ${startTime}–${endTime})` : ''), {
        duration: 5000,
        style: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontWeight: 600 },
      });
    };

    socket.on('booking:update', onBookingUpdate);
    socket.on('new_job', onNewJob);
    return () => {
      socket.off('booking:update', onBookingUpdate);
      socket.off('new_job', onNewJob);
    };
  }, [tab, loadJobs, loadBookings]);

  const handleAccept = async (bookingId) => {
    try {
      await acceptJobApi(bookingId);
      toast.success('Nhận việc thành công!');
      loadJobs();
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể nhận việc này');
    }
  };

  // coords được truyền từ ScheduleCard sau khi lấy GPS
  const makeAction = (fn, successMsg, bookingId) => async (coords) => {
    try {
      await fn(bookingId, coords);
      toast.success(successMsg);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const filteredBookings = bookings.filter(b => b.status === scheduleTab);
  const boardCount  = jobs.length;
  const activeCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Công việc của tôi</h1>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý việc nhận và lịch làm</p>
          </div>
          <button
            onClick={() => { loadJobs(); if (tab === 'schedule') loadBookings(); }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white h-9 px-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:block">Làm mới</span>
          </button>
        </div>

        {/* Main tab switcher */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 mb-6">
          <button
            onClick={() => setTab('board')}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
              tab === 'board'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Việc đang chờ</span>
            {boardCount > 0 && (
              <span className={`text-xs rounded-full px-2 py-0.5 font-bold min-w-[22px] text-center ${
                tab === 'board' ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {boardCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('schedule')}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
              tab === 'schedule'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch của tôi</span>
            {activeCount > 0 && (
              <span className={`text-xs rounded-full px-2 py-0.5 font-bold min-w-[22px] text-center ${
                tab === 'schedule' ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Job Board ── */}
        {tab === 'board' && (
          <>
            {jobsLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Chưa có việc nào đang chờ"
                subtitle="Các đơn mới sẽ hiển thị ở đây khi khách đặt lịch"
                extra={
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Cập nhật real-time tự động
                  </div>
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>{jobs.length} việc đang chờ · Nhấn nhận để xác nhận</span>
                </div>
                {jobs.map((j) => (
                  <JobCard key={j.bookingId} job={j} onAccept={handleAccept} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Schedule ── */}
        {tab === 'schedule' && (
          <>
            {/* Sub-tab pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
              {SCHEDULE_TABS.map((t) => {
                const count    = bookings.filter(b => b.status === t.key).length;
                const isActive = scheduleTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setScheduleTab(t.key)}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-4 h-9 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {t.label}
                    {count > 0 && (
                      <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                        isActive ? 'bg-white/30 text-white' : t.badge
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {bookingsLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : filteredBookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Không có đơn hàng nào"
                subtitle="Chưa có đơn hàng ở mục này"
              />
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <ScheduleCard
                    key={b.bookingId}
                    booking={b}
                    onCheckin={makeAction(checkInApi, 'Check-in thành công!', b.bookingId)}
                    onCheckout={makeAction(checkOutApi, 'Check-out thành công! Đơn đã hoàn thành.', b.bookingId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
