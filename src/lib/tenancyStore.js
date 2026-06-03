// Local tenancy store — demo/MVP state
// In production these would be Supabase rows

const KEY = 'propertyops_tenancies_v2'

export function getAllTenancies() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(all) { localStorage.setItem(KEY, JSON.stringify(all)) }

// ─── Get active tenancy for a property ───────────────────────────────────────
export function getTenancyForProperty(propertyId) {
  return getAllTenancies()
    .filter(t => t.propertyId === propertyId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null
}

// ─── Create tenancy ───────────────────────────────────────────────────────────
export function createTenancy({
  propertyId, tenantId, tenantName, tenantEmail, tenantPhone,
  tenancyType, startDate, endDate, monthlyRent, depositAmount,
  depositProtected, depositScheme, rentDueDay, notes,
}) {
  const tenancy = {
    id:               'ten_' + Date.now(),
    propertyId,
    tenantId:         tenantId || null,
    tenantName,
    tenantEmail,
    tenantPhone,
    tenancyType:      tenancyType || 'AST',
    startDate,
    endDate,
    monthlyRent:      Number(monthlyRent),
    depositAmount:    depositAmount ? Number(depositAmount) : 0,
    depositProtected: depositProtected || 'pending',
    depositScheme:    depositScheme || 'DPS',
    rentDueDay:       Number(rentDueDay) || 1,
    notes:            notes || '',
    status:           'active',
    arrears:          0,
    lastPaymentDate:  null,
    renewalOffered:   false,
    createdAt:        new Date().toISOString(),
    updatedAt:        new Date().toISOString(),
  }
  const all = getAllTenancies()
  // End any previous active tenancy for this property
  all.forEach(t => { if (t.propertyId === propertyId && t.status === 'active') t.status = 'superseded' })
  all.unshift(tenancy)
  save(all)
  return tenancy
}

// ─── Update tenancy ───────────────────────────────────────────────────────────
export function updateTenancy(id, updates) {
  const all = getAllTenancies()
  const idx = all.findIndex(t => t.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
  save(all)
  return all[idx]
}

// ─── End tenancy ──────────────────────────────────────────────────────────────
export function endTenancy(id, { endDate, reason }) {
  return updateTenancy(id, { status: 'ended', endDate, endReason: reason })
}

// ─── Computed status ──────────────────────────────────────────────────────────
export function getTenancyStatus(tenancy) {
  if (!tenancy || tenancy.status === 'ended' || tenancy.status === 'superseded') return 'ended'
  const end   = new Date(tenancy.endDate)
  const now   = new Date()
  const days  = Math.round((end - now) / (1000 * 60 * 60 * 24))
  if (end < now)    return 'expired'
  if (days <= 90)   return 'ending_soon'
  return 'active'
}

export function getDaysToEnd(tenancy) {
  if (!tenancy?.endDate) return null
  return Math.round((new Date(tenancy.endDate) - new Date()) / (1000 * 60 * 60 * 24))
}
