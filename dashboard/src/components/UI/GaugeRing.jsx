import React from 'react'

export default function GaugeRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = '#4F7DF3',
  label,
  unit = '%',
}) {
  const r      = (size - strokeWidth) / 2
  const circ   = 2 * Math.PI * r
  const pct    = Math.min(Math.max(value / max, 0), 1)
  const offset = circ * (1 - pct)

  const trackColor  = 'var(--color-surface-hover, #F0F2F5)'
  const valueColor  = 'var(--color-text)'
  const unitColor   = 'var(--color-text-faint)'
  const labelColor  = 'var(--color-text-muted)'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {/* Subtle glow behind the gauge */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{ background: color }}
        />
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative">
          {/* Track ring */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            opacity={0.8}
          />
          {/* Value ring */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="gauge-ring"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)',
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
          {/* Value text */}
          <text
            x={size / 2} y={size / 2 - 4}
            textAnchor="middle" dominantBaseline="middle"
            fill={valueColor}
            fontSize={size * 0.20}
            fontWeight="800"
            fontFamily="Inter, sans-serif"
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
          >
            {Math.round(value)}
          </text>
          {/* Unit text */}
          <text
            x={size / 2} y={size / 2 + size * 0.14}
            textAnchor="middle" dominantBaseline="middle"
            fill={unitColor}
            fontSize={size * 0.09}
            fontWeight="500"
            fontFamily="Inter, sans-serif"
          >
            {unit}
          </text>
        </svg>
      </div>
      {label && (
        <p
          className="text-xs text-center font-semibold"
          style={{ color: labelColor }}
        >
          {label}
        </p>
      )}
    </div>
  )
}
