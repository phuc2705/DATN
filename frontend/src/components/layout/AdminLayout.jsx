// Layout shell cho toàn bộ trang admin — Linear dark theme
// Canvas: #010102 | Surface-1: #0f1117 | Surface-2: #1e2028
// Primary: #5e6ad2 | Hairline: #23252a | Ink: #f7f8f8
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Briefcase, ClipboardList,
  CreditCard, Layers, Tag, ExternalLink, LogOut, Menu, X,
} from 'lucide-react';

const NAV = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/helpers', label: 'Người giúp việc', icon: Briefcase },
  { to: '/admin/bookings', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/payments', label: 'Thanh toán', icon: CreditCard },
  { to: '/admin/services', label: 'Dịch vụ', icon: Layers },
  { to: '/admin/promotions', label: 'Khuyến mãi', icon: Tag },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#010102' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-30 w-64 flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ backgroundColor: '#0f1117', borderRight: '1px solid #23252a' }}
      >
        {/* Logo */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid #23252a' }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CleanConnect"
              className="h-8 w-auto object-contain brightness-0 invert opacity-90"
            />
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: '#62666d' }}
            >
              Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md transition-colors"
            style={{ color: '#8a8f98' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'active-nav' : 'inactive-nav'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: 'rgba(94,106,210,0.15)', color: '#828fff' }
                  : { color: '#8a8f98' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? '#828fff' : '#62666d' }}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Switch to main site */}
        <div className="px-3 pb-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#1e2028';
              e.currentTarget.style.color = '#f7f8f8';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8a8f98';
            }}
          >
            <ExternalLink className="w-4 h-4 shrink-0" style={{ color: '#62666d' }} />
            Xem trang chính
          </a>
        </div>

        {/* User info + logout */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #23252a' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: '#5e6ad2', color: '#fff' }}
            >
              {user?.fullName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#f7f8f8' }}>
                {user?.fullName || 'Admin'}
              </p>
              <p className="text-xs truncate" style={{ color: '#62666d' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8a8f98';
            }}
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 lg:ml-64 min-h-screen flex flex-col"
        style={{ backgroundColor: '#010102' }}
      >
        {/* Mobile topbar */}
        <div
          className="lg:hidden sticky top-0 z-10 px-4 h-14 flex items-center gap-3"
          style={{
            backgroundColor: '#0f1117',
            borderBottom: '1px solid #23252a',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#8a8f98' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src="/logo.png"
            alt="Admin"
            className="h-7 w-auto brightness-0 invert opacity-90"
          />
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
