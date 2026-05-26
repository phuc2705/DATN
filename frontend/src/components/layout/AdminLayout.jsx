// Layout shell cho toàn bộ trang admin — Linear dark theme (inline styles)
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Briefcase, ClipboardList,
  CreditCard, Layers, Tag, Star, Settings, ExternalLink, LogOut, Menu, X, MessageSquare,
} from 'lucide-react';

// Design tokens
const C = {
  canvas:   '#010102',
  surface1: '#0f1117',
  surface2: '#1e2028',
  hairline: '#23252a',
  primary:  '#5e6ad2',
  primary2: '#828fff',
  ink:      '#f7f8f8',
  muted:    '#8a8f98',
  dim:      '#62666d',
};

const NAV = [
  { to: '/admin',            end: true,  label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/admin/users',      end: false, label: 'Người dùng',       icon: Users },
  { to: '/admin/helpers',    end: false, label: 'Người giúp việc',  icon: Briefcase },
  { to: '/admin/bookings',   end: false, label: 'Đơn hàng',         icon: ClipboardList },
  { to: '/admin/payments',   end: false, label: 'Thanh toán',       icon: CreditCard },
  { to: '/admin/services',   end: false, label: 'Dịch vụ',          icon: Layers },
  { to: '/admin/promotions', end: false, label: 'Khuyến mãi',       icon: Tag },
  { to: '/admin/reviews',   end: false, label: 'Đánh giá',  icon: Star },
  { to: '/admin/feedbacks', end: false, label: 'Phản hồi',  icon: MessageSquare },
  { to: '/admin/settings',  end: false, label: 'Cài đặt',   icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoverItem, setHoverItem] = useState(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: C.canvas }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 20 }}
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 30,
          width: 256, display: 'flex', flexDirection: 'column',
          backgroundColor: C.surface1,
          borderRight: `1px solid ${C.hairline}`,
          transition: 'transform 0.3s',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" alt="CleanConnect" style={{ height: 40, borderRadius: 10, opacity: 0.95 }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>CleanConnect</span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.dim }}>Admin</span>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => isActive ? '__nav-active' : ''}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.15s',
                backgroundColor: isActive ? 'rgba(94,106,210,0.15)' : (hoverItem === to ? C.surface2 : 'transparent'),
                color: isActive ? C.primary2 : (hoverItem === to ? C.ink : C.muted),
              })}
              onMouseEnter={() => setHoverItem(to)}
              onMouseLeave={() => setHoverItem(null)}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Xem trang chính */}
        <div style={{ padding: '0 12px 8px' }}>
          <a
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
              color: C.muted, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surface2; e.currentTarget.style.color = C.ink; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; }}
          >
            <ExternalLink size={16} style={{ color: C.dim, flexShrink: 0 }} />
            Xem trang chính
          </a>
        </div>

        {/* User + Logout */}
        <div style={{ padding: '16px', borderTop: `1px solid ${C.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {user?.fullName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || 'Admin'}</p>
              <p style={{ fontSize: 12, color: C.dim, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 14, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; }}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main
        className="flex-1 lg:ml-64"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.canvas }}
      >
        {/* Mobile topbar */}
        <div
          className="lg:hidden"
          style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: C.surface1, borderBottom: `1px solid ${C.hairline}`, padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ padding: 8, borderRadius: 8, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Menu size={20} />
          </button>
          <img src="/logo.png" alt="CleanConnect" style={{ height: 36, borderRadius: 8, opacity: 0.95 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>CleanConnect</span>
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
