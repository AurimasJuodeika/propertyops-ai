import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, CheckCircle, AlertTriangle, Clock, Plus, ChevronRight, Mail, Phone, X, Eye, Archive, Edit2, MessageSquare } from 'lucide-react'
import { getAllTenants, getTenantProperty, getActiveTenancy, getTenantStats, getTenantStatus, archiveTenant, unarchiveTenant, getArchivedTenantIds, addTenantNote } from '../lib/tenantStore'
import AddEditTenantModal from '../components/AddEditTenantModal'

const STATUS_CONFIG = {
  active:      { label: 'Active',       class: 'badge-green',  color: '#10b981' },
  arrears:     { label: 'In Arrears',   class: 'badge-red',    color: '#dc2626' },
  ending_soon: { label: 'Ending Soon',  class: 'badge-amber',  color: '#d97706' },
  archived:    { label: 'Archived',     class: 'badge-slate',  color: '#64748b' },
}

// ─── RTR status helper ────────────────────────────────────────────────────────
function rtrBadge(t) {
  if (!t.rtRVerified) return <span className="badge badge-red" style={{ fontSize: 10.5 }}>⚠ Not Verified</span>
  if (!t.rtRExpiry)   return <span className="badge badge-green" style={{ fontSize: 10.5 }}>✓ Verified</span>
  const days = Math.round((new Date(t.rtRExpiry) - new Date()) / (1000*60*60*24))
  if (days <= 60)     return <span className="badge badge-amber" style={{ fontSize: 10.5 }}>⚠ Expiring {days}d</span>
  return <span className="badge badge-green" style={{ fontSize: 10.5 }}>✓ Verified</span>
}

export default function Tenants() {
  const navigate = useNavigate()
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [showArchived, setShowArchived]   = useState(false)
  const [refresh, setRefresh]             = useState(0)
  const [toast, setToast]                 = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const doRefresh = () => setRefresh(r => r + 1)

  const allTenants = getAllTenants({ includeArchived: showArchived })
  const archived   = getArchivedTenantIds()

  const enriched = allTenants.map(t => {
    const property  = getTenantProperty(t.id)
    const tenancy   = getActiveTenancy(t.id)
    const stats     = getTenantStats(t.id)
    const status    = getTenantStatus(t.id)
    return { ...t, property, tenancy, stats, status }
  })

  const filtered = enriched.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.property?.address?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    all:         enriched.length,
    active:      enriched.filter(t => t.status === 'active').length,
    arrears:     enriched.filter(t => t.status === 'arrears').length,
    ending_soon: enriched.filter(t => t.status === 'ending_soon').length,
  }

  const rtrIssues = enriched.filter(t => !t.rtRVerified).length

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{enriched.length} tenants · {rtrIssues > 0 ? `${rtrIssues} RTR issues · ` : ''}{counts.arrears > 0 ? `${counts.arrears} in arrears · ` : ''}{counts.ending_soon > 0 ? `${counts.ending_soon} ending soon` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => { setShowArchived(v => !v); doRefresh() }}>
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
          <button className="btn-primary" onClick={() => setShowAddTenant(true)}><Plus size={13} /> Add Tenant</button>
        </div>
      </div>

      {/* RTR alert */}
      {rtrIssues > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 16px', display: 'flex', gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={15} color="#dc2626" />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>Right to Rent not verified for {rtrIssues} tenant{rtrIssues !== 1 ? 's' : ''} — civil penalty risk up to £10,000 per tenant</p>
        </div>
      )}

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { key: 'all',         label: `All (${counts.all})` },
          { key: 'active',      label: `Active (${counts.active})` },
          { key: 'arrears',     label: `In Arrears (${counts.arrears})` },
          { key: 'ending_soon', label: `Ending Soon (${counts.ending_soon})` },
        ].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            style={{ padding: '6px 13px', borderRadius: 20, border: statusFilter === f.key ? 'none' : '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, background: statusFilter === f.key ? '#0f172a' : 'white', color: statusFilter === f.key ? 'white' : '#64748b' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 14px', marginBottom: 16 }}>
        <User size={14} color="#94a3b8" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or property…"
          style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', width: '100%', background: 'none' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color="#94a3b8" /></button>}
      </div>

      {/* Tenant list */}
      <div className="card hide-mobile">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Property</th>
              <th>Tenancy</th>
              <th>Monthly Rent</th>
              <th>Arrears</th>
              <th>RTR</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.active
              return (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={14} color="#6366f1" />
                      </div>
                      <div>
                        <button onClick={() => navigate(`/tenants/${t.id}`)}
                          style={{ fontWeight: 600, color: '#10b981', fontSize: 13.5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'left' }}>
                          {t.name}
                        </button>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {t.property ? (
                      <button onClick={() => navigate(`/properties/${t.property.id}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>
                        <p style={{ fontSize: 12.5, color: '#10b981', fontWeight: 600 }}>{t.property.address}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.property.postcode}</p>
                      </button>
                    ) : <span style={{ color: '#94a3b8', fontSize: 12.5, fontStyle: 'italic' }}>No property</span>}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>
                    {t.tenancy ? (
                      <span>
                        {new Date(t.tenancy.startDate).toLocaleDateString('en-GB')} →{' '}
                        {t.tenancy.endDate ? new Date(t.tenancy.endDate).toLocaleDateString('en-GB') : 'Periodic'}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {t.stats.monthlyRent ? `£${t.stats.monthlyRent.toLocaleString()}` : '—'}
                  </td>
                  <td>
                    {t.stats.arrears > 0
                      ? <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 13 }}>£{t.stats.arrears.toLocaleString()}</span>
                      : <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Clear</span>}
                  </td>
                  <td>{rtrBadge(t)}</td>
                  <td><span className={`badge ${sc.class}`}>{sc.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn-primary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => navigate(`/tenants/${t.id}`)}>
                        <Eye size={10} /> Profile
                      </button>
                      <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 7px' }} onClick={() => setEditingTenant(t)}>
                        <Edit2 size={10} />
                      </button>
                      <button style={{ fontSize: 11, padding: '4px 7px', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontFamily: 'inherit' }}
                        onClick={() => { if (archived.includes(t.id)) { unarchiveTenant(t.id); showToast('Tenant restored') } else { archiveTenant(t.id); showToast('Tenant archived') } doRefresh() }}>
                        <Archive size={10} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <User size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>No tenants found</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="mobile-card-list">
        {filtered.map(t => {
          const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.active
          return (
            <div key={t.id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <button onClick={() => navigate(`/tenants/${t.id}`)} style={{ fontWeight: 700, fontSize: 14.5, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    {t.name}
                  </button>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{t.property?.address || 'No property'}</p>
                </div>
                <span className={`badge ${sc.class}`}>{sc.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {t.stats.monthlyRent > 0 && <span style={{ fontSize: 12.5, color: '#64748b' }}>£{t.stats.monthlyRent.toLocaleString()}/mo</span>}
                {t.stats.arrears > 0 && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#dc2626' }}>£{t.stats.arrears.toLocaleString()} arrears</span>}
                {rtrBadge(t)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '10px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, zIndex: 80, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} color="#10b981" /> {toast}
        </div>
      )}

      {showAddTenant && (
        <AddEditTenantModal onSave={() => { doRefresh(); showToast('Tenant added') }} onClose={() => setShowAddTenant(false)} />
      )}
      {editingTenant && (
        <AddEditTenantModal tenant={editingTenant} onSave={() => { doRefresh(); showToast('Tenant updated') }} onClose={() => setEditingTenant(null)} />
      )}
    </div>
  )
}
