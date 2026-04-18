import { useEffect, useState } from 'react';
import { getAdminBookingsApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', startDate: '', endDate: '' });

  const refresh = () => {
    setLoading(true);
    getAdminBookingsApi(filter)
      .then(({ data }) => setBookings(data.data?.bookings || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý đơn hàng</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(BOOKING_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.text}</option>
          ))}
        </select>
        <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button onClick={refresh} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-600">
          Lọc
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Khách hàng', 'Helper', 'Ngày', 'Giờ', 'Tổng tiền', 'Trạng thái'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => {
                const sl = BOOKING_STATUS_LABEL[b.status] || {};
                return (
                  <tr key={b.bookingId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{b.bookingId}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{b.customerName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{b.helperName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(b.bookingDate)}</td>
                    <td className="px-4 py-3 text-gray-500">{b.startTime}–{b.endTime}</td>
                    <td className="px-4 py-3 font-medium text-primary-600">{formatPrice(b.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${sl.color}`}>{sl.text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bookings.length === 0 && <p className="text-center text-gray-400 py-8">Không có đơn hàng.</p>}
        </div>
      )}
    </div>
  );
}
