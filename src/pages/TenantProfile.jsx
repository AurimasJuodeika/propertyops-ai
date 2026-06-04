import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  ArrowLeft, User, Building2, Users, Wrench, FileText, MessageSquare,
  Mail, Phone, Edit2, Plus, Archive, RotateCcw, CheckCircle,
  AlertTriangle, Clock, ChevronRight, Download, Upload, PoundSterling,
  X, Save, RefreshCw, Send
} from 'lucide-react'
import {
  getTenantById, getTenantProperty, getTenantTenancies, getActiveTenancy,
  getTenantMaintenance, getTenantStats, getTenantActivityLog, addTenantActivity,
  addTenantNote, archiveTenant, unarchiveTenant, getArchivedTenantIds,
  TENANT_ACTIVITY_ICONS,
} from '../lib/tenantStore'
import { getLandlordById } from '../lib/landlordStore'
import {
  getOrCreateRentStatus, recordRentReceivedExternally, updateRentStatus,
  addRentNote, recordReminderSent, getStatusConfig, RENT_STATUSES,
} from '../lib/rentStatusStore'
import { getEffectiveRent } from '../lib/propertyOverrides'
import AddEditTenantModal from '../components/AddEditTenantModal'
import RenewalModal from '../components/RenewalModal'
import EndTenancyModal from '../components/EndTenancyModal'
import { sendEmail } from '../lib/email'

const EMAIL_TEMPLATES = {
  welcome:     { label: 'Welcome',        subject: (t) => `Welcome to your new home — ${t.name}`, body: (t, p) => `Dear ${t.name},\n\nWelcome to your new home at ${p?.address || 'your property'}. We are delighted to have you as a tenant.\n\nPlease do not hesitate to contact us if you have any questions.\n\nKind regards,\nHarrington & Co\n020 7123 4567` },
  rent_reminder:{ label: 'Rent Reminder', subject: (t) => `Rent Payment Reminder — ${t.name}`, body: (t, p) => `Dear ${t.name},\n\nThis is a friendly reminder that your rent payment is due shortly for ${p?.address || 'your property'}.\n\nPlease ensure payment is made on time to avoid any arrears.\n\nKind regards,\nHarrington & Co\n020 7123 4567` },
  maintenance:  { label: 'Maintenance Update', subject: (t) => `Maintenance Update — ${p?.address || 'Your Property'}`, body: (t, p) => `Dear ${t.name},\n\nWe are writing to update you on the maintenance work at ${p?.address || 'your property'}.\n\nA contractor has been arranged and will be in touch to confirm access.\n\nKind regards,\nHarrington & Co\n020 7123 4567` },
  renewal:      { label: 'Tenancy Renewal', subject: (t) => `Tenancy Renewal Offer — ${t.name}`, body: (t, p) => `Dear ${t.name},\n\nWe are pleased to offer you a renewal of your tenancy at ${p?.address || 'your property'}.\n\nPlease contact us to discuss the renewal terms.\n\nKind regards,\nHarrington & Co\n020 7123 4567` },
  documents:    { label: 'Document Request', subject: (t) => `Documents Required — ${t.name}`, body: (t) => `Dear ${t.name},\n\nCould you please provide the following documents at your earliest convenience:\n\n• Proof of identity\n• Right to Rent documentation\n\nKind regards,\nHarrington & Co\n020 7123 4567` },
  general:      { label: 'General',        subject: (t) => `Message from Harrington & Co — ${t.name}`, body: (t) => `Dear ${t.name},\n\n\n\nKind regards,\nHarrington & Co\n020 7123 4567` },
}

