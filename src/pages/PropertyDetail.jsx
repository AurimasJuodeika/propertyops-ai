import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, MapPin, User, Users, Wrench, ShieldCheck,
  ClipboardCheck, FileText, PoundSterling, AlertTriangle, CheckCircle,
  Clock, Zap, Edit2, Phone, Mail, ChevronRight, Flame, Leaf, Wind,
  Shield, CreditCard, Calendar, Camera, Upload, Download, X, Save,
  RefreshCw, Plus, ExternalLink
} from 'lucide-react'
import {
  PROPERTIES, getLandlordById, getTenantById, getTenancyByPropertyId,
  MAINTENANCE_JOBS, INSPECTIONS, getContractorById, getComplianceStatus
} from '../data/mockData'
import PDFButton from '../components/PDFButton'
import { generatePropertyReport } from '../lib/pdfExport'
import RentEditModal from '../components/RentEditModal'
import EditPropertyModal from '../components/EditPropertyModal'
import { getEffectiveRent, getEffectiveProperty, getPropertyOverrides, getRentHistory, getJobStatuses, setJobStatus, getEffectiveJobStatus, getInspectionOverrides, setInspectionOverride, getNewProperties, getAssignedTenantId, assignTenantToProperty, getTenantAssignments, getCustomTenants, createCustomTenant } from '../lib/propertyOverrides'
import { getPayments, calculateArrears } from '../lib/payments'
import { sendEmail } from '../lib/email'
import { TENANTS } from '../data/mockData'

