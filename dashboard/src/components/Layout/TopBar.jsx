import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, BellRing, Sun, Moon } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDistanceToNow } from 'date-fns'

const PAGE_TITLES = {
  '/overview': 'Overview',
  '/water':    'Water Monitoring',
  '/energy':   'Energy Management',
  '/ai':       'Smart Monitor',
  '/alerts':   'Alerts',
  '/audit':    'Audit Log',
  '/settings': 'Settings',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { lastUpdated, refreshSensors, alerts, theme, toggleTheme } = useStore()
  const unread = alerts.filter(a => !a.read).length

  // Auto-refresh every 10 s
  useEffect(() => {
    const t = setInterval(refreshSensors, 10_000)
    return () => clearInterval(t)
  }, [])

  const isDark = theme === 'dark'

  return (
    <header
      className="h-14 shrink-0 border-b flex items-center px-4 gap-4 transition-colors duration-300"
      style={{
        borderColor:     'var(--color-surface-border)',
        backgroundColor: 'var(--color-surface-card)',
      }}
    >
      <h1 className="text-base font-semibold flex-1" style={{ color: 'var(--color-text)' }}>
        {PAGE_TITLES[pathname] ?? 'AquaGrid AI'}
      </h1>

      <span className="text-xs hidden sm:block" style={{ color: 'var(--color-text-faint)' }}>
        Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
      </span>

      {/* Refresh */}
      <button
        onClick={refreshSensors}
        className="btn-ghost p-2"
        aria-label="Refresh sensor data"
      >
        <RefreshCw size={15} />
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn-ghost p-2"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark
          ? <Sun  size={15} className="text-amber-400" />
          : <Moon size={15} className="text-primary-500" />
        }
      </button>

      {/* Notifications */}
      <button className="relative btn-ghost p-2" aria-label="Notifications">
        <BellRing size={15} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Avatar */}
      <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--color-surface-border)' }}>
        <div className="w-7 h-7 rounded-full bg-primary-500/30 flex items-center justify-center text-primary-500 text-xs font-bold">
          MJ
        </div>
        <span className="text-xs hidden md:block" style={{ color: 'var(--color-text-muted)' }}>Meriam J.</span>
      </div>
    </header>
  )
}
