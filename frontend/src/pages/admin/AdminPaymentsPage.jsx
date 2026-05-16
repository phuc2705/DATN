import { useEffect, useState } from 'react';
import { getAdminPaymentsApi } from '../../api/admin.api';
import { confirmPaymentApi } from '../../api/payment.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDateTime, PAYMENT_STATUS_LABEL } from '../../utils/format';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', startDate: '', endDate: '' });
  const [confirming, setConfirming] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { bookingId, method }

  const refresh = () => {
    setLoading(true);
    const params = {};
    if (filter.status) params.status = filter.status;
    if (filter.startDate) params.startDate = filter.startDate;
    if (filter.endDate) params.endDate = filter.endDate;
    getAdminPaymentsApi(params)
      .then(({ data }) => {
        setPayments(data.data?.payments || []);
        setTotalRevenue(data.data?.totalRevenue || 0);
      })
      .catch(() => toast.error('Không thể tải dữ liệu thanh toán'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { bookingId, method } = confirmModal;
    setConfirming(bookingId);
    setConfirmModal(null);
    try {
      await confirmPaymentApi(bookingId, { paymentMethod: method });
      toast.success(`Đã xác nhận thanh toán qua ${method === 'cash' ? 'tiền mặt' : 'chuyển khoản'}!`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác nhận thất bại');
    } finally {
      setConfirming(null);
    }
  };

  const paidCount = payments.filter((p) => p.paymentStatus === 'paid').length;
  const unpaidCount = payments.length - paidCount;

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý thanh toán</h1>
        <p className="text-gray-500 text-sm mt-1">
          {payments.length} giao dịch
          {unpaidCount > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {unpaidCount} chờ xác nhận
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-1">Tổng doanh thu</p>
          <p className="text-2xl font-extrabold text-green-600">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-1">Đã thanh toán</p>
          <p className="text-2xl font-extrabold text-gray-900">{paidCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-1">Chưa thanh toán</p>
          <p className="text-2xl font-extrabold text-orange-500">{unpaidCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-wrap gap-3">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 min-w-[150px]"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.text}</option>
            ))}
          </select>
          <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          <button onClick={refresh} className="btn-primary px-5 py-2.5 text-sm">Lọc</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-4xl mb-3">💳</div>
          <p className="text-gray-500">Không có giao dịch nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['#Đơn', 'Khách hàng', 'Dịch vụ', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày TT', 'Hành động'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => {
                  const sl = { ...(PAYMENT_STATUS_LABEL[p.paymentStatus] || { text: p.paymentStatus, color: 'bg-gray-100 text-gray-600' }) };
                  const isUnpaid = p.paymentStatus === 'unpaid';
                  const isConfirming = confirming === p.bookingId;
                  return (
                    <tr key={p.paymentId} className={`hover:bg-gray-50 transition-colors ${isUnpaid ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-4 font-medium text-gray-500 text-xs">#{p.bookingId}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900">{p.customerName || '—'}</td>
                      <td className="px-4 py-4 text-gray-500 text-xs">{p.serviceName || '—'}</td>
                      <td className="px-4 py-4 font-bold text-orange-500 whitespace-nowrap">{formatPrice(p.amount)}</td>
                      <td className="px-4 py-4 text-gray-500 capitalize">{p.paymentMethod || 'Tiền mặt'}</td>
                      <td className="px-4 py-4"><span className={`badge ${sl.color}`}>{sl.text}</span></td>
                      <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{p.paidAt ? formatDateTime(p.paidAt) : '—'}</td>
                      <td className="px-4 py-4">
                        {isUnpaid && !isConfirming && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'cash' })}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 font-semibold whitespace-nowrap"
                            >
                              💵 Tiền mặt
                            </button>
                            <button
                              onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'bank_transfer' })}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold whitespace-nowrap"
                            >
                              🏦 Chuyển khoản
                            </button>
                          </div>
                        )}
                        {isConfirming && (
                          <svg className="animate-spin h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        {!isUnpaid && !isConfirming && (
                          <span className="text-xs text-green-600 font-medium">✓ Đã xác nhận</span>
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
            {payments.map((p) => {
              const sl = { ...(PAYMENT_STATUS_LABEL[p.paymentStatus] || { text: p.paymentStatus, color: 'bg-gray-100 text-gray-600' }) };
              const isUnpaid = p.paymentStatus === 'unpaid';
              const isConfirming = confirming === p.bookingId;
              return (
                <div key={p.paymentId} className={`px-4 py-4 ${isUnpaid ? 'bg-orange-50/30' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">Đơn #{p.bookingId}</p>
                      <p className="text-xs text-gray-500">{p.customerName} · {p.serviceName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.paidAt ? formatDateTime(p.paidAt) : 'Chưa thanh toán'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-500">{formatPrice(p.amount)}</p>
                      <span className={`badge text-xs mt-1 ${sl.color}`}>{sl.text}</span>
                    </div>
                  </div>
                  {isUnpaid && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'cash' })}
                        disabled={isConfirming}
                        className="flex-1 py-2 rounded-xl border border-green-200 text-green-700 text-sm font-semibold hover:bg-green-50 disabled:opacity-50"
                      >
                        💵 Tiền mặt
                      </button>
                      <button
                        onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'bank_transfer' })}
                        disabled={isConfirming}
                        className="flex-1 py-2 rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50"
                      >
                        🏦 Chuyển khoản
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal xác nhận phương thức thanh toán */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">{confirmModal.method === 'cash' ? '💵' : '🏦'}</div>
              <h3 className="font-bold text-gray-900 text-lg">Xác nhận thanh toán</h3>
              <p className="text-sm text-gray-500 mt-1">
                Đơn #{confirmModal.bookingId} đã được thanh toán bằng{' '}
                <span className="font-semibold">{confirmModal.method === 'cash' ? 'tiền mặt' : 'chuyển khoản ngân hàng'}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                ✓ Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
