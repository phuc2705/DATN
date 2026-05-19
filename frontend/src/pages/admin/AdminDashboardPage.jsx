import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStatsApi, verifyHelperApi, getAdminUsersApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import { User, Sparkles, ClipboardList, Banknote, RefreshCw, CheckCircle } from 'lucide-react';

const MONTH_LABEL = { '01':'T1','02':'T2','03':'T3','04':'T4','05':'T5','06':'T6','07':'T7','08':'T8','09':'T9','10':'T10','11':'T11','12':'T12' };

function RevenueChart({ data }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-sm py-8 text-center">Chưa có dữ liệu doanh thu</p>;
  const max = Math.max(...data.map((d) => Number(d.revenue)), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d) => {
        const pct = (Number(d.revenue) / max) * 100;
        const [, mon] = d.month.split('-');
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400 whitespace-nowrap">{pct > 5 ? formatPrice(d.revenue).replace('₫','').trim() : ''}</span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-orange-400 transition-all"
              style={{ height: `${Math.max(pct, 4)}%` }}
              title={`${formatPrice(d.revenue)}`}
            />
            <span className="text-xs text-gray-500">{MONTH_LABEL[mon]}</span>
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
    { label: 'Khách hàng',     value: stats?.totalCustomers ?? '—',   Icon: User,         gradient: 'from-blue-500 to-blue-600',   sub: `+${stats?.newCustomersThisMonth ?? 0} tháng này` },
    { label: 'Người giúp việc',value: stats?.totalHelpers ?? '—',     Icon: Sparkles,     gradient: 'from-green-500 to-green-600', sub: `${pendingHelpers.length} chờ xét duyệt` },
    { label: 'Đơn hàng',       value: stats?.totalBookings ?? '—',    Icon: ClipboardList, gradient: 'from-yellow-500 to-yellow-600',sub: `Tỷ lệ hủy ${stats?.cancelRate ?? 0}%` },
    { label: 'Doanh thu',      value: stats?.totalRevenue != null ? formatPrice(stats.totalRevenue) : '—', Icon: Banknote, gradient: 'from-orange-500 to-orange-600', sub: growthSign ? `Tháng này ${growthSign} so với tháng trước` : 'Từ đơn hoàn thành' },
  ];

  const STATUS_META = {
    pending:     { label: 'Chờ xác nhận', color: 'bg-yellow-400' },
    confirmed:   { label: 'Đã xác nhận',  color: 'bg-blue-400' },
    in_progress: { label: 'Đang làm',     color: 'bg-indigo-400' },
    completed:   { label: 'Hoàn thành',   color: 'bg-green-500' },
    cancelled:   { label: 'Đã hủy',       color: 'bg-red-400' },
  };
  const statusEntries = Object.entries(STATUS_META).map(([key, meta]) => ({
    ...meta, count: stats?.bookingsByStatus?.[key] || 0,
  }));
  const maxStatusCount = Math.max(...statusEntries.map(s => s.count), 1);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống CleanConnect</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, Icon, gradient, sub }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900 leading-tight">{value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* So sánh doanh thu tháng + giá trị TB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-1">Doanh thu tháng này</p>
          <p className="text-xl font-extrabold text-gray-900">{formatPrice(stats?.revenueThisMonth ?? 0)}</p>
          {growthSign && (
            <p className={`text-xs font-semibold mt-1 ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {growthSign} so với tháng trước
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-1">Doanh thu tháng trước</p>
          <p className="text-xl font-extrabold text-gray-900">{formatPrice(stats?.revenueLastMonth ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Đã thanh toán</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-1">Giá trị đơn trung bình</p>
          <p className="text-xl font-extrabold text-gray-900">{formatPrice(stats?.avgBookingValue ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Không tính đơn hủy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">Doanh thu 6 tháng gần nhất</h2>
          </div>
          <RevenueChart data={stats?.monthlyRevenue} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
          <div className="space-y-3">
            {statusEntries.map(({ label, color, count }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <span className="text-gray-600 font-bold">{count} đơn</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                      <span className="text-orange-600 font-bold">{s.bookingCount} đơn</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Top người giúp việc</h2>
          {stats?.topHelpers?.length > 0 ? (
            <div className="space-y-3">
              {stats.topHelpers.map((h, i) => (
                <div key={h.helperId} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-4 shrink-0">{i + 1}.</span>
                  <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{h.fullName}</p>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Người giúp việc chờ xét duyệt</h2>
            <p className="text-sm text-gray-400 mt-0.5">{pendingHelpers.length} hồ sơ đang chờ</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingHelpers.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                {pendingHelpers.length} mới
              </span>
            )}
            <Link to="/admin/helpers" className="text-orange-500 text-sm font-semibold hover:text-orange-600">
              Xem tất cả →
            </Link>
          </div>
        </div>

        {pendingHelpers.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-500 font-medium">Tất cả hồ sơ đã được xét duyệt!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingHelpers.slice(0, 5).map((h) => (
              <div key={h.userId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{h.fullName}</p>
                    <p className="text-xs text-gray-400">{h.email} · {h.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleVerify(h.helperId)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
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
