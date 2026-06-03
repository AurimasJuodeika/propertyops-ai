import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, FileText, Users, User, ClipboardCheck,
  ShieldCheck, Wrench, PoundSterling, HardHat, BarChart3, CheckSquare,
  Settings, Bell, Search, ChevronDown, Zap, LogOut, ChevronRight,
  AlertTriangle, Menu, X
} from 'lucide-react'
import { AGENCY, TASKS } from '../data/mockData'
import NotificationsPanel from './NotificationsPanel'
import GlobalSearch from './GlobalSearch'
import { useTheme, useThemeColors } from '../context/ThemeContext'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Portfolio',
    items: [
      { to: '/properties',  icon: Building2,    label: 'Properties' },
      { to: '/tenancies',   icon: FileText,     label: 'Tenancies' },
      { to: '/landlords',   icon: Users,        label: 'Landlords' },
      { to: '/tenants',     icon: User,         label: 'Tenants' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/inspections', icon: ClipboardCheck, label: 'Inspections' },
      { to: '/maintenance', icon: Wrench,         label: 'Maintenance' },
      { to: '/contractors', icon: HardHat,        label: 'Contractors' },
    ],
  },
  {
    label: 'Finance',
    items: [{ to: '/rent-arrears', icon: PoundSterling, label: 'Rent & Arrears' }],
  },
  {
    label: 'Compliance',
    items: [{ to: '/compliance', icon: ShieldCheck, label: 'Compliance Centre' }],
  },
  {
    label: 'Management',
    items: [
      { to: '/reports',  icon: BarChart3,   label: 'Reports & Analytics' },
      { to: '/tasks',    icon: CheckSquare, label: 'Tasks & Workflows' },
      { to: '/settings', icon: Settings,    label: 'Settings' },
    ],
  },
]

// Bottom nav items (mobile only) — 5 most important
const BOTTOM_NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Home' },
  { to: '/properties',  icon: Building2,       label: 'Properties' },
  { to: '/maintenance', icon: Wrench,          label: 'Jobs' },
  { to: '/compliance',  icon: ShieldCheck,     label: 'Compliance' },
  { to: '/tasks',       icon: CheckSquare,     label: 'Tasks' },
]

const criticalTasks = TASKS.filter(t => t.status === 'overdue').length
const TOTAL_UNREAD  = 7

