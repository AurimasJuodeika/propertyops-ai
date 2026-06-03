import { useState } from 'react'
import { ClipboardCheck, Calendar, User, AlertTriangle, Plus, Clock, CheckCircle, ExternalLink, ChevronRight, MapPin, Save, X } from 'lucide-react'
import { INSPECTIONS, getPropertyById, PROPERTIES } from '../data/mockData'

const TYPE_COLORS = {
  'Mid-Tenancy': { color: '#2563eb', bg: '#dbeafe' },
  'Check-In':    { color: '#10b981', bg: '#d1fae5' },
  'Check-Out':   { color: '#7c3aed', bg: '#ede9fe' },
  'HMO':         { color: '#d97706', bg: '#fef3c7' },
}

export default function Inspections() {
  const [filter, setFilter]         = useState('All')
  const [showSchedule, setShowSchedule] = useState(false)
  const [schedForm, setSchedForm]   = useState({ propertyId:'', type:'Mid-Tenancy', date:'', inspectorName:'Ryan Blake' })
  const [customInspections, setCustomInspections] = useState(() => { try { return JSON.parse(localStorage.getItem('propertyops_custom_inspections')||'[]') } catch { return [] } })
  const [toast, setToast]           = useState('')
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const saveSchedule = () => {
    if (!schedForm.propertyId || !schedForm.date) { alert('Please select a property and date.'); return }
    const prop = PROPERTIES.find(p => p.id === schedForm.propertyId)
    const ins = { id:'ci_'+Date.now(), ...schedForm, address:`${prop?.address}, ${prop?.postcode}`, status:'scheduled', tenantName: prop?.tenantId ? 'Tenant' : 'Vacant', accessConfirmed:false }
    const updated = [ins, ...customInspections]
    setCustomInspections(updated)
    localStorage.setItem('propertyops_custom_inspections', JSON.stringify(updated))
    setSchedForm({ propertyId:'', type:'Mid-Tenancy', date:'', inspectorName:'Ryan Blake' })
    setShowSchedule(false)
    showToast(`Inspection scheduled for ${prop?.address}`)
  }

  const ALL_INSPECTIONS = [...INSPECTIONS, ...customInspections]
  const overdue    = ALL_INSPECTIONS.filter(i => i.status === 'overdue')
  const scheduled  = ALL_INSPECTIONS.filter(i => i.status === 'scheduled')
  const upcoming30 = scheduled.filter(i => {
    const days = (new Date(i.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24)
    return days <= 30
  })

  const filtered = filter === 'All' ? ALL_INSPECTIONS : ALL_INSPECTIONS.filter(i => i.status === filter)
  const sorted   = [...filtered].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Inspections</h1>
          <p className="page-subtitle">{INSPECTIONS.length} total · {overdue.length} overdue · {upcoming30.length} due within 30 days</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ExternalLink size={13} /> InspectPro
          </a>
          <button className="btn-primary" onClick={() => setShowSchedule(v => !v)}><Plus size={13} /> Schedule</button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#991b1b' }}>{overdue.length} inspections overdue</p>
            <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Overdue inspections weaken your position in deposit disputes. Earliest was due November 2024.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid-cols-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Overdue',           value: overdue.length,           color: '#dc2626', bg: '#fef2f2' },
          { label: 'Due Within 30 Days', value: upcoming30.length,        color: '#d97706', bg: '#fffbeb' },
          { label: 'Scheduled',         value: scheduled.length,         color: '#2563eb', bg: '#eff6ff' },
          { label: 'Access Unconfirmed', value: INSPECTIONS.filter(i => !i.accessConfirmed).length, color: '#64748b', bg: '#f8fafc' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}20` }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11.5, color: s.color, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Schedule inspection form */}
      {showSchedule && (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', padding:'16px 18px', marginBottom:16, boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Schedule Inspection</p>
            <button onClick={() => setShowSchedule(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18 }}>×</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', marginBottom:5 }}>Property *</label>
              <select value={schedForm.propertyId} onChange={e => setSchedForm(f => ({...f, propertyId:e.target.value}))}
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                <option value="">— Select property —</option>
                {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.address}, {p.postcode}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', marginBottom:5 }}>Type</label>
              <select value={schedForm.type} onChange={e => setSchedForm(f => ({...f, type:e.target.value}))}
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                {['Mid-Tenancy','Check-In','Check-Out','HMO'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', marginBottom:5 }}>Date *</label>
              <input type="date" value={schedForm.date} onChange={e => setSchedForm(f => ({...f, date:e.target.value}))}
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', marginBottom:5 }}>Inspector</label>
              <select value={schedForm.inspectorName} onChange={e => setSchedForm(f => ({...f, inspectorName:e.target.value}))}
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                <option>Ryan Blake</option>
                <option>Nadia Hassan</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:13 }} onClick={() => setShowSchedule(false)}>Cancel</button>
            <button className="btn-primary" style={{ flex:2, justifyContent:'center', fontSize:13 }} onClick={saveSchedule}>
              <Save size={13} /> Schedule Inspection
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', background:'#0f172a', color:'white', padding:'10px 20px', borderRadius:10, fontSize:13.5, fontWeight:600, zIndex:80, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle size={15} color="#10b981" /> {toast}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: `All (${INSPECTIONS.length})`, value: 'All' },
          { label: `Overdue (${overdue.length})`,   value: 'overdue' },
          { label: `Scheduled (${scheduled.length})`, value: 'scheduled' },
        ].map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: filter === tab.value ? 'none' : '1px solid #e2e8f0',
              background: filter === tab.value
                ? tab.value === 'overdue' ? '#dc2626' : '#0f172a'
                : 'white',
              color: filter === tab.value ? 'white' : '#374151', fontFamily: 'inherit',
            }}>{tab.label}</button>
        ))}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="card hide-mobile">
        <table className="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Scheduled Date</th>
              <th>Inspector</th>
              <th>Tenant</th>
              <th>Access</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(ins => {
              const tc = TYPE_COLORS[ins.type] || { color: '#64748b', bg: '#f8fafc' }
              return (
                <tr key={ins.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 12.5 }}>{ins.address.split(',')[0]}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{ins.address.split(',').slice(1).join(',').trim()}</p>
                  </td>
                  <td>
                    <span className="badge" style={{ background: tc.bg, color: tc.color }}>{ins.type}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, color: ins.status === 'overdue' ? '#dc2626' : '#334155', fontWeight: ins.status === 'overdue' ? 700 : 400 }}>
                      {new Date(ins.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {ins.status === 'overdue' && <div style={{ fontSize: 10.5, color: '#dc2626', fontWeight: 600 }}>OVERDUE</div>}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#334155' }}>{ins.inspectorName}</td>
                  <td style={{ fontSize: 12.5, color: '#334155' }}>{ins.tenantName}</td>
                  <td>
                    {ins.accessConfirmed
                      ? <span className="badge badge-green"><CheckCircle size={10} /> Confirmed</span>
                      : <span className="badge badge-amber"><Clock size={10} /> Pending</span>}
                  </td>
                  <td>
                    {ins.status === 'overdue'
                      ? <span className="badge badge-red">Overdue</span>
                      : <span className="badge badge-blue">Scheduled</span>}
                  </td>
                  <td>
                    {ins.status === 'overdue' && (
                      <a href="http://localhost:5173/inspections/new" target="_blank" rel="noopener noreferrer"
                        className="btn-primary" style={{ fontSize: 11, padding: '4px 8px', textDecoration: 'none' }}>
                        Start
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="mobile-card-list">
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{sorted.length} inspections</p>
        {sorted.map(ins => {
          const tc        = TYPE_COLORS[ins.type] || { color: '#64748b', bg: '#f8fafc' }
          const isOverdue = ins.status === 'overdue'
          const dateStr   = new Date(ins.scheduledDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

          return (
            <div key={ins.id} style={{
              background: 'white', borderRadius: 12,
              border: `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`,
              padding: '14px 16px',
              borderLeft: `4px solid ${isOverdue ? '#dc2626' : tc.color}`,
            }}>
              {/* Top row: address + status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ins.address.split(',')[0]}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ins.address.split(',').slice(1).join(',').trim()}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  <span className="badge" style={{ background: tc.bg, color: tc.color }}>{ins.type}</span>
                  {isOverdue
                    ? <span className="badge badge-red">Overdue</span>
                    : <span className="badge badge-blue">Scheduled</span>}
                </div>
              </div>

              {/* Detail row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: isOverdue ? '#fef2f2' : '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>Date</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isOverdue ? '#dc2626' : '#0f172a' }}>{dateStr}</p>
                  {isOverdue && <p style={{ fontSize: 10.5, color: '#dc2626', fontWeight: 600 }}>OVERDUE</p>}
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>Access</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {ins.accessConfirmed
                      ? <><CheckCircle size={13} color="#10b981" /><span style={{ fontSize: 12.5, fontWeight: 700, color: '#10b981' }}>Confirmed</span></>
                      : <><Clock size={13} color="#d97706" /><span style={{ fontSize: 12.5, fontWeight: 700, color: '#d97706' }}>Pending</span></>}
                  </div>
                </div>
              </div>

              {/* Bottom: inspector + tenant + action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid #f8fafc' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#94a3b8' }}>Inspector:</span> {ins.inspectorName}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#94a3b8' }}>Tenant:</span> {ins.tenantName}
                  </p>
                </div>
                {isOverdue && (
                  <a href="http://localhost:5173/inspections/new" target="_blank" rel="noopener noreferrer"
                    className="btn-primary" style={{ fontSize: 12.5, textDecoration: 'none', flexShrink: 0 }}>
                    Start Now
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* InspectPro integration banner */}
      <div style={{ marginTop: 20, background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClipboardCheck size={18} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 13.5 }}>InspectPro Integration</p>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>Completed inspections sync back here automatically with AI reports, photos and signatures.</p>
        </div>
        <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', flexShrink: 0, fontSize: 12.5 }}>
          <ExternalLink size={13} /> Open InspectPro
        </a>
      </div>
    </div>
  )
}
