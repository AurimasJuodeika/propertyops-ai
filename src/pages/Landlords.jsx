import { useState } from 'react'
import { Users, Star, PoundSterling, Building2, Plus, Zap, ChevronRight, Mail, Phone, CheckCircle } from 'lucide-react'
import { LANDLORDS, PROPERTIES, TENANCIES } from '../data/mockData'
import PDFButton from '../components/PDFButton'
import { generateLandlordStatement } from '../lib/pdfExport'
import { sendLandlordUpdate } from '../lib/email'

export default function Landlords() {
  const [selected, setSelected]     = useState(null)
  const [showAIUpdate, setShowAIUpdate] = useState(false)
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)

  const handleSendUpdate = async () => {
    if (!selected?.email) { alert('No email address for this landlord.'); return }
    setSending(true)
    try {
      await sendLandlordUpdate({
        landlord:   selected,
        properties: selected.propertyList,
      })
      setSent(true)
      setTimeout(() => setSent(false), 3000)
      setShowAIUpdate(false)
    } catch (err) {
      alert('Failed to send: ' + err.message)
    }
    setSending(false)
  }

  const enriched = LANDLORDS.map(l => ({
    ...l,
    propertyList: PROPERTIES.filter(p => l.properties.includes(p.id)),
    totalRent: PROPERTIES.filter(p => l.properties.includes(p.id)).reduce((s, p) => s + p.rent, 0),
  }))

  const AI_UPDATE = selected ? `Dear ${selected.name},

I hope this message finds you well. Please find below your monthly portfolio update from Harrington & Co.

PORTFOLIO SUMMARY — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}

Properties Under Management: ${selected.properties.length}
Monthly Rent Roll: £${selected.totalRent?.toLocaleString() || 0}
Current Account Balance: ${selected.balance >= 0 ? '£' + selected.balance.toLocaleString() : '-£' + Math.abs(selected.balance).toLocaleString()}

MAINTENANCE UPDATE
One routine maintenance job is currently open on your portfolio. We have appointed a contractor and expect completion within 5 working days. We will keep you updated on progress.

COMPLIANCE STATUS
All compliance certificates on your properties are currently in order. Your next Gas Safety renewal is due in June 2025 — we will contact you one month in advance to arrange access.

UPCOMING INSPECTIONS
A mid-tenancy inspection is scheduled for next month. We will contact the tenant to arrange access.

If you have any questions about your portfolio, please don't hesitate to contact your dedicated property manager.

Kind regards,
Harrington & Co Property Management` : ''

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Landlords</h1>
          <p className="page-subtitle">{LANDLORDS.length} landlords · {LANDLORDS.filter(l => l.type === 'Portfolio' || l.type === 'Investor').length} portfolio landlords</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowAIUpdate(true)}><Zap size={13} /> Send AI Updates</button>
          <button className="btn-primary"><Plus size={13} /> Add Landlord</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {/* Landlord list */}
        <div style={{ gridColumn: selected ? '1' : 'span 3' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {enriched.map(l => (
              <div key={l.id} className="card" style={{ padding: '16px', cursor: 'pointer', border: selected?.id === l.id ? '2px solid #10b981' : '1px solid #e2e8f0' }}
                onClick={() => setSelected(l)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {l.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{l.name}</p>
                      <span className={`badge ${l.type === 'Investor' ? 'badge-purple' : l.type === 'Portfolio' ? 'badge-blue' : 'badge-slate'}`}>{l.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building2 size={11} />{l.properties.length} propert{l.properties.length !== 1 ? 'ies' : 'y'}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PoundSterling size={11} />£{l.propertyList.reduce((s, p) => s + p.rent, 0).toLocaleString()}/mo
                      </span>
                      <span style={{ fontSize: 12, color: l.balance >= 0 ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        Balance: {l.balance >= 0 ? '+' : ''}£{l.balance.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{l.managementFee}% fee</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} fill={i < l.rating ? '#f59e0b' : 'none'} color={i < l.rating ? '#f59e0b' : '#e2e8f0'} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ gridColumn: '2 / span 2' }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{selected.name}</h2>
                  <span className={`badge ${selected.type === 'Investor' ? 'badge-purple' : selected.type === 'Portfolio' ? 'badge-blue' : 'badge-slate'}`} style={{ marginTop: 4 }}>{selected.type} Landlord</span>
                </div>
                <button onClick={() => { setSelected(null); setShowAIUpdate(false) }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6 }}>Contact</p>
                  <p style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} />{selected.email}</p>
                  <p style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Phone size={12} />{selected.phone}</p>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6 }}>Account</p>
                  <p style={{ fontSize: 13, color: '#334155' }}>Fee: {selected.managementFee}% · {selected.statementFrequency}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: selected.balance >= 0 ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                    Balance: {selected.balance >= 0 ? '+' : ''}£{selected.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10 }}>Portfolio</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {selected.propertyList.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <Building2 size={14} color="#10b981" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b' }}>{p.address}, {p.postcode}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>{p.bedrooms}bd · {p.type} · £{p.rent.toLocaleString()}/mo</p>
                    </div>
                    <span className={`badge ${p.status === 'let' ? 'badge-green' : 'badge-amber'}`}>{p.status === 'let' ? 'Let' : 'Void'}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}><Mail size={13} /> Email</button>
                <PDFButton
                  label="Statement PDF"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onGenerate={() => generateLandlordStatement(
                    selected,
                    selected.propertyList,
                    TENANCIES.filter(t => selected.properties.includes(t.propertyId)),
                    [
                      { date: '01 Feb 2025', property: selected.propertyList[0]?.address || '', desc: 'Rent received', amount: selected.propertyList[0]?.rent || 0, status: 'received' },
                      { date: '01 Jan 2025', property: selected.propertyList[0]?.address || '', desc: 'Rent received', amount: selected.propertyList[0]?.rent || 0, status: 'received' },
                      { date: '28 Jan 2025', property: 'All Properties', desc: `Management fee (${selected.managementFee}%)`, amount: -Math.round(selected.propertyList.reduce((s,p) => s+p.rent,0) * selected.managementFee / 100), status: 'charged' },
                    ]
                  )}
                />
                <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setShowAIUpdate(true)}>
                  <Zap size={13} /> Generate AI Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI update modal */}
      {showAIUpdate && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowAIUpdate(false)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>AI Landlord Portfolio Update</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{selected.name}</p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-line', marginBottom: 16 }}>
              {AI_UPDATE}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowAIUpdate(false)} style={{ flex: 1, justifyContent: 'center' }}>Close</button>
              <button
                className="btn-primary"
                disabled={sending}
                onClick={handleSendUpdate}
                style={{ flex: 2, justifyContent: 'center' }}>
                {sent ? <><CheckCircle size={13} /> Sent!</> : sending ? 'Sending…' : <><Mail size={13} /> Send to Landlord</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
