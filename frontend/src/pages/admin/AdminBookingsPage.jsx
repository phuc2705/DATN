import { useEffect, useState } from 'react';
import { getAdminBookingsApi, assignHelperApi, getAvailableHelpersApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';
import toast from 'react-hot-toast';

// Modal giao việc cho helper
function AssignModal({ booking, onClose, onSaved }) {
  const [helpers, setHelpers] = useState([]);
  const [loadingHelpers, setLoadingHelpers] = useState(true);
  const [selectedHelper, setSelectedHelper] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAvailableHelpersApi(booking.bookingId)
      .then(({ data }) => {
        // API trả về { nearby, farAway } hoặc mảng thẳng
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-gray-900 text-lg mb-1">Giao việc cho helper</h3>
        <p className="text-sm text-gray-500 mb-4">Đơn #{booking.bookingId} · {formatDate(booking.bookingDate)} · {booking.startTime}–{booking.endTime}</p>

        {loadingHelpers ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : helpers.length === 0 ? (
          <p className="text-center text-gray-400 py-6">Không có helper phù hợp.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {helpers.map((h) => (
              <label
                key={h.helperId || h.helper_id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedHelper === String(h.helperId || h.helper_id)
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="helper"
                  value={h.helperId || h.helper_id}
                  checked={selectedHelper === String(h.helperId || h.helper_id)}
                  onChange={(e) => setSelectedHelper(e.target.value)}
                  className="text-orange-500"
                />
                <Avatar name={h.fullName || h.full_name} avatarUrl={h.avatarUrl || h.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{h.fullName || h.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {Number(h.hourlyRate || h.hourly_rate || 0).toLocaleString()}đ/h
                    {h.distanceKm != null && ` · ${h.distanceKm}km`}
                    {h.ratingAverage || h.rating_average ? ` · ★${Number(h.ratingAverage || h.rating_average).toFixed(1)}` : ''}
                  </p>
                </div>
                {h.isAvailable || h.is_available ? (
                  <span className="text-xs text-green-600 font-medium flex-shrink-0">Rảnh</span>
                ) : (
                  <span className="text-xs text-gray-400 flex-shrink-0">Bận</span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Hủy</button>
          <button
            onClick={handleAssign}
            disabled={!selectedHelper || saving}
            className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-60"
          >
            {saving ? 'Đang giao...' : 'Giao việc'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);

  const refresh = (s = status, sd = startDate, ed = endDate) => {
    setLoading(true);
    const params = {};
    if (s) params.status = s;
    if (sd) params.startDate = sd;
    if (ed) params.endDate = ed;
    getAdminBookingsApi(params)
      .then(({ data }) => setBookings(data.data?.bookings || []))
      .catch(() => toast.error('Không thể tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const totalRevenue = bookings
    .filter((b) => b.status === 'completed')
    .reduce((s, b) => s + Number(b.totalPrice || 0), 0);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-gray-500 text-sm mt-1">{bookings.length} đơn hàng</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng đơn', value: bookings.length, color: 'text-gray-900' },
          { label: 'Chờ giao việc', value: bookings.filter((b) => b.status === 'pending' && !b.helperName).length, color: 'text-yellow-600' },
          { label: 'Hoàn thành', value: bookings.filter((b) => b.status === 'completed').length, color: 'text-green-600' },
          { label: 'Doanh thu', value: formatPrice(totalRevenue), color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{label}</p>
            <p className={`text-xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 min-w-[170px]"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(BOOKING_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.text}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          />
          <button
            onClick={() => refresh(status, startDate, endDate)}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Lọc
          </button>
          {(status || startDate || endDate) && (
            <button
              onClick={() => { setStatus(''); setStartDate(''); setEndDate(''); refresh('', '', ''); }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {(status || startDate || endDate) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {status && (
              <span className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full">
                {BOOKING_STATUS_LABEL[status]?.text || status}
                <button onClick={() => setStatus('')}>×</button>
              </span>
            )}
            {startDate && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                Từ: {startDate} <button onClick={() => setStartDate('')}>×</button>
              </span>
            )}
            {endDate && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                Đến: {endDate} <button onClick={() => setEndDate('')}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-600 font-medium">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['#', 'Khách hàng', 'Người giúp việc', 'Ngày làm', 'Giờ', 'Tổng tiền', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const sl = BOOKING_STATUS_LABEL[b.status] || { text: b.status, color: 'bg-gray-100 text-gray-600' };
                  const needsAssign = b.status === 'pending' && !b.helperName;
                  return (
                    <tr key={b.bookingId} className={`hover:bg-gray-50 transition-colors ${needsAssign ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-5 py-4 text-gray-400 text-xs font-mono">#{b.bookingId}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{b.customerName || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">
                        {b.helperName || <span className="text-yellow-600 text-xs font-semibold">Chưa giao việc</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{b.startTime}–{b.endTime}</td>
                      <td className="px-5 py-4 font-bold text-orange-500 whitespace-nowrap">{formatPrice(b.totalPrice)}</td>
                      <td className="px-5 py-4">
                        <span className={`badge text-xs ${sl.color}`}>{sl.text}</span>
                      </td>
                      <td className="px-5 py-4">
                        {needsAssign && (
                          <button
                            onClick={() => setAssignTarget(b)}
                            className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold transition-all whitespace-nowrap"
                          >
                            Giao việc
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {bookings.map((b) => {
              const sl = BOOKING_STATUS_LABEL[b.status] || { text: b.status, color: 'bg-gray-100 text-gray-600' };
              const needsAssign = b.status === 'pending' && !b.helperName;
              return (
                <div key={b.bookingId} className={`px-4 py-4 ${needsAssign ? 'bg-yellow-50/30' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400 font-mono">#{b.bookingId}</span>
                        <span className={`badge text-xs ${sl.color}`}>{sl.text}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{b.customerName || '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{b.helperName || <span className="text-yellow-600 font-medium">Chưa giao việc</span>}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(b.bookingDate)} · {b.startTime}–{b.endTime}</p>
                    </div>
                    <p className="font-bold text-orange-500 whitespace-nowrap flex-shrink-0">{formatPrice(b.totalPrice)}</p>
                  </div>
                  {needsAssign && (
                    <button
                      onClick={() => setAssignTarget(b)}
                      className="w-full mt-1 py-2 rounded-xl border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50"
                    >
                      Giao việc cho helper
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
