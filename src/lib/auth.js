import { supabase, isConfigured } from './supabase'

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp({ email, password, fullName, agencyName, role = 'agency_owner' }) {
  if (!isConfigured) throw new Error('Supabase not configured. Add credentials to .env')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, agency_name: agencyName, role },
    },
  })
  if (error) throw error
  return data
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  if (!isConfigured) throw new Error('Supabase not configured. Add credentials to .env')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut() {
  if (!isConfigured) return
  await supabase.auth.signOut()
}

// ─── Get Session ─────────────────────────────────────────────────────────────
export async function getSession() {
  if (!isConfigured) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export async function resetPassword(email) {
  if (!isConfigured) throw new Error('Supabase not configured.')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

// ─── Get Profile ──────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  if (!isConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('propertyops_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

// ─── Update Profile ───────────────────────────────────────────────────────────
export async function updateProfile(userId, updates) {
  if (!isConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('propertyops_profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Upsert Profile (called after sign up) ────────────────────────────────────
export async function upsertProfile(userId, { email, fullName, agencyName, role, branch }) {
  if (!isConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('propertyops_profiles')
    .upsert({
      id:          userId,
      email,
      full_name:   fullName,
      agency_name: agencyName || 'My Agency',
      role:        role || 'agency_owner',
      branch:      branch || 'All Branches',
      updated_at:  new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}
