import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Bell, Menu, X, ChevronDown, User, LogOut, LogIn, UserPlus,
  Home, ClipboardList, Briefcase, Wallet, LayoutDashboard,
} from 'lucide-react';

function BellIcon({ unread }) {
  return (
    <Link to="/notifications" className="relative p-2 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200">
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold text-[10px] leading-none">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
        active
          ? 'text-orange-600 bg-orange-50'
          : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
      }`}
    >
      {children}
    </Link>
  );
}

function UserAvatar({ name, avatarUrl }) {
  const validUrl = avatarUrl && !avatarUrl.includes('placeholder.com') ? avatarUrl : null;
  if (validUrl) {
    return <img src={validUrl} alt={name} className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />;
  }
  const initials = name?.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
      {initials}
    </div>
  );
}

function MobileLink({ to, icon: Icon, children, onClick, badge }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors"
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{badge}</span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const closeAll = () => { setMenuOpen(false); setMobileOpen(false); };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0" onClick={closeAll}>
            <img src="/logo.png" alt="ConnectClean" className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity" />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {!user && (
              <>
                <NavLink to="/">Dịch vụ</NavLink>
                <NavLink to="/login">Đăng nhập</NavLink>
                <Link to="/register/customer" className="ml-2 btn-primary text-sm px-4 py-2">
                  Đăng ký miễn phí
                </Link>
              </>
            )}

            {user?.userType === 'customer' && (
              <>
                <NavLink to="/">Dịch vụ</NavLink>
                <NavLink to="/bookings">Lịch đặt của tôi</NavLink>
              </>
            )}

            {user?.userType === 'helper' && (
              <>
                <NavLink to="/helper/jobs">Công việc</NavLink>
                <NavLink to="/helper/earnings">Thu nhập</NavLink>
              </>
            )}

            {user?.userType === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <BellIcon unread={unreadCount} />

                {/* Desktop user menu */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} />
                    <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {user.fullName}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fadeIn z-50">
                        <div className="px-4 py-3 border-b border-gray-50">
                          <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium capitalize">
                            {user.userType === 'customer' ? 'Khách hàng' : user.userType === 'helper' ? 'Người giúp việc' : 'Admin'}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Hồ sơ cá nhân
                          </Link>
                          <Link
                            to="/notifications"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          >
                            <Bell className="w-4 h-4" />
                            Thông báo
                            {unreadCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                        </div>

                        <div className="border-t border-gray-50 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden md:block text-sm font-medium text-gray-600 px-3 py-2 hover:text-orange-600 transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register/customer" className="btn-primary text-sm px-4 py-2">
                  Đăng ký
                </Link>
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-16 left-0 right-0 bg-white z-50 md:hidden shadow-xl border-b border-gray-100 animate-slideUp">
            <div className="p-4 space-y-1">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-3">
                  <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}

              {!user && (
                <>
                  <MobileLink to="/" icon={Home} onClick={closeAll}>Trang chủ</MobileLink>
                  <MobileLink to="/login" icon={LogIn} onClick={closeAll}>Đăng nhập</MobileLink>
                  <Link to="/register/customer" onClick={closeAll}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-orange-600 bg-orange-50 rounded-xl">
                    <UserPlus className="w-4 h-4 shrink-0" />
                    Đăng ký khách hàng
                  </Link>
                  <MobileLink to="/register/helper" icon={Briefcase} onClick={closeAll}>Đăng ký người giúp việc</MobileLink>
                </>
              )}

              {user?.userType === 'customer' && (
                <>
                  <MobileLink to="/" icon={Home} onClick={closeAll}>Dịch vụ</MobileLink>
                  <MobileLink to="/bookings" icon={ClipboardList} onClick={closeAll}>Lịch đặt của tôi</MobileLink>
                  <MobileLink to="/profile" icon={User} onClick={closeAll}>Hồ sơ cá nhân</MobileLink>
                </>
              )}

              {user?.userType === 'helper' && (
                <>
                  <MobileLink to="/helper/jobs" icon={Briefcase} onClick={closeAll}>Công việc</MobileLink>
                  <MobileLink to="/helper/earnings" icon={Wallet} onClick={closeAll}>Thu nhập</MobileLink>
                  <MobileLink to="/profile" icon={User} onClick={closeAll}>Hồ sơ cá nhân</MobileLink>
                </>
              )}

              {user && (
                <>
                  <MobileLink to="/notifications" icon={Bell} onClick={closeAll} badge={unreadCount}>
                    Thông báo
                  </MobileLink>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-1">
                    <LogOut className="w-4 h-4 shrink-0" />
                    Đăng xuất
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
