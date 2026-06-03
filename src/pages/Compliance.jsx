import { useState } from 'react'
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, Zap, ChevronRight, Flame, Zap as ElecIcon, Leaf, Wind, Shield, CreditCard } from 'lucide-react'
import { PROPERTIES, getLandlordById } from '../data/mockData'
import PDFButton from '../components/PDFButton'
import { generateComplianceReport } from '../lib/pdfExport'

const CERT_TYPES = [
  { key: 'gasSafety', label: 'Gas Safety', icon: Flame, color: '#dc2626', bgColor: '#fef2f2' },
  { key: 'eicr', label: 'EICR', icon: ElecIcon, color: '#d97706', bgColor: '#fffbeb' },
  { key: 'epc', label: 'EPC', icon: Leaf, color: '#16a34a', bgColor: '#f0fdf4' },
  { key: 'smokeAlarm', label: 'Smoke Alarm', icon: Wind, color: '#6366f1', bgColor: '#eef2ff' },
  { key: 'depositProtection', label: 'Deposit Protection', icon: CreditCard, color: '#0284c7', bgColor: '#eff6ff' },
  { key: 'rightToRent', label: 'Right to Rent', icon: Shield, color: '#7c3aed', bgColor: '#ede9fe' },
]

function statusBadge(status) {
  const map = {
    expired: { label: 'Expired', class: 'badge-red' },
    expiring_soon: { label: 'Expiring < 30d', class: 'badge-amber' },
    valid: { label: 'Valid', class: 'badge-green' },
    overdue: { label: 'Overdue', class: 'badge-red' },
    not_verified: { label: 'Not Verified', class: 'badge-red' },
    'n/a': { label: 'N/A (Void)', class: 'badge-slate' },
  }
  const s = map[status] || { label: status, class: 'badge-slate' }
  return <span className={`badge ${s.class}`}>{s.label}</span>
}

