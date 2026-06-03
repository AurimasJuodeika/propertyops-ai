import { useState, useEffect } from 'react'
import { User, CheckCircle, AlertTriangle, Clock, Plus, ChevronRight, Mail, Phone, Shield, X, Save, Edit2, Trash2 } from 'lucide-react'
import { TENANTS, getPropertyById, getTenancyByPropertyId } from '../data/mockData'
import { supabase, isConfigured } from '../lib/supabase'
import { getCustomTenants, getAssignedTenantId } from '../lib/propertyOverrides'

// ─── RTR Status config ────────────────────────────────────────────────────────
const RTR_STATUSES = [
  { value: 'verified',            label: '✓ Verified',            class: 'badge-green',  color: '#10b981', icon: CheckCircle,  desc: 'Documents checked and on file' },
  { value: 'expiring_soon',       label: '⚠ Expiring Soon',       class: 'badge-amber',  color: '#d97706', icon: Clock,        desc: 'Re-check required within 60 days' },
  { value: 'documents_requested', label: '📋 Docs Requested',     class: 'badge-blue',   color: '#2563eb', icon: Shield,       desc: 'Documents requested from tenant' },
  { value: 'documents_received',  label: '📄 Docs Received',      class: 'badge-purple', color: '#7c3aed', icon: Shield,       desc: 'Documents received, pending check' },
  { value: 'not_verified',        label: '⚠ Not Verified',        class: 'badge-red',    color: '#dc2626', icon: AlertTriangle, desc: 'No RTR check completed — action required' },
]

const RTR_KEY = 'propertyops_rtr_overrides'

function getRTROverrides() {
  try { return JSON.parse(localStorage.getItem(RTR_KEY) || '{}') } catch { return {} }
}
function setRTROverride(tenantId, data) {
  const all = getRTROverrides()
  all[tenantId] = data
  localStorage.setItem(RTR_KEY, JSON.stringify(all))
}

function getRTRStatus(tenant, overrides = {}) {
  const override = overrides[tenant.id]

  // Use override if set
  if (override) {
    return {
      ...override,
      statusConfig: RTR_STATUSES.find(s => s.value === override.status) || RTR_STATUSES[4],
    }
  }

  // Default from mock data
  if (!tenant.rtRVerified) {
    return { status: 'not_verified', expiry: null, statusConfig: RTR_STATUSES[4] }
  }
  if (!tenant.rtRExpiry) {
    return { status: 'verified', expiry: null, statusConfig: RTR_STATUSES[0] }
  }
  const days = Math.round((new Date(tenant.rtRExpiry) - new Date()) / (1000 * 60 * 60 * 24))
  if (days <= 60 && days > 0) {
    return { status: 'expiring_soon', expiry: tenant.rtRExpiry, statusConfig: RTR_STATUSES[1] }
  }
  return { status: 'verified', expiry: tenant.rtRExpiry, statusConfig: RTR_STATUSES[0] }
}

