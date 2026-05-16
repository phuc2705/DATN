import { useEffect, useState } from 'react';
import { getNotificationsApi, markAllReadApi, markOneReadApi } from '../../api/notification.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  booking_new:       { icon: '🆕', label: 'Việc mới',   bg: 'bg-orange-100', text: 'text-orange-700' },
  booking_created:   { icon: '📋', label: 'Đơn mới',    bg: 'bg-orange-100', text: 'text-orange-700' },
  booking_confirmed: { icon: '✅', label: 'Xác nhận',   bg: 'bg-green-100',  text: 'text-green-700'  },
  booking_cancelled: { icon: '❌', label: 'Hủy đơn',    bg: 'bg-red-100',    text: 'text-red-700'    },
  checkin:           { icon: '📍', label: 'Check-in',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  checkout:          { icon: '🏁', label: 'Check-out',  bg: 'bg-indigo-100', text: 'text-indigo-700' },
  payment_received:  { icon: '💰', label: 'Thanh toán', bg: 'bg-green-100',  text: 'text-green-700'  },
  payment_success:   { icon: '💰', label: 'Thanh toán', bg: 'bg-green-100',  text: 'text-green-700'  },
  new_review:        { icon: '⭐', label: 'Đánh giá',   bg: 'bg-yellow-100', text: 'text-yellow-700' },
  review_received:   { icon: '⭐', label: 'Đánh giá',   bg: 'bg-yellow-100', text: 'text-yellow-700' },
  default:           { icon: '🔔', label: 'Thông báo',  bg: 'bg-gray-100',   text: 'text-gray-700'   },
};

export default function NotificationsPage() {
  const { setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getNotificationsApi({ limit: 50 })
      .then(({ data }) => {
        setNotifications(data.data?.notifications || []);
        setUnread(data.data?.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleMarkAll = async () => {
    try {
      await markAllReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
      setUnreadCount(0);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await markOneReadApi(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnread(c => Math.max(0, c - 1));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const unreadList = notifications.filter(n => !n.is_read);
  const readList   = notifications.filter(n => n.is_read);

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          {unread > 0 && (
            <p className="text-sm text-orange-500 font-medium mt-0.5">
              {unread} thông báo chưa đọc
            </p>
          )}
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll}
            className="text-sm text-orange-500 border border-orange-200 px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors font-medium">
            Đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔔</div>
          <p className="text-gray-700 font-semibold mb-1">Chưa có thông báo nào</p>
          <p className="text-gray-400 text-sm">Các cập nhật về đơn hàng sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chưa đọc */}
          {unreadList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chưa đọc</p>
              <div className="space-y-2">
                {unreadList.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                  return (
                    <div key={n.notification_id} onClick={() => n.notification_id && handleMarkOne(n.notification_id)}
                      className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl cursor-pointer hover:bg-orange-100 transition-colors group">
                      <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                        {n.message && <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>}
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                      </div>
                      <button className="text-xs text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-1" title="Đánh dấu đã đọc">
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Đã đọc */}
          {readList.length > 0 && (
            <div>
              {unreadList.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Đã đọc</p>
              )}
              <div className="space-y-2">
                {readList.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                  return (
                    <div key={n.notification_id}
                      className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl opacity-70 hover:opacity-100 transition-opacity">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-gray-400">{cfg.label}</span>
                        <p className="text-sm text-gray-600 font-medium mt-0.5">{n.title}</p>
                        {n.message && <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>}
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
