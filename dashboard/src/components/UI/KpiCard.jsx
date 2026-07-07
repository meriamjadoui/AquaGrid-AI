import React from 'react'
import clsx from 'clsx'

export default function KpiCard({ label, value, unit, icon: Icon, color = 'text-primary-400', badge, delta, children }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <span
            className="p-2 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--color-surface-hover)',
            }}
          >
            <Icon size={16} className={color} strokeWidth={1.8} />
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className={clsx('kpi-value data-value', color)}>
          {value}
        </span>
        {unit && (
          <span
            className="text-sm mb-1 font-medium"
            style={{ color: 'var(--color-text-faint)' }}
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
