import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookingsApi } from '../../api/booking.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';

const TABS = [
  { key: 'all',         label: 'Tất cả',      count: null },
  { key: 'pending',     label: 'Chờ xác nhận', count: null },
  { key: 'confirmed',   label: 'Đã xác nhận',  count: null },
  { key: 'in_progress', label: 'Đang làm',     count: null },
  { key: 'completed',   label: 'Hoàn thành',   count: null },
  { key: 'cancelled',   label: 'Đã hủy',       count: null },
];

const STATUS_COLORS = {
  pending:     'border-l-yellow-400',
  confirmed:   'border-l-blue-400',
  in_progress: 'border-l-indigo-500',
  completed:   'border-l-green-500',
  cancelled:   'border-l-red-400',
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    getMyBookingsApi()
      .then(({ data }) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);

  const countByStatus = (key) => key === 'all' ? bookings.length : bookings.filter(b => b.status === key).length;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch đặt của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bookings.length} đơn hàng</p>
        </div>
        <button onClick={() => navigate('/')}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <span>+</span> Đặt lịch mới
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {TABS.map((t) => {
          const count = countByStatus(t.key);
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-500'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-bold ${
                  tab === t.key ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-700 font-semibold mb-1">Chưa có đơn hàng nào</p>
          <p className="text-gray-400 text-sm mb-6">
            {tab === 'all' ? 'Bạn chưa đặt lịch giúp việc nào.' : `Không có đơn hàng ở trạng thái này.`}
          </p>
          <button onClick={() => navigate('/')}
            className="btn-primary px-6 py-2.5 text-sm inline-block">
            Đặt lịch ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const sl = BOOKING_STATUS_LABEL[b.status] || {};
            const borderColor = STATUS_COLORS[b.status] || 'border-l-gray-200';
            return (
              <div key={b.bookingId}
                onClick={() => navigate(`/bookings/${b.bookingId}`)}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 ${borderColor} hover:shadow-md cursor-pointer transition-all duration-200 active:scale-[0.99]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Service + ID */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-semibold text-gray-900 truncate">
                        {b.serviceName || `Đơn #${b.bookingId}`}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">#{b.bookingId}</span>
                    </div>

                    {/* Date & time */}
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <span>📅</span>
                      {formatDate(b.bookingDate)} · {b.startTime} – {b.endTime}
                    </p>

                    {/* Address */}
                    <p className="text-xs text-gray-400 mt-1 truncate flex items-center gap-1">
                      <span>📍</span> {b.address}
                    </p>

                    {/* Helper */}
                    {b.helperName && (
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-xs">👩</span>
                        {b.helperName}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${sl.color}`}>{sl.text}</span>
                    <p className="text-orange-500 font-bold mt-2">{formatPrice(b.totalPrice)}</p>
                    {b.paymentStatus === 'unpaid' && b.status === 'completed' && (
                      <p className="text-xs text-red-500 mt-0.5 font-medium">⚠ Chưa TT</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
