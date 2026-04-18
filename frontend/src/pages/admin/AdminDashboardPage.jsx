import { useEffect, useState } from 'react';
import { getAdminStatsApi, verifyHelperApi, getAdminUsersApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingHelpers, setPendingHelpers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      getAdminStatsApi(),
      getAdminUsersApi({ userType: 'helper', isVerified: false }),
    ]).then(([{ data: s }, { data: u }]) => {
      setStats(s.data);
      setPendingHelpers(u.data?.users || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleVerify = async (helperId) => {
    try {
      await verifyHelperApi(helperId);
      toast.success('Đã xác minh helper!');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xác minh');
    }
  };

  if (loading) return <LoadingSpinner />;

  const cards = [
    { label: 'Tổng khách hàng', value: stats?.totalCustomers ?? '—', icon: '👤', color: 'bg-blue-50 text-blue-700' },
    { label: 'Tổng người giúp việc', value: stats?.totalHelpers ?? '—', icon: '🧹', color: 'bg-green-50 text-green-700' },
    { label: 'Đơn hôm nay', value: stats?.todayBookings ?? '—', icon: '📋', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Doanh thu tháng', value: stats?.monthlyRevenue != null ? formatPrice(stats.monthlyRevenue) : '—', icon: '💰', color: 'bg-primary-50 text-primary-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Quản trị</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon, color }) => (
          <div key={label} className={`${color} rounded-xl p-5`}>
            <div className="text-3xl mb-2">{icon}</div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-75 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Helpers chờ xác minh */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Người giúp việc chờ xác minh ({pendingHelpers.length})</h2>
        </div>
        {pendingHelpers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Không có hồ sơ nào cần xét duyệt.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingHelpers.map((h) => (
              <div key={h.userId} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{h.fullName}</p>
                  <p className="text-sm text-gray-500">{h.email} · {h.phone}</p>
                </div>
                <button
                  onClick={() => handleVerify(h.helperId)}
                  className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-600"
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
