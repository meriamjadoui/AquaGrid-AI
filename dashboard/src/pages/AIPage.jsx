import React from 'react'
import { BrainCircuit, AlertTriangle, Activity, Wrench, Droplets, Sun } from 'lucide-react'
import useStore from '../store/useStore'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'

export default function AIPage() {
  const { sensors, history, aiResults } = useStore()
  const data = history.slice(-24)

  const leak = aiResults.leak
  const maint = aiResults.maintenance
  const ph = aiResults.ph
  const panel = aiResults.panel

  // Map maintenance state (0/1/2) to health score for the gauge
  const maintHealthScore = maint.state === 0 ? sensors.pumpHealthScore
    : maint.state === 1 ? Math.min(sensors.pumpHealthScore, 70)
    : Math.min(sensors.pumpHealthScore, 45)

  // Leak risk: blend RF model result with existing sensor score
  const aiLeakRisk = leak.isLeak
    ? Math.max(sensors.leakRisk, 60)
    : Math.min(sensors.leakRisk, 30)

  const functions = [
    {
      icon: AlertTriangle,
      title: 'Leak Detection',
      color: 'text-red-400',
      ring: aiLeakRisk,
      ringColor: '#ef4444',
      status: leak.isLeak ? 'alert' : aiLeakRisk > 20 ? 'warn' : 'ok',
      statusLabel: leak.isLeak ? '⚠ Leak Detected' : aiLeakRisk > 20 ? 'Monitor' : 'No Leak',
      desc: `RF model: ${leak.isLeak ? 'LEAK' : 'clear'}. Rolling loss: ${(leak.rollingMean * 100).toFixed(1)}%. Inflow: ${sensors.flowRate} L/min.`,
      method: 'RandomForest on lossRatio + rolling stats (leak_model_v2)',
    },
    {
      icon: Wrench,
      title: 'Predictive Maintenance',
      color: 'text-purple-400',
      ring: maintHealthScore,
      ringColor: '#8b5cf6',
      status: maint.state === 0 ? 'ok' : maint.state === 1 ? 'warn' : 'alert',
      statusLabel: maint.state === 0 ? 'Pump Healthy' : maint.state === 1 ? 'Warning — Check Soon' : '🔴 Critical',
      desc: `Motor: ${sensors.pumpMotorCurrent}A, Temp: ${sensors.pumpTemp}°C, Flow: ${sensors.flowRate} L/min. Model: ${maint.label}.`,
      method: 'RandomForest (15 trees) on current/flow/temp efficiency trends',
    },
    {
      icon: Activity,
      title: 'Energy Optimization',
      color: 'text-amber-400',
      ring: sensors.solarProduction,
      ringColor: '#f59e0b',
      status: sensors.solarProduction > 50 ? 'ok' : 'warn',
      statusLabel: sensors.solarProduction > 50 ? 'Peak Window Active' : 'Off-Peak — Saving',
      desc: `Solar: ${sensors.solarProduction}W. Forecast next hour: ~${aiResults.solarForecast?.toFixed(0) ?? '?'}W. Panel ${panel.needsCleaning ? '⚠ needs cleaning' : 'clean'}.`,
      method: 'GBT solar forecast (25 trees) + panel soiling RF detector',
    },
    {
      icon: Droplets,
      title: 'Water Quality (pH)',
      color: 'text-blue-400',
      ring: ph.contaminated ? 15 : 90,
      ringColor: ph.contaminated ? '#ef4444' : '#10b981',
      status: ph.contaminated ? 'alert' : 'ok',
      statusLabel: ph.contaminated ? '⚠ Contamination Risk' : 'Quality OK',
      desc: `pH deviation: ${ph.deviation?.toFixed(3)}. Rolling mean deviation: ${ph.rollingMean?.toFixed(3)}. Safe range: 6.5–8.5.`,
      method: 'RandomForest (11 trees) on pH deviation rolling stats',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrainCircuit size={22} className="text-primary-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-100">AI Engine</h2>
          <p className="text-sm text-slate-500 mt-0.5">Live inference — 4 trained RandomForest/GBT models</p>
        </div>
      </div>

      {/* AI Function cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* Model Stack */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Deployed Model Stack</h3>
          <div className="space-y-2">
            {[
              { name: 'Leak Detector',        type: 'RandomForest (11 trees)',   device: 'Browser', file: 'leak_model_v2.js' },
              { name: 'Pump Maintenance',     type: 'RandomForest (15 trees)',   device: 'Browser', file: 'maintenance_model.js' },
              { name: 'pH / Water Quality',   type: 'RandomForest (11 trees)',   device: 'Browser', file: 'ph_model.js' },
              { name: 'Solar Forecast',       type: 'GBT (25 trees)',            device: 'Browser', file: 'energy_model_v2.js' },
              { name: 'Panel Soiling',        type: 'RandomForest (11 trees)',   device: 'Browser', file: 'energy_model_v2.js' },
            ].map(m => (
              <div key={m.name} className="flex justify-between items-center py-2 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm text-slate-300">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.type} · <span className="font-mono text-slate-600">{m.file}</span></p>
                </div>
                <span className="badge-info">{m.device}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Water-Energy Nexus</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            AquaGrid AI links water and energy in real time. The energy model forecasts solar output
            so the pump schedule can be optimised. The leak and pH models guard water quality.
            All inference runs in-browser on the trained JS models — no cloud round-trip.
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
