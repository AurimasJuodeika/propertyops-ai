import { useState } from 'react'
import {
  Building2, PoundSterling, ShieldCheck, ClipboardCheck, Wrench,
  FileText, Bell, LogOut, CheckCircle,
  AlertTriangle, Zap, TrendingUp, Phone, Mail, MessageSquare
} from 'lucide-react'
import { LANDLORDS, PROPERTIES, TENANCIES, MAINTENANCE_JOBS, INSPECTIONS, getComplianceStatus } from '../data/mockData'
import PDFButton from '../components/PDFButton'
import { generateLandlordStatement } from '../lib/pdfExport'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const INCOME_DATA = [
  { month: 'Sep', income: 7200 }, { month: 'Oct', income: 7200 }, { month: 'Nov', income: 7200 },
  { month: 'Dec', income: 7200 }, { month: 'Jan', income: 7200 }, { month: 'Feb', income: 5050 },
]

const DEMO_LANDLORD = LANDLORDS[0] // Robert Ashford — 3 properties

export default function LandlordPortal({ onExit }) {
  const [tab, setTab] = useState('overview')
  const landlord = DEMO_LANDLORD
  const properties = PROPERTIES.filter(p => landlord.properties.includes(p.id))
  const tenancies = properties.map(p => TENANCIES.find(t => t.propertyId === p.id)).filter(Boolean)
  const jobs = MAINTENANCE_JOBS.filter(j => properties.some(p => p.id === j.propertyId))
  const inspList = INSPECTIONS.filter(i => properties.some(p => p.id === i.propertyId))
  const totalRent = properties.reduce((s, p) => s + p.rent, 0)
  const totalArrears = tenancies.reduce((s, t) => s + (t.arrears || 0), 0)

  const NAV = [
    { id: 'overview', icon: Building2, label: 'My Portfolio' },
    { id: 'financials', icon: PoundSterling, label: 'Financials' },
    { id: 'compliance', icon: ShieldCheck, label: 'Compliance' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
    { id: 'inspections', icon: ClipboardCheck, label: 'Inspections' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#1e293b', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={14} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>Landlord Portal</p>
              <p style={{ color: '#475569', fontSize: 10.5 }}>Harrington & Co</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>RA</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#e2e8f0', fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{landlord.name}</p>
              <p style={{ color: '#475569', fontSize: 10.5 }}>{landlord.properties.length} properties</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                borderRadius: 7, border: 'none', cursor: 'pointer', marginBottom: 2, fontFamily: 'inherit',
                background: tab === item.id ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: tab === item.id ? '#10b981' : '#64748b', fontSize: 13, fontWeight: 600, textAlign: 'left'
              }}>
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onExit}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: '#475569', fontSize: 13, fontFamily: 'inherit' }}>
            <LogOut size={13} /> Exit Portal
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, padding: 28, maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
              {tab === 'overview' ? `Welcome back, ${landlord.name.split(' ')[0]}` :
               tab === 'financials' ? 'Financials' :
               tab === 'compliance' ? 'Compliance Status' :
               tab === 'maintenance' ? 'Maintenance' :
               tab === 'inspections' ? 'Inspections' :
               tab === 'documents' ? 'Documents' : 'Messages'}
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 36, height: 36, borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={15} color="#64748b" />
              <span style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, background: '#dc2626', borderRadius: '50%', fontSize: 8, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
            </button>
          </div>
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Properties', value: properties.length, sub: 'all let', icon: Building2, color: '#10b981' },
                { label: 'Monthly Income', value: `£${totalRent.toLocaleString()}`, sub: 'gross rent', icon: PoundSterling, color: '#6366f1' },
                { label: 'Account Balance', value: `£${landlord.balance.toLocaleString()}`, sub: 'available to withdraw', icon: TrendingUp, color: '#0284c7' },
                { label: 'Arrears', value: totalArrears > 0 ? `£${totalArrears.toLocaleString()}` : 'None', sub: totalArrears > 0 ? 'outstanding' : 'all tenants paying', icon: AlertTriangle, color: totalArrears > 0 ? '#dc2626' : '#10b981' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{s.value}</p>
                      <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{s.sub}</p>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={16} color={s.color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Properties */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>My Properties</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {properties.map(p => {
                const tenancy = tenancies.find(t => t.propertyId === p.id)
                const compStatus = getComplianceStatus(p)
                const openJobs = jobs.filter(j => j.propertyId === p.id && j.status !== 'completed').length
                return (
                  <div key={p.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={18} color="#10b981" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                          <p style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{p.address}</p>
                          <span className="badge badge-green">Let</span>
                          {compStatus === 'critical' && <span className="badge badge-red">⚠ Compliance</span>}
                          {compStatus === 'warning' && <span className="badge badge-amber">Cert Expiring</span>}
                        </div>
                        <p style={{ fontSize: 12.5, color: '#64748b' }}>{p.postcode} · {p.bedrooms} bed {p.type}</p>
                        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>£{p.rent.toLocaleString()}/mo</span>
                          {tenancy?.arrears > 0 && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#dc2626' }}>£{tenancy.arrears.toLocaleString()} arrears</span>}
                          {openJobs > 0 && <span style={{ fontSize: 12.5, color: '#d97706', fontWeight: 600 }}>{openJobs} open job{openJobs !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                      <button onClick={() => setTab('financials')} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>
                        View →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick actions */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { icon: FileText, label: 'Download Statement', color: '#6366f1' },
                { icon: MessageSquare, label: 'Message Agency', color: '#10b981' },
                { icon: Wrench, label: 'Report Issue', color: '#d97706' },
                { icon: PoundSterling, label: 'View Financials', color: '#0284c7' },
              ].map(a => (
                <button key={a.label} onClick={() => a.label.includes('Financial') ? setTab('financials') : a.label.includes('Message') ? setTab('messages') : null}
                  style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, fontFamily: 'inherit', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.icon size={17} color={a.color} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', textAlign: 'center' }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FINANCIALS */}
        {tab === 'financials' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>Rental Income — Last 6 Months</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Feb income reduced due to arrears at 22A Upper Street</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={INCOME_DATA} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v.toLocaleString()}`} />
                    <Tooltip formatter={v => [`£${v.toLocaleString()}`, 'Income']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Account Summary</p>
                {[
                  { label: 'Monthly Rent Roll', value: `£${totalRent.toLocaleString()}`, color: '#10b981' },
                  { label: 'Management Fee (10%)', value: `-£${(totalRent * 0.1).toLocaleString()}`, color: '#dc2626' },
                  { label: 'Maintenance Costs', value: '-£450', color: '#dc2626' },
                  { label: 'Net Income', value: `£${(totalRent * 0.9 - 450).toLocaleString()}`, color: '#0f172a', bold: true },
                  { label: 'Account Balance', value: `£${landlord.balance.toLocaleString()}`, color: '#6366f1', bold: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <PDFButton
                  label="Download Statement PDF"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
                  onGenerate={() => generateLandlordStatement(
                    landlord,
                    properties,
                    tenancies,
                    [
                      { date: '01 Feb 2025', property: properties[0]?.address || '', desc: 'Rent received', amount: properties[0]?.rent || 0, status: 'received' },
                      { date: '01 Feb 2025', property: properties[1]?.address || '', desc: 'Rent received', amount: properties[1]?.rent || 0, status: 'received' },
                      { date: '15 Feb 2025', property: properties[2]?.address || '', desc: 'Rent missed', amount: 0, status: 'missed' },
                      { date: '28 Jan 2025', property: 'All Properties', desc: `Management fee (${landlord.managementFee}%)`, amount: -Math.round(properties.reduce((s,p) => s+p.rent,0) * landlord.managementFee / 100), status: 'charged' },
                      { date: '01 Jan 2025', property: properties[0]?.address || '', desc: 'Rent received', amount: properties[0]?.rent || 0, status: 'received' },
                      { date: '01 Jan 2025', property: properties[1]?.address || '', desc: 'Rent received', amount: properties[1]?.rent || 0, status: 'received' },
                    ]
                  )}
                />
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Recent Transactions</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Date','Property','Description','Amount','Status'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '01 Feb 2025', property: '14 Caledonian Road', desc: 'Rent received', amount: '+£2,100', status: 'received', statusClass: 'badge-green' },
                    { date: '01 Feb 2025', property: '7 Barnsbury Street', desc: 'Rent received', amount: '+£3,200', status: 'received', statusClass: 'badge-green' },
                    { date: '15 Feb 2025', property: '22A Upper Street', desc: 'Rent overdue', amount: '£0', status: 'missed', statusClass: 'badge-red' },
                    { date: '28 Jan 2025', property: 'All Properties', desc: 'Management fee Jan', amount: '-£530', status: 'charged', statusClass: 'badge-slate' },
                    { date: '15 Jan 2025', property: '22A Upper Street', desc: 'Rent overdue', amount: '£0', status: 'missed', statusClass: 'badge-red' },
                    { date: '28 Dec 2024', property: 'All Properties', desc: 'Management fee Dec', amount: '-£530', status: 'charged', statusClass: 'badge-slate' },
                  ].map((tx, i) => (
                    <tr key={i}>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', color: '#64748b' }}>{tx.date}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', fontWeight: 500, color: '#334155' }}>{tx.property}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', color: '#334155' }}>{tx.desc}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', fontWeight: 700, color: tx.amount.startsWith('+') ? '#10b981' : tx.amount === '£0' ? '#dc2626' : '#334155' }}>{tx.amount}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}><span className={`badge ${tx.statusClass}`}>{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPLIANCE */}
        {tab === 'compliance' && (
          <div>
            <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>Your compliance certificates managed by Harrington & Co. We will contact you in advance of any renewals required.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {properties.map(p => {
                const compStatus = getComplianceStatus(p)
                const certs = Object.entries(p.compliance)
                const issues = certs.filter(([, c]) => ['expired','not_verified','overdue','expiring_soon'].includes(c.status))
                return (
                  <div key={p.id} style={{ background: 'white', borderRadius: 12, border: `1px solid ${compStatus === 'critical' ? '#fecaca' : compStatus === 'warning' ? '#fde68a' : '#e2e8f0'}`, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <Building2 size={16} color="#10b981" />
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', flex: 1 }}>{p.address}, {p.postcode}</p>
                      {compStatus === 'critical' && <span className="badge badge-red"><AlertTriangle size={10} /> Action Required</span>}
                      {compStatus === 'warning' && <span className="badge badge-amber"><Clock size={10} /> Renewal Due</span>}
                      {compStatus === 'compliant' && <span className="badge badge-green"><CheckCircle size={10} /> All Clear</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {certs.filter(([, c]) => c.status !== 'n/a').slice(0, 6).map(([key, cert]) => (
                        <div key={key} style={{ padding: '8px 10px', borderRadius: 7, background: ['expired','not_verified','overdue'].includes(cert.status) ? '#fef2f2' : cert.status === 'expiring_soon' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${['expired','not_verified','overdue'].includes(cert.status) ? '#fecaca' : cert.status === 'expiring_soon' ? '#fde68a' : '#bbf7d0'}` }}>
                          <p style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{key === 'gasSafety' ? 'Gas Safety' : key === 'eicr' ? 'EICR' : key === 'epc' ? 'EPC' : key === 'smokeAlarm' ? 'Smoke' : key === 'depositProtection' ? 'Deposit' : 'RTR'}</p>
                          <p style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2, color: ['expired','not_verified','overdue'].includes(cert.status) ? '#dc2626' : cert.status === 'expiring_soon' ? '#d97706' : '#10b981' }}>
                            {cert.status === 'valid' ? '✓ Valid' : cert.status === 'expired' ? '✗ Expired' : cert.status === 'expiring_soon' ? '! Expiring' : cert.status === 'overdue' ? '! Overdue' : 'Not Verified'}
                          </p>
                          {cert.expiry && <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{new Date(cert.expiry).toLocaleDateString('en-GB')}</p>}
                        </div>
                      ))}
                    </div>
                    {issues.length > 0 && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 7 }}>
                        <p style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>⚠ {issues.length} issue{issues.length !== 1 ? 's' : ''} require attention — your property manager has been notified</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MAINTENANCE */}
        {tab === 'maintenance' && (
          <div>
            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
                <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, fontSize: 16, color: '#334155' }}>No open maintenance jobs</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {jobs.map(job => {
                  const priorityColor = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }
                  const property = properties.find(p => p.id === job.propertyId)
                  return (
                    <div key={job.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', borderLeft: `4px solid ${priorityColor[job.priority]}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{job.title}</p>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${priorityColor[job.priority]}15`, color: priorityColor[job.priority], textTransform: 'capitalize' }}>{job.priority}</span>
                          </div>
                          <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>{property?.address} · Reported {job.reportedDate}</p>
                          <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{job.description}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: '#64748b' }}>Est. £{job.estimatedCost || '—'}</p>
                          <span className={`badge ${job.status === 'completed' ? 'badge-green' : job.status === 'assigned' || job.status === 'in_progress' ? 'badge-blue' : 'badge-amber'}`} style={{ marginTop: 4, display: 'inline-block' }}>{job.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES */}
        {tab === 'messages' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Conversations</div>
              {[
                { name: 'Priya Sharma', role: 'Property Manager', msg: 'Gas Safety renewal booked for 14 March', time: '2h ago', unread: true },
                { name: 'Chris Ford', role: 'Maintenance', msg: 'Roof repair completed at No.22', time: 'Yesterday', unread: false },
                { name: 'Harrington & Co', role: 'Agency', msg: 'Your February statement is ready', time: '3 days ago', unread: false },
              ].map(conv => (
                <div key={conv.name} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: conv.unread ? '#f0fdf4' : 'white', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 11, color: '#64748b' }}>{conv.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{conv.name}</p>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{conv.time}</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{conv.msg}</p>
                  </div>
                  {conv.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Priya Sharma — Property Manager</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>London Central Branch</p>
              </div>
              <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { from: 'agency', text: "Hi Robert, just a heads up that the Gas Safety Certificate at 14 Caledonian Road is due for renewal in April. I've contacted Capital Gas Services to arrange access — can you confirm the tenant is happy with a 14 March appointment?", time: '10:24' },
                  { from: 'me', text: "Yes, that's fine with me. Please go ahead and book it in.", time: '11:02' },
                  { from: 'agency', text: "Great, I've confirmed with the engineer. They'll attend on 14 March between 9am-12pm. I'll send confirmation to the tenant today.", time: '11:15' },
                ].map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: msg.from === 'me' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: msg.from === 'me' ? '#10b981' : '#f1f5f9', color: msg.from === 'me' ? 'white' : '#334155', fontSize: 13, lineHeight: 1.6 }}>
                      <p>{msg.text}</p>
                      <p style={{ fontSize: 10.5, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                <input placeholder="Type a message…" style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                <button style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 9, padding: '0 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>Send</button>
              </div>
            </div>
          </div>
        )}

        {(tab === 'inspections' || tab === 'documents') && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: '#334155' }}>
              {tab === 'inspections' ? 'Your inspections are managed by Harrington & Co' : 'All your documents are stored securely'}
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Contact your property manager for details.</p>
          </div>
        )}
      </div>
    </div>
  )
}
