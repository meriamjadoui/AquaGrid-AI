import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, Sun, Moon, Search } from 'lucide-react'
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
  const { lastUpdated, refreshSensors, theme, toggleTheme } = useStore()

  useEffect(() => {
    const t = setInterval(refreshSensors, 10_000)
    return () => clearInterval(t)
  }, [])

  const isDark = theme === 'dark'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header
      className="h-16 shrink-0 flex items-center px-6 gap-5 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderBottom: '1px solid var(--color-surface-border)',
      }}
    >
      {/* Greeting + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            {greeting}, Meriam 👋
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-faint)' }}>
            {PAGE_TITLES[pathname] ?? 'Dashboard'} · Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Search bar (centered capsule) */}
      <div className="flex-1 flex justify-center">
        <div className="search-capsule hidden sm:flex">
          <Search size={15} style={{ color: 'var(--color-text-faint)' }} className="shrink-0" />
          <input
            type="text"
            placeholder="Search sensors, alerts, reports..."
            readOnly
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={refreshSensors}
          className="btn-ghost p-2 rounded-xl"
          aria-label="Refresh sensor data"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <RefreshCw size={16} strokeWidth={1.8} />
        </button>

        <button
          onClick={toggleTheme}
          className="btn-ghost p-2 rounded-xl"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark
            ? <Sun  size={16} style={{ color: '#FBBF24' }} strokeWidth={1.8} />
            : <Moon size={16} style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
          }
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-3 ml-1"
          style={{ borderLeft: '1px solid var(--color-surface-border)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4F7DF3, #56A7F5)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(79,125,243,0.3)',
            }}
          >
            MJ
          </div>
          <span className="text-xs font-semibold hidden md:block" style={{ color: 'var(--color-text)' }}>Meriam J.</span>
        </div>
      </div>
    </header>
  )
}
