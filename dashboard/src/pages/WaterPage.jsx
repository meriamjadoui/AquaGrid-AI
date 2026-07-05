import React from 'react'
import { Droplets, Waves, AlertTriangle, FlaskConical } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaAreaChart from '../components/Charts/AreaChart'

export default function WaterPage() {
  const { sensors, history, aiResults } = useStore()
  const data = history.slice(-24)

  const leak = aiResults.leak
  const ph   = aiResults.ph

  const aiLeakRisk = leak.isLeak
    ? Math.max(sensors.leakRisk, 60)
    : Math.min(sensors.leakRisk, 30)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Water Monitoring</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Reservoir level · water flow · leak detection · water quality
        </p>
      </div>

      {/* Gauge + KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center py-6">
          <GaugeRing value={sensors.reservoirLevel} color="#2fb4b8" size={150} label="Reservoir Level" />
          <div className="mt-4 text-center">
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Community tank — ~50L capacity</p>
            <p className={`text-xs mt-1 font-medium ${
              sensors.reservoirLevel < 20 ? 'text-red-400'
              : sensors.reservoirLevel > 85 ? 'text-amber-400'
              : 'text-emerald-400'
            }`}>
              {sensors.reservoirLevel < 20 ? '⚠ Low — refill needed'
               : sensors.reservoirLevel > 85 ? '⚠ Almost full'
               : '✓ Good level'}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <KpiCard label="Flow Rate" value={sensors.flowRate} unit="L/min" icon={Droplets} color="text-water" />
          <KpiCard label="Used Today" value={sensors.totalConsumed} unit="L" icon={Waves} color="text-water" />
          <KpiCard
            label="Leak Risk"
            value={`${aiLeakRisk.toFixed(0)}%`}
            icon={AlertTriangle}
            color={leak.isLeak ? 'text-red-400' : aiLeakRisk > 20 ? 'text-amber-400' : 'text-emerald-400'}
            badge={{
              type: leak.isLeak ? 'alert' : aiLeakRisk > 20 ? 'warn' : 'ok',
              label: leak.isLeak ? 'Leak Detected' : aiLeakRisk > 20 ? 'Monitor' : 'All Clear'
            }}
          />
          <KpiCard
            label="Water Quality"
            value={ph.contaminated ? 'At Risk' : 'Safe'}
            icon={FlaskConical}
            color={ph.contaminated ? 'text-red-400' : 'text-emerald-400'}
            badge={{
              type: ph.contaminated ? 'alert' : 'ok',
              label: ph.contaminated ? 'Check Water' : 'Safe to Use'
            }}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Reservoir Level — Last 24 Hours</h3>
          <AquaAreaChart data={data} dataKey="reservoir" color="#2fb4b8" unit="%" height={200} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Water Flow — Last 24 Hours</h3>
          <AquaAreaChart data={data} dataKey="flow" color="#01696f" unit=" L/min" height={200} />
        </div>
      </div>

      {/* Status summary */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Current Status Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              ok: sensors.reservoirLevel >= 20,
              title: 'Reservoir',
              desc: sensors.reservoirLevel < 20
                ? 'Low — schedule a refill as soon as possible.'
                : `At ${sensors.reservoirLevel}% — no action needed.`,
            },
            {
              ok: !leak.isLeak,
              title: 'Pipeline',
              desc: leak.isLeak
                ? 'Possible leak detected. Inspect the pipeline.'
                : 'No leaks detected. Pipeline is healthy.',
            },
            {
              ok: !ph.contaminated,
              title: 'Water Quality',
              desc: ph.contaminated
                ? 'Quality outside safe range. Do not use for drinking.'
                : 'Safe for drinking. Quality is within normal range.',
            },
          ].map(item => (
            <div
              key={item.title}
              className="flex gap-3 p-3 rounded-lg"
              style={{
                background: 'var(--color-surface-bg)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div className={`w-2 rounded-full shrink-0 ${item.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
