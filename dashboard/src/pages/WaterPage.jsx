import React from 'react'
import { Droplets, Waves, AlertTriangle, FlaskConical } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaAreaChart from '../components/Charts/AreaChart'
import AquaLineChart from '../components/Charts/LineChart'

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
        <h2 className="text-xl font-bold text-slate-100">Water Monitoring</h2>
        <p className="text-sm text-slate-500 mt-0.5">Reservoir · flow rate · AI leak detection · pH quality</p>
      </div>

      {/* Gauges + KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center py-6">
          <GaugeRing value={sensors.reservoirLevel} color="#2fb4b8" size={150} label="Reservoir Level" />
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">Capacity: ~50L community tank</p>
            <p className={`text-xs mt-1 font-medium ${ sensors.reservoirLevel < 20 ? 'text-red-400' : sensors.reservoirLevel > 85 ? 'text-amber-400' : 'text-emerald-400' }`}>
              {sensors.reservoirLevel < 20 ? '⚠ Low — refill needed' : sensors.reservoirLevel > 85 ? '⚠ Near full' : '✓ Normal range'}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <KpiCard label="Flow Rate" value={sensors.flowRate} unit="L/min" icon={Droplets} color="text-water" />
          <KpiCard label="Today Consumed" value={sensors.totalConsumed} unit="L" icon={Waves} color="text-water" />
          <KpiCard
            label="AI Leak Risk"
            value={`${aiLeakRisk.toFixed(0)}%`}
            icon={AlertTriangle}
            color={leak.isLeak ? 'text-red-400' : aiLeakRisk > 20 ? 'text-amber-400' : 'text-emerald-400'}
            badge={{
              type: leak.isLeak ? 'alert' : aiLeakRisk > 20 ? 'warn' : 'ok',
              label: leak.isLeak ? 'Leak RF: YES' : aiLeakRisk > 20 ? 'Monitor' : 'Clear'
            }}
          />
          <KpiCard
            label="pH Quality"
            value={ph.contaminated ? 'Risk' : 'OK'}
            icon={FlaskConical}
            color={ph.contaminated ? 'text-red-400' : 'text-emerald-400'}
            badge={{
              type: ph.contaminated ? 'alert' : 'ok',
              label: ph.contaminated ? 'Contamination' : 'Safe'
            }}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Reservoir Level — 24h</h3>
          <AquaAreaChart data={data} dataKey="reservoir" color="#2fb4b8" unit="%" height={200} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Flow Rate — 24h (L/min)</h3>
          <AquaAreaChart data={data} dataKey="flow" color="#01696f" unit=" L/min" height={200} />
        </div>
      </div>

      {/* AI Leak model details */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">AI Leak Detection — Model Output</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { step: '1', title: 'Loss Ratio', desc: `Inflow ${sensors.flowRate} L/min → lossRatio computed from flow vs reservoir delta` },
            { step: '2', title: 'RF Inference', desc: `11-tree RandomForest on currentloss=${(sensors.flowRate * 0.05).toFixed(3)}, rollingMean=${leak.rollingMean?.toFixed(3)}, consecutiveHigh=${leak.consecutiveHigh}` },
            { step: '3', title: 'Decision', desc: `Model output: ${leak.isLeak ? '🔴 LEAK DETECTED' : '✅ No leak'}. Risk score: ${aiLeakRisk.toFixed(0)}%` },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3 p-3 bg-surface-bg rounded-lg border border-surface-border">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-bold shrink-0">{step}</div>
              <div>
                <p className="font-medium text-slate-200">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
