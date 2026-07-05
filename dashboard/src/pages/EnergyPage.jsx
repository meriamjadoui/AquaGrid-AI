import React from 'react'
import { Zap, Battery, Sun, Power, Sparkles } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'
import AquaAreaChart from '../components/Charts/AreaChart'

export default function EnergyPage() {
  const { sensors, history, aiResults } = useStore()
  const data = history.slice(-24)

  const panel        = aiResults?.panel        ?? { needsCleaning: false }
  const solarForecast = aiResults?.solarForecast ?? sensors.solarProduction

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Energy Management</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Solar production · battery level · pump consumption</p>
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
          <GaugeRing value={Math.min(100, Math.max(0, solarForecast))} max={100} color="#2fb4b8" label="Next Hour" unit="W" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Solar Now" value={`${sensors.solarProduction}W`} icon={Sun} color="text-solar"
          badge={{ type: sensors.solarProduction > 40 ? 'ok' : 'warn', label: sensors.solarProduction > 40 ? 'Good' : 'Low' }}
        />
        <KpiCard label="Forecast" value={`${solarForecast.toFixed(0)}W`} icon={Sparkles} color="text-primary-400"
          badge={{ type: 'info', label: 'Next Hour' }}
        />
        <KpiCard label="Battery" value={`${sensors.batteryCharge}%`} icon={Battery} color="text-battery"
          badge={{ type: sensors.batteryCharge > 30 ? 'ok' : 'alert', label: sensors.batteryCharge > 30 ? 'OK' : 'Low!' }}
        />
        <KpiCard label="Voltage" value={`${sensors.batteryVoltage}V`} icon={Battery} color="text-battery" />
        <KpiCard label="Pump Draw" value={`${sensors.pumpPower}W`} icon={Power} color="text-pump" />
        <KpiCard
          label="Solar Panel"
          value={panel.needsCleaning ? 'Dirty' : 'Clean'}
          icon={Sun}
          color={panel.needsCleaning ? 'text-amber-400' : 'text-solar'}
          badge={{ type: panel.needsCleaning ? 'warn' : 'ok', label: panel.needsCleaning ? 'Clean Panel' : 'OK' }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Solar Production — Last 24 Hours</h3>
          <AquaAreaChart data={data} dataKey="solar" color="#f59e0b" unit="W" height={200} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Battery vs Pump — Last 24 Hours</h3>
          <AquaLineChart data={data} lines={['battery', 'pumpPower']} height={200} />
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
          <div className="flex items-start gap-3">
            <Sun size={18} className="text-solar shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Solar Forecast</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Expected solar output next hour: <span className="text-solar font-semibold">{solarForecast.toFixed(0)}W</span>.
                {solarForecast > 50
                  ? ' Good conditions — ideal time to run the pump.'
                  : ' Low solar expected — conserve battery charge.'}
              </p>
            </div>
          </div>
        </div>
        <div
          className="card"
          style={panel.needsCleaning ? { borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' } : {}}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={18} className={panel.needsCleaning ? 'text-amber-400' : 'text-primary-400'} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Solar Panel Condition</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {panel.needsCleaning
                  ? 'The solar panel may be dirty and producing less energy than expected. Wipe the panel surface to restore full output.'
                  : 'The solar panel is clean and performing well. No action needed.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
