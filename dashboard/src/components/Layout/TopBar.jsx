import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, BellRing, Sun, Moon } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDistanceToNow } from 'date-fns'

const PAGE_TITLES = {
  '/overview': 'Overview',
  '/water':    'Water Monitoring',
  '/energy':   'Energy Management',
  '/ai':       'AI Insights',
  '/alerts':   'Alerts',
  '/audit':    'Audit Log',
  '/settings': 'Settings',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { lastUpdated, refreshSensors, alerts, theme, toggleTheme } = useStore()
  const unread = alerts.filter(a => !a.read).length

  useEffect(() => {
    const t = setInterval(refreshSensors, 10_000)
    return () => clearInterval(t)
  }, [])

  const isDark = theme === 'dark'

  return (
    <header
      className="h-14 shrink-0 border-b flex items-center px-4 gap-4 transition-colors duration-300"
      style={{ borderColor: 'var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
    >
      {/* Brand + page title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xs font-bold tracking-wide hidden sm:block" style={{ color: 'var(--color-primary)' }}>AquaWise</span>
        <span className="text-xs hidden sm:block" style={{ color: 'var(--color-surface-border)' }}>|</span>
        <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
          {PAGE_TITLES[pathname] ?? 'AquaWise'}
        </h1>
      </div>

      <span className="text-xs hidden sm:block" style={{ color: 'var(--color-text-faint)' }}>
        Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
      </span>

      <button onClick={refreshSensors} className="btn-ghost p-2" aria-label="Refresh sensor data">
        <RefreshCw size={15} />
      </button>

      <button
        onClick={toggleTheme}
        className="btn-ghost p-2"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark
          ? <Sun  size={15} style={{ color: '#FCC30B' }} />
          : <Moon size={15} style={{ color: 'var(--color-primary)' }} />
        }
      </button>

      <button className="relative btn-ghost p-2" aria-label="Notifications">
        <BellRing size={15} />
        {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
      </button>

      <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--color-surface-border)' }}>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}
        >
          MJ
        </div>
        <span className="text-xs hidden md:block" style={{ color: 'var(--color-text-muted)' }}>Meriam J.</span>
      </div>
    </header>
  )
}
