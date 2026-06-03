import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save } from 'lucide-react'
import { updateTenancy } from '../lib/tenancyStore'

export default function EditTenancyModal({ tenancy, onSave, onClose }) {
  const [form, setForm] = useState({
    tenantName:       tenancy.tenantName || '',
    tenantEmail:      tenancy.tenantEmail || '',
    tenantPhone:      tenancy.tenantPhone || '',
    startDate:        tenancy.startDate || '',
    endDate:          tenancy.endDate || '',
    monthlyRent:      tenancy.monthlyRent || '',
    depositAmount:    tenancy.depositAmount || '',
    depositProtected: tenancy.depositProtected || 'pending',
    depositScheme:    tenancy.depositScheme || 'DPS',
    rentDueDay:       tenancy.rentDueDay || 1,
    notes:            tenancy.notes || '',
  })
  const [errors, setErrors] = useState({})

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })) }

  const validate = () => {
    const e = {}
    if (!form.tenantName.trim())  e.tenantName  = 'Required'
    if (!form.startDate)          e.startDate   = 'Required'
    if (!form.monthlyRent || Number(form.monthlyRent) <= 0) e.monthlyRent = 'Enter a valid amount'
    if (form.endDate && form.endDate <= form.startDate) e.endDate = 'Must be after start date'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const updated = updateTenancy(tenancy.id, { ...form, monthlyRent: Number(form.monthlyRent), depositAmount: Number(form.depositAmount) || 0, rentDueDay: Number(form.rentDueDay) })
    onSave(updated)
    onClose()
  }

  const input = (key, type = 'text', placeholder = '') => ({
    type, value: form[key], onChange: set(key), placeholder,
    style: { width: '100%', border: `1.5px solid ${errors[key] ? '#dc2626' : '#e2e8f0'}`, borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' },
    onFocus: e => e.target.style.borderColor = '#10b981',
    onBlur:  e => e.target.style.borderColor = errors[key] ? '#dc2626' : '#e2e8f0',
  })
  const lbl = (text, req) => (
    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }}>
      {text}{req && <span style={{ color: '#dc2626' }}> *</span>}
    </label>
  )
  const err = k => errors[k] && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors[k]}</p>

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69, backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', padding: 24 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Edit Tenancy</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>{lbl('Tenant Name', true)}<input {...input('tenantName', 'text', 'Full name')} />{err('tenantName')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>{lbl('Email')}<input {...input('tenantEmail', 'email', 'email@example.co.uk')} /></div>
            <div>{lbl('Phone')}<input {...input('tenantPhone', 'text', '07700 900 000')} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>{lbl('Start Date', true)}<input {...input('startDate', 'date')} />{err('startDate')}</div>
            <div>{lbl('End Date')}<input {...input('endDate', 'date')} />{err('endDate')}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>{lbl('Monthly Rent (£)', true)}<input {...input('monthlyRent', 'number', '1350')} style={{ ...(input('monthlyRent', 'number').style), fontWeight: 700, textAlign: 'center' }} />{err('monthlyRent')}</div>
            <div>{lbl('Deposit (£)')}<input {...input('depositAmount', 'number', '2025')} style={{ ...(input('depositAmount', 'number').style), fontWeight: 700, textAlign: 'center' }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {lbl('Deposit Protected')}
              <select value={form.depositProtected} onChange={set('depositProtected')} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', cursor: 'pointer' }}>
                <option value="yes">Yes — Protected</option>
                <option value="pending">Pending</option>
                <option value="no">Not protected</option>
              </select>
            </div>
            <div>
              {lbl('Deposit Scheme')}
              <select value={form.depositScheme} onChange={set('depositScheme')} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', cursor: 'pointer' }}>
                {['DPS','MyDeposits','TDS','Landlord Held','Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            {lbl('Notes')}
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any additional notes…"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave}>
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
