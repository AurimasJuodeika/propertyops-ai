/**
 * Rent Status Store — operational tracking only.
 * PropertyOps AI does NOT collect, process or hold rent payments.
 * This store records status, notes and reminders for agency operational use.
 */

import { TENANCIES, PROPERTIES } from '../data/mockData'
import { getNewProperties, getDeletedPropertyIds } from './propertyOverrides'

const KEY = 'propertyops_rent_statuses'

export const RENT_STATUSES = [
  { value: 'up_to_date',  label: 'Up to date',           color: '#10b981', bg: '#f0fdf4', badge: 'badge-green' },
  { value: 'due_soon',    label: 'Due soon',              color: '#2563eb', bg: '#eff6ff', badge: 'badge-blue' },
  { value: 'overdue',     label: 'Overdue',               color: '#dc2626', bg: '#fef2f2', badge: 'badge-red' },
  { value: 'part_paid',   label: 'Part-paid externally',  color: '#d97706', bg: '#fffbeb', badge: 'badge-amber' },
  { value: 'arrangement', label: 'Arrangement agreed',    color: '#7c3aed', bg: '#ede9fe', badge: 'badge-purple' },
  { value: 'escalated',   label: 'Escalated',             color: '#991b1b', bg: '#fef2f2', badge: 'badge-red' },
]

