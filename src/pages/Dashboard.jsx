import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedCounter from '../components/AnimatedCounter'
import { useThemeColors } from '../context/ThemeContext'
import { generateWeeklySummary, isAIConfigured } from '../lib/ai'
import {
  AlertTriangle, TrendingUp, Building2, ClipboardCheck, Wrench,
  PoundSterling, ShieldCheck, Users, Zap, ArrowUp, ArrowDown,
  Clock, CheckCircle, AlertCircle, BarChart3, Star, FileText
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  PROPERTIES, TENANCIES, MAINTENANCE_JOBS, INSPECTIONS, TASKS,
  ACTIVITY_FEED, RENT_COLLECTION_CHART, BRANCH_PERFORMANCE,
  STAFF, getComplianceSummary, getTotalArrears, getArrearsTenancies
} from '../data/mockData'
import { useAuth } from '../context/AuthContext'

// ─── Role config ────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  'Agency Owner': {
    branch: null, // all branches
    greeting: 'Good morning',
    focus: 'Executive Overview — All Branches',
    color: '#10b981',
  },
  'Regional Manager': {
    branch: 'London Central',
    greeting: 'Good morning',
    focus: 'London Central Branch',
    color: '#6366f1',
  },
  'Branch Manager': {
    branch: 'London Central',
    greeting: 'Good morning',
    focus: 'London Central Branch',
    color: '#6366f1',
  },
  'Property Manager': {
    branch: 'London Central',
    greeting: 'Hi',
    focus: 'My Properties',
    color: '#f59e0b',
    managerId: 's5',
  },
  'Lettings Negotiator': {
    branch: 'London Central',
    greeting: 'Hi',
    focus: 'Lettings Pipeline',
    color: '#0284c7',
  },
  'Property Inspector': {
    branch: null,
    greeting: 'Hi',
    focus: 'My Inspections',
    color: '#7c3aed',
  },
  'Maintenance Coordinator': {
    branch: null,
    greeting: 'Hi',
    focus: 'Maintenance Queue',
    color: '#dc2626',
  },
}

function filterByRole(user) {
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG['Agency Owner']
  let props = PROPERTIES
  let tasks = TASKS
  let jobs = MAINTENANCE_JOBS
  let inspections = INSPECTIONS

  if (cfg.branch) {
    props = props.filter(p => p.branch === cfg.branch)
  }
  if (user?.role === 'Property Manager') {
    props = props.filter(p => p.managerId === 's5')
    tasks = tasks.filter(t => t.assignedTo === 's5')
    jobs = jobs.filter(j => props.some(p => p.id === j.propertyId))
    inspections = inspections.filter(i => props.some(p => p.id === i.propertyId))
  }
  if (user?.role === 'Property Inspector') {
    inspections = inspections.filter(i => i.inspectorId === 's10')
    jobs = []
    tasks = tasks.filter(t => t.type === 'inspection')
  }
  if (user?.role === 'Maintenance Coordinator') {
    tasks = tasks.filter(t => t.assignedTo === 's12')
  }
  if (user?.role === 'Branch Manager' || user?.role === 'Regional Manager') {
    props = PROPERTIES.filter(p => p.branch === 'London Central')
    tasks = tasks.filter(t => {
      const p = props.find(pr => pr.id === t.propertyId)
      return !t.propertyId || p
    })
    jobs = MAINTENANCE_JOBS.filter(j => props.some(p => p.id === j.propertyId))
    inspections = INSPECTIONS.filter(i => props.some(p => p.id === i.propertyId))
  }

  const tenancies = TENANCIES.filter(t => props.some(p => p.id === t.propertyId))
  return { props, tasks, jobs, inspections, tenancies, cfg }
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color, alert, trend, onClick }) {
  const t = useThemeColors()
  return (
    <div className="stat-card" onClick={onClick} style={{ position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }}>
      {alert && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color === 'red' ? '#dc2626' : color === 'amber' ? '#f59e0b' : '#10b981' }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11.5, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: alert && color === 'red' ? '#dc2626' : alert && color === 'amber' ? '#d97706' : t.textPrimary }}>
            {typeof value === 'number'
              ? <AnimatedCounter value={value} />
              : value}
          </p>
          {sub && <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 4, fontWeight: 500 }}>{sub}</p>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'red' ? '#fef2f2' : color === 'amber' ? '#fffbeb' : color === 'green' ? '#f0fdf4' : color === 'blue' ? '#eff6ff' : '#f8fafc' }}>
          <Icon size={19} color={color === 'red' ? '#dc2626' : color === 'amber' ? '#d97706' : color === 'green' ? '#16a34a' : color === 'blue' ? '#2563eb' : '#64748b'} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          {trend >= 0 ? <ArrowUp size={11} color="#16a34a" /> : <ArrowDown size={11} color="#dc2626" />}
          <span style={{ fontSize: 11.5, fontWeight: 600, color: trend >= 0 ? '#16a34a' : '#dc2626' }}>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </div>
  )
}

