import React from 'react'
import { BellRing, CheckCheck } from 'lucide-react'
import useStore from '../store/useStore'
import { AlertItem } from '../components/UI/AlertBadge'

export default function AlertsPage() {
  const { alerts, markAlertRead } = useStore()
  const unread = alerts.filter(a => !a.read).length

  const KPI_ALERTS = [
    { label: 'Critical', type: 'alert', lightColor: '#dc2626', darkColor: '#f87171' },
    { label: 'Warning',  type: 'warn',  lightColor: '#d97706', darkColor: '#fbbf24' },
    { label: 'Info',     type: 'info',  lightColor: '#2563eb', darkColor: '#60a5fa' },
    { label: 'Resolved', type: 'ok',    lightColor: '#059669', darkColor: '#34d399' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Alerts</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {unread} unread notification{unread !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => alerts.forEach(a => markAlertRead(a.id))} className="btn-ghost">
          <CheckCheck size={15} /> Mark all read
        </button>
      </div>

      <div className="card">
        {/* KPI counts */}
        <div
          className="grid grid-cols-4 text-center gap-3 mb-4 pb-4"
          style={{ borderBottom: '1px solid var(--color-surface-border)' }}
        >
          {KPI_ALERTS.map(({ label, type, lightColor, darkColor }) => (
            <div key={label}>
              <p
                className="text-2xl font-bold data-value"
                style={{ color: `var(--color-kpi-${type}, ${lightColor})` }}
              >
                {alerts.filter(a => a.type === type).length}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
        </div>
      </div>

      {/* Alert rules */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Active Alert Rules</h3>
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
              className="flex items-center gap-3 py-2 text-sm last:border-0"
              style={{ borderBottom: '1px solid var(--color-surface-border)' }}
            >
              <span className="badge-info shrink-0">{r.sensor}</span>
              <span className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.condition}</span>
              <span className="text-xs ml-auto text-right" style={{ color: 'var(--color-text-faint)' }}>{r.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
