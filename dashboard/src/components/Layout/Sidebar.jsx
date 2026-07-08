import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Droplets, Zap, BrainCircuit,
  BellRing, Settings, ChevronLeft, ChevronRight, ClipboardList
} from 'lucide-react'
import useStore from '../../store/useStore'
import clsx from 'clsx'

const NAV = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview'     },
  { to: '/water',    icon: Droplets,        label: 'Water'        },
  { to: '/energy',   icon: Zap,             label: 'Energy'       },
  { to: '/ai',       icon: BrainCircuit,    label: 'Insights'  },
  { to: '/alerts',   icon: BellRing,        label: 'Alerts'       },
  { to: '/audit',    icon: ClipboardList,   label: 'Audit Log'    },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useStore()
  const unread = alerts.filter(a => !a.read).length

  return (
    <aside
      className={clsx(
        'flex flex-col shrink-0 transition-all duration-300 z-20 relative',
        sidebarOpen ? 'w-60' : 'w-[72px]'
      )}
      style={{
        background: 'var(--color-surface-card)',
        borderRight: '1px solid var(--color-surface-border)',
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center gap-3 px-4 h-16 shrink-0"
        style={{ borderBottom: '1px solid var(--color-surface-border)' }}
      >
        <div className="shrink-0">
          <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9" aria-label="AquaWise logo">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36">
                <stop offset="0%" stopColor="#4F7DF3" />
                <stop offset="100%" stopColor="#56A7F5" />
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="10" fill="url(#logo-grad)"/>
            <path d="M18 8 C14 13 9 16 9 21 C9 25 13 29 18 29 C23 29 27 25 27 21 C27 16 22 13 18 8Z"
              fill="rgba(255,255,255,0.9)"/>
            <path d="M14 22 Q18 18 22 22" stroke="rgba(79,125,243,0.6)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text)' }}>AquaWise</p>
            <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            color: 'var(--color-text-faint)',
            background: 'var(--color-surface-hover)',
          }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scroll">
        {sidebarOpen && (
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--color-text-faint)' }}>
            Menu
          </p>
        )}
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
            title={!sidebarOpen ? label : undefined}
          >
            <div className="relative shrink-0">
              <Icon size={18} strokeWidth={1.8} />
              {label === 'Alerts' && unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)' }}>
                  {unread}
                </span>
              )}
            </div>
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
        <NavLink
          to="/settings"
          className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <Settings size={18} strokeWidth={1.8} className="shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}
