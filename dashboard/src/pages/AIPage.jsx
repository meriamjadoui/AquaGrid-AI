import React from 'react'
import { ShieldCheck, Wrench, Zap, Droplets, BrainCircuit, ArrowUpRight } from 'lucide-react'
import useStore from '../store/useStore'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'

const CARD_GRADIENTS = [
  'var(--gradient-orange-pink)',
  'var(--gradient-purple-blue)',
  'var(--gradient-warm)',
  'var(--gradient-teal-blue)',
]

export default function AIPage() {
  const { sensors, history, aiResults } = useStore()
  const data = history.slice(-24)

  const leak  = aiResults?.leak        ?? { isLeak: false, confidence: 0 }
  const maint = aiResults?.maintenance  ?? { state: 0 }
  const ph    = aiResults?.ph           ?? { contaminated: false, deviationScore: 0 }
  const panel = aiResults?.panel        ?? { needsCleaning: false }
  const solarForecast = aiResults?.solarForecast ?? sensors.solarProduction

  const maintHealthScore = maint.state === 0 ? sensors.pumpHealthScore
    : maint.state === 1 ? Math.min(sensors.pumpHealthScore, 70)
    : Math.min(sensors.pumpHealthScore, 45)

  const aiLeakRisk = leak.isLeak
    ? Math.max(sensors.leakRisk, 60)
    : Math.min(sensors.leakRisk, 30)

  const cards = [
    {
      icon: ShieldCheck,
      title: 'Leak Detection',
      ring: aiLeakRisk,
      ringColor: '#fff',
      status: leak.isLeak ? 'alert' : aiLeakRisk > 20 ? 'warn' : 'ok',
      statusLabel: leak.isLeak ? '⚠ Leak Detected' : aiLeakRisk > 20 ? 'Monitor' : 'No Leak',
      desc: leak.isLeak
        ? `A possible leak has been detected. Current flow rate is ${sensors.flowRate} L/min. Please inspect the pipeline.`
        : `No leak detected. Water flow is normal at ${sensors.flowRate} L/min.`,
    },
    {
      icon: Wrench,
      title: 'Pump Maintenance',
      ring: maintHealthScore,
      ringColor: '#fff',
      status: maint.state === 0 ? 'ok' : maint.state === 1 ? 'warn' : 'alert',
      statusLabel: maint.state === 0 ? 'All Good' : maint.state === 1 ? 'Check Soon' : '🔴 Critical',
      desc: maint.state === 0
        ? `Pump is running well. Temperature ${sensors.pumpTemp}°C and power draw are within normal limits.`
        : maint.state === 1
        ? `Pump shows early signs of wear. Temperature is ${sensors.pumpTemp}°C — schedule an inspection soon.`
        : `Pump requires immediate attention. Temperature at ${sensors.pumpTemp}°C is too high. Stop the pump and contact support.`,
    },
    {
      icon: Zap,
      title: 'Energy Optimisation',
      ring: sensors.solarProduction,
      ringColor: '#fff',
      status: sensors.solarProduction > 50 ? 'ok' : 'warn',
      statusLabel: sensors.solarProduction > 50 ? 'Peak Window' : 'Low Solar',
      desc: panel.needsCleaning
        ? `Solar panel may need cleaning — output is lower than expected. Next-hour estimate: ~${solarForecast.toFixed(0)}W.`
        : `Solar generating ${sensors.solarProduction}W. Estimated next hour: ~${solarForecast.toFixed(0)}W. Panel is clean.`,
    },
    {
      icon: Droplets,
      title: 'Water Quality',
      ring: ph.contaminated ? 15 : 90,
      ringColor: '#fff',
      status: ph.contaminated ? 'alert' : 'ok',
      statusLabel: ph.contaminated ? '⚠ Quality Risk' : 'Quality OK',
      desc: ph.contaminated
        ? 'Water quality has fallen outside the safe range. Do not use for drinking until verified.'
        : 'Water quality is normal. pH is within the safe drinking range (6.5–8.5).',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-dim)' }}>
          <BrainCircuit size={20} style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Smart Monitoring</h2>
          <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>Your system is being monitored automatically — 24/7</p>
        </div>
      </div>

      {/* Status cards — mesh gradient backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, idx) => (
          <div key={card.title} className="card-gradient space-y-4" style={{ background: CARD_GRADIENTS[idx] }}>
            <div className="flex items-center gap-2">
              <card.icon size={16} style={{ color: 'rgba(255,255,255,0.9)' }} strokeWidth={1.8} />
              <h3 className="text-sm font-bold opacity-95">{card.title}</h3>
              <ArrowUpRight size={14} className="ml-auto opacity-60" />
            </div>
            <div className="flex justify-center">
              <GaugeRing value={card.ring} color={card.ringColor} size={120} strokeWidth={8} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.20)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {card.statusLabel}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-80">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 24h chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>System Activity — Last 24 Hours</h3>
          <span className="badge-info">Live</span>
        </div>
        <AquaLineChart data={data} lines={['leakRisk', 'battery', 'solar']} height={260} />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Water stored', value: `${sensors.reservoirLevel}%`, gradient: 'var(--gradient-teal-blue)' },
          { label: 'Solar right now', value: `${sensors.solarProduction}W`, gradient: 'var(--gradient-warm)' },
          { label: 'Battery charge', value: `${sensors.batteryCharge}%`, gradient: 'var(--gradient-green-teal)' },
        ].map(item => (
          <div key={item.label} className="card-gradient text-center py-6" style={{ background: item.gradient }}>
            <p className="text-3xl font-extrabold tracking-tight">{item.value}</p>
            <p className="text-xs mt-2 font-semibold uppercase tracking-wide opacity-80">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
