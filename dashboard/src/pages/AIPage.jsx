import React from 'react'
import { ShieldCheck, Wrench, Zap, Droplets, BrainCircuit } from 'lucide-react'
import useStore from '../store/useStore'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'

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
      color: 'text-red-400',
      ring: aiLeakRisk,
      ringColor: '#ef4444',
      status: leak.isLeak ? 'alert' : aiLeakRisk > 20 ? 'warn' : 'ok',
      statusLabel: leak.isLeak ? '⚠ Leak Detected' : aiLeakRisk > 20 ? 'Monitor' : 'No Leak',
      desc: leak.isLeak
        ? `A possible leak has been detected. Current flow rate is ${sensors.flowRate} L/min. Please inspect the pipeline.`
        : `No leak detected. Water flow is normal at ${sensors.flowRate} L/min.`,
    },
    {
      icon: Wrench,
      title: 'Pump Maintenance',
      color: 'text-purple-400',
      ring: maintHealthScore,
      ringColor: '#8b5cf6',
      status: maint.state === 0 ? 'ok' : maint.state === 1 ? 'warn' : 'alert',
      statusLabel: maint.state === 0 ? 'All Good' : maint.state === 1 ? 'Check Soon' : '🔴 ',
      desc: maint.state === 0
        ? `Pump is running well. Temperature ${sensors.pumpTemp}°C and power draw are within normal limits.`
        : maint.state === 1
        ? `Pump shows early signs of wear. Temperature is ${sensors.pumpTemp}°C — schedule an inspection soon.`
        : `Pump requires immediate attention. Temperature at ${sensors.pumpTemp}°C is too high. Stop the pump and contact support.`,
    },
    {
      icon: Zap,
      title: 'Energy Optimisation',
      color: 'text-amber-400',
      ring: sensors.solarProduction,
      ringColor: '#f59e0b',
      status: sensors.solarProduction > 50 ? 'ok' : 'warn',
      statusLabel: sensors.solarProduction > 50 ? 'Peak Window Active' : 'Low Solar',
      desc: panel.needsCleaning
        ? `Solar panel may need cleaning — output is lower than expected. Next-hour estimate: ~${solarForecast.toFixed(0)}W.`
        : `Solar generating ${sensors.solarProduction}W. Estimated next hour: ~${solarForecast.toFixed(0)}W. Panel is clean.`,
    },
    {
      icon: Droplets,
      title: 'Water Quality',
      color: 'text-blue-400',
      ring: ph.contaminated ? 15 : 90,
      ringColor: ph.contaminated ? '#ef4444' : '#10b981',
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
        <BrainCircuit size={22} className="text-primary-400" />
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Smart Monitoring</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Your system is being monitored automatically — 24/7</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.title} className="card space-y-4">
            <div className="flex items-center gap-2">
              <card.icon size={16} className={card.color} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{card.title}</h3>
              <span className={`ml-auto badge-${card.status}`}>{card.statusLabel}</span>
            </div>
            <div className="flex justify-center">
              <GaugeRing value={card.ring} color={card.ringColor} size={130} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 24h chart */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>System Activity — Last 24 Hours</h3>
        <AquaLineChart data={data} lines={['leakRisk', 'battery', 'solar']} height={240} />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-water font-bold text-2xl data-value">{sensors.reservoirLevel}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Water stored</p>
        </div>
        <div className="card text-center">
          <p className="text-solar font-bold text-2xl data-value">{sensors.solarProduction}W</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Solar right now</p>
        </div>
        <div className="card text-center">
          <p className="text-battery font-bold text-2xl data-value">{sensors.batteryCharge}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Battery charge</p>
        </div>
      </div>
    </div>
  )
}
