import { useEffect, useState, useMemo } from 'react';
import { getHelperEarningsApi } from '../../api/payment.api';
import { getHelperWalletApi } from '../../api/user.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate } from '../../utils/format';
import {
  Banknote, Calendar, CheckCircle, Star,
  CreditCard, Wallet, Info, TrendingUp, PieChart, ArrowUpRight,
  ChevronDown, ChevronLeft, ChevronRight,
  ArrowDownLeft, ArrowUpRight as ArrowUpRightIcon, Gift, RotateCcw, Plus,
} from 'lucide-react';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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

/* ─── Biểu đồ thu nhập theo tuần — so sánh tuần trước (trong tab) ─ */
function WeeklyEarningsChartInner({ payments }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const { weekData, prevWeekData } = useMemo(() => {
    const computeWeek = (offset) => {
      const now = new Date();
      const dayOfWeek = (now.getDay() + 6) % 7;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek + offset * 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return { date: d, earning: 0, count: 0 };
      });

      (payments || []).forEach((p) => {
        if (!p.paidAt) return;
        const pd = new Date(p.paidAt);
        if (pd < startOfWeek || pd > endOfWeek) return;
        const idx = (pd.getDay() + 6) % 7;
        days[idx].earning += p.helperEarning || 0;
        days[idx].count++;
      });

      const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
      return {
        days,
        label: `${fmt(days[0].date)} - ${fmt(days[6].date)}/${days[6].date.getFullYear()}`,
        total: days.reduce((s, d) => s + d.earning, 0),
        count: days.reduce((s, d) => s + d.count, 0),
      };
    };
    return {
      weekData:     computeWeek(weekOffset),
      prevWeekData: computeWeek(weekOffset - 1),
    };
  }, [payments, weekOffset]);

  const allEarnings  = [...weekData.days.map((d) => d.earning), ...prevWeekData.days.map((d) => d.earning)];
  const max          = Math.max(...allEarnings, 1);
  const weekGrowth   = prevWeekData.total > 0
    ? Math.round(((weekData.total - prevWeekData.total) / prevWeekData.total) * 100)
    : null;
  const todayDayIdx  = weekOffset === 0 ? (new Date().getDay() + 6) % 7 : -1;
  const CHART_H      = 100;

  return (
    <div>
      {/* Điều hướng tuần */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setWeekOffset((o) => o - 1)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Tuần trước
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">{weekData.label}</p>
          <p className="text-[10px] text-orange-400 mt-0.5">
            {weekOffset === 0 ? 'Tuần này' : weekOffset === -1 ? 'Tuần trước' : `${Math.abs(weekOffset)} tuần trước`}
          </p>
        </div>
        <button onClick={() => setWeekOffset((o) => Math.min(0, o + 1))} disabled={weekOffset >= 0}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          Tuần sau <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tóm tắt + so sánh tuần */}
      <div className="flex items-start gap-5 mb-4 pb-3 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400">Thu nhập tuần</p>
          <p className="text-base font-bold text-orange-500">{formatPrice(weekData.total)}</p>
          {weekGrowth !== null && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded ${
              weekGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
            }`}>
              {weekGrowth >= 0 ? '▲' : '▼'} {Math.abs(weekGrowth)}% so với tuần trước
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-400">Số đơn</p>
          <p className="text-base font-bold text-gray-700">{weekData.count}</p>
        </div>
        {prevWeekData.total > 0 && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-gray-400">Tuần trước</p>
            <p className="text-xs font-semibold text-gray-400">{formatPrice(prevWeekData.total)}</p>
          </div>
        )}
      </div>

      {/* Biểu đồ cột đôi so sánh */}
      <div className="relative" style={{ height: CHART_H + 30 }}>
        {[33, 66].map((pct) => (
          <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-gray-100"
            style={{ bottom: 30 + (pct / 100) * CHART_H }} />
        ))}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-1" style={{ height: CHART_H + 30 }}>
          {weekData.days.map((day, i) => {
            const prev    = prevWeekData.days[i];
            const currPct = Math.max((day.earning / max) * 100, day.earning > 0 ? 4 : 1);
            const prevPct = Math.max((prev.earning / max) * 100, prev.earning > 0 ? 4 : 1);
            const isToday = i === todayDayIdx;
            const dateLabel = `${day.date.getDate()}/${day.date.getMonth() + 1}`;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute z-20 bg-gray-900 text-white text-xs px-2.5 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl"
                  style={{ bottom: 36, left: '50%', transform: 'translateX(-50%)' }}>
                  <p className="font-bold mb-1">{DAY_LABELS[i]}</p>
                  <p className="text-orange-300">Tuần này: {formatPrice(day.earning)}</p>
                  <p className="text-gray-400">Tuần trước: {formatPrice(prev.earning)}</p>
                </div>
                <div className="w-full flex items-end gap-0.5" style={{ height: `${CHART_H}px` }}>
                  <div className="flex-1 rounded-t-sm bg-gray-200 transition-all duration-300"
                    style={{ height: `${prevPct}%` }} />
                  <div className={`flex-1 rounded-t-sm transition-all duration-300 ${
                    isToday ? 'bg-orange-400' : day.earning > 0 ? 'bg-orange-300' : 'bg-gray-100'
                  }`} style={{ height: `${currPct}%` }} />
                </div>
                <div className="flex flex-col items-center mt-1 leading-none gap-0.5">
                  <span className={`text-[10px] font-semibold ${isToday ? 'text-orange-500' : 'text-gray-600'}`}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className="text-[9px] text-gray-400">{dateLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chú thích */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-orange-300" />
          <span className="text-[10px] text-gray-400">Tuần đang xem</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-gray-200" />
          <span className="text-[10px] text-gray-400">Tuần trước</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Bảng thống kê thu nhập theo từng ngày ─────────────────────── */
/* ─── Section 2 tab thống kê (Helper): tuần / tháng ─────────────── */
function HelperStatsSection({ payments }) {
  const [tab, setTab] = useState('week');

  const TABS = [
    { key: 'week',  label: 'Theo tuần' },
    { key: 'month', label: 'Theo tháng' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 mb-5">
      <div className="flex items-center gap-0 px-6 pt-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 mr-5 pb-4 text-sm">Thống kê thu nhập</h2>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-4 text-xs font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'text-orange-500 border-orange-400'
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'week'  && <WeeklyEarningsChartInner payments={payments} />}
        {tab === 'month' && <MonthlyEarningsTableInner payments={payments} />}
      </div>
    </div>
  );
}

/* ─── Bảng thống kê thu nhập theo tháng — so sánh tháng trước ───── */
function MonthlyEarningsTableInner({ payments }) {
  const monthlyData = useMemo(() => {
    const map = {};
    (payments || []).forEach((p) => {
      if (!p.paidAt) return;
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month: key, earning: 0, count: 0 };
      map[key].earning += p.helperEarning || 0;
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [payments]);

  if (monthlyData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Chưa có dữ liệu tháng nào</p>
      </div>
    );
  }

  const maxEarning = Math.max(...monthlyData.map((d) => d.earning), 1);
  const totalEarning = monthlyData.reduce((s, d) => s + d.earning, 0);
  const totalCount   = monthlyData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-400 pb-3">Tháng</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3">Thu nhập</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3">Đơn</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3">TB/đơn</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3">vs tháng trước</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {monthlyData.map((d, i) => {
            const prev   = i > 0 ? monthlyData[i - 1].earning : null;
            const growth = prev !== null && prev > 0
              ? Math.round(((d.earning - prev) / prev) * 100)
              : null;
            const avg      = d.count > 0 ? Math.round(d.earning / d.count) : 0;
            const barPct   = Math.round((d.earning / maxEarning) * 100);
            const isLatest = i === monthlyData.length - 1;
            const label    = new Date(d.month + '-01').toLocaleDateString('vi-VN', {
              month: 'long', year: 'numeric',
            });
            return (
              <tr key={d.month} className="hover:bg-gray-50 transition-colors">
                <td className={`py-3 font-medium ${isLatest ? 'text-orange-500' : 'text-gray-800'}`}>
                  {label}
                </td>
                <td className="py-3 text-right">
                  <span className="font-bold text-[#ff385c] block">{formatPrice(d.earning)}</span>
                  <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden ml-auto mt-1">
                    <div className="h-full bg-orange-400/50 rounded-full transition-all"
                      style={{ width: `${barPct}%` }} />
                  </div>
                </td>
                <td className="py-3 text-right text-gray-500">{d.count}</td>
                <td className="py-3 text-right text-gray-500">{formatPrice(avg)}</td>
                <td className="py-3 text-right">
                  {growth !== null ? (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                      growth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
                    }`}>
                      {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}%
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-100 bg-gray-50">
            <td className="py-2.5 font-bold text-gray-600 text-xs uppercase tracking-wide">Tổng</td>
            <td className="py-2.5 text-right font-extrabold text-[#ff385c]">{formatPrice(totalEarning)}</td>
            <td className="py-2.5 text-right font-bold text-gray-600">{totalCount}</td>
            <td className="py-2.5 text-right text-gray-500">
              {totalCount > 0 ? formatPrice(Math.round(totalEarning / totalCount)) : '—'}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
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

/* ─── Nhãn & icon nguồn giao dịch ───────────────────────────────── */
const SOURCE_META = {
  booking_payment: { label: 'Hoàn thành đơn',   Icon: CheckCircle,        color: 'text-green-600',  bg: 'bg-green-50'  },
  withdrawal:      { label: 'Rút tiền',          Icon: ArrowUpRightIcon,   color: 'text-red-500',    bg: 'bg-red-50'    },
  top_up:          { label: 'Nạp tiền',          Icon: Plus,               color: 'text-blue-600',   bg: 'bg-blue-50'   },
  refund:          { label: 'Hoàn tiền',         Icon: RotateCcw,          color: 'text-orange-500', bg: 'bg-orange-50' },
  bonus:           { label: 'Thưởng / KM',       Icon: Gift,               color: 'text-purple-600', bg: 'bg-purple-50' },
};

/* ─── Section biến động số dư ví ────────────────────────────────── */
function WalletHistory() {
  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all'); // all | credit | debit

  useEffect(() => {
    getHelperWalletApi({ limit: 100 })
      .then(({ data: res }) => {
        setWallet(res.data.wallet);
        setTransactions(res.data.transactions);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  if (loading) return (
    <div className="flex justify-center py-10"><LoadingSpinner /></div>
  );

  const FILTERS = [
    { key: 'all',    label: 'Tất cả' },
    { key: 'credit', label: 'Tiền vào' },
    { key: 'debit',  label: 'Tiền ra' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-5">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Biến động số dư ví</h2>
            {wallet && (
              <p className="text-xs text-gray-400 mt-0.5">
                Số dư hiện tại:&nbsp;
                <span className={`font-bold ${wallet.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {wallet.balance < 0 ? '−' : ''}{formatPrice(Math.abs(wallet.balance))}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === f.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tổng kết ví */}
      {wallet && (
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-6 py-3 text-center">
            <p className="text-xs text-gray-400">Tổng tiền vào</p>
            <p className="text-sm font-bold text-green-600">+{formatPrice(wallet.totalEarned)}</p>
          </div>
          <div className="px-6 py-3 text-center">
            <p className="text-xs text-gray-400">Tổng tiền ra</p>
            <p className="text-sm font-bold text-red-500">−{formatPrice(wallet.totalWithdrawn)}</p>
          </div>
        </div>
      )}

      {/* Danh sách giao dịch */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Chưa có biến động nào</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((tx, idx) => {
            const meta    = SOURCE_META[tx.source] || { label: tx.source, Icon: Wallet, color: 'text-gray-500', bg: 'bg-gray-50' };
            const isCredit = tx.type === 'credit';
            return (
              <div key={tx.transactionId ?? idx}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <meta.Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {meta.label}{tx.serviceName ? ` · ${tx.serviceName}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {tx.description || (tx.bookingId ? `Đơn #${tx.bookingId}` : '—')}
                      <span className="mx-1 text-gray-200">·</span>
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0 ml-4 gap-0.5">
                  <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                    {isCredit ? '+' : '−'}{formatPrice(tx.amount)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Số dư: <span className="font-medium text-gray-600">{formatPrice(tx.balanceAfter)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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

        {/* 3 tab thống kê: ngày / tuần / tháng */}
        <HelperStatsSection payments={allPayments} />

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
                      +{formatPrice(p.helperEarning ?? p.amount)}
                    </p>
                    <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${p.paymentMethod === 'cash' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                      {p.paymentMethod === 'cash' ? 'Thu tiền mặt' : 'Đã nhận'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Biến động số dư ví */}
        <WalletHistory />

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
