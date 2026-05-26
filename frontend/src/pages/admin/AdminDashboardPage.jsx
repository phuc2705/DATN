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
  if (!data || data.length === 0) return <p className="text-[#62666d] text-sm py-8 text-center">Chưa có dữ liệu doanh thu</p>;
  const max = Math.max(...data.map((d) => Number(d.revenue)), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d) => {
        const pct = (Number(d.revenue) / max) * 100;
        const [, mon] = d.month.split('-');
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-[#62666d] whitespace-nowrap">{pct > 5 ? formatPrice(d.revenue).replace('₫','').trim() : ''}</span>
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#5e6ad2] to-[#828fff] transition-all"
              style={{ height: `${Math.max(pct, 4)}%` }}
              title={`${formatPrice(d.revenue)}`}
            />
            <span className="text-xs text-[#62666d]">{MONTH_LABEL[mon]}</span>
          </div>
        );
      })}
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
          <h1 className="text-2xl font-bold text-[#f7f8f8]">Dashboard</h1>
          <p className="text-[#8a8f98] text-sm mt-1">Tổng quan hệ thống CleanConnect</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f1117] border border-[#23252a] text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#1e2028] rounded-md text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, Icon, iconBg, sub }) => (
          <div key={label} className="bg-[#0f1117] rounded-lg p-5 border border-[#1e2028]">
            <div className={`w-10 h-10 rounded-md ${iconBg} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-[#f7f8f8] leading-tight">{value}</p>
            <p className="text-sm font-medium text-[#d0d6e0] mt-0.5">{label}</p>
            <p className="text-xs text-[#62666d] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Phản hồi chờ xử lý */}
      {stats?.openFeedbacksCount > 0 && (
        <Link
          to="/admin/feedbacks"
          className="flex items-center justify-between bg-[#0f1117] rounded-lg p-4 border border-red-500/30 mb-6 hover:border-red-500/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-red-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f7f8f8]">
                {stats.openFeedbacksCount} phản hồi chưa được xử lý
              </p>
              <p className="text-xs text-[#8a8f98]">Nhấn để xem và trả lời</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full group-hover:bg-red-500/20 transition-colors">
            Xem ngay
          </span>
        </Link>
      )}

      {/* So sánh doanh thu tháng + giá trị TB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0f1117] rounded-lg p-5 border border-[#1e2028]">
          <p className="text-xs text-[#62666d] font-medium mb-1">Doanh thu tháng này</p>
          <p className="text-xl font-extrabold text-[#f7f8f8]">{formatPrice(stats?.revenueThisMonth ?? 0)}</p>
          {growthSign && (
            <p className={`text-xs font-semibold mt-1 ${stats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {growthSign} so với tháng trước
            </p>
          )}
        </div>
        <div className="bg-[#0f1117] rounded-lg p-5 border border-[#1e2028]">
          <p className="text-xs text-[#62666d] font-medium mb-1">Doanh thu tháng trước</p>
          <p className="text-xl font-extrabold text-[#f7f8f8]">{formatPrice(stats?.revenueLastMonth ?? 0)}</p>
          <p className="text-xs text-[#62666d] mt-1">Đã thanh toán</p>
        </div>
        <div className="bg-[#0f1117] rounded-lg p-5 border border-[#1e2028]">
          <p className="text-xs text-[#62666d] font-medium mb-1">Giá trị đơn trung bình</p>
          <p className="text-xl font-extrabold text-[#f7f8f8]">{formatPrice(stats?.avgBookingValue ?? 0)}</p>
          <p className="text-xs text-[#62666d] mt-1">Không tính đơn hủy</p>
        </div>
      </div>

      {/* Revenue chart + Status chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0f1117] rounded-lg p-6 border border-[#1e2028]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-[#f7f8f8]">Doanh thu 6 tháng gần nhất</h2>
          </div>
          <RevenueChart data={stats?.monthlyRevenue} />
        </div>

        <div className="bg-[#0f1117] rounded-lg p-6 border border-[#1e2028]">
          <h2 className="font-bold text-[#f7f8f8] mb-4">Trạng thái đơn hàng</h2>
          <div className="space-y-3">
            {statusEntries.map(({ label, color, count }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#d0d6e0] font-medium">{label}</span>
                  <span className="text-[#8a8f98] font-bold">{count} đơn</span>
                </div>
                <div className="h-1.5 bg-[#0a0b0f] rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top services + Top helpers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0f1117] rounded-lg p-6 border border-[#1e2028]">
          <h2 className="font-bold text-[#f7f8f8] mb-4">Dịch vụ phổ biến nhất</h2>
          {stats?.topServices?.length > 0 ? (
            <div className="space-y-3">
              {stats.topServices.map((s, i) => {
                const max = stats.topServices[0].bookingCount || 1;
                const pct = (s.bookingCount / max) * 100;
                return (
                  <div key={s.serviceName}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#d0d6e0] font-medium">
                        <span className="text-[#62666d] mr-2">{i + 1}.</span>{s.serviceName}
                      </span>
                      <span className="text-[#828fff] font-bold">{s.bookingCount} đơn</span>
                    </div>
                    <div className="h-1.5 bg-[#0a0b0f] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#5e6ad2] to-[#828fff] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#62666d] text-sm">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="bg-[#0f1117] rounded-lg p-6 border border-[#1e2028]">
          <h2 className="font-bold text-[#f7f8f8] mb-4">Top người giúp việc</h2>
          {stats?.topHelpers?.length > 0 ? (
            <div className="space-y-3">
              {stats.topHelpers.map((h, i) => (
                <div key={h.helperId} className="flex items-center gap-3">
                  <span className="text-[#62666d] text-sm w-4 shrink-0">{i + 1}.</span>
                  <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#d0d6e0] truncate">{h.fullName}</p>
                    <p className="text-xs text-[#62666d]">
                      ★ {Number(h.ratingAverage || 0).toFixed(1)} · {h.totalBookings} đơn
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#62666d] text-sm">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Pending helpers */}
      <div className="bg-[#0f1117] rounded-lg border border-[#1e2028] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e2028] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#f7f8f8]">Người giúp việc chờ xét duyệt</h2>
            <p className="text-sm text-[#62666d] mt-0.5">{pendingHelpers.length} hồ sơ đang chờ</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingHelpers.length > 0 && (
              <span className="bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 text-xs font-bold px-3 py-1 rounded">
                {pendingHelpers.length} mới
              </span>
            )}
            <Link to="/admin/helpers" className="text-[#828fff] text-sm font-semibold hover:text-[#f7f8f8] transition-colors">
              Xem tất cả →
            </Link>
          </div>
        </div>

        {pendingHelpers.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-emerald-400/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-[#8a8f98] font-medium">Tất cả hồ sơ đã được xét duyệt!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2028]">
            {pendingHelpers.slice(0, 5).map((h) => (
              <div key={h.userId} className="px-6 py-4 flex items-center justify-between hover:bg-[#131418] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="lg" />
                  <div>
                    <p className="font-semibold text-[#d0d6e0] text-sm">{h.fullName}</p>
                    <p className="text-xs text-[#62666d]">{h.email} · {h.phone}</p>
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
