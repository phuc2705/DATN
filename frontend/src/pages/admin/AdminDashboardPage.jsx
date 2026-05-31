import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStatsApi, verifyHelperApi, getAdminUsersApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import { User, Sparkles, ClipboardList, Banknote, RefreshCw, CheckCircle, MessageSquare } from 'lucide-react';

const MONTH_LABEL = { '01':'T1','02':'T2','03':'T3','04':'T4','05':'T5','06':'T6','07':'T7','08':'T8','09':'T9','10':'T10','11':'T11','12':'T12' };

function RevenueChart({ data }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-sm py-8 text-center">Chưa có dữ liệu doanh thu</p>;

  const revenues = data.map((d) => Number(d.revenue));
  const max = Math.max(...revenues, 1);
  const CHART_H = 140; // px chiều cao vùng cột
  const BAR_AREA_H = 100; // px chiều cao thực tế cột (phần còn lại cho badge)

  const growthList = revenues.map((rev, i) => {
    if (i === 0) return null;
    const prev = revenues[i - 1];
    if (prev === 0) return null;
    return Math.round(((rev - prev) / prev) * 100);
  });

  const totalRevenue = revenues.reduce((a, b) => a + b, 0);

  // Tính tọa độ Y (px từ đáy) của đỉnh mỗi cột để vẽ đường xu hướng
  const dotYs = revenues.map((rev) => Math.max((rev / max) * BAR_AREA_H, rev > 0 ? 8 : 3));

  // Tạo polyline points — cần biết width mỗi cột, dùng % để tính
  // Tỷ lệ x của tâm mỗi cột (gap=8px ≈ dùng flex, xấp xỉ equal width)
  const n = data.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">Tổng 6 tháng</p>
        <p className="text-sm font-bold text-[#828fff]">{formatPrice(totalRevenue)}</p>
      </div>

      {/* Biểu đồ — dùng position relative để overlay SVG đường xu hướng */}
      <div className="relative" style={{ height: CHART_H + 32 }}>

        {/* Đường lưới ngang (3 mức) */}
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 border-t border-dashed border-gray-200"
            style={{ bottom: 28 + (pct / 100) * BAR_AREA_H }}
          />
        ))}

        {/* SVG đường xu hướng overlay */}
        <svg
          className="absolute left-0 right-0 pointer-events-none"
          style={{ bottom: 28, height: BAR_AREA_H, width: '100%' }}
          preserveAspectRatio="none"
          viewBox={`0 0 ${n * 100} ${BAR_AREA_H}`}
        >
          {/* Vùng tô dưới đường */}
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#828fff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#828fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={dotYs.map((y, i) => `${i * 100 + 50},${BAR_AREA_H - y}`).join(' ')}
            fill="none"
            stroke="#828fff"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="0"
          />
          {/* Vùng fill dưới đường */}
          <polygon
            points={[
              ...dotYs.map((y, i) => `${i * 100 + 50},${BAR_AREA_H - y}`),
              `${(n - 1) * 100 + 50},${BAR_AREA_H}`,
              `50,${BAR_AREA_H}`,
            ].join(' ')}
            fill="url(#trendFill)"
          />
          {/* Chấm tròn tại đỉnh mỗi cột */}
          {dotYs.map((y, i) => {
            const growth = growthList[i];
            const color = growth === null ? '#828fff' : growth >= 0 ? '#34d399' : '#f87171';
            return (
              <circle
                key={i}
                cx={i * 100 + 50}
                cy={BAR_AREA_H - y}
                r="4"
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Các cột + nhãn */}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-1.5" style={{ height: CHART_H + 32 }}>
          {data.map((d, i) => {
            const rev = Number(d.revenue);
            const pct = Math.max((rev / max) * 100, rev > 0 ? 6 : 2);
            const [, mon] = d.month.split('-');
            const growth = growthList[i];
            const isLatest = i === data.length - 1;

            // Màu cột theo tăng/giảm
            let barColor = 'bg-gray-100';
            if (isLatest) barColor = 'bg-gradient-to-t from-[#5e6ad2] to-[#828fff]';
            else if (growth === null) barColor = 'bg-gray-300';
            else if (growth >= 0) barColor = 'bg-emerald-500/30';
            else barColor = 'bg-red-500/30';

            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-0 group relative">
                {/* Badge tăng giảm */}
                <div className="h-6 flex items-center justify-center mb-0.5">
                  {growth !== null && (
                    <span className={`text-[9px] font-bold leading-none px-1 py-0.5 rounded ${
                      growth >= 0
                        ? 'text-emerald-400 bg-emerald-400/10'
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {growth >= 0 ? '▲' : '▼'}{Math.abs(growth)}%
                    </span>
                  )}
                </div>

                {/* Tooltip */}
                <div className="absolute z-20 bg-gray-100 border border-gray-200 text-gray-900 text-xs px-2.5 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl"
                  style={{ bottom: 36, left: '50%', transform: 'translateX(-50%)' }}>
                  <p className="font-bold text-gray-900">{MONTH_LABEL[mon]}: {formatPrice(rev)}</p>
                  {growth !== null && (
                    <p className={`text-[11px] mt-0.5 ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {growth >= 0 ? '+' : ''}{growth}% so với tháng trước
                    </p>
                  )}
                </div>

                {/* Cột — chiều cao tính trong BAR_AREA_H */}
                <div
                  className={`w-full rounded-t transition-all duration-300 group-hover:brightness-125 ${barColor}`}
                  style={{ height: (pct / 100) * BAR_AREA_H }}
                />

                {/* Nhãn tháng */}
                <span className={`text-[11px] font-medium mt-1 ${isLatest ? 'text-[#828fff]' : 'text-gray-400'}`}>
                  {MONTH_LABEL[mon]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chú thích */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[#5e6ad2] to-[#828fff]" />
          <span className="text-[11px] text-gray-400">Tháng hiện tại</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/30" />
          <span className="text-[11px] text-gray-400">Tăng trưởng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/30" />
          <span className="text-[11px] text-gray-400">Sụt giảm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="8"><polyline points="0,6 8,2 16,4" fill="none" stroke="#828fff" strokeWidth="2" strokeLinecap="round"/></svg>
          <span className="text-[11px] text-gray-400">Xu hướng</span>
        </div>
      </div>
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

      {/* Revenue chart + Status chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">Doanh thu 6 tháng gần nhất</h2>
          </div>
          <RevenueChart data={stats?.monthlyRevenue} />
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
          <div className="space-y-3">
            {statusEntries.map(({ label, color, count }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <span className="text-gray-500 font-bold">{count} đơn</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
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
