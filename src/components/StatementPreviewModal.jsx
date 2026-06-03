import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, CheckCircle } from 'lucide-react'
import { addLandlordActivity } from '../lib/landlordStore'

export default function StatementPreviewModal({ landlord, properties, onClose }) {
  const [generated, setGenerated] = useState(false)
  const month     = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const totalRent = properties.reduce((s, p) => s + (p.rent || 0), 0)
  const fee       = Math.round(totalRent * (landlord.managementFee || 10) / 100)
  const net       = totalRent - fee

  const handleGenerate = () => {
    setGenerated(true)
    addLandlordActivity(landlord.id, { type: 'statement', text: `Statement preview generated for ${month}` })
  }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Statement Preview</h2>
            <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>Demo statement preview — not linked to live payments yet</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        <div style={{ padding: 22 }}>
          {/* Statement card */}
          <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 12, padding: '20px 20px 16px', marginBottom: 16, color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Harrington & Co</p>
                <p style={{ fontSize: 16, fontWeight: 800 }}>{landlord.name}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{month}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Net Estimate</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>£{net.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Gross Rent', value: `£${totalRent.toLocaleString()}` },
                { label: `Mgmt Fee (${landlord.managementFee||10}%)`, value: `-£${fee.toLocaleString()}` },
                { label: 'Net (est.)', value: `£${net.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 10px' }}>
                  <p style={{ fontSize: 10.5, color: '#64748b', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Properties breakdown */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>Properties ({properties.length})</p>
            {properties.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No properties linked to this landlord.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {properties.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 7 }}>
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{p.address}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>{p.postcode} · {p.status === 'let' ? 'Let' : 'Void'}</p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>£{(p.rent||0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>
              ⚠ Demo statement preview — figures are estimates based on listed rents. Not linked to live payment records. Real statements require accounting integration.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Close</button>
            {!generated ? (
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleGenerate}>
                <Download size={13} /> Generate Preview
              </button>
            ) : (
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f0fdf4', borderRadius: 8, padding: '8px', color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                <CheckCircle size={14} /> Preview generated
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
