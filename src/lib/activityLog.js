// Per-property activity log — localStorage backed

const KEY = (propertyId) => `propertyops_activity_${propertyId}`

export function getActivityLog(propertyId) {
  try { return JSON.parse(localStorage.getItem(KEY(propertyId)) || '[]') } catch { return [] }
}

export function addActivityEntry(propertyId, { type, text, author = 'Sarah Mitchell' }) {
  const entry = {
    id:     Date.now(),
    type,   // 'tenancy' | 'maintenance' | 'compliance' | 'note' | 'inspection' | 'document'
    text,
    author,
    date:   new Date().toLocaleDateString('en-GB'),
    time:   new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    ts:     new Date().toISOString(),
  }
  const all = getActivityLog(propertyId)
  all.unshift(entry)
  localStorage.setItem(KEY(propertyId), JSON.stringify(all.slice(0, 50))) // keep last 50
  return entry
}

// Seed realistic initial entries for demo properties
export function getSeedEntries(property, tenancy) {
  const entries = []

  if (tenancy?.createdAt) {
    entries.push({
      id: 1, type: 'tenancy',
      text: `Tenancy created for ${tenancy.tenantName || 'tenant'}, starting ${new Date(tenancy.startDate).toLocaleDateString('en-GB')}`,
      author: 'System', date: new Date(tenancy.createdAt).toLocaleDateString('en-GB'), time: '09:00'
    })
  }

  if (property.lastInspection) {
    entries.push({
      id: 2, type: 'inspection',
      text: `Mid-tenancy inspection completed. Property in ${property.compliance?.smokeAlarm?.status === 'valid' ? 'satisfactory' : 'mixed'} condition.`,
      author: 'Ryan Blake', date: new Date(property.lastInspection).toLocaleDateString('en-GB'), time: '14:30'
    })
  }

  return entries
}

const TYPE_ICON = {
  tenancy:     '📋',
  maintenance: '🔧',
  compliance:  '🛡️',
  note:        '💬',
  inspection:  '🏠',
  document:    '📄',
  renewal:     '🔄',
}

export { TYPE_ICON }
