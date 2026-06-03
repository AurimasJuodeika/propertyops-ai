// Unified Landlord Store
// Merges: LANDLORDS mock + Birmingham + getCustomLandlords() + localStorage overrides/additions

import { LANDLORDS } from '../data/mockData'
import { getCustomLandlords, addCustomLandlord, getNewProperties, getDeletedPropertyIds } from './propertyOverrides'
import { PROPERTIES, MAINTENANCE_JOBS } from '../data/mockData'

const OVERRIDES_KEY  = 'propertyops_landlord_overrides'  // field overrides for mock landlords
const ARCHIVED_KEY   = 'propertyops_landlord_archived'
const ACTIVITY_KEY   = (id) => `propertyops_landlord_activity_${id}`

// ─── Read helpers ─────────────────────────────────────────────────────────────

export function getLandlordOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}') } catch { return {} }
}

export function getArchivedLandlordIds() {
  try { return JSON.parse(localStorage.getItem(ARCHIVED_KEY) || '[]') } catch { return [] }
}

// Merge base landlord + field overrides
function applyOverrides(landlord) {
  const overrides = getLandlordOverrides()[landlord.id] || {}
  return { ...landlord, ...overrides }
}

// All landlords unified — mock + Birmingham (already in LANDLORDS) + custom
export function getAllLandlords({ includeArchived = false } = {}) {
  const archived  = getArchivedLandlordIds()
  const overrides = getLandlordOverrides()
  const custom    = getCustomLandlords()

  const all = [
    ...LANDLORDS.map(l => ({ ...l, ...overrides[l.id], isDemo: true })),
    ...custom.map(l   => ({ ...l, ...overrides[l.id], isCustom: true })),
  ]

  return includeArchived ? all : all.filter(l => !archived.includes(l.id))
}

export function getLandlordById(id) {
  return getAllLandlords({ includeArchived: true }).find(l => l.id === id) || null
}

// ─── Write helpers ────────────────────────────────────────────────────────────

export function createLandlord(data) {
  const landlord = addCustomLandlord({
    ...data,
    managementFee: Number(data.managementFee) || 10,
    balance: 0,
    rating: 5,
    statementFrequency: 'monthly',
  })
  addLandlordActivity(landlord.id, { type: 'created', text: `Landlord created: ${landlord.name}` })
  return landlord
}

export function updateLandlord(id, updates) {
  // For all landlords (mock or custom) we store field overrides in localStorage
  const all = getLandlordOverrides()
  all[id] = { ...all[id], ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all))

  // Also update the custom landlords store if it's a custom landlord
  const custom = getCustomLandlords()
  const idx    = custom.findIndex(l => l.id === id)
  if (idx >= 0) {
    custom[idx] = { ...custom[idx], ...updates }
    localStorage.setItem('propertyops_custom_landlords', JSON.stringify(custom))
  }

  addLandlordActivity(id, { type: 'edited', text: 'Landlord details updated' })
  return getLandlordById(id)
}

export function archiveLandlord(id) {
  const archived = getArchivedLandlordIds()
  if (!archived.includes(id)) {
    archived.push(id)
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify(archived))
  }
  addLandlordActivity(id, { type: 'archived', text: 'Landlord archived' })
}

export function unarchiveLandlord(id) {
  const archived = getArchivedLandlordIds().filter(x => x !== id)
  localStorage.setItem(ARCHIVED_KEY, JSON.stringify(archived))
  addLandlordActivity(id, { type: 'restored', text: 'Landlord restored from archive' })
}

// ─── Activity log ─────────────────────────────────────────────────────────────

export function getLandlordActivityLog(id) {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY(id)) || '[]') } catch { return [] }
}

export function addLandlordActivity(id, { type, text, author = 'Sarah Mitchell' }) {
  const entry = {
    id:   Date.now() + Math.random(),
    type, text, author,
    date: new Date().toLocaleDateString('en-GB'),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    ts:   new Date().toISOString(),
  }
  const log = getLandlordActivityLog(id)
  log.unshift(entry)
  localStorage.setItem(ACTIVITY_KEY(id), JSON.stringify(log.slice(0, 100)))
  return entry
}

// ─── Portfolio helpers ────────────────────────────────────────────────────────

export function getLandlordProperties(landlordId) {
  const deleted = getDeletedPropertyIds()
  return [...PROPERTIES, ...getNewProperties()]
    .filter(p => p.landlordId === landlordId && !deleted.includes(p.id))
}

export function getLandlordMaintenance(landlordId) {
  const props = getLandlordProperties(landlordId)
  return MAINTENANCE_JOBS.filter(j => props.some(p => p.id === j.propertyId))
}

export function getLandlordComplianceIssues(landlordId) {
  const props  = getLandlordProperties(landlordId)
  const issues = []
  const CERT_LABELS = {
    gasSafety: 'Gas Safety', eicr: 'EICR', epc: 'EPC',
    smokeAlarm: 'Smoke Alarm', depositProtection: 'Deposit', rightToRent: 'Right to Rent',
  }
  props.forEach(p => {
    if (!p.compliance) return
    Object.entries(p.compliance).forEach(([key, cert]) => {
      if (!cert || cert.status === 'n/a' || cert.status === 'valid') return
      issues.push({
        propertyId: p.id, address: p.address, postcode: p.postcode,
        cert: CERT_LABELS[key] || key, status: cert.status,
        expiry: cert.expiry || null,
        isCritical: ['expired','missing','not_verified','overdue'].includes(cert.status),
      })
    })
  })
  return issues.sort((a, b) => (a.isCritical ? -1 : 1))
}

export function getLandlordStats(landlordId) {
  const props       = getLandlordProperties(landlordId)
  const maintenance = getLandlordMaintenance(landlordId)
  const compIssues  = getLandlordComplianceIssues(landlordId)
  return {
    totalProperties:   props.length,
    letProperties:     props.filter(p => p.status === 'let').length,
    voidProperties:    props.filter(p => p.status === 'void').length,
    totalRent:         props.reduce((s, p) => s + (p.rent || 0), 0),
    openMaintenance:   maintenance.filter(j => j.status !== 'completed').length,
    complianceIssues:  compIssues.length,
    criticalCompliance:compIssues.filter(i => i.isCritical).length,
  }
}

// ─── Status helper ────────────────────────────────────────────────────────────

export function getLandlordStatus(landlordId) {
  const archived = getArchivedLandlordIds()
  if (archived.includes(landlordId)) return 'archived'
  const stats = getLandlordStats(landlordId)
  if (stats.criticalCompliance > 0 || stats.openMaintenance > 2) return 'attention'
  return 'active'
}

export const ACTIVITY_ICONS = {
  created:   '🏢', edited: '✏️', archived: '📦', restored: '✅',
  property:  '🏠', note: '💬', email: '📧', statement: '📋',
  maintenance: '🔧', compliance: '🛡️', default: '📝',
}
