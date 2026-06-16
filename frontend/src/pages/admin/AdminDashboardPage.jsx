import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStatsApi, verifyHelperApi, getAdminUsersApi, getAdminWeeklyStatsApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import { User, Sparkles, ClipboardList, Banknote, RefreshCw, CheckCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_LABEL = { '01':'T1','02':'T2','03':'T3','04':'T4','05':'T5','06':'T6','07':'T7','08':'T8','09':'T9','10':'T10','11':'T11','12':'T12' };
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/* ─── Biểu đồ doanh thu theo tuần — so sánh tuần trước ──────────── */
function WeeklyRevenueChart() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekData, setWeekData]     = useState(null);
  const [prevData, setPrevData]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAdminWeeklyStatsApi(weekOffset),
      getAdminWeeklyStatsApi(weekOffset - 1),
    ])
      .then(([{ data: curr }, { data: prev }]) => {
        setWeekData(curr.data);
        setPrevData(prev.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekOffset]);

  const days     = weekData?.days || [];
  const prevDays = prevData?.days  || Array(7).fill({ revenue: 0, bookings: 0, date: '' });

  const allRevs  = [...days.map((d) => d.revenue), ...prevDays.map((d) => d.revenue || 0)];
  const max      = Math.max(...allRevs, 1);

  const totalRev     = days.reduce((s, d) => s + d.revenue, 0);
  const totalBook    = days.reduce((s, d) => s + d.bookings, 0);
  const prevTotalRev = prevDays.reduce((s, d) => s + (d.revenue || 0), 0);
  const weekGrowth   = prevTotalRev > 0
    ? Math.round(((totalRev - prevTotalRev) / prevTotalRev) * 100)
    : null;
  const todayDayIdx  = weekOffset === 0 ? (new Date().getDay() + 6) % 7 : -1;
  const CHART_H      = 120;

  return (
    <div>
      {/* Điều hướng tuần */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setWeekOffset((o) => o - 1)}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">{weekData?.label || '...'}</p>
          <p className="text-[10px] text-[#828fff]">
            {weekOffset === 0 ? 'Tuần này' : weekOffset === -1 ? 'Tuần trước' : `${Math.abs(weekOffset)} tuần trước`}
          </p>
        </div>
        <button onClick={() => setWeekOffset((o) => Math.min(0, o + 1))} disabled={weekOffset >= 0}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tóm tắt + so sánh tuần */}
      <div className="flex items-start gap-5 mb-3 pb-3 border-b border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Doanh thu tuần</p>
          <p className="text-sm font-extrabold text-gray-900">{formatPrice(totalRev)}</p>
          {weekGrowth !== null && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded ${
              weekGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
            }`}>
              {weekGrowth >= 0 ? '▲' : '▼'} {Math.abs(weekGrowth)}% so với tuần trước
            </span>
          )}
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Đơn</p>
          <p className="text-sm font-extrabold text-gray-900">{totalBook}</p>
        </div>
        {prevTotalRev > 0 && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-gray-400">Tuần trước</p>
            <p className="text-xs font-semibold text-gray-400">{formatPrice(prevTotalRev)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#828fff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="relative" style={{ height: CHART_H + 20 }}>
            {[33, 66].map((pct) => (
              <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                style={{ bottom: 20 + (pct / 100) * CHART_H }} />
            ))}
            {/* Cột đôi: tuần trước (xám) + tuần hiện tại (tím) */}
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-1" style={{ height: CHART_H + 30 }}>
              {days.map((day, i) => {
                const prev     = prevDays[i] || { revenue: 0 };
                const currPct  = Math.max((day.revenue / max) * 100, day.revenue > 0 ? 4 : 1);
                const prevPct  = Math.max(((prev.revenue || 0) / max) * 100, (prev.revenue || 0) > 0 ? 4 : 1);
                const isToday  = i === todayDayIdx;
                const [, mm, dd] = (day.date || '--').split('-');
                const dateLabel  = mm && dd ? `${parseInt(dd)}/${parseInt(mm)}` : '';
                return (
                  <div key={day.date || i} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute z-20 bg-gray-900 text-white text-xs px-2.5 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl"
                      style={{ bottom: 34, left: '50%', transform: 'translateX(-50%)' }}>
                      <p className="font-bold mb-1">{DAY_LABELS[i]} {dateLabel}</p>
                      <p className="text-[#828fff]">Tuần này: {formatPrice(day.revenue)}</p>
                      <p className="text-gray-400">Tuần trước: {formatPrice(prev.revenue || 0)}</p>
                    </div>
                    {/* 2 cột cạnh nhau */}
                    <div className="w-full flex items-end gap-0.5" style={{ height: `${CHART_H}px` }}>
                      <div className="flex-1 rounded-t-sm bg-gray-200 transition-all duration-300"
                        style={{ height: `${prevPct}%` }} />
                      <div className={`flex-1 rounded-t-sm transition-all duration-300 ${
                        isToday ? 'bg-gradient-to-t from-[#5e6ad2] to-[#828fff]'
                          : day.revenue > 0 ? 'bg-[#828fff]/50' : 'bg-gray-100'
                      }`} style={{ height: `${currPct}%` }} />
                    </div>
                    {/* Nhãn 2 dòng: tên thứ + ngày/tháng */}
                    <div className="flex flex-col items-center mt-1 leading-none gap-0.5">
                      <span className={`text-[10px] font-semibold ${isToday ? 'text-[#828fff]' : 'text-gray-600'}`}>
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
              <div className="w-2.5 h-2.5 rounded-sm bg-[#828fff]/50" />
              <span className="text-[10px] text-gray-400">Tuần đang xem</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-gray-200" />
              <span className="text-[10px] text-gray-400">Tuần trước</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Section 2 tab thống kê (Admin): tuần / tháng ─────────────── */
function AdminStatsSection({ monthlyRevenue }) {
  const [tab, setTab] = useState('week');

  const TABS = [
    { key: 'week',  label: 'Theo tuần' },
    { key: 'month', label: 'Theo tháng' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center gap-0 px-6 pt-5 border-b border-gray-200">
        <h2 className="font-bold text-gray-900 mr-6 pb-4">Thống kê doanh thu</h2>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'text-[#828fff] border-[#828fff]'
                : 'text-gray-400 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'week'  && <WeeklyRevenueChart />}
        {tab === 'month' && <MonthlyRevenueTable data={monthlyRevenue} />}
      </div>
    </div>
  );
}

/* ─── Bảng thống kê doanh thu theo tháng — so sánh tháng trước ──── */
function MonthlyRevenueTable({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">Chưa có dữ liệu</p>;
  }

  const maxRev = Math.max(...data.map((d) => Number(d.revenue)), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-[11px] font-semibold text-gray-400 pb-3 uppercase tracking-wide">Tháng</th>
            <th className="text-right text-[11px] font-semibold text-gray-400 pb-3 uppercase tracking-wide">Doanh thu</th>
            <th className="text-right text-[11px] font-semibold text-gray-400 pb-3 uppercase tracking-wide">Đơn</th>
            <th className="text-right text-[11px] font-semibold text-gray-400 pb-3 uppercase tracking-wide">vs tháng trước</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((d, i) => {
            const rev      = Number(d.revenue);
            const prev     = i > 0 ? Number(data[i - 1].revenue) : null;
            const growth   = prev !== null && prev > 0
              ? Math.round(((rev - prev) / prev) * 100)
              : null;
            const barPct   = Math.round((rev / maxRev) * 100);
            const [year, mon] = d.month.split('-');
            const isLatest = i === data.length - 1;
            return (
              <tr key={d.month} className="hover:bg-gray-50 transition-colors">
                <td className={`py-2.5 font-semibold ${isLatest ? 'text-[#828fff]' : 'text-gray-700'}`}>
                  {MONTH_LABEL[mon]}/{year.slice(2)}
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-bold text-gray-900 block">{formatPrice(rev)}</span>
                  <div className="h-1 w-20 bg-gray-100 rounded-full overflow-hidden ml-auto mt-1">
                    <div className="h-full bg-[#828fff]/50 rounded-full transition-all"
                      style={{ width: `${barPct}%` }} />
                  </div>
                </td>
                <td className="py-2.5 text-right text-gray-500">{d.bookings ?? '—'}</td>
                <td className="py-2.5 text-right">
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
          <tr className="border-t-2 border-gray-200 bg-gray-50">
            <td className="py-2.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Tổng</td>
            <td className="py-2.5 text-right font-extrabold text-gray-900">
              {formatPrice(data.reduce((s, d) => s + Number(d.revenue), 0))}
            </td>
            <td className="py-2.5 text-right font-bold text-gray-700">
              {data.reduce((s, d) => s + (Number(d.bookings) || 0), 0)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingHelpers, setPendingHelpers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      getAdminStatsApi(),
      getAdminUsersApi({ userType: 'helper', isVerified: 'false' }),
    ]).then(([{ data: s }, { data: u }]) => {
      setStats(s.data);
      setPendingHelpers(u.data?.users || []);
    }).catch(() => {
      toast.error('Không thể tải dữ liệu dashboard');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleVerify = async (helperId) => {
    try {
      await verifyHelperApi(helperId);
      toast.success('Đã xác minh tài khoản!');
      refresh();
    } catch {
      toast.error('Lỗi xác minh');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const growthSign = stats?.revenueGrowth != null
    ? (stats.revenueGrowth >= 0 ? `+${stats.revenueGrowth}%` : `${stats.revenueGrowth}%`)
    : null;

  const STAT_CARDS = [
    { label: 'Khách hàng',      value: stats?.totalCustomers ?? '—',   Icon: User,          iconBg: 'bg-blue-500/10 text-blue-400',    sub: `+${stats?.newCustomersThisMonth ?? 0} tháng này` },
    { label: 'Người giúp việc', value: stats?.totalHelpers ?? '—',     Icon: Sparkles,      iconBg: 'bg-emerald-500/10 text-emerald-400', sub: `${pendingHelpers.length} chờ xét duyệt` },
    { label: 'Đơn hàng',        value: stats?.totalBookings ?? '—',    Icon: ClipboardList,  iconBg: 'bg-yellow-500/10 text-yellow-400',  sub: `Tỷ lệ hủy ${stats?.cancelRate ?? 0}%` },
    { label: 'Doanh thu',       value: stats?.totalRevenue != null ? formatPrice(stats.totalRevenue) : '—', Icon: Banknote, iconBg: 'bg-[#5e6ad2]/10 text-[#828fff]', sub: growthSign ? `Tháng này ${growthSign} so với tháng trước` : 'Từ đơn hoàn thành' },
  ];

  const STATUS_META = {
    pending:     { label: 'Chờ xác nhận', color: 'bg-yellow-400' },
    confirmed:   { label: 'Đã xác nhận',  color: 'bg-blue-400' },
    in_progress: { label: 'Đang làm',     color: 'bg-[#828fff]' },
    completed:   { label: 'Hoàn thành',   color: 'bg-emerald-400' },
    cancelled:   { label: 'Đã hủy',       color: 'bg-red-400' },
  };
  const statusEntries = Object.entries(STATUS_META).map(([key, meta]) => ({
    ...meta, count: stats?.bookingsByStatus?.[key] || 0,
  }));
  const maxStatusCount = Math.max(...statusEntries.map(s => s.count), 1);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống CleanConnect</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, Icon, iconBg, sub }) => (
          <div key={label} className="bg-white rounded-lg p-5 border border-gray-200">
            <div className={`w-10 h-10 rounded-md ${iconBg} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900 leading-tight">{value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Phản hồi chờ xử lý */}
      {stats?.openFeedbacksCount > 0 && (
        <Link
          to="/admin/feedbacks"
          className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-500/30 mb-6 hover:border-red-500/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-red-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {stats.openFeedbacksCount} phản hồi chưa được xử lý
              </p>
              <p className="text-xs text-gray-500">Nhấn để xem và trả lời</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full group-hover:bg-red-500/20 transition-colors">
            Xem ngay
          </span>
        </Link>
      )}

      {/* So sánh doanh thu tháng + giá trị TB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <p className="text-xs text-gray-400 font-medium mb-1">Doanh thu tháng này</p>
          <p className="text-xl font-extrabold text-gray-900">{formatPrice(stats?.revenueThisMonth ?? 0)}</p>
          {growthSign && (
            <p className={`text-xs font-semibold mt-1 ${stats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {growthSign} so với tháng trước
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <p className="text-xs text-gray-400 font-medium mb-1">Doanh thu tháng trước</p>
          <p className="text-xl font-extrabold text-gray-900">{formatPrice(stats?.revenueLastMonth ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Đã thanh toán</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <p className="text-xs text-gray-400 font-medium mb-1">Giá trị đơn trung bình</p>
          <p className="text-xl font-extrabold text-gray-900">{formatPrice(stats?.avgBookingValue ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Không tính đơn hủy</p>
        </div>
      </div>

      {/* 3 tab thống kê: ngày / tuần / tháng */}
      <AdminStatsSection monthlyRevenue={stats?.monthlyRevenue} />

      {/* Trạng thái đơn hàng */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statusEntries.map(({ label, color, count }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">{label}</span>
                <span className="text-gray-500 font-bold">{count}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top services + Top helpers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-4">Dịch vụ phổ biến nhất</h2>
          {stats?.topServices?.length > 0 ? (
            <div className="space-y-3">
              {stats.topServices.map((s, i) => {
                const max = stats.topServices[0].bookingCount || 1;
                const pct = (s.bookingCount / max) * 100;
                return (
                  <div key={s.serviceName}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">
                        <span className="text-gray-400 mr-2">{i + 1}.</span>{s.serviceName}
                      </span>
                      <span className="text-[#828fff] font-bold">{s.bookingCount} đơn</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#5e6ad2] to-[#828fff] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-4">Top người giúp việc</h2>
          {stats?.topHelpers?.length > 0 ? (
            <div className="space-y-3">
              {stats.topHelpers.map((h, i) => (
                <div key={h.helperId} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-4 shrink-0">{i + 1}.</span>
                  <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{h.fullName}</p>
                    <p className="text-xs text-gray-400">
                      ★ {Number(h.ratingAverage || 0).toFixed(1)} · {h.totalBookings} đơn
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Pending helpers */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Người giúp việc chờ xét duyệt</h2>
            <p className="text-sm text-gray-400 mt-0.5">{pendingHelpers.length} hồ sơ đang chờ</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingHelpers.length > 0 && (
              <span className="bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 text-xs font-bold px-3 py-1 rounded">
                {pendingHelpers.length} mới
              </span>
            )}
            <Link to="/admin/helpers" className="text-[#828fff] text-sm font-semibold hover:text-gray-900 transition-colors">
              Xem tất cả →
            </Link>
          </div>
        </div>

        {pendingHelpers.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-emerald-400/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-gray-500 font-medium">Tất cả hồ sơ đã được xét duyệt!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingHelpers.slice(0, 5).map((h) => (
              <div key={h.userId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">{h.fullName}</p>
                    <p className="text-xs text-gray-400">{h.email} · {h.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleVerify(h.helperId)}
                  className="bg-[#5e6ad2] hover:bg-[#828fff] text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-colors"
                >
                  Xác minh
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
