// Layout shell cho toàn bộ trang admin — Linear dark theme
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Briefcase, ClipboardList,
  CreditCard, Layers, Tag, ExternalLink, LogOut, Menu, X,
} from 'lucide-react';

const NAV = [
  { to: '/admin',             end: true, label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/admin/users',       end: false, label: 'Người dùng',      icon: Users },
  { to: '/admin/helpers',     end: false, label: 'Người giúp việc', icon: Briefcase },
  { to: '/admin/bookings',    end: false, label: 'Đơn hàng',        icon: ClipboardList },
  { to: '/admin/payments',    end: false, label: 'Thanh toán',       icon: CreditCard },
  { to: '/admin/services',    end: false, label: 'Dịch vụ',         icon: Layers },
  { to: '/admin/promotions',  end: false, label: 'Khuyến mãi',      icon: Tag },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-[#010102]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-30 w-64 flex flex-col transition-transform duration-300
          bg-[#0f1117] border-r border-[#23252a]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#23252a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CleanConnect"
              className="h-8 w-auto object-contain brightness-0 invert opacity-90"
            />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#62666d]">
              Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"
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
                  isActive
                    ? 'bg-[#5e6ad2]/10 text-[#828fff]'
                    : 'text-[#8a8f98] hover:bg-[#1e2028] hover:text-[#f7f8f8]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Xem trang chính */}
        <div className="px-3 pb-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8a8f98] hover:bg-[#1e2028] hover:text-[#f7f8f8] transition-all"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Xem trang chính
          </a>
        </div>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-[#23252a]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#5e6ad2] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#f7f8f8] truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-[#62666d] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8a8f98] hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-[#010102]">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-10 bg-[#0f1117] border-b border-[#23252a] px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#1e2028] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/logo.png" alt="Admin" className="h-7 w-auto brightness-0 invert opacity-90" />
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
