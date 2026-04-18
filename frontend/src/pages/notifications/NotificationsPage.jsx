import { useEffect, useState } from 'react';
import { getNotificationsApi, markAllReadApi, markOneReadApi } from '../../api/notification.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

// Map loại thông báo sang icon và màu
const TYPE_CONFIG = {
  booking_created:   { icon: '📋', label: 'Đơn mới' },
  booking_confirmed: { icon: '✅', label: 'Xác nhận' },
  booking_cancelled: { icon: '❌', label: 'Hủy đơn' },
  checkin:           { icon: '📍', label: 'Check-in' },
  checkout:          { icon: '🏁', label: 'Check-out' },
  payment_received:  { icon: '💰', label: 'Thanh toán' },
  review_received:   { icon: '⭐', label: 'Đánh giá' },
  default:           { icon: '🔔', label: 'Thông báo' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getNotificationsApi({ limit: 50 })
      .then(({ data }) => {
        setNotifications(data.data?.notifications || []);
        setUnreadCount(data.data?.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleMarkAll = async () => {
    try {
      await markAllReadApi();
      toast.success('Đã đánh dấu tất cả là đã đọc');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await markOneReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thông báo</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-primary-600 mt-0.5">{unreadCount} thông báo chưa đọc</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-sm text-primary-600 hover:text-primary-700 border border-primary-300 px-3 py-1.5 rounded-lg"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔔</div>
          <p>Chưa có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
            return (
              <div
                key={n.notification_id}
                onClick={() => !n.is_read && handleMarkOne(n.notification_id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer ${
                  n.is_read
                    ? 'bg-white border-gray-100 text-gray-500'
                    : 'bg-primary-50 border-primary-200 text-gray-800 hover:bg-primary-100'
                }`}
              >
                <div className="text-2xl mt-0.5 select-none">{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                      {cfg.label}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" />
                    )}
                  </div>
                  <p className="text-sm mt-1 font-medium">{n.title}</p>
                  {n.message && <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
