import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { getProfile } from '../lib/auth'

const AuthContext = createContext(null)

// Map Supabase user + profile → the shape the rest of the app expects
function buildAppUser(supaUser, profile) {
  const meta      = supaUser?.user_metadata || {}
  const role      = profile?.role        || meta.role        || 'agency_owner'
  const branch    = profile?.branch      || 'All Branches'
  const fullName  = profile?.full_name   || meta.full_name   || supaUser?.email?.split('@')[0] || 'User'
  const agencyName= profile?.agency_name || meta.agency_name || 'My Agency'

  const ROLE_CONFIG = {
    agency_owner:           { label: 'Agency Owner',         avatar: fullName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#10b981' },
    regional_manager:       { label: 'Regional Manager',     avatar: fullName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#6366f1' },
    branch_manager:         { label: 'Branch Manager',       avatar: fullName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#6366f1' },
    property_manager:       { label: 'Property Manager',     avatar: fullName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#f59e0b' },
    lettings_negotiator:    { label: 'Lettings Negotiator',  avatar: fullName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#0284c7' },
    property_inspector:     { label: 'Property Inspector',   avatar: fullName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#7c3aed' },
    maintenance_coordinator:{ label: 'Maintenance Coordinator', avatar: fullName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#dc2626' },
  }

  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.agency_owner

  return {
    id:          supaUser.id,
    email:       supaUser.email,
    name:        fullName,
    agencyName,
    role:        rc.label,
    roleKey:     role,
    branch,
    avatar:      rc.avatar,
    color:       rc.color,
    supaUser,
    profile,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo]   = useState(false)

  const loadUser = async (supaUser) => {
    if (!supaUser) { setUser(null); return }
    const profile = await getProfile(supaUser.id)
    setUser(buildAppUser(supaUser, profile))
  }

  useEffect(() => {
    if (!isConfigured) {
      // No Supabase — check for demo session
      const stored = localStorage.getItem('propertyops_user')
      if (stored) {
        setUser(JSON.parse(stored))
        setIsDemo(true)
      }
      setLoading(false)
      return
    }

    // Real auth
    supabase.auth.getSession().then(({ data }) => {
      loadUser(data.session?.user || null).finally(() => setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user || null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Demo login (used when Supabase not configured)
  const demoLogin = (account) => {
    const u = { ...account, name: account.name || account.role }
    localStorage.setItem('propertyops_user', JSON.stringify(u))
    setUser(u)
    setIsDemo(true)
  }

  const logout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('propertyops_user')
    setUser(null)
    setIsDemo(false)
  }

  const refreshProfile = async () => {
    if (user?.supaUser) {
      await loadUser(user.supaUser)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, isConfigured, demoLogin, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
