// Task Store — localStorage backed demo tasks
// Merges with mock TASKS from mockData for display

const KEY = 'propertyops_tasks_v2'

export const CATEGORIES = ['Compliance', 'Inspection', 'Maintenance', 'Rent', 'Document', 'Tenancy', 'General']
export const PRIORITIES  = ['low', 'medium', 'high', 'critical']
export const STATUSES    = ['open', 'in_progress', 'waiting', 'completed', 'cancelled']

export const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: '#64748b', bg: '#f8fafc',  dot: '#94a3b8' },
  medium:   { label: 'Medium',   color: '#2563eb', bg: '#eff6ff',  dot: '#3b82f6' },
  high:     { label: 'High',     color: '#d97706', bg: '#fffbeb',  dot: '#f59e0b' },
  critical: { label: 'Critical', color: '#dc2626', bg: '#fef2f2',  dot: '#ef4444' },
}

export const STATUS_CONFIG = {
  open:        { label: 'Open',        class: 'badge-blue'   },
  in_progress: { label: 'In Progress', class: 'badge-purple' },
  waiting:     { label: 'Waiting',     class: 'badge-amber'  },
  completed:   { label: 'Completed',   class: 'badge-green'  },
  cancelled:   { label: 'Cancelled',   class: 'badge-slate'  },
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function getAllStoredTasks() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(tasks) {
  localStorage.setItem(KEY, JSON.stringify(tasks))
}

export function createTask({
  title, propertyId, propertyAddress, tenantId, tenantName,
  landlordId, landlordName, category, priority, assignedTo,
  assignedName, dueDate, notes, source = 'manual',
}) {
  const task = {
    id:              'tk_' + Date.now(),
    title,
    propertyId:      propertyId || null,
    propertyAddress: propertyAddress || null,
    tenantId:        tenantId || null,
    tenantName:      tenantName || null,
    landlordId:      landlordId || null,
    landlordName:    landlordName || null,
    category:        category || 'General',
    priority:        priority || 'medium',
    assignedTo:      assignedTo || null,
    assignedName:    assignedName || null,
    dueDate:         dueDate || null,
    notes:           notes || '',
    status:          'open',
    source,
    activityNotes:   [],
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  }
  const all = getAllStoredTasks()
  all.unshift(task)
  save(all)
  return task
}

export function updateTask(id, updates) {
  const all = getAllStoredTasks()
  const idx = all.findIndex(t => t.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
  save(all)
  return all[idx]
}

export function deleteTask(id) {
  save(getAllStoredTasks().filter(t => t.id !== id))
}

export function addTaskNote(id, { text, author = 'Sarah Mitchell' }) {
  const all  = getAllStoredTasks()
  const idx  = all.findIndex(t => t.id === id)
  if (idx < 0) return
  const note = { text, author, date: new Date().toLocaleDateString('en-GB'), time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), ts: new Date().toISOString() }
  all[idx].activityNotes = [note, ...(all[idx].activityNotes || [])]
  all[idx].updatedAt = new Date().toISOString()
  save(all)
  return note
}

// ── Workflow Scan ─────────────────────────────────────────────────────────────

export function runWorkflowScan(properties, tenancies, maintenanceJobs, inspections) {
  const suggestions = []
  const today = new Date()
  const in30  = new Date(today.getTime() + 30  * 24 * 60 * 60 * 1000)
  const in90  = new Date(today.getTime() + 90  * 24 * 60 * 60 * 1000)

  const CERT_LABELS = {
    gasSafety: 'Gas Safety Certificate', eicr: 'EICR', epc: 'EPC',
    smokeAlarm: 'Smoke Alarm Check', depositProtection: 'Deposit Protection',
    rightToRent: 'Right to Rent',
  }

  properties.forEach(p => {
    if (!p.compliance) return
    Object.entries(p.compliance).forEach(([key, cert]) => {
      if (!cert || cert.status === 'n/a') return
      const label = CERT_LABELS[key] || key
      if (['expired', 'not_verified', 'overdue'].includes(cert.status)) {
        suggestions.push({
          type: 'critical', category: 'Compliance',
          title: `${label} expired — ${p.address}`,
          detail: `Expired certificate at ${p.address}, ${p.postcode}. Immediate action required.`,
          propertyId: p.id, propertyAddress: `${p.address}, ${p.postcode}`,
          priority: 'critical', dueDate: today.toISOString().split('T')[0],
        })
      } else if (cert.status === 'expiring_soon' && cert.expiry) {
        const expiry = new Date(cert.expiry)
        const days   = Math.round((expiry - today) / (1000 * 60 * 60 * 24))
        if (days <= 30) {
          suggestions.push({
            type: 'warning', category: 'Compliance',
            title: `${label} expiring in ${days} days — ${p.address}`,
            detail: `Expires ${expiry.toLocaleDateString('en-GB')}. Book renewal now.`,
            propertyId: p.id, propertyAddress: `${p.address}, ${p.postcode}`,
            priority: days <= 14 ? 'high' : 'medium',
            dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          })
        }
      }
    })
  })

  // Overdue inspections
  inspections.filter(i => i.status === 'overdue').forEach(i => {
    suggestions.push({
      type: 'warning', category: 'Inspection',
      title: `Inspection overdue — ${i.address?.split(',')[0]}`,
      detail: `${i.type} inspection was due ${i.scheduledDate}. ${i.tenantName} — access not confirmed.`,
      propertyId: i.propertyId, propertyAddress: i.address,
      priority: 'high',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  })

  // Maintenance stuck on_hold
  maintenanceJobs.filter(j => j.status === 'on_hold').forEach(j => {
    const prop = properties.find(p => p.id === j.propertyId)
    suggestions.push({
      type: 'warning', category: 'Maintenance',
      title: `Maintenance on hold — chase response (${j.title})`,
      detail: `Job at ${prop?.address || j.propertyId} is awaiting landlord approval. ${j.aiTriage || ''}`,
      propertyId: j.propertyId, propertyAddress: prop ? `${prop.address}, ${prop.postcode}` : '',
      priority: j.priority === 'emergency' ? 'critical' : 'high',
      dueDate: today.toISOString().split('T')[0],
    })
  })

  // Void properties
  properties.filter(p => p.status === 'void').forEach(p => {
    suggestions.push({
      type: 'info', category: 'Tenancy',
      title: `Void property — market to let (${p.address})`,
      detail: `${p.address} is currently void. No active tenancy. Consider marketing to minimise void period.`,
      propertyId: p.id, propertyAddress: `${p.address}, ${p.postcode}`,
      priority: 'medium',
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  })

  // Tenancies ending soon
  tenancies.filter(t => {
    if (!t.endDate || t.status === 'ended') return false
    const end  = new Date(t.endDate)
    const days = Math.round((end - today) / (1000 * 60 * 60 * 24))
    return days > 0 && days <= 90
  }).forEach(t => {
    const prop = properties.find(p => p.id === t.propertyId)
    const days = Math.round((new Date(t.endDate) - today) / (1000 * 60 * 60 * 24))
    suggestions.push({
      type: 'info', category: 'Tenancy',
      title: `Tenancy ending in ${days} days — send renewal offer`,
      detail: `${t.tenantName || 'Tenant'} at ${prop?.address || t.propertyId}. End date: ${new Date(t.endDate).toLocaleDateString('en-GB')}.`,
      propertyId: t.propertyId, propertyAddress: prop ? `${prop.address}, ${prop.postcode}` : '',
      priority: days <= 30 ? 'high' : 'medium',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  })

  // Rent arrears
  tenancies.filter(t => (t.arrears || 0) > 0).forEach(t => {
    const prop    = properties.find(p => p.id === t.propertyId)
    const months  = Math.round((t.arrears || 0) / (t.monthlyRent || 1))
    suggestions.push({
      type: months >= 3 ? 'critical' : 'warning', category: 'Rent',
      title: `Rent arrears — ${t.tenantName || 'Tenant'} (£${(t.arrears||0).toLocaleString()})`,
      detail: `${months} month(s) overdue at ${prop?.address || t.propertyId}. ${months >= 3 ? 'Consider Section 8 proceedings.' : 'Send formal notice.'}`,
      propertyId: t.propertyId, propertyAddress: prop ? `${prop.address}, ${prop.postcode}` : '',
      priority: months >= 3 ? 'critical' : 'high',
      dueDate: today.toISOString().split('T')[0],
    })
  })

  // Deduplicate by title prefix
  const seen = new Set()
  return suggestions.filter(s => {
    const key = s.title.slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
