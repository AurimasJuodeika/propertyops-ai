import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, User, CheckCircle, AlertCircle } from 'lucide-react'
import { createTenancy } from '../lib/tenancyStore'
import { TENANTS } from '../data/mockData'
import { getCustomTenants } from '../lib/propertyOverrides'

const TENANCY_TYPES  = ['AST', 'Company Let', 'Licence', 'Other']
const DEPOSIT_SCHEMES = ['DPS', 'MyDeposits', 'TDS', 'Landlord Held', 'Other']
const END_REASONS    = ['Tenant moved out', 'Eviction / Notice', 'Mutual agreement', 'Property sold', 'Other']

export default function NewTenancyModal({ property, onSave, onClose }) {
  const [form, setForm] = useState({
    tenantId:         '',
    tenantName:       '',
    tenantEmail:      '',
    tenantPhone:      '',
    tenancyType:      'AST',
    startDate:        new Date().toISOString().split('T')[0],
    endDate:          '',
    monthlyRent:      property?.rent || '',
    depositAmount:    property?.rent ? Math.round(property.rent * 1.5) : '',
    depositProtected: 'pending',
    depositScheme:    'DPS',
    rentDueDay:       '1',
    notes:            '',
  })
  const [errors, setErrors]     = useState({})
  const [step, setStep]         = useState(1) // 1=tenant, 2=tenancy details, 3=financial
  const [tenantMode, setTenantMode] = useState('select') // 'select' | 'new'

  const allTenants = [...TENANTS, ...getCustomTenants()]
  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(er => ({ ...er, [k]: null }))
  }

  // Auto-fill when selecting existing tenant
  const selectTenant = (t) => {
    setForm(f => ({ ...f, tenantId: t.id, tenantName: t.name, tenantEmail: t.email, tenantPhone: t.phone || '' }))
    setErrors(er => ({ ...er, tenantName: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.tenantName.trim())        e.tenantName   = 'Tenant name is required'
    if (!form.startDate)                e.startDate    = 'Start date is required'
    if (!form.monthlyRent || Number(form.monthlyRent) <= 0) e.monthlyRent = 'Enter a valid monthly rent'
    if (form.endDate && form.endDate <= form.startDate) e.endDate = 'End date must be after start date'
    if (form.depositAmount && Number(form.depositAmount) < 0) e.depositAmount = 'Enter a valid deposit amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const tenancy = createTenancy({ ...form, propertyId: property.id })
    onSave(tenancy)
    onClose()
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9,
    padding: '10px 12px', fontSize: 13.5, outline: 'none',
    fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', transition: 'border-color 0.15s'
  }
  const labelStyle = { display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }
  const focus = e => e.target.style.borderColor = '#10b981'
  const blur  = e => e.target.style.borderColor = errors[e.target.name] ? '#dc2626' : '#e2e8f0'
  const err   = (k) => errors[k] ? <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{errors[k]}</p> : null

  const STEPS = ['Tenant', 'Tenancy Details', 'Financial']

  const content = (
    <div style={{ background: 'white', borderRadius: 16, width: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
      onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>New Tenancy</h2>
            <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{property?.address}, {property?.postcode}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 4, borderRadius: 2, background: step > i + 1 ? '#10b981' : step === i + 1 ? '#10b981' : '#e2e8f0' }} />
              <p style={{ fontSize: 10.5, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? '#10b981' : '#94a3b8', textAlign: 'center' }}>
                {step > i + 1 ? '✓ ' : ''}{s}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 22px' }}>

        {/* ── Step 1: Tenant ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, background: '#f8fafc', borderRadius: 10, padding: 4 }}>
              {[{ id: 'select', label: 'Select existing tenant' }, { id: 'new', label: 'New tenant' }].map(m => (
                <button key={m.id} onClick={() => setTenantMode(m.id)}
                  style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: tenantMode === m.id ? 'white' : 'transparent', color: tenantMode === m.id ? '#0f172a' : '#64748b', boxShadow: tenantMode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  {m.label}
                </button>
              ))}
            </div>

            {tenantMode === 'select' ? (
              <div>
                <label style={labelStyle}>Select tenant</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                  {allTenants.map(t => (
                    <button key={t.id} onClick={() => selectTenant(t)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: form.tenantId === t.id ? '2px solid #10b981' : '1.5px solid #e2e8f0', background: form.tenantId === t.id ? '#f0fdf4' : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                        {t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a' }}>{t.name}</p>
                        <p style={{ fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</p>
                      </div>
                      {form.tenantId === t.id && <CheckCircle size={16} color="#10b981" />}
                    </button>
                  ))}
                </div>
                {err('tenantName')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input name="tenantName" value={form.tenantName} onChange={set('tenantName')}
                    placeholder="e.g. James Smith" style={{ ...inputStyle, borderColor: errors.tenantName ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
                  {err('tenantName')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" name="tenantEmail" value={form.tenantEmail} onChange={set('tenantEmail')}
                      placeholder="james@email.co.uk" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input name="tenantPhone" value={form.tenantPhone} onChange={set('tenantPhone')}
                      placeholder="07700 900 000" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }}
              onClick={() => { if (!form.tenantName && !form.tenantId) { setErrors({ tenantName: 'Select or enter a tenant' }); return } setErrors({}); setStep(2) }}>
              Next: Tenancy Details →
            </button>
          </div>
        )}

        {/* ── Step 2: Tenancy details ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Tenancy Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {TENANCY_TYPES.map(type => (
                  <button key={type} onClick={() => setForm(f => ({ ...f, tenancyType: type }))}
                    style={{ padding: '8px 4px', borderRadius: 8, border: form.tenancyType === type ? '2px solid #10b981' : '1.5px solid #e2e8f0', background: form.tenancyType === type ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: form.tenancyType === type ? '#059669' : '#64748b', fontFamily: 'inherit', textAlign: 'center' }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Start Date *</label>
                <input type="date" name="startDate" value={form.startDate} onChange={set('startDate')}
                  style={{ ...inputStyle, borderColor: errors.startDate ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
                {err('startDate')}
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input type="date" name="endDate" value={form.endDate} onChange={set('endDate')}
                  style={{ ...inputStyle, borderColor: errors.endDate ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
                {err('endDate')}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Rent Due Day of Month</label>
              <select value={form.rentDueDay} onChange={set('rentDueDay')} style={{ ...inputStyle, cursor: 'pointer' }}>
                {[1,5,7,10,14,15,20,25,28].map(d => <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of the month</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2}
                placeholder="Any additional notes about this tenancy…"
                style={{ ...inputStyle, resize: 'none' }} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setStep(3)}>Next: Financial Details →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Financial ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Monthly Rent (£) *</label>
                <input type="number" name="monthlyRent" value={form.monthlyRent} onChange={set('monthlyRent')}
                  placeholder="e.g. 1350" style={{ ...inputStyle, fontSize: 18, fontWeight: 800, textAlign: 'center', borderColor: errors.monthlyRent ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
                {err('monthlyRent')}
              </div>
              <div>
                <label style={labelStyle}>Deposit Amount (£)</label>
                <input type="number" name="depositAmount" value={form.depositAmount} onChange={set('depositAmount')}
                  placeholder="e.g. 2025" style={{ ...inputStyle, fontSize: 18, fontWeight: 800, textAlign: 'center', borderColor: errors.depositAmount ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur} />
                {err('depositAmount')}
                {form.monthlyRent && form.depositAmount && (
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    = {(form.depositAmount / form.monthlyRent).toFixed(1)} weeks rent
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Deposit Protected?</label>
                <select value={form.depositProtected} onChange={set('depositProtected')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="yes">Yes — Protected</option>
                  <option value="pending">Pending registration</option>
                  <option value="no">No — Not yet protected</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Deposit Scheme</label>
                <select value={form.depositScheme} onChange={set('depositScheme')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {DEPOSIT_SCHEMES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em', marginBottom: 10 }}>Tenancy Summary</p>
              {[
                ['Property',    `${property?.address}, ${property?.postcode}`],
                ['Tenant',      form.tenantName || '—'],
                ['Type',        form.tenancyType],
                ['Start',       form.startDate ? new Date(form.startDate).toLocaleDateString('en-GB') : '—'],
                ['End',         form.endDate   ? new Date(form.endDate).toLocaleDateString('en-GB')   : 'Periodic'],
                ['Monthly Rent',form.monthlyRent ? `£${Number(form.monthlyRent).toLocaleString()}` : '—'],
                ['Deposit',     form.depositAmount ? `£${Number(form.depositAmount).toLocaleString()} (${form.depositScheme})` : 'None'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>← Back</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave}>
                <Save size={14} /> Create Tenancy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69, backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70 }}>
        {content}
      </div>
    </>,
    document.body
  )
}
