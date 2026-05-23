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

  // Hàm trả về class badge dựa theo PAYMENT_STATUS_LABEL
  const getStatusBadgeClass = (status) => {
    if (status === 'paid') return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
    if (status === 'unpaid') return 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20';
    return 'bg-blue-400/10 text-blue-300 border border-blue-400/20';
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f7f8f8]">Quản lý thanh toán</h1>
        <p className="text-[#8a8f98] text-sm mt-1">
          {payments.length} giao dịch
          {unpaidCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
              {unpaidCount} chờ xác nhận
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0f1117] rounded-lg p-5 border border-[#1e2028]">
          <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest mb-1">Tổng doanh thu</p>
          <p className="text-2xl font-extrabold text-emerald-400">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-[#0f1117] rounded-lg p-5 border border-[#1e2028]">
          <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest mb-1">Đã thanh toán</p>
          <p className="text-2xl font-extrabold text-[#f7f8f8]">{paidCount}</p>
        </div>
        <div className="bg-[#0f1117] rounded-lg p-5 border border-[#1e2028]">
          <p className="text-[10px] font-medium text-[#62666d] uppercase tracking-widest mb-1">Chưa thanh toán</p>
          <p className="text-2xl font-extrabold text-yellow-300">{unpaidCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0f1117] rounded-lg p-4 border border-[#1e2028] mb-5">
        <div className="flex flex-wrap gap-3">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm min-w-[150px]"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.text}</option>
            ))}
          </select>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            className="bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
          />
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 rounded-md py-2 px-3 text-sm"
          />
          <button
            onClick={refresh}
            className="bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
          >
            Lọc
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : payments.length === 0 ? (
        <div className="bg-[#0f1117] rounded-lg p-12 text-center border border-[#1e2028]">
          <div className="text-4xl mb-3">💳</div>
          <p className="text-[#8a8f98]">Không có giao dịch nào.</p>
        </div>
      ) : (
        <div className="bg-[#0f1117] rounded-lg border border-[#1e2028] overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a0b0f] border-b border-[#1e2028]">
                  {['#Đơn', 'Khách hàng', 'Dịch vụ', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày TT', 'Hành động'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-[10px] font-medium text-[#62666d] uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2028]">
                {payments.map((p) => {
                  const sl = { ...(PAYMENT_STATUS_LABEL[p.paymentStatus] || { text: p.paymentStatus }) };
                  const isUnpaid = p.paymentStatus === 'unpaid';
                  const isConfirming = confirming === p.bookingId;
                  return (
                    <tr key={p.paymentId} className={`border-b border-[#1e2028] hover:bg-[#131418] transition-colors ${isUnpaid ? 'bg-yellow-400/5' : ''}`}>
                      <td className="px-4 py-4 font-medium text-[#62666d] text-xs">{p.bookingId}</td>
                      <td className="px-4 py-4 font-semibold text-[#f7f8f8]">{p.customerName || '—'}</td>
                      <td className="px-4 py-4 text-[#8a8f98] text-xs">{p.serviceName || '—'}</td>
                      <td className="px-4 py-4 font-semibold text-[#f7f8f8] whitespace-nowrap">{formatPrice(p.amount)}</td>
                      <td className="px-4 py-4 text-[#8a8f98] capitalize">{p.paymentMethod || 'Tiền mặt'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${getStatusBadgeClass(p.paymentStatus)}`}>
                          {sl.text}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#8a8f98] text-xs whitespace-nowrap">{p.paidAt ? formatDateTime(p.paidAt) : '—'}</td>
                      <td className="px-4 py-4">
                        {isUnpaid && !isConfirming && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'cash' })}
                              className="text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/10 text-sm font-medium rounded-md px-3 py-1.5 transition-colors whitespace-nowrap"
                            >
                              💵 Tiền mặt
                            </button>
                            <button
                              onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'bank_transfer' })}
                              className="text-blue-300 border border-blue-400/20 hover:bg-blue-400/10 text-sm font-medium rounded-md px-3 py-1.5 transition-colors whitespace-nowrap"
                            >
                              🏦 Chuyển khoản
                            </button>
                          </div>
                        )}
                        {isConfirming && (
                          <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        {!isUnpaid && !isConfirming && (
                          <span className="text-xs text-emerald-400 font-medium">✓ Đã xác nhận</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#1e2028]">
            {payments.map((p) => {
              const sl = { ...(PAYMENT_STATUS_LABEL[p.paymentStatus] || { text: p.paymentStatus }) };
              const isUnpaid = p.paymentStatus === 'unpaid';
              const isConfirming = confirming === p.bookingId;
              return (
                <div key={p.paymentId} className={`px-4 py-4 ${isUnpaid ? 'bg-yellow-400/5' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[#f7f8f8]">Đơn {p.bookingId}</p>
                      <p className="text-xs text-[#8a8f98]">{p.customerName} · {p.serviceName}</p>
                      <p className="text-xs text-[#62666d] mt-0.5">{p.paidAt ? formatDateTime(p.paidAt) : 'Chưa thanh toán'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#f7f8f8]">{formatPrice(p.amount)}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium mt-1 ${getStatusBadgeClass(p.paymentStatus)}`}>
                        {sl.text}
                      </span>
                    </div>
                  </div>
                  {isUnpaid && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'cash' })}
                        disabled={isConfirming}
                        className="flex-1 py-2 rounded-md border border-emerald-400/20 text-emerald-400 text-sm font-medium hover:bg-emerald-400/10 disabled:opacity-50 transition-colors"
                      >
                        💵 Tiền mặt
                      </button>
                      <button
                        onClick={() => setConfirmModal({ bookingId: p.bookingId, method: 'bank_transfer' })}
                        disabled={isConfirming}
                        className="flex-1 py-2 rounded-md border border-blue-400/20 text-blue-300 text-sm font-medium hover:bg-blue-400/10 disabled:opacity-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="bg-[#0f1117] border border-[#23252a] rounded-lg p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">{confirmModal.method === 'cash' ? '💵' : '🏦'}</div>
              <h3 className="font-bold text-[#f7f8f8] text-lg">Xác nhận thanh toán</h3>
              <p className="text-sm text-[#8a8f98] mt-1">
                Đơn {confirmModal.bookingId} đã được thanh toán bằng{' '}
                <span className="font-semibold text-[#d0d6e0]">
                  {confirmModal.method === 'cash' ? 'tiền mặt' : 'chuyển khoản ngân hàng'}
                </span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-[#1e2028] hover:bg-[#272932] text-[#d0d6e0] border border-[#23252a] text-sm font-medium rounded-md px-4 py-2 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
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
