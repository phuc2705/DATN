import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotificationsApi, markAllReadApi, markOneReadApi } from '../../api/notification.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, Check,
  ShoppingBag, ClipboardCheck, XCircle,
  MapPin, Flag, Wallet, Star, Megaphone, MessageSquare,
} from 'lucide-react';

/* ─── Notification type config (lucide icons replacing emojis) ───── */
const TYPE_CONFIG = {
  booking_new: {
    Icon:  ShoppingBag,
    label: 'Việc mới',
    iconBg:    'bg-orange-50',
    iconColor: 'text-orange-500',
    badgeBg:   'bg-orange-50 text-orange-700 border-orange-100',
  },
  booking_created: {
    Icon:  ShoppingBag,
    label: 'Đơn mới',
    iconBg:    'bg-orange-50',
    iconColor: 'text-orange-500',
    badgeBg:   'bg-orange-50 text-orange-700 border-orange-100',
  },
  booking_confirmed: {
    Icon:  ClipboardCheck,
    label: 'Xác nhận',
    iconBg:    'bg-green-50',
    iconColor: 'text-green-600',
    badgeBg:   'bg-green-50 text-green-700 border-green-100',
  },
  booking_cancelled: {
    Icon:  XCircle,
    label: 'Hủy đơn',
    iconBg:    'bg-red-50',
    iconColor: 'text-red-500',
    badgeBg:   'bg-red-50 text-red-700 border-red-100',
  },
  checkin: {
    Icon:  MapPin,
    label: 'Check-in',
    iconBg:    'bg-blue-50',
    iconColor: 'text-blue-500',
    badgeBg:   'bg-blue-50 text-blue-700 border-blue-100',
  },
  checkout: {
    Icon:  Flag,
    label: 'Check-out',
    iconBg:    'bg-indigo-50',
    iconColor: 'text-indigo-500',
    badgeBg:   'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  payment_received: {
    Icon:  Wallet,
    label: 'Thanh toán',
    iconBg:    'bg-green-50',
    iconColor: 'text-green-600',
    badgeBg:   'bg-green-50 text-green-700 border-green-100',
  },
  payment_success: {
    Icon:  Wallet,
    label: 'Thanh toán',
    iconBg:    'bg-green-50',
    iconColor: 'text-green-600',
    badgeBg:   'bg-green-50 text-green-700 border-green-100',
  },
  new_review: {
    Icon:  Star,
    label: 'Đánh giá',
    iconBg:    'bg-yellow-50',
    iconColor: 'text-yellow-500',
    badgeBg:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  },
  review_received: {
    Icon:  Star,
    label: 'Đánh giá',
    iconBg:    'bg-yellow-50',
    iconColor: 'text-yellow-500',
    badgeBg:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  },
  feedback_replied: {
    Icon:  MessageSquare,
    label: 'Phản hồi',
    iconBg:    'bg-blue-50',
    iconColor: 'text-blue-500',
    badgeBg:   'bg-blue-50 text-blue-700 border-blue-100',
    linkTo:    '/profile?tab=feedbacks',
  },
  default: {
    Icon:  Megaphone,
    label: 'Thông báo',
    iconBg:    'bg-gray-50',
    iconColor: 'text-gray-500',
    badgeBg:   'bg-gray-50 text-gray-600 border-gray-200',
  },
};

/* ─── Single notification row ────────────────────────────────────── */
function NotificationItem({ n, onMarkRead, isUnread }) {
  const navigate = useNavigate();
  const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
  const Icon = cfg.Icon;

  const BOOKING_TYPES = ['booking_confirmed', 'booking_cancelled', 'checkin', 'checkout', 'new_job', 'booking_created'];
  const handleClick = () => {
    if (isUnread && n.notification_id) onMarkRead(n.notification_id);
    if (cfg.linkTo) { navigate(cfg.linkTo); return; }
    if (n.ref_id && BOOKING_TYPES.includes(n.type)) {
      navigate(`/bookings/${n.ref_id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all group ${
        isUnread || cfg.linkTo || (n.ref_id && ['booking_confirmed','booking_cancelled','checkin','checkout','new_job','booking_created'].includes(n.type))
          ? 'cursor-pointer'
          : ''
      } ${
        isUnread
          ? 'bg-orange-50 border-orange-100 hover:bg-orange-100'
          : 'bg-white border-gray-100 hover:bg-gray-50'
      }`}
    >
      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
          {isUnread && (
            <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
          )}
        </div>

        <p className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
          {n.title}
        </p>
        {n.message && (
          <p className={`text-sm mt-0.5 ${isUnread ? 'text-gray-600' : 'text-gray-400'}`}>
            {n.message}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(n.created_at)}</p>
      </div>

      {/* Mark-read button */}
      {isUnread && n.notification_id && (
        <button
          onClick={(e) => { e.stopPropagation(); onMarkRead(n.notification_id); }}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-orange-200 flex items-center justify-center text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all mt-0.5 opacity-0 group-hover:opacity-100"
          title="Đánh dấu đã đọc"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const { setUnreadCount }               = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(true);

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
      setNotifications(prev =>
        prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
      );
      setUnread(c => Math.max(0, c - 1));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  const unreadList = notifications.filter(n => !n.is_read);
  const readList   = notifications.filter(n => n.is_read);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
            {unread > 0 ? (
              <p className="text-sm text-orange-500 font-medium mt-0.5">
                {unread} thông báo chưa đọc
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-0.5">Tất cả đã đọc</p>
            )}
          </div>

          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white h-9 px-3 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:block">Đọc tất cả</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">Chưa có thông báo nào</p>
            <p className="text-sm text-gray-400">Các cập nhật về đơn hàng sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="space-y-7">

            {/* Chưa đọc */}
            {unreadList.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Chưa đọc
                  </p>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                    {unreadList.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {unreadList.map((n) => (
                    <NotificationItem
                      key={n.notification_id}
                      n={n}
                      onMarkRead={handleMarkOne}
                      isUnread
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Đã đọc */}
            {readList.length > 0 && (
              <section>
                {unreadList.length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Đã đọc
                  </p>
                )}
                <div className="space-y-2">
                  {readList.map((n) => (
                    <NotificationItem
                      key={n.notification_id}
                      n={n}
                      onMarkRead={handleMarkOne}
                      isUnread={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
