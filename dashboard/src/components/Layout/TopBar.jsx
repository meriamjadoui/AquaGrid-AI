import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, BellRing } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDistanceToNow } from 'date-fns'

const PAGE_TITLES = {
  '/overview': 'Overview',
  '/water':    'Water Monitoring',
  '/energy':   'Energy Management',
  '/ai':       'AI Engine',
  '/alerts':   'Alerts',
  '/settings': 'Settings',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { lastUpdated, refreshSensors, alerts } = useStore()
  const unread = alerts.filter(a => !a.read).length

  // Auto-refresh every 10s
  useEffect(() => {
    const t = setInterval(refreshSensors, 10_000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="h-14 shrink-0 border-b border-surface-border bg-surface-card flex items-center px-4 gap-4">
      <h1 className="text-base font-semibold text-slate-200 flex-1">
        {PAGE_TITLES[pathname] ?? 'AquaGrid AI'}
      </h1>

      <span className="text-xs text-slate-500 hidden sm:block">
        Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
      </span>

      <button
        onClick={refreshSensors}
        className="btn-ghost p-2"
        aria-label="Refresh sensor data"
      >
        <RefreshCw size={15} />
      </button>

      <button className="relative btn-ghost p-2" aria-label="Notifications">
        <BellRing size={15} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
        <div className="w-7 h-7 rounded-full bg-primary-500/30 flex items-center justify-center text-primary-400 text-xs font-bold">
          MJ
        </div>
        <span className="text-xs text-slate-400 hidden md:block">Meriam J.</span>
      </div>
    </header>
  )
}
