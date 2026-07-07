import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

const COLORS = {
  reservoir: '#56A7F5',
  flow:      '#4F7DF3',
  solar:     '#F59E0B',
  battery:   '#10B981',
  pumpPower: '#8B5CF6',
  leakRisk:  '#EF4444',
}

const CustomTooltip = ({ active, payload, label }) => {
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
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function AquaLineChart({ data, lines = [], height = 240 }) {
  return (
    <div className="dot-grid-bg rounded-2xl p-2">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}
          />
          {lines.map(key => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[key] ?? '#4F7DF3'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: COLORS[key] ?? '#4F7DF3' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
