import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Building2, User, Users, Wrench, ShieldCheck,
  FileText, X, ArrowRight, Clock, AlertTriangle, Hash,
  ClipboardCheck, ChevronRight
} from 'lucide-react'
import {
  PROPERTIES, TENANTS, LANDLORDS, MAINTENANCE_JOBS,
  TENANCIES, INSPECTIONS, TASKS, STAFF,
  getLandlordById, getTenantById, getComplianceStatus
} from '../data/mockData'

// ─── Build search index ───────────────────────────────────────────────────────
function buildIndex() {
  const items = []

  PROPERTIES.forEach(p => {
    const landlord = getLandlordById(p.landlordId)
    const tenant   = getTenantById(p.tenantId)
    const comp     = getComplianceStatus(p)
    items.push({
      id: `prop-${p.id}`, type: 'property',
      title: p.address,
      sub: `${p.postcode} · ${p.branch} · £${p.rent.toLocaleString()}/mo`,
      meta: `${p.status} ${p.type} ${p.bedrooms}bed ${landlord?.name || ''} ${tenant?.name || ''}`,
      badge: p.status === 'let' ? { text: 'Let', color: '#10b981', bg: '#d1fae5' }
           : p.status === 'void' ? { text: 'Void', color: '#d97706', bg: '#fef3c7' }
           : { text: 'Available', color: '#2563eb', bg: '#dbeafe' },
      alert: comp === 'critical' ? 'Compliance issue' : comp === 'warning' ? 'Cert expiring' : null,
      link: `/properties/${p.id}`,
      icon: Building2, iconColor: '#10b981', iconBg: '#f0fdf4',
      keywords: `${p.address} ${p.postcode} ${p.city} ${p.branch} ${p.type} ${landlord?.name || ''} ${tenant?.name || ''} ${p.rent}`,
    })
  })

  TENANTS.forEach(t => {
    const prop    = PROPERTIES.find(p => p.id === t.propertyId)
    const tenancy = TENANCIES.find(ten => ten.tenantId === t.id)
    items.push({
      id: `ten-${t.id}`, type: 'tenant',
      title: t.name,
      sub: `${prop?.address || 'No property'} · ${prop?.postcode || ''}`,
      meta: `${t.email} ${t.phone} ${t.nationality}`,
      badge: tenancy?.arrears > 0
        ? { text: `£${tenancy.arrears.toLocaleString()} arrears`, color: '#dc2626', bg: '#fee2e2' }
        : { text: 'Paying', color: '#10b981', bg: '#d1fae5' },
      alert: !t.rtRVerified ? 'RTR not verified' : null,
      link: '/tenants',
      icon: User, iconColor: '#6366f1', iconBg: '#eef2ff',
      keywords: `${t.name} ${t.email} ${t.phone} ${prop?.address || ''} ${t.nationality}`,
    })
  })

  LANDLORDS.forEach(l => {
    const props = PROPERTIES.filter(p => l.properties.includes(p.id))
    items.push({
      id: `land-${l.id}`, type: 'landlord',
      title: l.name,
      sub: `${l.properties.length} propert${l.properties.length !== 1 ? 'ies' : 'y'} · ${l.email}`,
      meta: `${l.phone} ${l.type}`,
      badge: { text: l.type, color: '#7c3aed', bg: '#ede9fe' },
      alert: l.balance < 0 ? 'Negative balance' : null,
      link: '/landlords',
      icon: Users, iconColor: '#7c3aed', iconBg: '#ede9fe',
      keywords: `${l.name} ${l.email} ${l.phone} ${props.map(p => p.address).join(' ')}`,
    })
  })

  MAINTENANCE_JOBS.forEach(j => {
    const prop = PROPERTIES.find(p => p.id === j.propertyId)
    items.push({
      id: `job-${j.id}`, type: 'maintenance',
      title: j.title,
      sub: `${prop?.address || ''} · ${j.tenantName}`,
      meta: `${j.priority} ${j.status} ${j.description}`,
      badge: {
        text: j.priority,
        color: j.priority === 'emergency' ? '#dc2626' : j.priority === 'urgent' ? '#d97706' : '#10b981',
        bg:    j.priority === 'emergency' ? '#fee2e2' : j.priority === 'urgent' ? '#fef3c7' : '#d1fae5',
      },
      alert: j.status === 'new' && (j.priority === 'emergency' || j.priority === 'urgent') ? 'Unassigned' : null,
      link: '/maintenance',
      icon: Wrench, iconColor: '#d97706', iconBg: '#fffbeb',
      keywords: `${j.title} ${j.description} ${prop?.address || ''} ${j.tenantName} ${j.priority} ${j.status}`,
    })
  })

  INSPECTIONS.forEach(i => {
    items.push({
      id: `ins-${i.id}`, type: 'inspection',
      title: `${i.type} — ${i.address.split(',')[0]}`,
      sub: `${i.tenantName} · ${new Date(i.scheduledDate).toLocaleDateString('en-GB')} · ${i.inspectorName}`,
      meta: `${i.type} ${i.address} ${i.status}`,
      badge: i.status === 'overdue'
        ? { text: 'Overdue', color: '#dc2626', bg: '#fee2e2' }
        : { text: 'Scheduled', color: '#2563eb', bg: '#dbeafe' },
      alert: i.status === 'overdue' ? 'Overdue' : null,
      link: '/inspections',
      icon: ClipboardCheck, iconColor: '#2563eb', iconBg: '#eff6ff',
      keywords: `${i.address} ${i.tenantName} ${i.type} ${i.inspectorName} ${i.status}`,
    })
  })

  TASKS.forEach(t => {
    items.push({
      id: `task-${t.id}`, type: 'task',
      title: t.title,
      sub: `${t.type} · Due ${t.dueDate || 'No date'}`,
      meta: `${t.type} ${t.status} ${t.priority}`,
      badge: t.status === 'overdue'
        ? { text: 'Overdue', color: '#dc2626', bg: '#fee2e2' }
        : t.status === 'pending'
        ? { text: 'Pending', color: '#d97706', bg: '#fef3c7' }
        : { text: t.status, color: '#64748b', bg: '#f1f5f9' },
      alert: t.status === 'overdue' ? 'Overdue' : null,
      link: '/tasks',
      icon: FileText, iconColor: '#64748b', iconBg: '#f8fafc',
      keywords: `${t.title} ${t.type} ${t.status} ${t.priority}`,
    })
  })

  return items
}

