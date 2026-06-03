import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Building2, Search, ChevronRight, Users, ShieldCheck, AlertTriangle, Home, Plus, MapPin, BedDouble, Edit2, X, Save } from 'lucide-react'
import { PROPERTIES, getLandlordById, getTenantById, getComplianceStatus, LANDLORDS } from '../data/mockData'
import { getEffectiveRent, getPropertyOverrides, getNewProperties, addNewProperty } from '../lib/propertyOverrides'
import RentEditModal from '../components/RentEditModal'

const STATUS_LABELS = { let: 'Let', available: 'Available', void: 'Void', under_offer: 'Under Offer' }
const STATUS_BADGE  = { let: 'badge-green', available: 'badge-blue', void: 'badge-amber', under_offer: 'badge-purple' }
const MGMT_LABELS   = { full: 'Full Mgmt', rent_collection: 'Rent Collection', let_only: 'Let Only' }
const COMPLIANCE_BADGE  = { critical: 'badge-red', warning: 'badge-amber', compliant: 'badge-green', info: 'badge-slate' }
const COMPLIANCE_LABEL  = { critical: '⚠ Critical', warning: '⚠ Warning', compliant: '✓ OK', info: 'Void' }

const EMPTY_FORM = { address:'', city:'London', postcode:'', type:'Flat', bedrooms:2, bathrooms:1, rent:'', status:'void', managementType:'full', branch:'London Central', landlordId:'', inspectorId:'s10', managerId:'s5' }
const DEFAULT_COMPLIANCE = { epc:{grade:'D',expiry:'',status:'valid'}, gasSafety:{expiry:'',engineer:'',status:'valid'}, eicr:{expiry:'',engineer:'',status:'valid'}, smokeAlarm:{lastCheck:'',status:'valid'}, depositProtection:{scheme:null,reference:null,amount:0,status:'n/a'}, rightToRent:{tenantId:null,status:'n/a',expiry:null} }

