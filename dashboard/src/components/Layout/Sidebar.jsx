import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Droplets, Zap, ShieldCheck,
  BellRing, Settings, ChevronLeft, ChevronRight, Wifi, ClipboardList
} from 'lucide-react'
import useStore from '../../store/useStore'
import clsx from 'clsx'

const NAV = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview'      },
  { to: '/water',    icon: Droplets,        label: 'Water'         },
  { to: '/energy',   icon: Zap,             label: 'Energy'        },
  { to: '/ai',       icon: ShieldCheck,     label: 'Smart Monitor' },
  { to: '/alerts',   icon: BellRing,        label: 'Alerts'        },
  { to: '/audit',    icon: ClipboardList,   label: 'Audit Log'     },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useStore()
  const unread = alerts.filter(a => !a.read).length

  return (
    <aside
      className={clsx(
        'flex flex-col bg-surface-card border-r border-surface-border transition-all duration-300 z-20 shrink-0',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-border">
        <div className="shrink-0">
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8" aria-label="AquaGrid AI logo">
            <rect width="36" height="36" rx="10" fill="#01696f"/>
            <path d="M18 5 C13 11 8 13 8 20 C8 24.4 12.6 29 18 29 C23.4 29 28 24.4 28 20 C28 13 23 11 18 5Z" fill="#5ec9cc" opacity="0.9"/>
            <path d="M14 20 Q18 16 22 20" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <circle cx="26" cy="11" r="4" fill="#f59e0b"/>
            <path d="M26 6.5L26 7.5 M26 14.5L26 15.5 M21.5 8L22.5 9 M29.5 13 L30.5 14 M20 11 L21 11 M31 11 L32 11" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-100 leading-tight">AquaGrid AI</p>
            <p className="text-xs text-primary-400 flex items-center gap-1"><Wifi size={10} /> Live</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded-lg hover:bg-surface-hover text-slate-500 hover:text-slate-200 transition-colors"
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

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-surface-border">
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
