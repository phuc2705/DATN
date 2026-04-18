import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookingsApi } from '../../api/booking.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';

const TABS = [
  { key: 'all',         label: 'Tất cả' },
  { key: 'pending',     label: 'Chờ xác nhận' },
  { key: 'confirmed',   label: 'Đã xác nhận' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'completed',   label: 'Hoàn thành' },
  { key: 'cancelled',   label: 'Đã hủy' },
];

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Lịch đặt của tôi</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-600"
        >
          + Đặt lịch mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t.key
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Không có đơn nào.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const sl = BOOKING_STATUS_LABEL[b.status] || {};
            return (
              <div
                key={b.bookingId}
                onClick={() => navigate(`/bookings/${b.bookingId}`)}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">Đơn #{b.bookingId}</p>
                    <p className="text-sm text-gray-500">{formatDate(b.bookingDate)} · {b.startTime} – {b.endTime}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.address}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${sl.color}`}>{sl.text}</span>
                    <p className="text-primary-600 font-semibold mt-1">{formatPrice(b.totalPrice)}</p>
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