export function getStatusConfig(value) {
  return RENT_STATUSES.find(s => s.value === value) || RENT_STATUSES[0]
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function getAllRentStatuses() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(all) { localStorage.setItem(KEY, JSON.stringify(all)) }

function upsert(record) {
  const all = getAllRentStatuses()
  const idx = all.findIndex(r => r.id === record.id)
  if (idx >= 0) all[idx] = record
  else all.unshift(record)
  save(all)
  return record
}

// ── Get helpers ───────────────────────────────────────────────────────────────

export function getRentStatusByTenant(tenantId) {
  return getAllRentStatuses().find(r => r.tenantId === tenantId) || null
}

export function getRentStatusByTenancy(tenancyId) {
  return getAllRentStatuses().find(r => r.tenancyId === tenancyId) || null
}

export function getRentStatusByProperty(propertyId) {
  return getAllRentStatuses().find(r => r.propertyId === propertyId) || null
}

// Derive status from mock TENANCIES if no stored record exists
function deriveFromMock(tenancy) {
  if (!tenancy) return null
  const arrears = tenancy.arrears || 0
  return {
    id:                       `rs_mock_${tenancy.id}`,
    tenantId:                 tenancy.tenantId,
    tenancyId:                tenancy.id,
    propertyId:               tenancy.propertyId,
    landlordId:               PROPERTIES.find(p => p.id === tenancy.propertyId)?.landlordId || null,
    monthlyRent:              tenancy.monthlyRent,
    rentDueDay:               1,
    currentStatus:            arrears > 0 ? (arrears >= tenancy.monthlyRent * 3 ? 'escalated' : 'overdue') : 'up_to_date',
    arrearsAmount:            arrears,
    lastRecordedReceivedDate: tenancy.lastPaymentDate || null,
    lastRecordedAmount:       tenancy.lastPayment || null,
    receivedExternally:       false,
    externalMethod:           null,
    reference:                '',
    notes:                    '',
    reminderHistory:          [],
    noteHistory:              [],
    isMockDerived:            true,
    createdAt:                new Date().toISOString(),
    updatedAt:                new Date().toISOString(),
    updatedBy:                'System',
  }
}

// Primary read: stored > mock TENANCIES
export function getOrCreateRentStatus(tenantId, tenancyId, propertyId) {
  const stored = getAllRentStatuses().find(r =>
    r.tenantId === tenantId || r.tenancyId === tenancyId || r.propertyId === propertyId
  )
  if (stored) return stored

  const tenancy = TENANCIES.find(t => t.id === tenancyId || t.tenantId === tenantId || t.propertyId === propertyId)
  return deriveFromMock(tenancy)
}

// ── Write operations ──────────────────────────────────────────────────────────

export function initRentStatus({ tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay }) {
  const existing = getOrCreateRentStatus(tenantId, tenancyId, propertyId)
  if (existing && !existing.isMockDerived) return existing

  const record = {
    id:                       `rs_${Date.now()}`,
    tenantId, tenancyId, propertyId, landlordId,
    monthlyRent:              monthlyRent || 0,
    rentDueDay:               rentDueDay || 1,
    currentStatus:            existing?.currentStatus || 'up_to_date',
    arrearsAmount:            existing?.arrearsAmount || 0,
    lastRecordedReceivedDate: existing?.lastRecordedReceivedDate || null,
    lastRecordedAmount:       existing?.lastRecordedAmount || null,
    receivedExternally:       false,
    externalMethod:           null,
    reference:                '',
    notes:                    '',
    reminderHistory:          [],
    noteHistory:              [],
    createdAt:                new Date().toISOString(),
    updatedAt:                new Date().toISOString(),
    updatedBy:                'Staff',
  }
  return upsert(record)
}

export function recordRentReceivedExternally(statusId, { tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay }, {
  amount, dateReceived, method, reference, notes
}) {
  let record = getAllRentStatuses().find(r => r.id === statusId)
  if (!record) {
    record = initRentStatus({ tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay })
  }

  const wasFullPayment = Number(amount) >= (record.monthlyRent || 0)
  const newArrears     = wasFullPayment ? 0 : Math.max(0, (record.arrearsAmount || 0) - Number(amount))

  const updated = {
    ...record,
    lastRecordedReceivedDate: dateReceived,
    lastRecordedAmount:       Number(amount),
    receivedExternally:       true,
    externalMethod:           method,
    reference:                reference || '',
    currentStatus:            wasFullPayment ? 'up_to_date' : newArrears > 0 ? 'part_paid' : 'up_to_date',
    arrearsAmount:            newArrears,
    noteHistory:              [
      { text: `Rent recorded as received externally: £${Number(amount).toLocaleString()} via ${method}${reference ? ` (ref: ${reference})` : ''}${notes ? ` — ${notes}` : ''}`, date: new Date().toLocaleDateString('en-GB'), author: 'Staff', type: 'received' },
      ...(record.noteHistory || []),
    ],
    updatedAt:  new Date().toISOString(),
    updatedBy:  'Staff',
  }
  return upsert(updated)
}

export function updateRentStatus(statusId, { tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay }, {
  status, arrearsAmount, note
}) {
  let record = getAllRentStatuses().find(r => r.id === statusId)
  if (!record) {
    record = initRentStatus({ tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay })
  }
  const updated = {
    ...record,
    currentStatus: status,
    arrearsAmount: Number(arrearsAmount) || record.arrearsAmount || 0,
    noteHistory: note ? [
      { text: `Rent status updated to ${getStatusConfig(status).label}${note ? `: ${note}` : ''}`, date: new Date().toLocaleDateString('en-GB'), author: 'Staff', type: 'status' },
      ...(record.noteHistory || []),
    ] : record.noteHistory || [],
    updatedAt: new Date().toISOString(),
    updatedBy: 'Staff',
  }
  return upsert(updated)
}

export function addRentNote(statusId, { tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay }, noteText) {
  let record = getAllRentStatuses().find(r => r.id === statusId)
  if (!record) record = initRentStatus({ tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay })
  const updated = {
    ...record,
    noteHistory: [
      { text: noteText, date: new Date().toLocaleDateString('en-GB'), author: 'Staff', type: 'note' },
      ...(record.noteHistory || []),
    ],
    updatedAt: new Date().toISOString(),
  }
  return upsert(updated)
}

export function recordReminderSent(statusId, { tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay }) {
  let record = getAllRentStatuses().find(r => r.id === statusId)
  if (!record) record = initRentStatus({ tenantId, tenancyId, propertyId, landlordId, monthlyRent, rentDueDay })
  const updated = {
    ...record,
    reminderHistory: [
      { sentAt: new Date().toISOString(), sentBy: 'Staff', method: 'email' },
      ...(record.reminderHistory || []),
    ],
    noteHistory: [
      { text: 'Rent reminder sent — tenant asked to arrange payment through usual method', date: new Date().toLocaleDateString('en-GB'), author: 'Staff', type: 'reminder' },
      ...(record.noteHistory || []),
    ],
    updatedAt: new Date().toISOString(),
  }
  return upsert(updated)
}

// ── Summary ───────────────────────────────────────────────────────────────────

export function getArrearsSummary() {
  // Merge stored statuses + mock TENANCIES
  const deleted   = getDeletedPropertyIds()
  const allProps  = [...PROPERTIES, ...getNewProperties()].filter(p => !deleted.includes(p.id))
  const stored    = getAllRentStatuses()
  const covered   = new Set(stored.map(r => r.tenancyId).filter(Boolean))

  const results = [...stored]

  // Add mock tenancy derived statuses not covered by stored records
  TENANCIES.filter(t => !covered.has(t.id) && (t.arrears || 0) > 0).forEach(t => {
    const derived = deriveFromMock(t)
    if (derived) results.push(derived)
  })

  return {
    all:             results,
    overdue:         results.filter(r => r.currentStatus === 'overdue' || r.currentStatus === 'escalated'),
    arrangements:    results.filter(r => r.currentStatus === 'arrangement'),
    partPaid:        results.filter(r => r.currentStatus === 'part_paid'),
    totalArrears:    results.reduce((s, r) => s + (r.arrearsAmount || 0), 0),
    upToDate:        results.filter(r => r.currentStatus === 'up_to_date').length,
  }
}
