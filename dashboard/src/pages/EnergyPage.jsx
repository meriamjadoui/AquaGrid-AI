import React from 'react'
import { Zap, Battery, Sun, Power } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'
import AquaAreaChart from '../components/Charts/AreaChart'

export default function EnergyPage() {
  const { sensors, history } = useStore()
  const data = history.slice(-24)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Energy Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">Solar production, battery storage, pump consumption</p>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card flex flex-col items-center py-4">
          <GaugeRing value={sensors.solarProduction} max={100} color="#f59e0b" label="Solar (W)" unit="W" />
        </div>
        <div className="card flex flex-col items-center py-4">
          <GaugeRing value={sensors.batteryCharge} color="#10b981" label="Battery" />
        </div>
        <div className="card flex flex-col items-center py-4">
          <GaugeRing value={sensors.pumpPower} max={100} color="#8b5cf6" label="Pump (W)" unit="W" />
        </div>
        <div className="card flex flex-col items-center py-4">
          <GaugeRing
            value={Math.max(0, sensors.solarProduction - sensors.pumpPower)}
            max={100} color="#2fb4b8" label="Net Energy" unit="W"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Solar Panel" value={`${sensors.solarProduction}W`} icon={Sun} color="text-solar"
          badge={{ type: sensors.solarProduction > 40 ? 'ok' : 'warn', label: sensors.solarProduction > 40 ? 'Good' : 'Low' }}
        />
        <KpiCard label="Battery SoC" value={`${sensors.batteryCharge}%`} icon={Battery} color="text-battery"
          badge={{ type: sensors.batteryCharge > 30 ? 'ok' : 'alert', label: sensors.batteryCharge > 30 ? 'OK' : 'Low!' }}
        />
        <KpiCard label="Battery Voltage" value={`${sensors.batteryVoltage}V`} icon={Battery} color="text-battery" />
        <KpiCard label="Pump Draw" value={`${sensors.pumpPower}W`} icon={Power} color="text-pump" />
        <KpiCard label="Motor Current" value={`${sensors.pumpMotorCurrent}A`} icon={Zap} color="text-pump" />
        <KpiCard label="INA219 Sensor" value="Active" icon={Zap} color="text-primary-400"
          badge={{ type: 'ok', label: 'Online' }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Solar Production — 24h (W)</h3>
          <AquaAreaChart data={data} dataKey="solar" color="#f59e0b" unit="W" height={200} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Battery vs Pump Power — 24h</h3>
          <AquaLineChart data={data} lines={['battery', 'pumpPower']} height={200} />
        </div>
      </div>

      {/* AI Optimization tip */}
      <div className="card border-solar/20 bg-solar/5">
        <div className="flex items-start gap-3">
          <Sun size={18} className="text-solar shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-200">AI Energy Optimization</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Peak solar window predicted: <span className="text-solar font-mono">10:30 — 14:45</span>.
              Recommend scheduling pump cycles during this window to maximize solar utilization and preserve battery.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
