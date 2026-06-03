import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, AlertTriangle, ShieldCheck, PoundSterling, Wrench,
  ClipboardCheck, FileText, CheckCircle, Clock, Bell,
  ChevronRight, Check, Trash2, Filter
} from 'lucide-react'
import { useThemeColors } from '../context/ThemeContext'

const ALL_NOTIFICATIONS = [
  // Critical compliance
  {
    id: 'n1', group: 'Compliance', severity: 'critical', read: false,
    icon: ShieldCheck, title: 'Gas Safety Certificate EXPIRED',
    body: '22A Upper Street, N1 0PQ — certificate expired 30 Nov 2024. Property cannot be legally re-let.',
    action: 'View Compliance', link: '/compliance', time: '2 minutes ago', timestamp: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'n2', group: 'Compliance', severity: 'critical', read: false,
    icon: ShieldCheck, title: 'EPC Certificate EXPIRED',
    body: '22A Upper Street, N1 0PQ — Grade E certificate expired Dec 2024. Minimum Grade D required to re-let.',
    action: 'View Compliance', link: '/compliance', time: '2 minutes ago', timestamp: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'n3', group: 'Compliance', severity: 'critical', read: false,
    icon: AlertTriangle, title: 'Right to Rent NOT verified',
    body: 'Kwame Mensah — 88 Finchley Road, NW3 5JJ. Civil penalty risk up to £10,000. Immediate action required.',
    action: 'View Tenant', link: '/tenants', time: '15 minutes ago', timestamp: Date.now() - 15 * 60 * 1000,
  },
  {
    id: 'n4', group: 'Compliance', severity: 'critical', read: false,
    icon: ShieldCheck, title: 'EICR Certificate EXPIRED',
    body: '34 St Albans Road, AL1 2QA — expired Oct 2024. Landlord has been notified. Engineer booking required.',
    action: 'View Compliance', link: '/compliance', time: '1 hour ago', timestamp: Date.now() - 60 * 60 * 1000,
  },
  // Warnings
  {
    id: 'n5', group: 'Compliance', severity: 'warning', read: false,
    icon: Clock, title: 'Gas Safety expiring in 28 days',
    body: '14 Caledonian Road, N1 9DT — certificate expires 15 Apr 2025. Book renewal with Capital Gas Services.',
    action: 'Book Renewal', link: '/compliance', time: '3 hours ago', timestamp: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: 'n6', group: 'Compliance', severity: 'warning', read: true,
    icon: Clock, title: 'Gas Safety expiring in 28 days',
    body: '29 Portobello Road, W11 1LU — certificate expires 28 Mar 2025. Book engineer access now.',
    action: 'Book Renewal', link: '/compliance', time: '3 hours ago', timestamp: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: 'n7', group: 'Compliance', severity: 'warning', read: true,
    icon: Clock, title: 'Right to Rent expiring in 48 days',
    body: 'Sofia Ferretti — 45 Holloway Road, N7 8JL. EU Pre-settled status expires 01 Aug 2025. Re-check required.',
    action: 'View Tenant', link: '/tenants', time: '5 hours ago', timestamp: Date.now() - 5 * 60 * 60 * 1000,
  },
  // Arrears
  {
    id: 'n8', group: 'Rent & Arrears', severity: 'critical', read: false,
    icon: PoundSterling, title: '3 months rent arrears — legal threshold',
    body: 'Helen Morris — 34 St Albans Road, AL1 2QA. £5,400 overdue (3 months). Consider Section 8 proceedings.',
    action: 'View Arrears', link: '/rent-arrears', time: '8 hours ago', timestamp: Date.now() - 8 * 60 * 60 * 1000,
  },
  {
    id: 'n9', group: 'Rent & Arrears', severity: 'warning', read: false,
    icon: PoundSterling, title: 'Rent payment missed — 2nd month',
    body: 'Marcus Thompson — 22A Upper Street, N1 0PQ. £3,500 total arrears. Send formal notice.',
    action: 'View Arrears', link: '/rent-arrears', time: '1 day ago', timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    id: 'n10', group: 'Rent & Arrears', severity: 'warning', read: true,
    icon: PoundSterling, title: 'Rent overdue — Kwame Mensah',
    body: '88 Finchley Road, NW3 5JJ. £4,700 arrears (2 months). Tenancy expired — holding over.',
    action: 'View Arrears', link: '/rent-arrears', time: '1 day ago', timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
  // Maintenance
  {
    id: 'n11', group: 'Maintenance', severity: 'critical', read: false,
    icon: Wrench, title: 'Emergency: Electrical fault reported',
    body: '3 Highgate Village, N6 5JT — light fitting sparking in master bedroom. Tenant evacuated area. Electrician assigned.',
    action: 'View Job', link: '/maintenance', time: '2 hours ago', timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'n12', group: 'Maintenance', severity: 'critical', read: true,
    icon: Wrench, title: 'Emergency: Roof leak active',
    body: '34 St Albans Road, AL1 2QA — water ingress through bedroom ceiling. Apex Roofing on site.',
    action: 'View Job', link: '/maintenance', time: '3 days ago', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'n13', group: 'Maintenance', severity: 'warning', read: true,
    icon: Wrench, title: 'Urgent job unassigned — 48hrs',
    body: '23 Watford High Street, WD17 2EW — damp patch on lounge wall. No contractor assigned. Action required.',
    action: 'Assign Contractor', link: '/maintenance', time: '2 days ago', timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  // Inspections
  {
    id: 'n14', group: 'Inspections', severity: 'critical', read: false,
    icon: ClipboardCheck, title: 'Inspection overdue — 60+ days',
    body: '34 St Albans Road, AL1 2QA — mid-tenancy inspection was due Dec 2024. Overdue by 60+ days.',
    action: 'View Inspections', link: '/inspections', time: '5 days ago', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'n15', group: 'Inspections', severity: 'warning', read: true,
    icon: ClipboardCheck, title: 'Check-out inspection overdue',
    body: '22A Upper Street, N1 0PQ — Marcus Thompson. Inspection was due 18 Feb. Nadia Hassan to attend.',
    action: 'View Inspections', link: '/inspections', time: '3 days ago', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  // Tenancies
  {
    id: 'n16', group: 'Tenancies', severity: 'warning', read: true,
    icon: FileText, title: 'Tenancy ending in 47 days',
    body: 'Sofia Ferretti — 45 Holloway Road, N7 8JL. Tenancy expires 01 Apr 2025. Renewal offer sent.',
    action: 'View Tenancy', link: '/tenancies', time: '1 week ago', timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'n17', group: 'Tenancies', severity: 'warning', read: true,
    icon: FileText, title: 'Tenancy ending in 79 days',
    body: 'Tariq Hussain — 67 Baker Street, W1U 6AF. Tenancy expires 01 May 2025. Renewal not yet offered.',
    action: 'View Tenancy', link: '/tenancies', time: '1 week ago', timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
]

const GROUPS = ['All', 'Compliance', 'Rent & Arrears', 'Maintenance', 'Inspections', 'Tenancies']
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 }

const severityStyle = {
  critical: { dot: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.15)', label: 'Critical', labelBg: '#fef2f2', labelColor: '#dc2626' },
  warning:  { dot: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', label: 'Warning',  labelBg: '#fffbeb', labelColor: '#d97706' },
  info:     { dot: '#6366f1', bg: 'transparent', border: '#f1f5f9', label: 'Info', labelBg: '#eef2ff', labelColor: '#6366f1' },
}

export default function NotificationsPanel({ onClose }) {
  const navigate = useNavigate()
  const t = useThemeColors()
  const [notifications, setNotifications] = useState(ALL_NOTIFICATIONS)
  const [group, setGroup] = useState('All')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length
  const criticalCount = notifications.filter(n => n.severity === 'critical' && !n.read).length

  const filtered = notifications
    .filter(n => group === 'All' || n.group === group)
    .filter(n => !showUnreadOnly || !n.read)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.timestamp - a.timestamp)

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id))

  const handleAction = (notif) => {
    markRead(notif.id)
    navigate(notif.link)
    onClose()
  }

  // Group by severity for display
  const critical = filtered.filter(n => n.severity === 'critical')
  const warning = filtered.filter(n => n.severity === 'warning')
  const info = filtered.filter(n => n.severity === 'info')

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 48, backdropFilter: 'blur(2px)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: t.bgCard, zIndex: 49, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
        borderLeft: `1px solid ${t.border}`,
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={18} color={t.textPrimary} />
              <span style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  style={{ fontSize: 12, fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                  Mark all read
                </button>
              )}
              <button onClick={onClose}
                style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.border}`, background: t.bgCardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} color={t.textSecondary} />
              </button>
            </div>
          </div>

          {/* Critical summary bar */}
          {criticalCount > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={13} color="#dc2626" />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#991b1b' }}>
                {criticalCount} critical issue{criticalCount !== 1 ? 's' : ''} require immediate action
              </span>
            </div>
          )}

          {/* Group filter tabs */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            {GROUPS.map(g => {
              const count = g === 'All'
                ? notifications.filter(n => !n.read).length
                : notifications.filter(n => n.group === g && !n.read).length
              return (
                <button key={g} onClick={() => setGroup(g)}
                  style={{
                    padding: '5px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit',
                    background: group === g ? '#0f172a' : '#f1f5f9',
                    color: group === g ? 'white' : '#64748b',
                  }}>
                  {g}
                  {count > 0 && (
                    <span style={{ marginLeft: 5, background: group === g ? 'rgba(255,255,255,0.25)' : '#dc2626', color: 'white', fontSize: 10, fontWeight: 700, padding: '0px 4px', borderRadius: 8 }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter row */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${t.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: t.textMuted }}>{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)}
              style={{ accentColor: '#10b981', width: 13, height: 13 }} />
            <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>Unread only</span>
          </label>
        </div>

        {/* Notifications list */}
        <div style={{ flex: 1, overflowY: 'auto', background: t.bgCard }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15 }}>All caught up!</p>
              <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>No notifications to show.</p>
            </div>
          ) : (
            <>
              {/* Critical section */}
              {critical.length > 0 && (
                <div>
                  <div style={{ padding: '10px 20px 6px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#dc2626' }}>Critical — Immediate Action</span>
                  </div>
                  {critical.map(n => <NotifItem key={n.id} notif={n} onAction={handleAction} onRead={markRead} onDismiss={dismiss} />)}
                </div>
              )}

              {/* Warning section */}
              {warning.length > 0 && (
                <div>
                  <div style={{ padding: '10px 20px 6px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#d97706' }}>Warnings</span>
                  </div>
                  {warning.map(n => <NotifItem key={n.id} notif={n} onAction={handleAction} onRead={markRead} onDismiss={dismiss} />)}
                </div>
              )}

              {/* Info section */}
              {info.length > 0 && (
                <div>
                  <div style={{ padding: '10px 20px 6px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8' }}>Updates</span>
                  </div>
                  {info.map(n => <NotifItem key={n.id} notif={n} onAction={handleAction} onRead={markRead} onDismiss={dismiss} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, background: t.bgCard }}>
          <button
            onClick={() => { navigate('/tasks'); onClose() }}
            style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgCardAlt, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: t.textSecondary, fontFamily: 'inherit' }}>
            View All Tasks
          </button>
          <button
            onClick={() => { navigate('/compliance'); onClose() }}
            style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#0f172a', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'white', fontFamily: 'inherit' }}>
            Compliance Centre
          </button>
        </div>
      </div>
    </>
  )
}

function NotifItem({ notif, onAction, onRead, onDismiss }) {
  const [hovered, setHovered] = useState(false)
  const t = useThemeColors()
  const s = severityStyle[notif.severity]
  const Icon = notif.icon

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 20px', cursor: 'pointer',
        background: hovered ? t.bgHover : notif.read ? t.bgCard : t.bgCard,
        borderBottom: `1px solid ${t.borderSubtle}`,
        transition: 'background 0.15s',
      }}
      onClick={() => onAction(notif)}
    >
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        {/* Unread dot */}
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: notif.read ? 'transparent' : s.dot, flexShrink: 0, marginTop: 6 }} />

        {/* Icon */}
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.labelBg }}>
          <Icon size={15} color={s.labelColor} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
            <p style={{ fontSize: 13, fontWeight: notif.read ? 500 : 700, color: t.textPrimary, lineHeight: 1.3, flex: 1 }}>{notif.title}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: s.labelBg, color: s.labelColor, flexShrink: 0, marginTop: 1 }}>
              {notif.group}
            </span>
          </div>
          <p style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5, marginBottom: 7 }}>{notif.body}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={e => { e.stopPropagation(); onAction(notif) }}
                style={{ fontSize: 11.5, fontWeight: 700, color: s.labelColor, background: s.labelBg, border: 'none', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                {notif.action} <ChevronRight size={10} />
              </button>
              {!notif.read && (
                <button
                  onClick={e => { e.stopPropagation(); onRead(notif.id) }}
                  style={{ fontSize: 11.5, fontWeight: 600, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '3px 6px' }}>
                  Mark read
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: t.textMuted }}>{notif.time}</span>
              <button
                onClick={e => { e.stopPropagation(); onDismiss(notif.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                <X size={12} color="#94a3b8" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
