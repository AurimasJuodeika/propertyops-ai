import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft, Check, Building2, Users, FileText, ShieldCheck, AlertCircle, Plus } from 'lucide-react'
import { LANDLORDS, STAFF } from '../data/mockData'
import { addNewProperty, getCustomLandlords, addCustomLandlord } from '../lib/propertyOverrides'
import { createTenancy } from '../lib/tenancyStore'
import { createTask } from '../lib/taskStore'
import { addActivityEntry } from '../lib/activityLog'

// ── Shared input styles ───────────────────────────────────────────────────────
const inp = (err) => ({
  width: '100%', border: `1.5px solid ${err ? '#dc2626' : '#e2e8f0'}`,
  borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none',
  fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', transition: 'border-color 0.15s',
})
const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }
const focus = e => e.target.style.borderColor = '#10b981'
const blur  = e => e.target.style.borderColor = e.target.value ? '#10b981' : '#e2e8f0'
const Err   = ({ msg }) => msg ? <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}><AlertCircle size={10} />{msg}</p> : null

const CERT_ITEMS = [
  { key: 'gasSafety',         label: 'Gas Safety Certificate',   hasExpiry: true  },
  { key: 'eicr',              label: 'EICR (Electrical)',         hasExpiry: true  },
  { key: 'epc',               label: 'EPC (Energy Performance)',  hasExpiry: true, hasGrade: true },
  { key: 'smokeAlarm',        label: 'Smoke Alarm Check',         hasExpiry: false },
  { key: 'coAlarm',           label: 'CO Alarm Check',            hasExpiry: false },
  { key: 'rightToRent',       label: 'Right to Rent',             hasExpiry: true  },
  { key: 'depositProtection', label: 'Deposit Protection',        hasExpiry: false },
  { key: 'howToRent',         label: 'How to Rent Guide',         hasExpiry: false },
]

const CERT_STATUSES = ['valid', 'expiring_soon', 'expired', 'missing']
const CERT_STATUS_LABELS = { valid: '✓ Valid', expiring_soon: '⚠ Expiring soon', expired: '✗ Expired', missing: '— Missing' }

const STEPS = [
  { n: 1, label: 'Property',   icon: Building2  },
  { n: 2, label: 'Landlord',   icon: Users      },
  { n: 3, label: 'Tenancy',    icon: FileText   },
  { n: 4, label: 'Compliance', icon: ShieldCheck },
]

