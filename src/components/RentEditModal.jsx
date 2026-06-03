import { useState } from 'react'
import { X, Save, TrendingUp, TrendingDown } from 'lucide-react'
import { setPropertyOverride, getPropertyOverrides, getEffectiveRent } from '../lib/propertyOverrides'

export default function RentEditModal({ property, onSave, onClose }) {
  const currentRent = getEffectiveRent(property)
  const [rent, setRent]     = useState(currentRent)
  const [reason, setReason] = useState('')

  const change    = rent - currentRent
  const changePct = currentRent > 0 ? ((change / currentRent) * 100).toFixed(1) : 0

  const handleSave = () => {
    if (rent === currentRent) { onClose(); return }
    setPropertyOverride(property.id, {
      rent,
      rentHistory: [
        { from: currentRent, to: rent, reason, date: new Date().toISOString() },
        ...getRentHistory(property.id),
      ],
    })
    onSave?.(property.id, rent)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Update Rent</h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>{property.address}, {property.postcode}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Current vs New */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, padding: '14px', background: '#f8fafc', borderRadius: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Current Rent</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>£{currentRent.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>per month</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>New Rent</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: change > 0 ? '#10b981' : change < 0 ? '#dc2626' : '#0f172a' }}>
              £{Number(rent).toLocaleString()}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>per month</p>
          </div>
        </div>

        {/* Change indicator */}
        {change !== 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14, padding: '9px', borderRadius: 8, background: change > 0 ? '#f0fdf4' : '#fef2f2' }}>
            {change > 0
              ? <TrendingUp size={14} color="#10b981" />
              : <TrendingDown size={14} color="#dc2626" />}
            <span style={{ fontSize: 13.5, fontWeight: 700, color: change > 0 ? '#10b981' : '#dc2626' }}>
              {change > 0 ? '+' : ''}£{Math.abs(change).toLocaleString()} ({change > 0 ? '+' : ''}{changePct}%) per month
            </span>
            <span style={{ fontSize: 12, color: change > 0 ? '#16a34a' : '#dc2626' }}>
              · £{Math.abs(change * 12).toLocaleString()} / year
            </span>
          </div>
        )}

        {/* Rent input */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 6 }}>
            New Monthly Rent (£)
          </label>
          <input
            type="number"
            value={rent}
            onChange={e => setRent(Number(e.target.value))}
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '12px 14px', fontSize: 22, fontWeight: 800, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', textAlign: 'center' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 6 }}>
            Reason <span style={{ color: '#cbd5e1', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span>
          </label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Annual review, market rate increase, renewal negotiation…"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 14px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSave} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={rent <= 0}>
            <Save size={14} /> Save Rent Change
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper re-export so pages don't need two imports
function getRentHistory(propertyId) {
  try {
    const all = JSON.parse(localStorage.getItem('propertyops_property_overrides') || '{}')
    return all[propertyId]?.rentHistory || []
  } catch { return [] }
}
