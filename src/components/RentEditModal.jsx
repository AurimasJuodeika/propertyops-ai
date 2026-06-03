import { useState, useEffect, useRef } from 'react'
import { X, Save, TrendingUp, TrendingDown } from 'lucide-react'
import { setPropertyOverride, getPropertyOverrides, getEffectiveRent } from '../lib/propertyOverrides'

// anchorRect — DOMRect from the trigger button (optional). If provided, renders as a popover near the button.
export default function RentEditModal({ property, onSave, onClose, anchorRect }) {
  const currentRent = getEffectiveRent(property)
  const [rent, setRent]     = useState(currentRent)
  const [reason, setReason] = useState('')
  const popoverRef = useRef(null)

  const change    = rent - currentRent
  const changePct = currentRent > 0 ? ((change / currentRent) * 100).toFixed(1) : 0

  // Position popover near anchor
  const popoverStyle = anchorRect ? getPopoverPosition(anchorRect) : null

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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

  // Render as popover anchored to button, or centred modal as fallback
  if (anchorRect) {
    return (
      <>
        {/* Invisible backdrop to catch outside clicks */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 69 }} onClick={onClose} />
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            zIndex: 70,
            background: 'white',
            borderRadius: 14,
            width: 340,
            padding: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
            ...popoverStyle,
          }}
          onClick={e => e.stopPropagation()}
        >
          <PopoverContent property={property} currentRent={currentRent} rent={rent} setRent={setRent} reason={reason} setReason={setReason} change={change} changePct={changePct} handleSave={handleSave} onClose={onClose} />
        </div>
      </>
    )
  }

  // Fallback: centred modal (used from PropertyDetail header button)
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

// ─── Shared popover content ───────────────────────────────────────────────────
function PopoverContent({ property, currentRent, rent, setRent, reason, setReason, change, changePct, handleSave, onClose }) {
  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Edit Rent</p>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{property.address}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <X size={16} color="#94a3b8" />
        </button>
      </div>

      {/* Current → New */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 6px' }}>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Current</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#64748b' }}>£{currentRent.toLocaleString()}</p>
        </div>
        <span style={{ color: '#94a3b8', fontSize: 18 }}>→</span>
        <div style={{ flex: 1, textAlign: 'center', background: change > 0 ? '#f0fdf4' : change < 0 ? '#fef2f2' : '#f8fafc', borderRadius: 8, padding: '8px 6px' }}>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>New</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: change > 0 ? '#10b981' : change < 0 ? '#dc2626' : '#0f172a' }}>£{Number(rent).toLocaleString()}</p>
        </div>
      </div>

      {change !== 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', borderRadius: 7, background: change > 0 ? '#f0fdf4' : '#fef2f2' }}>
          {change > 0 ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#dc2626" />}
          <span style={{ fontSize: 12.5, fontWeight: 700, color: change > 0 ? '#10b981' : '#dc2626' }}>
            {change > 0 ? '+' : ''}£{Math.abs(change).toLocaleString()} / mo · {change > 0 ? '+' : ''}£{Math.abs(change * 12).toLocaleString()} / yr
          </span>
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }}>New rent (£/mo)</label>
        <input type="number" value={rent} onChange={e => setRent(Number(e.target.value))} autoFocus
          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 18, fontWeight: 800, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', textAlign: 'center' }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <input value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason (optional) — e.g. Annual review"
          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>Cancel</button>
        <button onClick={handleSave} className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 13 }} disabled={rent <= 0}>
          <Save size={13} /> Save
        </button>
      </div>
    </>
  )
}

// ─── Position popover near trigger ───────────────────────────────────────────
function getPopoverPosition(rect) {
  const popoverWidth  = 340
  const popoverHeight = 320 // approx
  const padding       = 8
  const viewport      = { w: window.innerWidth, h: window.innerHeight }

  // Try to appear to the left of the button first, then right
  let left = rect.left - popoverWidth - padding
  if (left < padding) left = rect.right + padding
  if (left + popoverWidth > viewport.w - padding) left = viewport.w - popoverWidth - padding

  // Vertically align to button, but keep within viewport
  let top = rect.top
  if (top + popoverHeight > viewport.h - padding) top = viewport.h - popoverHeight - padding
  if (top < padding) top = padding

  return { top, left }
}

// Helper
function getRentHistory(propertyId) {
  try {
    const all = JSON.parse(localStorage.getItem('propertyops_property_overrides') || '{}')
    return all[propertyId]?.rentHistory || []
  } catch { return [] }
}
