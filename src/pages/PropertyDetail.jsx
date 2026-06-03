import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, MapPin, User, Users, Wrench, ShieldCheck,
  ClipboardCheck, FileText, PoundSterling, AlertTriangle, CheckCircle,
  Clock, Zap, Edit, Phone, Mail, ChevronRight, Flame, Leaf, Wind,
  Shield, CreditCard, Calendar, Camera
} from 'lucide-react'
import PDFButton from '../components/PDFButton'
import { generatePropertyReport } from '../lib/pdfExport'
import {
  PROPERTIES, getLandlordById, getTenantById, getTenancyByPropertyId,
  MAINTENANCE_JOBS, INSPECTIONS, getContractorById, getComplianceStatus
} from '../data/mockData'

const CERT_CONFIG = {
  epc: { label: 'EPC', icon: Leaf, color: '#16a34a' },
  gasSafety: { label: 'Gas Safety', icon: Flame, color: '#dc2626' },
  eicr: { label: 'EICR', icon: Shield, color: '#d97706' },
  smokeAlarm: { label: 'Smoke Alarms', icon: Wind, color: '#6366f1' },
  depositProtection: { label: 'Deposit Protection', icon: CreditCard, color: '#0284c7' },
  rightToRent: { label: 'Right to Rent', icon: Shield, color: '#7c3aed' },
}

function StatusDot({ status }) {
  const color = status === 'valid' ? '#10b981' : status === 'expired' || status === 'not_verified' || status === 'overdue' ? '#dc2626' : status === 'expiring_soon' ? '#f59e0b' : '#94a3b8'
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 6 }} />
}

