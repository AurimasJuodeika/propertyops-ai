import { createContext, useContext, useState, useEffect } from 'react'

export const ThemeContext = createContext({ isDark: false, toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('propertyops_theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('propertyops_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [])

  const toggle = () => setIsDark(v => !v)

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Pre-computed theme colour objects — use these in inline styles
export function useThemeColors() {
  const { isDark } = useTheme()

  return isDark ? {
    // Backgrounds
    bgPage:       '#080f1e',
    bgCard:       '#111827',
    bgCardAlt:    '#0d1526',
    bgInput:      '#0d1526',
    bgHover:      '#1a2540',
    bgSubtle:     '#0d1526',
    bgTableHead:  '#0a1020',
    bgTableRow:   '#111827',
    bgTableHover: '#162035',

    // Borders
    border:       '#1e2d42',
    borderSubtle: '#162035',

    // Text
    textPrimary:  '#f1f5f9',
    textSecondary:'#94a3b8',
    textMuted:    '#475569',

    // Header
    headerBg:     '#0a0f1e',
    headerBorder: '#1e2d42',
    headerShadow: '0 1px 3px rgba(0,0,0,0.4)',

    // Shadows
    shadowSm:     '0 2px 8px rgba(0,0,0,0.3)',
    shadowMd:     '0 4px 20px rgba(0,0,0,0.4)',

    // Specific states
    alertCritical: { bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.25)', text: '#fca5a5', icon: '#ef4444' },
    alertWarning:  { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)', text: '#fcd34d', icon: '#f59e0b' },
    alertInfo:     { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.22)', text: '#a5b4fc', icon: '#818cf8' },
  } : {
    bgPage:       '#f1f5f9',
    bgCard:       '#ffffff',
    bgCardAlt:    '#f8fafc',
    bgInput:      '#f8fafc',
    bgHover:      '#f8fafc',
    bgSubtle:     '#f8fafc',
    bgTableHead:  '#f8fafc',
    bgTableRow:   '#ffffff',
    bgTableHover: '#f8fafc',

    border:       '#e2e8f0',
    borderSubtle: '#f1f5f9',

    textPrimary:  '#0f172a',
    textSecondary:'#64748b',
    textMuted:    '#94a3b8',

    headerBg:     '#ffffff',
    headerBorder: '#e2e8f0',
    headerShadow: '0 1px 3px rgba(0,0,0,0.04)',

    shadowSm:     '0 2px 8px rgba(0,0,0,0.06)',
    shadowMd:     '0 4px 20px rgba(0,0,0,0.08)',

    alertCritical: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '#dc2626' },
    alertWarning:  { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#d97706' },
    alertInfo:     { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: '#2563eb' },
  }
}
