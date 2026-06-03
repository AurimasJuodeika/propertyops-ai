import { createPortal } from 'react-dom'
import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { endTenancy } from '../lib/tenancyStore'

const REASONS = [
  'Tenant moved out',
  'Eviction / Notice',
  'Mutual agreement',
  'Property sold',
  'Other',
]

export default function EndTenancyModal({ tenancy, property, onEnd, onClose }) {
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason]   = useState('')
  const [confirm, setConfirm] = useState(false)

  const handleEnd = () => {
    if (!reason) { alert('Please select a reason.'); return }
    endTenancy(tenancy.id, { endDate, reason })
    onEnd({ endDate, reason })
    onClose()
  }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 440, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>End Tenancy</h2>
            <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{property?.address} · {tenancy.tenantName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#991b1b', fontWeight: 500 }}>
            This will mark the tenancy as ended and set the property status to Void. This action can be undone by creating a new tenancy.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 8 }}>Reason *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: reason === r ? '2px solid #dc2626' : '1.5px solid #e2e8f0', background: reason === r ? '#fef2f2' : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', fontSize: 13.5, fontWeight: reason === r ? 600 : 400, color: reason === r ? '#dc2626' : '#334155' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${reason === r ? '#dc2626' : '#e2e8f0'}`, background: reason === r ? '#dc2626' : 'white', flexShrink: 0 }} />
                  {r}
                </button>
              ))}
            </div>
          </div>

          {!confirm ? (
            <button onClick={() => setConfirm(true)} disabled={!reason}
              style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', cursor: reason ? 'pointer' : 'default', background: reason ? '#dc2626' : '#e2e8f0', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', opacity: reason ? 1 : 0.5 }}>
              End Tenancy
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', textAlign: 'center', marginBottom: 10 }}>
                Are you sure? This cannot be undone easily.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirm(false)}>Cancel</button>
                <button style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }} onClick={handleEnd}>
                  Confirm End Tenancy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