function AlertBanner({ icon: Icon, message, severity, action }) {
  const t = useThemeColors()
  const s = {
    critical: t.alertCritical,
    warning:  t.alertWarning,
    info:     t.alertInfo,
  }[severity] || t.alertInfo
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, marginBottom: 6 }}>
      <Icon size={14} color={s.icon} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: s.text, flex: 1 }}>{message}</span>
      {action && <button style={{ fontSize: 12, fontWeight: 700, color: s.icon, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>{action} →</button>}
    </div>
  )
}

function ActivityItem({ item }) {
  const t = useThemeColors()
  const typeColors = { alert: '#dc2626', maintenance: '#d97706', payment: '#16a34a', task: '#6366f1', compliance: '#dc2626', tenancy: '#0284c7' }
  const typeBg = { alert: '#fef2f2', maintenance: '#fffbeb', payment: '#f0fdf4', task: '#eef2ff', compliance: '#fef2f2', tenancy: '#eff6ff' }
  const icons = { alert: AlertTriangle, maintenance: Wrench, payment: PoundSterling, task: CheckCircle, compliance: ShieldCheck, tenancy: FileText }
  const Icon = icons[item.type] || AlertCircle
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1, background: typeBg[item.type], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} color={typeColors[item.type]} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, color: t.textSecondary, fontWeight: 500, lineHeight: 1.4 }}>{item.text}</p>
      </div>
      <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, whiteSpace: 'nowrap', marginTop: 2 }}>{item.time}</span>
    </div>
  )
}

// ─── Role-specific dashboards ────────────────────────────────────────────────

