import React from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-surface-card)',
      border: '1px solid var(--color-surface-border)',
      borderRadius: '16px',
      padding: '10px 14px',
      fontSize: '12px',
      color: 'var(--color-text)',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-muted)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600, fontSize: '13px' }}>
          {p.value}{unit}
        </p>
      ))}
    </div>
  )
}

export default function AquaAreaChart({ data, dataKey, color = '#4F7DF3', height = 180, unit = '' }) {
  return (
    <div className="dot-grid-bg rounded-2xl p-2">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.20} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-text-faint)', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: 'var(--color-surface-border)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--color-text-faint)', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
