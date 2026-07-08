import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, Sun, Moon, LogOut, Settings, User as UserIcon, Briefcase, Search } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDistanceToNow } from 'date-fns'

const PAGE_TITLES = {
  '/overview': 'Overview',
  '/water': 'Water Monitoring',
  '/energy': 'Energy Management',
  '/ai': 'Insights',
  '/alerts': 'Alerts',
  '/audit': 'Audit Log',
  '/settings': 'Settings',
}

const ROLE_LABELS = {
  'operator': 'System Operator',
  'maintenance': 'Maintenance / Field',
  'manager': 'Facility Manager'
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { lastUpdated, refreshSensors, theme, toggleTheme } = useStore()
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const t = setInterval(refreshSensors, 10_000)
    
    // Fetch dynamic user profile
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.firstName) setUser(data)
      })
      .catch(err => console.error("Could not fetch user profile", err))

    return () => clearInterval(t)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  const isDark = theme === 'dark'
  
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Loading...'
  const displayRole = user ? (ROLE_LABELS[user.role] || ROLE_LABELS['operator']) : '...'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header
      className="h-16 shrink-0 flex items-center px-6 gap-5 transition-colors duration-300 relative z-50"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderBottom: '1px solid var(--color-surface-border)',
      }}
    >
      {/* Greeting + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            {greeting}, 👋
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
            ? <Sun size={16} style={{ color: '#FBBF24' }} strokeWidth={1.8} />
            : <Moon size={16} style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
          }
        </button>

        {/* Avatar Dropdown */}
        <div className="relative pl-3 ml-1 border-l" style={{ borderColor: 'var(--color-surface-border)' }} ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 hover:bg-[var(--color-surface-hover)] p-1 pr-2 rounded-full transition-colors focus:outline-none"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
              style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}
            >
              {initials}
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{displayName}</span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{displayRole}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border border-[var(--color-surface-border)] overflow-hidden bg-[var(--color-surface-card)] animate-[fadeIn_0.15s_ease-out]">
              <div className="p-4 border-b border-[var(--color-surface-border)] bg-[var(--color-surface-bg)]/50">
                <p className="text-sm font-bold truncate text-[var(--color-text)]">{displayName}</p>
                <p className="text-xs truncate text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                  <Briefcase size={12} /> {displayRole}
                </p>
              </div>
              
              <div className="p-2">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