// ─── RTR Update Modal ─────────────────────────────────────────────────────────
function RTRModal({ tenant, property, currentRTR, onSave, onClose }) {
  const [status, setStatus]   = useState(currentRTR.status)
  const [expiry, setExpiry]   = useState(currentRTR.expiry || '')
  const [notes, setNotes]     = useState(currentRTR.notes || '')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const data = { status, expiry: expiry || null, notes, updatedAt: new Date().toISOString() }
    setRTROverride(tenant.id, data)

    // Save to Supabase if configured
    if (isConfigured) {
      try {
        await supabase.from('rtr_verifications').upsert({
          tenant_id: tenant.id,
          ...data,
        })
      } catch (e) { console.warn('Supabase RTR save failed:', e) }
    }
    onSave(tenant.id, data)
    setSaving(false)
    onClose()
  }

  const sc = RTR_STATUSES.find(s => s.value === status)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Update Right to Rent</h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>{tenant.name} · {property?.address}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Status picker */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>Verification Status</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RTR_STATUSES.map(s => (
              <button key={s.value} onClick={() => setStatus(s.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                  borderRadius: 10, border: status === s.value ? `2px solid ${s.color}` : '1.5px solid #e2e8f0',
                  background: status === s.value ? `${s.color}10` : 'white',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                <s.icon size={16} color={s.color} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{s.label}</p>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{s.desc}</p>
                </div>
                {status === s.value && (
                  <CheckCircle size={16} color={s.color} style={{ marginLeft: 'auto' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Expiry date */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 6 }}>
            Document / Visa Expiry Date <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span>
          </label>
          <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#0f172a' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 6 }}>
            Notes <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="e.g. Passport seen and copied, BRP card verified, share code confirmed…"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', color: '#0f172a' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save RTR Status'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Tenants() {
  const [search, setSearch]         = useState('')
  const [overrides, setOverrides]   = useState(getRTROverrides())
  const [editing, setEditing]       = useState(null)
  const [editingTenant, setEditingTenant] = useState(null) // for edit custom tenant
  const [customTenants, setCustomTenants] = useState(getCustomTenants())

  // Merge mock + custom tenants
  const allTenants = [...TENANTS, ...customTenants]

  // Helper to find property including new ones from localStorage
  const resolveProperty = (propertyId) => {
    if (!propertyId) return null
    const mock = getPropertyById(propertyId)
    if (mock) return mock
    try { return JSON.parse(localStorage.getItem('propertyops_new_properties') || '[]').find(p => p.id === propertyId) || null } catch { return null }
  }

  const enriched = allTenants.map(t => ({
    ...t,
    property: resolveProperty(t.propertyId),
    tenancy:  getTenancyByPropertyId(t.propertyId),
    rtr:      getRTRStatus(t, overrides),
  })).filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.property?.address?.toLowerCase().includes(q)
  })

  const rtrIssues    = enriched.filter(t => t.rtr.status === 'not_verified').length
  const expiringSoon = enriched.filter(t => t.rtr.status === 'expiring_soon').length
  const docsRequested= enriched.filter(t => t.rtr.status === 'documents_requested' || t.rtr.status === 'documents_received').length

  const handleSave = (tenantId, data) => {
    setOverrides(prev => ({ ...prev, [tenantId]: data }))
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{TENANTS.length} active tenants · {rtrIssues} RTR not verified · {expiringSoon} expiring soon</p>
        </div>
        <button className="btn-primary" onClick={() => setEditingTenant({ id:'ct_'+Date.now(), name:"", email:"", phone:"", nationality:"British", isCustom:true })}><Plus size={13} /> Add Tenant</button>
      </div>

      {/* RTR legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginRight: 4 }}>RTR Status:</span>
        {RTR_STATUSES.map(s => (
          <span key={s.value} className={`badge ${s.class}`} style={{ fontSize: 11 }}>{s.label}</span>
        ))}
        <span style={{ fontSize: 11.5, color: '#94a3b8', marginLeft: 'auto' }}>Click any RTR badge to update</span>
      </div>

      {/* Alerts */}
      {rtrIssues > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
            Right to Rent not verified for {rtrIssues} tenant{rtrIssues !== 1 ? 's' : ''} — civil penalty up to £10,000 per tenant. Click the badge to update.
          </p>
        </div>
      )}
      {expiringSoon > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 16 }}>
          <Clock size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
            {expiringSoon} tenant RTR document{expiringSoon !== 1 ? 's' : ''} expiring within 60 days — re-check required.
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 14px', marginBottom: 16 }}>
        <User size={14} color="#94a3b8" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search tenants by name, email or address…"
          style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', width: '100%', background: 'none' }} />
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="card hide-mobile">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Property</th>
              <th>Nationality</th>
              <th>Right to Rent</th>
              <th>RTR Expiry</th>
              <th>Monthly Rent</th>
              <th>Arrears</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enriched.map(t => {
              const { statusConfig, status, expiry, notes } = t.rtr
              const Icon = statusConfig.icon
              return (
                <tr key={t.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={14} color="#10b981" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{t.name}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: 12.5, color: '#334155' }}>{t.property?.address}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.property?.postcode}</p>
                  </td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>{t.nationality}</td>
                  <td>
                    {/* Clickable RTR badge */}
                    <button
                      onClick={() => setEditing(t)}
                      title="Click to update RTR status"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20,
                        border: `1px solid ${statusConfig.color}40`,
                        background: `${statusConfig.color}15`,
                        color: statusConfig.color,
                        fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <Icon size={11} />
                      {statusConfig.label.replace(/^[^\w]*/, '')}
                      <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 2 }}>✎</span>
                    </button>
                    {notes && <p style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notes}</p>}
                  </td>
                  <td style={{ fontSize: 12.5, color: (status === 'expiring_soon') ? '#d97706' : '#64748b', fontWeight: (status === 'expiring_soon') ? 700 : 400 }}>
                    {expiry ? new Date(expiry).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>£{t.tenancy?.monthlyRent?.toLocaleString() || '—'}</td>
                  <td>
                    {t.tenancy?.arrears > 0
                      ? <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 13 }}>£{t.tenancy.arrears.toLocaleString()}</span>
                      : <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Clear</span>}
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      {t.isCustom && (
                        <>
                          <button onClick={e => { e.stopPropagation(); setEditingTenant(t) }}
                            style={{ width:26, height:26, borderRadius:6, border:'1px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                            title="Edit tenant">
                            <Edit2 size={11} color="#64748b" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); if(confirm('Delete this tenant?')) { const updated = customTenants.filter(ct => ct.id !== t.id); localStorage.setItem('propertyops_custom_tenants', JSON.stringify(updated)); setCustomTenants(updated) } }}
                            style={{ width:26, height:26, borderRadius:6, border:'1px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                            title="Delete tenant">
                            <Trash2 size={11} color="#dc2626" />
                          </button>
                        </>
                      )}
                      <ChevronRight size={13} color="#cbd5e1" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="mobile-card-list">
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{enriched.length} tenants · tap RTR badge to update</p>
        {enriched.map(t => {
          const { statusConfig, status, expiry } = t.rtr
          const Icon = statusConfig.icon
          return (
            <div key={t.id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: `1px solid ${status === 'not_verified' ? '#fecaca' : status === 'expiring_soon' ? '#fde68a' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} color="#10b981" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.property?.address}</p>
                </div>
                {t.tenancy?.arrears > 0 && <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>£{t.tenancy.arrears.toLocaleString()}</p>
                  <p style={{ fontSize: 10.5, color: '#dc2626' }}>arrears</p>
                </div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: `${statusConfig.color}10`, border: `1px solid ${statusConfig.color}30`, borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Right to Rent</p>
                  <button onClick={() => setEditing(t)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                    <Icon size={13} color={statusConfig.color} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: statusConfig.color }}>{statusConfig.label.replace(/^[^\w]*/, '')} ✎</span>
                  </button>
                  {expiry && <p style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>Exp: {new Date(expiry).toLocaleDateString('en-GB')}</p>}
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Monthly Rent</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{t.tenancy ? `£${t.tenancy.monthlyRent.toLocaleString()}` : '—'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid #f8fafc', marginTop: 10 }}>
                <a href={`tel:${t.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#334155', textDecoration: 'none', flex: 1 }}>
                  <Phone size={12} color="#94a3b8" /> {t.phone}
                </a>
                <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{t.nationality}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* RTR Update Modal */}
      {editing && (
        <RTRModal
          tenant={editing}
          property={editing.property}
          currentRTR={editing.rtr}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Edit custom tenant modal */}
      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onSave={(updated) => {
            const exists = customTenants.find(t => t.id === updated.id)
            const all = exists
              ? customTenants.map(t => t.id === updated.id ? updated : t)
              : [updated, ...customTenants]
            localStorage.setItem('propertyops_custom_tenants', JSON.stringify(all))
            setCustomTenants(all)
            setEditingTenant(null)
          }}
          onClose={() => setEditingTenant(null)}
        />
      )}
    </div>
  )
}

// ─── Edit Custom Tenant Modal ─────────────────────────────────────────────────
function EditTenantModal({ tenant, onSave, onClose }) {
  const [form, setForm] = useState({ name: tenant.name, email: tenant.email, phone: tenant.phone || '', nationality: tenant.nationality || 'British' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const inputStyle = { width:'100%', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'10px 12px', fontSize:13.5, outline:'none', fontFamily:'inherit', color:'#0f172a', boxSizing:'border-box' }
  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.05em', marginBottom:5 }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:16, width:'100%', maxWidth:420, padding:24, boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>Edit Tenant</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={17} color="#94a3b8" /></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div><label style={labelStyle}>Full Name</label><input value={form.name} onChange={set('name')} style={inputStyle} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
          <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={set('email')} style={inputStyle} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
          <div><label style={labelStyle}>Phone</label><input value={form.phone} onChange={set('phone')} style={inputStyle} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
          <div>
            <label style={labelStyle}>Nationality</label>
            <select value={form.nationality} onChange={set('nationality')} style={{ ...inputStyle, cursor:'pointer' }}>
              {['British','Irish','EU Pre-settled','EU Settled','Tier 2 Visa','Student Visa','Other'].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button className="btn-secondary" style={{ flex:1, justifyContent:'center' }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex:2, justifyContent:'center' }} onClick={() => onSave({ ...tenant, ...form })}>
            <Save size={13} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
