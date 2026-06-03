import { useState } from 'react'
import { HardHat, Star, Phone, Mail, CheckCircle, Clock, Plus, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { CONTRACTORS, MAINTENANCE_JOBS } from '../data/mockData'

const TRADE_COLORS = {
  'Plumbing':             { color: '#2563eb', bg: '#eff6ff' },
  'Gas & Heating':        { color: '#dc2626', bg: '#fef2f2' },
  'Electrical':           { color: '#d97706', bg: '#fffbeb' },
  'Cleaning':             { color: '#10b981', bg: '#f0fdf4' },
  'Locksmith':            { color: '#7c3aed', bg: '#ede9fe' },
  'Roofing':              { color: '#64748b', bg: '#f8fafc' },
  'General Maintenance':  { color: '#0284c7', bg: '#eff6ff' },
  'Decorating':           { color: '#c026d3', bg: '#fdf4ff' },
}

function RatingStars({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12}
          fill={i < Math.floor(rating) ? '#f59e0b' : 'none'}
          color={i < Math.floor(rating) ? '#f59e0b' : '#e2e8f0'} />
      ))}
      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginLeft: 3 }}>{rating}</span>
    </div>
  )
}

function Badge({ text, color, bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bg, color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {text}
    </span>
  )
}

export default function Contractors() {
  const [expanded, setExpanded] = useState(null)
  const [tradeFilter, setTradeFilter] = useState('All')

  const enriched = CONTRACTORS.map(c => ({
    ...c,
    openJobs:       MAINTENANCE_JOBS.filter(j => j.assignedTo === c.id && j.status !== 'completed').length,
    completedRecent:MAINTENANCE_JOBS.filter(j => j.assignedTo === c.id && j.status === 'completed').length,
    tc: TRADE_COLORS[c.trade] || { color: '#64748b', bg: '#f8fafc' },
  }))

  const trades = ['All', ...new Set(CONTRACTORS.map(c => c.trade))]
  const filtered = tradeFilter === 'All' ? enriched : enriched.filter(c => c.trade === tradeFilter)

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Contractor Management</h1>
          <p className="page-subtitle">{CONTRACTORS.length} approved contractors across all trades</p>
        </div>
        <button className="btn-primary"><Plus size={13} /> Add Contractor</button>
      </div>

      {/* Trade filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {trades.map(t => (
          <button key={t} onClick={() => setTradeFilter(t)}
            style={{
              padding: '6px 13px', borderRadius: 20, fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              border: tradeFilter === t ? 'none' : '1px solid #e2e8f0',
              background: tradeFilter === t ? '#0f172a' : 'white',
              color: tradeFilter === t ? 'white' : '#64748b',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Contractor list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(c => {
          const isOpen = expanded === c.id

          return (
            <div key={c.id}
              style={{ background: 'white', borderRadius: 12, border: `1px solid ${isOpen ? '#10b981' : '#e2e8f0'}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>

              {/* ── Main row ── */}
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>

                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 11, background: c.tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HardHat size={20} color={c.tc.color} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{c.name}</p>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: c.tc.bg, color: c.tc.color }}>
                      {c.trade}
                    </span>
                    {c.openJobs > 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#eef2ff', color: '#6366f1' }}>
                        {c.openJobs} open job{c.openJobs !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Key stats row — wraps nicely on any width */}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <RatingStars rating={c.rating} />
                    <span style={{ fontSize: 12, color: '#64748b' }}>⚡ {c.avgResponseHours}h response</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{c.completedJobs} jobs</span>
                    {c.calloutFee > 0
                      ? <span style={{ fontSize: 12, color: '#64748b' }}>£{c.calloutFee} callout</span>
                      : <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>No callout fee</span>}
                    {c.dayRate > 0 && <span style={{ fontSize: 12, color: '#64748b' }}>£{c.dayRate}/day</span>}
                  </div>
                </div>

                {/* Cert badges + chevron */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {c.insured && <Badge text="✓ Insured" color="#16a34a" bg="#f0fdf4" />}
                    {c.gasRegistered && <Badge text="🔥 Gas Safe" color="#dc2626" bg="#fef2f2" />}
                    {c.electricalRegistered && <Badge text="⚡ NICEIC" color="#d97706" bg="#fffbeb" />}
                  </div>
                  {isOpen
                    ? <ChevronUp size={16} color="#94a3b8" />
                    : <ChevronDown size={16} color="#94a3b8" />}
                </div>
              </button>

              {/* ── Expanded detail ── */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px', background: '#fafafa' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                    {/* Contact */}
                    <div style={{ background: 'white', borderRadius: 9, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 8 }}>Contact</p>
                      <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', marginBottom: 4 }}>{c.contact}</p>
                      <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', textDecoration: 'none', marginBottom: 4 }}>
                        <Phone size={12} color="#94a3b8" /> {c.phone}
                      </a>
                      <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', textDecoration: 'none' }}>
                        <Mail size={12} color="#94a3b8" /> {c.email}
                      </a>
                    </div>

                    {/* Performance */}
                    <div style={{ background: 'white', borderRadius: 9, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 8 }}>Performance</p>
                      {[
                        { label: 'Total jobs completed', value: c.completedJobs },
                        { label: 'Avg response time',   value: `${c.avgResponseHours}h` },
                        { label: 'Open jobs (active)',  value: c.openJobs },
                        { label: 'Rating',              value: `${c.rating}/5` },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12.5, color: '#64748b' }}>{row.label}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Rates */}
                    <div style={{ background: 'white', borderRadius: 9, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 8 }}>Rates & Accreditations</p>
                      {[
                        { label: 'Day rate',     value: c.dayRate > 0 ? `£${c.dayRate}` : 'Quote only' },
                        { label: 'Callout fee',  value: c.calloutFee > 0 ? `£${c.calloutFee}` : 'None' },
                        { label: 'Insured',      value: c.insured ? '✓ Yes' : '✗ No', color: c.insured ? '#10b981' : '#dc2626' },
                        { label: 'Gas Safe',     value: c.gasRegistered ? '✓ Registered' : '—', color: c.gasRegistered ? '#10b981' : '#94a3b8' },
                        { label: 'NICEIC',       value: c.electricalRegistered ? '✓ Registered' : '—', color: c.electricalRegistered ? '#10b981' : '#94a3b8' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12.5, color: '#64748b' }}>{row.label}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: row.color || '#0f172a' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href={`tel:${c.phone}`} className="btn-secondary" style={{ fontSize: 13, textDecoration: 'none' }}>
                      <Phone size={13} /> Call Now
                    </a>
                    <a href={`mailto:${c.email}`} className="btn-secondary" style={{ fontSize: 13, textDecoration: 'none' }}>
                      <Mail size={13} /> Email
                    </a>
                    <button className="btn-primary" style={{ fontSize: 13 }}>Assign to Job</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