function TabBtn({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', color: active ? '#10b981' : '#64748b', borderBottom: `2px solid ${active ? '#10b981' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      {label}
      {badge ? <span style={{ background: active ? '#10b981' : '#e2e8f0', color: active ? 'white' : '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>{badge}</span> : null}
    </button>
  )
}

const PRIORITY_COLOR = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }

const DOCS = [
  { name: 'Tenancy Agreement', icon: '📋', type: 'PDF' },
  { name: 'Deposit Certificate', icon: '🛡️', type: 'PDF' },
  { name: 'Right to Rent — Verification', icon: '🪪', type: 'PDF' },
  { name: 'ID Document', icon: '🪪', type: 'Image' },
  { name: 'How to Rent Guide', icon: '📖', type: 'PDF' },
  { name: 'Check-In Inventory', icon: '🏠', type: 'PDF' },
]

export default function TenantProfile() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [tab, setTab]             = useState('overview')
  const [tenant, setTenant]       = useState(null)
  const [showEdit, setShowEdit]   = useState(false)
  const [showRenewal, setShowRenewal] = useState(false)
  const [showEndTenancy, setShowEndTenancy] = useState(false)
  const [showEmailDraft, setShowEmailDraft] = useState(false)
  const [emailTemplate, setEmailTemplate]   = useState('welcome')
  const [emailSubject, setEmailSubject]     = useState('')
  const [emailBody, setEmailBody]           = useState('')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [activityLog, setActivityLog]   = useState([])
  const [toast, setToast]               = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent]       = useState(false)
  const [rentStatus, setRentStatus]     = useState(null)
  const [showRecordRent, setShowRecordRent] = useState(false)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [rentNoteInput, setRentNoteInput]  = useState('')
  const [recordForm, setRecordForm] = useState({ amount: '', dateReceived: new Date().toISOString().split('T')[0], method: 'Bank transfer', reference: '', notes: '' })
  const [updateForm, setUpdateForm] = useState({ status: '', arrearsAmount: '', note: '' })

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = () => {
    const t = getTenantById(id)
    setTenant(t)
    setActivityLog(getTenantActivityLog(id))
    if (t) {
      const prop = getTenantProperty(id)
      setEmailSubject(EMAIL_TEMPLATES[emailTemplate].subject(t))
      setEmailBody(EMAIL_TEMPLATES[emailTemplate].body(t, prop))
    }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    if (!tenant) return
    const prop = getTenantProperty(id)
    setEmailSubject(EMAIL_TEMPLATES[emailTemplate].subject(tenant))
    setEmailBody(EMAIL_TEMPLATES[emailTemplate].body(tenant, prop))
  }, [emailTemplate])

  if (!tenant) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#64748b', fontSize: 15 }}>Tenant not found.</p>
      <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/tenants')}>← Back to Tenants</button>
    </div>
  )

  const property  = getTenantProperty(id)
  const tenancies = getTenantTenancies(id)
  const activeTenancy = getActiveTenancy(id)
  const maintenance   = getTenantMaintenance(id)
  const stats         = getTenantStats(id)
  const landlord      = property ? getLandlordById(property.landlordId) : null
  const isArchived    = getArchivedTenantIds().includes(id)
  // Load rent status from store
  useEffect(() => {
    if (!id) return
    const rs = getOrCreateRentStatus(id, activeTenancy?.id, property?.id)
    setRentStatus(rs)
    if (rs) setUpdateForm(f => ({ ...f, status: rs.currentStatus, arrearsAmount: rs.arrearsAmount || '' }))
  }, [id, activeTenancy?.id, property?.id])

  const getRentStatusCtx = () => ({
    tenantId: id, tenancyId: activeTenancy?.id, propertyId: property?.id,
    landlordId: landlord?.id, monthlyRent: activeTenancy?.monthlyRent || stats.monthlyRent,
    rentDueDay: activeTenancy?.rentDueDay || 1,
  })

  const statusColor = { active: '#10b981', arrears: '#dc2626', ending_soon: '#d97706', archived: '#64748b' }
  const statusLabel = { active: 'Active', arrears: 'In Arrears', ending_soon: 'Ending Soon', archived: 'Archived' }

  const currentStatus = isArchived ? 'archived'
    : stats.arrears > 0 ? 'arrears'
    : stats.hasEndingTenancy ? 'ending_soon'
    : 'active'

  const handleAddNote = () => {
    if (!noteInput.trim()) return
    const entry = addTenantNote(id, noteInput.trim())
    setActivityLog(prev => [entry, ...prev])
    setNoteInput('')
    showToast('Note added')
  }

  const handleSendEmail = async () => {
    if (!tenant.email) { showToast('No email address on file'); return }
    setEmailSending(true)
    try {
      await sendEmail({ to: tenant.email, subject: emailSubject, message: emailBody })
      const entry = addTenantActivity(id, { type: 'email', text: `Email sent to ${tenant.email}: ${emailSubject}` })
      setActivityLog(prev => [entry, ...prev])
      setEmailSent(true)
      setTimeout(() => { setEmailSent(false); setShowEmailDraft(false) }, 2000)
    } catch (e) {
      const entry = addTenantActivity(id, { type: 'email', text: `Email drafted: ${emailSubject}` })
      setActivityLog(prev => [entry, ...prev])
      showToast('Email drafted — could not send: ' + e.message)
      setShowEmailDraft(false)
    }
    setEmailSending(false)
  }

  const handleArchive = () => {
    if (isArchived) unarchiveTenant(id); else archiveTenant(id)
    setShowArchiveConfirm(false)
    load()
    showToast(isArchived ? 'Tenant restored' : 'Tenant archived')
  }

  const handleRentReminder = async () => {
    if (!tenant.email) { showToast('No email address — reminder not sent'); return }
    const prop = property
    try {
      await sendEmail({ to: tenant.email, subject: `Rent Reminder — ${prop?.address || 'Your Property'}`, message: `Dear ${tenant.name},\n\nThis is a reminder that rent is due for ${prop?.address || 'your property'}.\n\nPlease arrange payment using the usual rent payment method agreed with the agency.\n\nIf you have already arranged payment, please disregard this message.\n\nKind regards,\nHarrington & Co\n020 7123 4567` })
      const updated = recordReminderSent(rentStatus?.id || '', getRentStatusCtx())
      setRentStatus(updated || rentStatus)
      const entry = addTenantActivity(id, { type: 'payment', text: 'Rent reminder sent — tenant asked to arrange payment through usual method' })
      setActivityLog(prev => [entry, ...prev])
      showToast('Rent reminder sent')
    } catch (e) {
      showToast('Reminder drafted — send failed: ' + e.message)
    }
  }

  const handlePaymentNote = () => {
    if (!paymentNote.trim()) return
    const entry = addTenantActivity(id, { type: 'payment', text: paymentNote.trim() })
    setActivityLog(prev => [entry, ...prev])
    setPaymentNote('')
    showToast('Payment note added')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
        <button onClick={() => navigate('/tenants')} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
          <ArrowLeft size={16} color="#64748b" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                  {tenant.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>{tenant.name}</h1>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: `${statusColor[currentStatus]}15`, color: statusColor[currentStatus] }}>
                      {statusLabel[currentStatus]}
                    </span>
                    {tenant.nationality && <span className="badge badge-slate">{tenant.nationality}</span>}
                    {tenant.isCustom && <span className="badge badge-green" style={{ fontSize: 10 }}>Added</span>}
                    {tenant.isDemo && <span className="badge badge-slate" style={{ fontSize: 10 }}>Demo</span>}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0, flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowEmailDraft(true)}><Mail size={13} /> Email</button>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowEdit(true)}><Edit2 size={13} /> Edit</button>
              {property && <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigate(`/properties/${property.id}`)}><Building2 size={13} /> View Property</button>}
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Monthly Rent', value: stats.monthlyRent ? `£${stats.monthlyRent.toLocaleString()}` : '—', sub: 'per month', icon: PoundSterling, color: '#6366f1' },
          { label: 'Arrears', value: stats.arrears > 0 ? `£${stats.arrears.toLocaleString()}` : 'Clear', sub: stats.arrears > 0 ? 'outstanding' : 'up to date', icon: AlertTriangle, color: stats.arrears > 0 ? '#dc2626' : '#10b981' },
          { label: 'Open Maintenance', value: stats.openMaintenance, sub: 'issues', icon: Wrench, color: stats.openMaintenance > 0 ? '#d97706' : '#10b981' },
          { label: 'Tenancy Ends', value: stats.daysToEnd !== null ? (stats.daysToEnd > 0 ? `${stats.daysToEnd}d` : 'Expired') : '—', sub: activeTenancy?.endDate ? new Date(activeTenancy.endDate).toLocaleDateString('en-GB') : 'No end date', icon: Clock, color: stats.daysToEnd !== null && stats.daysToEnd <= 90 ? '#d97706' : '#64748b' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <s.icon size={13} color={s.color} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: s.label === 'Arrears' && stats.arrears > 0 ? '#dc2626' : '#0f172a' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', paddingLeft: 4, overflowX: 'auto' }}>
          <TabBtn label="Overview"   active={tab==='overview'}   onClick={() => setTab('overview')} />
          <TabBtn label="Tenancy"    active={tab==='tenancy'}    onClick={() => setTab('tenancy')} />
          <TabBtn label="Rent Status" active={tab==='payments'}  onClick={() => setTab('payments')}   badge={stats.arrears > 0 ? '!' : null} />
          <TabBtn label="Documents"  active={tab==='documents'}  onClick={() => setTab('documents')} />
          <TabBtn label="Maintenance" active={tab==='maintenance'} onClick={() => setTab('maintenance')} badge={stats.openMaintenance || null} />
          <TabBtn label="Activity"   active={tab==='activity'}   onClick={() => setTab('activity')}   badge={activityLog.length || null} />
        </div>

        <div style={{ padding: 24 }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 14 }}>Contact Details</p>
                {[
                  ['Email',    tenant.email ? <a href={`mailto:${tenant.email}`} style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>{tenant.email}</a> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>],
                  ['Phone',    tenant.phone ? <a href={`tel:${tenant.phone}`} style={{ color: '#334155', textDecoration: 'none' }}>{tenant.phone}</a> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>],
                  ['Preferred Contact', tenant.preferredContact || 'Email'],
                  ['Nationality', tenant.nationality || '—'],
                  ['RTR Status',  tenant.rtRVerified ? <span className="badge badge-green">✓ Verified{tenant.rtRExpiry ? ` (exp. ${new Date(tenant.rtRExpiry).toLocaleDateString('en-GB')})` : ''}</span> : <span className="badge badge-red">⚠ Not Verified</span>],
                  ['Property',    property ? <Link to={`/properties/${property.id}`} style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>{property.address}</Link> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No property linked</span>],
                  ['Landlord',    landlord ? <Link to={`/landlords/${landlord.id}`} style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>{landlord.name}</Link> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f8fafc', alignItems: 'flex-start' }}>
                    <span style={{ width: 140, fontSize: 13, color: '#94a3b8', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
                {tenant.emergencyName && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Emergency Contact</p>
                    <p style={{ fontSize: 13, color: '#334155' }}>{tenant.emergencyName}</p>
                    {tenant.emergencyPhone && <p style={{ fontSize: 13, color: '#64748b' }}>{tenant.emergencyPhone}</p>}
                  </div>
                )}
                {tenant.notes && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Notes</p>
                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{tenant.notes}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>Actions</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Draft Email',    icon: Mail,       action: () => setShowEmailDraft(true) },
                    { label: 'Rent Reminder',  icon: Send,       action: handleRentReminder },
                    { label: 'Edit Details',   icon: Edit2,      action: () => setShowEdit(true) },
                    { label: 'View Property',  icon: Building2,  action: () => property && navigate(`/properties/${property.id}`) },
                  ].map(a => (
                    <button key={a.label} onClick={a.action} disabled={a.label === 'View Property' && !property}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', cursor: a.label === 'View Property' && !property ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#334155', opacity: a.label === 'View Property' && !property ? 0.4 : 1, transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!(a.label === 'View Property' && !property)) { e.currentTarget.style.borderColor='#10b981'; e.currentTarget.style.background='#f0fdf4' } }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='white' }}>
                      <a.icon size={14} color="#10b981" />
                      {a.label}
                    </button>
                  ))}
                </div>

                {/* Add note */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 7 }}>Add Note</p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="Note about this tenant… (Enter)"
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
                        <span style={{ fontSize: 14 }}>{TENANT_ACTIVITY_ICONS[e.type] || TENANT_ACTIVITY_ICONS.default}</span>
                        <div>
                          <p style={{ fontSize: 12.5, color: '#334155' }}>{e.text}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{e.author} · {e.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Archive */}
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  {!showArchiveConfirm ? (
                    <button onClick={() => setShowArchiveConfirm(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: `1px solid ${isArchived ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '8px 14px', color: isArchived ? '#16a34a' : '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
                      {isArchived ? <><RotateCcw size={13} /> Restore Tenant</> : <><Archive size={13} /> Archive Tenant</>}
                    </button>
                  ) : (
                    <div style={{ background: isArchived ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isArchived ? '#bbf7d0' : '#fecaca'}`, borderRadius: 9, padding: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isArchived ? '#065f46' : '#991b1b', marginBottom: 8 }}>
                        {isArchived ? 'Restore this tenant?' : 'Archive this tenant?'}
                      </p>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => setShowArchiveConfirm(false)}>Cancel</button>
                        <button style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: isArchived ? '#10b981' : '#dc2626', color: 'white' }} onClick={handleArchive}>
                          {isArchived ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TENANCY ── */}
          {tab === 'tenancy' && (
            <div>
              {!activeTenancy ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
                  <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontWeight: 700, color: '#64748b', fontSize: 15 }}>No active tenancy</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Create a tenancy from the property detail page.</p>
                  {property && <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => navigate(`/properties/${property.id}?tab=tenancy`)}><Plus size={13} /> Create Tenancy</button>}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 12 }}>Tenancy Details</p>
                    {[
                      ['Property',   property ? <Link to={`/properties/${property.id}`} style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>{property.address}</Link> : '—'],
                      ['Landlord',   landlord ? <Link to={`/landlords/${landlord.id}`} style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>{landlord.name}</Link> : '—'],
                      ['Type',       activeTenancy.tenancyType || activeTenancy.type || 'AST'],
                      ['Start',      new Date(activeTenancy.startDate).toLocaleDateString('en-GB')],
                      ['End',        activeTenancy.endDate ? new Date(activeTenancy.endDate).toLocaleDateString('en-GB') : 'Periodic'],
                      ['Monthly Rent', `£${(activeTenancy.monthlyRent || 0).toLocaleString()}`],
                      ['Deposit',    `£${(activeTenancy.depositAmount || 0).toLocaleString()} (${activeTenancy.depositScheme || 'DPS'})`],
                      ['Deposit Status', activeTenancy.depositProtected === 'yes' ? '✓ Protected' : activeTenancy.depositProtected === 'pending' ? '⏳ Pending' : '—'],
                      ['Status',     <span className={`badge ${activeTenancy.status === 'active' ? 'badge-green' : activeTenancy.status === 'ending_soon' ? 'badge-amber' : 'badge-red'}`}>{activeTenancy.status?.replace('_', ' ')}</span>],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                        <span style={{ flex: 1, fontSize: 13, color: '#94a3b8' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>Actions</p>
                    {[
                      { label: 'Send Renewal',          icon: RefreshCw, action: () => setShowRenewal(true), show: true },
                      { label: 'View Agreement Preview', icon: Download,  action: () => { showToast('Preview only in demo · real document needs Supabase Storage'); addTenantActivity(id, { type: 'document', text: 'Tenancy agreement viewed' }); setActivityLog(getTenantActivityLog(id)) }, show: true },
                      { label: 'End Tenancy',           icon: X,         action: () => setShowEndTenancy(true), show: true, danger: true },
                    ].filter(a => a.show).map(a => (
                      <button key={a.label} onClick={a.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 9, border: `1px solid ${a.danger ? '#fecaca' : '#e2e8f0'}`, background: a.danger ? '#fef2f2' : 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: a.danger ? '#dc2626' : '#334155' }}>
                        <a.icon size={14} color={a.danger ? '#dc2626' : '#10b981'} />
                        {a.label}
                      </button>
                    ))}
                    {(stats.daysToEnd !== null && stats.daysToEnd <= 90 && stats.daysToEnd > 0) && (
                      <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>
                          ⚠ Tenancy ending in {stats.daysToEnd} days — consider sending a renewal offer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {tab === 'payments' && (
            <div>
              {/* Operational tracking notice */}
              <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8 }}>
                <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12.5, color: '#065f46' }}>
                  <strong>Operational rent tracking only.</strong> No payments are processed in PropertyOps AI. Use this tab to record rent status, log when rent is received externally, and send reminders.
                </p>
              </div>

              {/* Status summary */}
              {(() => {
                const sc = rentStatus ? getStatusConfig(rentStatus.currentStatus) : getStatusConfig('up_to_date')
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {[
                      { label: 'Monthly Rent', value: `£${(activeTenancy?.monthlyRent || stats.monthlyRent || 0).toLocaleString()}`, color: '#6366f1' },
                      { label: 'Rent Due', value: `${activeTenancy?.rentDueDay || 1}${[,'st','nd','rd'][activeTenancy?.rentDueDay]||'th'} of month`, color: '#64748b' },
                      { label: 'Current Status', value: <span className={`badge ${sc.badge}`}>{sc.label}</span>, color: sc.color },
                      { label: 'Arrears', value: rentStatus?.arrearsAmount > 0 ? `£${rentStatus.arrearsAmount.toLocaleString()}` : stats.arrears > 0 ? `£${stats.arrears.toLocaleString()}` : 'None', color: (rentStatus?.arrearsAmount || stats.arrears || 0) > 0 ? '#dc2626' : '#10b981' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#f8fafc', borderRadius: 9, padding: '12px 14px', textAlign: 'center' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Last recorded */}
              {rentStatus?.lastRecordedReceivedDate && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 16, fontSize: 12.5, color: '#065f46' }}>
                  ✓ Last recorded externally: <strong>£{(rentStatus.lastRecordedAmount||0).toLocaleString()}</strong> on {rentStatus.lastRecordedReceivedDate} via {rentStatus.externalMethod || '—'}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <button className="btn-primary" style={{ justifyContent: 'center', fontSize: 13 }} onClick={() => setShowRecordRent(true)}>
                  <CheckCircle size={13} /> Record Rent Received Externally
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }} onClick={() => setShowUpdateStatus(true)}>
                  <Edit2 size={13} /> Update Rent Status
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }} onClick={handleRentReminder}>
                  <Send size={13} /> Send Rent Reminder
                </button>
                {(rentStatus?.arrearsAmount || stats.arrears || 0) > 0 && (
                  <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => navigate('/rent-arrears')}>
                    <AlertTriangle size={13} /> View Arrears
                  </button>
                )}
              </div>

              {/* Add rent note */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                <input value={rentNoteInput} onChange={e => setRentNoteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && rentNoteInput.trim()) { const ctx = getRentStatusCtx(); const updated = addRentNote(rentStatus?.id || '', ctx, rentNoteInput.trim()); setRentStatus(updated || rentStatus); const entry = addTenantActivity(id, { type: 'payment', text: `Rent note: ${rentNoteInput.trim()}` }); setActivityLog(prev => [entry, ...prev]); setRentNoteInput(''); showToast('Rent note added') } }}
                  placeholder="Add rent note… (Enter)"
                  style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
                <button className="btn-secondary" style={{ fontSize: 12, flexShrink: 0 }} onClick={() => { if (rentNoteInput.trim()) { const ctx = getRentStatusCtx(); const updated = addRentNote(rentStatus?.id || '', ctx, rentNoteInput.trim()); setRentStatus(updated || rentStatus); const entry = addTenantActivity(id, { type: 'payment', text: `Rent note: ${rentNoteInput.trim()}` }); setActivityLog(prev => [entry, ...prev]); setRentNoteInput(''); showToast('Rent note added') } }}>
                  Add Note
                </button>
              </div>

              {/* Note history */}
              {rentStatus?.noteHistory?.length > 0 && (
                <div>
                  <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>Rent Status History</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rentStatus.noteHistory.slice(0, 8).map((n, i) => {
                      const typeIcon = n.type === 'received' ? '💷' : n.type === 'reminder' ? '📧' : n.type === 'status' ? '📋' : '💬'
                      return (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: 15, flexShrink: 0 }}>{typeIcon}</span>
                          <div>
                            <p style={{ fontSize: 12.5, color: '#334155' }}>{n.text}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{n.author || 'Staff'} · {n.date}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Record Rent Received modal */}
              {showRecordRent && createPortal(
                <>
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 79 }} onClick={() => setShowRecordRent(false)} />
                  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 80, background: 'white', borderRadius: 16, width: 460, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Record Rent Received Externally</h2>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontStyle: 'italic' }}>Operational record only — no payment is processed in PropertyOps AI</p>
                      </div>
                      <button onClick={() => setShowRecordRent(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={17} color="#94a3b8" /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>Amount Received (£) *</label>
                          <input type="number" value={recordForm.amount} onChange={e => setRecordForm(f => ({...f, amount: e.target.value}))}
                            placeholder={activeTenancy?.monthlyRent || ''}
                            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>Date Received *</label>
                          <input type="date" value={recordForm.dateReceived} onChange={e => setRecordForm(f => ({...f, dateReceived: e.target.value}))}
                            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>External Payment Method</label>
                        <select value={recordForm.method} onChange={e => setRecordForm(f => ({...f, method: e.target.value}))}
                          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a', cursor: 'pointer' }}>
                          {['Bank transfer','Standing order','Cash','Existing agency system','Other'].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>Reference (optional)</label>
                        <input value={recordForm.reference} onChange={e => setRecordForm(f => ({...f, reference: e.target.value}))} placeholder="Bank reference, SO reference…"
                          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>Notes</label>
                        <input value={recordForm.notes} onChange={e => setRecordForm(f => ({...f, notes: e.target.value}))} placeholder="Any relevant notes…"
                          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                        <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowRecordRent(false)}>Cancel</button>
                        <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={!recordForm.amount || !recordForm.dateReceived}
                          onClick={() => {
                            const ctx = getRentStatusCtx()
                            const updated = recordRentReceivedExternally(rentStatus?.id || '', ctx, recordForm)
                            setRentStatus(updated)
                            const entry = addTenantActivity(id, { type: 'payment', text: `Rent recorded as received externally: £${Number(recordForm.amount).toLocaleString()} via ${recordForm.method}` })
                            setActivityLog(prev => [entry, ...prev])
                            setShowRecordRent(false)
                            showToast('Rent recorded as received externally — no payment was processed in PropertyOps AI')
                          }}>
                          <CheckCircle size={14} /> Record as Received Externally
                        </button>
                      </div>
                    </div>
                  </div>
                </>,
                document.body
              )}

              {/* Update Status modal */}
              {showUpdateStatus && createPortal(
                <>
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 79 }} onClick={() => setShowUpdateStatus(false)} />
                  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 80, background: 'white', borderRadius: 16, width: 420, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Update Rent Status</h2>
                      <button onClick={() => setShowUpdateStatus(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={17} color="#94a3b8" /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {RENT_STATUSES.map(s => (
                          <button key={s.value} onClick={() => setUpdateForm(f => ({ ...f, status: s.value }))}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: updateForm.status === s.value ? `2px solid ${s.color}` : '1.5px solid #e2e8f0', background: updateForm.status === s.value ? s.bg : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', flex: 1 }}>{s.label}</span>
                            {updateForm.status === s.value && <CheckCircle size={15} color={s.color} />}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>Arrears Amount (£)</label>
                        <input type="number" value={updateForm.arrearsAmount} onChange={e => setUpdateForm(f => ({...f, arrearsAmount: e.target.value}))} placeholder="0"
                          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>Note (optional)</label>
                        <input value={updateForm.note} onChange={e => setUpdateForm(f => ({...f, note: e.target.value}))} placeholder="Reason for status change…"
                          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowUpdateStatus(false)}>Cancel</button>
                        <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={!updateForm.status}
                          onClick={() => {
                            const ctx = getRentStatusCtx()
                            const updated = updateRentStatus(rentStatus?.id || '', ctx, updateForm)
                            setRentStatus(updated)
                            const sc = getStatusConfig(updateForm.status)
                            const entry = addTenantActivity(id, { type: 'payment', text: `Rent status updated to: ${sc.label}${updateForm.note ? ` — ${updateForm.note}` : ''}` })
                            setActivityLog(prev => [entry, ...prev])
                            setShowUpdateStatus(false)
                            showToast(`Rent status updated to: ${sc.label}`)
                          }}>
                          Save Status
                        </button>
                      </div>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {tab === 'documents' && (
            <div>
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12.5, color: '#64748b' }}>Document placeholders — preview only in demo · real storage needs Supabase Storage</p>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: '#10b981', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Upload size={13} /> Upload
                  <input type="file" style={{ display: 'none' }} onChange={() => { showToast('Upload placeholder — real storage needs Supabase Storage'); addTenantActivity(id, { type: 'document', text: 'Document upload attempted (demo)' }); setActivityLog(getTenantActivityLog(id)) }} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {DOCS.map((doc, i) => (
                  <div key={i} style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{doc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{doc.name}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{doc.type}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#64748b' }}
                          onClick={() => { showToast('Preview only in demo · real download needs Supabase Storage'); addTenantActivity(id, { type: 'document', text: `Document viewed: ${doc.name}` }); setActivityLog(getTenantActivityLog(id)) }}>
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAINTENANCE ── */}
          {tab === 'maintenance' && (
            <div>
              {maintenance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12 }}>
                  <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontWeight: 700, color: '#64748b' }}>No maintenance issues linked to this tenant</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {maintenance.map(job => {
                    const pc = PRIORITY_COLOR[job.priority] || '#94a3b8'
                    return (
                      <Link key={job.id} to={`/properties/${job.propertyId}?tab=maintenance`}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', textDecoration: 'none', borderLeft: `4px solid ${pc}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{job.title}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{property?.address} · Reported {job.reportedDate}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${pc}15`, color: pc, textTransform: 'capitalize' }}>{job.priority}</span>
                          <span className={`badge ${job.status === 'completed' ? 'badge-green' : 'badge-amber'}`}>{job.status?.replace('_', ' ')}</span>
                        </div>
                        <ChevronRight size={14} color="#cbd5e1" style={{ flexShrink: 0, alignSelf: 'center' }} />
                      </Link>
                    )
                  })}
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
                  <MessageSquare size={13} /> Note
                </button>
              </div>
              {activityLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>No activity recorded yet</p>
                </div>
              ) : (
                <div>
                  {activityLog.map((entry, i) => (
                    <div key={entry.id || i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                        {TENANT_ACTIVITY_ICONS[entry.type] || TENANT_ACTIVITY_ICONS.default}
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

      {/* ── Draft Email panel ── */}
      {showEmailDraft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 69 }} onClick={() => setShowEmailDraft(false)}>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 560, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Draft Email</h2>
                <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>To: {tenant.name}{tenant.email ? ` · ${tenant.email}` : ' · No email'}</p>
              </div>
              <button onClick={() => setShowEmailDraft(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
            </div>
            <div style={{ padding: '12px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => (
                <button key={key} onClick={() => setEmailTemplate(key)}
                  style={{ padding: '4px 11px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, background: emailTemplate === key ? '#0f172a' : '#f1f5f9', color: emailTemplate === key ? 'white' : '#64748b' }}>
                  {tpl.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
              <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={11}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13, lineHeight: 1.7, outline: 'none', fontFamily: 'monospace', color: '#334155', resize: 'vertical' }} />
            </div>
            <div style={{ padding: '12px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowEmailDraft(false)}>Cancel</button>
              {emailSent ? (
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f0fdf4', borderRadius: 8, padding: '8px', color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                  <CheckCircle size={14} /> Sent!
                </div>
              ) : (
                <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={emailSending || !tenant.email} onClick={handleSendEmail}>
                  {emailSending ? 'Sending…' : !tenant.email ? 'No email on file' : <><Mail size={13} /> Send Email</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '11px 22px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, zIndex: 80, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <CheckCircle size={15} color="#10b981" /> {toast}
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <AddEditTenantModal tenant={tenant} onSave={() => { load(); showToast('Tenant updated') }} onClose={() => setShowEdit(false)} />
      )}
      {showRenewal && activeTenancy && property && (
        <RenewalModal
          tenancy={{ ...activeTenancy, tenantName: tenant.name, tenantEmail: tenant.email }}
          property={property}
          onRenew={() => { const e = addTenantActivity(id, { type: 'renewal', text: 'Tenancy renewal offer sent' }); setActivityLog(prev => [e, ...prev]); showToast('Renewal offer sent') }}
          onClose={() => setShowRenewal(false)}
        />
      )}
      {showEndTenancy && activeTenancy && property && (
        <EndTenancyModal
          tenancy={{ ...activeTenancy, tenantName: tenant.name }}
          property={property}
          onEnd={() => { const e = addTenantActivity(id, { type: 'tenancy', text: 'Tenancy ended' }); setActivityLog(prev => [e, ...prev]); showToast('Tenancy ended'); load() }}
          onClose={() => setShowEndTenancy(false)}
        />
      )}
    </div>
  )
}
