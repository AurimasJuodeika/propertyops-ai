import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, ShieldCheck, PoundSterling, Wrench, BarChart3, Users,
  ClipboardCheck, ArrowRight, Check, ChevronRight, Star,
  Building2, AlertTriangle, Play, Menu, X
} from 'lucide-react'

// Animated counter hook
function useCounter(target, duration = 1600, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return value
}

function StatNumber({ value, prefix = '', suffix = '', label, started }) {
  const count = useCounter(value, 1800, started)
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{label}</p>
    </div>
  )
}

const FEATURES = [
  {
    icon: ShieldCheck, color: '#dc2626', bg: '#fef2f2',
    title: 'Compliance Centre',
    desc: 'Track EPC, Gas Safety, EICR, deposits and Right to Rent across every property. Never miss a certificate renewal again.',
    bullets: ['Automatic expiry alerts', 'Per-property compliance matrix', 'AI risk detection'],
  },
  {
    icon: PoundSterling, color: '#10b981', bg: '#f0fdf4',
    title: 'Rent & Arrears',
    desc: 'Full rent roll visibility with AI-generated arrears letters and legal stage tracking — from reminder to Section 8.',
    bullets: ['Automated chase communications', 'Legal stage escalation', 'AI-drafted tenant letters'],
  },
  {
    icon: Wrench, color: '#d97706', bg: '#fffbeb',
    title: 'Maintenance Management',
    desc: 'AI triage every job on arrival, assign contractors instantly, and track resolution from report to completion.',
    bullets: ['AI triage & prioritisation', 'Contractor database', 'Emergency response tracking'],
  },
  {
    icon: BarChart3, color: '#6366f1', bg: '#eef2ff',
    title: 'Branch Analytics',
    desc: 'Compare occupancy, rent collection and compliance scores across branches. Know which team needs attention today.',
    bullets: ['Branch comparison radar', 'Staff performance scores', 'AI weekly management digest'],
  },
  {
    icon: Users, color: '#0284c7', bg: '#eff6ff',
    title: 'Landlord Portal',
    desc: 'Give every landlord their own login. Portfolio overview, financials, compliance and direct messaging — all branded.',
    bullets: ['White-label ready', 'Downloadable statements', 'Real-time maintenance updates'],
  },
  {
    icon: ClipboardCheck, color: '#7c3aed', bg: '#ede9fe',
    title: 'Inspections',
    desc: 'Schedule, track and conduct inspections. Integrates with InspectPro for AI-generated reports, photos and digital signatures.',
    bullets: ['InspectPro integration', 'AI inspection reports', 'Tenant acknowledgement'],
  },
]

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell', role: 'Director, Harrington & Co', avatar: 'SM', rating: 5,
    quote: 'PropertyOps AI gave us visibility across all three branches that we never had before. The compliance alerts alone saved us from two potential fines in the first month.',
  },
  {
    name: 'James Harrington', role: 'Regional Manager', avatar: 'JH', rating: 5,
    quote: 'The role-based dashboards are brilliant. My property managers see exactly what they need — no noise, no excuses. Overdue tasks dropped by 60% in six weeks.',
  },
  {
    name: 'Tom Okafor', role: 'Branch Manager, Hertfordshire', avatar: 'TO', rating: 5,
    quote: 'The landlord portal alone is worth it. Our landlords log in, see their portfolio, download statements. We get half the calls we used to get.',
  },
]

const PLANS = [
  {
    name: 'Starter', price: 149, period: 'month', properties: 'Up to 50 properties',
    color: '#10b981', highlight: false,
    features: ['All core modules', 'Compliance Centre', 'Maintenance management', 'Landlord portal', 'Email support'],
  },
  {
    name: 'Growth', price: 349, period: 'month', properties: 'Up to 200 properties',
    color: '#6366f1', highlight: true,
    features: ['Everything in Starter', 'AI inspection reports', 'AI arrears letters', 'PDF exports', 'Branch analytics', 'Priority support'],
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', properties: 'Unlimited properties',
    color: '#0f172a', highlight: false,
    features: ['Everything in Growth', 'White-label branding', 'Dedicated account manager', 'API access', 'Custom integrations', 'SLA guarantee'],
  },
]

const LOGOS = ['Harrington & Co', 'Apex Lettings', 'Crown Properties', 'Metro Agents', 'Premier Residential', 'Keystone PM']

