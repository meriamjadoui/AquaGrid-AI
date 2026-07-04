import React from 'react'
import { BellRing, CheckCheck } from 'lucide-react'
import useStore from '../store/useStore'
import { AlertItem } from '../components/UI/AlertBadge'

export default function AlertsPage() {
  const { alerts, markAlertRead } = useStore()
  const unread = alerts.filter(a => !a.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Alerts</h2>
          <p className="text-sm text-slate-500 mt-0.5">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => alerts.forEach(a => markAlertRead(a.id))}
          className="btn-ghost"
        >
          <CheckCheck size={15} />
          Mark all read
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-4 text-center gap-3 mb-4 pb-4 border-b border-surface-border">
          {[
            { label: 'Critical', count: alerts.filter(a => a.type === 'alert').length, cls: 'text-red-400' },
            { label: 'Warning',  count: alerts.filter(a => a.type === 'warn').length,  cls: 'text-amber-400' },
            { label: 'Info',     count: alerts.filter(a => a.type === 'info').length,  cls: 'text-blue-400' },
            { label: 'Resolved', count: alerts.filter(a => a.type === 'ok').length,    cls: 'text-emerald-400' },
          ].map(({ label, count, cls }) => (
            <div key={label}>
              <p className={`text-2xl font-bold data-value ${cls}`}>{count}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
        </div>
      </div>

      {/* Alert rules */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Active Alert Rules</h3>
        <div className="space-y-2">
          {[
            { sensor: 'Reservoir Level', condition: '< 20%',  action: 'Push notification + pump start' },
            { sensor: 'Reservoir Level', condition: '> 90%',  action: 'Pump stop' },
            { sensor: 'Leak Risk (AI)',  condition: '> 40%',  action: 'Push alert + log event' },
            { sensor: 'Battery SoC',     condition: '< 25%',  action: 'Push warning + reduce pump cycles' },
            { sensor: 'Pump Temp',       condition: '> 65°C', action: 'Emergency pump stop + alert' },
          ].map(r => (
            <div key={r.sensor + r.condition} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0 text-sm">
              <span className="badge-info shrink-0">{r.sensor}</span>
              <span className="text-slate-400 font-mono text-xs">{r.condition}</span>
              <span className="text-slate-500 text-xs ml-auto text-right">{r.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
