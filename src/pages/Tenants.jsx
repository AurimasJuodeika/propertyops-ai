import { useState } from 'react'
import { User, CheckCircle, AlertTriangle, Clock, Plus, ChevronRight, Mail, Phone, Shield } from 'lucide-react'
import { TENANTS, getPropertyById, getTenancyByPropertyId } from '../data/mockData'

export default function Tenants() {
  const [search, setSearch] = useState('')

  const enriched = TENANTS.map(t => ({
    ...t,
    property: getPropertyById(t.propertyId),
    tenancy:  getTenancyByPropertyId(t.propertyId),
  })).filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.property?.address?.toLowerCase().includes(q)
  })

  const rtrIssues = TENANTS.filter(t => !t.rtRVerified).length
  const expiringSoon = TENANTS.filter(t => {
    if (!t.rtRExpiry) return false
    const d = new Date(t.rtRExpiry)
    const days = (d - new Date()) / (1000 * 60 * 60 * 24)
    return days <= 60 && days > 0
  }).length

  function rtrStatus(t) {
    if (!t.rtRVerified) return { label: 'Not Verified', class: 'badge-red', icon: AlertTriangle, color: '#dc2626' }
    if (!t.rtRExpiry)  return { label: 'Verified', class: 'badge-green', icon: CheckCircle, color: '#10b981' }
    const days = Math.round((new Date(t.rtRExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    if (days <= 60)    return { label: `Exp. ${new Date(t.rtRExpiry).toLocaleDateString('en-GB')}`, class: 'badge-amber', icon: Clock, color: '#d97706' }
    return { label: 'Verified', class: 'badge-green', icon: CheckCircle, color: '#10b981' }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{TENANTS.length} active tenants · {rtrIssues} RTR issues · {expiringSoon} expiring soon</p>
        </div>
        <button className="btn-primary"><Plus size={13} /> Add Tenant</button>
      </div>

      {/* Alert */}
      {rtrIssues > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
            Right to Rent not verified for {rtrIssues} tenant{rtrIssues !== 1 ? 's' : ''} — civil penalty up to £10,000 per tenant
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
              const rtr = rtrStatus(t)
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
                    <span className={`badge ${rtr.class}`}>
                      {t.rtRVerified ? '✓ Verified' : '⚠ Not Verified'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5, color: !t.rtRVerified ? '#dc2626' : '#64748b', fontWeight: !t.rtRVerified ? 700 : 400 }}>
                    {t.rtRExpiry ? new Date(t.rtRExpiry).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>£{t.tenancy?.monthlyRent?.toLocaleString() || '—'}</td>
                  <td>
                    {t.tenancy?.arrears > 0
                      ? <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 13 }}>£{t.tenancy.arrears.toLocaleString()}</span>
                      : <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Clear</span>}
                  </td>
                  <td><ChevronRight size={13} color="#cbd5e1" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="mobile-card-list">
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{enriched.length} tenants</p>
        {enriched.map(t => {
          const rtr = rtrStatus(t)
          const RtrIcon = rtr.icon
          return (
            <div key={t.id} style={{
              background: 'white', borderRadius: 12, padding: '14px 16px',
              border: `1px solid ${!t.rtRVerified ? '#fecaca' : t.tenancy?.arrears > 0 ? '#fde68a' : '#e2e8f0'}`,
            }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} color="#10b981" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.property?.address}, {t.property?.postcode}
                  </p>
                </div>
                {t.tenancy?.arrears > 0 && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>£{t.tenancy.arrears.toLocaleString()}</p>
                    <p style={{ fontSize: 10.5, color: '#dc2626' }}>arrears</p>
                  </div>
                )}
              </div>

              {/* Detail grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: !t.rtRVerified ? '#fef2f2' : '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 4 }}>Right to Rent</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RtrIcon size={13} color={rtr.color} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: rtr.color }}>{t.rtRVerified ? 'Verified' : 'Not Verified'}</span>
                  </div>
                  {t.rtRExpiry && (
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Exp: {new Date(t.rtRExpiry).toLocaleDateString('en-GB')}</p>
                  )}
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 4 }}>Monthly Rent</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    {t.tenancy ? `£${t.tenancy.monthlyRent.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>

              {/* Contact + nationality */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid #f8fafc' }}>
                <a href={`tel:${t.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#334155', textDecoration: 'none', flex: 1 }}>
                  <Phone size={12} color="#94a3b8" /> {t.phone}
                </a>
                <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{t.nationality}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
