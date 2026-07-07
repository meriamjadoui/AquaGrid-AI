import React from 'react'
import { Zap, Battery, Sun, Power, Sparkles, ArrowUpRight } from 'lucide-react'
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
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Energy Management</h2>
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>Solar production · battery level · pump consumption</p>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card flex flex-col items-center py-5">
          <GaugeRing value={sensors.solarProduction} max={100} color="#F59E0B" label="Solar (W)" unit="W" />
        </div>
        <div className="card flex flex-col items-center py-5">
          <GaugeRing value={sensors.batteryCharge} color="#10B981" label="Battery" />
        </div>
        <div className="card flex flex-col items-center py-5">
          <GaugeRing value={sensors.pumpPower} max={100} color="#8B5CF6" label="Pump (W)" unit="W" />
        </div>
        <div className="card-gradient mesh-gradient-teal-blue flex flex-col items-center py-5">
          <GaugeRing value={Math.min(100, Math.max(0, solarForecast))} max={100} color="rgba(255,255,255,0.9)" label="AI Forecast" unit="W" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
          color={panel.needsCleaning ? 'text-warn' : 'text-solar'}
          badge={{ type: panel.needsCleaning ? 'warn' : 'ok', label: panel.needsCleaning ? 'Clean Panel' : 'OK' }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Solar Production — Last 24 Hours</h3>
          <AquaAreaChart data={data} dataKey="solar" color="#F59E0B" unit="W" height={200} />
        </div>
        <div className="card">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Battery vs Pump — Last 24 Hours</h3>
          <AquaLineChart data={data} lines={['battery', 'pumpPower']} height={200} />
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))',
            border: '1px solid rgba(245,158,11,0.15)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Sun size={18} style={{ color: '#F59E0B' }} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Solar Forecast</p>
              <p className="text-xs mt-1 font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Expected solar output next hour: <span className="text-solar font-bold">{solarForecast.toFixed(0)}W</span>.
                {solarForecast > 50
                  ? ' Good conditions — ideal time to run the pump.'
                  : ' Low solar expected — conserve battery charge.'}
              </p>
            </div>
            <ArrowUpRight size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-faint)' }} />
          </div>
        </div>
        <div
          className="card"
          style={panel.needsCleaning ? {
            background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))',
            border: '1px solid rgba(245,158,11,0.15)',
          } : {}}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: panel.needsCleaning ? 'rgba(245,158,11,0.12)' : 'var(--color-primary-dim)' }}
            >
              <Sparkles size={18} style={{ color: panel.needsCleaning ? '#F59E0B' : 'var(--color-primary)' }} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Solar Panel Condition</p>
              <p className="text-xs mt-1 font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {panel.needsCleaning
                  ? 'The solar panel may be dirty and producing less energy than expected. Wipe the panel surface to restore full output.'
                  : 'The solar panel is clean and performing well. No action needed.'}
              </p>
            </div>
            <ArrowUpRight size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-faint)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
