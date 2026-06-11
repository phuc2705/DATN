/* eslint-disable react-refresh/only-export-components */
// Quản lý trạng thái xác thực toàn cục (user, token, socket)
import { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, getMeApi, firebaseLoginApi } from '../api/auth.api';
import { connectSocket, disconnectSocket } from '../socket/socket';
import { getNotificationsApi } from '../api/notification.api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

const NOTIF_ICONS = {
  booking_created:   '◆', booking_confirmed: '✓', booking_cancelled: '✕',
  checkin:           '▸', checkout:          '■', payment_received:  '$', review_received: '★',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('accessToken'));
  const [unreadCount, setUnreadCount] = useState(0);

  // Lấy số thông báo chưa đọc ban đầu
  useEffect(() => {
    if (!user) return;
    getNotificationsApi({ limit: 1 })
      .then(({ data }) => setUnreadCount(data.data?.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  // Kết nối socket và lắng nghe thông báo khi user đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    const socket = connectSocket(token);

    socket.on('notification', (data) => {
      const icon = NOTIF_ICONS[data.type] || '🔔';
      const BOOKING_TYPES = ['booking_confirmed', 'booking_cancelled', 'checkin', 'checkout', 'new_job', 'booking_created'];
      if (data.ref_id && BOOKING_TYPES.includes(data.type)) {
        toast(
          (t) => (
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => { toast.dismiss(t.id); window.location.href = `/bookings/${data.ref_id}`; }}
            >
              {icon} {data.title}
              <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: 2 }}>Nhấn để xem đơn</span>
            </span>
          ),
          { duration: 6000 }
        );
      } else {
        toast(`${icon} ${data.title}`, { duration: 4000 });
      }
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.off('notification');
    };
  }, [user]);

  // Khôi phục session từ localStorage khi load trang
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    getMeApi()
      .then(({ data }) => setUser(data.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginApi({ email, password });
    const { accessToken, refreshToken, user: userData } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    connectSocket(accessToken);
    return userData;
  }, []);

  const loginWithFirebase = useCallback(async (idToken) => {
    const { data } = await firebaseLoginApi({ idToken });
    const { accessToken, refreshToken, user: userData } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    connectSocket(accessToken);
    return userData;
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.clear();
    setUser(null);
    setUnreadCount(0);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithFirebase, logout, setUser, unreadCount, setUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
}
