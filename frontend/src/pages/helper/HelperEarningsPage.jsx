import { useEffect, useState } from 'react';
import { getHelperEarningsApi } from '../../api/payment.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';
import { Banknote, Calendar, CheckCircle, Star, CreditCard, Wallet, Info } from 'lucide-react';

export default function HelperEarningsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHelperEarningsApi()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  const stats = [
    { label: 'Tổng thu nhập',  value: formatPrice(data?.summary?.totalEarnings || 0),     Icon: Banknote,     color: 'text-green-600',  bg: 'bg-green-100',  border: 'border-green-100' },
    { label: 'Tháng này',      value: formatPrice(data?.summary?.monthlyEarnings || 0),    Icon: Calendar,     color: 'text-blue-600',   bg: 'bg-blue-100',   border: 'border-blue-100' },
    { label: 'Đơn hoàn thành', value: data?.summary?.completedBookings || 0,               Icon: CheckCircle,  color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-100' },
    { label: 'Đánh giá TB',    value: `${Number(data?.summary?.ratingAverage || 0).toFixed(1)}`,Icon: Star,    color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-100' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thu nhập của tôi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Thống kê và lịch sử giao dịch</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, Icon, color, bg, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-5 shadow-sm border ${border}`}>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Lịch sử thanh toán</h2>
          <span className="text-xs text-gray-400">{data?.payments?.length || 0} giao dịch</span>
        </div>

        {(!data?.payments || data.payments.length === 0) ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có giao dịch nào</p>
            <p className="text-sm text-gray-400 mt-1">Hoàn thành đơn hàng để nhận thanh toán</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.payments.map((p) => (
              <div key={p.paymentId} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Đơn #{p.bookingId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.paidAt ? formatDate(p.paidAt) : '—'}
                      {p.paymentMethod && (
                        <span className="ml-1.5">· {p.paymentMethod === 'cash' ? 'Tiền mặt' : p.paymentMethod === 'vnpay' ? 'VNPay' : 'CK'}</span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-green-600">+{formatPrice(p.helperEarning || p.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-600 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Thu nhập được tính sau khi khách hàng xác nhận thanh toán. Nền tảng giữ phí dịch vụ 10%.</span>
      </div>
    </div>
  );
}
