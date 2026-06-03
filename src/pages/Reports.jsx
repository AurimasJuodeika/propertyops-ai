import { BarChart3, TrendingUp, Zap, Building2, PoundSterling, Users, ShieldCheck } from 'lucide-react'
import PDFButton from '../components/PDFButton'
import { generateManagementSummary } from '../lib/pdfExport'
import {
  PROPERTIES, TENANCIES, MAINTENANCE_JOBS, INSPECTIONS,
  RENT_COLLECTION_CHART, BRANCH_PERFORMANCE, MAINTENANCE_BY_MONTH
} from '../data/mockData'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from 'recharts'

const OCCUPANCY_DATA = [
  { month: 'Aug', rate: 96.1 }, { month: 'Sep', rate: 95.3 }, { month: 'Oct', rate: 94.8 },
  { month: 'Nov', rate: 95.6 }, { month: 'Dec', rate: 97.2 }, { month: 'Jan', rate: 96.0 }, { month: 'Feb', rate: 94.4 },
]

const RADAR_DATA = [
  { metric: 'Rent Collection', 'London Central': 96, 'London North': 91, Hertfordshire: 95 },
  { metric: 'Occupancy', 'London Central': 96, 'London North': 93, Hertfordshire: 96 },
  { metric: 'Compliance', 'London Central': 88, 'London North': 78, Hertfordshire: 82 },
  { metric: 'Maintenance SLA', 'London Central': 92, 'London North': 85, Hertfordshire: 90 },
  { metric: 'Landlord Retention', 'London Central': 95, 'London North': 88, Hertfordshire: 93 },
]

const BRANCH_COLORS = { 'London Central': '#10b981', 'London North': '#6366f1', Hertfordshire: '#f59e0b' }

export default function Reports() {
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Portfolio performance, compliance trends and branch comparisons</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PDFButton label="Export Management Summary" onGenerate={() => generateManagementSummary({ properties: PROPERTIES, tenancies: TENANCIES, maintenanceJobs: MAINTENANCE_JOBS, inspections: INSPECTIONS, branchPerformance: BRANCH_PERFORMANCE, rentChart: RENT_COLLECTION_CHART })} />
          <button className="btn-primary"><Zap size={13} /> AI Insights</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Managed Properties', value: '180', sub: '+8 YoY', color: '#10b981', icon: Building2 },
          { label: 'Gross Rent Roll', value: '£218,400', sub: 'per month', color: '#6366f1', icon: PoundSterling },
          { label: 'Average Occupancy', value: '94.4%', sub: 'vs 96.1% last year', color: '#2563eb', icon: TrendingUp },
          { label: 'Landlord Retention', value: '94.1%', sub: 'last 12 months', color: '#f59e0b', icon: Users },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{s.value}</p>
                <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{s.sub}</p>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={17} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid-1-1" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header">
            <p className="section-title">Rent Collection vs Target</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RENT_COLLECTION_CHART} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => [`£${v.toLocaleString()}`, '']} />
              <Bar dataKey="expected" name="Target" fill="#e2e8f0" radius={[4,4,0,0]} />
              <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="section-header">
            <p className="section-title">Occupancy Rate Trend</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={OCCUPANCY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => [`${v}%`, 'Occupancy']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid-1-1" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header">
            <p className="section-title">Maintenance Volume by Type</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MAINTENANCE_BY_MONTH} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="emergency" name="Emergency" stackId="a" fill="#dc2626" />
              <Bar dataKey="urgent" name="Urgent" stackId="a" fill="#f59e0b" />
              <Bar dataKey="routine" name="Routine" stackId="a" fill="#10b981" />
              <Bar dataKey="cosmetic" name="Cosmetic" stackId="a" fill="#94a3b8" radius={[4,4,0,0]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="section-header">
            <p className="section-title">Branch Comparison Radar</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
              {Object.entries(BRANCH_COLORS).map(([branch, color]) => (
                <Radar key={branch} name={branch} dataKey={branch} stroke={color} fill={color} fillOpacity={0.1} />
              ))}
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch performance table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <p className="section-title">Branch Performance Scorecard — February 2025</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Properties</th>
              <th>Occupancy</th>
              <th>Rent Collection</th>
              <th>Compliance Score</th>
              <th>Open Maintenance</th>
              <th>Inspections Overdue</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {BRANCH_PERFORMANCE.map(b => {
              const overall = Math.round((b.occupancy + b.rentCollected + b.complianceScore) / 3)
              return (
                <tr key={b.branch}>
                  <td style={{ fontWeight: 700, color: '#1e293b' }}>{b.branch}</td>
                  <td>{b.properties}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ width: `${b.occupancy}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 12.5, color: '#10b981' }}>{b.occupancy}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 13, color: b.rentCollected < 93 ? '#dc2626' : '#10b981' }}>{b.rentCollected}%</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ width: `${b.complianceScore}%`, height: '100%', background: b.complianceScore >= 90 ? '#10b981' : b.complianceScore >= 80 ? '#f59e0b' : '#dc2626', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 12.5, color: b.complianceScore >= 90 ? '#10b981' : b.complianceScore >= 80 ? '#d97706' : '#dc2626' }}>{b.complianceScore}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: b.maintenanceOpen > 6 ? '#d97706' : '#334155' }}>{b.maintenanceOpen}</td>
                  <td style={{ fontWeight: 700, color: b.inspectionsOverdue > 0 ? '#dc2626' : '#10b981' }}>{b.inspectionsOverdue}</td>
                  <td>
                    <span className={`badge ${overall >= 92 ? 'badge-green' : overall >= 85 ? 'badge-amber' : 'badge-red'}`}>
                      {overall}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* AI Insights */}
      <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} color="white" />
          </div>
          <div>
            <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>AI Performance Insights — February 2025</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { title: 'Rent Collection Decline', body: 'Collection rate has dropped from 99.2% in December to 85.8% in February — a 13.4% decline. 4 new arrears cases contribute £21,250. Recommend immediate action on stage 2/3 cases.' },
                { title: 'London North Compliance', body: 'London North branch has the lowest compliance score at 78%. Three properties have expired certificates. A branch-level audit should be conducted before end of February.' },
                { title: 'Maintenance Spike', body: 'Emergency maintenance cases doubled in February. Review contractor response times — Capital Gas Services is performing well (4h avg). Consider additional heating contractor for winter contingency.' },
                { title: 'Occupancy Opportunity', body: 'One void property at Hemel Hempstead (HP1 1BB) — listed 14 days, no viewings confirmed. Consider a rental price review. Current asking rent may be 5-8% above market for the area.' },
              ].map(insight => (
                <div key={insight.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>{insight.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>{insight.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
