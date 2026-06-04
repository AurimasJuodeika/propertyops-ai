import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import Tenancies from './pages/Tenancies'
import Landlords from './pages/Landlords'
import LandlordProfile from './pages/LandlordProfile'
import Tenants from './pages/Tenants'
import TenantProfile from './pages/TenantProfile'
import Inspections from './pages/Inspections'
import Compliance from './pages/Compliance'
import Maintenance from './pages/Maintenance'
import RentArrears from './pages/RentArrears'
import Contractors from './pages/Contractors'
import Reports from './pages/Reports'
import Tasks from './pages/Tasks'
import Settings from './pages/Settings'
import LandlordPortal from './pages/LandlordPortal'
import TenantPortal from './pages/TenantPortal'
import DemoBanner from './components/DemoBanner'
import PageSkeleton from './components/Skeleton'

// Page fade-in + skeleton flash
function PageWrapper({ children }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 280)
    return () => clearTimeout(t)
  }, [location.pathname])

  if (loading) return <PageSkeleton />
  return <div className="page-enter">{children}</div>
}

// Full-screen loading spinner while auth resolves
function AuthLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <p style={{ color: '#64748b', fontSize: 13.5, fontWeight: 500 }}>Loading PropertyOps AI…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const DEMO_ACCOUNTS = [
  { role: 'Agency Owner',     name: 'Sarah Mitchell',   email: 'sarah@harrington.co.uk',  avatar: 'SM', branch: 'All Branches',   color: '#10b981' },
  { role: 'Branch Manager',   name: 'James Harrington', email: 'james@harrington.co.uk',  avatar: 'JH', branch: 'London Central', color: '#6366f1' },
  { role: 'Property Manager', name: 'Priya Sharma',     email: 'priya@harrington.co.uk',  avatar: 'PS', branch: 'London Central', color: '#f59e0b' },
]

function AppRoutes() {
  const { user, loading, isDemo, logout, demoLogin } = useAuth()
  const [portalMode, setPortalMode] = useState(null)
  const navigate = useNavigate()

  if (loading) return <AuthLoading />

  // Portal modes — completely separate views
  if (portalMode === 'landlord') return <LandlordPortal onExit={() => setPortalMode(null)} />
  if (portalMode === 'tenant')   return <TenantPortal   onExit={() => setPortalMode(null)} />

  const handleEnterDemo = () => {
    demoLogin(DEMO_ACCOUNTS[0])
    navigate('/dashboard', { replace: true })
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*"                element={<Landing onEnterDemo={handleEnterDemo} />} />
      </Routes>
    )
  }

  return (
    <>
      {/* Portal switcher */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 44, display: 'flex', gap: 6 }}>
        <button onClick={() => setPortalMode('landlord')}
          style={{ padding: '6px 12px', background: '#1e293b', color: '#64748b', border: '1px solid #334155', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
          👤 Landlord Portal
        </button>
        <button onClick={() => setPortalMode('tenant')}
          style={{ padding: '6px 12px', background: '#1e293b', color: '#64748b', border: '1px solid #334155', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
          🏠 Tenant Portal
        </button>
      </div>

      <Routes>
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/"                       element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"                  element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"              element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/properties"             element={<PageWrapper><Properties /></PageWrapper>} />
          <Route path="/properties/:id"         element={<PageWrapper><PropertyDetail /></PageWrapper>} />
          <Route path="/tenancies"              element={<PageWrapper><Tenancies /></PageWrapper>} />
          <Route path="/landlords"              element={<PageWrapper><Landlords /></PageWrapper>} />
          <Route path="/landlords/:id"          element={<PageWrapper><LandlordProfile /></PageWrapper>} />
          <Route path="/tenants"                element={<PageWrapper><Tenants /></PageWrapper>} />
          <Route path="/tenants/:id"            element={<PageWrapper><TenantProfile /></PageWrapper>} />
          <Route path="/inspections"            element={<PageWrapper><Inspections /></PageWrapper>} />
          <Route path="/compliance"             element={<PageWrapper><Compliance /></PageWrapper>} />
          <Route path="/maintenance"            element={<PageWrapper><Maintenance /></PageWrapper>} />
          <Route path="/rent-arrears"           element={<PageWrapper><RentArrears /></PageWrapper>} />
          <Route path="/contractors"            element={<PageWrapper><Contractors /></PageWrapper>} />
          <Route path="/reports"                element={<PageWrapper><Reports /></PageWrapper>} />
          <Route path="/tasks"                  element={<PageWrapper><Tasks /></PageWrapper>} />
          <Route path="/settings"               element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="*"                       element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>

      {/* Demo banner — role switcher, only shown in demo mode */}
      {isDemo && (
        <DemoBanner
          currentUser={user}
          onSwitchUser={(acc) => demoLogin(acc)}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
