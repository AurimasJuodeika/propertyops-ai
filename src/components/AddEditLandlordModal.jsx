import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, AlertCircle } from 'lucide-react'
import { createLandlord, updateLandlord } from '../lib/landlordStore'

const TYPES   = ['Individual', 'Company', 'Portfolio landlord', 'Investor']
const CONTACT = ['Email', 'Phone', 'SMS', 'WhatsApp']

export default function AddEditLandlordModal({ landlord, onSave, onClose }) {
  const isEdit = !!landlord?.id
  const [form, setForm] = useState({
    name:            landlord?.name            || '',
    type:            landlord?.type            || 'Individual',
    email:           landlord?.email           || '',
    phone:           landlord?.phone           || '',
    address:         landlord?.address         || '',
    preferredContact:landlord?.preferredContact|| 'Email',
    managementFee:   landlord?.managementFee   || 10,
    notes:           landlord?.notes           || '',
    status:          landlord?.status          || 'active',
  })
  const [errors, setErrors] = useState({})

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())                          e.name = 'Landlord name is required'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    if (form.managementFee !== '' && (isNaN(form.managementFee) || Number(form.managementFee) < 0 || Number(form.managementFee) > 50))
      e.managementFee = 'Enter a valid fee between 0% and 50%'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const data = { ...form, managementFee: Number(form.managementFee) || 10 }
    if (isEdit) {
      updateLandlord(landlord.id, data)
      onSave(landlord.id)
    } else {
      const created = createLandlord(data)
      onSave(created.id)
    }
    onClose()
  }

  const inp = (k) => ({
    value: form[k], onChange: set(k),
    style: { width: '100%', border: `1.5px solid ${errors[k] ? '#dc2626' : '#e2e8f0'}`, borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', transition: 'border-color 0.15s' },
    onFocus: e => e.target.style.borderColor = '#10b981',
    onBlur:  e => e.target.style.borderColor = errors[k] ? '#dc2626' : '#e2e8f0',
  })
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }
  const Err = ({ k }) => errors[k] ? <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}><AlertCircle size={10} />{errors[k]}</p> : null

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69, backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', padding: 24 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{isEdit ? 'Edit Landlord' : 'Add Landlord'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Landlord Name *</label>
            <input {...inp('name')} placeholder="e.g. Robert Ashford or Ashford Properties Ltd" autoFocus />
            <Err k="name" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Portfolio Type</label>
              <select value={form.type} onChange={set('type')} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', cursor: 'pointer' }}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Management Fee (%)</label>
              <input type="number" {...inp('managementFee')} placeholder="10" min="0" max="50" style={{ ...inp('managementFee').style, textAlign: 'center', fontWeight: 700, fontSize: 16 }} />
              <Err k="managementFee" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" {...inp('email')} placeholder="landlord@email.co.uk" />
              <Err k="email" />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input {...inp('phone')} placeholder="07700 900 000" />
            </div>
          </div>

          <div>
            <label style={lbl}>Address</label>
            <input {...inp('address')} placeholder="Correspondence address (optional)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Preferred Contact</label>
              <select value={form.preferredContact} onChange={set('preferredContact')} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', cursor: 'pointer' }}>
                {CONTACT.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={set('status')} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', cursor: 'pointer' }}>
                <option value="active">Active</option>
                <option value="attention">Attention Needed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Special instructions, payment preferences, communication notes…"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', resize: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave}>
              <Save size={14} /> {isEdit ? 'Save Changes' : 'Add Landlord'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
