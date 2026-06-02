import { useEffect, useState } from 'react';
import { getHelperEarningsApi } from '../../api/payment.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';
import {
  Banknote, Calendar, CheckCircle, Star,
  CreditCard, Wallet, Info, TrendingUp, PieChart, ArrowUpRight,
} from 'lucide-react';

/* ─── Stat card ──────────────────────────────────────────────────── */
function StatCard({ label, value, Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

/* ─── Payment method label ───────────────────────────────────────── */
function methodLabel(method) {
  if (method === 'cash')          return 'Tiền mặt';
  if (method === 'vnpay')         return 'VNPay';
  if (method === 'bank_transfer') return 'Chuyển khoản';
  return method || '—';
}

/* ─── Earnings chart (simple bar) ───────────────────────────────── */
function EarningsBar({ payments }) {
  if (!payments || payments.length === 0) return null;

  // Nhóm theo tháng, tính tổng thu nhập
  const byMonth = {};
  payments.forEach((p) => {
    if (!p.paidAt) return;
    const key = new Date(p.paidAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
    byMonth[key] = (byMonth[key] || 0) + (p.helperEarning || p.amount || 0);
  });

  const entries = Object.entries(byMonth).slice(-6); // 6 tháng gần nhất
  if (entries.length < 2) return null;

  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-orange-500" />
        </div>
        <h2 className="font-semibold text-gray-900">Thu nhập theo tháng</h2>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex items-end gap-3 h-28" style={{ minWidth: `${entries.length * 56}px` }}>
        {entries.map(([month, total]) => {
          const heightPct = Math.max(8, Math.round((total / max) * 100));
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-2 min-w-[44px]">
              <p className="text-xs font-semibold text-gray-600 text-center truncate w-full">
                {formatPrice(total).replace('₫', '').trim()}
              </p>
              <div
                className="w-full bg-orange-100 rounded-t-lg hover:bg-orange-200 transition-colors relative group"
                style={{ height: `${heightPct}%` }}
              >
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {formatPrice(total)}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-orange-400 rounded-t-lg"
                  style={{ height: '100%' }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center truncate w-full">{month}</p>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function HelperEarningsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHelperEarningsApi()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const walletBalance = data?.summary?.walletBalance ?? 0;
  const walletNegative = walletBalance < 0;

  const stats = [
    {
      label: 'Tổng thu nhập',
      value: formatPrice(data?.summary?.totalEarnings || 0),
      Icon: Banknote,
      color: 'text-green-600',
      bg:    'bg-green-50',
    },
    {
      label: 'Tháng này',
      value: formatPrice(data?.summary?.monthlyEarnings || 0),
      Icon: Calendar,
      color: 'text-blue-600',
      bg:    'bg-blue-50',
    },
    {
      label: 'Tuần này',
      value: formatPrice(data?.summary?.weeklyEarnings || 0),
      Icon: TrendingUp,
      color: 'text-purple-600',
      bg:    'bg-purple-50',
    },
    {
      label: 'TB / đơn',
      value: formatPrice(data?.summary?.avgPerOrder || 0),
      Icon: ArrowUpRight,
      color: 'text-pink-600',
      bg:    'bg-pink-50',
    },
    {
      label: 'Đơn hoàn thành',
      value: data?.summary?.completedBookings || 0,
      Icon: CheckCircle,
      color: 'text-orange-600',
      bg:    'bg-orange-50',
    },
    {
      label: 'Đánh giá TB',
      value: Number(data?.summary?.ratingAverage || 0).toFixed(1),
      Icon: Star,
      color: 'text-yellow-600',
      bg:    'bg-yellow-50',
    },
  ];

  const payments  = data?.payments  || [];
  const byService = data?.byService || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thu nhập của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Thống kê và lịch sử giao dịch</p>
        </div>

        {/* Ví thu nhập */}
        <div className={`rounded-2xl p-5 mb-5 border ${walletNegative ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${walletNegative ? 'bg-red-100' : 'bg-orange-50'}`}>
                <Wallet className={`w-5 h-5 ${walletNegative ? 'text-red-500' : 'text-orange-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Số dư ví thu nhập</p>
                <p className={`text-2xl font-bold ${walletNegative ? 'text-red-600' : 'text-gray-900'}`}>
                  {walletNegative ? '−' : ''}{formatPrice(Math.abs(walletBalance))}
                </p>
              </div>
            </div>
            {walletNegative && (
              <div className="flex items-start gap-1.5 text-red-500 max-w-[200px] text-right">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Số dư âm do phí nền tảng từ đơn tiền mặt chưa được bù đắp
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Bar chart */}
        <EarningsBar payments={payments} />

        {/* Thu nhập theo dịch vụ */}
        {byService.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <PieChart className="w-4 h-4 text-purple-500" />
              </div>
              <h2 className="font-semibold text-gray-900">Thu nhập theo dịch vụ</h2>
            </div>
            <div className="space-y-3">
              {byService.map((svc) => {
                const pct = data?.summary?.totalEarnings > 0
                  ? Math.round((svc.earning / data.summary.totalEarnings) * 100)
                  : 0;
                return (
                  <div key={svc.serviceName}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate">{svc.serviceName}</span>
                      <span className="text-gray-500 flex-shrink-0 ml-2">
                        {svc.count} đơn · {formatPrice(svc.earning)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment history */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Lịch sử thanh toán</h2>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {payments.length} giao dịch
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700">Chưa có giao dịch nào</p>
              <p className="text-sm text-gray-400 mt-1">Hoàn thành đơn hàng để nhận thanh toán</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payments.map((p, idx) => (
                <div
                  key={p.paymentId ?? idx}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Đơn {p.bookingId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.paidAt ? formatDate(p.paidAt) : '—'}
                        {p.paymentMethod && (
                          <span className="ml-1.5 text-gray-300">·</span>
                        )}
                        {p.paymentMethod && (
                          <span className="ml-1.5">{methodLabel(p.paymentMethod)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                      Đã nhận
                    </span>
                    <p className="font-bold text-green-600 text-sm">
                      +{formatPrice(p.helperEarning || p.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-600">
            Thu nhập được tính sau khi khách hàng xác nhận thanh toán. Nền tảng giữ phí dịch vụ 20% (bạn nhận 80% giá trị đơn). Đơn tiền mặt: phí sẽ khấu trừ vào ví.
          </p>
        </div>
      </div>
    </div>
  );
}
