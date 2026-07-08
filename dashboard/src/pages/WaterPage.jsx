import React from 'react'
import { Droplets, Waves, AlertTriangle, FlaskConical, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaAreaChart from '../components/Charts/AreaChart'

export default function WaterPage() {
  const { sensors, history, aiResults } = useStore()
  const data = history.slice(-24)

  const leak = aiResults?.leak ?? { isLeak: false, confidence: 0 }
  const ph   = aiResults?.ph   ?? { contaminated: false, deviationScore: 0 }

  const aiLeakRisk = leak.isLeak
    ? Math.max(sensors.leakRisk, 60)
    : Math.min(sensors.leakRisk, 30)
  const leakSourceLabel = leak.source === 'ml-model'
    ? 'AI Model'
    : leak.source === 'rule-based-fallback'
    ? 'Rule-based'
    : null
  const leakConfidence = Number.isFinite(Number(leak.confidence))
    ? Math.max(0, Math.min(100, Number(leak.confidence) <= 1 ? Number(leak.confidence) * 100 : Number(leak.confidence)))
    : null
  const leakBadgeLabel = `${leak.isLeak ? 'Leak Detected' : aiLeakRisk > 20 ? 'Monitor' : 'All Clear'}${leakSourceLabel ? ` · ${leakSourceLabel}${leakConfidence !== null ? ` · ${Math.round(leakConfidence)}% confidence` : ''}` : ''}`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Water Monitoring</h2>
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Reservoir level · water flow · leak detection · water quality
        </p>
      </div>

      {/* Gauge + KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card flex flex-col items-center py-8">
          <GaugeRing value={sensors.reservoirLevel} color="#56A7F5" size={160} strokeWidth={12} label="Reservoir Level" />
          <div className="mt-5 text-center">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Community tank — ~50L capacity</p>
            <div className="mt-2">
              {sensors.reservoirLevel < 20 ? (
                <span className="badge-alert">⚠ Low — refill needed</span>
              ) : sensors.reservoirLevel > 85 ? (
                <span className="badge-warn">⚠ Almost full</span>
              ) : (
                <span className="badge-ok">✓ Good level</span>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <KpiCard label="Flow Rate" value={sensors.flowRate} unit="L/min" icon={Droplets} color="text-water" />
          <KpiCard label="Used Today" value={sensors.totalConsumed} unit="L" icon={Waves} color="text-water" />
          <KpiCard
            label="Leak Risk"
            value={`${aiLeakRisk.toFixed(0)}%`}
            icon={AlertTriangle}
            color={leak.isLeak ? 'text-danger' : aiLeakRisk > 20 ? 'text-warn' : 'text-battery'}
            badge={{
              type: leak.isLeak ? 'alert' : aiLeakRisk > 20 ? 'warn' : 'ok',
              label: leakBadgeLabel
            }}
          />
          <KpiCard
            label="Water Quality"
            value={ph.contaminated ? 'At Risk' : 'Safe'}
            icon={FlaskConical}
            color={ph.contaminated ? 'text-danger' : 'text-battery'}
            badge={{
              type: ph.contaminated ? 'alert' : 'ok',
              label: ph.contaminated ? 'Check Water' : 'Safe to Use'
            }}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Reservoir Level — Last 24 Hours</h3>
          <AquaAreaChart data={data} dataKey="reservoir" color="#56A7F5" unit="%" height={200} />
        </div>
        <div className="card">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Water Flow — Last 24 Hours</h3>
          <AquaAreaChart data={data} dataKey="flow" color="#4F7DF3" unit=" L/min" height={200} />
        </div>
      </div>

      {/* Status summary */}
      <div className="card">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Current Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              className="flex gap-3 p-4 transition-all duration-200"
              style={{
                background: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div className={`w-1.5 rounded-full shrink-0 ${item.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{item.title}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
              </div>
              <div className="ml-auto shrink-0">
                {item.ok
                  ? <ArrowUpRight size={16} className="text-emerald-500" />
                  : <ArrowDownRight size={16} className="text-red-500" />
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
