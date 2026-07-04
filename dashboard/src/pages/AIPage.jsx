import React from 'react'
import { BrainCircuit, AlertTriangle, Activity, Wrench } from 'lucide-react'
import useStore from '../store/useStore'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'

export default function AIPage() {
  const { sensors, history } = useStore()
  const data = history.slice(-24)

  const functions = [
    {
      icon: AlertTriangle,
      title: 'Leak Detection',
      color: 'text-red-400',
      ring: sensors.leakRisk,
      ringColor: '#ef4444',
      status: sensors.leakRisk > 40 ? 'alert' : sensors.leakRisk > 20 ? 'warn' : 'ok',
      statusLabel: sensors.leakRisk > 40 ? 'Leak Likely' : sensors.leakRisk > 20 ? 'Monitor' : 'No Leak Detected',
      desc: `Compares inflow (${sensors.flowRate} L/min) vs reservoir delta. Confidence: ${(100 - sensors.leakRisk).toFixed(0)}%`,
      method: 'Flow vs Level delta analysis + threshold model',
    },
    {
      icon: Wrench,
      title: 'Predictive Maintenance',
      color: 'text-purple-400',
      ring: sensors.pumpHealthScore,
      ringColor: '#8b5cf6',
      status: sensors.pumpHealthScore > 80 ? 'ok' : sensors.pumpHealthScore > 60 ? 'warn' : 'alert',
      statusLabel: sensors.pumpHealthScore > 80 ? 'Pump Healthy' : 'Check Required',
      desc: `Motor current ${sensors.pumpMotorCurrent}A, temp ${sensors.pumpTemp}°C — trend analysis running`,
      method: 'Anomaly detection on current draw + temperature drift',
    },
    {
      icon: Activity,
      title: 'Energy Optimization',
      color: 'text-amber-400',
      ring: sensors.solarProduction,
      ringColor: '#f59e0b',
      status: sensors.solarProduction > 50 ? 'ok' : 'warn',
      statusLabel: sensors.solarProduction > 50 ? 'Peak Window Active' : 'Off-Peak — Saving',
      desc: `Solar: ${sensors.solarProduction}W. AI recommends pump schedule 10:30–14:45 for optimal yield.`,
      method: 'Time-series solar prediction + pump scheduling algorithm',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrainCircuit size={22} className="text-primary-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-100">AI Engine</h2>
          <p className="text-sm text-slate-500 mt-0.5">Edge AI on ESP32 + Cloud analytics</p>
        </div>
      </div>

      {/* AI Function cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {functions.map(fn => (
          <div key={fn.title} className="card space-y-4">
            <div className="flex items-center gap-2">
              <fn.icon size={16} className={fn.color} />
              <h3 className="text-sm font-semibold text-slate-200">{fn.title}</h3>
              <span className={`ml-auto badge-${fn.status}`}>{fn.statusLabel}</span>
            </div>
            <div className="flex justify-center">
              <GaugeRing value={fn.ring} color={fn.ringColor} size={130} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{fn.desc}</p>
            <div className="pt-2 border-t border-surface-border">
              <p className="text-xs text-slate-600"><span className="text-slate-500">Method:</span> {fn.method}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-signal chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">AI Signals — 24h Overview</h3>
        <AquaLineChart data={data} lines={['leakRisk', 'battery', 'solar']} height={240} />
      </div>

      {/* Edge AI info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Model Stack</h3>
          <div className="space-y-2">
            {[
              { name: 'Leak Detector', type: 'Rule-based + Threshold', device: 'ESP32 Edge' },
              { name: 'Pump Health', type: 'Anomaly Detection (IsolationForest)', device: 'Cloud' },
              { name: 'Solar Forecast', type: 'Time-series (Prophet/LSTM)', device: 'Cloud' },
            ].map(m => (
              <div key={m.name} className="flex justify-between items-center py-2 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm text-slate-300">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.type}</p>
                </div>
                <span className="badge-info">{m.device}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Water-Energy Nexus</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            AquaGrid AI is unique in linking both systems. When solar peaks, the pump automatically fills the reservoir.
            When the battery is low, pump cycles are deferred. This coordination is what makes it efficient.
          </p>
          <div className="flex gap-3 text-xs">
            <div className="flex-1 p-2 bg-surface-bg rounded-lg border border-surface-border text-center">
              <p className="text-water font-bold text-lg data-value">{sensors.reservoirLevel}%</p>
              <p className="text-slate-500">Water stored</p>
            </div>
            <div className="flex-1 p-2 bg-surface-bg rounded-lg border border-surface-border text-center">
              <p className="text-solar font-bold text-lg data-value">{sensors.solarProduction}W</p>
              <p className="text-slate-500">Solar now</p>
            </div>
            <div className="flex-1 p-2 bg-surface-bg rounded-lg border border-surface-border text-center">
              <p className="text-battery font-bold text-lg data-value">{sensors.batteryCharge}%</p>
              <p className="text-slate-500">Battery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
