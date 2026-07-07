import { create } from 'zustand'
import { generateSensorData, generateHistoryData, tickSensors, appendHistory } from '../utils/mockData'
import useAuditLog from './useAuditLog'

const TICK_MS    = 3000
const MAX_ALERTS = 20

// ── Alert rules ──────────────────────────────────────────────────────────────
const ALERT_RULES = [
  {
    key: 'leak_detected',
    check: (s, ai) => ai.leak?.isLeak,
    type: 'alert',
    message: (s) => `⚠ Leak detected — flow rate ${s.flowRate} L/min, rolling loss ${(s.flowRate * 0.05).toFixed(2)} L/min. Inspect pipeline immediately.`,
    audit: (s) => ({ category: 'Water', severity: 'critical', title: 'Leak detected', detail: `Flow rate ${s.flowRate} L/min. Inspect pipeline immediately.` }),
  },
  {
    key: 'leak_clear',
    check: (s, ai) => !ai.leak?.isLeak && ai.leak?.rollingMean < 0.05,
    type: 'ok',
    message: () => '✓ Leak risk cleared — pipeline flow normal.',
    audit: () => ({ category: 'Water', severity: 'ok', title: 'Leak cleared', detail: 'Pipeline flow returned to normal.' }),
  },
  {
    key: 'pump_critical',
    check: (s, ai) => ai.maintenance?.state === 2,
    type: 'alert',
    message: (s) => `🔴 Pump critical — motor current ${s.pumpMotorCurrent}A, temp ${s.pumpTemp}°C. Immediate maintenance required.`,
    audit: (s) => ({ category: 'Pump', severity: 'critical', title: 'Pump critical', detail: `Temperature ${s.pumpTemp}°C, current ${s.pumpMotorCurrent}A.` }),
  },
  {
    key: 'pump_warning',
    check: (s, ai) => ai.maintenance?.state === 1,
    type: 'warn',
    message: (s) => `Pump health warning — temp ${s.pumpTemp}°C, current ${s.pumpMotorCurrent}A. Schedule inspection soon.`,
    audit: (s) => ({ category: 'Pump', severity: 'warning', title: 'Pump health warning', detail: `Temp ${s.pumpTemp}°C, current ${s.pumpMotorCurrent}A.` }),
  },
  {
    key: 'pump_healthy',
    check: (s, ai) => ai.maintenance?.state === 0 && s.pumpHealthScore > 85,
    type: 'ok',
    message: (s) => `✓ Pump operating normally — health score ${s.pumpHealthScore.toFixed(0)}%.`,
    audit: (s) => ({ category: 'Pump', severity: 'ok', title: 'Pump healthy', detail: `Health score ${s.pumpHealthScore.toFixed(0)}%.` }),
  },
  {
    key: 'battery_low',
    check: (s) => s.batteryCharge < 25,
    type: 'alert',
    message: (s) => `🔋 Battery critically low at ${s.batteryCharge.toFixed(1)}% (${s.batteryVoltage}V) — reduce pump runtime.`,
    audit: (s) => ({ category: 'Energy', severity: 'critical', title: 'Battery critically low', detail: `${s.batteryCharge.toFixed(1)}% — ${s.batteryVoltage}V.` }),
  },
  {
    key: 'battery_warn',
    check: (s) => s.batteryCharge >= 25 && s.batteryCharge < 35,
    type: 'warn',
    message: (s) => `Battery below 35% — currently ${s.batteryCharge.toFixed(1)}%. Solar producing ${s.solarProduction}W.`,
    audit: (s) => ({ category: 'Energy', severity: 'warning', title: 'Battery low', detail: `${s.batteryCharge.toFixed(1)}%, solar ${s.solarProduction}W.` }),
  },
  {
    key: 'battery_charged',
    check: (s) => s.batteryCharge > 90,
    type: 'ok',
    message: (s) => `✓ Battery fully charged at ${s.batteryCharge.toFixed(1)}% (${s.batteryVoltage}V).`,
    audit: (s) => ({ category: 'Energy', severity: 'ok', title: 'Battery fully charged', detail: `${s.batteryCharge.toFixed(1)}% — ${s.batteryVoltage}V.` }),
  },
  {
    key: 'reservoir_low',
    check: (s) => s.reservoirLevel < 20,
    type: 'alert',
    message: (s) => `💧 Reservoir critically low at ${s.reservoirLevel.toFixed(1)}% — start refill or reduce consumption.`,
    audit: (s) => ({ category: 'Water', severity: 'critical', title: 'Reservoir critically low', detail: `${s.reservoirLevel.toFixed(1)}%.` }),
  },
  {
    key: 'reservoir_warn',
    check: (s) => s.reservoirLevel >= 20 && s.reservoirLevel < 35,
    type: 'warn',
    message: (s) => `Reservoir at ${s.reservoirLevel.toFixed(1)}% — consider scheduling a refill.`,
    audit: (s) => ({ category: 'Water', severity: 'warning', title: 'Reservoir low', detail: `${s.reservoirLevel.toFixed(1)}%.` }),
  },
  {
    key: 'reservoir_full',
    check: (s) => s.reservoirLevel > 92,
    type: 'warn',
    message: (s) => `Reservoir near full at ${s.reservoirLevel.toFixed(1)}% — stop pump to prevent overflow.`,
    audit: (s) => ({ category: 'Water', severity: 'warning', title: 'Reservoir near full', detail: `${s.reservoirLevel.toFixed(1)}% — overflow risk.` }),
  },
  {
    key: 'pump_overheat',
    check: (s) => s.pumpTemp > 70,
    type: 'alert',
    message: (s) => `🌡 Pump overheating — ${s.pumpTemp.toFixed(1)}°C. Auto-shutdown threshold is 80°C. Reduce load.`,
    audit: (s) => ({ category: 'Pump', severity: 'critical', title: 'Pump overheating', detail: `${s.pumpTemp.toFixed(1)}°C.` }),
  },
  {
    key: 'pump_temp_warn',
    check: (s) => s.pumpTemp >= 65 && s.pumpTemp <= 70,
    type: 'warn',
    message: (s) => `Pump temperature elevated at ${s.pumpTemp.toFixed(1)}°C. Monitor closely.`,
    audit: (s) => ({ category: 'Pump', severity: 'warning', title: 'Pump temperature elevated', detail: `${s.pumpTemp.toFixed(1)}°C.` }),
  },
  {
    key: 'ph_contamination',
    check: (s, ai) => ai.ph?.contaminated,
    type: 'alert',
    message: (s, ai) => `⚗ Water quality alert — pH deviation ${ai.ph?.deviation?.toFixed(3)}. Contamination risk detected.`,
    audit: (s, ai) => ({ category: 'Water', severity: 'critical', title: 'Water quality alert', detail: `pH deviation ${ai.ph?.deviation?.toFixed(3)}.` }),
  },
  {
    key: 'ph_ok',
    check: (s, ai) => !ai.ph?.contaminated && ai.ph?.deviation < 0.3,
    type: 'ok',
    message: () => '✓ Water quality normal — pH within safe range (6.5–8.5).',
    audit: () => ({ category: 'Water', severity: 'ok', title: 'Water quality normal', detail: 'pH within safe range 6.5–8.5.' }),
  },
  {
    key: 'panel_dirty',
    check: (s, ai) => ai.panel?.needsCleaning,
    type: 'warn',
    message: (s, ai) => `☀ Solar panel soiling detected — efficiency ratio ${ai.panel?.ratio?.toFixed(2) ?? 'N/A'}. Clean panel to restore output.`,
    audit: (s, ai) => ({ category: 'Energy', severity: 'warning', title: 'Solar panel needs cleaning', detail: `Efficiency ratio ${ai.panel?.ratio?.toFixed(2) ?? 'N/A'}.` }),
  },
  {
    key: 'solar_low',
    check: (s) => { const h = new Date().getHours(); return h >= 9 && h <= 16 && s.solarProduction < 20 },
    type: 'warn',
    message: (s) => `Solar production low during peak hours — only ${s.solarProduction.toFixed(1)}W.`,
    audit: (s) => ({ category: 'Energy', severity: 'warning', title: 'Low solar during peak hours', detail: `${s.solarProduction.toFixed(1)}W.` }),
  },
  {
    key: 'solar_peak',
    check: (s) => s.solarProduction > 80,
    type: 'info',
    message: (s, ai) => `☀ Solar peak active — ${s.solarProduction.toFixed(1)}W. Forecast next hour: ~${ai.solarForecast?.toFixed(0) ?? '?'}W.`,
    audit: (s, ai) => ({ category: 'Energy', severity: 'info', title: 'Solar peak active', detail: `${s.solarProduction.toFixed(1)}W, forecast ~${ai.solarForecast?.toFixed(0) ?? '?'}W next hour.` }),
  },
  {
    key: 'wifi_weak',
    check: (s) => s.wifiRssi < -68,
    type: 'warn',
    message: (s) => `WiFi signal weak at ${s.wifiRssi} dBm — data transmission may be unreliable.`,
    audit: (s) => ({ category: 'System', severity: 'warning', title: 'Weak WiFi signal', detail: `${s.wifiRssi} dBm.` }),
  },
]

