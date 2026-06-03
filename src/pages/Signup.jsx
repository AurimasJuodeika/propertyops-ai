import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { signUp } from '../lib/auth'
import { isConfigured } from '../lib/supabase'

const ROLES = [
  { value: 'agency_owner',            label: 'Agency Owner' },
  { value: 'regional_manager',        label: 'Regional Manager' },
  { value: 'branch_manager',          label: 'Branch Manager' },
  { value: 'property_manager',        label: 'Property Manager' },
  { value: 'lettings_negotiator',     label: 'Lettings Negotiator' },
  { value: 'property_inspector',      label: 'Property Inspector' },
  { value: 'maintenance_coordinator', label: 'Maintenance Coordinator' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)

  const [form, setForm] = useState({
    fullName:   '',
    email:      '',
    password:   '',
    confirm:    '',
    agencyName: '',
    role:       'agency_owner',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleNext = (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Please enter your full name.'); return }
    if (!form.email.includes('@')) { setError('Please enter a valid email.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.agencyName.trim()) { setError('Please enter your agency name.'); return }
    if (!isConfigured) {
      setError('Supabase is not configured. Add credentials to .env to create real accounts.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signUp({
        email:      form.email,
        password:   form.password,
        fullName:   form.fullName,
        agencyName: form.agencyName,
        role:       form.role,
      })
      // Profile is auto-created by Supabase trigger
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="#10b981" />
          </div>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Check your email</h2>
          <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.7, marginBottom: 28 }}>
            We've sent a confirmation link to <strong style={{ color: '#94a3b8' }}>{form.email}</strong>.
            Click the link to activate your account.
          </p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', padding: '12px 24px', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Back to Sign In <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9,
    fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: 'inherit',
    background: 'white', boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: '#374151', marginBottom: 5,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center', textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>PropertyOps AI</span>
        </Link>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s ? '#10b981' : '#f1f5f9',
                  color: step >= s ? 'white' : '#94a3b8',
                  fontSize: 12, fontWeight: 800,
                }}>
                  {step > s ? <CheckCircle size={15} /> : s}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: step >= s ? '#0f172a' : '#94a3b8' }}>
                  {s === 1 ? 'Your account' : 'Your agency'}
                </span>
                {s < 2 && <div style={{ width: 32, height: 1, background: step > s ? '#10b981' : '#e2e8f0' }} />}
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {step === 1 ? 'Create your account' : 'Set up your agency'}
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>
            {step === 1 ? 'Start your 14-day free trial. No credit card required.' : 'Tell us about your agency and your role.'}
          </p>

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleNext}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full Name</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Sarah Mitchell" style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Work Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="sarah@youragency.co.uk" style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: form.password.length > i * 2 + 3 ? (form.password.length > 10 ? '#10b981' : '#f59e0b') : '#e2e8f0' }} />
                    ))}
                    <span style={{ fontSize: 10.5, color: form.password.length > 10 ? '#10b981' : '#d97706', fontWeight: 600, marginLeft: 4 }}>
                      {form.password.length < 8 ? 'Weak' : form.password.length < 12 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>
                </div>
              )}

              <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                Continue →
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Agency Name</label>
                <input value={form.agencyName} onChange={set('agencyName')} placeholder="e.g. Smith & Co Property Management" style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Your Role</label>
                <select value={form.role} onChange={set('role')}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>
                  This determines your dashboard view and what data you see by default.
                </p>
              </div>

              {!isConfigured && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <p style={{ fontSize: 12.5, color: '#92400e', fontWeight: 600 }}>⚠ Supabase not configured</p>
                  <p style={{ fontSize: 12, color: '#b45309', marginTop: 3 }}>
                    Add your Supabase URL and anon key to <code>.env</code> to create real accounts.
                    Use the demo login on the sign in page to explore the platform.
                  </p>
                </div>
              )}

              {error && (
                <div style={{ display: 'flex', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => { setStep(1); setError('') }}
                  style={{ flex: 1, padding: '12px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '12px', borderRadius: 9, border: 'none', cursor: loading ? 'default' : 'pointer', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading
                    ? <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Creating account…</>
                    : 'Create account →'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 12.5, color: '#94a3b8', marginTop: 20 }}>
            Already have an account? <Link to="/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: '#475569', marginTop: 20 }}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
