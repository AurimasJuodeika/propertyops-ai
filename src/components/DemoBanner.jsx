import { useState } from 'react'
import { Zap, X, ChevronRight, Users } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { role: 'Agency Owner',    email: 'sarah@harrington.co.uk',  avatar: 'SM', color: '#10b981' },
  { role: 'Branch Manager',  email: 'james@harrington.co.uk',  avatar: 'JH', color: '#6366f1' },
  { role: 'Property Manager',email: 'priya@harrington.co.uk',  avatar: 'PS', color: '#f59e0b' },
]

export default function DemoBanner({ currentUser, onSwitchUser }) {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, pointerEvents: 'none',
    }}>
      {/* Role switcher (expanded) */}
      {expanded && (
        <div style={{
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '12px', display: 'flex', gap: 8,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)', pointerEvents: 'all',
          backdropFilter: 'blur(12px)',
        }}>
          {DEMO_ACCOUNTS.map(acc => (
            <button key={acc.email}
              onClick={() => { onSwitchUser(acc); setExpanded(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                borderRadius: 9, border: currentUser?.email === acc.email ? `2px solid ${acc.color}` : '1px solid rgba(255,255,255,0.1)',
                background: currentUser?.email === acc.email ? `${acc.color}15` : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${acc.color},${acc.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 9, fontWeight: 800 }}>{acc.avatar}</div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{acc.role}</p>
                <p style={{ color: '#64748b', fontSize: 10 }}>Click to switch</p>
              </div>
              {currentUser?.email === acc.email && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: acc.color, marginLeft: 2 }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 40, boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)', overflow: 'hidden',
        pointerEvents: 'all',
      }}>
        {/* Demo badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>DEMO MODE</span>
        </div>

        {/* Current user */}
        <button onClick={() => setExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg,${currentUser?.color || '#10b981'},${currentUser?.color || '#10b981'}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 8, fontWeight: 800 }}>
            {currentUser?.avatar || 'SM'}
          </div>
          <span style={{ color: '#e2e8f0', fontSize: 12.5, fontWeight: 600 }}>{currentUser?.role || 'Agency Owner'}</span>
          <Users size={12} color="#64748b" />
        </button>

        {/* Dismiss */}
        <button onClick={() => setDismissed(true)}
          style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center' }}>
          <X size={13} color="#475569" />
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
        @media (max-width: 768px) {
          /* move above bottom nav */
          div[style*="bottom: 20px"] { bottom: 80px !important; }
        }
      `}</style>
    </div>
  )
}