export default function Layout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch]           = useState(false)
  const { isDark, toggle: toggleTheme }       = useTheme()
  const t = useThemeColors()
  const location = useLocation()
  const navigate = useNavigate()

  const pageName = NAV_GROUPS.flatMap(g => g.items).find(i => i.to === location.pathname)?.label || 'Dashboard'

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const initial = (user?.name || 'A')[0].toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bgPage, transition: 'background 0.18s ease' }}>

      {/* ── Mobile backdrop ─────────────────────────── */}
      {sidebarOpen && (
        <div
          className="mobile-backdrop visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className={`sidebar${sidebarOpen ? ' open' : ''}`}
        style={{
          width: 240, background: '#0f172a',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0, position: 'fixed',
          top: 0, left: 0, bottom: 0, zIndex: 40,
          overflowY: 'auto',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Mobile close btn */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ display: 'none', position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}
            className="mobile-close-btn"
          >
            <X size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.4)', flexShrink: 0 }}>
              <Zap size={16} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: '-0.2px' }}>PropertyOps AI</div>
              <div style={{ color: '#64748b', fontSize: 10.5, fontWeight: 500 }}>{AGENCY.name}</div>
            </div>
          </div>

          {/* Branch selector */}
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#94a3b8', fontSize: 12.5, fontFamily: 'inherit' }}>
            <span style={{ fontWeight: 500 }}>All Branches</span>
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Alert badge */}
        {criticalTasks > 0 && (
          <div style={{ margin: '12px 12px 0', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} color="#f87171" />
            <span style={{ color: '#f87171', fontSize: 11.5, fontWeight: 600 }}>{criticalTasks} overdue tasks require action</span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151' }}>
                {group.label}
              </div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={15} />
                  {item.label}
                  {item.to === '/tasks' && criticalTasks > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>
                      {criticalTasks}
                    </span>
                  )}
                  {item.to === '/compliance' && (
                    <span style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>4</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#e2e8f0', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Sarah Mitchell'}</div>
              <div style={{ color: '#475569', fontSize: 10.5 }}>{user?.role || 'Agency Owner'}</div>
            </div>
            <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LogOut size={13} color="#475569" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────── */}
      <div className="main-content" style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: 56, background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          position: 'sticky', top: 0, zIndex: 30,
          boxShadow: t.headerShadow, transition: 'background 0.18s ease, border-color 0.18s ease',
        }}>
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="hamburger-btn"
            style={{ display: 'none', width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <Menu size={18} color="#374151" />
          </button>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>PropertyOps</span>
          </div>

          {/* Breadcrumb (desktop) */}
          <div className="breadcrumb" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: '#64748b' }}>{AGENCY.name}</span>
              <ChevronRight size={12} style={{ display: 'inline', margin: '0 4px', verticalAlign: 'middle' }} />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{pageName}</span>
            </span>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: t.bgInput, border: `1px solid ${t.border}`,
              borderRadius: 8, padding: '7px 12px',
              cursor: 'pointer', fontFamily: 'inherit',
              width: 220, flexShrink: 0, transition: 'background 0.18s',
            }}
          >
            <Search size={14} color={t.textMuted} />
            <span className="search-text" style={{ fontSize: 13, color: t.textMuted, flex: 1, textAlign: 'left' }}>Search anything…</span>
            <kbd className="search-text" style={{ background: t.border, border: 'none', borderRadius: 4, padding: '1px 5px', fontSize: 10.5, color: t.textMuted, fontFamily: 'inherit' }}>⌘K</kbd>
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: showNotifications ? '#0f172a' : '#f8fafc',
                border: `1px solid ${showNotifications ? '#0f172a' : '#e2e8f0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Bell size={16} color={showNotifications ? 'white' : '#64748b'} />
            </button>
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, background: '#dc2626', borderRadius: '50%',
              fontSize: 9, fontWeight: 800, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white', pointerEvents: 'none',
            }}>{TOTAL_UNREAD}</span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: isDark ? '#1e2d42' : '#f1f5f9',
              border: `1px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, transition: 'all 0.18s',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* AI badge (desktop only) */}
          <div className="ai-badge" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 10px', flexShrink: 0 }}>
            <Zap size={12} color="#10b981" />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669' }}>AI Active</span>
          </div>
        </header>

        {/* Page content */}
        <main
          className="page-content"
          style={{ flex: 1, padding: '24px', overflowY: 'auto', maxWidth: 1400, background: t.bgPage, transition: 'background 0.18s ease' }}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav (mobile only) ─────────────────── */}
      <nav
        className="bottom-nav"
        style={{
          display: 'none', // shown via CSS on mobile
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 35,
          background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          height: 64,
        }}
      >
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, textDecoration: 'none', padding: '8px 4px', position: 'relative' }}
            className={({ isActive }) => isActive ? 'bottom-nav-active' : ''}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: '#10b981', borderRadius: 2 }} />
                )}
                <Icon size={20} color={isActive ? '#10b981' : 'rgba(148,163,184,0.5)'} />
                <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? '#10b981' : 'rgba(148,163,184,0.5)' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Overlays ─────────────────────────────────── */}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* ── CSS patches ──────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; z-index: 40; transition: transform 0.25s ease; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; }
          .hamburger-btn { display: flex !important; }
          .mobile-logo { display: flex !important; }
          .breadcrumb { display: none !important; }
          .ai-badge { display: none !important; }
          .search-text { display: none !important; }
          .bottom-nav { display: flex !important; }
          .page-content { padding-bottom: 80px !important; }
          .mobile-close-btn { display: flex !important; }
          /* Search button shrinks to icon only */
          button[style*="width: 220px"] { width: 36px !important; padding: 7px !important; }
        }
        @media (max-width: 480px) {
          .page-content { padding: 14px !important; padding-bottom: 80px !important; }
        }
        /* Sidebar open state applied via JS class */
        .sidebar-open .sidebar { transform: translateX(0) !important; }
      `}</style>
    </div>
  )
}