function TabBtn({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
      color: active ? '#10b981' : '#64748b',
      borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
    }}>
      {label}
      {badge && <span style={{ background: active ? '#10b981' : '#e2e8f0', color: active ? 'white' : '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>{badge}</span>}
    </button>
  )
}

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const property = PROPERTIES.find(p => p.id === id)
  if (!property) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#64748b' }}>Property not found.</p>
      <Link to="/properties" style={{ color: '#10b981', fontWeight: 600 }}>← Back to Properties</Link>
    </div>
  )

  const landlord = getLandlordById(property.landlordId)
  const tenant = getTenantById(property.tenantId)
  const tenancy = getTenancyByPropertyId(property.id)
  const maintenanceJobs = MAINTENANCE_JOBS.filter(j => j.propertyId === property.id)
  const inspections = INSPECTIONS.filter(i => i.propertyId === property.id)
  const complianceRisk = getComplianceStatus(property)

  const riskColor = { critical: '#dc2626', warning: '#d97706', compliant: '#10b981', info: '#64748b' }
  const riskLabel = { critical: 'Critical Compliance Issues', warning: 'Compliance Warning', compliant: 'Fully Compliant', info: 'Void Property' }

  return (
    <div>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/properties')}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
          <ArrowLeft size={16} color="#64748b" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>{property.address}</h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} />{property.postcode} · {property.branch}</span>
                <span className={`badge ${property.status === 'let' ? 'badge-green' : property.status === 'void' ? 'badge-amber' : 'badge-blue'}`}>{property.status === 'let' ? 'Let' : property.status === 'void' ? 'Void' : 'Available'}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: `${riskColor[complianceRisk]}15`, color: riskColor[complianceRisk] }}>
                  <StatusDot status={complianceRisk === 'compliant' ? 'valid' : complianceRisk === 'critical' ? 'expired' : 'expiring_soon'} />
                  {riskLabel[complianceRisk]}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn-secondary"><Edit size={13} /> Edit</button>
              <PDFButton
                label="Property Report"
                onGenerate={() => generatePropertyReport(property, landlord, tenant, tenancy, maintenanceJobs, inspections)}
              />
              <button className="btn-primary"><Zap size={13} /> AI Summary</button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Monthly Rent', value: `£${property.rent.toLocaleString()}`, icon: PoundSterling, color: '#10b981' },
          { label: 'Type', value: `${property.bedrooms}bd ${property.type}`, icon: Building2, color: '#6366f1' },
          { label: 'Landlord', value: landlord?.name?.split(' ').slice(0,2).join(' ') || '—', icon: Users, color: '#0284c7' },
          { label: 'Current Tenant', value: tenant?.name?.split(' ')[0] || 'Vacant', icon: User, color: tenant ? '#10b981' : '#94a3b8' },
          { label: 'Open Jobs', value: maintenanceJobs.filter(j => j.status !== 'completed').length, icon: Wrench, color: maintenanceJobs.filter(j => j.status !== 'completed').length > 0 ? '#d97706' : '#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <s.icon size={14} color={s.color} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', paddingLeft: 4, overflowX: 'auto' }}>
          <TabBtn label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} />
          <TabBtn label="Compliance" active={tab === 'compliance'} onClick={() => setTab('compliance')}
            badge={Object.values(property.compliance).filter(c => ['expired','not_verified','overdue','expiring_soon'].includes(c.status)).length || null} />
          <TabBtn label="Tenancy" active={tab === 'tenancy'} onClick={() => setTab('tenancy')} />
          <TabBtn label="Maintenance" active={tab === 'maintenance'} onClick={() => setTab('maintenance')}
            badge={maintenanceJobs.filter(j => j.status !== 'completed').length || null} />
          <TabBtn label="Inspections" active={tab === 'inspections'} onClick={() => setTab('inspections')} />
          <TabBtn label="Documents" active={tab === 'documents'} onClick={() => setTab('documents')} />
        </div>

        <div style={{ padding: 24 }}>
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Property details */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 14 }}>Property Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Full Address', value: `${property.address}, ${property.city}, ${property.postcode}` },
                    { label: 'Property Type', value: property.type },
                    { label: 'Bedrooms', value: property.bedrooms },
                    { label: 'Bathrooms', value: property.bathrooms },
                    { label: 'Branch', value: property.branch },
                    { label: 'Management Type', value: property.managementType === 'full' ? 'Full Management' : property.managementType === 'rent_collection' ? 'Rent Collection' : 'Let Only' },
                    { label: 'Monthly Rent', value: `£${property.rent.toLocaleString()}` },
                    { label: 'Last Inspection', value: property.lastInspection ? new Date(property.lastInspection).toLocaleDateString('en-GB') : 'None recorded' },
                    { label: 'Next Inspection', value: property.nextInspection ? new Date(property.nextInspection).toLocaleDateString('en-GB') : 'Not scheduled' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ flex: 1, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Landlord card */}
                <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 12 }}>Landlord</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                      {landlord?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{landlord?.name}</p>
                      <span className={`badge ${landlord?.type === 'Investor' ? 'badge-purple' : 'badge-blue'}`}>{landlord?.type}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <a href={`mailto:${landlord?.email}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#334155', textDecoration: 'none' }}><Mail size={12} color="#94a3b8" />{landlord?.email}</a>
                    <a href={`tel:${landlord?.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#334155', textDecoration: 'none' }}><Phone size={12} color="#94a3b8" />{landlord?.phone}</a>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}><Mail size={12} /> Email</button>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}><Zap size={12} /> AI Update</button>
                  </div>
                </div>

                {/* Tenant card */}
                {tenant ? (
                  <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 12 }}>Current Tenant</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                        {tenant.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{tenant.name}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{tenant.nationality}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <a href={`mailto:${tenant.email}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#334155', textDecoration: 'none' }}><Mail size={12} color="#94a3b8" />{tenant.email}</a>
                      <a href={`tel:${tenant.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#334155', textDecoration: 'none' }}><Phone size={12} color="#94a3b8" />{tenant.phone}</a>
                    </div>
                    {tenancy?.arrears > 0 && (
                      <div style={{ marginTop: 10, padding: '8px 10px', background: '#fef2f2', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <AlertTriangle size={12} color="#dc2626" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>£{tenancy.arrears.toLocaleString()} arrears</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', padding: 16, textAlign: 'center' }}>
                    <AlertTriangle size={24} color="#d97706" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontWeight: 700, color: '#92400e', fontSize: 13.5 }}>Property is Void</p>
                    <p style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>No active tenant. Market immediately to minimise void period.</p>
                    <button className="btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center', background: '#d97706' }}>Market Property</button>
                  </div>
                )}

                {/* Quick compliance summary */}
                <div style={{ background: complianceRisk === 'critical' ? '#fef2f2' : complianceRisk === 'warning' ? '#fffbeb' : '#f0fdf4', borderRadius: 10, border: `1px solid ${complianceRisk === 'critical' ? '#fecaca' : complianceRisk === 'warning' ? '#fde68a' : '#bbf7d0'}`, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} color={riskColor[complianceRisk]} />
                    <p style={{ fontWeight: 700, fontSize: 13, color: riskColor[complianceRisk] }}>{riskLabel[complianceRisk]}</p>
                  </div>
                  <button onClick={() => setTab('compliance')} style={{ marginTop: 8, fontSize: 12, color: riskColor[complianceRisk], background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    View compliance details →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMPLIANCE TAB */}
          {tab === 'compliance' && (
            <div>
              {complianceRisk === 'critical' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 20 }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>This property has critical compliance failures — immediate action required</p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {Object.entries(CERT_CONFIG).map(([key, config]) => {
                  const cert = property.compliance[key]
                  if (!cert) return null
                  const Icon = config.icon
                  const isGood = cert.status === 'valid' || cert.status === 'n/a'
                  const isBad = ['expired','not_verified','overdue'].includes(cert.status)
                  const isWarn = cert.status === 'expiring_soon'
                  return (
                    <div key={key} style={{
                      padding: 16, borderRadius: 10, border: `1.5px solid ${isBad ? '#fecaca' : isWarn ? '#fde68a' : '#e2e8f0'}`,
                      background: isBad ? '#fef2f2' : isWarn ? '#fffbeb' : 'white'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: `${config.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={15} color={config.color} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{config.label}</span>
                        <span style={{ marginLeft: 'auto' }}>
                          {isBad && <span className="badge badge-red">⚠ {cert.status === 'not_verified' ? 'Not Verified' : 'Expired'}</span>}
                          {isWarn && <span className="badge badge-amber">Expiring Soon</span>}
                          {isGood && <span className="badge badge-green">✓ Valid</span>}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {cert.expiry && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#94a3b8' }}>Expiry</span><span style={{ fontWeight: 600, color: isBad ? '#dc2626' : isWarn ? '#d97706' : '#334155' }}>{new Date(cert.expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>}
                        {cert.lastCheck && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#94a3b8' }}>Last Check</span><span style={{ fontWeight: 600, color: '#334155' }}>{new Date(cert.lastCheck).toLocaleDateString('en-GB')}</span></div>}
                        {cert.engineer && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#94a3b8' }}>Engineer</span><span style={{ fontWeight: 600, color: '#334155' }}>{cert.engineer}</span></div>}
                        {cert.scheme && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#94a3b8' }}>Scheme</span><span style={{ fontWeight: 600, color: '#334155' }}>{cert.scheme}</span></div>}
                        {cert.reference && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#94a3b8' }}>Reference</span><span style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace', fontSize: 11 }}>{cert.reference}</span></div>}
                        {cert.grade && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#94a3b8' }}>EPC Grade</span><span style={{ fontWeight: 800, color: cert.grade <= 'D' ? '#10b981' : '#d97706', fontSize: 16 }}>{cert.grade}</span></div>}
                        {cert.amount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#94a3b8' }}>Amount</span><span style={{ fontWeight: 600, color: '#334155' }}>£{cert.amount.toLocaleString()}</span></div>}
                      </div>
                      {(isBad || isWarn) && (
                        <button className="btn-primary" style={{ width: '100%', marginTop: 10, justifyContent: 'center', fontSize: 12, background: isBad ? '#dc2626' : '#d97706', boxShadow: 'none' }}>
                          {isBad ? 'Book Now — Urgent' : 'Schedule Renewal'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TENANCY TAB */}
          {tab === 'tenancy' && (
            <div>
              {tenancy ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 12 }}>Tenancy Details</p>
                    {[
                      { label: 'Status', value: <span className={`badge ${tenancy.status === 'active' ? 'badge-green' : tenancy.status === 'ending_soon' ? 'badge-amber' : 'badge-red'}`}>{tenancy.status.replace('_', ' ')}</span> },
                      { label: 'Tenant', value: tenant?.name },
                      { label: 'Start Date', value: new Date(tenancy.startDate).toLocaleDateString('en-GB') },
                      { label: 'End Date', value: new Date(tenancy.endDate).toLocaleDateString('en-GB') },
                      { label: 'Monthly Rent', value: `£${tenancy.monthlyRent.toLocaleString()}` },
                      { label: 'Deposit', value: `£${tenancy.depositAmount.toLocaleString()} (${tenancy.depositScheme})` },
                      { label: 'Last Payment', value: tenancy.lastPaymentDate ? new Date(tenancy.lastPaymentDate).toLocaleDateString('en-GB') : '—' },
                      { label: 'Arrears', value: tenancy.arrears > 0 ? <span style={{ color: '#dc2626', fontWeight: 800 }}>£{tenancy.arrears.toLocaleString()}</span> : <span style={{ color: '#10b981', fontWeight: 700 }}>Clear</span> },
                      { label: 'Renewal Offered', value: tenancy.renewalOffered ? <span className="badge badge-blue">Yes</span> : '—' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
                        <span style={{ flex: 1, fontSize: 13, color: '#94a3b8' }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tenancy.arrears > 0 && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <AlertTriangle size={16} color="#dc2626" />
                          <p style={{ fontWeight: 700, color: '#991b1b', fontSize: 13.5 }}>Rent Arrears</p>
                        </div>
                        <p style={{ fontSize: 26, fontWeight: 900, color: '#dc2626' }}>£{tenancy.arrears.toLocaleString()}</p>
                        <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>
                          {Math.round(tenancy.arrears / tenancy.monthlyRent)} month(s) overdue
                        </p>
                        <button className="btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center', background: '#dc2626', boxShadow: 'none' }}>
                          <Zap size={13} /> Generate Arrears Letter
                        </button>
                      </div>
                    )}
                    <button className="btn-secondary" style={{ justifyContent: 'center' }}>View Full Rent History</button>
                    <button className="btn-secondary" style={{ justifyContent: 'center' }}>Send Tenancy Renewal</button>
                    <button className="btn-secondary" style={{ justifyContent: 'center' }}>Download Tenancy Agreement</button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <FileText size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 700, color: '#64748b' }}>No active tenancy</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>This property is currently void.</p>
                  <button className="btn-primary" style={{ marginTop: 16 }}><FileText size={13} /> Create Tenancy</button>
                </div>
              )}
            </div>
          )}

          {/* MAINTENANCE TAB */}
          {tab === 'maintenance' && (
            <div>
              {maintenanceJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 700, color: '#334155' }}>No maintenance jobs on record</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {maintenanceJobs.map(job => {
                    const priorityColor = { emergency: '#dc2626', urgent: '#d97706', routine: '#10b981', cosmetic: '#94a3b8' }
                    const contractor = getContractorById(job.assignedTo)
                    return (
                      <div key={job.id} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', borderLeft: `4px solid ${priorityColor[job.priority]}` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{job.title}</p>
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${priorityColor[job.priority]}15`, color: priorityColor[job.priority], textTransform: 'capitalize' }}>{job.priority}</span>
                              <span className={`badge ${job.status === 'completed' ? 'badge-green' : job.status === 'assigned' || job.status === 'in_progress' ? 'badge-blue' : 'badge-amber'}`}>{job.status.replace('_', ' ')}</span>
                            </div>
                            <p style={{ fontSize: 12, color: '#94a3b8' }}>Reported {job.reportedDate} · {job.reportedBy}</p>
                            {contractor && <p style={{ fontSize: 12, color: '#6366f1', marginTop: 2, fontWeight: 600 }}>Assigned: {contractor.name}</p>}
                          </div>
                          {job.estimatedCost && <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>Est. £{job.estimatedCost}</span>}
                        </div>
                        <p style={{ fontSize: 12.5, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>{job.description}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* INSPECTIONS TAB */}
          {tab === 'inspections' && (
            <div>
              {inspections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <ClipboardCheck size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 700, color: '#64748b' }}>No inspections scheduled</p>
                  <button className="btn-primary" style={{ marginTop: 16 }}><Calendar size={13} /> Schedule Inspection</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {inspections.map(ins => (
                    <div key={ins.id} style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${ins.status === 'overdue' ? '#fecaca' : '#e2e8f0'}`, background: ins.status === 'overdue' ? '#fef2f2' : 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{ins.type} Inspection</p>
                            <span className={`badge ${ins.status === 'overdue' ? 'badge-red' : 'badge-blue'}`}>{ins.status}</span>
                          </div>
                          <p style={{ fontSize: 12.5, color: '#64748b' }}>
                            {new Date(ins.scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}{ins.inspectorName}
                          </p>
                        </div>
                        {ins.status === 'overdue' && (
                          <button className="btn-primary" style={{ fontSize: 12, background: '#dc2626', boxShadow: 'none' }}>Start Now</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {tab === 'documents' && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'left', marginBottom: 20 }}>
                {[
                  { name: 'Tenancy Agreement 2024', type: 'PDF', date: '01 Feb 2024', size: '1.2 MB' },
                  { name: 'Gas Safety Certificate', type: 'PDF', date: '15 Apr 2024', size: '340 KB' },
                  { name: 'EICR Report 2023', type: 'PDF', date: '01 Jun 2023', size: '2.1 MB' },
                  { name: 'EPC Certificate', type: 'PDF', date: '01 Jun 2023', size: '890 KB' },
                  { name: 'Inventory Report', type: 'PDF', date: '01 Feb 2024', size: '4.5 MB' },
                  { name: 'Deposit Protection', type: 'PDF', date: '08 Feb 2024', size: '220 KB' },
                ].map(doc => (
                  <div key={doc.name} style={{ padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 9, background: 'white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={13} color="#dc2626" />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, color: '#64748b' }}>{doc.type}</span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 12.5, color: '#0f172a', marginBottom: 3 }}>{doc.name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{doc.date} · {doc.size}</p>
                  </div>
                ))}
              </div>
              <button className="btn-secondary"><Camera size={13} /> Upload Document</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