export default function PropertyOnboardingWizard({ onComplete, onClose }) {
  const [step, setStep]     = useState(1)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // ── Step 1: Property details ────────────────────────────────────────────────
  const [prop, setProp] = useState({
    address:    '', address2: '', city: '', postcode: '', area: '',
    type:       'Flat', bedrooms: 2, bathrooms: 1,
    furnished:  'Unfurnished', branch: 'London Central',
    managerId:  's5', status: 'void', notes: '',
  })
  const setP = k => e => { setProp(p => ({ ...p, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })) }

  // ── Step 2: Landlord ────────────────────────────────────────────────────────
  const [landlordMode, setLandlordMode] = useState('select') // 'select' | 'new'
  const [selectedLandlordId, setSelectedLandlordId] = useState('')
  const [newLandlord, setNewLandlord] = useState({
    name: '', email: '', phone: '', address: '',
    type: 'Individual', managementFee: 10, notes: '',
  })
  const setL = k => e => { setNewLandlord(l => ({ ...l, [k]: e.target.value })); setErrors(er => ({ ...er, ['l_'+k]: null })) }

  const allLandlords = [...LANDLORDS, ...getCustomLandlords()]

  // ── Step 3: Tenancy ─────────────────────────────────────────────────────────
  const [occupied, setOccupied] = useState(null) // null | true | false
  const [tenancy, setTenancy] = useState({
    tenantName: '', tenantEmail: '', tenantPhone: '',
    tenancyType: 'AST', startDate: '', endDate: '',
    monthlyRent: '', depositAmount: '', depositProtected: 'pending',
    depositScheme: 'DPS', rentDueDay: '1',
  })
  const setT = k => e => { setTenancy(t => ({ ...t, [k]: e.target.value })); setErrors(er => ({ ...er, ['t_'+k]: null })) }

  const [voidDetails, setVoidDetails] = useState({
    availableDate: '', targetRent: '', marketingStatus: 'Not listed',
  })

  // ── Step 4: Compliance + actions ────────────────────────────────────────────
  const [compliance, setCompliance] = useState(() =>
    Object.fromEntries(CERT_ITEMS.map(c => [c.key, { status: 'missing', expiry: '', grade: 'D' }]))
  )
  const setCert = (key, field, val) => setCompliance(c => ({ ...c, [key]: { ...c[key], [field]: val } }))

  const [actions, setActions] = useState({
    scheduleInspection:     true,
    complianceReviewTask:   true,
    documentCollectionTask: true,
    landlordWelcomeTask:    true,
    tenantWelcomeTask:      false,
  })
  const toggleAction = k => setActions(a => ({ ...a, [k]: !a[k] }))

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep = (n) => {
    const e = {}
    if (n === 1) {
      if (!prop.address.trim())  e.address  = 'Address is required'
      if (!prop.city.trim())     e.city     = 'Town/city is required'
      if (!prop.postcode.trim()) e.postcode = 'Postcode is required'
      if (!prop.type)            e.type     = 'Property type is required'
      if (!prop.bedrooms)        e.bedrooms = 'Number of bedrooms is required'
    }
    if (n === 2) {
      if (landlordMode === 'select' && !selectedLandlordId) e.landlord = 'Please select or create a landlord'
      if (landlordMode === 'new') {
        if (!newLandlord.name.trim()) e.l_name = 'Landlord name is required'
        if (newLandlord.email && !/\S+@\S+\.\S+/.test(newLandlord.email)) e.l_email = 'Enter a valid email address'
      }
    }
    if (n === 3 && occupied === true) {
      if (!tenancy.tenantName.trim()) e.t_tenantName = 'Tenant name is required'
      if (!tenancy.startDate)         e.t_startDate  = 'Start date is required'
      if (!tenancy.monthlyRent || Number(tenancy.monthlyRent) <= 0) e.t_monthlyRent = 'Enter a valid monthly rent'
      if (tenancy.endDate && tenancy.endDate <= tenancy.startDate)  e.t_endDate = 'End date must be after start date'
    }
    if (n === 3 && occupied === null) e.occupied = 'Please select occupancy status'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep(step)) setStep(s => s + 1) }
  const back = () => { setErrors({}); setStep(s => s - 1) }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateStep(4)) return
    setSaving(true)

    // 1. Resolve landlord
    let landlordId = selectedLandlordId
    let landlordName = allLandlords.find(l => l.id === landlordId)?.name || ''
    if (landlordMode === 'new') {
      const saved = addCustomLandlord({ ...newLandlord, properties: [], type: newLandlord.type })
      landlordId   = saved.id
      landlordName = saved.name
    }

    // 2. Build compliance object
    const complianceObj = {}
    CERT_ITEMS.forEach(c => {
      const cert = compliance[c.key]
      complianceObj[c.key] = {
        status:  cert.status,
        expiry:  cert.expiry || null,
        grade:   cert.grade || undefined,
        engineer: '',
        lastCheck: cert.status === 'valid' ? new Date().toISOString().split('T')[0] : null,
        scheme: null, reference: null, amount: 0,
      }
    })
    // Ensure deposit protection field
    if (!complianceObj.depositProtection) complianceObj.depositProtection = { status: 'n/a', scheme: null, reference: null, amount: 0 }
    if (!complianceObj.rightToRent)       complianceObj.rightToRent       = { status: 'n/a', tenantId: null, expiry: null }

    // 3. Create property
    const newProp = addNewProperty({
      address:        prop.address + (prop.address2 ? ', ' + prop.address2 : ''),
      city:           prop.city,
      postcode:       prop.postcode.toUpperCase(),
      area:           prop.area,
      type:           prop.type,
      bedrooms:       Number(prop.bedrooms),
      bathrooms:      Number(prop.bathrooms),
      furnished:      prop.furnished,
      branch:         prop.branch,
      managerId:      prop.managerId,
      status:         occupied ? 'let' : prop.status,
      landlordId,
      tenantId:       null,
      managementType: 'full',
      notes:          prop.notes,
      compliance:     complianceObj,
      lastInspection: null,
      nextInspection: null,
    })

    // 4. Create tenancy if occupied
    let createdTenancy = null
    if (occupied) {
      createdTenancy = createTenancy({
        propertyId:      newProp.id,
        tenantName:      tenancy.tenantName,
        tenantEmail:     tenancy.tenantEmail,
        tenantPhone:     tenancy.tenantPhone,
        tenancyType:     tenancy.tenancyType,
        startDate:       tenancy.startDate,
        endDate:         tenancy.endDate || null,
        monthlyRent:     Number(tenancy.monthlyRent),
        depositAmount:   Number(tenancy.depositAmount) || 0,
        depositProtected:tenancy.depositProtected,
        depositScheme:   tenancy.depositScheme,
        rentDueDay:      Number(tenancy.rentDueDay) || 1,
      })
    }

    // 5. Auto-create onboarding tasks
    const propAddr = `${newProp.address}, ${newProp.postcode}`
    const today14  = new Date(); today14.setDate(today14.getDate() + 14)
    const today7   = new Date(); today7.setDate(today7.getDate() + 7)
    const today30  = new Date(); today30.setDate(today30.getDate() + 30)
    const fmt = d => d.toISOString().split('T')[0]

    if (actions.scheduleInspection) {
      createTask({ title: `Schedule check-in inspection — ${prop.address}`, propertyId: newProp.id, propertyAddress: propAddr, category: 'Inspection', priority: 'medium', dueDate: fmt(today14), source: 'onboarding', notes: 'First inspection for new property — confirm access with tenant.' })
    }
    if (actions.complianceReviewTask) {
      const missingCerts = CERT_ITEMS.filter(c => compliance[c.key]?.status === 'missing' || compliance[c.key]?.status === 'expired').map(c => c.label)
      if (missingCerts.length > 0) {
        createTask({ title: `Obtain missing compliance certificates — ${prop.address}`, propertyId: newProp.id, propertyAddress: propAddr, category: 'Compliance', priority: 'high', dueDate: fmt(today7), source: 'onboarding', notes: `Missing: ${missingCerts.join(', ')}` })
      }
    }
    if (actions.documentCollectionTask) {
      createTask({ title: `Collect and file property documents — ${prop.address}`, propertyId: newProp.id, propertyAddress: propAddr, category: 'Document', priority: 'medium', dueDate: fmt(today30), source: 'onboarding', notes: 'Collect tenancy agreement, compliance certificates, EPC, inventory report.' })
    }
    if (actions.landlordWelcomeTask) {
      createTask({ title: `Send landlord welcome pack — ${landlordName}`, propertyId: newProp.id, propertyAddress: propAddr, category: 'General', priority: 'medium', dueDate: fmt(today7), source: 'onboarding', notes: `Send welcome email and management agreement to ${landlordName}.` })
    }
    if (actions.tenantWelcomeTask && occupied) {
      createTask({ title: `Send tenant welcome pack — ${tenancy.tenantName}`, propertyId: newProp.id, propertyAddress: propAddr, category: 'Tenancy', priority: 'medium', dueDate: fmt(today7), source: 'onboarding', notes: `Send welcome letter, how-to-rent guide, and utility info to ${tenancy.tenantName}.` })
    }

    // 6. Activity log entries
    addActivityEntry(newProp.id, { type: 'tenancy', text: `Property added to portfolio — ${prop.address}, ${prop.postcode}` })
    if (landlordId) addActivityEntry(newProp.id, { type: 'note', text: `Landlord linked: ${landlordName}` })
    if (createdTenancy) addActivityEntry(newProp.id, { type: 'tenancy', text: `Tenancy created for ${tenancy.tenantName}, starting ${new Date(tenancy.startDate).toLocaleDateString('en-GB')}` })

    const certIssues = CERT_ITEMS.filter(c => ['expired','missing'].includes(compliance[c.key]?.status))
    if (certIssues.length > 0) {
      addActivityEntry(newProp.id, { type: 'compliance', text: `Compliance review needed: ${certIssues.map(c => c.label).join(', ')}` })
    }

    setSaving(false)
    onComplete(newProp)
  }

  // ── Step indicator ────────────────────────────────────────────────────────────
  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step > s.n ? '#10b981' : step === s.n ? '#0f172a' : '#f1f5f9', color: step >= s.n ? 'white' : '#94a3b8', fontWeight: 800, fontSize: 13, flexShrink: 0, transition: 'all 0.2s' }}>
              {step > s.n ? <Check size={15} /> : <s.icon size={14} />}
            </div>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: step === s.n ? '#0f172a' : step > s.n ? '#10b981' : '#94a3b8', whiteSpace: 'nowrap' }}>{s.label}</p>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: step > s.n ? '#10b981' : '#f1f5f9', marginBottom: 20, marginLeft: 6, marginRight: 6, transition: 'background 0.2s', minWidth: 20 }} />
          )}
        </div>
      ))}
    </div>
  )

  // ── Navigation footer ─────────────────────────────────────────────────────────
  const Footer = () => (
    <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #f1f5f9', marginTop: 20 }}>
      <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={step === 1 ? onClose : back}>
        {step === 1 ? 'Cancel' : <><ChevronLeft size={13} /> Back</>}
      </button>
      {step < 4 ? (
        <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={next}>
          Next <ChevronRight size={13} />
        </button>
      ) : (
        <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : <><Check size={14} /> Add Property & Create Tasks</>}
        </button>
      )}
    </div>
  )

  const inp2 = (errKey) => ({ ...inp(errors[errKey]), onFocus: focus, onBlur: blur })

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', zIndex: 69, backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 18, width: 580, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>

        {/* Fixed header */}
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.2px' }}>New Property</h2>
              <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>Step {step} of 4 — {STEPS[step-1].label}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="#94a3b8" /></button>
          </div>
          <StepBar />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── STEP 1: Property Details ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Address Line 1 *</label>
                <input value={prop.address} onChange={setP('address')} placeholder="e.g. 42 Moseley Road" style={inp2('address')} />
                <Err msg={errors.address} />
              </div>
              <div>
                <label style={lbl}>Address Line 2</label>
                <input value={prop.address2} onChange={setP('address2')} placeholder="Flat number, building name (optional)" style={inp()} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Town / City *</label>
                  <input value={prop.city} onChange={setP('city')} placeholder="e.g. Birmingham" style={inp2('city')} />
                  <Err msg={errors.city} />
                </div>
                <div>
                  <label style={lbl}>Postcode *</label>
                  <input value={prop.postcode} onChange={setP('postcode')} placeholder="e.g. B12 9AA" style={inp2('postcode')} />
                  <Err msg={errors.postcode} />
                </div>
              </div>
              <div>
                <label style={lbl}>Area / Suburb</label>
                <input value={prop.area} onChange={setP('area')} placeholder="e.g. Moseley, Balsall Heath" style={inp()} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <div>
                  <label style={lbl}>Property Type *</label>
                  <select value={prop.type} onChange={setP('type')} style={{ ...inp(errors.type), cursor: 'pointer' }}>
                    {['Flat','House','Terrace','Maisonette','HMO','Studio','Bungalow','Commercial','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <Err msg={errors.type} />
                </div>
                <div>
                  <label style={lbl}>Bedrooms *</label>
                  <select value={prop.bedrooms} onChange={setP('bedrooms')} style={{ ...inp(errors.bedrooms), cursor: 'pointer' }}>
                    {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>)}
                  </select>
                  <Err msg={errors.bedrooms} />
                </div>
                <div>
                  <label style={lbl}>Bathrooms</label>
                  <select value={prop.bathrooms} onChange={setP('bathrooms')} style={{ ...inp(), cursor: 'pointer' }}>
                    {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Furnished Status</label>
                  <select value={prop.furnished} onChange={setP('furnished')} style={{ ...inp(), cursor: 'pointer' }}>
                    {['Furnished','Unfurnished','Part-furnished'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Initial Status</label>
                  <select value={prop.status} onChange={setP('status')} style={{ ...inp(), cursor: 'pointer' }}>
                    <option value="void">Void</option>
                    <option value="let">Occupied / Let</option>
                    <option value="available">Available</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="managed_only">Managed Only</option>
                    <option value="let_agreed">Let Agreed</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Branch</label>
                  <select value={prop.branch} onChange={setP('branch')} style={{ ...inp(), cursor: 'pointer' }}>
                    {['London Central','London North','Hertfordshire','Birmingham'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Property Manager</label>
                  <select value={prop.managerId} onChange={setP('managerId')} style={{ ...inp(), cursor: 'pointer' }}>
                    <option value="">— Unassigned —</option>
                    {STAFF.filter(s => s.role.includes('Manager') || s.role.includes('manager')).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <textarea value={prop.notes} onChange={setP('notes')} rows={2}
                  placeholder="Any additional notes about the property…"
                  style={{ ...inp(), resize: 'none' }} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          )}

          {/* ── STEP 2: Landlord ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, background: '#f8fafc', borderRadius: 10, padding: 4 }}>
                {[{ id: 'select', label: 'Select existing landlord' }, { id: 'new', label: 'Create new landlord' }].map(m => (
                  <button key={m.id} onClick={() => { setLandlordMode(m.id); setErrors({}) }}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: landlordMode === m.id ? 'white' : 'transparent', color: landlordMode === m.id ? '#0f172a' : '#64748b', boxShadow: landlordMode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {landlordMode === 'select' && (
                <div>
                  <label style={lbl}>Select Landlord *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 300, overflowY: 'auto' }}>
                    {allLandlords.map(l => (
                      <button key={l.id} onClick={() => { setSelectedLandlordId(l.id); setErrors(er => ({ ...er, landlord: null })) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 9, border: selectedLandlordId === l.id ? '2px solid #10b981' : '1.5px solid #e2e8f0', background: selectedLandlordId === l.id ? '#f0fdf4' : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                          {l.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{l.name}</p>
                          <p style={{ fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {l.email} · {l.type} · {l.managementFee}% fee
                          </p>
                        </div>
                        {selectedLandlordId === l.id && <Check size={16} color="#10b981" />}
                      </button>
                    ))}
                  </div>
                  <Err msg={errors.landlord} />
                </div>
              )}

              {landlordMode === 'new' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={lbl}>Landlord Name *</label>
                    <input value={newLandlord.name} onChange={setL('name')} placeholder="e.g. Robert Ashford or Ashford Properties Ltd" style={inp2('l_name')} />
                    <Err msg={errors.l_name} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Email</label>
                      <input type="email" value={newLandlord.email} onChange={setL('email')} placeholder="landlord@email.co.uk" style={inp2('l_email')} />
                      <Err msg={errors.l_email} />
                    </div>
                    <div>
                      <label style={lbl}>Phone</label>
                      <input value={newLandlord.phone} onChange={setL('phone')} placeholder="07700 900 000" style={inp()} onFocus={focus} onBlur={blur} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Address (optional)</label>
                    <input value={newLandlord.address} onChange={setL('address')} placeholder="Correspondence address" style={inp()} onFocus={focus} onBlur={blur} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Portfolio Type</label>
                      <select value={newLandlord.type} onChange={setL('type')} style={{ ...inp(), cursor: 'pointer' }}>
                        {['Individual','Company','Portfolio landlord','Investor'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Management Fee (%)</label>
                      <input type="number" value={newLandlord.managementFee} onChange={setL('managementFee')} placeholder="10" min="0" max="25" style={{ ...inp(), textAlign: 'center', fontWeight: 700 }} onFocus={focus} onBlur={blur} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Notes</label>
                    <textarea value={newLandlord.notes} onChange={setL('notes')} rows={2} placeholder="Preferred contact method, special instructions…" style={{ ...inp(), resize: 'none' }} onFocus={focus} onBlur={blur} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Tenancy ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Is the property currently occupied? *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                  {[{ val: true, label: 'Yes — Occupied', desc: 'Add tenant and tenancy details' }, { val: false, label: 'No — Void', desc: 'Property is currently empty' }].map(opt => (
                    <button key={String(opt.val)} onClick={() => { setOccupied(opt.val); setErrors(er => ({ ...er, occupied: null })) }}
                      style={{ padding: '14px 12px', borderRadius: 10, border: occupied === opt.val ? '2px solid #10b981' : '1.5px solid #e2e8f0', background: occupied === opt.val ? '#f0fdf4' : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: occupied === opt.val ? '#059669' : '#0f172a' }}>{opt.label}</p>
                      <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
                <Err msg={errors.occupied} />
              </div>

              {occupied === true && (
                <>
                  <div style={{ height: 1, background: '#f1f5f9' }} />
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Tenant Details</p>
                  <div>
                    <label style={lbl}>Tenant Name *</label>
                    <input value={tenancy.tenantName} onChange={setT('tenantName')} placeholder="e.g. James & Emma Wilson" style={inp2('t_tenantName')} />
                    <Err msg={errors.t_tenantName} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Tenant Email</label>
                      <input type="email" value={tenancy.tenantEmail} onChange={setT('tenantEmail')} placeholder="tenant@email.co.uk" style={inp()} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <label style={lbl}>Tenant Phone</label>
                      <input value={tenancy.tenantPhone} onChange={setT('tenantPhone')} placeholder="07700 900 000" style={inp()} onFocus={focus} onBlur={blur} />
                    </div>
                  </div>
                  <div style={{ height: 1, background: '#f1f5f9' }} />
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Tenancy Terms</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Tenancy Type</label>
                      <select value={tenancy.tenancyType} onChange={setT('tenancyType')} style={{ ...inp(), cursor: 'pointer' }}>
                        {['AST','Company Let','Licence','Other'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Rent Due Day</label>
                      <select value={tenancy.rentDueDay} onChange={setT('rentDueDay')} style={{ ...inp(), cursor: 'pointer' }}>
                        {[1,5,7,10,14,15,20,25,28].map(d => <option key={d} value={d}>{d}{['st','nd','rd'][d-1]||'th'} of month</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Start Date *</label>
                      <input type="date" value={tenancy.startDate} onChange={setT('startDate')} style={inp2('t_startDate')} />
                      <Err msg={errors.t_startDate} />
                    </div>
                    <div>
                      <label style={lbl}>End Date</label>
                      <input type="date" value={tenancy.endDate} onChange={setT('endDate')} style={inp2('t_endDate')} />
                      <Err msg={errors.t_endDate} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Monthly Rent (£) *</label>
                      <input type="number" value={tenancy.monthlyRent} onChange={setT('monthlyRent')} placeholder="e.g. 1350" style={{ ...inp2('t_monthlyRent'), fontWeight: 700, textAlign: 'center', fontSize: 16 }} />
                      <Err msg={errors.t_monthlyRent} />
                    </div>
                    <div>
                      <label style={lbl}>Deposit (£)</label>
                      <input type="number" value={tenancy.depositAmount} onChange={setT('depositAmount')} placeholder="e.g. 1558" style={{ ...inp(), fontWeight: 700, textAlign: 'center', fontSize: 16 }} onFocus={focus} onBlur={blur} />
                      {tenancy.monthlyRent && tenancy.depositAmount && (
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                          = {(Number(tenancy.depositAmount) / Number(tenancy.monthlyRent)).toFixed(1)} weeks rent
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Deposit Protection</label>
                      <select value={tenancy.depositProtected} onChange={setT('depositProtected')} style={{ ...inp(), cursor: 'pointer' }}>
                        <option value="yes">✓ Protected</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="no">✗ Not protected</option>
                        <option value="n/a">N/A</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Deposit Scheme</label>
                      <select value={tenancy.depositScheme} onChange={setT('depositScheme')} style={{ ...inp(), cursor: 'pointer' }}>
                        {['DPS','MyDeposits','TDS','Landlord Held','Other'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {occupied === false && (
                <>
                  <div style={{ height: 1, background: '#f1f5f9' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Expected Available Date</label>
                      <input type="date" value={voidDetails.availableDate} onChange={e => setVoidDetails(v => ({ ...v, availableDate: e.target.value }))} style={inp()} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <label style={lbl}>Target Rent (£/mo)</label>
                      <input type="number" value={voidDetails.targetRent} onChange={e => setVoidDetails(v => ({ ...v, targetRent: e.target.value }))} placeholder="e.g. 1350" style={{ ...inp(), fontWeight: 700, textAlign: 'center' }} onFocus={focus} onBlur={blur} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Marketing Status</label>
                    <select value={voidDetails.marketingStatus} onChange={e => setVoidDetails(v => ({ ...v, marketingStatus: e.target.value }))} style={{ ...inp(), cursor: 'pointer' }}>
                      {['Not listed','Preparing','Listed on portals','Let agreed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 4: Compliance + Actions ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Compliance */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Compliance Certificates</p>
                <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>Set the current status of each certificate. Missing items will generate tasks automatically.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CERT_ITEMS.map(cert => {
                    const c = compliance[cert.key]
                    return (
                      <div key={cert.key} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 8, alignItems: 'center', padding: '10px 12px', background: c.status === 'expired' || c.status === 'missing' ? '#fef2f2' : c.status === 'expiring_soon' ? '#fffbeb' : '#f8fafc', borderRadius: 8, border: `1px solid ${c.status === 'expired' || c.status === 'missing' ? '#fecaca' : c.status === 'expiring_soon' ? '#fde68a' : '#f1f5f9'}` }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>{cert.label}</p>
                        <select value={c.status} onChange={e => setCert(cert.key, 'status', e.target.value)}
                          style={{ border: '1.5px solid #e2e8f0', borderRadius: 7, padding: '6px 8px', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', color: '#0f172a' }}>
                          {CERT_STATUSES.map(s => <option key={s} value={s}>{CERT_STATUS_LABELS[s]}</option>)}
                        </select>
                        {cert.hasExpiry && c.status !== 'missing' ? (
                          <input type="date" value={c.expiry} onChange={e => setCert(cert.key, 'expiry', e.target.value)}
                            placeholder="Expiry date"
                            style={{ border: '1.5px solid #e2e8f0', borderRadius: 7, padding: '6px 8px', fontSize: 12, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
                        ) : <div />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Auto-create tasks */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Automatic Onboarding Tasks</p>
                <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>Select which tasks to create automatically when this property is added.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { key: 'scheduleInspection',     label: 'Schedule first inspection',           sub: 'Due in 14 days' },
                    { key: 'complianceReviewTask',    label: 'Review missing compliance items',      sub: 'Based on statuses above · Due in 7 days' },
                    { key: 'documentCollectionTask',  label: 'Collect and file property documents',  sub: 'Agreement, certs, inventory · Due in 30 days' },
                    { key: 'landlordWelcomeTask',     label: 'Send landlord welcome pack',           sub: 'Introduction email + management agreement · Due in 7 days' },
                    { key: 'tenantWelcomeTask',       label: `Send tenant welcome pack${occupied ? ` (${tenancy.tenantName || 'tenant'})` : ''}`, sub: occupied ? 'How to Rent, utility info · Due in 7 days' : 'Only applicable if occupied' },
                  ].map(a => (
                    <button key={a.key} onClick={() => toggleAction(a.key)}
                      disabled={a.key === 'tenantWelcomeTask' && !occupied}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${actions[a.key] && (a.key !== 'tenantWelcomeTask' || occupied) ? '#10b981' : '#e2e8f0'}`, background: actions[a.key] && (a.key !== 'tenantWelcomeTask' || occupied) ? '#f0fdf4' : 'white', cursor: a.key === 'tenantWelcomeTask' && !occupied ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: a.key === 'tenantWelcomeTask' && !occupied ? 0.4 : 1, width: '100%' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${actions[a.key] && (a.key !== 'tenantWelcomeTask' || occupied) ? '#10b981' : '#e2e8f0'}`, background: actions[a.key] && (a.key !== 'tenantWelcomeTask' || occupied) ? '#10b981' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {actions[a.key] && (a.key !== 'tenantWelcomeTask' || occupied) && <Check size={11} color="white" />}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.label}</p>
                        <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{a.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>What will be created</p>
                {[
                  ['Property',    `${prop.address}${prop.address2 ? ', ' + prop.address2 : ''}, ${prop.city} ${prop.postcode}` ],
                  ['Type',        `${prop.bedrooms}bd ${prop.type} · ${prop.furnished}`],
                  ['Landlord',    landlordMode === 'select' ? allLandlords.find(l => l.id === selectedLandlordId)?.name || '—' : newLandlord.name || '—'],
                  ['Tenancy',     occupied ? `${tenancy.tenantName || '—'} · £${Number(tenancy.monthlyRent||0).toLocaleString()}/mo` : 'None — Void'],
                  ['Compliance',  `${CERT_ITEMS.filter(c => compliance[c.key]?.status === 'valid').length} valid · ${CERT_ITEMS.filter(c => compliance[c.key]?.status === 'missing').length} missing`],
                  ['Tasks',       `${Object.values(actions).filter(v => v).length} onboarding tasks`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: '#64748b' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div style={{ padding: '0 24px 20px' }}>
          <Footer />
        </div>
      </div>
    </>,
    document.body
  )
}
