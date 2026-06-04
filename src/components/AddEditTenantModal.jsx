import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, AlertCircle } from 'lucide-react'
import { createTenant, updateTenant } from '../lib/tenantStore'

const CONTACT_METHODS = ['Email', 'Phone', 'SMS', 'WhatsApp']
const NATIONALITIES   = ['British','Irish','EU Pre-settled','EU Settled','Tier 2 Visa','Student Visa','Other']

export default function AddEditTenantModal({ tenant, onSave, onClose }) {
  const isEdit = !!tenant?.id
  const [form, setForm] = useState({
    name:             tenant?.name             || '',
    email:            tenant?.email            || '',
    phone:            tenant?.phone            || '',
    dob:              tenant?.dob              || '',
    currentAddress:   tenant?.currentAddress   || '',
    preferredContact: tenant?.preferredContact || 'Email',
    nationality:      tenant?.nationality      || 'British',
    emergencyName:    tenant?.emergencyName    || '',
    emergencyPhone:   tenant?.emergencyPhone   || '',
    notes:            tenant?.notes            || '',
    rtRVerified:      tenant?.rtRVerified !== undefined ? tenant.rtRVerified : false,
    rtRExpiry:        tenant?.rtRExpiry        || '',
  })
  const [errors, setErrors] = useState({})

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())                               e.name  = 'Tenant name is required'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    if (isEdit) {
      updateTenant(tenant.id, form)
      onSave(tenant.id)
    } else {
      const created = createTenant(form)
      onSave(created.id)
    }
    onClose()
  }

  const inp = (k) => ({
    value: form[k] || '', onChange: set(k),
    style: { width: '100%', border: `1.5px solid ${errors[k] ? '#dc2626' : '#e2e8f0'}`, borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', transition: 'border-color 0.15s' },
    onFocus: e => e.target.style.borderColor = '#10b981',
    onBlur:  e => e.target.style.borderColor = errors[k] ? '#dc2626' : '#e2e8f0',
  })
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }
  const Err = ({ k }) => errors[k] ? <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}><AlertCircle size={10} />{errors[k]}</p> : null
  const sel = (k) => ({ value: form[k] || '', onChange: set(k), style: { ...inp(k).style, cursor: 'pointer' } })

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69, backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', padding: 24 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{isEdit ? 'Edit Tenant' : 'Add Tenant'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Full Name *</label>
            <input {...inp('name')} placeholder="e.g. James & Emma Wilson" autoFocus />
            <Err k="name" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" {...inp('email')} placeholder="tenant@email.co.uk" />
              <Err k="email" />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input {...inp('phone')} placeholder="07700 900 000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Nationality</label>
              <select {...sel('nationality')}>
                {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Preferred Contact</label>
              <select {...sel('preferredContact')}>
                {CONTACT_METHODS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Date of Birth (optional)</label>
            <input type="date" {...inp('dob')} />
          </div>

          <div>
            <label style={lbl}>Current Address (optional)</label>
            <input {...inp('currentAddress')} placeholder="Previous or alternative address" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Emergency Contact Name</label>
              <input {...inp('emergencyName')} placeholder="Next of kin name" />
            </div>
            <div>
              <label style={lbl}>Emergency Contact Phone</label>
              <input {...inp('emergencyPhone')} placeholder="07700 900 001" />
            </div>
          </div>

          <div>
            <label style={lbl}>Right to Rent</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.rtRVerified} onChange={e => setForm(f => ({ ...f, rtRVerified: e.target.checked }))} style={{ accentColor: '#10b981', width: 15, height: 15 }} />
                Verified
              </label>
              {form.rtRVerified && (
                <div style={{ flex: 1 }}>
                  <input type="date" {...inp('rtRExpiry')} placeholder="Expiry date" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes || ''} onChange={set('notes')} rows={2}
              placeholder="Any relevant notes about this tenant…"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', resize: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave}>
              <Save size={14} /> {isEdit ? 'Save Changes' : 'Add Tenant'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