function AddPropertyModal({ onSave, onClose, anchorRect }) {
  const [form, setForm]   = useState(EMPTY_FORM)
  const [step, setStep]   = useState(1) // 1=details, 2=landlord+mgmt
  const [errors, setErrors] = useState({})

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate1 = () => {
    const e = {}
    if (!form.address.trim()) e.address = 'Required'
    if (!form.postcode.trim()) e.postcode = 'Required'
    if (!form.rent || Number(form.rent) <= 0) e.rent = 'Enter a valid rent'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    const property = {
      ...form,
      rent: Number(form.rent),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      tenantId: null,
      lastInspection: null,
      nextInspection: null,
      compliance: DEFAULT_COMPLIANCE,
    }
    const saved = addNewProperty(property)
    onSave(saved)
    onClose()
  }

  const inputStyle = { width:'100%', border:`1.5px solid #e2e8f0`, borderRadius:9, padding:'10px 12px', fontSize:13.5, outline:'none', fontFamily:'inherit', color:'#0f172a', boxSizing:'border-box' }
  const labelStyle = { display:'block', fontSize:12, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.05em', marginBottom:6 }
  const focus = e => e.target.style.borderColor = '#10b981'
  const blur  = e => e.target.style.borderColor = errors[e.target.name] ? '#dc2626' : '#e2e8f0'

  const popoverPos = anchorRect ? getAddPropertyPosition(anchorRect) : null

  const inner = (
    <div style={{ background:'white', borderRadius:16, width:520, padding:24, boxShadow:'0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)', maxHeight:'88vh', overflowY:'auto' }}
      onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>Add New Property</h2>
            <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Step {step} of 2 — {step===1 ? 'Property Details' : 'Landlord & Management'}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:6, marginBottom:22 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex:1, height:4, borderRadius:2, background: step >= s ? '#10b981' : '#e2e8f0', transition:'background 0.2s' }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={labelStyle}>Property Address *</label>
              <input name="address" value={form.address} onChange={set('address')} placeholder="e.g. 42 Baker Street" style={{ ...inputStyle, borderColor: errors.address ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
              {errors.address && <p style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.address}</p>}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>City *</label>
                <input name="city" value={form.city} onChange={set('city')} placeholder="London" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Postcode *</label>
                <input name="postcode" value={form.postcode} onChange={set('postcode')} placeholder="e.g. W1U 6AF" style={{ ...inputStyle, borderColor: errors.postcode ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
                {errors.postcode && <p style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.postcode}</p>}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={set('type')} style={{ ...inputStyle, cursor:'pointer' }}>
                  {['Flat','House','Studio','Maisonette','Bungalow','HMO'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <select value={form.bedrooms} onChange={set('bedrooms')} style={{ ...inputStyle, cursor:'pointer' }}>
                  {[1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <select value={form.bathrooms} onChange={set('bathrooms')} style={{ ...inputStyle, cursor:'pointer' }}>
                  {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>Monthly Rent (£) *</label>
                <input name="rent" type="number" value={form.rent} onChange={set('rent')} placeholder="e.g. 2500" style={{ ...inputStyle, borderColor: errors.rent ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
                {errors.rent && <p style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.rent}</p>}
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={set('status')} style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="void">Void</option>
                  <option value="let">Let</option>
                  <option value="available">Available</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Branch</label>
              <select value={form.branch} onChange={set('branch')} style={{ ...inputStyle, cursor:'pointer' }}>
                <option>London Central</option>
                <option>London North</option>
                <option>Hertfordshire</option>
              </select>
            </div>

            <button className="btn-primary" style={{ justifyContent:'center', marginTop:4 }}
              onClick={() => { if (validate1()) setStep(2) }}>
              Next: Landlord & Management →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={labelStyle}>Landlord</label>
              <select value={form.landlordId} onChange={set('landlordId')} style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">— Select landlord —</option>
                {LANDLORDS.map(l => <option key={l.id} value={l.id}>{l.name} ({l.properties.length} properties)</option>)}
                <option value="new">+ Add new landlord later</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Management Type</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[
                  { value:'full',             label:'Full Management',  desc:'Full service' },
                  { value:'rent_collection',  label:'Rent Collection',  desc:'Finance only' },
                  { value:'let_only',         label:'Let Only',         desc:'Intro only' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, managementType: opt.value }))}
                    style={{ padding:'10px 8px', borderRadius:9, border: form.managementType === opt.value ? '2px solid #10b981' : '1.5px solid #e2e8f0', background: form.managementType === opt.value ? 'rgba(16,185,129,0.06)' : 'white', cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
                    <p style={{ fontSize:12.5, fontWeight:700, color: form.managementType === opt.value ? '#059669' : '#0f172a' }}>{opt.label}</p>
                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px', border:'1px solid #e2e8f0' }}>
              <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.05em', marginBottom:10 }}>Summary</p>
              {[
                ['Address',    `${form.address}, ${form.postcode}`],
                ['Type',       `${form.bedrooms}bd ${form.type}`],
                ['Rent',       `£${Number(form.rent).toLocaleString()}/mo`],
                ['Branch',     form.branch],
                ['Management', form.managementType === 'full' ? 'Full Management' : form.managementType === 'rent_collection' ? 'Rent Collection' : 'Let Only'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginBottom:6 }}>
                  <span style={{ color:'#64748b' }}>{k}</span>
                  <span style={{ fontWeight:600, color:'#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex:1, justifyContent:'center' }}>← Back</button>
              <button className="btn-primary" onClick={handleSave} style={{ flex:2, justifyContent:'center' }}>
                <Save size={14} /> Add Property
              </button>
            </div>
          </div>
        )}
    </div>
  )

  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, zIndex:59 }} onClick={onClose} />
      <div style={{ position:'fixed', zIndex:60, ...popoverPos }}>
        {inner}
      </div>
    </>,
    document.body
  )
}

function getAddPropertyPosition(rect) {
  const w = 520, h = 600, gap = 8
  const vw = window.innerWidth, vh = window.innerHeight

  // Align right edge of popover with right edge of button
  let left = rect.right - w
  left = Math.max(8, Math.min(left, vw - w - 8))

  // Appear below button; if not enough room, above
  let top = rect.bottom + gap
  if (top + h > vh - 8) top = rect.top - h - gap
  top = Math.max(8, top)

  return { top, left }
}

export default function Properties() {
  const navigate = useNavigate()
  const [search, setSearch]             = useState('')
  const [branchFilter, setBranchFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editingRent, setEditingRent]   = useState(null)
  const [rentOverrides, setRentOverrides] = useState(getPropertyOverrides())
  const [showAdd, setShowAdd]           = useState(null) // anchorRect | null
  const [newProperties, setNewProperties] = useState(getNewProperties())

  const allProperties = [...PROPERTIES, ...newProperties]

  const filtered = allProperties.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.address.toLowerCase().includes(q) || p.postcode.toLowerCase().includes(q)
    const matchBranch  = branchFilter === 'All' || p.branch === branchFilter
    const matchStatus  = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchBranch && matchStatus
  })

  const branches = ['All', ...new Set(allProperties.map(p => p.branch))]
  const statuses  = ['All', 'let', 'void', 'available']

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{PROPERTIES.length} managed · {PROPERTIES.filter(p => p.status === 'let').length} let · {PROPERTIES.filter(p => p.status === 'void').length} void</p>
        </div>
        <button className="btn-primary" onClick={e => setShowAdd(e.currentTarget.getBoundingClientRect())}><Plus size={14} /> Add Property</button>
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
          { label: 'Total Managed',     value: allProperties.length,                                                    icon: Building2,     color: '#6366f1' },
          { label: 'Currently Let',     value: allProperties.filter(p => p.status === 'let').length,                   icon: Home,          color: '#10b981' },
          { label: 'Void',              value: allProperties.filter(p => p.status === 'void').length,                  icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Compliance Issues', value: PROPERTIES.filter(p => getComplianceStatus(p) === 'critical').length,   icon: ShieldCheck,   color: '#dc2626' },
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
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/properties/${p.id}`)}>
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
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>£{getEffectiveRent(p).toLocaleString()}</span>
                          {rentOverrides[p.id]?.rent && rentOverrides[p.id].rent !== p.rent && (
                            <p style={{ fontSize: 10.5, color: rentOverrides[p.id].rent > p.rent ? '#10b981' : '#dc2626', fontWeight: 600 }}>
                              was £{p.rent.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <button onClick={e => { e.stopPropagation(); setEditingRent({ property: p, anchorRect: e.currentTarget.getBoundingClientRect() }) }}
                          title="Edit rent"
                          style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <Edit2 size={11} color="#64748b" />
                        </button>
                      </div>
                    </td>
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
          <span style={{ fontSize: 12.5, color: '#94a3b8' }}>Showing {filtered.length} of {allProperties.length} properties</span>
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
            <div key={p.id} onClick={() => navigate(`/properties/${p.id}`)}
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
                  <p style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>£{getEffectiveRent(p).toLocaleString()}</p>
                  {rentOverrides[p.id]?.rent && rentOverrides[p.id].rent !== p.rent && (
                    <p style={{ fontSize: 10.5, color: rentOverrides[p.id].rent > p.rent ? '#10b981' : '#dc2626', fontWeight: 600 }}>was £{p.rent.toLocaleString()}</p>
                  )}
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

      {/* Add property — anchored popover */}
      {showAdd && (
        <AddPropertyModal
          anchorRect={showAdd}
          onSave={() => { setNewProperties(getNewProperties()); setShowAdd(null) }}
          onClose={() => setShowAdd(null)}
        />
      )}

      {/* Rent edit popover */}
      {editingRent && (
        <RentEditModal
          property={editingRent.property}
          anchorRect={editingRent.anchorRect}
          onSave={() => setRentOverrides(getPropertyOverrides())}
          onClose={() => setEditingRent(null)}
        />
      )}
    </div>
  )
}
