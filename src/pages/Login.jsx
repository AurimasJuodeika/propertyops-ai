import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle, Building2, ShieldCheck, BarChart3, Wrench } from 'lucide-react'
import { signIn } from '../lib/auth'
import { isConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { role: 'Agency Owner',     name: 'Sarah Mitchell',  email: 'sarah@harrington.co.uk',  password: 'demo1234', avatar: 'SM', branch: 'All Branches', color: '#10b981' },
  { role: 'Branch Manager',   name: 'James Harrington',email: 'james@harrington.co.uk',  password: 'demo1234', avatar: 'JH', branch: 'London Central', color: '#6366f1' },
  { role: 'Property Manager', name: 'Priya Sharma',    email: 'priya@harrington.co.uk',  password: 'demo1234', avatar: 'PS', branch: 'London Central', color: '#f59e0b' },
]

const FEATURES = [
  { icon: ShieldCheck, text: 'Real-time compliance tracking' },
  { icon: BarChart3,   text: 'AI-powered risk detection' },
  { icon: Wrench,      text: 'Automated maintenance triage' },
  { icon: Building2,   text: 'Portfolio insights for landlords' },
]

export default function Login() {
  const navigate  = useNavigate()
  const { demoLogin } = useAuth()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const handleRealLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      // AuthContext picks up the session change automatically
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your credentials.')
    }
    setLoading(false)
  }

  const handleDemoLogin = async (account) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    demoLogin(account)
    navigate('/dashboard', { replace: true })
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0f172a' }}>

      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', maxWidth: 520, background: 'linear-gradient(145deg,#0f172a 0%,#0d2438 60%,#0a3d2e 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 52 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(16,185,129,0.4)' }}>
            <Zap size={19} color="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.2px' }}>PropertyOps AI</p>
            <p style={{ color: '#475569', fontSize: 11, fontWeight: 500 }}>Estate Agency Platform</p>
          </div>
        </div>

        <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 14 }}>
          Manage every property,<br />
          <span style={{ color: '#10b981' }}>from one platform</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.7, marginBottom: 36 }}>
          Compliance tracking, AI automation and complete portfolio visibility — built for UK letting agencies.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <f.icon size={14} color="#10b981" />
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13.5 }}>{f.text}</p>
            </div>
          ))}
        </div>

        {!isConfigured && (
          <div style={{ marginTop: 40, padding: '14px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}>
            <p style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>🔧 Demo Mode Active</p>
            <p style={{ color: '#6366f1', fontSize: 11.5, lineHeight: 1.6 }}>
              Supabase not configured. Add your credentials to <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: 3 }}>.env</code> to enable real accounts.
              Use the demo login on the right to explore the platform.
            </p>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Sign in to your account</h2>
            <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4 }}>
              {isConfigured ? 'Enter your credentials below' : 'Use a demo account to explore the platform'}
            </p>
          </div>

          {/* Real login form — only shown when Supabase is configured */}
          {isConfigured && (
            <form onSubmit={handleRealLogin} style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151', marginBottom: 5 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@agency.co.uk" autoComplete="email"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor='#10b981'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151', marginBottom: 5 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    style={{ width: '100%', padding: '11px 44px 11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor='#10b981'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 18 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 500 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', cursor: loading ? 'default' : 'pointer', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)', fontFamily: 'inherit' }}>
                {loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Signing in…</>
                  : <>Sign in <ArrowRight size={16} /></>}
              </button>

              <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 16 }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>Create one →</Link>
              </p>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: `${isConfigured ? '0' : '0'} 0 18px` }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
              {isConfigured ? 'or sign in as demo user' : 'Choose a demo account'}
            </span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Demo accounts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {DEMO_ACCOUNTS.map(account => (
              <button key={account.email} onClick={() => handleDemoLogin(account)} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: loading ? 'default' : 'pointer', transition: 'all 0.15s', textAlign: 'left', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = account.color; e.currentTarget.style.background = '#fafafa' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: `linear-gradient(135deg,${account.color},${account.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 }}>
                  {account.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{account.name}</p>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{account.role} · {account.branch}</p>
                </div>
                <ArrowRight size={14} color="#cbd5e1" />
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 18 }}>
            Demo password: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: '#334155' }}>demo1234</code>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
