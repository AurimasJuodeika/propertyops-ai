import { useState } from 'react'
import { FileText, AlertTriangle, ChevronRight, Plus, PoundSterling, Calendar, User } from 'lucide-react'
import { TENANCIES, getPropertyById, getTenantById } from '../data/mockData'

const STATUS_CONFIG = {
  active:      { label: 'Active',         class: 'badge-green' },
  ending_soon: { label: 'Ending < 60d',   class: 'badge-amber' },
  expired:     { label: 'Expired',        class: 'badge-red'   },
  notice_given:{ label: 'Notice Given',   class: 'badge-purple'},
}

export default function Tenancies() {
  const [filter, setFilter] = useState('All')

  const enriched = TENANCIES.map(t => ({
    ...t,
    property: getPropertyById(t.propertyId),
    tenant:   getTenantById(t.tenantId),
  }))
  const filtered = filter === 'All' ? enriched : enriched.filter(t => t.status === filter)

  const endingSoon = enriched.filter(t => t.status === 'ending_soon').length
  const expired    = enriched.filter(t => t.status === 'expired').length
  const withArrears= enriched.filter(t => t.arrears > 0).length

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tenancies</h1>
          <p className="page-subtitle">{TENANCIES.length} tenancies · {endingSoon} ending soon · {expired} expired</p>
        </div>
        <button className="btn-primary"><Plus size={13} /> New Tenancy</button>
      </div>

      {/* Stats */}
      <div className="grid-cols-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active',            value: enriched.filter(t => t.status === 'active').length, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Ending Soon',       value: endingSoon,   color: '#d97706', bg: '#fffbeb' },
          { label: 'Expired / Holding', value: expired,      color: '#dc2626', bg: '#fef2f2' },
          { label: 'With Arrears',      value: withArrears,  color: '#6366f1', bg: '#eef2ff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}20` }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11.5, color: s.color, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['All', 'active', 'ending_soon', 'expired'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: filter === f ? 'none' : '1px solid #e2e8f0',
              background: filter === f ? '#0f172a' : 'white',
              color: filter === f ? 'white' : '#374151',
              textTransform: 'capitalize', fontFamily: 'inherit',
            }}>
            {f === 'All' ? `All (${enriched.length})` : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="card hide-mobile">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Property</th>
              <th>Monthly Rent</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Arrears</th>
              <th>Renewal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} style={{ cursor: 'pointer' }}>
                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{t.tenant?.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.tenant?.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: 12.5, color: '#334155' }}>{t.property?.address}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.property?.postcode}</div>
                </td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>£{t.monthlyRent.toLocaleString()}</td>
                <td style={{ fontSize: 12.5, color: '#64748b' }}>{new Date(t.startDate).toLocaleDateString('en-GB')}</td>
                <td style={{ fontSize: 12.5, color: t.status === 'ending_soon' ? '#d97706' : '#64748b', fontWeight: t.status === 'ending_soon' ? 700 : 400 }}>
                  {new Date(t.endDate).toLocaleDateString('en-GB')}
                </td>
                <td><span className={`badge ${STATUS_CONFIG[t.status]?.class || 'badge-slate'}`}>{STATUS_CONFIG[t.status]?.label || t.status}</span></td>
                <td>
                  {t.arrears > 0
                    ? <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 13 }}>£{t.arrears.toLocaleString()}</span>
                    : <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>✓ Clear</span>}
                </td>
                <td>
                  {t.renewalOffered ? <span className="badge badge-blue">Offered</span> : <span className="badge badge-slate">—</span>}
                </td>
                <td><ChevronRight size={13} color="#cbd5e1" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="mobile-card-list">
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{filtered.length} tenancies</p>
        {filtered.map(t => {
          const sc = STATUS_CONFIG[t.status] || { label: t.status, class: 'badge-slate' }
          const endDate = new Date(t.endDate)
          const daysLeft = Math.round((endDate - new Date()) / (1000 * 60 * 60 * 24))
          return (
            <div key={t.id} style={{
              background: 'white', borderRadius: 12, padding: '14px 16px',
              border: `1px solid ${t.arrears > 0 ? '#fecaca' : t.status === 'ending_soon' ? '#fde68a' : '#e2e8f0'}`,
            }}>
              {/* Top: tenant + status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={14} color="#10b981" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.tenant?.name}</p>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginLeft: 37, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.property?.address}, {t.property?.postcode}
                  </p>
                </div>
                <span className={`badge ${sc.class}`} style={{ flexShrink: 0, marginLeft: 8 }}>{sc.label}</span>
              </div>

              {/* Detail pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>Monthly Rent</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>£{t.monthlyRent.toLocaleString()}</p>
                </div>
                <div style={{ background: t.arrears > 0 ? '#fef2f2' : '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>Arrears</p>
                  {t.arrears > 0
                    ? <p style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>£{t.arrears.toLocaleString()}</p>
                    : <p style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>Clear</p>}
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>Start</p>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>{new Date(t.startDate).toLocaleDateString('en-GB')}</p>
                </div>
                <div style={{ background: daysLeft < 90 && daysLeft > 0 ? '#fffbeb' : '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>Ends</p>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: daysLeft < 90 && daysLeft > 0 ? '#d97706' : '#334155' }}>
                    {new Date(t.endDate).toLocaleDateString('en-GB')}
                    {daysLeft > 0 && daysLeft < 90 && <span style={{ fontSize: 11, marginLeft: 4 }}>({daysLeft}d)</span>}
                  </p>
                </div>
              </div>

              {/* Renewal badge */}
              {t.renewalOffered && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="badge badge-blue">Renewal offered</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