function ComplianceSummaryCard({ cert, count, expired, expiring, valid }) {
  const Icon = cert.icon
  return (
    <div className="stat-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: cert.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} color={cert.color} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{cert.label}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, textAlign: 'center', background: '#fef2f2', borderRadius: 6, padding: '8px 4px' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{expired}</p>
          <p style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>Expired</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center', background: '#fffbeb', borderRadius: 6, padding: '8px 4px' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{expiring}</p>
          <p style={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>Due Soon</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', borderRadius: 6, padding: '8px 4px' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{valid}</p>
          <p style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Valid</p>
        </div>
      </div>
    </div>
  )
}

export default function Compliance() {
  const [filter, setFilter] = useState('All')
  const [certType, setCertType] = useState('All')

  // Build compliance summary per cert type
  const summary = CERT_TYPES.map(ct => {
    const props = PROPERTIES.filter(p => p.status !== 'void')
    const statuses = props.map(p => p.compliance[ct.key]?.status)
    return {
      ...ct,
      expired: statuses.filter(s => s === 'expired' || s === 'not_verified' || s === 'overdue').length,
      expiring: statuses.filter(s => s === 'expiring_soon').length,
      valid: statuses.filter(s => s === 'valid').length,
    }
  })

  // Build property compliance rows
  const rows = PROPERTIES.map(p => {
    const landlord = getLandlordById(p.landlordId)
    const certs = CERT_TYPES.map(ct => ({ ...ct, status: p.compliance[ct.key]?.status, expiry: p.compliance[ct.key]?.expiry || p.compliance[ct.key]?.lastCheck }))
    const hasCritical = certs.some(c => ['expired','not_verified','overdue'].includes(c.status))
    const hasWarning = certs.some(c => c.status === 'expiring_soon')
    const risk = hasCritical ? 'critical' : hasWarning ? 'warning' : 'compliant'
    return { ...p, certs, risk, landlord }
  })

  const filtered = rows.filter(r => {
    if (filter === 'Critical') return r.risk === 'critical'
    if (filter === 'Warning') return r.risk === 'warning'
    if (filter === 'Compliant') return r.risk === 'compliant'
    return true
  })

  const criticalCount = rows.filter(r => r.risk === 'critical').length
  const warningCount = rows.filter(r => r.risk === 'warning').length
  const compliantCount = rows.filter(r => r.risk === 'compliant').length

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Compliance Centre</h1>
          <p className="page-subtitle">Track EPC, Gas Safety, EICR, Smoke Alarms, Deposits & Right to Rent across all properties</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PDFButton label="Export Compliance Report" onGenerate={() => generateComplianceReport(filtered)} />
          <button className="btn-primary" onClick={() => setFilter('Critical')}><Zap size={13} /> Show Critical Only</button>
        </div>
      </div>

      {/* Critical alert */}
      {criticalCount > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
        }}>
          <AlertTriangle size={18} color="#dc2626" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#991b1b' }}>
              {criticalCount} {criticalCount === 1 ? 'property has' : 'properties have'} critical compliance failures
            </p>
            <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>
              Expired certificates expose the agency to financial penalties and invalidate insurance. Immediate action required.
            </p>
          </div>
          <button className="btn-primary" style={{ background: '#dc2626' }}>View Critical Issues →</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid-cols-3" style={{ marginBottom: 24 }}>
        {summary.slice(0, 3).map(s => <ComplianceSummaryCard key={s.key} cert={s} {...s} />)}
      </div>
      <div className="grid-cols-3" style={{ marginBottom: 24 }}>
        {summary.slice(3).map(s => <ComplianceSummaryCard key={s.key} cert={s} {...s} />)}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: `All (${rows.length})`, value: 'All' },
          { label: `Critical (${criticalCount})`, value: 'Critical' },
          { label: `Warning (${warningCount})`, value: 'Warning' },
          { label: `Compliant (${compliantCount})`, value: 'Compliant' },
        ].map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filter === tab.value ? 'none' : '1px solid #e2e8f0',
              background: filter === tab.value
                ? tab.value === 'Critical' ? '#dc2626' : tab.value === 'Warning' ? '#d97706' : tab.value === 'Compliant' ? '#10b981' : '#0f172a'
                : 'white',
              color: filter === tab.value ? 'white' : '#374151',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Compliance grid */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: 200 }}>Property</th>
              <th>Risk</th>
              {CERT_TYPES.map(ct => (
                <th key={ct.key} style={{ minWidth: 110 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ct.icon size={11} color={ct.color} />
                    {ct.label}
                  </div>
                </th>
              ))}
              <th>Landlord</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ cursor: 'pointer' }}>
                <td>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 12.5 }}>{p.address}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{p.postcode} · {p.branch}</p>
                  </div>
                </td>
                <td>
                  {p.risk === 'critical' && <span className="badge badge-red"><AlertTriangle size={10} /> Critical</span>}
                  {p.risk === 'warning' && <span className="badge badge-amber"><Clock size={10} /> Warning</span>}
                  {p.risk === 'compliant' && <span className="badge badge-green"><CheckCircle size={10} /> OK</span>}
                </td>
                {p.certs.map(cert => (
                  <td key={cert.key}>
                    <div>
                      {statusBadge(cert.status)}
                      {cert.expiry && cert.status !== 'valid' && (
                        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                          {new Date(cert.expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </td>
                ))}
                <td style={{ fontSize: 12.5, color: '#334155' }}>{p.landlord?.name}</td>
                <td><ChevronRight size={13} color="#cbd5e1" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI risk summary */}
      <div className="card" style={{ marginTop: 20, padding: 20, background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} color="white" />
          </div>
          <div>
            <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>AI Compliance Risk Assessment</p>
            <p style={{ color: '#e2e8f0', fontSize: 13.5, lineHeight: 1.7 }}>
              <strong style={{ color: 'white' }}>Highest risk: 22A Upper Street (N1 0PQ)</strong> — EPC Grade E expired, Gas Safety Certificate expired, smoke alarm overdue. This property <strong style={{ color: '#f87171' }}>cannot legally be re-let</strong> until EPC reaches minimum Grade D.
              The agency faces potential fines of up to £30,000 for the Right to Rent failure at 88 Finchley Road.
              Priority action: book Gas Safe engineer for 22A Upper Street and 34 St Albans Road within 48 hours. Schedule EICR renewal for 23 Watford High Street — currently 6 months overdue.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
