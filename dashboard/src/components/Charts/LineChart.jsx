import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

const COLORS = {
  reservoir: '#2fb4b8',
  flow:      '#01696f',
  solar:     '#f59e0b',
  battery:   '#10b981',
  pumpPower: '#8b5cf6',
  leakRisk:  '#ef4444',
}

export default function AquaLineChart({ data, lines = [], height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: '#21262d' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#161b22', border: '1px solid #21262d',
            borderRadius: '8px', fontSize: '12px', color: '#e2e8f0'
          }}
          cursor={{ stroke: '#01696f', strokeWidth: 1 }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
        />
        {lines.map(key => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[key] ?? '#01696f'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
