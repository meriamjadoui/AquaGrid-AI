import React from 'react'
import { Droplets, Zap, BrainCircuit, Thermometer, Wifi, Power } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'
import { AlertItem } from '../components/UI/AlertBadge'
import { getStatus } from '../utils/mockData'

export default function Overview() {
  const { sensors, history, alerts, pumpOn, togglePump } = useStore()
  const recent = history.slice(-24)

  const s = getStatus

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">System Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">Real-time monitoring — Borehole Site #1, Tunis</p>
        </div>
        <button
          onClick={togglePump}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            pumpOn
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30'
          }`}
        >
          <Power size={15} />
          Pump {pumpOn ? 'ON — Stop' : 'OFF — Start'}
        </button>
      </div>

      {/* Gauges row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.reservoirLevel} color="#2fb4b8" label="Reservoir" />
        </div>
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.batteryCharge} color="#10b981" label="Battery" />
        </div>
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.pumpHealthScore} color="#8b5cf6" label="Pump Health" />
        </div>
        <div className="card flex flex-col items-center gap-2 py-4">
          <GaugeRing value={sensors.leakRisk} color="#ef4444" label="Leak Risk" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Flow Rate" value={sensors.flowRate} unit="L/min"
          icon={Droplets} color="text-water"
          badge={{ type: s('flowRate', sensors.flowRate) === 'ok' ? 'ok' : 'warn', label: 'Sensor OK' }}
        />
        <KpiCard
          label="Today Consumed" value={sensors.totalConsumed} unit="L"
          icon={Droplets} color="text-water"
        />
        <KpiCard
          label="Solar Power" value={sensors.solarProduction} unit="W"
          icon={Zap} color="text-solar"
          badge={{ type: sensors.solarProduction > 30 ? 'ok' : 'warn', label: sensors.solarProduction > 30 ? 'Producing' : 'Low' }}
        />
        <KpiCard
          label="Pump Power" value={sensors.pumpPower} unit="W"
          icon={Power} color="text-pump"
        />
        <KpiCard
          label="Pump Temp" value={sensors.pumpTemp} unit="°C"
          icon={Thermometer} color="text-warn"
          badge={{ type: s('pumpTemp', sensors.pumpTemp), label: s('pumpTemp', sensors.pumpTemp) === 'ok' ? 'Normal' : 'High' }}
        />
        <KpiCard
          label="WiFi Signal" value={sensors.wifiRssi} unit="dBm"
          icon={Wifi} color="text-primary-400"
          badge={{ type: sensors.wifiRssi > -65 ? 'ok' : 'warn', label: sensors.wifiRssi > -65 ? 'Strong' : 'Weak' }}
        />
      </div>

      {/* Charts + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 24h trend chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">24-hour Trend</h3>
          <AquaLineChart data={recent} lines={['reservoir', 'solar', 'battery']} height={220} />
        </div>

        {/* Recent alerts */}
        <div className="card flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-300">Recent Alerts</h3>
          <div className="flex flex-col gap-2 overflow-y-auto custom-scroll" style={{ maxHeight: 260 }}>
            {alerts.slice(0, 4).map(a => <AlertItem key={a.id} alert={a} />)}
          </div>
        </div>
      </div>

      {/* System status footer */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'ESP32 Uptime', value: `${sensors.uptime}h` },
            { label: 'Battery Voltage', value: `${sensors.batteryVoltage}V` },
            { label: 'Motor Current', value: `${sensors.pumpMotorCurrent}A` },
            { label: 'Site Status', value: 'Online', ok: true },
          ].map(({ label, value, ok }) => (
            <div key={label}>
              <p className="kpi-label">{label}</p>
              <p className={`text-base font-semibold data-value mt-1 ${ ok ? 'text-emerald-400' : 'text-slate-200' }`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
