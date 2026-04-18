// Thanh điều hướng — hiển thị links theo role người dùng
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getNotificationsApi } from '../../api/notification.api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Lấy số thông báo chưa đọc mỗi khi user đăng nhập
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    getNotificationsApi({ limit: 1 })
      .then(({ data }) => setUnreadCount(data.data?.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600">
          🏠 GiúpViệc24h
        </Link>

        <div className="flex items-center gap-4">
          {!user && (
            <>
              <Link to="/" className="text-gray-600 hover:text-primary-600 text-sm">Dịch vụ</Link>
              <Link to="/login" className="text-gray-600 hover:text-primary-600 text-sm">Đăng nhập</Link>
              <Link to="/register/customer" className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-600">
                Đăng ký
              </Link>
            </>
          )}

          {user?.userType === 'customer' && (
            <>
              <Link to="/" className="text-gray-600 hover:text-primary-600 text-sm">Dịch vụ</Link>
              <Link to="/bookings" className="text-gray-600 hover:text-primary-600 text-sm">Lịch đặt</Link>
            </>
          )}

          {user?.userType === 'helper' && (
            <>
              <Link to="/helper/jobs" className="text-gray-600 hover:text-primary-600 text-sm">Công việc</Link>
              <Link to="/helper/earnings" className="text-gray-600 hover:text-primary-600 text-sm">Thu nhập</Link>
            </>
          )}

          {user?.userType === 'admin' && (
            <>
              <Link to="/admin" className="text-gray-600 hover:text-primary-600 text-sm">Dashboard</Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-primary-600 text-sm">Người dùng</Link>
              <Link to="/admin/bookings" className="text-gray-600 hover:text-primary-600 text-sm">Đơn hàng</Link>
            </>
          )}

          {user && (
            <div className="flex items-center gap-3">
              {/* Bell icon thông báo */}
              <Link to="/notifications" className="relative text-gray-500 hover:text-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <span className="text-sm text-gray-600">{user.fullName}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 border border-red-300 px-3 py-1 rounded-lg"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
