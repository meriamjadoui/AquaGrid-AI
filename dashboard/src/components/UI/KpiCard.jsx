import React from 'react'
import clsx from 'clsx'

export default function KpiCard({ label, value, unit, icon: Icon, color = 'text-primary-400', badge, delta, children }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <span className={clsx('p-2 rounded-lg', color.replace('text-', 'bg-').replace('400', '400/10').replace('500', '500/10'))}>
            <Icon size={16} className={color} />
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className={clsx('kpi-value data-value', color)}>
          {value}
        </span>
        {unit && (
          <span
            className="text-sm mb-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {unit}
          </span>
        )}
      </div>
      {(badge || delta) && (
        <div className="flex items-center gap-2 flex-wrap">
          {badge && <span className={`badge-${badge.type}`}>{badge.label}</span>}
          {delta && (
            <span className={delta.positive ? 'kpi-delta-up' : 'kpi-delta-down'}>
              {delta.positive ? '↑' : '↓'} {delta.value}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
