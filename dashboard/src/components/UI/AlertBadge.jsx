import React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import clsx from 'clsx'
import useStore from '../../store/useStore'

const CONFIG = {
  alert: { icon: XCircle,       iconColor: '#EF4444' },
  warn:  { icon: AlertTriangle, iconColor: '#F59E0B' },
  ok:    { icon: CheckCircle2,  iconColor: '#10B981' },
  info:  { icon: Info,          iconColor: '#4F7DF3' },
}

export function AlertItem({ alert }) {
  const markRead = useStore(s => s.markAlertRead)
  const { icon: Icon, iconColor } = CONFIG[alert.type] ?? CONFIG.info

  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer group"
      style={{
        background: 'var(--color-surface-card)',
        boxShadow: 'var(--shadow-sm)',
        opacity: alert.read ? 0.55 : 1,
      }}
      onClick={() => markRead(alert.id)}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${iconColor}15` }}
      >
        <Icon size={15} style={{ color: iconColor }} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug font-medium" style={{ color: 'var(--color-text)' }}>
          {alert.message}
        </p>
        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-faint)' }}>
          {alert.time}
        </p>
      </div>
      {!alert.read && (
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-2"
          style={{ background: 'var(--color-primary)' }}
        />
      )}
    </div>
  )
}
