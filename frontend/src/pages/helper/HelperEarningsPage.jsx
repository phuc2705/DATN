import { useEffect, useState, useMemo } from 'react';
import { getHelperEarningsApi } from '../../api/payment.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';
import {
  Banknote, Calendar, CheckCircle, Star,
  CreditCard, Wallet, Info, TrendingUp, PieChart, ArrowUpRight,
  ChevronDown,
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

/* ─── Nhãn phương thức thanh toán ───────────────────────────────── */
function methodLabel(method) {
  if (method === 'cash')          return 'Tiền mặt';
  if (method === 'vnpay')         return 'VNPay';
  if (method === 'bank_transfer') return 'Chuyển khoản';
  return method || '—';
}

/* ─── Biểu đồ cột theo tháng ────────────────────────────────────── */
function EarningsBar({ payments }) {
  if (!payments || payments.length === 0) return null;

  // Nhóm theo tháng, tính tổng thu nhập helper
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

/* ─── Filter tháng ───────────────────────────────────────────────── */
function buildMonthOptions(payments) {
  const seen = new Set();
  const opts = [{ value: '', label: 'Tất cả' }];
  // Duyệt theo thứ tự thời gian giảm dần
  const sorted = [...payments].sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''));
  sorted.forEach((p) => {
    if (!p.paidAt) return;
    const d   = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!seen.has(key)) {
      seen.add(key);
      const label = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      opts.push({ value: key, label });
    }
  });
  return opts;
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function HelperEarningsPage() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [monthFilter, setMonthFilter] = useState(''); // "" = tất cả

  useEffect(() => {
    getHelperEarningsApi()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Danh sách tháng để filter
  const monthOptions = useMemo(
    () => buildMonthOptions(data?.payments || []),
    [data]
  );

  // Payments đã lọc theo tháng
  const filteredPayments = useMemo(() => {
    const all = data?.payments || [];
    if (!monthFilter) return all;
    return all.filter((p) => {
      if (!p.paidAt) return false;
      const d   = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === monthFilter;
    });
  }, [data, monthFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const walletBalance  = data?.summary?.walletBalance ?? 0;
  const walletNegative = walletBalance < 0;

  const stats = [
    {
      label: 'Tổng thu nhập',
      value: formatPrice(data?.summary?.totalEarnings || 0),
      Icon:  Banknote,
      color: 'text-green-600',
      bg:    'bg-green-50',
    },
    {
      label: 'Tháng này',
      value: formatPrice(data?.summary?.monthlyEarnings || 0),
      Icon:  Calendar,
      color: 'text-blue-600',
      bg:    'bg-blue-50',
    },
    {
      label: 'Tuần này',
      value: formatPrice(data?.summary?.weeklyEarnings || 0),
      Icon:  TrendingUp,
      color: 'text-purple-600',
      bg:    'bg-purple-50',
    },
    {
      label: 'TB / đơn',
      value: formatPrice(data?.summary?.avgPerOrder || 0),
      Icon:  ArrowUpRight,
      color: 'text-pink-600',
      bg:    'bg-pink-50',
    },
    {
      label: 'Đơn hoàn thành',
      value: data?.summary?.completedBookings || 0,
      Icon:  CheckCircle,
      color: 'text-orange-600',
      bg:    'bg-orange-50',
    },
    {
      label: 'Đánh giá TB',
      value: Number(data?.summary?.ratingAverage || 0).toFixed(1),
      Icon:  Star,
      color: 'text-yellow-600',
      bg:    'bg-yellow-50',
    },
  ];

  const allPayments = data?.payments  || [];
  const byService   = data?.byService || [];

  // Tổng thu nhập của tháng đang lọc
  const filteredTotal = filteredPayments.reduce((s, p) => s + (p.helperEarning || 0), 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thu nhập của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Thống kê và lịch sử giao dịch</p>
        </div>

        {/* Ví thu nhập — nổi bật */}
        <div className={`rounded-2xl p-6 mb-5 border ${walletNegative ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${walletNegative ? 'bg-red-100' : 'bg-orange-50'}`}>
                <Wallet className={`w-7 h-7 ${walletNegative ? 'text-red-500' : 'text-orange-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Số dư ví thu nhập</p>
                <p className={`text-3xl font-bold tracking-tight ${walletNegative ? 'text-red-600' : 'text-gray-900'}`}>
                  {walletNegative ? '−' : ''}{formatPrice(Math.abs(walletBalance))}
                </p>
                {!walletNegative && (
                  <p className="text-xs text-gray-400 mt-0.5">Cập nhật sau mỗi đơn hoàn thành</p>
                )}
              </div>
            </div>
            {walletNegative && (
              <div className="flex items-start gap-2 text-red-500 max-w-xs">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Số dư âm do phí nền tảng từ đơn tiền mặt chưa được bù đắp
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid — 2 cột mobile, 3 cột desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Biểu đồ cột */}
        <EarningsBar payments={allPayments} />

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
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-700 font-medium truncate">{svc.serviceName}</span>
                      <span className="text-gray-500 flex-shrink-0 ml-3">
                        {svc.count} đơn · <span className="text-[#ff385c] font-semibold">{formatPrice(svc.earning)}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lịch sử giao dịch + filter tháng */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Lịch sử giao dịch</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter tháng */}
              {monthOptions.length > 2 && (
                <div className="relative">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="appearance-none text-sm border border-gray-200 bg-white rounded-lg pl-3 pr-8 h-8 text-gray-600 focus:outline-none focus:border-orange-400 cursor-pointer"
                  >
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              )}
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                {filteredPayments.length} giao dịch
              </span>
            </div>
          </div>

          {/* Tổng khi đang lọc tháng */}
          {monthFilter && filteredPayments.length > 0 && (
            <div className="px-6 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
              <span className="text-sm text-orange-700">
                Tổng tháng {monthOptions.find(m => m.value === monthFilter)?.label}
              </span>
              <span className="text-sm font-bold text-[#ff385c]">+{formatPrice(filteredTotal)}</span>
            </div>
          )}

          {filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700">
                {monthFilter ? 'Không có giao dịch trong tháng này' : 'Chưa có giao dịch nào'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {monthFilter ? 'Thử chọn tháng khác' : 'Hoàn thành đơn hàng để nhận thanh toán'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredPayments.map((p, idx) => (
                <div
                  key={p.paymentId ?? idx}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {p.serviceName || `Đơn #${p.bookingId}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                        <span>{p.paidAt ? formatDate(p.paidAt) : '—'}</span>
                        {p.paymentMethod && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>{methodLabel(p.paymentMethod)}</span>
                          </>
                        )}
                        {p.customerName && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>{p.customerName}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                    <p className="font-bold text-[#ff385c] text-sm">
                      +{formatPrice(p.helperEarning || p.amount)}
                    </p>
                    <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                      Đã nhận
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ghi chú */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-600 leading-relaxed">
            Thu nhập được tính sau khi khách hàng xác nhận thanh toán. Nền tảng giữ phí dịch vụ <strong>20%</strong> — bạn nhận <strong>80%</strong> giá trị đơn. Đơn tiền mặt: phí sẽ khấu trừ vào ví sau mỗi đơn.
          </p>
        </div>
      </div>
    </div>
  );
}