export default function Landing({ onEnterDemo }) {
  const navigate = useNavigate()
  const [statsVisible, setStatsVisible] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const statsRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0f172a', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
              <Zap size={17} color="white" />
            </div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>PropertyOps AI</span>
          </div>

          {/* Desktop nav */}
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="desktop-nav">
            {['Features', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#e2e8f0'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}>
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => navigate('/login')}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit' }}>
              Sign in
            </button>
            <button onClick={onEnterDemo}
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Play size={13} /> Live Demo
            </button>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileNav(v => !v)} className="mobile-hamburger"
              style={{ display: 'none', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {/* Mobile nav drawer */}
        {mobileNav && (
          <div style={{ background: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Features', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileNav(false)}
                style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#10b981', fontSize: 12.5, fontWeight: 700 }}>Now with Claude AI — intelligent triage, letters & reports</span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 24 }}>
          The property management platform<br />
          <span style={{ background: 'linear-gradient(135deg,#10b981,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            built for UK letting agencies
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 20px)', color: '#94a3b8', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}>
          From compliance tracking to AI-generated arrears letters — PropertyOps AI gives your agency the visibility and automation to manage 100 to 10,000 properties without the chaos.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onEnterDemo}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 30px rgba(16,185,129,0.4)' }}>
            <Play size={16} /> Try Live Demo <ArrowRight size={15} />
          </button>
          <button onClick={() => navigate('/login')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.12)', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign in to your account
          </button>
        </div>

        <p style={{ color: '#475569', fontSize: 13, marginTop: 16 }}>No credit card required · Full demo data loaded · 3 role-based views</p>

        {/* Dashboard preview */}
        <div style={{ marginTop: 60, position: 'relative' }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.15) 0%, transparent 100%)', height: 1, marginBottom: -1 }} />
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '24px', textAlign: 'left',
            boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}>
            {/* Mock dashboard header */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
              <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginLeft: 8, marginTop: 0 }} />
            </div>
            {/* Mock alert bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {[
                { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', text: 'CRITICAL: Gas Safety Certificate EXPIRED — 22A Upper Street, N1 0PQ' },
                { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', text: '£21,250 total rent arrears across 4 tenancies — 2 approaching legal threshold' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: a.bg, borderRadius: 7, border: `1px solid ${a.color}30` }}>
                  <AlertTriangle size={13} color={a.color} />
                  <span style={{ color: a.color, fontSize: 12, fontWeight: 600 }}>{a.text}</span>
                </div>
              ))}
            </div>
            {/* Mock KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Overdue Rent', value: '£21,250', color: '#dc2626' },
                { label: 'Compliance Risks', value: '7', color: '#dc2626' },
                { label: 'Inspections Due', value: '3', color: '#f59e0b' },
                { label: 'Open Maintenance', value: '9', color: '#f59e0b' },
                { label: 'Properties Let', value: '174', color: '#10b981' },
                { label: 'Active Tenancies', value: '168', color: '#10b981' },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '12px 10px' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</p>
                  <p style={{ fontSize: 9.5, color: '#475569', marginTop: 3, fontWeight: 600 }}>{k.label}</p>
                </div>
              ))}
            </div>
            {/* Mock chart bar */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Rent Collection — Last 7 Months</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                {[87, 92, 95, 91, 97, 90, 82].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${h}%`, background: h < 90 ? '#dc2626' : '#10b981', borderRadius: '3px 3px 0 0', opacity: 0.8 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 80, background: 'rgba(16,185,129,0.15)', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── LOGO BAR ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Trusted by letting agencies managing over 50,000 properties</p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {LOGOS.map(name => (
              <div key={name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 18px' }}>
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 700 }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: '70px 24px', background: 'linear-gradient(135deg,#0a3d2e,#0f172a)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          <StatNumber value={180}  prefix=""  suffix="+"  label="Properties managed in demo" started={statsVisible} />
          <StatNumber value={94}   prefix=""  suffix="%"  label="Average occupancy rate"     started={statsVisible} />
          <StatNumber value={21}   prefix="£" suffix="k+" label="Arrears identified instantly" started={statsVisible} />
          <StatNumber value={12}   prefix=""  suffix="x"  label="Faster compliance reporting" started={statsVisible} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1180, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Platform Modules</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'white', letterSpacing: '-0.8px', lineHeight: 1.15 }}>
            Everything your agency needs<br />in one platform
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ color: 'white', fontSize: 17, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.2px' }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: 13.5, lineHeight: 1.7, marginBottom: 16 }}>{f.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {f.bullets.map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color={f.color} />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 12.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '70px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#10b981', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 48 }}>What agencies say</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 }}>{t.avatar}</div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 13.5 }}>{t.name}</p>
                    <p style={{ color: '#64748b', fontSize: 12 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Transparent Pricing</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, color: 'white', letterSpacing: '-0.8px' }}>Start free. Scale as you grow.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              background: plan.highlight ? 'linear-gradient(135deg, #064e3b, #0a3d2e)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${plan.highlight ? '#10b981' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 16, padding: '28px',
              position: 'relative',
              boxShadow: plan.highlight ? '0 0 0 1px #10b981, 0 24px 60px rgba(16,185,129,0.2)' : 'none',
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', fontSize: 11, fontWeight: 800, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}
              <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
                {typeof plan.price === 'number' ? (
                  <>
                    <span style={{ color: 'white', fontSize: 42, fontWeight: 900, letterSpacing: '-1px' }}>£{plan.price}</span>
                    <span style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>/{plan.period}</span>
                  </>
                ) : (
                  <span style={{ color: 'white', fontSize: 34, fontWeight: 900 }}>{plan.price}</span>
                )}
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>{plan.properties}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Check size={14} color="#10b981" />
                    <span style={{ color: '#94a3b8', fontSize: 13.5 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onEnterDemo}
                style={{
                  width: '100%', padding: '12px', borderRadius: 9, fontFamily: 'inherit',
                  border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  background: plan.highlight ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.05)',
                  color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: plan.highlight ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
                }}>
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'white', letterSpacing: '-0.8px', marginBottom: 16 }}>
            Ready to see it in action?
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
            The full demo is loaded with real agency data. Sign in as an agency owner, branch manager or property manager.
          </p>
          <button onClick={onEnterDemo}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', padding: '16px 36px', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(16,185,129,0.4)' }}>
            <Play size={18} /> Launch Live Demo <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} color="white" />
            </div>
            <span style={{ color: '#64748b', fontSize: 13 }}>PropertyOps AI · Built for UK Letting Agencies</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  )
}
