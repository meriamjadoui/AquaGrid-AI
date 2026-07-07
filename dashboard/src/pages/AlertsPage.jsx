import React from 'react'
import { BellRing, CheckCheck, ArrowUpRight } from 'lucide-react'
import useStore from '../store/useStore'
import { AlertItem } from '../components/UI/AlertBadge'

export default function AlertsPage() {
  const { alerts, markAlertRead } = useStore()
  const unread = alerts.filter(a => !a.read).length

  const KPI_ALERTS = [
    { label: 'Critical', type: 'alert', color: '#EF4444' },
    { label: 'Warning',  type: 'warn',  color: '#F59E0B' },
    { label: 'Info',     type: 'info',  color: '#4F7DF3' },
    { label: 'Resolved', type: 'ok',    color: '#10B981' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Alerts</h2>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {unread} unread notification{unread !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => alerts.forEach(a => markAlertRead(a.id))}
          className="btn-ghost"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <CheckCheck size={15} strokeWidth={1.8} /> Mark all read
        </button>
      </div>

      <div className="card">
        {/* KPI counts */}
        <div
          className="grid grid-cols-4 text-center gap-4 mb-5 pb-5"
          style={{ borderBottom: '1px solid var(--color-surface-border)' }}
        >
          {KPI_ALERTS.map(({ label, type, color }) => (
            <div key={label} className="p-3" style={{ borderRadius: 'var(--radius-md)', background: `${color}08` }}>
              <p
                className="text-2xl font-extrabold data-value"
                style={{ color }}
              >
                {alerts.filter(a => a.type === type).length}
              </p>
              <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
        </div>
      </div>

      {/* Alert rules */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Active Alert Rules</h3>
          <span className="badge-info">{5} rules</span>
        </div>
        <div className="space-y-2">
          {[
            { sensor: 'Reservoir Level', condition: '< 20%',  action: 'Push notification + pump start' },
            { sensor: 'Reservoir Level', condition: '> 90%',  action: 'Pump stop' },
            { sensor: 'Leak Risk (AI)',  condition: '> 40%',  action: 'Push alert + log event' },
            { sensor: 'Battery SoC',     condition: '< 25%',  action: 'Push warning + reduce pump cycles' },
            { sensor: 'Pump Temp',       condition: '> 65°C', action: 'Emergency pump stop + alert' },
          ].map(r => (
            <div
              key={r.sensor + r.condition}
              className="flex items-center gap-3 py-3 text-sm group transition-all duration-200"
              style={{ borderBottom: '1px solid var(--color-surface-border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="badge-info shrink-0">{r.sensor}</span>
              <span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{r.condition}</span>
              <span className="text-xs ml-auto text-right font-medium" style={{ color: 'var(--color-text-faint)' }}>{r.action}</span>
              <ArrowUpRight size={14} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-faint)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
