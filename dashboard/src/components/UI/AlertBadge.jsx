import React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import clsx from 'clsx'
import useStore from '../../store/useStore'

const CONFIG = {
  alert: { icon: XCircle,       cls: 'badge-alert', label: 'Critical' },
  warn:  { icon: AlertTriangle, cls: 'badge-warn',  label: 'Warning'  },
  ok:    { icon: CheckCircle2,  cls: 'badge-ok',    label: 'Normal'   },
  info:  { icon: Info,          cls: 'badge-info',  label: 'Info'     },
}

export function AlertItem({ alert }) {
  const markRead = useStore(s => s.markAlertRead)
  const { icon: Icon, cls } = CONFIG[alert.type] ?? CONFIG.info

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        alert.read
          ? 'bg-surface-bg border-surface-border opacity-60'
          : 'bg-surface-card border-surface-border hover:border-primary-500/30'
      )}
      onClick={() => markRead(alert.id)}
    >
      <Icon size={15} className={clsx('shrink-0 mt-0.5', alert.type === 'alert' ? 'text-red-400' : alert.type === 'warn' ? 'text-amber-400' : alert.type === 'ok' ? 'text-emerald-400' : 'text-blue-400')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 leading-snug">{alert.message}</p>
        <p className="text-xs text-slate-600 mt-1">{alert.time}</p>
      </div>
      {!alert.read && <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0 mt-1.5" />}
    </div>
  )
}
