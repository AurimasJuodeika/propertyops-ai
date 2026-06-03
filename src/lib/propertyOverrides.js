// LocalStorage-backed overrides for properties
// In production these would be Supabase writes

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
