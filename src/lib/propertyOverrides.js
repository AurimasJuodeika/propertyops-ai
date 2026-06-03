// LocalStorage-backed overrides for properties
// In production these would be Supabase writes

// ─── Get effective rent (override takes priority over mock data) ──────────────
export function getEffectiveRent(property) {
  const overrides = getPropertyOverrides()
  return overrides[property.id]?.rent ?? property.rent
}

// ─── Get effective property (merges all field overrides) ─────────────────────
export function getEffectiveProperty(property) {
  const overrides = getPropertyOverrides()
  const o = overrides[property.id] || {}
  return {
    ...property,
    ...(o.address    ? { address:    o.address    } : {}),
    ...(o.city       ? { city:       o.city       } : {}),
    ...(o.postcode   ? { postcode:   o.postcode   } : {}),
    ...(o.type       ? { type:       o.type       } : {}),
    ...(o.bedrooms   ? { bedrooms:   o.bedrooms   } : {}),
    ...(o.bathrooms  ? { bathrooms:  o.bathrooms  } : {}),
    ...(o.status     ? { status:     o.status     } : {}),
    ...(o.branch     ? { branch:     o.branch     } : {}),
    ...(o.managementType ? { managementType: o.managementType } : {}),
    ...(o.landlordId ? { landlordId: o.landlordId } : {}),
    rent: getEffectiveRent(property),
  }
}

// ─── Soft-delete a property ───────────────────────────────────────────────────
const DELETED_KEY = 'propertyops_deleted_properties'
export function getDeletedPropertyIds() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]') } catch { return [] }
}
export function deleteProperty(propertyId) {
  const all = getDeletedPropertyIds()
  if (!all.includes(propertyId)) {
    all.push(propertyId)
    localStorage.setItem(DELETED_KEY, JSON.stringify(all))
  }
}
export function restoreProperty(propertyId) {
  const all = getDeletedPropertyIds().filter(id => id !== propertyId)
  localStorage.setItem(DELETED_KEY, JSON.stringify(all))
}

// ─── Get rent history for a property ─────────────────────────────────────────
export function getRentHistory(propertyId) {
  const overrides = getPropertyOverrides()
  return overrides[propertyId]?.rentHistory || []
}

const PROPS_KEY    = 'propertyops_property_overrides'
const LANDLORD_KEY = 'propertyops_landlord_overrides'

// ─── Property overrides (rent changes etc) ────────────────────────────────────
export function getPropertyOverrides() {
  try { return JSON.parse(localStorage.getItem(PROPS_KEY) || '{}') } catch { return {} }
}
export function setPropertyOverride(propertyId, data) {
  const all = getPropertyOverrides()
  all[propertyId] = { ...all[propertyId], ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(PROPS_KEY, JSON.stringify(all))
  return all[propertyId]
}
export function removePropertyOverride(propertyId) {
  const all = getPropertyOverrides()
  delete all[propertyId]
  localStorage.setItem(PROPS_KEY, JSON.stringify(all))
}

// ─── Landlord overrides (portfolio changes, new properties) ───────────────────
export function getLandlordOverrides() {
  try { return JSON.parse(localStorage.getItem(LANDLORD_KEY) || '{}') } catch { return {} }
}
export function setLandlordOverride(landlordId, data) {
  const all = getLandlordOverrides()
  all[landlordId] = { ...all[landlordId], ...data }
  localStorage.setItem(LANDLORD_KEY, JSON.stringify(all))
}

// ─── Maintenance job status overrides ────────────────────────────────────────
const JOB_STATUS_KEY = 'propertyops_job_statuses'
export function getJobStatuses() {
  try { return JSON.parse(localStorage.getItem(JOB_STATUS_KEY) || '{}') } catch { return {} }
}
export function setJobStatus(jobId, status, notes = '') {
  const all = getJobStatuses()
  all[jobId] = { status, notes, updatedAt: new Date().toISOString() }
  localStorage.setItem(JOB_STATUS_KEY, JSON.stringify(all))
}
export function getEffectiveJobStatus(job) {
  const overrides = getJobStatuses()
  return overrides[job.id]?.status ?? job.status
}

// ─── Inspection overrides ─────────────────────────────────────────────────────
const INSPECTION_KEY = 'propertyops_inspection_overrides'
export function getInspectionOverrides() {
  try { return JSON.parse(localStorage.getItem(INSPECTION_KEY) || '{}') } catch { return {} }
}
export function setInspectionOverride(id, data) {
  const all = getInspectionOverrides()
  all[id] = { ...all[id], ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(INSPECTION_KEY, JSON.stringify(all))
}

// ─── Custom landlords ─────────────────────────────────────────────────────────
const CUSTOM_LANDLORDS_KEY = 'propertyops_custom_landlords'
export function getCustomLandlords() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_LANDLORDS_KEY) || '[]') } catch { return [] }
}
export function addCustomLandlord(landlord) {
  const all = getCustomLandlords()
  const newL = {
    ...landlord,
    id: 'cl_' + Date.now(),
    isCustom: true,
    properties: [],
    balance: 0,
    rating: 5,
    statementFrequency: 'monthly',
    preferredContact: 'email',
    createdAt: new Date().toISOString(),
  }
  all.unshift(newL)
  localStorage.setItem(CUSTOM_LANDLORDS_KEY, JSON.stringify(all))
  return newL
}
export function updateCustomLandlord(id, updates) {
  const all = getCustomLandlords().map(l => l.id === id ? { ...l, ...updates } : l)
  localStorage.setItem(CUSTOM_LANDLORDS_KEY, JSON.stringify(all))
}

// ─── Tenant overrides per property ───────────────────────────────────────────
const TENANT_ASSIGN_KEY = 'propertyops_tenant_assignments'
export function getTenantAssignments() {
  try { return JSON.parse(localStorage.getItem(TENANT_ASSIGN_KEY) || '{}') } catch { return {} }
}
export function assignTenantToProperty(propertyId, tenantId) {
  const all = getTenantAssignments()
  all[propertyId] = tenantId
  localStorage.setItem(TENANT_ASSIGN_KEY, JSON.stringify(all))
}
export function getAssignedTenantId(propertyId) {
  return getTenantAssignments()[propertyId] || null
}

// ─── Custom tenants created by users ─────────────────────────────────────────
const CUSTOM_TENANTS_KEY = 'propertyops_custom_tenants'
export function getCustomTenants() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TENANTS_KEY) || '[]') } catch { return [] }
}
export function createCustomTenant(tenant) {
  const all  = getCustomTenants()
  const newT = { ...tenant, id: 'ct_' + Date.now(), isCustom: true, rtRVerified: false, rtRExpiry: null }
  all.unshift(newT)
  localStorage.setItem(CUSTOM_TENANTS_KEY, JSON.stringify(all))
  return newT
}

// ─── New properties added by users ───────────────────────────────────────────
const NEW_PROPS_KEY = 'propertyops_new_properties'
export function getNewProperties() {
  try { return JSON.parse(localStorage.getItem(NEW_PROPS_KEY) || '[]') } catch { return [] }
}
export function addNewProperty(property) {
  const all = getNewProperties()
  const newProp = { ...property, id: 'new_' + Date.now(), isNew: true, createdAt: new Date().toISOString() }
  all.unshift(newProp)
  localStorage.setItem(NEW_PROPS_KEY, JSON.stringify(all))
  return newProp
}
export function removeNewProperty(id) {
  const all = getNewProperties().filter(p => p.id !== id)
  localStorage.setItem(NEW_PROPS_KEY, JSON.stringify(all))
}
