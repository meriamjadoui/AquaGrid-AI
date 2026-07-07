import React from 'react'
import { Droplets, Zap, Thermometer, Wifi, Power, Sun, TrendingDown, Clock, Users, Leaf, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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
  if (reservoir > 90) return { label: 'Stop Pump', reason: 'Reservoir full — overflow risk', color: '#EF4444', recommended: false }
  if (battery < 25)   return { label: 'Pause Pump', reason: 'Battery critical — conserve energy', color: '#EF4444', recommended: false }
  if (solar > 50 && battery > 50 && reservoir < 85)
    return { label: 'Run Pump', reason: `Solar peak (${solar.toFixed(0)}W) — optimal window`, color: '#10B981', recommended: true }
  if (h < 7 || h > 19)
    return { label: 'Defer to Morning', reason: 'No solar — use stored energy sparingly', color: '#F59E0B', recommended: false }
  return { label: 'Standby', reason: 'Waiting for solar conditions to improve', color: '#F97316', recommended: null }
}

export default function Overview() {
  const { sensors, history, alerts, pumpOn, togglePump, impact, aiResults } = useStore()
  const recent = history.slice(-24)
  const s = getStatus
  const schedule = getPumpSchedule(sensors, aiResults)

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
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>
            System Overview
          </h2>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Borehole Site #1 · Monitoring {monitoringDays} days active
          </p>
        </div>
        <button
          onClick={togglePump}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-200"
          style={{
            borderRadius: 'var(--radius-pill)',
            background: pumpOn
              ? 'rgba(239,68,68,0.10)'
              : 'linear-gradient(135deg, #4F7DF3, #56A7F5)',
            color: pumpOn ? '#DC2626' : '#ffffff',
            border: pumpOn ? '1px solid rgba(239,68,68,0.25)' : 'none',
            boxShadow: pumpOn ? 'none' : '0 4px 16px rgba(79,125,243,0.30)',
          }}
        >
          <Power size={15} strokeWidth={2} />
          Pump {pumpOn ? 'ON — Stop' : 'OFF — Start'}
        </button>
      </div>

      {/* ── Top metrics — mesh gradient cards + gauges ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reservoir — teal-blue gradient */}
        <div
          className="card-gradient mesh-gradient-teal-blue"
          style={{ minHeight: 160 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Reservoir</p>
          <p className="text-4xl font-extrabold mt-2 tracking-tight">{sensors.reservoirLevel.toFixed(0)}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold opacity-80">
            {sensors.reservoirLevel > 50
              ? <><ArrowUpRight size={14} /> Good level</>
              : <><ArrowDownRight size={14} /> Needs attention</>
            }
          </div>
          <div className="mt-3 progress-bar" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <div className="progress-bar-fill" style={{ width: `${sensors.reservoirLevel}%`, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>

        {/* Battery — green gradient */}
        <div
          className="card-gradient mesh-gradient-green"
          style={{ minHeight: 160 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Battery</p>
          <p className="text-4xl font-extrabold mt-2 tracking-tight">{sensors.batteryCharge.toFixed(0)}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold opacity-80">
            {sensors.batteryCharge > 50
              ? <><ArrowUpRight size={14} /> Charged</>
              : <><ArrowDownRight size={14} /> Low charge</>
            }
          </div>
          <div className="mt-3 progress-bar" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <div className="progress-bar-fill" style={{ width: `${sensors.batteryCharge}%`, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>

        {/* Pump Health — orange-pink gradient */}
        <div
          className="card-gradient mesh-gradient-orange-pink"
          style={{ minHeight: 160 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Pump Health</p>
          <p className="text-4xl font-extrabold mt-2 tracking-tight">{sensors.pumpHealthScore.toFixed(0)}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold opacity-80">
            {sensors.pumpHealthScore > 70
              ? <><ArrowUpRight size={14} /> Healthy</>
              : <><ArrowDownRight size={14} /> Check needed</>
            }
          </div>
          <div className="mt-3 progress-bar" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <div className="progress-bar-fill" style={{ width: `${sensors.pumpHealthScore}%`, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>

        {/* Leak Risk — purple gradient */}
        <div
          className="card-gradient mesh-gradient-purple"
          style={{ minHeight: 160 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Leak Risk</p>
          <p className="text-4xl font-extrabold mt-2 tracking-tight">{sensors.leakRisk.toFixed(0)}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold opacity-80">
            {sensors.leakRisk < 30
              ? <><ArrowDownRight size={14} /> Low risk</>
              : <><ArrowUpRight size={14} /> Monitor closely</>
            }
          </div>
          <div className="mt-3 progress-bar" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <div className="progress-bar-fill" style={{ width: `${sensors.leakRisk}%`, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Flow Rate" value={sensors.flowRate} unit="L/min" icon={Droplets} color="text-water"
          badge={{ type: s('flowRate', sensors.flowRate) === 'ok' ? 'ok' : 'warn', label: 'Sensor OK' }} />
        <KpiCard label="Today Consumed" value={sensors.totalConsumed} unit="L" icon={Droplets} color="text-water" />
        <KpiCard label="Solar Power" value={sensors.solarProduction} unit="W" icon={Zap} color="text-solar"
          badge={{ type: sensors.solarProduction > 30 ? 'ok' : 'warn', label: sensors.solarProduction > 30 ? 'Producing' : 'Low' }} />
        <KpiCard label="Pump Power" value={sensors.pumpPower} unit="W" icon={Power} color="text-pump" />
        <KpiCard label="Pump Temp" value={sensors.pumpTemp} unit="°C" icon={Thermometer} color="text-danger"
          badge={{ type: s('pumpTemp', sensors.pumpTemp), label: s('pumpTemp', sensors.pumpTemp) === 'ok' ? 'Normal' : 'High' }} />
        <KpiCard label="WiFi Signal" value={sensors.wifiRssi} unit="dBm" icon={Wifi} color="text-battery"
          badge={{ type: sensors.wifiRssi > -65 ? 'ok' : 'warn', label: sensors.wifiRssi > -65 ? 'Strong' : 'Weak' }} />
      </div>

      {/* ── AI Pump Scheduler ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.10)' }}>
            <Sun size={16} style={{ color: '#F59E0B' }} strokeWidth={1.8} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>AI Pump Scheduling</h3>
          <span
            className="ml-auto text-[10px] font-bold px-3 py-1 rounded-full"
            style={{
              background: 'var(--color-primary-dim)',
              color: 'var(--color-primary)',
            }}
          >
            Live
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0"
            style={{
              background: `${schedule.color}10`,
              border: `1px solid ${schedule.color}30`,
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div className="w-3 h-3 rounded-full shrink-0 animate-pulse" style={{ background: schedule.color }} />
            <div>
              <p className="text-sm font-bold" style={{ color: schedule.color }}>{schedule.label}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>{schedule.reason}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Solar', value: `${sensors.solarProduction.toFixed(0)}W`, color: '#F59E0B' },
              { label: 'Battery', value: `${sensors.batteryCharge.toFixed(0)}%`, color: '#10B981' },
              { label: 'Reservoir', value: `${sensors.reservoirLevel.toFixed(0)}%`, color: '#56A7F5' },
            ].map(item => (
              <div key={item.label} className="px-4 py-2.5" style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-faint)' }}>{item.label}</p>
                <p className="text-sm font-extrabold mt-0.5" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>24-hour Trend</h3>
            <span className="badge-info">Live Data</span>
          </div>
          <AquaLineChart data={recent} lines={['reservoir', 'solar', 'battery']} height={240} />
        </div>
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Recent Alerts</h3>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-faint)' }}>{alerts.length} total</span>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto custom-scroll" style={{ maxHeight: 280 }}>
            {alerts.length === 0
              ? <p className="text-xs py-6 text-center font-medium" style={{ color: 'var(--color-text-muted)' }}>No active alerts — all systems normal.</p>
              : alerts.slice(0, 4).map(a => <AlertItem key={a.id} alert={a} />)
            }
          </div>
        </div>
      </div>

      {/* ── Impact Dashboard ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.10)' }}>
            <Leaf size={16} style={{ color: '#10B981' }} strokeWidth={1.8} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Mission Impact</h3>
          <span className="ml-1 text-xs font-medium" style={{ color: 'var(--color-text-faint)' }}>Since deployment</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              icon: TrendingDown, gradient: 'var(--gradient-teal-blue)',
              label: 'Water Saved',
              value: `${(+waterSavedDisplay).toLocaleString()} L`,
              sub: 'Leak prevention savings'
            },
            {
              icon: Zap, gradient: 'var(--gradient-warm)',
              label: 'Energy Optimised',
              value: `${(+energySavedDisplay).toLocaleString()} Wh`,
              sub: 'Solar surplus utilised'
            },
            {
              icon: Clock, gradient: 'var(--gradient-orange-pink)',
              label: 'Pump Uptime',
              value: `${sensors.uptime.toFixed(0)} h`,
              sub: 'Uninterrupted operation'
            },
            {
              icon: Users, gradient: 'var(--gradient-purple-blue)',
              label: 'Households',
              value: `~${householdsServed}`,
              sub: 'Est. from consumption'
            },
          ].map(({ icon: Icon, gradient, label, value, sub }) => (
            <div
              key={label}
              className="card-gradient"
              style={{ background: gradient }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <Icon size={14} style={{ color: '#fff' }} strokeWidth={2} />
                </div>
              </div>
              <p className="text-xl font-extrabold">{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80 mt-1">{label}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        {/* Cost savings bar */}
        <div
          className="mt-4 px-5 py-4 flex items-center gap-3 flex-wrap"
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <ShieldCheck size={16} style={{ color: '#10B981' }} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Estimated Cost Savings: <span style={{ color: '#10B981' }}>${costSaved}</span>
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
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
              <p className="text-base font-bold data-value mt-1.5" style={{ color: ok ? '#10B981' : 'var(--color-text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
