import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Trash2, AlertTriangle } from 'lucide-react'
import { LANDLORDS } from '../data/mockData'
import { setPropertyOverride, getPropertyOverrides, deleteProperty, getEffectiveProperty, getNewProperties, removeNewProperty } from '../lib/propertyOverrides'

export default function EditPropertyModal({ property, onSave, onDelete, onClose, anchorRect }) {
  const effective = getEffectiveProperty(property)
  const [form, setForm] = useState({
    address:        effective.address || '',
    city:           effective.city || 'London',
    postcode:       effective.postcode || '',
    type:           effective.type || 'Flat',
    bedrooms:       effective.bedrooms || 2,
    bathrooms:      effective.bathrooms || 1,
    status:         effective.status || 'void',
    branch:         effective.branch || 'London Central',
    managementType: effective.managementType || 'full',
    landlordId:     effective.landlordId || '',
  })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errors, setErrors] = useState({})

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.address.trim()) e.address = 'Required'
    if (!form.postcode.trim()) e.postcode = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    // Save all changed fields to property overrides
    setPropertyOverride(property.id, {
      address:        form.address,
      city:           form.city,
      postcode:       form.postcode,
      type:           form.type,
      bedrooms:       Number(form.bedrooms),
      bathrooms:      Number(form.bathrooms),
      status:         form.status,
      branch:         form.branch,
      managementType: form.managementType,
      landlordId:     form.landlordId,
    })
    // If it's a new property, update it in the new properties store too
    if (property.isNew) {
      const all = getNewProperties().map(p =>
        p.id === property.id ? { ...p, ...form, bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms) } : p
      )
      localStorage.setItem('propertyops_new_properties', JSON.stringify(all))
    }
    onSave?.(property.id)
    onClose()
  }

  const handleDelete = () => {
    if (property.isNew) {
      removeNewProperty(property.id)
    } else {
      deleteProperty(property.id) // soft delete for mock data
    }
    onDelete?.(property.id)
    onClose()
  }

  const inputStyle = { width:'100%', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'10px 12px', fontSize:13.5, outline:'none', fontFamily:'inherit', color:'#0f172a', boxSizing:'border-box', transition:'border-color 0.15s' }
  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.05em', marginBottom:5 }
  const focus = e => e.target.style.borderColor = '#10b981'
  const blur  = e => e.target.style.borderColor = errors[e.target.name] ? '#dc2626' : '#e2e8f0'

  const content = (
    <div style={{ background:'white', borderRadius:16, width:500, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)' }}
      onClick={e => e.stopPropagation()}>
      <div style={{ padding:'20px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>Edit Property</h2>
          <p style={{ fontSize:12.5, color:'#64748b', marginTop:2 }}>{effective.address}</p>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={17} color="#94a3b8" /></button>
      </div>

      <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Address */}
        <div>
          <label style={labelStyle}>Address *</label>
          <input name="address" value={form.address} onChange={set('address')} style={{ ...inputStyle, borderColor: errors.address ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} placeholder="e.g. 42 Baker Street" />
          {errors.address && <p style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.address}</p>}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={labelStyle}>City</label>
            <input name="city" value={form.city} onChange={set('city')} style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Postcode *</label>
            <input name="postcode" value={form.postcode} onChange={set('postcode')} style={{ ...inputStyle, borderColor: errors.postcode ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} placeholder="e.g. W1U 6AF" />
            {errors.postcode && <p style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.postcode}</p>}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
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
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={set('status')} style={{ ...inputStyle, cursor:'pointer' }}>
              <option value="let">Let</option>
              <option value="void">Void</option>
              <option value="available">Available</option>
              <option value="under_offer">Under Offer</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Branch</label>
            <select value={form.branch} onChange={set('branch')} style={{ ...inputStyle, cursor:'pointer' }}>
              <option>London Central</option>
              <option>London North</option>
              <option>Hertfordshire</option>
            </select>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={labelStyle}>Management Type</label>
            <select value={form.managementType} onChange={set('managementType')} style={{ ...inputStyle, cursor:'pointer' }}>
              <option value="full">Full Management</option>
              <option value="rent_collection">Rent Collection</option>
              <option value="let_only">Let Only</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Landlord</label>
            <select value={form.landlordId} onChange={set('landlordId')} style={{ ...inputStyle, cursor:'pointer' }}>
              <option value="">— None —</option>
              {LANDLORDS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, paddingTop:4 }}>
          <button className="btn-secondary" style={{ flex:1, justifyContent:'center' }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex:2, justifyContent:'center' }} onClick={handleSave}>
            <Save size={13} /> Save Changes
          </button>
        </div>

        {/* Delete section */}
        <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              style={{ display:'flex', alignItems:'center', gap:7, background:'none', border:'1px solid #fecaca', borderRadius:8, padding:'8px 14px', color:'#dc2626', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', width:'100%', justifyContent:'center' }}>
              <Trash2 size={13} /> {property.isNew ? 'Delete Property' : 'Remove from Portfolio'}
            </button>
          ) : (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'14px' }}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:12 }}>
                <AlertTriangle size={16} color="#dc2626" style={{ flexShrink:0, marginTop:1 }} />
                <p style={{ fontSize:13, fontWeight:600, color:'#991b1b' }}>
                  {property.isNew
                    ? 'This will permanently delete this property and all associated data.'
                    : 'This will hide this property from all views. You can restore it from Settings.'}
                </p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:13 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'none', background:'#dc2626', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }} onClick={handleDelete}>
                  <Trash2 size={12} /> Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Portal positioned near anchor button
  if (anchorRect) {
    const pos = getEditPosition(anchorRect)
    return createPortal(
      <>
        <div style={{ position:'fixed', inset:0, zIndex:59 }} onClick={onClose} />
        <div style={{ position:'fixed', zIndex:60, ...pos }}>
          {content}
        </div>
      </>,
      document.body
    )
  }

  // Fallback centred
  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:59 }} onClick={onClose} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:60 }}>
        {content}
      </div>
    </>,
    document.body
  )
}

function getEditPosition(rect) {
  const w = 500, h = 580, gap = 8
  const vw = window.innerWidth, vh = window.innerHeight
  let left = rect.right - w
  left = Math.max(8, Math.min(left, vw - w - 8))
  let top = rect.bottom + gap
  if (top + h > vh - 8) top = rect.top - h - gap
  top = Math.max(8, top)
  return { top, left }
}