// ─── Assign / Create Tenant Panel ────────────────────────────────────────────
function AssignTenantPanel({ property, currentTenant, onAssign, onClose }) {
  const [mode, setMode]       = useState(currentTenant ? 'manage' : 'search') // 'search' | 'create' | 'manage'
  const [query, setQuery]     = useState('')
  const [creating, setCreating] = useState(false)
  const [newTenant, setNewTenant] = useState({ name:'', email:'', phone:'', nationality:'British' })

  const allTenants = [...TENANTS, ...getCustomTenants()]
  const results    = query.length > 1
    ? allTenants.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.email.toLowerCase().includes(query.toLowerCase()))
    : []

  const handleCreate = () => {
    if (!newTenant.name || !newTenant.email) { alert('Name and email are required.'); return }
    const created = createCustomTenant({ ...newTenant, propertyId: property.id })
    assignTenantToProperty(property.id, created.id)
    onAssign(created)
    onClose()
  }

  const handleSelect = (t) => {
    assignTenantToProperty(property.id, t.id)
    onAssign(t)
    onClose()
  }

  const handleRemove = () => {
    if (!confirm('Remove tenant from this property?')) return
    assignTenantToProperty(property.id, null)
    onAssign(null)
    onClose()
  }

  const inputStyle = { width:'100%', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'10px 12px', fontSize:13.5, outline:'none', fontFamily:'inherit', color:'#0f172a', boxSizing:'border-box' }
  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.05em', marginBottom:5 }
  const focus = e => e.target.style.borderColor = '#10b981'
  const blur  = e => e.target.style.borderColor = '#e2e8f0'

  return (
    <div style={{ borderTop:'1px solid #f1f5f9', padding:'20px 24px', background:'#fafafa' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <p style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>
          {currentTenant ? 'Manage Tenant' : 'Assign Tenant'}
        </p>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
          <X size={16} />
        </button>
      </div>

      {/* Current tenant management */}
      {mode === 'manage' && currentTenant && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'white', borderRadius:10, border:'1px solid #e2e8f0', marginBottom:14 }}>
            <div style={{ width:38, height:38, borderRadius:9, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:13, flexShrink:0 }}>
              {currentTenant.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>{currentTenant.name}</p>
              <p style={{ fontSize:12, color:'#64748b' }}>{currentTenant.email} · {currentTenant.phone}</p>
            </div>
            <span className="badge badge-green">Current Tenant</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:13 }} onClick={() => setMode('search')}>
              <Users size={13} /> Replace Tenant
            </button>
            <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:13, color:'#dc2626', borderColor:'#fecaca' }} onClick={handleRemove}>
              <X size={13} /> Remove Tenant
            </button>
          </div>
        </div>
      )}

      {/* Search existing */}
      {mode === 'search' && (
        <div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Search existing tenants</label>
            <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
              placeholder="Name or email…"
              style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>

          {results.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
              {results.slice(0,5).map(t => (
                <button key={t.id} onClick={() => handleSelect(t)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#10b981'; e.currentTarget.style.background='#f0fdf4' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='white' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:11, flexShrink:0 }}>
                    {t.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:13.5, color:'#0f172a' }}>{t.name}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.email}</p>
                  </div>
                  {t.isCustom && <span className="badge badge-purple" style={{ flexShrink:0 }}>New</span>}
                  <ChevronRight size={13} color="#cbd5e1" />
                </button>
              ))}
            </div>
          )}

          {query.length > 1 && results.length === 0 && (
            <p style={{ fontSize:13, color:'#94a3b8', marginBottom:14, fontStyle:'italic' }}>No tenants found matching "{query}"</p>
          )}

          <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
            <button className="btn-primary" style={{ flex:1, justifyContent:'center', fontSize:13 }} onClick={() => setMode('create')}>
              <Plus size={13} /> Create New Tenant
            </button>
            {currentTenant && (
              <button className="btn-secondary" style={{ fontSize:13 }} onClick={() => setMode('manage')}>Cancel</button>
            )}
          </div>
        </div>
      )}

      {/* Create new tenant */}
      {mode === 'create' && (
        <div>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:14 }}>Create a new tenant and assign them to this property.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input value={newTenant.name} onChange={e => setNewTenant(t => ({ ...t, name:e.target.value }))}
                placeholder="e.g. James Smith" style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={newTenant.email} onChange={e => setNewTenant(t => ({ ...t, email:e.target.value }))}
                  placeholder="james@email.co.uk" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={newTenant.phone} onChange={e => setNewTenant(t => ({ ...t, phone:e.target.value }))}
                  placeholder="07700 900 000" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Nationality</label>
              <select value={newTenant.nationality} onChange={e => setNewTenant(t => ({ ...t, nationality:e.target.value }))} style={{ ...inputStyle, cursor:'pointer' }}>
                {['British','Irish','EU Pre-settled','EU Settled','Tier 2 Visa','Student Visa','Other'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:13 }} onClick={() => setMode('search')}>← Back</button>
            <button className="btn-primary" disabled={creating} style={{ flex:2, justifyContent:'center', fontSize:13 }} onClick={handleCreate}>
              <Save size={13} /> {creating ? 'Creating…' : 'Create & Assign Tenant'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const CERT_CONFIG = {
  epc:               { label: 'EPC',                icon: Leaf,        color: '#16a34a' },
  gasSafety:         { label: 'Gas Safety',         icon: Flame,       color: '#dc2626' },
  eicr:              { label: 'EICR',               icon: Shield,      color: '#d97706' },
  smokeAlarm:        { label: 'Smoke Alarms',       icon: Wind,        color: '#6366f1' },
  depositProtection: { label: 'Deposit Protection', icon: CreditCard,  color: '#0284c7' },
  rightToRent:       { label: 'Right to Rent',      icon: Shield,      color: '#7c3aed' },
}

const JOB_STATUSES = ['new','triaged','assigned','in_progress','completed','on_hold']
const JOB_STATUS_LABELS = { new:'New', triaged:'Triaged', assigned:'Assigned', in_progress:'In Progress', completed:'Completed', on_hold:'On Hold' }
const JOB_STATUS_BADGE  = { new:'badge-blue', triaged:'badge-purple', assigned:'badge-amber', in_progress:'badge-blue', completed:'badge-green', on_hold:'badge-slate' }
const PRIORITY_COLOR    = { emergency:'#dc2626', urgent:'#d97706', routine:'#10b981', cosmetic:'#94a3b8' }

function TabBtn({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ padding:'10px 18px', border:'none', background:'none', cursor:'pointer', fontSize:13.5, fontWeight:600, fontFamily:'inherit', color: active ? '#10b981' : '#64748b', borderBottom: active ? '2px solid #10b981' : '2px solid transparent', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
      {label}
      {badge ? <span style={{ background: active ? '#10b981' : '#e2e8f0', color: active ? 'white' : '#64748b', fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:8 }}>{badge}</span> : null}
    </button>
  )
}

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab]                   = useState('overview')
  const [editingRent, setEditingRent]     = useState(null)
  const [editingProperty, setEditingProperty] = useState(null)
  const [propertyData, setPropertyData] = useState(() => getEffectiveProperty(
    PROPERTIES.find(p => p.id === id) || getNewProperties().find(p => p.id === id) || {}
  ))
  const [rentOverride, setRentOverride] = useState(getPropertyOverrides())
  const [jobStatuses, setJobStatuses]   = useState(getJobStatuses())
  const [inspOverrides, setInspOverrides] = useState(getInspectionOverrides())
  const [payments, setPayments]         = useState([])
  const [aiText, setAiText]             = useState('')
  const [aiLoading, setAiLoading]       = useState(false)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [showAssignTenant, setShowAssignTenant] = useState(false)
  const [bookingCert, setBookingCert]   = useState(null)
  const [bookingEmail, setBookingEmail] = useState('')
  const [bookingSending, setBookingSending] = useState(false)
  const [bookingSent, setBookingSent]   = useState(false)
  const [downloadToast, setDownloadToast] = useState('')
  const handleDocDownload = (docName) => {
    setDownloadToast(docName)
    setTimeout(() => setDownloadToast(''), 2500)
  }

  const [uploadedDocs, setUploadedDocs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`propertyops_docs_${id}`) || '[]') } catch { return [] }
  })

  // Find in mock data OR in user-created new properties
  const property = PROPERTIES.find(p => p.id === id) || getNewProperties().find(p => p.id === id)
  if (!property) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <p style={{ color:'#64748b' }}>Property not found.</p>
      <button onClick={() => navigate('/properties')} className="btn-primary" style={{ marginTop:16 }}>← Back to Properties</button>
    </div>
  )

  const landlord = getLandlordById(property.landlordId)

  // Tenant in state so it re-renders immediately after assign/create
  const [tenant, setTenant] = useState(() => {
    const assignedId = getAssignedTenantId(property.id) || property.tenantId
    return [...TENANTS, ...getCustomTenants()].find(t => t.id === assignedId) || null
  })

  const tenancy = getTenancyByPropertyId(property.id)
  const jobs        = MAINTENANCE_JOBS.filter(j => j.propertyId === property.id)
  const inspections = INSPECTIONS.filter(i => i.propertyId === property.id)
  const compStatus  = getComplianceStatus(property)

  useEffect(() => {
    if (tenancy) getPayments(tenancy.id).then(setPayments)
  }, [tenancy?.id])

  const arrears = calculateArrears(payments)
  const openJobs = jobs.filter(j => getEffectiveJobStatus(j) !== 'completed')

  // ── AI Summary ──────────────────────────────────────────────────────────────
  const handleAISummary = async () => {
    setAiLoading(true); setAiText('')
    const issues = Object.entries(property.compliance)
      .filter(([,c]) => ['expired','not_verified','overdue','expiring_soon'].includes(c.status))
      .map(([k,c]) => `${k}: ${c.status}`)
    const prompt = `Write a concise property summary for a UK letting agency. Property: ${property.address}, ${property.postcode}. ${property.bedrooms} bed ${property.type}. Rent: £${getEffectiveRent(property).toLocaleString()}/mo. Status: ${property.status}. Branch: ${property.branch}. Tenant: ${tenant?.name || 'Vacant'}. Compliance issues: ${issues.length > 0 ? issues.join(', ') : 'None'}. Open maintenance: ${openJobs.length}. ${arrears > 0 ? `Rent arrears: £${arrears.toLocaleString()}.` : ''} In 3-4 sentences, summarise current status and any actions needed. Plain text only.`
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:300, messages:[{role:'user',content:prompt}] }) })
      const data = await res.json()
      setAiText(data.content?.[0]?.text || 'Failed to generate summary.')
    } catch(e) { setAiText('Error: ' + e.message) }
    setAiLoading(false)
  }

  // ── Status change ───────────────────────────────────────────────────────────
  const handleJobStatus = (jobId, status) => {
    setJobStatus(jobId, status)
    setJobStatuses(getJobStatuses())
  }

  // ── Reschedule inspection ───────────────────────────────────────────────────
  const handleReschedule = (insId) => {
    if (!rescheduleDate) { alert('Please pick a date.'); return }
    setInspectionOverride(insId, { scheduledDate: rescheduleDate, status: 'scheduled', accessConfirmed: false })
    setInspOverrides(getInspectionOverrides())
    setRescheduleId(null); setRescheduleDate('')
  }

  // ── Compliance booking ──────────────────────────────────────────────────────
  const handleBookRenewal = async () => {
    if (!bookingEmail) { alert('Please enter an email.'); return }
    setBookingSending(true)
    try {
      const certLabel = CERT_CONFIG[bookingCert.key]?.label || bookingCert.key
      await sendEmail({
        to: bookingEmail,
        subject: `${certLabel} Renewal Booking — ${property.address}`,
        message: `Dear Contractor,\n\nPlease book a ${certLabel} renewal at:\n\n${property.address}, ${property.postcode}\n\nThis certificate requires renewal. Please contact us to arrange access.\n\nHarrington & Co · 020 7123 4567`
      })
      setBookingSent(true); setTimeout(() => { setBookingSent(false); setBookingCert(null); setBookingEmail('') }, 3000)
    } catch(e) { alert('Failed: ' + e.message) }
    setBookingSending(false)
  }

  // ── Document upload ─────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    const newDoc = { name: file.name, size: (file.size / 1024).toFixed(0) + ' KB', date: new Date().toLocaleDateString('en-GB'), type: file.name.split('.').pop().toUpperCase() }
    const updated = [newDoc, ...uploadedDocs]
    setUploadedDocs(updated)
    localStorage.setItem(`propertyops_docs_${id}`, JSON.stringify(updated))
    e.target.value = ''
  }

  const riskColor = { critical:'#dc2626', warning:'#d97706', compliant:'#10b981', info:'#64748b' }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:24 }}>
        <button onClick={() => navigate('/properties')} style={{ width:36, height:36, borderRadius:9, border:'1px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:4 }}>
          <ArrowLeft size={16} color="#64748b" />
        </button>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', letterSpacing:'-0.3px' }}>{property.address}</h1>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:13, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}><MapPin size={13} />{property.postcode} · {property.branch}</span>
                <span className={`badge ${property.status === 'let' ? 'badge-green' : property.status === 'void' ? 'badge-amber' : 'badge-blue'}`}>{property.status === 'let' ? 'Let' : property.status === 'void' ? 'Void' : 'Available'}</span>
                <span style={{ fontSize:12.5, fontWeight:700, padding:'2px 8px', borderRadius:8, background:`${riskColor[compStatus]}15`, color:riskColor[compStatus] }}>
                  {compStatus === 'compliant' ? '✓ Compliant' : compStatus === 'critical' ? '⚠ Critical' : compStatus === 'warning' ? '⚠ Warning' : 'Void'}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              <button className="btn-secondary" onClick={e => setEditingProperty({ property, anchorRect: e.currentTarget.getBoundingClientRect() })}><Edit2 size={13} /> Edit Property</button>
              <button className="btn-secondary" onClick={e => setEditingRent({ property, anchorRect: e.currentTarget.getBoundingClientRect() })}><Edit2 size={13} /> Edit Rent</button>
              <PDFButton label="Property Report" onGenerate={() => generatePropertyReport(property, landlord, tenant, tenancy, jobs, inspections)} />
              <button className="btn-primary" onClick={handleAISummary} disabled={aiLoading}>
                <Zap size={13} /> {aiLoading ? 'Generating…' : 'AI Summary'}
              </button>
            </div>
          </div>
          {/* AI Summary output */}
          {(aiText || aiLoading) && (
            <div style={{ marginTop:12, padding:'14px 16px', background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:10, display:'flex', gap:12, alignItems:'flex-start' }}>
              <Zap size={14} color="#10b981" style={{ flexShrink:0, marginTop:2 }} />
              {aiLoading
                ? <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:14, height:14, border:'2px solid rgba(16,185,129,0.3)', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /><p style={{ color:'#64748b', fontSize:13 }}>Claude is analysing this property…</p></div>
                : <p style={{ color:'#e2e8f0', fontSize:13, lineHeight:1.7, flex:1 }}>{aiText}</p>}
              {aiText && <button onClick={() => setAiText('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', flexShrink:0 }}><X size={14} /></button>}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Monthly Rent', value:`£${getEffectiveRent(property).toLocaleString()}`, icon:PoundSterling, color:'#10b981' },
          { label:'Type',         value:`${property.bedrooms}bd ${property.type}`,         icon:Building2,    color:'#6366f1' },
          { label:'Landlord',     value:landlord?.name?.split(' ').slice(0,2).join(' ') || '—', icon:Users, color:'#0284c7' },
          { label:'Tenant',       value:tenant?.name?.split(' ')[0] || 'Vacant',           icon:User,         color:tenant ? '#10b981' : '#94a3b8' },
          { label:'Open Jobs',    value:openJobs.length,                                   icon:Wrench,       color:openJobs.length > 0 ? '#d97706' : '#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <s.icon size={14} color={s.color} />
              <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.label}</span>
            </div>
            <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', paddingLeft:4, overflowX:'auto' }}>
          <TabBtn label="Overview"    active={tab==='overview'}    onClick={() => setTab('overview')} />
          <TabBtn label="Compliance"  active={tab==='compliance'}  onClick={() => setTab('compliance')}
            badge={Object.values(property.compliance).filter(c => ['expired','not_verified','overdue','expiring_soon'].includes(c.status)).length || null} />
          <TabBtn label="Tenancy"     active={tab==='tenancy'}     onClick={() => setTab('tenancy')} />
          <TabBtn label="Maintenance" active={tab==='maintenance'} onClick={() => setTab('maintenance')}
            badge={openJobs.length || null} />
          <TabBtn label="Inspections" active={tab==='inspections'} onClick={() => setTab('inspections')} />
          <TabBtn label="Documents"   active={tab==='documents'}   onClick={() => setTab('documents')} />
        </div>

        <div style={{ padding:24 }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div>
                <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.06em', marginBottom:14 }}>Property Details</p>
                {[
                  ['Full Address', `${property.address}, ${property.city}, ${property.postcode}`],
                  ['Property Type', property.type],
                  ['Bedrooms', property.bedrooms],
                  ['Bathrooms', property.bathrooms],
                  ['Branch', property.branch],
                  ['Management', property.managementType === 'full' ? 'Full Management' : property.managementType === 'rent_collection' ? 'Rent Collection' : 'Let Only'],
                  ['Monthly Rent', `£${getEffectiveRent(property).toLocaleString()}${rentOverride[property.id]?.rent && rentOverride[property.id].rent !== property.rent ? ` (was £${property.rent.toLocaleString()})` : ''}`],
                  ['Last Inspection', property.lastInspection ? new Date(property.lastInspection).toLocaleDateString('en-GB') : 'None recorded'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display:'flex', padding:'9px 0', borderBottom:'1px solid #f8fafc' }}>
                    <span style={{ flex:1, fontSize:13, color:'#94a3b8' }}>{label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {/* Landlord */}
                <div style={{ background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', padding:16 }}>
                  <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.06em', marginBottom:12 }}>Landlord</p>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:12 }}>
                      {landlord?.name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
                    </div>
                    <div><p style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{landlord?.name}</p></div>
                  </div>
                  <a href={`mailto:${landlord?.email}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#334155', textDecoration:'none', marginBottom:5 }}><Mail size={12} color="#94a3b8" />{landlord?.email}</a>
                  <a href={`tel:${landlord?.phone}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#334155', textDecoration:'none' }}><Phone size={12} color="#94a3b8" />{landlord?.phone}</a>
                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:12 }}><Mail size={12} /> Email</button>
                    <button className="btn-primary" style={{ flex:1, justifyContent:'center', fontSize:12 }} onClick={handleAISummary}><Zap size={12} /> AI Update</button>
                  </div>
                </div>

                {/* Tenant */}
                {tenant ? (
                  <div style={{ background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', padding:16 }}>
                    <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.06em', marginBottom:12 }}>Tenant</p>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:12 }}>
                        {tenant.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                      </div>
                      <div><p style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{tenant.name}</p></div>
                    </div>
                    <a href={`mailto:${tenant.email}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#334155', textDecoration:'none', marginBottom:5 }}><Mail size={12} color="#94a3b8" />{tenant.email}</a>
                    <a href={`tel:${tenant.phone}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#334155', textDecoration:'none' }}><Phone size={12} color="#94a3b8" />{tenant.phone}</a>
                    {arrears > 0 && <div style={{ marginTop:10, padding:'8px 10px', background:'#fef2f2', borderRadius:7 }}><p style={{ fontSize:12, fontWeight:700, color:'#dc2626' }}>⚠ £{arrears.toLocaleString()} arrears</p></div>}
                  </div>
                ) : (
                  <div style={{ background:'#fffbeb', borderRadius:10, border:'1px solid #fde68a', padding:16, textAlign:'center' }}>
                    <AlertTriangle size={24} color="#d97706" style={{ margin:'0 auto 8px' }} />
                    <p style={{ fontWeight:700, color:'#92400e', fontSize:13.5 }}>Property is Void</p>
                    <p style={{ fontSize:12, color:'#b45309', marginTop:4 }}>No active tenant. Market to minimise void period.</p>
                    <button className="btn-primary" style={{ marginTop:10, width:'100%', justifyContent:'center', background:'#d97706', boxShadow:'none', fontSize:12 }} onClick={() => setTab('tenancy')}>
                      <Users size={12} /> Assign Tenant →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COMPLIANCE ── */}
          {tab === 'compliance' && (
            <div>
              {compStatus === 'critical' && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', display:'flex', gap:10, marginBottom:20 }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <p style={{ fontSize:13, fontWeight:600, color:'#991b1b' }}>Critical compliance failures — immediate action required</p>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {Object.entries(CERT_CONFIG).map(([key, config]) => {
                  const cert = property.compliance[key]
                  if (!cert) return null
                  const isBad  = ['expired','not_verified','overdue'].includes(cert.status)
                  const isWarn = cert.status === 'expiring_soon'
                  const Icon   = config.icon
                  return (
                    <div key={key} style={{ padding:16, borderRadius:10, border:`1.5px solid ${isBad ? '#fecaca' : isWarn ? '#fde68a' : '#e2e8f0'}`, background: isBad ? '#fef2f2' : isWarn ? '#fffbeb' : 'white' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
                        <div style={{ width:32, height:32, borderRadius:7, background:`${config.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon size={15} color={config.color} />
                        </div>
                        <span style={{ fontWeight:700, fontSize:13.5, color:'#0f172a', flex:1 }}>{config.label}</span>
                        {isBad && <span className="badge badge-red">⚠ {cert.status === 'not_verified' ? 'Not Verified' : 'Expired'}</span>}
                        {isWarn && <span className="badge badge-amber">Expiring Soon</span>}
                        {!isBad && !isWarn && cert.status !== 'n/a' && <span className="badge badge-green">✓ Valid</span>}
                        {cert.status === 'n/a' && <span className="badge badge-slate">N/A</span>}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:10 }}>
                        {cert.expiry && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:'#94a3b8' }}>Expiry</span><span style={{ fontWeight:600, color: isBad ? '#dc2626' : isWarn ? '#d97706' : '#334155' }}>{new Date(cert.expiry).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span></div>}
                        {cert.lastCheck && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:'#94a3b8' }}>Last Check</span><span style={{ fontWeight:600, color:'#334155' }}>{new Date(cert.lastCheck).toLocaleDateString('en-GB')}</span></div>}
                        {cert.engineer && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:'#94a3b8' }}>Engineer</span><span style={{ fontWeight:600, color:'#334155' }}>{cert.engineer}</span></div>}
                        {cert.scheme && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:'#94a3b8' }}>Scheme</span><span style={{ fontWeight:600, color:'#334155' }}>{cert.scheme}</span></div>}
                        {cert.grade && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:'#94a3b8' }}>EPC Grade</span><span style={{ fontWeight:800, color:'#0f172a', fontSize:18 }}>{cert.grade}</span></div>}
                      </div>

                      {/* Book renewal / action */}
                      {(isBad || isWarn) && cert.status !== 'n/a' && cert.status !== 'not_verified' && (
                        bookingCert?.key === key ? (
                          <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:10 }}>
                            <p style={{ fontSize:12, fontWeight:600, color:'#64748b', marginBottom:7 }}>Send booking request to contractor:</p>
                            <input value={bookingEmail} onChange={e => setBookingEmail(e.target.value)}
                              placeholder="contractor@email.co.uk"
                              style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'8px 10px', fontSize:12.5, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:8 }}
                              onFocus={e => e.target.style.borderColor='#10b981'}
                              onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                            <div style={{ display:'flex', gap:7 }}>
                              <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:12 }} onClick={() => setBookingCert(null)}>Cancel</button>
                              <button className="btn-primary" disabled={bookingSending} style={{ flex:2, justifyContent:'center', fontSize:12 }} onClick={handleBookRenewal}>
                                {bookingSent ? '✓ Sent!' : bookingSending ? 'Sending…' : <><Mail size={11} /> Send Booking</>}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn-primary" style={{ width:'100%', justifyContent:'center', fontSize:12, background: isBad ? '#dc2626' : '#d97706', boxShadow:'none' }}
                            onClick={() => { setBookingCert({ key }); setBookingEmail(cert.engineer ? '' : '') }}>
                            {isBad ? '⚡ Book Now — Urgent' : '📅 Schedule Renewal'}
                          </button>
                        )
                      )}
                      {cert.status === 'not_verified' && (
                        <button className="btn-primary" style={{ width:'100%', justifyContent:'center', fontSize:12, background:'#dc2626', boxShadow:'none' }}
                          onClick={() => navigate('/tenants')}>
                          Verify Right to Rent →
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── TENANCY ── */}
          {tab === 'tenancy' && (
            <div>
              {tenancy ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.06em', marginBottom:12 }}>Tenancy Details</p>
                    {[
                      ['Status', <span className={`badge ${tenancy.status === 'active' ? 'badge-green' : tenancy.status === 'ending_soon' ? 'badge-amber' : 'badge-red'}`}>{tenancy.status.replace('_',' ')}</span>],
                      ['Tenant', tenant?.name],
                      ['Start Date', new Date(tenancy.startDate).toLocaleDateString('en-GB')],
                      ['End Date', new Date(tenancy.endDate).toLocaleDateString('en-GB')],
                      ['Monthly Rent', `£${getEffectiveRent(property).toLocaleString()}`],
                      ['Deposit', `£${tenancy.depositAmount.toLocaleString()} (${tenancy.depositScheme})`],
                      ['Last Payment', tenancy.lastPaymentDate ? new Date(tenancy.lastPaymentDate).toLocaleDateString('en-GB') : '—'],
                      ['Arrears', arrears > 0 ? <span style={{ color:'#dc2626', fontWeight:800 }}>£{arrears.toLocaleString()}</span> : <span style={{ color:'#10b981', fontWeight:700 }}>Clear</span>],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display:'flex', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #f8fafc' }}>
                        <span style={{ flex:1, fontSize:13, color:'#94a3b8' }}>{label}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:16 }}>
                      <button className="btn-secondary" style={{ justifyContent:'center' }} onClick={() => setTab('__rent_history')}>
                        <PoundSterling size={13} /> View Rent History ({payments.length} records)
                      </button>
                      <button className="btn-secondary" style={{ justifyContent:'center' }} onClick={async () => {
                        if (!landlord?.email) { alert('No landlord email.'); return }
                        await sendEmail({ to: landlord.email, subject: `Tenancy Renewal — ${property.address}`, message: `Dear ${landlord.name},\n\nThe tenancy at ${property.address} is due to end on ${new Date(tenancy.endDate).toLocaleDateString('en-GB')}.\n\nWe recommend offering a renewal to ${tenant?.name}. Please confirm if you would like to proceed.\n\nHarrington & Co · 020 7123 4567` })
                        setDownloadToast('renewal_sent')
        setTimeout(() => setDownloadToast(''), 3000)
                      }}>
                        <Mail size={13} /> Notify Landlord of Renewal
                      </button>
                      <button className="btn-secondary" style={{ justifyContent:'center' }} onClick={() => { setTab('documents') }}>
                        <Download size={13} /> Download Tenancy Agreement
                      </button>
                      {arrears > 0 && (
                        <button className="btn-primary" style={{ justifyContent:'center', background:'#dc2626', boxShadow:'none' }} onClick={() => navigate('/rent-arrears')}>
                          <AlertTriangle size={13} /> View Arrears Case
                        </button>
                      )}
                      <button className="btn-secondary" style={{ justifyContent:'center' }} onClick={() => setShowAssignTenant(v => !v)}>
                        <Users size={13} /> {showAssignTenant ? 'Close' : 'Change Tenant'}
                      </button>
                    </div>
                  </div>

                  {/* Rent history */}
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.06em', marginBottom:12 }}>Payment History</p>
                    {payments.length === 0 ? (
                      <p style={{ fontSize:13, color:'#94a3b8', fontStyle:'italic' }}>No payments recorded yet. Go to Tenancies to record payments.</p>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {payments.slice(0,8).map(p => {
                          const ps = { received:{bg:'#f0fdf4',color:'#16a34a',label:'Received'}, missed:{bg:'#fef2f2',color:'#dc2626',label:'Missed'}, partial:{bg:'#fffbeb',color:'#d97706',label:'Partial'}, pending:{bg:'#f8fafc',color:'#64748b',label:'Pending'} }[p.status] || { bg:'#f8fafc',color:'#64748b',label:p.status }
                          return (
                            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:ps.bg }}>
                              <div style={{ flex:1 }}>
                                <p style={{ fontSize:12.5, fontWeight:600, color:'#334155' }}>{new Date(p.due_date).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</p>
                              </div>
                              <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>£{p.amount_due.toLocaleString()}</p>
                              <span style={{ fontSize:11.5, fontWeight:700, padding:'2px 8px', borderRadius:8, background:`${ps.color}20`, color:ps.color }}>{ps.label}</span>
                            </div>
                          )
                        })}
                        {payments.length > 8 && <p style={{ fontSize:12, color:'#94a3b8', textAlign:'center' }}>+{payments.length-8} more — see Tenancies page</p>}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:40 }}>
                  <FileText size={40} color="#e2e8f0" style={{ margin:'0 auto 12px' }} />
                  <p style={{ fontWeight:700, color:'#64748b' }}>No tenant assigned</p>
                  <p style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>Assign an existing tenant or create a new one.</p>
                  <button className="btn-primary" style={{ marginTop:14 }} onClick={() => setShowAssignTenant(v => !v)}><Plus size={13} /> Assign Tenant</button>
                </div>
              )}

              {/* Assign Tenant inline panel */}
              {showAssignTenant && (
                <AssignTenantPanel
                  property={property}
                  currentTenant={tenant}
                  onAssign={(t) => {
                    setTenant(t)              // update tenant in state immediately
                    setShowAssignTenant(false)
                  }}
                  onClose={() => setShowAssignTenant(false)}
                />
              )}
            </div>
          )}

          {/* ── MAINTENANCE ── */}
          {tab === 'maintenance' && (
            <div>
              {jobs.length === 0 ? (
                <div style={{ textAlign:'center', padding:40 }}>
                  <CheckCircle size={40} color="#10b981" style={{ margin:'0 auto 12px' }} />
                  <p style={{ fontWeight:700, color:'#334155' }}>No maintenance jobs on record</p>
                  <button className="btn-primary" style={{ marginTop:14 }} onClick={() => navigate('/maintenance')}><Plus size={13} /> Log Job</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {jobs.map(job => {
                    const status     = getEffectiveJobStatus(job)
                    const contractor = getContractorById(job.assignedTo)
                    return (
                      <div key={job.id} style={{ padding:16, borderRadius:10, border:'1px solid #e2e8f0', borderLeft:`4px solid ${PRIORITY_COLOR[job.priority]}` }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                              <p style={{ fontWeight:700, fontSize:13.5, color:'#0f172a' }}>{job.title}</p>
                              <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:8, background:`${PRIORITY_COLOR[job.priority]}15`, color:PRIORITY_COLOR[job.priority], textTransform:'capitalize' }}>{job.priority}</span>
                              <span className={`badge ${JOB_STATUS_BADGE[status]}`}>{JOB_STATUS_LABELS[status]}</span>
                            </div>
                            <p style={{ fontSize:12, color:'#94a3b8' }}>Reported {job.reportedDate} · {job.reportedBy}</p>
                            {contractor && <p style={{ fontSize:12, color:'#6366f1', fontWeight:600, marginTop:3 }}>Assigned: {contractor.name}</p>}
                          </div>
                          {job.estimatedCost && <span style={{ fontSize:13, fontWeight:700, color:'#64748b', flexShrink:0 }}>Est. £{job.estimatedCost}</span>}
                        </div>
                        <p style={{ fontSize:12.5, color:'#475569', lineHeight:1.5, marginBottom:12 }}>{job.description}</p>

                        {/* Status change */}
                        <div>
                          <p style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:7 }}>Update Status</p>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {JOB_STATUSES.map(s => (
                              <button key={s} onClick={() => handleJobStatus(job.id, s)}
                                style={{
                                  padding:'4px 10px', borderRadius:7, border:'none', cursor:'pointer', fontSize:11.5, fontWeight:600, fontFamily:'inherit',
                                  background: status === s ? '#0f172a' : '#f1f5f9',
                                  color: status === s ? 'white' : '#64748b',
                                  outline: status === s ? '2px solid #10b981' : 'none',
                                }}>
                                {JOB_STATUS_LABELS[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── INSPECTIONS ── */}
          {tab === 'inspections' && (
            <div>
              {inspections.length === 0 ? (
                <div style={{ textAlign:'center', padding:40 }}>
                  <ClipboardCheck size={40} color="#e2e8f0" style={{ margin:'0 auto 12px' }} />
                  <p style={{ fontWeight:700, color:'#64748b' }}>No inspections scheduled</p>
                  <button className="btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/inspections')}><Calendar size={13} /> Schedule Inspection</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {inspections.map(ins => {
                    const override = inspOverrides[ins.id]
                    const scheduledDate = override?.scheduledDate || ins.scheduledDate
                    const status        = override?.status || ins.status
                    const isOverdue     = status === 'overdue'
                    return (
                      <div key={ins.id} style={{ padding:16, borderRadius:10, border:`1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`, background: isOverdue ? '#fef9f9' : 'white' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                              <p style={{ fontWeight:700, fontSize:13.5, color:'#0f172a' }}>{ins.type} Inspection</p>
                              {isOverdue ? <span className="badge badge-red">Overdue</span> : <span className="badge badge-blue">Scheduled</span>}
                              {ins.accessConfirmed && !override && <span className="badge badge-green">Access Confirmed</span>}
                            </div>
                            <p style={{ fontSize:12.5, color:'#64748b' }}>
                              {new Date(scheduledDate).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                              {' · '}{ins.inspectorName} · {ins.tenantName}
                            </p>
                          </div>
                        </div>

                        {/* Reschedule */}
                        {rescheduleId === ins.id ? (
                          <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:10, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                            <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)}
                              style={{ border:'1.5px solid #e2e8f0', borderRadius:8, padding:'7px 10px', fontSize:13, outline:'none', fontFamily:'inherit' }}
                              onFocus={e => e.target.style.borderColor='#10b981'}
                              onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                            <button className="btn-primary" style={{ fontSize:12 }} onClick={() => handleReschedule(ins.id)}><Save size={12} /> Confirm</button>
                            <button className="btn-secondary" style={{ fontSize:12 }} onClick={() => setRescheduleId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <button className="btn-secondary" style={{ fontSize:12 }} onClick={() => { setRescheduleId(ins.id); setRescheduleDate(scheduledDate) }}>
                              <RefreshCw size={12} /> Reschedule
                            </button>
                            <button className="btn-secondary" style={{ fontSize:12 }} onClick={() => { setInspectionOverride(ins.id, { ...ins, accessConfirmed: true }); setInspOverrides(getInspectionOverrides()) }}>
                              <CheckCircle size={12} /> Confirm Access
                            </button>
                            {isOverdue && (
                              <a href="http://localhost:5173/inspections/new" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:12, textDecoration:'none' }}>
                                <ExternalLink size={12} /> Start in InspectPro
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <button className="btn-secondary" style={{ justifyContent:'center' }} onClick={() => navigate('/inspections')}>
                    <Plus size={13} /> Schedule New Inspection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {tab === 'documents' && (
            <div>
              {/* Upload */}
              <div style={{ marginBottom:16, padding:'14px 16px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div>
                  <p style={{ fontWeight:700, fontSize:13.5, color:'#0f172a' }}>Upload Document</p>
                  <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>PDF, Word, images up to 10MB</p>
                </div>
                <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#10b981', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  <Upload size={13} /> Choose File
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileUpload} style={{ display:'none' }} />
                </label>
              </div>

              {/* Document list */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  ...uploadedDocs,
                  { name:'Tenancy Agreement 2024', date:'01 Feb 2024', type:'PDF', size:'1.2 MB', icon:'📋', default:true },
                  { name:'Check-In Inventory',    date:'01 Feb 2024', type:'PDF', size:'4.5 MB', icon:'🏠', default:true },
                  { name:'Deposit Certificate',   date:'01 Feb 2024', type:'PDF', size:'220 KB', icon:'🛡️', default:true },
                  { name:'EPC Certificate',       date:'01 Jun 2023', type:'PDF', size:'890 KB', icon:'🌿', default:true },
                  { name:'Gas Safety Record',     date:'15 Apr 2024', type:'PDF', size:'340 KB', icon:'🔥', default:true },
                  { name:'How to Rent Guide',     date:'01 Feb 2024', type:'PDF', size:'2.8 MB', icon:'📖', default:true },
                ].map((doc, i) => (
                  <div key={i} style={{ padding:16, border:'1px solid #e2e8f0', borderRadius:10, background:'white', display:'flex', flexDirection:'column', gap:8 }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                    <div style={{ fontSize:28 }}>{doc.icon || '📄'}</div>
                    <p style={{ fontWeight:600, fontSize:12.5, color:'#0f172a' }}>{doc.name}</p>
                    <p style={{ fontSize:11, color:'#94a3b8' }}>{doc.date} · {doc.type} · {doc.size}</p>
                    <div style={{ display:'flex', gap:6, marginTop:'auto' }}>
                      <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4, background:'none', border:'1px solid #e2e8f0', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:11.5, fontWeight:600, color:'#64748b', fontFamily:'inherit' }}
                        onClick={() => handleDocDownload(doc.name)}>
                        <Download size={11} /> {downloadToast === doc.name ? '✓ Preparing…' : 'Download'}
                      </button>
                      {!doc.default && (
                        <button style={{ width:28, height:28, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                          onClick={() => { const updated = uploadedDocs.filter((_,j) => j !== i); setUploadedDocs(updated); localStorage.setItem(`propertyops_docs_${id}`, JSON.stringify(updated)) }}>
                          <X size={11} color="#dc2626" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit property modal */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty.property}
          anchorRect={editingProperty.anchorRect}
          onSave={() => {
            setPropertyData(getEffectiveProperty(property))
            setEditingProperty(null)
          }}
          onDelete={() => navigate('/properties')}
          onClose={() => setEditingProperty(null)}
        />
      )}

      {/* Toast notification */}
      {downloadToast && downloadToast !== 'renewal_sent' && (
        <div style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', background:'#0f172a', color:'white', padding:'10px 20px', borderRadius:10, fontSize:13.5, fontWeight:600, zIndex:80, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle size={15} color="#10b981" /> {downloadToast} — preview only in demo · real download needs Supabase Storage
        </div>
      )}
      {downloadToast === 'renewal_sent' && (
        <div style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', background:'#0f172a', color:'white', padding:'10px 20px', borderRadius:10, fontSize:13.5, fontWeight:600, zIndex:80, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle size={15} color="#10b981" /> Renewal notification sent to landlord
        </div>
      )}

      {/* Rent edit popover */}
      {editingRent && (
        <RentEditModal
          property={editingRent.property}
          anchorRect={editingRent.anchorRect}
          onSave={() => setRentOverride(getPropertyOverrides())}
          onClose={() => setEditingRent(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
