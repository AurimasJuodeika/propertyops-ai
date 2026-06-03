import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, AlertTriangle, ChevronRight, Plus, PoundSterling, Calendar, User, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, X } from 'lucide-react'
import { TENANCIES, getPropertyById, getTenantById, PROPERTIES } from '../data/mockData'
import { recordPayment, getPayments, calculateArrears, getCurrentMonthDueDate } from '../lib/payments'

const STATUS_CONFIG = {
  active:       { label: 'Active',        class: 'badge-green'  },
  ending_soon:  { label: 'Ending < 60d',  class: 'badge-amber'  },
  expired:      { label: 'Expired',       class: 'badge-red'    },
  notice_given: { label: 'Notice Given',  class: 'badge-purple' },
}

const PAYMENT_STATUS = {
  received: { label: '✓ Received', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  missed:   { label: '✗ Missed',   bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  partial:  { label: '~ Partial',  bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  pending:  { label: '? Pending',  bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}

function PaymentRow({ payment }) {
  const ps = PAYMENT_STATUS[payment.status] || PAYMENT_STATUS.pending
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
          {new Date(payment.due_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </p>
        {payment.notes && <p style={{ fontSize: 11, color: '#94a3b8' }}>{payment.notes}</p>}
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>£{payment.amount_due.toLocaleString()}</p>
      {payment.status === 'partial' && (
        <p style={{ fontSize: 12, color: '#d97706' }}>£{payment.amount_paid} paid</p>
      )}
      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 8, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
        {ps.label}
      </span>
      {payment.payment_date && (
        <p style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(payment.payment_date).toLocaleDateString('en-GB')}</p>
      )}
    </div>
  )
}

function TenancyRow({ tenancy, onPaymentUpdate }) {
  const [expanded, setExpanded]     = useState(false)
  const [payments, setPayments]     = useState([])
  const [loading, setLoading]       = useState(false)
  const [marking, setMarking]       = useState(false)
  const [showPartial, setShowPartial] = useState(false)
  const [partialAmount, setPartialAmount] = useState('')

  const property = getPropertyById(tenancy.propertyId)
  const tenant   = getTenantById(tenancy.tenantId)

  const currentDueDate = getCurrentMonthDueDate(tenancy.startDate)
  const currentPayment = payments.find(p => p.due_date === currentDueDate)
  const currentStatus  = currentPayment?.status || 'pending'
  const arrears        = calculateArrears(payments)

  useEffect(() => {
    if (expanded && payments.length === 0) loadPayments()
  }, [expanded])

  const loadPayments = async () => {
    setLoading(true)
    const data = await getPayments(tenancy.id)
    setPayments(data)
    setLoading(false)
  }

  const handleMark = async (status, amountPaid) => {
    setMarking(true)
    try {
      await recordPayment({
        tenancyId:       tenancy.id,
        propertyAddress: property?.address,
        dueDate:         currentDueDate,
        amountDue:       tenancy.monthlyRent,
        amountPaid:      status === 'received' ? tenancy.monthlyRent : (amountPaid || 0),
        status,
      })
      await loadPayments()
      onPaymentUpdate?.()
      setShowPartial(false)
      setPartialAmount('')
    } catch (e) {
      alert('Error: ' + e.message)
    }
    setMarking(false)
  }

  const ps = PAYMENT_STATUS[currentStatus]

  return (
    <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${arrears > 0 ? '#fecaca' : currentStatus === 'pending' ? '#fde68a' : '#e2e8f0'}`, overflow: 'hidden' }}>
      {/* Main row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>

        {/* Tenant + property */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{tenant?.name || 'Unknown tenant'}</p>
            <span className={`badge ${STATUS_CONFIG[tenancy.status]?.class || 'badge-slate'}`}>
              {STATUS_CONFIG[tenancy.status]?.label || tenancy.status}
            </span>
            {arrears > 0 && (
              <span className="badge badge-red">£{arrears.toLocaleString()} arrears</span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property?.address}, {property?.postcode} · £{tenancy.monthlyRent.toLocaleString()}/mo
          </p>
        </div>

        {/* Current month status */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, display: 'inline-block', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-GB', { month: 'short' })}: {ps.label}
          </span>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>
            Due {new Date(currentDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>

        {expanded ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px', background: '#fafafa' }}>

          {/* Record this month's payment */}
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                  {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} — £{tenancy.monthlyRent.toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Due: {new Date(currentDueDate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                {ps.label}
              </span>
            </div>

            {/* Action buttons */}
            {currentStatus !== 'received' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleMark('received')}
                  disabled={marking}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <CheckCircle size={15} /> {marking ? 'Saving…' : '✓ Mark as Received'}
                </button>

                <button
                  onClick={() => handleMark('missed')}
                  disabled={marking}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <XCircle size={15} /> Mark as Missed
                </button>

                <button
                  onClick={() => setShowPartial(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Partial Payment
                </button>
              </div>
            )}

            {currentStatus === 'received' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="#10b981" />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                  Payment received {currentPayment?.payment_date ? new Date(currentPayment.payment_date).toLocaleDateString('en-GB') : 'this month'}
                </p>
                <button
                  onClick={() => handleMark('missed')}
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Undo
                </button>
              </div>
            )}

            {/* Partial payment input */}
            {showPartial && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>£</span>
                <input
                  type="number"
                  value={partialAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                  placeholder={`Max ${tenancy.monthlyRent}`}
                  style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: 140, outline: 'none', fontFamily: 'inherit' }}
                />
                <button
                  onClick={() => handleMark('partial', parseFloat(partialAmount))}
                  disabled={!partialAmount || marking}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Record
                </button>
                <button onClick={() => setShowPartial(false)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Arrears summary */}
          {arrears > 0 && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} color="#dc2626" />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#991b1b' }}>
                  Total Arrears: £{arrears.toLocaleString()}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#b91c1c' }}>
                {payments.filter(p => p.status === 'missed' || p.status === 'partial').length} month(s) outstanding
              </span>
            </div>
          )}

          {/* Payment history */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 10 }}>
              Payment History
            </p>
            {loading ? (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading…</p>
            ) : payments.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No payments recorded yet. Use the buttons above to record this month.</p>
            ) : (
              <div>
                {payments.map(p => <PaymentRow key={p.id} payment={p} />)}
              </div>
            )}
          </div>

          {/* Tenancy details */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Start Date',    value: new Date(tenancy.startDate).toLocaleDateString('en-GB') },
              { label: 'End Date',      value: new Date(tenancy.endDate).toLocaleDateString('en-GB') },
              { label: 'Monthly Rent',  value: `£${tenancy.monthlyRent.toLocaleString()}` },
              { label: 'Deposit',       value: `£${tenancy.depositAmount.toLocaleString()} (${tenancy.depositScheme})` },
            ].map(row => (
              <div key={row.label} style={{ background: 'white', borderRadius: 8, padding: '9px 12px', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>{row.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Tenancies() {
  const navigate = useNavigate()
  const [filter, setFilter]     = useState('All')
  const [refresh, setRefresh]   = useState(0)
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)

  // Void properties available for new tenancy
  const voidProperties = PROPERTIES.filter(p => p.status === 'void')

  const enriched = TENANCIES.map(t => ({
    ...t,
    property: getPropertyById(t.propertyId),
    tenant:   getTenantById(t.tenantId),
  }))

  const filtered = filter === 'All' ? enriched : enriched.filter(t => t.status === filter)

  const endingSoon  = enriched.filter(t => t.status === 'ending_soon').length
  const expired     = enriched.filter(t => t.status === 'expired').length

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tenancies</h1>
          <p className="page-subtitle">{TENANCIES.length} tenancies · {endingSoon} ending soon · {expired} expired</p>
        </div>
        <button className="btn-primary" onClick={() => setShowPropertyPicker(v => !v)}><Plus size={13} /> New Tenancy</button>
      </div>

      {/* Stats */}
      <div className="grid-cols-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active',            value: enriched.filter(t => t.status === 'active').length,    color: '#10b981', bg: '#f0fdf4' },
          { label: 'Ending Soon',       value: endingSoon,                                             color: '#d97706', bg: '#fffbeb' },
          { label: 'Expired / Holding', value: expired,                                               color: '#dc2626', bg: '#fef2f2' },
          { label: 'Total Tenancies',   value: enriched.length,                                       color: '#6366f1', bg: '#eef2ff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}20` }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11.5, color: s.color, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['All', 'active', 'ending_soon', 'expired'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: filter === f ? 'none' : '1px solid #e2e8f0', background: filter === f ? '#0f172a' : 'white', color: filter === f ? 'white' : '#374151', textTransform: 'capitalize', fontFamily: 'inherit' }}>
            {f === 'All' ? `All (${enriched.length})` : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tenancy rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(t => (
          <TenancyRow
            key={t.id}
            tenancy={t}
            onPaymentUpdate={() => setRefresh(r => r + 1)}
          />
        ))}
      </div>

      {/* Property picker for New Tenancy */}
      {showPropertyPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setShowPropertyPicker(false)}>
          <div style={{ background:'white', borderRadius:16, width:'100%', maxWidth:480, padding:24, maxHeight:'80vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>New Tenancy</h2>
                <p style={{ fontSize:12.5, color:'#64748b', marginTop:2 }}>Select the property to create a tenancy for</p>
              </div>
              <button onClick={() => setShowPropertyPicker(false)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                <X size={18} color="#94a3b8" />
              </button>
            </div>
            {voidProperties.length === 0 ? (
              <p style={{ fontSize:13.5, color:'#94a3b8', textAlign:'center', padding:'24px 0', fontStyle:'italic' }}>
                No void properties found. All properties are currently let.
              </p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <p style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>
                  Void properties ({voidProperties.length}):
                </p>
                {voidProperties.map(p => (
                  <button key={p.id}
                    onClick={() => { setShowPropertyPicker(false); navigate(`/properties/${p.id}`, { state: { openTenancy: true } }) }}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#10b981'; e.currentTarget.style.background='#f0fdf4' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='white' }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FileText size={16} color="#10b981" />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, fontSize:13.5, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.address}</p>
                      <p style={{ fontSize:12, color:'#94a3b8' }}>{p.postcode} · {p.bedrooms}bd {p.type} · £{p.rent.toLocaleString()}/mo</p>
                    </div>
                    <ChevronRight size={14} color="#cbd5e1" />
                  </button>
                ))}
              </div>
            )}
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:16, textAlign:'center' }}>
              You'll be taken to the property to create the tenancy.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
