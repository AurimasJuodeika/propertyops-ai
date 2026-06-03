import { useState } from 'react'
import {
  Home, PoundSterling, Wrench, FileText, Bell, LogOut, CheckCircle,
  AlertTriangle, Clock, Plus, MessageSquare, Calendar, Upload,
  ChevronRight, Phone, Mail, Shield, Camera
} from 'lucide-react'
import { TENANTS, TENANCIES, PROPERTIES, MAINTENANCE_JOBS, getPropertyById } from '../data/mockData'

const DEMO_TENANT = TENANTS[0] // Alice Johnson — 14 Caledonian Road

export default function TenantPortal({ onExit }) {
  const [tab, setTab] = useState('home')
  const [showReportIssue, setShowReportIssue] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDesc, setIssueDesc] = useState('')
  const [issuePriority, setIssuePriority] = useState('routine')
  const [submitted, setSubmitted] = useState(false)

  const tenant = DEMO_TENANT
  const tenancy = TENANCIES.find(t => t.tenantId === tenant.id)
  const property = getPropertyById(tenant.propertyId)
  const myJobs = MAINTENANCE_JOBS.filter(j => j.propertyId === tenant.propertyId)

  const daysToEnd = tenancy ? Math.round((new Date(tenancy.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0
  const monthsLeft = Math.floor(daysToEnd / 30)

  const NAV = [
    { id: 'home', icon: Home, label: 'My Home' },
    { id: 'payments', icon: PoundSterling, label: 'Payments' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 210, background: '#0f172a', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={14} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 12.5 }}>Tenant Portal</p>
              <p style={{ color: '#475569', fontSize: 10.5 }}>Harrington & Co</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12, marginBottom: 6 }}>
              {tenant.name.split(' ').map(w => w[0]).join('').slice(0,2)}
            </div>
            <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{tenant.name}</p>
            <p style={{ color: '#475569', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property?.address}</p>
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
      <div style={{ flex: 1, padding: 28, maxWidth: 860 }}>
        {/* MY HOME */}
        {tab === 'home' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #064e3b)', borderRadius: 16, padding: '28px', color: 'white', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Home size={24} color="#10b981" />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.3px', marginBottom: 4 }}>Hi {tenant.name.split(' ')[0]} 👋</h1>
                  <p style={{ color: '#94a3b8', fontSize: 13.5 }}>{property?.address}, {property?.postcode}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    <span style={{ fontSize: 13, color: '#6ee7b7' }}>✓ Tenancy active</span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{monthsLeft} months remaining</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Next Rent Due', value: '1 Mar 2025', sub: `£${tenancy?.monthlyRent.toLocaleString()}`, icon: PoundSterling, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Tenancy Ends', value: tenancy ? new Date(tenancy.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', sub: `${monthsLeft} months`, icon: Calendar, color: '#6366f1', bg: '#eef2ff' },
                { label: 'Open Issues', value: myJobs.filter(j => j.status !== 'completed').length, sub: myJobs.filter(j => j.status === 'completed').length + ' completed', icon: Wrench, color: '#d97706', bg: '#fffbeb' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>{s.value}</p>
                      <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{s.sub}</p>
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={16} color={s.color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { icon: Wrench, label: 'Report an Issue', color: '#d97706', action: () => { setTab('maintenance'); setShowReportIssue(true) } },
                { icon: PoundSterling, label: 'View Payments', color: '#10b981', action: () => setTab('payments') },
                { icon: FileText, label: 'My Documents', color: '#6366f1', action: () => setTab('documents') },
                { icon: MessageSquare, label: 'Contact Agency', color: '#0284c7', action: () => setTab('messages') },
              ].map(a => (
                <button key={a.label} onClick={a.action}
                  style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.icon size={17} color={a.color} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', textAlign: 'center' }}>{a.label}</span>
                </button>
              ))}
            </div>

            {/* Your property manager */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Your Property Manager</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 11, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>PS</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>Priya Sharma</p>
                  <p style={{ fontSize: 12.5, color: '#64748b' }}>Property Manager · London Central</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ width: 36, height: 36, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Phone size={15} color="#10b981" />
                  </button>
                  <button onClick={() => setTab('messages')} style={{ width: 36, height: 36, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <MessageSquare size={15} color="#10b981" />
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: '#64748b' }}>📞 020 7123 4567 · 🕐 Mon–Fri 9am–5:30pm</p>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>📧 priya@harrington.co.uk</p>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Payments</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Your rent history and upcoming payments</p>

            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>NEXT PAYMENT DUE</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>£{tenancy?.monthlyRent.toLocaleString()}</p>
                  <p style={{ fontSize: 13, color: '#64748b' }}>Due 1 March 2025 · via Standing Order</p>
                </div>
                <div style={{ text: 'right' }}>
                  <span className="badge badge-green" style={{ fontSize: 12, padding: '4px 10px' }}>Auto-pay active</span>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6 }}>Standing Order set up ✓</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Monthly Rent', value: `£${tenancy?.monthlyRent.toLocaleString()}` },
                  { label: 'Deposit Paid', value: `£${tenancy?.depositAmount.toLocaleString()}` },
                  { label: 'Deposit Scheme', value: tenancy?.depositScheme },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 3 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Payment History</div>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Date','Amount','Method','Status'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '01 Feb 2025', amount: `£${tenancy?.monthlyRent.toLocaleString()}`, method: 'Standing Order', status: 'Received', cls: 'badge-green' },
                    { date: '01 Jan 2025', amount: `£${tenancy?.monthlyRent.toLocaleString()}`, method: 'Standing Order', status: 'Received', cls: 'badge-green' },
                    { date: '01 Dec 2024', amount: `£${tenancy?.monthlyRent.toLocaleString()}`, method: 'Standing Order', status: 'Received', cls: 'badge-green' },
                    { date: '01 Nov 2024', amount: `£${tenancy?.monthlyRent.toLocaleString()}`, method: 'Standing Order', status: 'Received', cls: 'badge-green' },
                    { date: '01 Oct 2024', amount: `£${tenancy?.monthlyRent.toLocaleString()}`, method: 'Standing Order', status: 'Received', cls: 'badge-green' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', color: '#64748b' }}>{row.date}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', fontWeight: 700, color: '#0f172a' }}>{row.amount}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', color: '#64748b' }}>{row.method}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}><span className={`badge ${row.cls}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MAINTENANCE */}
        {tab === 'maintenance' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Maintenance</h1>
                <p style={{ fontSize: 13, color: '#64748b' }}>Report issues and track repair progress</p>
              </div>
              <button className="btn-primary" onClick={() => setShowReportIssue(true)}><Plus size={13} /> Report an Issue</button>
            </div>

            {myJobs.length === 0 && !showReportIssue ? (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 48, textAlign: 'center' }}>
                <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: '#334155' }}>No maintenance issues on record</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Report a new issue using the button above</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myJobs.map(job => {
                  const statusConfig = { new: { color: '#6366f1', bg: '#eef2ff', label: 'Received' }, triaged: { color: '#0284c7', bg: '#eff6ff', label: 'Being reviewed' }, assigned: { color: '#d97706', bg: '#fffbeb', label: 'Contractor assigned' }, in_progress: { color: '#10b981', bg: '#f0fdf4', label: 'In progress' }, completed: { color: '#10b981', bg: '#f0fdf4', label: 'Completed' }, on_hold: { color: '#64748b', bg: '#f8fafc', label: 'On hold' } }
                  const sc = statusConfig[job.status] || statusConfig.new
                  const priorityColor = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }
                  return (
                    <div key={job.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px', borderLeft: `4px solid ${priorityColor[job.priority]}` }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{job.title}</p>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${priorityColor[job.priority]}15`, color: priorityColor[job.priority], textTransform: 'capitalize' }}>{job.priority}</span>
                          </div>
                          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>{job.description}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8' }}>Reported {job.reportedDate}</p>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{ padding: '6px 12px', borderRadius: 20, background: sc.bg, marginBottom: 6 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{sc.label}</p>
                          </div>
                          {job.status !== 'completed' && <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            {['•', '•', '•', '•', '•'].map((_, i) => {
                              const stepsDone = ['new','triaged','assigned','in_progress','completed'].indexOf(job.status)
                              return <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= stepsDone ? sc.color : '#e2e8f0' }} />
                            })}
                          </div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Report issue form */}
            {showReportIssue && !submitted && (
              <div style={{ marginTop: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Report a Maintenance Issue</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: 6 }}>Issue Title *</label>
                    <input value={issueTitle} onChange={e => setIssueTitle(e.target.value)}
                      placeholder="e.g. Boiler not working, Leaking tap"
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 14px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: 6 }}>Description</label>
                    <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)}
                      placeholder="Please describe the issue in detail…" rows={4}
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 14px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: 8 }}>Priority</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { value: 'emergency', label: '🚨 Emergency', desc: 'Unsafe / no heat/water' },
                        { value: 'urgent', label: '⚡ Urgent', desc: 'Needs fixing this week' },
                        { value: 'routine', label: '🔧 Routine', desc: 'Non-urgent repair' },
                      ].map(p => (
                        <button key={p.value} onClick={() => setIssuePriority(p.value)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                            border: issuePriority === p.value ? `2px solid ${p.value === 'emergency' ? '#dc2626' : p.value === 'urgent' ? '#d97706' : '#10b981'}` : '2px solid #e2e8f0',
                            background: issuePriority === p.value ? (p.value === 'emergency' ? '#fef2f2' : p.value === 'urgent' ? '#fffbeb' : '#f0fdf4') : 'white'
                          }}>
                          <p style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</p>
                          <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ border: '2px dashed #e2e8f0', borderRadius: 9, padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                    <Camera size={20} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
                    <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Tap to add photos (optional)</p>
                    <p style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 2 }}>JPG, PNG up to 10MB each</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowReportIssue(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                    <button onClick={() => { if (issueTitle) { setSubmitted(true); setShowReportIssue(false) } }}
                      className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Submit Report</button>
                  </div>
                </div>
              </div>
            )}

            {submitted && (
              <div style={{ marginTop: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: '#065f46' }}>Issue reported successfully</p>
                <p style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>Your property manager will review it and respond within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="btn-primary" style={{ marginTop: 14 }}>Report Another Issue</button>
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === 'documents' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>My Documents</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { name: 'Tenancy Agreement', date: '01 Feb 2024', type: 'PDF', size: '1.2 MB', icon: '📋' },
                { name: 'Check-In Inventory', date: '01 Feb 2024', type: 'PDF', size: '4.5 MB', icon: '🏠' },
                { name: 'Deposit Certificate', date: '01 Feb 2024', type: 'PDF', size: '220 KB', icon: '🛡️' },
                { name: 'EPC Certificate', date: '01 Jun 2023', type: 'PDF', size: '890 KB', icon: '🌿' },
                { name: 'Gas Safety Record', date: '15 Apr 2024', type: 'PDF', size: '340 KB', icon: '🔥' },
                { name: 'How to Rent Guide', date: '01 Feb 2024', type: 'PDF', size: '2.8 MB', icon: '📖' },
              ].map(doc => (
                <div key={doc.name} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{doc.icon}</div>
                  <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', marginBottom: 4 }}>{doc.name}</p>
                  <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{doc.date} · {doc.type} · {doc.size}</p>
                  <button style={{ marginTop: 10, background: 'none', border: 'none', color: '#10b981', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ↓ Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {tab === 'messages' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>Messages</h1>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 500 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11 }}>PS</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Priya Sharma</p>
                  <p style={{ fontSize: 12, color: '#10b981' }}>● Online</p>
                </div>
              </div>
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { from: 'agency', text: "Hi Alice, I hope you're well! Just to let you know that your mid-tenancy inspection is due in March. We'll be in touch to arrange a convenient time.", time: '10 Feb, 9:15' },
                  { from: 'me', text: "Hi Priya, thanks for the heads up. I work from home so most days are fine — just let me know!", time: '10 Feb, 10:32' },
                  { from: 'agency', text: "Perfect, thank you! I'll aim for around 10am on a weekday if that suits. I'll send a formal notice a week before. Let me know if you have any questions.", time: '10 Feb, 11:00' },
                ].map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: msg.from === 'me' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: msg.from === 'me' ? '#10b981' : '#f1f5f9', color: msg.from === 'me' ? 'white' : '#334155', fontSize: 13.5, lineHeight: 1.6 }}>
                      <p>{msg.text}</p>
                      <p style={{ fontSize: 10.5, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                <input placeholder="Type a message to your property manager…" style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 14px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }} />
                <button style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 9, padding: '0 20px', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit' }}>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
