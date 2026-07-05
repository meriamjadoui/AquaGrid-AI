import React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import clsx from 'clsx'
import useStore from '../../store/useStore'

const CONFIG = {
  alert: { icon: XCircle,       iconColor: '#ef4444' },
  warn:  { icon: AlertTriangle, iconColor: '#f59e0b' },
  ok:    { icon: CheckCircle2,  iconColor: '#10b981' },
  info:  { icon: Info,          iconColor: '#3b82f6' },
}

export function AlertItem({ alert }) {
  const markRead = useStore(s => s.markAlertRead)
  const { icon: Icon, iconColor } = CONFIG[alert.type] ?? CONFIG.info

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer"
      style={{
        background: 'var(--color-surface-bg)',
        border: '1px solid var(--color-surface-border)',
        opacity: alert.read ? 0.55 : 1,
      }}
      onClick={() => markRead(alert.id)}
    >
      <Icon size={15} className="shrink-0 mt-0.5" style={{ color: iconColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug" style={{ color: 'var(--color-text)' }}>
          {alert.message}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {alert.time}
        </p>
      </div>
      {!alert.read && (
        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
      )}
    </div>
  )
}
