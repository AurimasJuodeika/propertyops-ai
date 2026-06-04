// Unified Tenant Store
// Merges: TENANTS mock + getCustomTenants() + localStorage overrides/additions

import { TENANTS, TENANCIES, MAINTENANCE_JOBS, PROPERTIES } from '../data/mockData'
import { getCustomTenants, createCustomTenant, getNewProperties, getDeletedPropertyIds, getAssignedTenantId } from './propertyOverrides'
// tenancyStore import removed — not needed

// ── Storage keys ──────────────────────────────────────────────────────────────
const OVERRIDES_KEY = 'propertyops_tenant_overrides'
const ARCHIVED_KEY  = 'propertyops_tenant_archived'
const ACTIVITY_KEY  = (id) => `propertyops_tenant_activity_${id}`

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTenantOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}') } catch { return {} }
}

export function getArchivedTenantIds() {
  try { return JSON.parse(localStorage.getItem(ARCHIVED_KEY) || '[]') } catch { return [] }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function getAllTenants({ includeArchived = false } = {}) {
  const overrides = getTenantOverrides()
  const archived  = getArchivedTenantIds()
  const custom    = getCustomTenants()

  const all = [
    ...TENANTS.map(t => ({ ...t, ...overrides[t.id], isDemo: true })),
    ...custom.map(t  => ({ ...t, ...overrides[t.id], isCustom: true })),
  ]

  // Deduplicate by id
  const seen = new Set()
  const deduped = all.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })

  return includeArchived ? deduped : deduped.filter(t => !archived.includes(t.id))
}

export function getTenantById(id) {
  if (!id) return null
  return getAllTenants({ includeArchived: true }).find(t => t.id === id) || null
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function createTenant(data) {
  const tenant = createCustomTenant(data)
  addTenantActivity(tenant.id, { type: 'created', text: `Tenant created: ${tenant.name}` })
  return tenant
}

export function updateTenant(id, updates) {
  // Field overrides — works for all tenant types
  const all = getTenantOverrides()
  all[id] = { ...all[id], ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all))

  // Also update custom tenant store if applicable
  const custom = getCustomTenants()
  const idx    = custom.findIndex(t => t.id === id)
  if (idx >= 0) {
    custom[idx] = { ...custom[idx], ...updates }
    localStorage.setItem('propertyops_custom_tenants', JSON.stringify(custom))
  }

  addTenantActivity(id, { type: 'edited', text: 'Tenant details updated' })
  return getTenantById(id)
}

export function archiveTenant(id) {
  const archived = getArchivedTenantIds()
  if (!archived.includes(id)) {
    archived.push(id)
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify(archived))
  }
  addTenantActivity(id, { type: 'archived', text: 'Tenant archived' })
}

export function unarchiveTenant(id) {
  localStorage.setItem(ARCHIVED_KEY, JSON.stringify(getArchivedTenantIds().filter(x => x !== id)))
  addTenantActivity(id, { type: 'restored', text: 'Tenant restored from archive' })
}

// ── Activity log ──────────────────────────────────────────────────────────────

export function getTenantActivityLog(id) {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY(id)) || '[]') } catch { return [] }
}

export function addTenantActivity(id, { type, text, author = 'Sarah Mitchell' }) {
  const entry = {
    id: Date.now() + Math.random(), type, text, author,
    date: new Date().toLocaleDateString('en-GB'),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    ts: new Date().toISOString(),
  }
  const log = getTenantActivityLog(id)
  log.unshift(entry)
  localStorage.setItem(ACTIVITY_KEY(id), JSON.stringify(log.slice(0, 100)))
  return entry
}

export function addTenantNote(id, text, author = 'Sarah Mitchell') {
  return addTenantActivity(id, { type: 'note', text, author })
}

// ── Portfolio helpers ─────────────────────────────────────────────────────────

export function getTenantProperty(tenantId) {
  const deleted = getDeletedPropertyIds()
  const allProps = [...PROPERTIES, ...getNewProperties()].filter(p => !deleted.includes(p.id))
  // Check assignment override first, then tenantId on property
  return allProps.find(p => getAssignedTenantId(p.id) === tenantId || p.tenantId === tenantId) || null
}

export function getTenantTenancies(tenantId) {
  // From mock TENANCIES
  const fromMock = TENANCIES.filter(t => t.tenantId === tenantId)
  // From tenancyStore localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('propertyops_tenancies_v2') || '[]')
    const fromStore = stored.filter(t => t.tenantId === tenantId || t.tenantName === getTenantById(tenantId)?.name)
    const all = [...fromStore, ...fromMock]
    const seen = new Set()
    return all.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
  } catch { return fromMock }
}

export function getActiveTenancy(tenantId) {
  const tenancies = getTenantTenancies(tenantId)
  return tenancies.find(t => t.status === 'active' || t.status === 'ending_soon') ||
         tenancies.find(t => t.status !== 'ended' && t.status !== 'cancelled') ||
         tenancies[0] || null
}

export function getTenantMaintenance(tenantId) {
  const tenant = getTenantById(tenantId)
  const prop   = getTenantProperty(tenantId)
  return MAINTENANCE_JOBS.filter(j =>
    j.tenantName === tenant?.name ||
    (prop && j.propertyId === prop.id)
  )
}

export function getTenantStatus(tenantId) {
  const archived = getArchivedTenantIds()
  if (archived.includes(tenantId)) return 'archived'
  const tenancy = getActiveTenancy(tenantId)
  if (!tenancy) return 'active'
  if ((tenancy.arrears || 0) > 0) return 'arrears'
  if (tenancy.status === 'ending_soon') return 'ending_soon'
  if (tenancy.status === 'expired') return 'ending_soon'
  return 'active'
}

export function getTenantStats(tenantId) {
  const tenancy   = getActiveTenancy(tenantId)
  const maintenance = getTenantMaintenance(tenantId)
  return {
    monthlyRent:    tenancy?.monthlyRent || 0,
    arrears:        tenancy?.arrears || 0,
    depositAmount:  tenancy?.depositAmount || 0,
    openMaintenance:maintenance.filter(j => j.status !== 'completed').length,
    hasEndingTenancy: tenancy?.status === 'ending_soon' || tenancy?.status === 'expired',
    daysToEnd: tenancy?.endDate ? Math.round((new Date(tenancy.endDate) - new Date()) / (1000*60*60*24)) : null,
  }
}

export const TENANT_ACTIVITY_ICONS = {
  created: '👤', edited: '✏️', archived: '📦', restored: '✅',
  note: '💬', email: '📧', payment: '💷', maintenance: '🔧',
  tenancy: '📋', document: '📄', renewal: '🔄', default: '📝',
}

// ── Demo payment history ──────────────────────────────────────────────────────

export function getDemoPaymentHistory(tenancy) {
  if (!tenancy) return []
  const history = []
  const start = new Date(tenancy.startDate || Date.now())
  const today = new Date()
  let d = new Date(start)
  let month = 0
  while (d <= today && month < 12) {
    const arrearMonths = Math.round((tenancy.arrears || 0) / (tenancy.monthlyRent || 1))
    const isPaid = month < (12 - arrearMonths)
    history.unshift({
      month: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      amount: tenancy.monthlyRent || 0,
      status: isPaid ? 'paid' : 'missed',
      date: isPaid ? new Date(d.getFullYear(), d.getMonth(), tenancy.rentDueDay || 1).toLocaleDateString('en-GB') : null,
    })
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    month++
  }
  return history.slice(0, 8)
}
