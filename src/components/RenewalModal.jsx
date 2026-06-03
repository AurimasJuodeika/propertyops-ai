import { createPortal } from 'react-dom'
import { useState } from 'react'
import { X, Mail, CheckCircle, RefreshCw } from 'lucide-react'
import { sendEmail } from '../lib/email'
import { updateTenancy } from '../lib/tenancyStore'

export default function RenewalModal({ tenancy, property, onRenew, onClose }) {
  const currentEnd  = tenancy?.endDate ? new Date(tenancy.endDate) : new Date()
  const proposedEnd = new Date(currentEnd)
  proposedEnd.setFullYear(proposedEnd.getFullYear() + 1)

  const [newEndDate, setNewEndDate] = useState(proposedEnd.toISOString().split('T')[0])
  const [newRent, setNewRent]       = useState(tenancy?.monthlyRent || '')
  const [note, setNote]             = useState('')
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)

  const handleSend = async () => {
    setSending(true)
    const email = tenancy?.tenantEmail
    if (email) {
      try {
        await sendEmail({
          to:      email,
          subject: `Tenancy Renewal Offer — ${property?.address}`,
          message: `Dear ${tenancy.tenantName},\n\nWe would like to offer you a renewal of your tenancy at ${property?.address}, ${property?.postcode}.\n\nProposed new end date: ${new Date(newEndDate).toLocaleDateString('en-GB')}\nMonthly rent: £${Number(newRent).toLocaleString()}\n\n${note ? `Note from your property manager:\n${note}\n\n` : ''}Please contact us to confirm your renewal or to discuss any changes.\n\nKind regards,\nHarrington & Co · 020 7123 4567`
        })
      } catch (e) { console.warn('Email send failed:', e) }
    }
    updateTenancy(tenancy.id, { renewalOffered: true, proposedEndDate: newEndDate, proposedRent: Number(newRent) })
    setSent(true)
    setTimeout(() => { onRenew({ newEndDate, newRent, note }); onClose() }, 2000)
    setSending(false)
  }

  const inputStyle = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 480, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={16} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Send Renewal Offer</h2>
              <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 1 }}>{property?.address} · {tenancy?.tenantName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        {/* Preview block */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>Renewal Summary</p>
          {[
            ['Tenant',         tenancy?.tenantName],
            ['Property',       `${property?.address}, ${property?.postcode}`],
            ['Current End',    currentEnd.toLocaleDateString('en-GB')],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Proposed New End Date</label>
              <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <label style={labelStyle}>Proposed Rent (£)</label>
              <input type="number" value={newRent} onChange={e => setNewRent(e.target.value)} style={{ ...inputStyle, fontWeight: 700 }}
                onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              {tenancy?.monthlyRent && Number(newRent) !== tenancy.monthlyRent && (
                <p style={{ fontSize: 11, color: Number(newRent) > tenancy.monthlyRent ? '#10b981' : '#dc2626', marginTop: 3, fontWeight: 600 }}>
                  {Number(newRent) > tenancy.monthlyRent ? '+' : ''}£{(Number(newRent) - tenancy.monthlyRent).toLocaleString()}/mo vs current
                </p>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Optional Note to Tenant</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="e.g. We'd love to have you stay on…"
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          {!tenancy?.tenantEmail && (
            <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12.5, color: '#92400e' }}>
              ⚠ No email address for this tenant — renewal will be recorded in demo state only.
            </div>
          )}

          {sent ? (
            <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={18} color="#10b981" />
              <p style={{ fontWeight: 700, color: '#065f46', fontSize: 14 }}>Renewal offer sent to {tenancy?.tenantName}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={sending} style={{ flex: 2, justifyContent: 'center' }} onClick={handleSend}>
                {sending ? 'Sending…' : <><Mail size={14} /> Send Renewal Offer</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
