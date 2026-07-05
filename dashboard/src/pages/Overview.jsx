import React from 'react'
import { Droplets, Zap, Thermometer, Wifi, Power, Sun, TrendingDown, Clock, Users, Leaf, ShieldCheck } from 'lucide-react'
import useStore from '../store/useStore'
import KpiCard from '../components/UI/KpiCard'
import GaugeRing from '../components/UI/GaugeRing'
import AquaLineChart from '../components/Charts/LineChart'
import { AlertItem } from '../components/UI/AlertBadge'
import { getStatus } from '../utils/mockData'

// Derive AI-recommended pump schedule from solar forecast
function getPumpSchedule(sensors, aiResults) {
  const h = new Date().getHours()
  const solar = sensors.solarProduction
  const battery = sensors.batteryCharge
  const reservoir = sensors.reservoirLevel
  if (reservoir > 90) return { label: 'Stop Pump', reason: 'Reservoir full — overflow risk', color: '#ef4444', recommended: false }
  if (battery < 25)   return { label: 'Pause Pump', reason: 'Battery critical — conserve energy', color: '#ef4444', recommended: false }
  if (solar > 50 && battery > 50 && reservoir < 85)
    return { label: 'Run Pump', reason: `Solar peak (${solar.toFixed(0)}W) — optimal window`, color: '#3F7E44', recommended: true }
  if (h < 7 || h > 19)
    return { label: 'Defer to Morning', reason: 'No solar — use stored energy sparingly', color: '#FCC30B', recommended: false }
  return { label: 'Standby', reason: 'Waiting for solar conditions to improve', color: '#FD9D24', recommended: null }
}

