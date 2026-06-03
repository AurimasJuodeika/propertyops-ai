import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, Copy, CheckCircle } from 'lucide-react'
import { sendEmail } from '../lib/email'
import { addLandlordActivity } from '../lib/landlordStore'

const TEMPLATES = {
  welcome: {
    label: 'Welcome Landlord',
    subject: (l) => `Welcome to Harrington & Co — ${l.name}`,
    body: (l, props) => `Dear ${l.name},\n\nWelcome to Harrington & Co Property Management. We are delighted to be managing your property portfolio.\n\n${props.length > 0 ? `Your ${props.length} propert${props.length !== 1 ? 'ies' : 'y'} under our management:\n${props.map(p => `• ${p.address}, ${p.postcode}`).join('\n')}\n\n` : ''}Your dedicated property manager will be in touch shortly to introduce themselves and answer any questions you may have.\n\nKind regards,\nHarrington & Co\n020 7123 4567`,
  },
  maintenance_approval: {
    label: 'Maintenance Approval Request',
    subject: (l) => `Maintenance Approval Required — ${l.name}`,
    body: (l) => `Dear ${l.name},\n\nWe have a maintenance issue at one of your properties that requires your approval before we can proceed.\n\nPlease log into your Landlord Portal or contact us to review and approve the proposed works.\n\nWe will not proceed until we have your written confirmation.\n\nKind regards,\nHarrington & Co\n020 7123 4567`,
  },
  compliance_request: {
    label: 'Compliance Document Request',
    subject: (l) => `Compliance Documents Required — ${l.name}`,
    body: (l) => `Dear ${l.name},\n\nWe are writing to advise that one or more compliance certificates at your property are due for renewal or are currently missing from our records.\n\nPlease provide the relevant documents or authorise us to arrange the necessary works.\n\nEnsuring compliance is a legal obligation and protects both you and your tenants.\n\nKind regards,\nHarrington & Co\n020 7123 4567`,
  },
  monthly_update: {
    label: 'Monthly Portfolio Update',
    subject: (l) => `Your Property Portfolio Update — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
    body: (l, props) => `Dear ${l.name},\n\nPlease find your portfolio update for ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.\n\nPORTFOLIO SUMMARY\nProperties managed: ${props.length}\nMonthly rent roll: £${props.reduce((s, p) => s + (p.rent||0), 0).toLocaleString()}\n\nAll properties are performing well. We will contact you separately regarding any items requiring attention.\n\nKind regards,\nHarrington & Co\n020 7123 4567`,
  },
  general: {
    label: 'General Message',
    subject: (l) => `Message from Harrington & Co — ${l.name}`,
    body: (l) => `Dear ${l.name},\n\n\n\nKind regards,\nHarrington & Co\n020 7123 4567`,
  },
}

export default function DraftEmailModal({ landlord, properties, onClose }) {
  const [template, setTemplate] = useState('welcome')
  const [subject, setSubject]   = useState(TEMPLATES.welcome.subject(landlord))
  const [body, setBody]         = useState(TEMPLATES.welcome.body(landlord, properties))
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [copied, setCopied]     = useState(false)

  const changeTemplate = (key) => {
    setTemplate(key)
    const tpl = TEMPLATES[key]
    setSubject(tpl.subject(landlord))
    setBody(tpl.body(landlord, properties))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    addLandlordActivity(landlord.id, { type: 'email', text: `Email drafted: ${subject}` })
  }

  const handleSend = async () => {
    if (!landlord.email) { alert('No email address for this landlord.'); return }
    setSending(true)
    try {
      await sendEmail({ to: landlord.email, subject, message: body })
      setSent(true)
      addLandlordActivity(landlord.id, { type: 'email', text: `Demo email sent to ${landlord.email}: ${subject}` })
      setTimeout(onClose, 2000)
    } catch (e) {
      addLandlordActivity(landlord.id, { type: 'email', text: `Email drafted (not sent): ${subject}` })
      alert('Send failed: ' + e.message)
    }
    setSending(false)
  }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 580, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Draft Email</h2>
            <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>To: {landlord.name} {landlord.email ? `· ${landlord.email}` : '· No email address'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        <div style={{ padding: '14px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {Object.entries(TEMPLATES).map(([key, tpl]) => (
            <button key={key} onClick={() => changeTemplate(key)}
              style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: template === key ? '#0f172a' : '#f1f5f9', color: template === key ? 'white' : '#64748b' }}>
              {tpl.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13, lineHeight: 1.7, outline: 'none', fontFamily: 'monospace', color: '#334155', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCopy}>
            {copied ? <><CheckCircle size={13} color="#10b981" /> Copied!</> : <><Copy size={13} /> Copy</>}
          </button>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Discard</button>
          {sent ? (
            <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px', borderRadius: 8, background: '#f0fdf4', color: '#10b981', fontWeight: 700, fontSize: 13 }}>
              <CheckCircle size={14} /> Email sent!
            </div>
          ) : (
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={sending || !landlord.email} onClick={handleSend}>
              {sending ? 'Sending…' : !landlord.email ? 'No email on file' : <><Mail size={13} /> Send Email</>}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
