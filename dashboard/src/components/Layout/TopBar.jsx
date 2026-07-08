import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, Sun, Moon, LogOut, Settings, User as UserIcon, Briefcase } from 'lucide-react'
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

  return (
    <header
      className="h-14 shrink-0 border-b flex items-center px-4 gap-4 transition-colors duration-300 relative z-50"
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

      {/* Avatar Dropdown */}
      <div className="relative pl-2 border-l" style={{ borderColor: 'var(--color-surface-border)' }} ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 hover:bg-[var(--color-surface-hover)] p-1 pr-2 rounded-full transition-colors focus:outline-none"
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
    </header>
  )
}
