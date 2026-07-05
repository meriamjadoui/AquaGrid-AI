import React from 'react'
import { Droplets, Zap, Thermometer, Wifi, Power } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'
import { AlertItem } from '../components/UI/AlertBadge'
import { getStatus } from '../utils/mockData'

const SDGS = [
  {
    n: 6, color: '#26BDE2', label: 'Clean Water & Sanitation',
    desc: 'Real-time reservoir & pipeline monitoring reduces water loss.'
  },
  {
    n: 7, color: '#FCC30B', label: 'Affordable & Clean Energy',
    desc: 'Solar tracking and battery analytics maximise renewable yield.'
  },
  {
    n: 9, color: '#FD6925', label: 'Industry, Innovation & Infrastructure',
    desc: 'AI-driven predictive maintenance keeps rural infrastructure resilient.'
  },
  {
    n: 11, color: '#FD9D24', label: 'Sustainable Cities & Communities',
    desc: 'Autonomous pump scheduling ensures equitable water distribution.'
  },
  {
    n: 13, color: '#3F7E44', label: 'Climate Action',
    desc: 'Reduced leakage and optimal energy use lower the carbon footprint.'
  },
]

export default function Overview() {
  const { sensors, history, alerts, pumpOn, togglePump } = useStore()
  const recent = history.slice(-24)
  const s = getStatus

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>System Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Real-time monitoring — Borehole Site #1, Rural Africa</p>
        </div>
        <button
          onClick={togglePump}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            pumpOn
              ? 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30'
              : 'border hover:opacity-90'
          }`}
          style={pumpOn ? {} : {
            background: 'var(--color-primary-dim)',
            color: 'var(--color-primary)',
            borderColor: 'var(--color-primary)'
          }}
        >
          <Power size={15} />
          Pump {pumpOn ? 'ON — Stop' : 'OFF — Start'}
        </button>
      </div>

      {/* Gauges row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.reservoirLevel} color="#26BDE2" label="Reservoir" />
        </div>
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.batteryCharge} color="#3F7E44" label="Battery" />
        </div>
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.pumpHealthScore} color="#FD6925" label="Pump Health" />
        </div>
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.leakRisk} color="#ef4444" label="Leak Risk" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Flow Rate" value={sensors.flowRate} unit="L/min"
          icon={Droplets} color="text-sky-500"
          badge={{ type: s('flowRate', sensors.flowRate) === 'ok' ? 'ok' : 'warn', label: 'Sensor OK' }}
        />
        <KpiCard label="Today Consumed" value={sensors.totalConsumed} unit="L" icon={Droplets} color="text-sky-500" />
        <KpiCard
          label="Solar Power" value={sensors.solarProduction} unit="W"
          icon={Zap} color="text-yellow-500"
          badge={{ type: sensors.solarProduction > 30 ? 'ok' : 'warn', label: sensors.solarProduction > 30 ? 'Producing' : 'Low' }}
        />
        <KpiCard label="Pump Power" value={sensors.pumpPower} unit="W" icon={Power} color="text-orange-500" />
        <KpiCard
          label="Pump Temp" value={sensors.pumpTemp} unit="°C"
          icon={Thermometer} color="text-red-400"
          badge={{ type: s('pumpTemp', sensors.pumpTemp), label: s('pumpTemp', sensors.pumpTemp) === 'ok' ? 'Normal' : 'High' }}
        />
        <KpiCard
          label="WiFi Signal" value={sensors.wifiRssi} unit="dBm"
          icon={Wifi} color="text-emerald-500"
          badge={{ type: sensors.wifiRssi > -65 ? 'ok' : 'warn', label: sensors.wifiRssi > -65 ? 'Strong' : 'Weak' }}
        />
      </div>

      {/* Charts + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>24-hour Trend</h3>
          <AquaLineChart data={recent} lines={['reservoir', 'solar', 'battery']} height={220} />
        </div>
        <div className="card flex flex-col gap-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Recent Alerts</h3>
          <div className="flex flex-col gap-2 overflow-y-auto custom-scroll" style={{ maxHeight: 260 }}>
            {alerts.slice(0, 4).map(a => <AlertItem key={a.id} alert={a} />)}
          </div>
        </div>
      </div>

      {/* SDG Impact Panel */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>UN SDG Alignment</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>AquaWise directly contributes to 5 Sustainable Development Goals</p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(38,189,226,.15)', color: 'var(--color-primary)' }}
          >
            Africa · Rural Water Infrastructure
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SDGS.map(({ n, color, label, desc }) => (
            <div
              key={n}
              className="rounded-xl p-3 flex flex-col gap-2 border"
              style={{
                background: `${color}10`,
                borderColor: `${color}35`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ background: color }}
                >
                  {n}
                </span>
                <span className="text-xs font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>{label}</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System status footer */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'ESP32 Uptime',    value: `${sensors.uptime}h` },
            { label: 'Battery Voltage', value: `${sensors.batteryVoltage}V` },
            { label: 'Motor Current',   value: `${sensors.pumpMotorCurrent}A` },
            { label: 'Site Status',     value: 'Online', ok: true },
          ].map(({ label, value, ok }) => (
            <div key={label}>
              <p className="kpi-label">{label}</p>
              <p className="text-base font-semibold data-value mt-1" style={{ color: ok ? '#3F7E44' : 'var(--color-text)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
