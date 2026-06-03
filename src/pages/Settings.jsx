import { useState } from 'react'
import { Building2, Users, Bell, Shield, Zap, Save, Sun, Moon, Database, User } from 'lucide-react'
import { AGENCY, STAFF } from '../data/mockData'
import { useTheme, useThemeColors } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { isConfigured } from '../lib/supabase'
import { updateProfile } from '../lib/auth'
import SupabaseSetup from '../components/SupabaseSetup'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '')
  const [saved, setSaved]   = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('appearance')
  const { isDark, toggle } = useTheme()
  const t = useThemeColors()
  const { user, refreshProfile } = useAuth()

  const [profileForm, setProfileForm] = useState({
    fullName:   user?.name   || '',
    agencyName: user?.agencyName || '',
    role:       user?.roleKey || 'agency_owner',
  })

  const save = () => {
    localStorage.setItem('anthropic_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveProfile = async () => {
    if (user?.supaUser && isConfigured) {
      await updateProfile(user.supaUser.id, {
        full_name:   profileForm.fullName,
        agency_name: profileForm.agencyName,
        role:        profileForm.role,
      })
      await refreshProfile()
    }
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const sections = [
    { id: 'appearance', label: 'Appearance',          icon: Sun      },
    { id: 'account',    label: 'My Account',          icon: User     },
    { id: 'agency',     label: 'Agency Details',      icon: Building2 },
    { id: 'ai',         label: 'AI Configuration',    icon: Zap      },
    { id: 'database',   label: 'Database & Auth',     icon: Database },
    { id: 'users',      label: 'Users & Roles',       icon: Users    },
    { id: 'notifications',label: 'Notifications',     icon: Bell     },
    { id: 'compliance', label: 'Compliance Defaults', icon: Shield   },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Agency configuration, user roles and notification preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar nav */}
        <div className="card" style={{ padding: '8px', alignSelf: 'start' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: activeSection === s.id ? '#f0fdf4' : 'transparent',
                color: activeSection === s.id ? '#059669' : '#374151',
                fontSize: 13.5, fontWeight: 600, marginBottom: 2, textAlign: 'left'
              }}>
              <s.icon size={15} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeSection === 'appearance' && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: t.textPrimary }}>Appearance</h2>
              <p style={{ fontSize: 13.5, color: t.textSecondary, marginBottom: 24 }}>Customise the look and feel of PropertyOps AI.</p>

              {/* Theme toggle */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary, marginBottom: 14 }}>Theme</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { id: 'light', icon: Sun,  label: 'Light', desc: 'Clean white interface' },
                    { id: 'dark',  icon: Moon, label: 'Dark',  desc: 'Easy on the eyes' },
                  ].map(opt => {
                    const active = isDark ? opt.id === 'dark' : opt.id === 'light'
                    return (
                      <button key={opt.id} onClick={toggle}
                        style={{
                          padding: '16px', borderRadius: 12, cursor: 'pointer',
                          border: active ? '2px solid #10b981' : `1px solid ${t.border}`,
                          background: active ? 'rgba(16,185,129,0.08)' : t.bgCardAlt,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                          fontFamily: 'inherit', transition: 'all 0.15s',
                        }}>
                        {/* Mini preview */}
                        <div style={{ width: '100%', height: 80, borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                          {opt.id === 'light' ? (
                            <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', gap: 4, padding: 6 }}>
                              <div style={{ width: 40, height: '100%', background: '#0f172a', borderRadius: 4 }} />
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ height: 16, background: 'white', borderRadius: 4, border: '1px solid #e2e8f0' }} />
                                <div style={{ flex: 1, background: 'white', borderRadius: 4, border: '1px solid #e2e8f0' }} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ height: '100%', background: '#080f1e', display: 'flex', gap: 4, padding: 6 }}>
                              <div style={{ width: 40, height: '100%', background: '#0f172a', borderRadius: 4, border: '1px solid #1e2d42' }} />
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ height: 16, background: '#0a0f1e', borderRadius: 4, border: '1px solid #1e2d42' }} />
                                <div style={{ flex: 1, background: '#111827', borderRadius: 4, border: '1px solid #1e2d42' }} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 13.5, fontWeight: 700, color: active ? '#10b981' : t.textPrimary }}>{opt.label}</p>
                          <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{opt.desc}</p>
                        </div>
                        {active && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: 20 }}>
                            ✓ Active
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick toggle row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: t.bgCardAlt, borderRadius: 10, border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isDark ? <Moon size={18} color="#6366f1" /> : <Sun size={18} color="#f59e0b" />}
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: t.textPrimary }}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                    <p style={{ fontSize: 12, color: t.textMuted }}>Currently using {isDark ? 'dark' : 'light'} theme</p>
                  </div>
                </div>
                <button onClick={toggle}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: isDark ? '#6366f1' : '#e2e8f0', position: 'relative', transition: 'background 0.25s',
                  }}>
                  <span style={{
                    position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
                    background: 'white', transition: 'left 0.25s',
                    left: isDark ? 25 : 3,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }} />
                </button>
              </div>
            </div>
          )}

          {/* ── My Account ── */}
          {activeSection === 'account' && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: t.textPrimary }}>My Account</h2>
              <p style={{ fontSize: 13.5, color: t.textSecondary, marginBottom: 24 }}>
                {isConfigured ? 'Update your profile. Changes are saved to Supabase.' : 'Running in demo mode — changes are local only.'}
              </p>

              {/* Current user card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: t.bgCardAlt, borderRadius: 12, border: `1px solid ${t.border}`, marginBottom: 24 }}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: `linear-gradient(135deg,${user?.color || '#10b981'},${user?.color || '#059669'}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {user?.avatar || '?'}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary }}>{user?.name || 'Unknown'}</p>
                  <p style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>{user?.email}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${user?.color || '#10b981'}20`, color: user?.color || '#10b981' }}>{user?.role}</span>
                    {isConfigured && <span className="badge badge-green">✓ Supabase Auth</span>}
                    {!isConfigured && <span className="badge badge-amber">Demo Mode</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', color: t.textMuted, letterSpacing: '0.05em', marginBottom: 6 }}>Full Name</label>
                  <input value={profileForm.fullName} onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
                    style={{ width: '100%', border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13.5, background: t.bgInput, color: t.textPrimary, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', color: t.textMuted, letterSpacing: '0.05em', marginBottom: 6 }}>Agency Name</label>
                  <input value={profileForm.agencyName} onChange={e => setProfileForm(f => ({ ...f, agencyName: e.target.value }))}
                    style={{ width: '100%', border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13.5, background: t.bgInput, color: t.textPrimary, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', color: t.textMuted, letterSpacing: '0.05em', marginBottom: 6 }}>Role</label>
                  <select value={profileForm.role} onChange={e => setProfileForm(f => ({ ...f, role: e.target.value }))}
                    style={{ width: '100%', border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13.5, background: t.bgInput, color: t.textPrimary, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                    {[
                      { value: 'agency_owner',            label: 'Agency Owner' },
                      { value: 'regional_manager',        label: 'Regional Manager' },
                      { value: 'branch_manager',          label: 'Branch Manager' },
                      { value: 'property_manager',        label: 'Property Manager' },
                      { value: 'lettings_negotiator',     label: 'Lettings Negotiator' },
                      { value: 'property_inspector',      label: 'Property Inspector' },
                      { value: 'maintenance_coordinator', label: 'Maintenance Coordinator' },
                    ].map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <p style={{ fontSize: 12, color: t.textMuted, marginTop: 5 }}>This controls your dashboard view — change and refresh to see the difference.</p>
                </div>
              </div>
              <button className="btn-primary" onClick={saveProfile} style={{ marginTop: 20 }}>
                <Save size={13} /> {profileSaved ? '✓ Saved!' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* ── Database & Auth ── */}
          {activeSection === 'database' && (
            <div>
              {isConfigured ? (
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Database size={18} color="#10b981" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14.5, color: t.textPrimary }}>Supabase Connected</p>
                      <p style={{ fontSize: 12.5, color: t.textSecondary, marginTop: 1 }}>Real authentication is active. Users are stored in your Supabase project.</p>
                    </div>
                    <span className="badge badge-green" style={{ marginLeft: 'auto' }}>✓ Active</span>
                  </div>
                  <div style={{ padding: '12px 14px', background: t.bgCardAlt, borderRadius: 9, border: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: 12.5, color: t.textSecondary }}>
                      <strong style={{ color: t.textPrimary }}>Project URL:</strong> {import.meta.env.VITE_SUPABASE_URL}
                    </p>
                    <p style={{ fontSize: 12.5, color: t.textSecondary, marginTop: 6 }}>
                      <strong style={{ color: t.textPrimary }}>Signed in as:</strong> {user?.email}
                    </p>
                  </div>
                </div>
              ) : (
                <SupabaseSetup />
              )}
            </div>
          )}

          {activeSection === 'agency' && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Agency Details</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { label: 'Agency Name', value: AGENCY.name },
                  { label: 'Trading Name', value: 'Harrington & Co Property Management Ltd' },
                  { label: 'Registered Address', value: '45 Mayfair Lane, London, W1K 3HB' },
                  { label: 'Companies House No.', value: '08234567' },
                  { label: 'ARLA Membership No.', value: 'M0089234' },
                  { label: 'VAT Number', value: 'GB 234 567 890' },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>{field.label}</label>
                    <input defaultValue={field.value} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, color: '#334155', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop: 20 }}><Save size={13} /> Save Changes</button>
            </div>
          )}

          {activeSection === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={16} color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700 }}>Claude AI Integration</h2>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>Powers AI inspection reports, arrears letters, compliance alerts and weekly summaries</p>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Anthropic API Key</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, color: '#334155', outline: 'none', fontFamily: 'monospace' }} />
                    <button className="btn-primary" onClick={save} style={{ flexShrink: 0 }}>
                      {saved ? '✓ Saved' : <><Save size={13} /> Save</>}
                    </button>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6 }}>Your API key is stored locally. Get yours at console.anthropic.com</p>
                </div>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>AI Feature Toggles</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'AI Inspection Report Generation', desc: 'Auto-generate professional reports after inspections', enabled: true },
                    { label: 'AI Maintenance Triage', desc: 'Automatically assess and prioritise new maintenance jobs', enabled: true },
                    { label: 'AI Arrears Letters', desc: 'Generate personalised chase letters for rent arrears', enabled: true },
                    { label: 'AI Compliance Risk Detection', desc: 'Proactive alerts when compliance risks are identified', enabled: true },
                    { label: 'AI Landlord Portfolio Updates', desc: 'Monthly AI-written updates for each landlord', enabled: false },
                    { label: 'AI Weekly Management Summary', desc: 'Weekly digest for agency owner and branch managers', enabled: true },
                  ].map(feature => (
                    <div key={feature.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{feature.label}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{feature.desc}</p>
                      </div>
                      <button style={{
                        width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                        background: feature.enabled ? '#10b981' : '#e2e8f0', position: 'relative', transition: 'background 0.2s'
                      }}>
                        <span style={{
                          position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: 'white',
                          left: feature.enabled ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 700 }}>Team Members</p>
                <button className="btn-primary" style={{ fontSize: 12 }}><Users size={12} /> Invite User</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Branch</th><th>Email</th><th>Performance</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {STAFF.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800 }}>{s.avatar}</div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{s.name}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-slate">{s.role}</span></td>
                      <td style={{ fontSize: 12.5, color: '#64748b' }}>{s.branch}</td>
                      <td style={{ fontSize: 12.5, color: '#64748b' }}>{s.email}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                            <div style={{ width: `${s.performance}%`, height: '100%', background: s.performance >= 90 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: s.performance >= 90 ? '#10b981' : '#d97706' }}>{s.performance}%</span>
                        </div>
                      </td>
                      <td><span className="badge badge-green">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Notification Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Compliance certificate expires within 30 days', email: true, sms: false, app: true },
                  { label: 'Compliance certificate expired', email: true, sms: true, app: true },
                  { label: 'New maintenance emergency raised', email: true, sms: true, app: true },
                  { label: 'Rent payment missed', email: true, sms: false, app: true },
                  { label: 'Inspection overdue', email: true, sms: false, app: true },
                  { label: 'New tenant enquiry', email: true, sms: false, app: true },
                  { label: 'Right to Rent expiring within 60 days', email: true, sms: false, app: true },
                  { label: 'Tenancy ending within 90 days', email: true, sms: false, app: false },
                ].map(n => (
                  <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <p style={{ flex: 1, fontSize: 13.5, color: '#334155' }}>{n.label}</p>
                    {['Email', 'SMS', 'In-App'].map((ch, i) => (
                      <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: '#64748b' }}>
                        <input type="checkbox" defaultChecked={[n.email, n.sms, n.app][i]} style={{ accentColor: '#10b981', width: 14, height: 14 }} />
                        {ch}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop: 16 }}><Save size={13} /> Save Preferences</button>
            </div>
          )}

          {activeSection === 'compliance' && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Compliance Alert Thresholds</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Gas Safety Certificate alert threshold', value: '30', unit: 'days before expiry' },
                  { label: 'EICR alert threshold', value: '60', unit: 'days before expiry' },
                  { label: 'EPC alert threshold', value: '90', unit: 'days before expiry' },
                  { label: 'Right to Rent alert threshold', value: '60', unit: 'days before expiry' },
                  { label: 'Deposit protection alert threshold', value: '7', unit: 'days after tenancy start' },
                  { label: 'Inspection overdue alert', value: '7', unit: 'days after scheduled date' },
                ].map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <p style={{ flex: 1, fontSize: 13.5, color: '#334155' }}>{c.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" defaultValue={c.value} style={{ width: 60, border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 10px', fontSize: 13.5, textAlign: 'center', fontFamily: 'inherit' }} />
                      <span style={{ fontSize: 12.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>{c.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop: 20 }}><Save size={13} /> Save Thresholds</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
