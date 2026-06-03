import { useState } from 'react'
import { Building2, Search, ChevronRight, Users, PoundSterling, ShieldCheck, AlertTriangle, Home, Plus, MapPin, BedDouble } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PROPERTIES, getLandlordById, getTenantById, getComplianceStatus } from '../data/mockData'

const STATUS_LABELS = { let: 'Let', available: 'Available', void: 'Void', under_offer: 'Under Offer' }
const STATUS_BADGE  = { let: 'badge-green', available: 'badge-blue', void: 'badge-amber', under_offer: 'badge-purple' }
const MGMT_LABELS   = { full: 'Full Mgmt', rent_collection: 'Rent Collection', let_only: 'Let Only' }
const COMPLIANCE_BADGE  = { critical: 'badge-red', warning: 'badge-amber', compliant: 'badge-green', info: 'badge-slate' }
const COMPLIANCE_LABEL  = { critical: '⚠ Critical', warning: '⚠ Warning', compliant: '✓ OK', info: 'Void' }

export default function Properties() {
  const [search, setSearch]           = useState('')
  const [branchFilter, setBranchFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = PROPERTIES.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.address.toLowerCase().includes(q) || p.postcode.toLowerCase().includes(q)
    const matchBranch  = branchFilter === 'All' || p.branch === branchFilter
    const matchStatus  = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchBranch && matchStatus
  })

  const branches = ['All', ...new Set(PROPERTIES.map(p => p.branch))]
  const statuses  = ['All', 'let', 'void', 'available']

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{PROPERTIES.length} managed · {PROPERTIES.filter(p => p.status === 'let').length} let · {PROPERTIES.filter(p => p.status === 'void').length} void</p>
        </div>
        <button className="btn-primary"><Plus size={14} /> Add Property</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 180 }}>
          <Search size={14} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search address or postcode…"
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', width: '100%', background: 'none' }} />
        </div>
        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#334155', background: 'white', cursor: 'pointer' }}>
          {branches.map(b => <option key={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#334155', background: 'white', cursor: 'pointer' }}>
          {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid-cols-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Managed', value: PROPERTIES.length,                                               icon: Building2,     color: '#6366f1' },
          { label: 'Currently Let', value: PROPERTIES.filter(p => p.status === 'let').length,               icon: Home,          color: '#10b981' },
          { label: 'Void',          value: PROPERTIES.filter(p => p.status === 'void').length,              icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Compliance Issues', value: PROPERTIES.filter(p => getComplianceStatus(p) === 'critical').length, icon: ShieldCheck, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{s.value}</p>
              <p style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="card hide-mobile">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Branch</th>
                <th>Type</th>
                <th>Rent/mo</th>
                <th>Status</th>
                <th>Tenant</th>
                <th>Landlord</th>
                <th>Management</th>
                <th>Compliance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const landlord   = getLandlordById(p.landlordId)
                const tenant     = getTenantById(p.tenantId)
                const compStatus = getComplianceStatus(p)
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/properties/${p.id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Building2 size={15} color="#10b981" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{p.address}</p>
                          <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{p.postcode} · {p.bedrooms}bd/{p.bathrooms}ba</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12.5 }}>{p.branch}</td>
                    <td style={{ color: '#64748b', fontSize: 12.5 }}>{p.type}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>£{p.rent.toLocaleString()}</td>
                    <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABELS[p.status]}</span></td>
                    <td style={{ fontSize: 12.5, color: '#334155' }}>{tenant?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Vacant</span>}</td>
                    <td style={{ fontSize: 12.5, color: '#334155' }}>{landlord?.name}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{MGMT_LABELS[p.managementType]}</td>
                    <td><span className={`badge ${COMPLIANCE_BADGE[compStatus]}`}>{COMPLIANCE_LABEL[compStatus]}</span></td>
                    <td><ChevronRight size={14} color="#cbd5e1" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12.5, color: '#94a3b8' }}>Showing {filtered.length} of {PROPERTIES.length} properties</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3].map(n => (
              <button key={n} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: n === 1 ? '#0f172a' : 'white', color: n === 1 ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="mobile-card-list">
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{filtered.length} properties</p>
        {filtered.map(p => {
          const landlord   = getLandlordById(p.landlordId)
          const tenant     = getTenantById(p.tenantId)
          const compStatus = getComplianceStatus(p)
          return (
            <div key={p.id} onClick={() => window.location.href = `/properties/${p.id}`}
              style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', cursor: 'pointer' }}>

              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={17} color="#10b981" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.postcode}</span>
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                    {(compStatus === 'critical' || compStatus === 'warning') && (
                      <span className={`badge ${COMPLIANCE_BADGE[compStatus]}`}>{COMPLIANCE_LABEL[compStatus]}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>£{p.rent.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>/month</p>
                </div>
              </div>

              {/* Bottom detail row */}
              <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: '1px solid #f8fafc', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BedDouble size={12} color="#94a3b8" />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{p.bedrooms} bed {p.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={12} color="#94a3b8" />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{tenant?.name || 'Vacant'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                  <MapPin size={12} color="#94a3b8" />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{p.branch.replace('London ', '')}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
