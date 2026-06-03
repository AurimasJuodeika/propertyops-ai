import { useState, useEffect } from 'react'
import { Users, Star, PoundSterling, Building2, Plus, Zap, Mail, Phone, CheckCircle, X, Save, Trash2, Edit2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { LANDLORDS, PROPERTIES, TENANCIES } from '../data/mockData'
import PDFButton from '../components/PDFButton'
import { generateLandlordStatement } from '../lib/pdfExport'
import { sendLandlordUpdate } from '../lib/email'
import { getPropertyOverrides, setPropertyOverride, getLandlordOverrides, setLandlordOverride, getNewProperties, addNewProperty, removeNewProperty, getEffectiveRent } from '../lib/propertyOverrides'
import RentEditModal from '../components/RentEditModal'

// ─── Rent Edit Modal ──────────────────────────────────────────────────────────
// ─── Add Property Modal ───────────────────────────────────────────────────────
function AddPropertyModal({ landlordId, existingIds, onSave, onClose }) {
  const [mode, setMode]   = useState('new') // 'new' | 'existing'
  const [form, setForm]   = useState({ address: '', postcode: '', type: 'Flat', bedrooms: 2, bathrooms: 1, rent: '', managementType: 'full', branch: 'London Central' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Existing properties not already in portfolio
  const available = PROPERTIES.filter(p => !existingIds.includes(p.id))

  const inputStyle = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 6 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Add Property to Portfolio</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f8fafc', borderRadius: 10, padding: 4 }}>
          {[{ id: 'new', label: '+ New Property' }, { id: 'existing', label: 'Existing Property' }].map(tab => (
            <button key={tab.id} onClick={() => setMode(tab.id)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: mode === tab.id ? 'white' : 'transparent', color: mode === tab.id ? '#0f172a' : '#64748b', boxShadow: mode === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'existing' ? (
          <div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Select a property currently not assigned to this landlord:</p>
            {available.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>All properties are already assigned to landlords.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {available.map(p => (
                  <button key={p.id} onClick={() => onSave({ type: 'existing', propertyId: p.id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}>
                    <Building2 size={16} color="#10b981" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a' }}>{p.address}, {p.postcode}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>{p.bedrooms}bd {p.type} · £{p.rent.toLocaleString()}/mo · {p.branch}</p>
                    </div>
                    <ArrowRight size={14} color="#cbd5e1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Property Address *</label>
              <input value={form.address} onChange={set('address')} placeholder="e.g. 42 Baker Street" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Postcode *</label>
                <input value={form.postcode} onChange={set('postcode')} placeholder="e.g. W1U 6AF" style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>
              <div>
                <label style={labelStyle}>Monthly Rent (£) *</label>
                <input type="number" value={form.rent} onChange={set('rent')} placeholder="2500" style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={set('type')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Flat', 'House', 'Studio', 'Maisonette', 'Bungalow', 'HMO'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <select value={form.bedrooms} onChange={set('bedrooms')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {[1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <select value={form.bathrooms} onChange={set('bathrooms')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Management Type</label>
                <select value={form.managementType} onChange={set('managementType')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="full">Full Management</option>
                  <option value="rent_collection">Rent Collection</option>
                  <option value="let_only">Let Only</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Branch</label>
                <select value={form.branch} onChange={set('branch')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option>London Central</option>
                  <option>London North</option>
                  <option>Hertfordshire</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={() => { if (!form.address || !form.postcode || !form.rent) { alert('Please fill in address, postcode and rent.'); return } onSave({ type: 'new', property: { ...form, rent: Number(form.rent), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms) } }) }}
                className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                <Plus size={14} /> Add to Portfolio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Landlords page ──────────────────────────────────────────────────────
export default function Landlords() {
  const [selected, setSelected]       = useState(null)
  const [showAIUpdate, setShowAIUpdate] = useState(false)
  const [sending, setSending]         = useState(false)
  const [sent, setSent]               = useState(false)
  const [editingRent, setEditingRent] = useState(null)   // property being rent-edited
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [rentOverrides, setRentOverrides]     = useState(getPropertyOverrides())
  const [landlordOverrides, setLandlordOverrides] = useState(getLandlordOverrides())
  const [newProperties, setNewProperties]     = useState(getNewProperties())

  const AI_UPDATE = selected ? `Dear ${selected.name},

I hope this message finds you well. Please find below your monthly portfolio update from Harrington & Co.

PORTFOLIO SUMMARY — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}

Properties Under Management: ${getPropertyList(selected).length}
Monthly Rent Roll: £${getPropertyList(selected).reduce((s, p) => s + getEffectiveRent(p), 0).toLocaleString()}
Account Balance: ${selected.balance >= 0 ? '£' + selected.balance.toLocaleString() : '-£' + Math.abs(selected.balance).toLocaleString()}

If you have any questions about your portfolio, please contact your dedicated property manager.

Kind regards,
Harrington & Co Property Management` : ''

  function getPropertyList(landlord) {
    const landOverride  = landlordOverrides[landlord.id]
    const baseIds       = [...landlord.properties, ...(landOverride?.addedPropertyIds || [])]
    const removedIds    = landOverride?.removedPropertyIds || []
    const baseProps     = baseIds.filter(id => !removedIds.includes(id)).map(id => {
      if (id.startsWith('new_')) return newProperties.find(p => p.id === id)
      return PROPERTIES.find(p => p.id === id)
    }).filter(Boolean)
    return baseProps
  }

  const enrichedLandlords = LANDLORDS.map(l => ({
    ...l,
    propertyList: getPropertyList(l),
    totalRent: getPropertyList(l).reduce((s, p) => s + getEffectiveRent(p), 0),
  }))

  const handleSendUpdate = async () => {
    if (!selected?.email) { alert('No email address for this landlord.'); return }
    setSending(true)
    try {
      await sendLandlordUpdate({ landlord: selected, properties: selected.propertyList })
      setSent(true); setTimeout(() => setSent(false), 3000); setShowAIUpdate(false)
    } catch (e) { alert('Failed: ' + e.message) }
    setSending(false)
  }

  const handleRentSave = (propertyId, newRent) => {
    setRentOverrides(getPropertyOverrides())
  }

  const handleRemoveProperty = (landlord, propertyId) => {
    if (!confirm('Remove this property from the portfolio?')) return
    const landOverride = landlordOverrides[landlord.id] || {}
    const removedIds   = [...(landOverride.removedPropertyIds || []), propertyId]
    setLandlordOverride(landlord.id, { ...landOverride, removedPropertyIds: removedIds })
    setLandlordOverrides(getLandlordOverrides())
  }

  const handleAddProperty = (landlord, data) => {
    const landOverride = landlordOverrides[landlord.id] || {}
    if (data.type === 'existing') {
      const addedIds = [...(landOverride.addedPropertyIds || []), data.propertyId]
      setLandlordOverride(landlord.id, { ...landOverride, addedPropertyIds: addedIds })
    } else {
      const newProp = addNewProperty({ ...data.property, landlordId: landlord.id, status: 'void', tenantId: null, managerId: 's5', inspectorId: 's10', compliance: { epc: { grade: 'D', expiry: '', status: 'valid' }, gasSafety: { expiry: '', engineer: '', status: 'valid' }, eicr: { expiry: '', engineer: '', status: 'valid' }, smokeAlarm: { lastCheck: '', status: 'valid' }, depositProtection: { scheme: null, reference: null, amount: 0, status: 'n/a' }, rightToRent: { tenantId: null, status: 'n/a', expiry: null } } })
      const addedIds = [...(landOverride.addedPropertyIds || []), newProp.id]
      setLandlordOverride(landlord.id, { ...landOverride, addedPropertyIds: addedIds })
      setNewProperties(getNewProperties())
    }
    setLandlordOverrides(getLandlordOverrides())
    setShowAddProperty(false)
    // Refresh selected
    if (selected?.id === landlord.id) {
      setSelected(enrichedLandlords.find(l => l.id === landlord.id))
    }
  }

  // Refresh selected after overrides change
  useEffect(() => {
    if (selected) setSelected(enrichedLandlords.find(l => l.id === selected.id) || null)
  }, [rentOverrides, landlordOverrides, newProperties])

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Landlords</h1>
          <p className="page-subtitle">{LANDLORDS.length} landlords · {LANDLORDS.filter(l => l.type === 'Portfolio' || l.type === 'Investor').length} portfolio landlords</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => { if (!selected) { alert('Select a landlord first.'); return } setShowAIUpdate(true) }}><Zap size={13} /> Send AI Update</button>
          <button className="btn-primary" onClick={() => alert("Add Landlord: enter name, contact, management fee and linked properties. Coming in next sprint.")}><Plus size={13} /> Add Landlord</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.6fr' : '1fr', gap: 20 }}>
        {/* Landlord list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {enrichedLandlords.map(l => (
            <div key={l.id} className="card"
              style={{ padding: '16px', cursor: 'pointer', border: selected?.id === l.id ? '2px solid #10b981' : '1px solid #e2e8f0' }}
              onClick={() => setSelected(selected?.id === l.id ? null : l)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                  {l.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{l.name}</p>
                    <span className={`badge ${l.type === 'Investor' ? 'badge-purple' : l.type === 'Portfolio' ? 'badge-blue' : 'badge-slate'}`}>{l.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={11} />{l.propertyList.length} propert{l.propertyList.length !== 1 ? 'ies' : 'y'}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PoundSterling size={11} />£{l.totalRent.toLocaleString()}/mo
                    </span>
                    <span style={{ fontSize: 12, color: l.balance >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      {l.balance >= 0 ? '+' : ''}£{l.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11} fill={i < l.rating ? '#f59e0b' : 'none'} color={i < l.rating ? '#f59e0b' : '#e2e8f0'} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card" style={{ padding: 22, alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{selected.name}</h2>
                <span className={`badge ${selected.type === 'Investor' ? 'badge-purple' : selected.type === 'Portfolio' ? 'badge-blue' : 'badge-slate'}`} style={{ marginTop: 4 }}>{selected.type} Landlord</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            {/* Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 7 }}>Contact</p>
                <a href={`mailto:${selected.email}`} style={{ fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginBottom: 5 }}><Mail size={12} />{selected.email}</a>
                <a href={`tel:${selected.phone}`} style={{ fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}><Phone size={12} />{selected.phone}</a>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 7 }}>Account</p>
                <p style={{ fontSize: 12.5, color: '#334155' }}>Fee: {selected.managementFee}% · {selected.statementFrequency}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: selected.balance >= 0 ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                  Balance: {selected.balance >= 0 ? '+' : ''}£{selected.balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Portfolio header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>
                Portfolio ({selected.propertyList.length} {selected.propertyList.length === 1 ? 'property' : 'properties'})
              </p>
              <button onClick={() => setShowAddProperty(true)} className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}>
                <Plus size={12} /> Add Property
              </button>
            </div>

            {/* Property list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {selected.propertyList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '2px dashed #e2e8f0' }}>
                  <Building2 size={28} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>No properties in portfolio yet</p>
                  <button onClick={() => setShowAddProperty(true)} className="btn-primary" style={{ marginTop: 10, fontSize: 12 }}>
                    <Plus size={12} /> Add First Property
                  </button>
                </div>
              ) : selected.propertyList.map(p => {
                const effectiveRent = getEffectiveRent(p)
                const override = rentOverrides[p.id]
                const hasRentChange = override?.rent && override.rent !== p.rent
                return (
                  <div key={p.id} style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Building2 size={15} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}{p.postcode ? `, ${p.postcode}` : ''}</p>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{p.bedrooms}bd {p.type}</span>
                        <span className={`badge ${p.status === 'let' ? 'badge-green' : 'badge-amber'}`}>{p.status === 'let' ? 'Let' : 'Void'}</span>
                        {p.isNew && <span className="badge badge-blue">New</span>}
                      </div>
                    </div>
                    {/* Rent display + edit */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>£{effectiveRent.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>/mo</span></p>
                          {hasRentChange && (
                            <p style={{ fontSize: 10.5, color: effectiveRent > p.rent ? '#10b981' : '#dc2626', fontWeight: 600 }}>
                              was £{p.rent.toLocaleString()}
                            </p>
                          )}
                        </div>
                        {/* Edit rent button */}
                        <button onClick={e => setEditingRent({ property: p, anchorRect: e.currentTarget.getBoundingClientRect() })} title="Edit rent"
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Edit2 size={12} color="#64748b" />
                        </button>
                        {/* Remove property button */}
                        <button onClick={() => handleRemoveProperty(selected, p.id)} title="Remove from portfolio"
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={12} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Portfolio totals */}
            <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Total rent roll</span>
              <span style={{ color: '#10b981', fontWeight: 800, fontSize: 16 }}>£{selected.propertyList.reduce((s, p) => s + getEffectiveRent(p), 0).toLocaleString()}/mo</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}><Mail size={13} /> Email</button>
              <PDFButton label="Statement PDF" className="btn-secondary" style={{ flex: 1 }}
                onGenerate={() => generateLandlordStatement(selected, selected.propertyList, TENANCIES.filter(t => selected.properties.includes(t.propertyId)), [])} />
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setShowAIUpdate(true)}>
                <Zap size={13} /> AI Update
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rent edit popover */}
      {editingRent && (
        <RentEditModal
          property={editingRent.property || editingRent}
          anchorRect={editingRent.anchorRect}
          onSave={handleRentSave}
          onClose={() => setEditingRent(null)}
        />
      )}

      {/* Add property modal */}
      {showAddProperty && selected && (
        <AddPropertyModal
          landlordId={selected.id}
          existingIds={selected.propertyList.map(p => p.id)}
          onSave={(data) => handleAddProperty(selected, data)}
          onClose={() => setShowAddProperty(false)}
        />
      )}

      {/* AI update modal */}
      {showAIUpdate && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowAIUpdate(false)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>AI Portfolio Update</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{selected.name}</p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-line', marginBottom: 16 }}>
              {AI_UPDATE}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowAIUpdate(false)} style={{ flex: 1, justifyContent: 'center' }}>Close</button>
              <button className="btn-primary" disabled={sending} onClick={handleSendUpdate} style={{ flex: 2, justifyContent: 'center' }}>
                {sent ? <><CheckCircle size={13} /> Sent!</> : sending ? 'Sending…' : <><Mail size={13} /> Send to Landlord</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
