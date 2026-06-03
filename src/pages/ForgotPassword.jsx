import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { resetPassword } from '../lib/auth'
import { isConfigured } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handle = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (!isConfigured) {
      setError('Supabase not configured. Password reset requires a real account.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center', textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>PropertyOps AI</span>
        </Link>

        <div style={{ background: 'white', borderRadius: 16, padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Check your email</h2>
              <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                We've sent a password reset link to <strong style={{ color: '#334155' }}>{email}</strong>.<br />
                Check your inbox and spam folder.
              </p>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', padding: '11px 22px', borderRadius: 9, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Mail size={22} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Reset your password</h2>
              <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
                Enter the email address associated with your account and we'll send a reset link.
              </p>

              <form onSubmit={handle}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151', marginBottom: 5 }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@agency.co.uk" autoFocus
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box', color: '#0f172a' }}
                    onFocus={e => e.target.style.borderColor='#10b981'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                </div>

                {error && (
                  <div style={{ display: 'flex', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                    <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', cursor: loading ? 'default' : 'pointer', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)' }}>
                  {loading
                    ? <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Sending…</>
                    : 'Send reset link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 20 }}>
                <Link to="/login" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={13} /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
