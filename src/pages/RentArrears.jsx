import { useState } from 'react'
import { PoundSterling, AlertTriangle, TrendingDown, Clock, Zap, Mail, Phone, FileText, CheckCircle } from 'lucide-react'
import { TENANCIES, getPropertyById, getTenantById, RENT_COLLECTION_CHART } from '../data/mockData'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { sendArrearsLetter } from '../lib/email'
import { generateArrearsLetter, isAIConfigured } from '../lib/ai'

const ARREARS_STAGES = {
  stage1: { label: 'Stage 1 — Reminder', days: '7-14', color: '#f59e0b', bg: '#fffbeb' },
  stage2: { label: 'Stage 2 — Formal Notice', days: '15-30', color: '#ef4444', bg: '#fef2f2' },
  stage3: { label: 'Stage 3 — Legal Action', days: '31+', color: '#7f1d1d', bg: '#fef2f2' },
}

function getArrearStage(months) {
  if (months >= 3) return 'stage3'
  if (months >= 2) return 'stage2'
  return 'stage1'
}

export default function RentArrears() {
  const [selectedTenancy, setSelectedTenancy] = useState(null)
  const [showAILetter, setShowAILetter]         = useState(false)
  const [sending, setSending]   = useState(false)
  const [sentId, setSentId]     = useState(null)
  const [aiLetter, setAiLetter] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const handleGenerateLetter = async (tenancy) => {
    if (!isAIConfigured) return
    setAiLoading(true)
    setAiLetter('')
    try {
      const stage = tenancy.monthsOverdue >= 3 ? 'stage3' : tenancy.monthsOverdue >= 2 ? 'stage2' : 'stage1'
      const text = await generateArrearsLetter({
        tenant:  tenancy.tenant,
        property: tenancy.property,
        tenancy,
        stage,
      })
      setAiLetter(text)
    } catch (e) {
      setAiLetter('Failed to generate: ' + e.message)
    }
    setAiLoading(false)
  }

  const handleSendLetter = async (tenancy) => {
    if (!tenancy?.tenant?.email) { alert('No email address for this tenant.'); return }
    setSending(true)
    try {
      await sendArrearsLetter({
        tenant:     tenancy.tenant,
        property:   tenancy.property,
        tenancy,
      })
      setSentId(tenancy.id)
      setTimeout(() => setSentId(null), 3000)
    } catch (err) {
      alert('Failed to send email: ' + err.message)
    }
    setSending(false)
  }

  const arrearsTenancies = TENANCIES
    .filter(t => t.arrears > 0)
    .map(t => ({
      ...t,
      property: getPropertyById(t.propertyId),
      tenant: getTenantById(t.tenantId),
      monthsOverdue: Math.round(t.arrears / t.monthlyRent),
    }))
    .sort((a, b) => b.arrears - a.arrears)

  const totalArrears = arrearsTenancies.reduce((s, t) => s + t.arrears, 0)
  const allTenancies = TENANCIES.filter(t => t.status !== 'expired').length
  const onTimeTenancies = TENANCIES.filter(t => t.arrears === 0 && t.status !== 'expired').length

  const collectionData = RENT_COLLECTION_CHART.map(d => ({
    month: d.month,
    rate: d.percentage
  }))

  const AI_LETTER = `Dear ${selectedTenancy?.tenant?.name},

Re: Outstanding Rent Arrears — ${selectedTenancy?.property?.address}, ${selectedTenancy?.property?.postcode}

I am writing to you regarding the outstanding rent balance on the above property, which currently stands at £${selectedTenancy?.arrears?.toLocaleString()}.

Your rent of £${selectedTenancy?.monthlyRent?.toLocaleString()} per month was last received on ${selectedTenancy?.lastPaymentDate ? new Date(selectedTenancy.lastPaymentDate).toLocaleDateString('en-GB') : 'N/A'}. As of today's date, ${selectedTenancy?.monthsOverdue} month${selectedTenancy?.monthsOverdue !== 1 ? 's' : ''} of rent remains outstanding.

We would ask that you make payment of the outstanding balance in full within 7 days of this letter. If you are experiencing financial difficulties, we encourage you to contact us immediately to discuss a repayment plan.

Failure to clear this balance may result in formal proceedings being commenced under Section 8 of the Housing Act 1988.

Please contact our office on 020 7123 4567 or email us at arrears@harrington.co.uk.

Yours sincerely,
Harrington & Co Property Management`

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Rent & Arrears</h1>
          <p className="page-subtitle">Rent collection, arrears management and chase communications</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAILetter(true)}>
          <Zap size={13} /> Generate AI Letters
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Arrears', value: `£${totalArrears.toLocaleString()}`, sub: `${arrearsTenancies.length} tenancies`, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Collection Rate', value: '85.8%', sub: 'Feb 2025', color: '#d97706', bg: '#fffbeb' },
          { label: 'Paying On Time', value: `${onTimeTenancies}/${allTenancies}`, sub: 'tenancies', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Legal Threshold', value: '2 cases', sub: '2+ months overdue', color: '#6366f1', bg: '#eef2ff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '16px', border: `1px solid ${s.color}20` }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: s.color, opacity: 0.7, marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: 11, color: s.color, opacity: 0.5, marginTop: 1 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid-2-1" style={{ marginBottom: 20 }}>
        {/* Collection chart */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header">
            <p className="section-title">Collection Rate Trend</p>
            <span className="badge badge-red">Feb: 85.8% — Below 95% target</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={collectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => [`${v}%`, 'Collection Rate']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={13} color="#dc2626" />
            <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 500 }}>Collection rate has declined 3 consecutive months. 4 new arrears cases in Feb.</span>
          </div>
        </div>

        {/* Arrears by stage */}
        <div className="card" style={{ padding: 20 }}>
          <p className="section-title" style={{ marginBottom: 14 }}>Arrears by Stage</p>
          {['stage1','stage2','stage3'].map(stage => {
            const stageConfig = ARREARS_STAGES[stage]
            const count = arrearsTenancies.filter(t => getArrearStage(t.monthsOverdue) === stage).length
            const amount = arrearsTenancies.filter(t => getArrearStage(t.monthsOverdue) === stage).reduce((s,t) => s + t.arrears, 0)
            return (
              <div key={stage} style={{ marginBottom: 12, padding: '12px', borderRadius: 8, background: stageConfig.bg, border: `1px solid ${stageConfig.color}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: stageConfig.color }}>{stageConfig.label}</p>
                    <p style={{ fontSize: 11, color: stageConfig.color, opacity: 0.7 }}>{count} tenancies</p>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: stageConfig.color }}>£{amount.toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Arrears table */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="section-title">Arrears Cases</p>
          <span style={{ fontSize: 12.5, color: '#94a3b8' }}>{arrearsTenancies.length} cases · £{totalArrears.toLocaleString()} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Monthly Rent</th>
                <th>Arrears</th>
                <th>Months Overdue</th>
                <th>Stage</th>
                <th>Last Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {arrearsTenancies.map(t => {
                const stage = getArrearStage(t.monthsOverdue)
                const stageConfig = ARREARS_STAGES[stage]
                return (
                  <tr key={t.id} onClick={() => setSelectedTenancy(selectedTenancy?.id === t.id ? null : t)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{t.tenant?.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.tenant?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, color: '#334155' }}>{t.property?.address}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.property?.postcode}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>£{t.monthlyRent.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: '#dc2626', fontSize: 14 }}>£{t.arrears.toLocaleString()}</td>
                    <td>
                      <span style={{ fontSize: 13, fontWeight: 700, color: stageConfig.color }}>{t.monthsOverdue} months</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: stageConfig.bg, color: stageConfig.color }}>
                        {stageConfig.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {t.lastPaymentDate ? new Date(t.lastPaymentDate).toLocaleDateString('en-GB') : 'No record'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={e => { e.stopPropagation(); setSelectedTenancy(t); setAiLetter(''); setShowAILetter(true); if (isAIConfigured) handleGenerateLetter({ ...t, tenant: getTenantById(t.tenantId), property: getPropertyById(t.propertyId), monthsOverdue: Math.round(t.arrears / t.monthlyRent) }) }}>
                          <Zap size={10} /> Letter
                        </button>
                        <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={e => e.stopPropagation()}>
                          <Phone size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI letter modal */}
      {showAILetter && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowAILetter(false)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>AI-Generated Arrears Letter</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{selectedTenancy?.tenant?.name || 'All arrears tenants'}</p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-line', marginBottom: 16 }}>
              {aiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ color: '#64748b', fontSize: 13 }}>Claude is writing the letter…</span>
                </div>
              ) : (aiLetter || (selectedTenancy ? AI_LETTER : `AI will generate personalised letters for all ${arrearsTenancies.length} arrears cases.\n\nEach letter will be tailored to:\n• The specific arrears amount and duration\n• Previous communication history\n• The appropriate legal stage\n• Landlord preferences for tone`))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowAILetter(false)} style={{ flex: 1, justifyContent: 'center' }}>Close</button>
              <button
                className="btn-primary"
                disabled={sending || !selectedTenancy}
                onClick={() => selectedTenancy && handleSendLetter(selectedTenancy)}
                style={{ flex: 2, justifyContent: 'center' }}>
                {sentId === selectedTenancy?.id
                  ? <><CheckCircle size={13} /> Sent!</>
                  : sending
                  ? 'Sending…'
                  : <><Mail size={13} /> Send via Email</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
