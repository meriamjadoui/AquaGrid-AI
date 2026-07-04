import React from 'react'

export default function GaugeRing({ value, max = 100, size = 120, strokeWidth = 10, color = '#01696f', bg = '#21262d', label, unit = '%' }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(value / max, 0), 1)
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={bg} strokeWidth={strokeWidth}
        />
        {/* Value ring */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="gauge-ring"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
        {/* Center text */}
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="middle"
          fill="#e2e8f0" fontSize={size * 0.18} fontWeight="700" fontFamily="Inter, sans-serif"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(value)}
        </text>
        <text x={size / 2} y={size / 2 + size * 0.14} textAnchor="middle" dominantBaseline="middle"
          fill="#64748b" fontSize={size * 0.10} fontFamily="Inter, sans-serif"
        >
          {unit}
        </text>
      </svg>
      {label && <p className="text-xs text-slate-500 text-center">{label}</p>}
    </div>
  )
}
