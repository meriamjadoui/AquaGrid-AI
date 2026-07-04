import React from 'react'
import { Droplets, Waves, AlertTriangle } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaAreaChart from '../components/Charts/AreaChart'
import AquaLineChart from '../components/Charts/LineChart'

export default function WaterPage() {
  const { sensors, history } = useStore()
  const data = history.slice(-24)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Water Monitoring</h2>
        <p className="text-sm text-slate-500 mt-0.5">Reservoir, flow rate, leak detection</p>
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
            label="Leak Risk (AI)"
            value={`${sensors.leakRisk}%`}
            icon={AlertTriangle}
            color={sensors.leakRisk > 40 ? 'text-red-400' : sensors.leakRisk > 20 ? 'text-amber-400' : 'text-emerald-400'}
            badge={{
              type: sensors.leakRisk > 40 ? 'alert' : sensors.leakRisk > 20 ? 'warn' : 'ok',
              label: sensors.leakRisk > 40 ? 'High Risk' : sensors.leakRisk > 20 ? 'Monitor' : 'No Leak'
            }}
          />
          <KpiCard label="Flow Sensor" value="YF-S201" icon={Droplets} color="text-slate-400"
            badge={{ type: 'ok', label: 'Calibrated' }}
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

      {/* Leak detection logic explainer */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">AI Leak Detection Logic</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { step: '1', title: 'Measure Inflow', desc: `Flow sensor reads ${sensors.flowRate} L/min entering reservoir` },
            { step: '2', title: 'Compare Level Δ', desc: 'AI compares expected vs actual reservoir level change' },
            { step: '3', title: 'Alert if Anomaly', desc: `High flow + stable level → leak signal (current risk: ${sensors.leakRisk}%)` },
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
