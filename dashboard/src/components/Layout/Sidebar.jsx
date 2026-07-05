import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Droplets, Zap, BrainCircuit,
  BellRing, Settings, ChevronLeft, ChevronRight, Wifi, ClipboardList
} from 'lucide-react'
import useStore from '../../store/useStore'
import clsx from 'clsx'

const NAV = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview'     },
  { to: '/water',    icon: Droplets,        label: 'Water'        },
  { to: '/energy',   icon: Zap,             label: 'Energy'       },
  { to: '/ai',       icon: BrainCircuit,    label: 'AI Insights'  },
  { to: '/alerts',   icon: BellRing,        label: 'Alerts'       },
  { to: '/audit',    icon: ClipboardList,   label: 'Audit Log'    },
]

const SDGS = [
  { n: 6,  color: '#26BDE2', title: 'Clean Water' },
  { n: 7,  color: '#FCC30B', title: 'Clean Energy' },
  { n: 9,  color: '#FD6925', title: 'Innovation' },
  { n: 11, color: '#FD9D24', title: 'Sust. Cities' },
  { n: 13, color: '#3F7E44', title: 'Climate Action' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useStore()
  const unread = alerts.filter(a => !a.read).length

  return (
    <aside
      className={clsx(
        'flex flex-col border-r transition-all duration-300 z-20 shrink-0',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
      style={{ background: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
        <div className="shrink-0">
          {/* AquaWise droplet + sun logo */}
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8" aria-label="AquaWise logo">
            <rect width="36" height="36" rx="10" fill="#0d8fae"/>
            <path d="M18 6 C13 12 7 15 7 21 C7 25.9 12 31 18 31 C24 31 29 25.9 29 21 C29 15 23 12 18 6Z"
              fill="#26BDE2" opacity="0.95"/>
            <path d="M14 22 Q18 18 22 22" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <circle cx="27" cy="10" r="3.5" fill="#FCC30B"/>
            <path d="M27 5.5L27 6.5 M27 13.5L27 14.5 M22.5 7.5L23.3 8.3 M30.7 11.7L31.5 12.5 M21 10L22 10 M32 10L33 10"
              stroke="#FCC30B" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text)' }}>AquaWise</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
              <Wifi size={10} /> Live
            </p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded-lg hover:bg-theme-hover transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
            title={!sidebarOpen ? label : undefined}
          >
            <div className="relative shrink-0">
              <Icon size={18} />
              {label === 'Alerts' && unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
                  {unread}
                </span>
              )}
            </div>
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* SDG badges */}
      {sidebarOpen && (
        <div className="px-3 pb-3">
          <p className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--color-text-faint)' }}>UN SDG Aligned</p>
          <div className="flex flex-wrap gap-1">
            {SDGS.map(({ n, color, title }) => (
              <span
                key={n}
                className="sdg-pill"
                style={{ background: color }}
                title={`SDG ${n}: ${title}`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
        <NavLink
          to="/settings"
          className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}