function generateAlerts(sensors, aiResults, existingAlerts) {
  const now    = new Date()
  const nowMs  = now.getTime()
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  const newAlerts = []
  const newAuditEvents = []

  for (const rule of ALERT_RULES) {
    if (!rule.check(sensors, aiResults)) continue
    const recent = existingAlerts.find(a => a.key === rule.key)
    if (recent && nowMs - recent.timestamp < 60_000) continue
    newAlerts.push({
      id: nowMs + Math.random(),
      key: rule.key,
      type: rule.type,
      time: timeStr,
      timestamp: nowMs,
      message: rule.message(sensors, aiResults),
      read: false,
    })
    if (rule.audit) newAuditEvents.push(rule.audit(sensors, aiResults))
  }

  return { newAlerts, newAuditEvents }
}

// ── Apply / persist theme on <html> ─────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

const savedTheme = (() => {
  try { return localStorage.getItem('aquagrid-theme') } catch { return null }
})()
const initialTheme = savedTheme ?? 'light'
applyTheme(initialTheme)

// ── Impact counters — accumulate over session ─────────────────────────────────
const impactBase = {
  waterSavedL:       0,        // litres saved from leak prevention
  energySavedWh:     0,        // Wh saved from solar optimisation
  pumpUptimeMin:     0,        // minutes pump ran successfully
  leaksPreventedCount: 0,      // discrete leak events intercepted
  monitoringDaysSeed: Math.floor(Math.random() * 180) + 30,  // simulated deployment age
}

