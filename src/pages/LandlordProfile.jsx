import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, User, Wrench, ShieldCheck, FileText,
  MessageSquare, Mail, Phone, Edit2, Plus, Archive, RotateCcw,
  CheckCircle, AlertTriangle, Clock, ChevronRight, Download, Upload,
  Star, PoundSterling, BarChart3, Zap, X
} from 'lucide-react'
import {
  getLandlordById, getLandlordProperties, getLandlordMaintenance,
  getLandlordComplianceIssues, getLandlordStats, getLandlordActivityLog,
  addLandlordActivity, archiveLandlord, unarchiveLandlord,
  getArchivedLandlordIds, ACTIVITY_ICONS,
} from '../lib/landlordStore'
import { getEffectiveRent, getJobStatuses } from '../lib/propertyOverrides'
import { getTenantById, getComplianceStatus } from '../data/mockData'
import AddEditLandlordModal from '../components/AddEditLandlordModal'
import DraftEmailModal from '../components/DraftEmailModal'
import StatementPreviewModal from '../components/StatementPreviewModal'

function TabBtn({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', color: active ? '#10b981' : '#64748b', borderBottom: `2px solid ${active ? '#10b981' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      {label}
      {badge ? <span style={{ background: active ? '#10b981' : '#e2e8f0', color: active ? 'white' : '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>{badge}</span> : null}
    </button>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    active:    { label: 'Active',           class: 'badge-green' },
    attention: { label: 'Attention Needed', class: 'badge-amber' },
    archived:  { label: 'Archived',         class: 'badge-slate' },
  }[status] || { label: status, class: 'badge-slate' }
  return <span className={`badge ${cfg.class}`}>{cfg.label}</span>
}

const PRIORITY_COLOR = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }

export default function LandlordProfile() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [tab, setTab]           = useState('overview')
  const [landlord, setLandlord] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showEmail, setShowEmail]       = useState(false)
  const [showStatement, setShowStatement] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [noteInput, setNoteInput]   = useState('')
  const [activityLog, setActivityLog] = useState([])
  const [toast, setToast]           = useState('')
  const [docToast, setDocToast]     = useState('')

  const showToast  = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = () => {
    const l = getLandlordById(id)
    setLandlord(l)
    setActivityLog(getLandlordActivityLog(id))
  }

  useEffect(() => { load() }, [id])

  if (!landlord) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#64748b', fontSize: 15 }}>Landlord not found.</p>
      <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/landlords')}>← Back to Landlords</button>
    </div>
  )

  const properties   = getLandlordProperties(id)
  const maintenance  = getLandlordMaintenance(id)
  const compIssues   = getLandlordComplianceIssues(id)
  const stats        = getLandlordStats(id)
  const isArchived   = getArchivedLandlordIds().includes(id)
  const jobStatuses  = getJobStatuses()

  const getEffectiveStatus = (job) => jobStatuses[job.id]?.status ?? job.status

  const handleAddNote = () => {
    if (!noteInput.trim()) return
    const entry = addLandlordActivity(id, { type: 'note', text: noteInput.trim() })
    setActivityLog(prev => [entry, ...prev])
    setNoteInput('')
    showToast('Note added')
  }

  const handleArchive = () => {
    archiveLandlord(id)
    setShowArchiveConfirm(false)
    load()
    showToast(isArchived ? 'Landlord restored' : 'Landlord archived')
  }

  const DOCS = [
    { name: 'Management Agreement', icon: '📋', date: landlord.createdAt ? new Date(landlord.createdAt).toLocaleDateString('en-GB') : '—', type: 'PDF' },
    { name: 'Landlord ID / Verification', icon: '🪪', date: '—', type: 'PDF' },
    { name: 'Insurance Certificate', icon: '🛡️', date: '—', type: 'PDF' },
    ...properties.map(p => ({ name: `Property Documents — ${p.address.split(',')[0]}`, icon: '🏠', date: '—', type: 'Folder' })),
  ]

  const statusColor = { active: '#10b981', attention: '#d97706', archived: '#64748b' }
  const currentStatus = isArchived ? 'archived' : (stats.criticalCompliance > 0 ? 'attention' : 'active')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
        <button onClick={() => navigate('/landlords')} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
          <ArrowLeft size={16} color="#64748b" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                  {landlord.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>{landlord.name}</h1>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    <span className={`badge ${landlord.type === 'Investor' ? 'badge-purple' : landlord.type === 'Portfolio landlord' ? 'badge-blue' : 'badge-slate'}`}>{landlord.type || 'Individual'}</span>
                    <StatusBadge status={currentStatus} />
                    {landlord.isCustom && <span className="badge badge-green" style={{ fontSize: 10 }}>Added</span>}
                    {landlord.isDemo && <span className="badge badge-slate" style={{ fontSize: 10 }}>Demo</span>}
                    {landlord.managementFee && <span style={{ fontSize: 12, color: '#64748b' }}>{landlord.managementFee}% fee</span>}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0 }}>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowEmail(true)}><Mail size={13} /> Email</button>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => { setShowEdit(true) }}><Edit2 size={13} /> Edit</button>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigate('/properties', { state: { openWizard: true, landlordId: id } })}><Plus size={13} /> Add Property</button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Properties', value: stats.totalProperties, sub: `${stats.letProperties} let · ${stats.voidProperties} void`, icon: Building2, color: '#10b981' },
          { label: 'Monthly Rent', value: `£${stats.totalRent.toLocaleString()}`, sub: `Est. net £${Math.round(stats.totalRent * (1 - (landlord.managementFee||10)/100)).toLocaleString()}`, icon: PoundSterling, color: '#6366f1' },
          { label: 'Open Jobs', value: stats.openMaintenance, sub: 'maintenance', icon: Wrench, color: stats.openMaintenance > 0 ? '#d97706' : '#10b981' },
          { label: 'Compliance', value: stats.complianceIssues, sub: `${stats.criticalCompliance} critical`, icon: ShieldCheck, color: stats.criticalCompliance > 0 ? '#dc2626' : '#10b981' },
          { label: 'Balance', value: `£${(landlord.balance || 0).toLocaleString()}`, sub: 'account', icon: BarChart3, color: '#0284c7' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <s.icon size={13} color={s.color} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', paddingLeft: 4, overflowX: 'auto' }}>
          <TabBtn label="Overview"    active={tab==='overview'}    onClick={() => setTab('overview')} />
          <TabBtn label="Properties"  active={tab==='properties'}  onClick={() => setTab('properties')}  badge={stats.totalProperties || null} />
          <TabBtn label="Maintenance" active={tab==='maintenance'} onClick={() => setTab('maintenance')} badge={stats.openMaintenance || null} />
          <TabBtn label="Compliance"  active={tab==='compliance'}  onClick={() => setTab('compliance')}  badge={stats.complianceIssues || null} />
          <TabBtn label="Documents"   active={tab==='documents'}   onClick={() => setTab('documents')} />
          <TabBtn label="Activity"    active={tab==='activity'}    onClick={() => setTab('activity')}    badge={activityLog.length || null} />
        </div>

        <div style={{ padding: 24 }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 14 }}>Contact Details</p>
                {[
                  ['Email',             landlord.email ? <a href={`mailto:${landlord.email}`} style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>{landlord.email}</a> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>],
                  ['Phone',             landlord.phone ? <a href={`tel:${landlord.phone}`} style={{ color: '#334155', textDecoration: 'none' }}>{landlord.phone}</a> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>],
                  ['Address',           landlord.address || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>],
                  ['Preferred Contact', landlord.preferredContact || 'Email'],
                  ['Portfolio Type',    landlord.type || 'Individual'],
                  ['Management Fee',    `${landlord.managementFee || 10}%`],
                  ['Statement Freq.',   landlord.statementFrequency || 'Monthly'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f8fafc', alignItems: 'flex-start' }}>
                    <span style={{ width: 130, fontSize: 13, color: '#94a3b8', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
                {landlord.notes && (
                  <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 5 }}>Notes</p>
                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{landlord.notes}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Quick actions */}
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>Actions</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Draft Email',       icon: Mail,         action: () => setShowEmail(true) },
                    { label: 'Statement Preview', icon: Download,     action: () => setShowStatement(true) },
                    { label: 'Edit Details',      icon: Edit2,        action: () => setShowEdit(true) },
                    { label: 'Add Property',      icon: Building2,    action: () => navigate('/properties') },
                  ].map(a => (
                    <button key={a.label} onClick={a.action}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#334155', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#10b981'; e.currentTarget.style.background='#f0fdf4' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='white' }}>
                      <a.icon size={14} color="#10b981" />
                      {a.label}
                    </button>
                  ))}
                </div>

                {/* Add note */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 8 }}>Add Note</p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="Note about this landlord… (Enter)"
                      style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
                    <button className="btn-secondary" style={{ fontSize: 12, flexShrink: 0 }} onClick={handleAddNote}>
                      <MessageSquare size={12} /> Add
                    </button>
                  </div>
                </div>

                {/* Recent activity */}
                {activityLog.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 8 }}>Recent Activity</p>
                    {activityLog.slice(0, 3).map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                        <span style={{ fontSize: 14 }}>{ACTIVITY_ICONS[e.type] || ACTIVITY_ICONS.default}</span>
                        <div>
                          <p style={{ fontSize: 12.5, color: '#334155' }}>{e.text}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{e.author} · {e.date}</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setTab('activity')} style={{ fontSize: 12, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }}>View all activity →</button>
                  </div>
                )}

                {/* Archive */}
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  {!showArchiveConfirm ? (
                    <button onClick={() => setShowArchiveConfirm(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: `1px solid ${isArchived ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '8px 14px', color: isArchived ? '#16a34a' : '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
                      {isArchived ? <><RotateCcw size={13} /> Restore Landlord</> : <><Archive size={13} /> Archive Landlord</>}
                    </button>
                  ) : (
                    <div style={{ background: isArchived ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isArchived ? '#bbf7d0' : '#fecaca'}`, borderRadius: 9, padding: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isArchived ? '#065f46' : '#991b1b', marginBottom: 8 }}>
                        {isArchived ? 'Restore this landlord?' : 'Archive this landlord?'}
                      </p>
                      {!isArchived && stats.totalProperties > 0 && (
                        <p style={{ fontSize: 12, color: '#b91c1c', marginBottom: 8 }}>
                          ⚠ This landlord has {stats.totalProperties} linked {stats.totalProperties === 1 ? 'property' : 'properties'}. Archive is allowed in demo, but production would require reassignment.
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => setShowArchiveConfirm(false)}>Cancel</button>
                        <button style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: isArchived ? '#10b981' : '#dc2626', color: 'white' }} onClick={handleArchive}>
                          {isArchived ? 'Yes, Restore' : 'Yes, Archive'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PROPERTIES ── */}
          {tab === 'properties' && (
            <div>
              {properties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
                  <Building2 size={40} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontWeight: 700, color: '#64748b', fontSize: 15 }}>No properties linked</p>
                  <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/properties')}>
                    <Plus size={13} /> Add Property
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {properties.map(p => {
                    const tenant    = getTenantById(p.tenantId)
                    const compStatus = getComplianceStatus(p)
                    const openJobs  = getLandlordMaintenance(id).filter(j => j.propertyId === p.id && getEffectiveStatus(j) !== 'completed').length
                    return (
                      <Link key={p.id} to={`/properties/${p.id}`}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', textDecoration: 'none', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor='#10b981'}
                        onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={16} color="#10b981" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.postcode} · {p.bedrooms}bd {p.type} · {tenant?.name || 'Vacant'}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>£{getEffectiveRent(p).toLocaleString()}/mo</p>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', marginTop: 4 }}>
                            <span className={`badge ${p.status === 'let' ? 'badge-green' : 'badge-amber'}`}>{p.status === 'let' ? 'Let' : 'Void'}</span>
                            {compStatus === 'critical' && <span className="badge badge-red">⚠ Compliance</span>}
                            {openJobs > 0 && <span className="badge badge-amber">{openJobs} jobs</span>}
                          </div>
                        </div>
                        <ChevronRight size={14} color="#cbd5e1" style={{ flexShrink: 0, alignSelf: 'center' }} />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MAINTENANCE ── */}
          {tab === 'maintenance' && (
            <div>
              {maintenance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12 }}>
                  <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontWeight: 700, color: '#64748b' }}>No maintenance issues</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {maintenance.map(job => {
                    const status = getEffectiveStatus(job)
                    const prop   = properties.find(p => p.id === job.propertyId)
                    const pc     = PRIORITY_COLOR[job.priority] || '#94a3b8'
                    return (
                      <Link key={job.id} to={`/properties/${job.propertyId}?tab=maintenance`}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', textDecoration: 'none', borderLeft: `4px solid ${pc}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{job.title}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{prop?.address} · Reported {job.reportedDate}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${pc}15`, color: pc, textTransform: 'capitalize' }}>{job.priority}</span>
                          <span className={`badge ${status === 'completed' ? 'badge-green' : status === 'on_hold' ? 'badge-red' : 'badge-amber'}`}>{status.replace('_',' ')}</span>
                          {status === 'on_hold' && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 7px', borderRadius: 8 }}>⚠ Waiting approval</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── COMPLIANCE ── */}
          {tab === 'compliance' && (
            <div>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Critical Issues', value: compIssues.filter(i => i.isCritical).length, color: '#dc2626', bg: '#fef2f2' },
                  { label: 'Expiring Soon', value: compIssues.filter(i => i.status === 'expiring_soon').length, color: '#d97706', bg: '#fffbeb' },
                  { label: 'Properties', value: properties.length, color: '#6366f1', bg: '#eef2ff' },
                  { label: 'Issues Total', value: compIssues.length, color: '#64748b', bg: '#f8fafc' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 9, padding: '12px 14px', border: `1px solid ${s.color}20` }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                    <p style={{ fontSize: 11.5, color: s.color, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {compIssues.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f0fdf4', borderRadius: 12 }}>
                  <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontWeight: 700, color: '#065f46' }}>All compliance certificates are valid</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {compIssues.map((issue, i) => (
                    <Link key={i} to={`/properties/${issue.propertyId}?tab=compliance`}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 9, border: `1px solid ${issue.isCritical ? '#fecaca' : '#fde68a'}`, background: issue.isCritical ? '#fef9f9' : '#fffef0', textDecoration: 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: issue.isCritical ? '#dc2626' : '#f59e0b', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{issue.cert}</p>
                        <p style={{ fontSize: 11.5, color: '#64748b' }}>{issue.address}, {issue.postcode}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className={`badge ${issue.isCritical ? 'badge-red' : 'badge-amber'}`}>{issue.status?.replace('_',' ')}</span>
                        {issue.expiry && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{new Date(issue.expiry).toLocaleDateString('en-GB')}</p>}
                      </div>
                      <ChevronRight size={13} color="#cbd5e1" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {tab === 'documents' && (
            <div>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 12.5, color: '#64748b' }}>Document placeholders — preview only in demo · real storage needs Supabase Storage</p>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: '#10b981', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Upload size={13} /> Upload
                  <input type="file" style={{ display: 'none' }} onChange={() => { setDocToast('Upload placeholder — real storage needs Supabase Storage'); setTimeout(() => setDocToast(''), 3000) }} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {DOCS.map((doc, i) => (
                  <div key={i} style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{doc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{doc.type} · {doc.date}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#64748b' }}
                          onClick={() => { setDocToast('Preview only in demo · real download needs Supabase Storage'); setTimeout(() => setDocToast(''), 3000); addLandlordActivity(id, { type: 'document', text: `Document viewed: ${doc.name}` }) }}>
                          View
                        </button>
                        <button style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#64748b' }}
                          onClick={() => { setDocToast('Upload placeholder — real storage needs Supabase Storage'); setTimeout(() => setDocToast(''), 3000) }}>
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {docToast && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12.5, color: '#92400e' }}>
                  ⚠ {docToast}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === 'activity' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a note… (Enter)"
                  style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
                <button className="btn-secondary" style={{ fontSize: 13, flexShrink: 0 }} onClick={handleAddNote}>
                  <MessageSquare size={13} /> Add Note
                </button>
              </div>
              {activityLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>No activity recorded yet</p>
                  <p style={{ fontSize: 12.5, marginTop: 4 }}>Actions like editing details, drafting emails and adding notes are logged here.</p>
                </div>
              ) : (
                <div>
                  {activityLog.map((entry, i) => (
                    <div key={entry.id || i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                        {ACTIVITY_ICONS[entry.type] || ACTIVITY_ICONS.default}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{entry.text}</p>
                        <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{entry.author} · {entry.date}{entry.time ? ` at ${entry.time}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '11px 22px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, zIndex: 80, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <CheckCircle size={15} color="#10b981" /> {toast}
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <AddEditLandlordModal
          landlord={landlord}
          onSave={() => { load(); showToast('Landlord updated') }}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showEmail && (
        <DraftEmailModal landlord={landlord} properties={properties} onClose={() => { setShowEmail(false); load() }} />
      )}
      {showStatement && (
        <StatementPreviewModal landlord={landlord} properties={properties} onClose={() => { setShowStatement(false); load() }} />
      )}
    </div>
  )
}
