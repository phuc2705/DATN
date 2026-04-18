import { useEffect, useState } from 'react';
import { getHelperEarningsApi } from '../../api/payment.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';

export default function HelperEarningsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHelperEarningsApi()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thu nhập của tôi</h1>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Tổng thu nhập', value: formatPrice(data.summary.totalEarnings || 0), color: 'text-green-600' },
            { label: 'Tháng này', value: formatPrice(data.summary.monthlyEarnings || 0), color: 'text-blue-600' },
            { label: 'Đơn hoàn thành', value: data.summary.completedBookings || 0, color: 'text-gray-800' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Lịch sử thanh toán</h2>
        </div>
        {(!data?.payments || data.payments.length === 0) ? (
          <p className="text-center text-gray-400 py-8">Chưa có giao dịch nào.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.payments.map((p) => (
              <div key={p.paymentId} className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">Đơn #{p.bookingId}</p>
                  <p className="text-xs text-gray-400">{formatDate(p.paidAt)}</p>
                </div>
                <p className="font-semibold text-green-600">{formatPrice(p.helperEarning || p.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