const useStore = create((set, get) => {
  // Live sensor tick
  setInterval(() => {
    const { sensors, history, pumpOn, aiResults, alerts, impact } = get()
    const next = tickSensors(sensors, pumpOn)
    const { newAlerts, newAuditEvents } = generateAlerts(next, aiResults, alerts)
    const merged = [...newAlerts, ...alerts].slice(0, MAX_ALERTS)
    if (newAuditEvents.length > 0) {
      const record = useAuditLog.getState().record
      newAuditEvents.forEach(ev => record(ev))
    }

    // ── Update impact counters ──
    const leakEvent = newAlerts.find(a => a.key === 'leak_detected')
    const nextImpact = {
      ...impact,
      // Each tick: if pump on, accumulate uptime (TICK_MS in minutes)
      pumpUptimeMin: impact.pumpUptimeMin + (pumpOn ? TICK_MS / 60000 : 0),
      // Water saved: estimate 3 L/min prevented when a leak is caught early
      waterSavedL: impact.waterSavedL + (aiResults.leak?.isLeak ? 0 : next.flowRate * (TICK_MS / 60000) * 0.02),
      // Energy saved: delta between theoretical max solar and actual use
      energySavedWh: impact.energySavedWh + Math.max(0, next.solarProduction - next.pumpPower) * (TICK_MS / 3600000),
      // Leak intercepts
      leaksPreventedCount: impact.leaksPreventedCount + (leakEvent ? 1 : 0),
    }

    set({
      sensors: next,
      history: appendHistory(history, next),
      alerts: merged,
      lastUpdated: new Date(),
      impact: nextImpact,
    })
  }, TICK_MS)

  return {
    sensors:     generateSensorData(),
    history:     generateHistoryData(48),
    alerts:      [],
    sidebarOpen: true,
    lastUpdated: new Date(),
    impact:      { ...impactBase },

    // ── Theme ──
    theme: initialTheme,
    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try { localStorage.setItem('aquagrid-theme', next) } catch {}
      useAuditLog.getState().record({
        category: 'System',
        severity: 'action',
        title:    `Theme switched to ${next} mode`,
        detail:   `User changed UI theme to ${next} mode.`,
      })
      set({ theme: next })
    },

    aiResults: {
      leak:          { isLeak: false, rollingMean: 0, consecutiveHigh: 0 },
      maintenance:   { state: 0, label: 'healthy' },
      ph:            { contaminated: false, deviation: 0, rollingMean: 0 },
      panel:         { needsCleaning: false, ratio: null },
      solarForecast: 0,
      panelSoiled:   false,
      anomalyScore:  0,
      autoencoderStatus: 'Initializing...',
    },
    setAiResults: (results) => set({ aiResults: results }),

    toggleSidebar:  () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    markAlertRead:  (id) => set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a) })),
    clearAlerts:    () => set({ alerts: [] }),
    refreshSensors: () => set({ sensors: tickSensors(get().sensors, get().pumpOn), lastUpdated: new Date() }),

    pumpOn: false,
    togglePump: () => {
      const next = !get().pumpOn
      set({ pumpOn: next })
      useAuditLog.getState().record({
        category: 'Pump',
        severity: 'action',
        title:    `Pump turned ${next ? 'ON' : 'OFF'}`,
        detail:   `Manual control — operator toggled pump ${next ? 'on' : 'off'} at ${new Date().toLocaleTimeString()}.`,
      })
    },
  }
})

export default useStore