function OwnerDashboard({ data }) {
  const [aiOpen, setAiOpen]       = useState(false)
  const [aiText, setAiText]       = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const navigate = useNavigate()
  const t = useThemeColors()

  const handleAISummary = async () => {
    if (aiText) { setAiOpen(true); return }
    setAiLoading(true)
    setAiOpen(true)
    try {
      const text = await generateWeeklySummary({
        agencyName: 'Harrington & Co',
        properties: PROPERTIES,
        tenancies:  TENANCIES,
        jobs:       MAINTENANCE_JOBS,
        inspections: INSPECTIONS,
        tasks:      TASKS,
        branchPerformance: BRANCH_PERFORMANCE,
      })
      setAiText(text)
    } catch (e) {
      setAiText('Failed to generate summary: ' + e.message)
    }
    setAiLoading(false)
  }
  const { props, jobs, inspections, tenancies } = data
  const compliance = getComplianceSummary()
  const totalArrears = getTotalArrears()
  const arrearsTenancies = getArrearsTenancies()
  const overdueInspections = INSPECTIONS.filter(i => i.status === 'overdue')
  const openJobs = MAINTENANCE_JOBS.filter(j => j.status !== 'completed')
  const emergencyJobs = openJobs.filter(j => j.priority === 'emergency')
  const overdueTasksCount = TASKS.filter(t => t.status === 'overdue').length

  // Today's priorities — specific actionable items
  const todayPriorities = [
    ...openJobs.filter(j => j.priority === 'emergency' || j.priority === 'urgent').slice(0, 2).map(j => ({
      type: 'maintenance', severity: j.priority === 'emergency' ? 'critical' : 'warning',
      title: j.title, sub: j.tenantName, link: '/maintenance'
    })),
    ...overdueInspections.slice(0, 2).map(i => ({
      type: 'inspection', severity: 'warning',
      title: `Inspection overdue — ${i.address?.split(',')[0]}`, sub: i.tenantName, link: '/inspections'
    })),
    ...arrearsTenancies.filter(t => t.arrears > 3000).slice(0, 1).map(t => ({
      type: 'arrears', severity: 'warning',
      title: `Rent arrears — ${t.tenant?.name}`, sub: `£${t.arrears?.toLocaleString()} outstanding`, link: '/rent-arrears'
    })),
    ...[
      { type: 'compliance', severity: 'critical', title: 'Gas Safety expiring — 42 Moseley Road', sub: 'Expires 21 Jun 2025 · Book now', link: '/compliance' },
      { type: 'compliance', severity: 'critical', title: 'EICR expired — 17 Balsall Heath Road', sub: 'Expired Dec 2024 · Immediate action', link: '/compliance' },
      { type: 'compliance', severity: 'critical', title: 'RTR not verified — Precious Adeyemi', sub: '31 Handsworth Wood Road · £10,000 risk', link: '/tenants' },
    ]
  ].slice(0, 6)

  const PIE = [
    { name: 'Compliant', value: compliance.compliant, color: '#10b981' },
    { name: 'Expiring', value: compliance.expiringSoon, color: '#f59e0b' },
    { name: 'Critical', value: compliance.expired, color: '#ef4444' },
  ]

  const priorityIcon = { maintenance: Wrench, inspection: ClipboardCheck, arrears: PoundSterling, compliance: ShieldCheck }
  const priorityColor = { critical: '#dc2626', warning: '#d97706' }
  const priorityBg = { critical: '#fef2f2', warning: '#fffbeb' }

  return (
    <div>
      {/* Today's Priorities */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary, letterSpacing: '-0.2px' }}>Today's Priorities</h2>
            <p style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>
              Demo snapshot: Thursday, 5 June 2025 · {todayPriorities.filter(p => p.severity === 'critical').length} critical, {todayPriorities.filter(p => p.severity === 'warning').length} need attention
            </p>
          </div>
          <button onClick={() => navigate('/tasks')}
            style={{ fontSize: 12.5, fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            View all tasks →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {todayPriorities.map((p, i) => {
            const Icon = priorityIcon[p.type] || AlertTriangle
            return (
              <button key={i} onClick={() => navigate(p.link)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                  background: priorityBg[p.severity], border: `1px solid ${priorityColor[p.severity]}30`,
                  borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  borderLeft: `3px solid ${priorityColor[p.severity]}`, transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Icon size={15} color={priorityColor[p.severity]} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* KPIs — all clickable */}
      <div className="grid-cols-6" style={{ marginBottom: 24 }}>
        <KPICard label="Overdue Rent" value={`£${totalArrears.toLocaleString()}`} sub={`${arrearsTenancies.length} tenancies`} icon={PoundSterling} color="red" alert onClick={() => navigate('/rent-arrears')} />
        <KPICard label="Compliance Risks" value={compliance.expired + compliance.expiringSoon} sub={`${compliance.expired} expired`} icon={ShieldCheck} color="red" alert onClick={() => navigate('/compliance')} />
        <KPICard label="Inspections Due" value={overdueInspections.length} sub="overdue" icon={ClipboardCheck} color="amber" alert onClick={() => navigate('/inspections')} />
        <KPICard label="Open Maintenance" value={openJobs.length} sub={`${emergencyJobs.length} emergency`} icon={Wrench} color="amber" onClick={() => navigate('/maintenance')} />
        <KPICard label="Properties" value={PROPERTIES.filter(p => p.status === 'let').length} sub={`${PROPERTIES.filter(p => p.status === 'void').length} void`} icon={Building2} color="blue" trend={2.4} onClick={() => navigate('/properties')} />
        <KPICard label="Active Tenancies" value={tenancies.filter(t => t.status === 'active').length} sub="2 ending soon" icon={Users} color="green" trend={1.2} onClick={() => navigate('/tenancies')} />
      </div>

      {/* Charts row */}
      <div className="grid-3-col" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 20, gridColumn: 'span 2' }}>
          <div className="section-header">
            <p className="section-title">Rent Collection — Last 7 Months</p>
            <span className="badge badge-red">85.8% — Below target</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={RENT_COLLECTION_CHART} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`£${v.toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="expected" name="Target" fill="#e2e8f0" radius={[4,4,0,0]} />
              <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="section-header">
            <p className="section-title">Compliance Health</p>
            <span className="badge badge-red">{compliance.expired} Critical</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart><Pie data={PIE} cx="50%" cy="50%" innerRadius={38} outerRadius={55} dataKey="value" strokeWidth={0}>
                {PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
          {PIE.map(item => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: 12.5, color: '#475569' }}>{item.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Branch performance + Activity */}
      <div className="grid-1-1" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 20, background: t.bgCard, border: `1px solid ${t.border}` }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Branch Performance</p>
          <table className="data-table">
            <thead><tr><th>Branch</th><th>Props</th><th>Occupancy</th><th>Rent %</th><th>Compliance</th></tr></thead>
            <tbody>
              {BRANCH_PERFORMANCE.map(b => (
                <tr key={b.branch}>
                  <td style={{ fontWeight: 600, fontSize: 12.5 }}>{b.branch.replace('London ', '')}</td>
                  <td>{b.properties}</td>
                  <td><span style={{ fontWeight: 700, fontSize: 12.5, color: '#10b981' }}>{b.occupancy}%</span></td>
                  <td><span style={{ fontWeight: 700, fontSize: 12.5, color: b.rentCollected < 93 ? '#dc2626' : '#10b981' }}>{b.rentCollected}%</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 40, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ width: `${b.complianceScore}%`, height: '100%', background: b.complianceScore >= 90 ? '#10b981' : b.complianceScore >= 80 ? '#f59e0b' : '#dc2626', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: b.complianceScore >= 90 ? '#10b981' : b.complianceScore >= 80 ? '#d97706' : '#dc2626' }}>{b.complianceScore}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="section-header">
            <p className="section-title">Live Activity</p>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />Live
            </span>
          </div>
          {ACTIVITY_FEED.slice(0, 7).map(item => <ActivityItem key={item.id} item={item} />)}
        </div>
      </div>

      {/* AI Summary */}
      <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={17} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Weekly Management Summary {isAIConfigured && <span style={{ color: '#059669' }}>· Auto-generated</span>}
            </p>
            {aiOpen ? (
              <div>
                {aiLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Claude is analysing your portfolio…</p>
                  </div>
                ) : (
                  <p style={{ color: '#e2e8f0', fontSize: 13.5, lineHeight: 1.7, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{aiText}</p>
                )}
                <button onClick={() => { setAiOpen(false) }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Collapse ↑</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <p style={{ color: '#64748b', fontSize: 13 }}>Harrington & Co · 4 critical issues · £21,250 arrears · 3 overdue inspections</p>
                <button onClick={handleAISummary} className="btn-primary" style={{ flexShrink: 0, fontSize: 12 }}>
                  <Zap size={12} /> {isAIConfigured ? 'Generate Live Summary' : 'Read Summary'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BranchManagerDashboard({ data, user }) {
  const { props, jobs, inspections, tenancies, tasks } = data
  const branchName = 'London Central'
  const openJobs = jobs.filter(j => j.status !== 'completed')
  const overdueInspections = inspections.filter(i => i.status === 'overdue')
  const arrearsTenancies = tenancies.filter(t => t.arrears > 0)
  const totalArrears = arrearsTenancies.reduce((s, t) => s + t.arrears, 0)
  const overdueTasks = tasks.filter(t => t.status === 'overdue')
  const branchCompliance = BRANCH_PERFORMANCE.find(b => b.branch === branchName)
  const staffInBranch = STAFF.filter(s => s.branch === branchName || s.branch === 'All')

  const rentData = RENT_COLLECTION_CHART.map(d => ({ ...d, collected: Math.round(d.collected * 0.4), expected: Math.round(d.expected * 0.4) }))

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <AlertBanner icon={AlertTriangle} severity="critical" message="Gas Safety Certificate EXPIRED — 22A Upper Street. Action required immediately." action="Resolve" />
        {overdueInspections.length > 0 && <AlertBanner icon={Clock} severity="warning" message={`${overdueInspections.length} inspection${overdueInspections.length > 1 ? 's' : ''} overdue in your branch`} action="View" />}
      </div>

      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        <KPICard label="Branch Properties" value={props.length} sub={`${props.filter(p => p.status === 'let').length} let`} icon={Building2} color="blue" />
        <KPICard label="Rent Arrears" value={`£${totalArrears.toLocaleString()}`} sub={`${arrearsTenancies.length} tenancies`} icon={PoundSterling} color={totalArrears > 0 ? 'red' : 'green'} alert={totalArrears > 0} />
        <KPICard label="Open Maintenance" value={openJobs.length} sub={`${openJobs.filter(j=>j.priority==='emergency').length} emergency`} icon={Wrench} color={openJobs.filter(j=>j.priority==='emergency').length > 0 ? 'red' : 'amber'} />
        <KPICard label="Overdue Tasks" value={overdueTasks.length} sub="need action" icon={ClipboardCheck} color={overdueTasks.length > 0 ? 'amber' : 'green'} alert={overdueTasks.length > 0} />
        <KPICard label="Compliance Score" value={`${branchCompliance?.complianceScore || 88}%`} sub="branch average" icon={ShieldCheck} color={branchCompliance?.complianceScore >= 90 ? 'green' : 'amber'} />
      </div>

      <div className="grid-1-1" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title" style={{ marginBottom: 14 }}>Branch Rent Collection</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={rentData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`£${v.toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="expected" fill="#e2e8f0" radius={[4,4,0,0]} />
              <Bar dataKey="collected" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Team Performance — {branchName}</p>
          {staffInBranch.slice(0, 5).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{s.avatar}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>{s.role}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 44, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ width: `${s.performance}%`, height: '100%', background: s.performance >= 90 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: s.performance >= 90 ? '#10b981' : '#d97706' }}>{s.performance}%</span>
                </div>
                {s.tasksOverdue > 0 && <span style={{ fontSize: 10.5, color: '#dc2626', fontWeight: 600 }}>{s.tasksOverdue} overdue</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <p className="section-title" style={{ marginBottom: 12 }}>My Branch — Open Maintenance Jobs</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {openJobs.slice(0, 6).map(job => {
            const pc = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }
            return (
              <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9', borderLeft: `3px solid ${pc[job.priority]}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{job.title}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>{job.tenantName}</p>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${pc[job.priority]}15`, color: pc[job.priority], textTransform: 'capitalize' }}>{job.priority}</span>
                <span className={`badge ${job.status === 'completed' ? 'badge-green' : job.status === 'assigned' ? 'badge-blue' : 'badge-amber'}`}>{job.status.replace('_',' ')}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PropertyManagerDashboard({ data, user }) {
  const { props, jobs, inspections, tasks } = data
  const myProps = props
  const openJobs = jobs.filter(j => j.status !== 'completed')
  const overdueInspections = inspections.filter(i => i.status === 'overdue')
  const myTasks = tasks.filter(t => t.assignedTo === 's5')
  const overdueTasks = myTasks.filter(t => t.status === 'overdue')
  const complianceIssues = myProps.filter(p => {
    const c = p.compliance
    return Object.values(c).some(cert => ['expired','not_verified','overdue','expiring_soon'].includes(cert.status))
  })

  return (
    <div>
      {overdueTasks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <AlertBanner icon={AlertTriangle} severity="critical" message={`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} — action required today`} action="View tasks" />
        </div>
      )}

      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        <KPICard label="My Properties" value={myProps.length} sub={`${myProps.filter(p=>p.status==='let').length} let · ${myProps.filter(p=>p.status==='void').length} void`} icon={Building2} color="blue" />
        <KPICard label="Compliance Issues" value={complianceIssues.length} sub="need attention" icon={ShieldCheck} color={complianceIssues.length > 0 ? 'red' : 'green'} alert={complianceIssues.length > 0} />
        <KPICard label="Open Maintenance" value={openJobs.length} sub={`${openJobs.filter(j=>j.priority==='emergency').length} emergency`} icon={Wrench} color={openJobs.filter(j=>j.priority==='emergency').length > 0 ? 'red' : 'amber'} />
        <KPICard label="Overdue Inspections" value={overdueInspections.length} sub="past scheduled date" icon={ClipboardCheck} color={overdueInspections.length > 0 ? 'amber' : 'green'} />
      </div>

      <div className="grid-1-1" style={{ marginBottom: 20 }}>
        {/* My properties */}
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>My Properties ({myProps.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {myProps.slice(0, 8).map(p => {
              const hasIssue = Object.values(p.compliance).some(c => ['expired','not_verified','overdue'].includes(c.status))
              const hasWarn = !hasIssue && Object.values(p.compliance).some(c => c.status === 'expiring_soon')
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: `1px solid ${hasIssue ? '#fecaca' : hasWarn ? '#fde68a' : '#f1f5f9'}`, background: hasIssue ? '#fef2f2' : hasWarn ? '#fffbeb' : 'white' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{p.postcode} · £{p.rent.toLocaleString()}/mo</p>
                  </div>
                  <span className={`badge ${p.status === 'let' ? 'badge-green' : 'badge-amber'}`}>{p.status === 'let' ? 'Let' : 'Void'}</span>
                  {hasIssue && <span className="badge badge-red">⚠</span>}
                  {hasWarn && !hasIssue && <span className="badge badge-amber">!</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* My tasks */}
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>My Tasks ({myTasks.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {myTasks.slice(0, 8).map(task => {
              const sc = { overdue: 'badge-red', pending: 'badge-amber', in_progress: 'badge-blue', completed: 'badge-green' }
              const tc = { compliance: '#dc2626', arrears: '#d97706', maintenance: '#6366f1', tenancy: '#0284c7', legal: '#7c3aed', inspection: '#059669', letting: '#64748b' }
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 10px', borderRadius: 8, border: '1px solid #f1f5f9', borderLeft: `3px solid ${tc[task.type] || '#94a3b8'}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                    {task.dueDate && <p style={{ fontSize: 11, color: task.status === 'overdue' ? '#dc2626' : '#94a3b8', fontWeight: task.status === 'overdue' ? 700 : 400 }}>Due {task.dueDate}</p>}
                  </div>
                  <span className={`badge ${sc[task.status] || 'badge-slate'}`} style={{ flexShrink: 0 }}>{task.status.replace('_',' ')}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {openJobs.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Maintenance on My Properties</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {openJobs.slice(0, 5).map(job => {
              const pc = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }
              return (
                <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9', borderLeft: `3px solid ${pc[job.priority]}` }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{job.title}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{job.tenantName} · reported {job.reportedDate}</p>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${pc[job.priority]}15`, color: pc[job.priority], textTransform: 'capitalize' }}>{job.priority}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function InspectorDashboard({ data }) {
  const { inspections } = data
  const myInspections = INSPECTIONS.filter(i => i.inspectorId === 's10')
  const overdue = myInspections.filter(i => i.status === 'overdue')
  const scheduled = myInspections.filter(i => i.status === 'scheduled')
  const upcoming7 = scheduled.filter(i => {
    const d = new Date(i.scheduledDate)
    const now = new Date()
    return (d - now) / (1000*60*60*24) <= 7
  })

  return (
    <div>
      {overdue.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <AlertBanner icon={AlertTriangle} severity="critical" message={`${overdue.length} inspection${overdue.length > 1 ? 's' : ''} overdue — need to be completed ASAP`} action="View" />
        </div>
      )}

      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        <KPICard label="Overdue" value={overdue.length} sub="past scheduled date" icon={AlertTriangle} color={overdue.length > 0 ? 'red' : 'green'} alert={overdue.length > 0} />
        <KPICard label="Due This Week" value={upcoming7.length} sub="within 7 days" icon={Clock} color={upcoming7.length > 0 ? 'amber' : 'green'} />
        <KPICard label="Scheduled" value={scheduled.length} sub="total upcoming" icon={ClipboardCheck} color="blue" />
        <KPICard label="This Month" value={myInspections.length} sub="assigned to me" icon={BarChart3} color="green" />
      </div>

      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <p className="section-title">My Inspection Schedule</p>
        </div>
        <table className="data-table">
          <thead><tr><th>Property</th><th>Type</th><th>Date</th><th>Tenant</th><th>Access</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {myInspections.sort((a,b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).map(ins => (
              <tr key={ins.id}>
                <td style={{ fontWeight: 600, fontSize: 12.5 }}>{ins.address.split(',')[0]}</td>
                <td><span className="badge badge-blue">{ins.type}</span></td>
                <td style={{ fontSize: 12.5, color: ins.status === 'overdue' ? '#dc2626' : '#334155', fontWeight: ins.status === 'overdue' ? 700 : 400 }}>
                  {new Date(ins.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </td>
                <td style={{ fontSize: 12.5 }}>{ins.tenantName}</td>
                <td>{ins.accessConfirmed ? <span className="badge badge-green">Confirmed</span> : <span className="badge badge-amber">Pending</span>}</td>
                <td>{ins.status === 'overdue' ? <span className="badge badge-red">Overdue</span> : <span className="badge badge-slate">Scheduled</span>}</td>
                <td>
                  {ins.status === 'overdue' && (
                    <a href="http://localhost:5173/inspections/new" target="_blank" rel="noopener noreferrer"
                      className="btn-primary" style={{ fontSize: 11, padding: '4px 8px' }}>Start</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MaintenanceDashboard({ data }) {
  const allJobs = MAINTENANCE_JOBS
  const myTasks = TASKS.filter(t => t.assignedTo === 's12')
  const openJobs = allJobs.filter(j => j.status !== 'completed')
  const emergency = openJobs.filter(j => j.priority === 'emergency')
  const urgent = openJobs.filter(j => j.priority === 'urgent')
  const unassigned = openJobs.filter(j => !j.assignedTo)

  return (
    <div>
      {emergency.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <AlertBanner icon={AlertTriangle} severity="critical" message={`${emergency.length} emergency job${emergency.length > 1 ? 's' : ''} require immediate attention`} action="View" />
        </div>
      )}

      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        <KPICard label="Emergency" value={emergency.length} sub="immediate action" icon={AlertTriangle} color={emergency.length > 0 ? 'red' : 'green'} alert={emergency.length > 0} />
        <KPICard label="Urgent" value={urgent.length} sub="this week" icon={Clock} color={urgent.length > 0 ? 'amber' : 'green'} />
        <KPICard label="Unassigned" value={unassigned.length} sub="need contractor" icon={Users} color={unassigned.length > 0 ? 'amber' : 'green'} />
        <KPICard label="Total Open" value={openJobs.length} sub="in progress / new" icon={Wrench} color="blue" />
        <KPICard label="My Tasks" value={myTasks.filter(t => t.status !== 'completed').length} sub={`${myTasks.filter(t=>t.status==='overdue').length} overdue`} icon={ClipboardCheck} color="blue" />
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Emergency', count: emergency.length, color: '#dc2626', bg: '#fef2f2' },
            { label: 'Urgent', count: urgent.length, color: '#d97706', bg: '#fffbeb' },
            { label: 'Routine', count: openJobs.filter(j=>j.priority==='routine').length, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Cosmetic', count: openJobs.filter(j=>j.priority==='cosmetic').length, color: '#94a3b8', bg: '#f8fafc' },
          ].map(p => (
            <div key={p.label} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', borderRadius: 8, background: p.bg }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: p.color }}>{p.count}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: p.color, opacity: 0.8 }}>{p.label}</p>
            </div>
          ))}
        </div>
        <p className="section-title" style={{ marginBottom: 10 }}>All Open Jobs</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {openJobs.map(job => {
            const pc = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }
            return (
              <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9', borderLeft: `3px solid ${pc[job.priority]}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{job.title}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>{job.tenantName} · {job.reportedDate}</p>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${pc[job.priority]}15`, color: pc[job.priority], textTransform: 'capitalize' }}>{job.priority}</span>
                <span className={`badge ${job.assignedTo ? 'badge-blue' : 'badge-amber'}`}>{job.assignedTo ? 'Assigned' : 'Unassigned'}</span>
                {!job.assignedTo && <button className="btn-primary" style={{ fontSize: 11, padding: '4px 8px' }}>Assign</button>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const data = filterByRole(user)
  const { cfg } = data
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div>
      {/* Role-aware greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0a3d2e 100%)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16, flexShrink: 0, boxShadow: `0 6px 20px ${cfg.color}40` }}>
          {user?.avatar || 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontSize: 18, fontWeight: 900, letterSpacing: '-0.2px' }}>
            {cfg.greeting}, {firstName} 👋
          </p>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
            {user?.role} · {cfg.focus}
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px' }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</p>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Render role-specific dashboard */}
      {(!user || user.role === 'Agency Owner') && <OwnerDashboard data={data} />}
      {(user?.role === 'Branch Manager' || user?.role === 'Regional Manager') && <BranchManagerDashboard data={data} user={user} />}
      {user?.role === 'Property Manager' && <PropertyManagerDashboard data={data} user={user} />}
      {user?.role === 'Property Inspector' && <InspectorDashboard data={data} />}
      {user?.role === 'Maintenance Coordinator' && <MaintenanceDashboard data={data} />}
      {user?.role === 'Lettings Negotiator' && <OwnerDashboard data={data} />}
    </div>
  )
}
