import { useEffect, useState, useCallback } from 'react';
import {
  getHelperBookingsApi,
  getAvailableJobsApi,
  acceptJobApi,
  checkInApi,
  checkOutApi,
} from '../../api/booking.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';
import { getSocket } from '../../socket/socket';
import toast from 'react-hot-toast';

const SCHEDULE_TABS = [
  { key: 'confirmed',   label: 'Cần check-in', color: 'bg-blue-100 text-blue-700'  },
  { key: 'in_progress', label: 'Đang làm',      color: 'bg-indigo-100 text-indigo-700' },
  { key: 'completed',   label: 'Hoàn thành',    color: 'bg-green-100 text-green-700'  },
];

function JobCard({ job, onAccept }) {
  const [accepting, setAccepting] = useState(false);

  const handle = async () => {
    setAccepting(true);
    try {
      await onAccept(job.bookingId);
    } finally { setAccepting(false); }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-semibold text-gray-900">{job.serviceName}</p>
            {job.isRequested ? (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">⭐ Yêu cầu riêng</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Đặt mở</span>
            )}
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {formatDate(job.bookingDate)} · {job.startTime} – {job.endTime}
            <span className="text-gray-400 ml-1">({job.hours}h)</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="text-lg font-bold text-orange-500">{formatPrice(job.totalPrice)}</p>
          <p className="text-xs text-gray-400">{formatPrice(Math.round(job.totalPrice / job.hours))}/giờ</p>
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-gray-500 mb-4">
        <p className="flex items-start gap-2"><span>📍</span><span>{job.address}</span></p>
        <p className="flex items-center gap-2"><span>👤</span><span>{job.customerName}</span></p>
        {job.note && <p className="flex items-start gap-2 text-gray-400 italic"><span>📝</span><span className="line-clamp-2">{job.note}</span></p>}
      </div>

      <button onClick={handle} disabled={accepting}
        className="w-full btn-primary py-2.5 text-sm disabled:opacity-50">
        {accepting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Đang nhận...
          </span>
        ) : '✅ Nhận việc ngay'}
      </button>
    </div>
  );
}

function ScheduleCard({ booking, onCheckin, onCheckout }) {
  const [loading, setLoading] = useState(false);
  const sl = BOOKING_STATUS_LABEL[booking.status] || {};

  const handle = async (fn) => {
    setLoading(true);
    try { await fn(); }
    finally { setLoading(false); }
  };

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 border border-gray-100 transition-shadow hover:shadow-md ${
      booking.status === 'confirmed' ? 'border-l-blue-400' :
      booking.status === 'in_progress' ? 'border-l-indigo-500 ring-1 ring-indigo-100' :
      'border-l-green-400'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-gray-900">{booking.serviceName || `Đơn #${booking.bookingId}`}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(booking.bookingDate)} · {booking.startTime} – {booking.endTime}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">📍 {booking.address}</p>
          {booking.customerName && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">👤 {booking.customerName}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${sl.color}`}>{sl.text}</span>
          <p className="text-orange-500 font-bold text-sm mt-1.5">{formatPrice(booking.totalPrice)}</p>
        </div>
      </div>

      {booking.status === 'confirmed' && (
        <button onClick={() => handle(onCheckin)} disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : '📍'}
          Check-in khi đến nơi
        </button>
      )}

      {booking.status === 'in_progress' && (
        <div className="space-y-2">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
            <p className="text-indigo-700 text-sm font-medium animate-pulse">🏠 Đang thực hiện công việc...</p>
          </div>
          <button onClick={() => handle(onCheckout)} disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : '🏁'}
            Check-out khi hoàn thành
          </button>
        </div>
      )}

      {booking.status === 'completed' && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <p className="text-green-700 text-sm font-medium">✅ Hoàn thành · Chờ khách thanh toán</p>
        </div>
      )}
    </div>
  );
}

export default function HelperJobsPage() {
  const [tab, setTab] = useState('board');
  const [scheduleTab, setScheduleTab] = useState('confirmed');
  const [jobs, setJobs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
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

  // Real-time: lắng nghe booking:update và new_job qua Socket.io để tự refresh
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onBookingUpdate = () => {
      loadJobs();
      if (tab === 'schedule') loadBookings();
    };

    const onNewJob = ({ svcName, bookingDate, startTime, endTime } = {}) => {
      loadJobs();
      toast('🆕 Có đơn đặt lịch mới!' + (svcName ? ` (${svcName} · ${bookingDate} ${startTime}–${endTime})` : ''), {
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

  const makeAction = (fn, successMsg, bookingId) => async () => {
    try {
      await fn(bookingId);
      toast.success(successMsg);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const filteredBookings = bookings.filter(b => b.status === scheduleTab);

  const boardCount = jobs.length;
  const activeCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Công việc của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý việc nhận và lịch làm</p>
        </div>
        <button onClick={() => { loadJobs(); if (tab === 'schedule') loadBookings(); }}
          className="flex items-center gap-1.5 text-sm text-orange-500 border border-orange-200 px-3 py-2 rounded-xl hover:bg-orange-50 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Main tab */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6">
        <button onClick={() => setTab('board')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'board' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span>📋</span>
          <span>Việc đang chờ</span>
          {boardCount > 0 && (
            <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${tab === 'board' ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-600'}`}>
              {boardCount}
            </span>
          )}
        </button>
        <button onClick={() => setTab('schedule')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'schedule' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span>🗓️</span>
          <span>Lịch của tôi</span>
          {activeCount > 0 && (
            <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${tab === 'schedule' ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Job Board */}
      {tab === 'board' && (
        <div>
          {jobsLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-14 text-center border border-gray-100 shadow-sm">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-700 font-semibold mb-1">Chưa có việc nào đang chờ</p>
              <p className="text-sm text-gray-400">Các đơn mới sẽ hiển thị ở đây khi khách đặt lịch</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Real-time — cập nhật tự động
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {jobs.length} việc đang chờ · Nhấn nhận để xác nhận
              </p>
              {jobs.map((j) => (
                <JobCard key={j.bookingId} job={j} onAccept={handleAccept} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {SCHEDULE_TABS.map((t) => {
              const count = bookings.filter(b => b.status === t.key).length;
              return (
                <button key={t.key} onClick={() => setScheduleTab(t.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    scheduleTab === t.key ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 ${scheduleTab === t.key ? 'bg-white/30 text-white' : t.color}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {bookingsLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="text-4xl mb-3">🗓️</div>
              <p className="text-gray-500">Không có đơn hàng nào ở mục này.</p>
            </div>
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
        </div>
      )}
    </div>
  );
}