export default function Overview() {
  const { sensors, history, alerts, pumpOn, togglePump, impact, aiResults } = useStore()
  const recent = history.slice(-24)
  const s = getStatus
  const schedule = getPumpSchedule(sensors, aiResults)

  // Community metrics (derived)
  const householdsServed = Math.round(sensors.totalConsumed / 18)
  const monitoringDays   = impact.monitoringDaysSeed + Math.floor(impact.pumpUptimeMin / 1440)
  const waterSavedDisplay = (impact.waterSavedL + monitoringDays * 12).toFixed(0)
  const energySavedDisplay = (impact.energySavedWh + monitoringDays * 85).toFixed(0)
  const costSaved = ((+waterSavedDisplay * 0.003) + (+energySavedDisplay * 0.0001)).toFixed(2)

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>System Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Borehole Site #1 · Monitoring {monitoringDays} days active</p>
        </div>
        <button
          onClick={togglePump}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            pumpOn
              ? 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30'
              : 'border hover:opacity-90'
          }`}
          style={pumpOn ? {} : { background: 'var(--color-primary-dim)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          <Power size={15} />
          Pump {pumpOn ? 'ON — Stop' : 'OFF — Start'}
        </button>
      </div>

      {/* ── Gauges ── */}
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

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Flow Rate" value={sensors.flowRate} unit="L/min" icon={Droplets} color="text-sky-500"
          badge={{ type: s('flowRate', sensors.flowRate) === 'ok' ? 'ok' : 'warn', label: 'Sensor OK' }} />
        <KpiCard label="Today Consumed" value={sensors.totalConsumed} unit="L" icon={Droplets} color="text-sky-500" />
        <KpiCard label="Solar Power" value={sensors.solarProduction} unit="W" icon={Zap} color="text-yellow-500"
          badge={{ type: sensors.solarProduction > 30 ? 'ok' : 'warn', label: sensors.solarProduction > 30 ? 'Producing' : 'Low' }} />
        <KpiCard label="Pump Power" value={sensors.pumpPower} unit="W" icon={Power} color="text-orange-500" />
        <KpiCard label="Pump Temp" value={sensors.pumpTemp} unit="°C" icon={Thermometer} color="text-red-400"
          badge={{ type: s('pumpTemp', sensors.pumpTemp), label: s('pumpTemp', sensors.pumpTemp) === 'ok' ? 'Normal' : 'High' }} />
        <KpiCard label="WiFi Signal" value={sensors.wifiRssi} unit="dBm" icon={Wifi} color="text-emerald-500"
          badge={{ type: sensors.wifiRssi > -65 ? 'ok' : 'warn', label: sensors.wifiRssi > -65 ? 'Strong' : 'Weak' }} />
      </div>

      {/* ── AI Pump Scheduler ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Sun size={16} style={{ color: '#FCC30B' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>AI Pump Scheduling Recommendation</h3>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(38,189,226,.15)', color: 'var(--color-primary)' }}>Live</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 min-w-0"
            style={{ background: `${schedule.color}15`, border: `1px solid ${schedule.color}40` }}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: schedule.color }} />
            <div>
              <p className="text-sm font-bold" style={{ color: schedule.color }}>{schedule.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{schedule.reason}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface-offset)' }}>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Solar</p>
              <p className="text-sm font-bold" style={{ color: '#FCC30B' }}>{sensors.solarProduction.toFixed(0)}W</p>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface-offset)' }}>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Battery</p>
              <p className="text-sm font-bold" style={{ color: '#3F7E44' }}>{sensors.batteryCharge.toFixed(0)}%</p>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface-offset)' }}>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Reservoir</p>
              <p className="text-sm font-bold" style={{ color: '#26BDE2' }}>{sensors.reservoirLevel.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>24-hour Trend</h3>
          <AquaLineChart data={recent} lines={['reservoir', 'solar', 'battery']} height={220} />
        </div>
        <div className="card flex flex-col gap-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Recent Alerts</h3>
          <div className="flex flex-col gap-2 overflow-y-auto custom-scroll" style={{ maxHeight: 260 }}>
            {alerts.length === 0
              ? <p className="text-xs py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>No active alerts — all systems normal.</p>
              : alerts.slice(0, 4).map(a => <AlertItem key={a.id} alert={a} />)
            }
          </div>
        </div>
      </div>

      {/* ── Impact Dashboard ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={16} style={{ color: '#3F7E44' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Mission Impact Dashboard</h3>
          <span className="ml-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>— estimated since deployment</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: TrendingDown, color: '#26BDE2',
              label: 'Water Losses Avoided',
              value: `${(+waterSavedDisplay).toLocaleString()} L`,
              sub: 'Leak prevention savings'
            },
            {
              icon: Zap, color: '#FCC30B',
              label: 'Energy Optimised',
              value: `${(+energySavedDisplay).toLocaleString()} Wh`,
              sub: 'Solar surplus utilised'
            },
            {
              icon: Clock, color: '#FD6925',
              label: 'Pump Uptime',
              value: `${sensors.uptime.toFixed(0)} h`,
              sub: 'Uninterrupted operation'
            },
            {
              icon: Users, color: '#FD9D24',
              label: 'Households Served',
              value: `~${householdsServed}`,
              sub: 'Est. from daily consumption'
            },
          ].map(({ icon: Icon, color, label, value, sub }) => (
            <div
              key={label}
              className="rounded-xl p-4 flex flex-col gap-2 border"
              style={{ background: `${color}10`, borderColor: `${color}30` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}25` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span className="text-[10px] font-medium leading-snug" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
              </div>
              <p className="text-lg font-black" style={{ color: 'var(--color-text)' }}>{value}</p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>
        {/* Cost savings bar */}
        <div
          className="mt-3 rounded-xl px-4 py-3 flex items-center gap-3 border flex-wrap"
          style={{ background: 'rgba(63,126,68,0.08)', borderColor: 'rgba(63,126,68,0.25)' }}
        >
          <ShieldCheck size={16} style={{ color: '#3F7E44' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              Estimated Operational Cost Savings: <span style={{ color: '#3F7E44' }}>${costSaved}</span>
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Based on water at $0.003/L and energy at $0.0001/Wh · {monitoringDays} days monitored
            </p>
          </div>
        </div>
      </div>

      {/* ── System status footer ── */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'ESP32 Uptime',    value: `${sensors.uptime.toFixed(0)}h` },
            { label: 'Battery Voltage', value: `${sensors.batteryVoltage}V` },
            { label: 'Motor Current',   value: `${sensors.pumpMotorCurrent}A` },
            { label: 'Site Status',     value: 'Online', ok: true },
          ].map(({ label, value, ok }) => (
            <div key={label}>
              <p className="kpi-label">{label}</p>
              <p className="text-base font-semibold data-value mt-1" style={{ color: ok ? '#3F7E44' : 'var(--color-text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
