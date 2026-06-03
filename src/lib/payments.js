import { supabase, isConfigured } from './supabase'

const LOCAL_KEY = 'propertyops_payments'

// ─── Local storage helpers (demo mode) ───────────────────────────────────────
function localGet() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function localSet(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

// ─── Get all payments for a tenancy ──────────────────────────────────────────
export async function getPayments(tenancyId) {
  if (isConfigured) {
    const { data } = await supabase
      .from('rent_payments')
      .select('*')
      .eq('tenancy_id', tenancyId)
      .order('due_date', { ascending: false })
    return data || []
  }
  return localGet().filter(p => p.tenancy_id === tenancyId)
    .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
}

// ─── Get all payments (for dashboard/arrears) ─────────────────────────────────
export async function getAllPayments() {
  if (isConfigured) {
    const { data } = await supabase
      .from('rent_payments')
      .select('*')
      .order('due_date', { ascending: false })
    return data || []
  }
  return localGet()
}

// ─── Record a payment ────────────────────────────────────────────────────────
export async function recordPayment({ tenancyId, propertyAddress, dueDate, amountDue, amountPaid, status, notes = '' }) {
  const payment = {
    tenancy_id:       tenancyId,
    property_address: propertyAddress,
    due_date:         dueDate,
    amount_due:       amountDue,
    amount_paid:      amountPaid,
    status,           // 'received' | 'missed' | 'partial'
    payment_date:     status === 'received' ? new Date().toISOString() : null,
    notes,
    created_at:       new Date().toISOString(),
  }

  if (isConfigured) {
    // Upsert — one record per tenancy per month
    const { data, error } = await supabase
      .from('rent_payments')
      .upsert({ ...payment, id: `${tenancyId}_${dueDate}` }, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return data
  }

  // LocalStorage fallback
  const all = localGet()
  const key = `${tenancyId}_${dueDate}`
  const idx = all.findIndex(p => p.id === key)
  const record = { ...payment, id: key }
  if (idx >= 0) all[idx] = record
  else all.unshift(record)
  localSet(all)
  return record
}

// ─── Calculate arrears from payment history ───────────────────────────────────
export function calculateArrears(payments) {
  return payments
    .filter(p => p.status === 'missed' || p.status === 'partial')
    .reduce((sum, p) => sum + (p.amount_due - (p.amount_paid || 0)), 0)
}

// ─── Get current month due date ───────────────────────────────────────────────
export function getCurrentMonthDueDate(startDate) {
  const start = new Date(startDate)
  const now   = new Date()
  const due   = new Date(now.getFullYear(), now.getMonth(), start.getDate())
  return due.toISOString().split('T')[0]
}

// ─── Generate monthly payment schedule from tenancy start ────────────────────
export function generatePaymentSchedule(tenancy) {
  const start   = new Date(tenancy.startDate)
  const end     = new Date(tenancy.endDate)
  const today   = new Date()
  const months  = []

  let current = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  while (current <= today && current <= end) {
    months.push(current.toISOString().split('T')[0])
    current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate())
  }
  return months
}