const SEARCH_INDEX = buildIndex()

const RECENT_SEARCHES = [
  '22A Upper Street',
  'Helen Morris',
  'Gas Safety',
  'Emergency maintenance',
]

const TYPE_LABELS = {
  property: 'Properties',
  tenant: 'Tenants',
  landlord: 'Landlords',
  maintenance: 'Maintenance',
  inspection: 'Inspections',
  task: 'Tasks',
}

function score(item, query) {
  const q = query.toLowerCase()
  const kw = item.keywords.toLowerCase()
  const title = item.title.toLowerCase()

  if (title.startsWith(q)) return 100
  if (title.includes(q)) return 80
  if (item.sub?.toLowerCase().includes(q)) return 60
  if (kw.includes(q)) return 40

  // Fuzzy: all words present
  const words = q.split(' ').filter(Boolean)
  if (words.length > 1 && words.every(w => kw.includes(w))) return 30

  return 0
}

export default function GlobalSearch({ onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keyboard shortcut to open: Cmd+K / Ctrl+K handled in Layout
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, results.length - 1))
      if (e.key === 'ArrowUp') setSelected(s => Math.max(s - 1, 0))
      if (e.key === 'Enter' && results[selected]) {
        navigate(results[selected].link)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, selected, navigate, onClose])

  const search = useCallback((q) => {
    if (!q.trim()) { setResults([]); return }
    const scored = SEARCH_INDEX
      .map(item => ({ item, score: score(item, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item)
    setResults(scored.slice(0, 30))
    setSelected(0)
  }, [])

  useEffect(() => {
    search(query)
  }, [query, search])

  const filtered = typeFilter === 'all' ? results : results.filter(r => r.type === typeFilter)

  // Group by type
  const grouped = {}
  filtered.forEach(r => {
    if (!grouped[r.type]) grouped[r.type] = []
    grouped[r.type].push(r)
  })

  const flatFiltered = filtered

  const handleSelect = (item) => {
    navigate(item.link)
    onClose()
  }

  const typeCounts = {}
  results.forEach(r => { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1 })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 58,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '12vh', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 640, zIndex: 59,
        background: 'white', borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '72vh',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 18px', borderBottom: '1px solid #f1f5f9',
        }}>
          <Search size={18} color={query ? '#10b981' : '#94a3b8'} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search properties, tenants, landlords, jobs…"
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 16,
              color: '#0f172a', background: 'none', fontFamily: 'inherit',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={13} color="#94a3b8" />
            </button>
          )}
          <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 5, padding: '2px 7px', fontSize: 11, color: '#94a3b8', fontFamily: 'inherit' }}>ESC</kbd>
        </div>

        {/* Type filter pills */}
        {results.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid #f8fafc', overflowX: 'auto', flexShrink: 0 }}>
            <button onClick={() => setTypeFilter('all')}
              style={{ padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: typeFilter === 'all' ? '#0f172a' : '#f1f5f9', color: typeFilter === 'all' ? 'white' : '#64748b', whiteSpace: 'nowrap' }}>
              All ({results.length})
            </button>
            {Object.entries(typeCounts).map(([type, count]) => (
              <button key={type} onClick={() => setTypeFilter(type === typeFilter ? 'all' : type)}
                style={{ padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: typeFilter === type ? '#0f172a' : '#f1f5f9', color: typeFilter === type ? 'white' : '#64748b', whiteSpace: 'nowrap' }}>
                {TYPE_LABELS[type]} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Empty state — no query */}
          {!query && (
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 10 }}>Recent Searches</p>
              {RECENT_SEARCHES.map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Clock size={14} color="#94a3b8" />
                  <span style={{ fontSize: 13.5, color: '#334155' }}>{s}</span>
                </button>
              ))}
              <div style={{ marginTop: 16, padding: '12px 10px', background: '#f8fafc', borderRadius: 10 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 8 }}>Quick Access</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'Properties with compliance issues', q: 'expired', icon: ShieldCheck, color: '#dc2626' },
                    { label: 'Emergency maintenance jobs', q: 'emergency', icon: Wrench, color: '#dc2626' },
                    { label: 'Tenants with arrears', q: 'arrears', icon: User, color: '#d97706' },
                    { label: 'Overdue tasks', q: 'overdue', icon: AlertTriangle, color: '#d97706' },
                  ].map(tip => (
                    <button key={tip.q} onClick={() => setQuery(tip.q)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <tip.icon size={13} color={tip.color} />
                      <span style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.3 }}>{tip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No results */}
          {query && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Search size={36} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>No results for "{query}"</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try searching by address, postcode, name or issue type</p>
            </div>
          )}

          {/* Grouped results */}
          {query && filtered.length > 0 && (
            <div>
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div style={{ padding: '10px 18px 4px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8' }}>{TYPE_LABELS[type]}</span>
                    <span style={{ fontSize: 10.5, color: '#cbd5e1', fontWeight: 600 }}>{items.length}</span>
                  </div>
                  {items.map((item, idx) => {
                    const globalIdx = flatFiltered.indexOf(item)
                    const isSelected = globalIdx === selected
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', padding: '10px 18px',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          background: isSelected ? '#f0fdf4' : 'white',
                          borderLeft: isSelected ? '3px solid #10b981' : '3px solid transparent',
                          transition: 'background 0.1s',
                        }}
                      >
                        {/* Icon */}
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={15} color={item.iconColor} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Highlight text={item.title} query={query} />
                            </p>
                            {item.badge && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: item.badge.bg, color: item.badge.color, flexShrink: 0 }}>
                                {item.badge.text}
                              </span>
                            )}
                            {item.alert && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                <AlertTriangle size={9} />{item.alert}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Highlight text={item.sub} query={query} />
                          </p>
                        </div>

                        <ChevronRight size={13} color={isSelected ? '#10b981' : '#cbd5e1'} style={{ flexShrink: 0 }} />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div style={{ padding: '8px 18px', borderTop: '1px solid #f8fafc', display: 'flex', gap: 14, background: '#fafafa' }}>
            {[['↑↓', 'Navigate'], ['↵', 'Open'], ['ESC', 'Close']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 5px', fontSize: 10.5, color: '#64748b', fontFamily: 'inherit' }}>{key}</kbd>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
              </div>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </>
  )
}

// Highlight matching text
function Highlight({ text, query }) {
  if (!text || !query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#d1fae5', color: '#065f46', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
