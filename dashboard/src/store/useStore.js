import { create } from 'zustand'
import { generateSensorData, generateHistoryData, tickSensors, appendHistory } from '../utils/mockData'

const TICK_MS = 3000   // how often ESP32 "sends" data (ms)
const MAX_ALERTS = 20  // keep last N alerts in the feed

// ─── Alert rules ──────────────────────────────────────────────────────────────
// Each rule has:
//   key      : unique string (prevents duplicate alerts of the same type)
//   check    : (sensors, aiResults) => true when the alert should fire
//   type     : 'alert' | 'warn' | 'ok' | 'info'
//   message  : (sensors, aiResults) => string  — uses real values
const ALERT_RULES = [
  {
    key: 'leak_detected',
    check: (s, ai) => ai.leak?.isLeak,
    type: 'alert',
    message: (s) =>
      `⚠ Leak detected by AI model — flow rate ${s.flowRate} L/min, rolling loss ${(s.flowRate * 0.05).toFixed(2)} L/min. Inspect pipeline immediately.`,
  },
  {
    key: 'leak_clear',
    check: (s, ai) => !ai.leak?.isLeak && ai.leak?.rollingMean < 0.05,
    type: 'ok',
    message: () => '✓ Leak risk cleared — pipeline flow normal.',
  },
  {
    key: 'pump_critical',
    check: (s, ai) => ai.maintenance?.state === 2,
    type: 'alert',
    message: (s) =>
      `🔴 Pump critical — motor current ${s.pumpMotorCurrent}A, temp ${s.pumpTemp}°C. Immediate maintenance required.`,
  },
  {
    key: 'pump_warning',
    check: (s, ai) => ai.maintenance?.state === 1,
    type: 'warn',
    message: (s) =>
      `Pump health warning — temp ${s.pumpTemp}°C, current ${s.pumpMotorCurrent}A. Schedule inspection soon.`,
  },
  {
    key: 'pump_healthy',
    check: (s, ai) => ai.maintenance?.state === 0 && s.pumpHealthScore > 85,
    type: 'ok',
    message: (s) => `✓ Pump operating normally — health score ${s.pumpHealthScore.toFixed(0)}%.`,
  },
  {
    key: 'battery_low',
    check: (s) => s.batteryCharge < 25,
    type: 'alert',
    message: (s) =>
      `🔋 Battery critically low at ${s.batteryCharge.toFixed(1)}% (${s.batteryVoltage}V) — reduce pump runtime to preserve charge.`,
  },
  {
    key: 'battery_warn',
    check: (s) => s.batteryCharge >= 25 && s.batteryCharge < 35,
    type: 'warn',
    message: (s) =>
      `Battery below 35% — currently ${s.batteryCharge.toFixed(1)}%. Solar producing ${s.solarProduction}W.`,
  },
  {
    key: 'battery_charged',
    check: (s) => s.batteryCharge > 90,
    type: 'ok',
    message: (s) => `✓ Battery fully charged at ${s.batteryCharge.toFixed(1)}% (${s.batteryVoltage}V).`,
  },
  {
    key: 'reservoir_low',
    check: (s) => s.reservoirLevel < 20,
    type: 'alert',
    message: (s) =>
      `💧 Reservoir critically low at ${s.reservoirLevel.toFixed(1)}% — start refill or reduce consumption.`,
  },
  {
    key: 'reservoir_warn',
    check: (s) => s.reservoirLevel >= 20 && s.reservoirLevel < 35,
    type: 'warn',
    message: (s) => `Reservoir at ${s.reservoirLevel.toFixed(1)}% — consider scheduling a refill.`,
  },
  {
    key: 'reservoir_full',
    check: (s) => s.reservoirLevel > 92,
    type: 'warn',
    message: (s) => `Reservoir near full at ${s.reservoirLevel.toFixed(1)}% — stop pump to prevent overflow.`,
  },
  {
    key: 'pump_overheat',
    check: (s) => s.pumpTemp > 70,
    type: 'alert',
    message: (s) =>
      `🌡 Pump overheating — ${s.pumpTemp.toFixed(1)}°C. Auto-shutdown threshold is 80°C. Reduce load.`,
  },
  {
    key: 'pump_temp_warn',
    check: (s) => s.pumpTemp >= 65 && s.pumpTemp <= 70,
    type: 'warn',
    message: (s) => `Pump temperature elevated at ${s.pumpTemp.toFixed(1)}°C. Monitor closely.`,
  },
  {
    key: 'ph_contamination',
    check: (s, ai) => ai.ph?.contaminated,
    type: 'alert',
    message: (s, ai) =>
      `⚗ Water quality alert — pH deviation ${ai.ph?.deviation?.toFixed(3)}. Contamination risk detected by RF model.`,
  },
  {
    key: 'ph_ok',
    check: (s, ai) => !ai.ph?.contaminated && ai.ph?.deviation < 0.3,
    type: 'ok',
    message: () => '✓ Water quality normal — pH within safe range (6.5–8.5).',
  },
  {
    key: 'panel_dirty',
    check: (s, ai) => ai.panel?.needsCleaning,
    type: 'warn',
    message: (s, ai) =>
      `☀ Solar panel soiling detected — efficiency ratio ${ai.panel?.ratio?.toFixed(2) ?? 'N/A'}. Clean panel to restore output.`,
  },
  {
    key: 'solar_low',
    check: (s) => {
      const h = new Date().getHours()
      return h >= 9 && h <= 16 && s.solarProduction < 20
    },
    type: 'warn',
    message: (s) =>
      `Solar production low during peak hours — only ${s.solarProduction.toFixed(1)}W. Check panel orientation or shading.`,
  },
  {
    key: 'solar_peak',
    check: (s) => s.solarProduction > 80,
    type: 'info',
    message: (s, ai) =>
      `☀ Solar peak active — ${s.solarProduction.toFixed(1)}W. AI forecast next hour: ~${ai.solarForecast?.toFixed(0) ?? '?'}W. Optimal pump window.`,
  },
  {
    key: 'wifi_weak',
    check: (s) => s.wifiRssi < -68,
    type: 'warn',
    message: (s) => `WiFi signal weak at ${s.wifiRssi} dBm — data transmission may be unreliable.`,
  },
]

// ─── Alert generator ──────────────────────────────────────────────────────────
// Runs all rules, deduplicates against recent alerts (same key within 60s),
// returns only newly triggered alerts.
function generateAlerts(sensors, aiResults, existingAlerts) {
  const now      = new Date()
  const nowMs    = now.getTime()
  const timeStr  = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  const newAlerts = []

  for (const rule of ALERT_RULES) {
    if (!rule.check(sensors, aiResults)) continue

    // Deduplicate: skip if same key fired in the last 60 seconds
    const recent = existingAlerts.find(a => a.key === rule.key)
    if (recent && nowMs - recent.timestamp < 60_000) continue

    newAlerts.push({
      id:        nowMs + Math.random(),
      key:       rule.key,
      type:      rule.type,
      time:      timeStr,
      timestamp: nowMs,
      message:   rule.message(sensors, aiResults),
      read:      false,
    })
  }

  return newAlerts
}

// ─── Store ────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => {
  setInterval(() => {
    const { sensors, history, pumpOn, aiResults, alerts } = get()
    const next        = tickSensors(sensors, pumpOn)
    const newAlerts   = generateAlerts(next, aiResults, alerts)
    const merged      = [...newAlerts, ...alerts].slice(0, MAX_ALERTS)
    set({
      sensors:     next,
      history:     appendHistory(history, next),
      alerts:      merged,
      lastUpdated: new Date(),
    })
  }, TICK_MS)

  return {
    sensors:     generateSensorData(),
    history:     generateHistoryData(48),
    alerts:      [],   // starts empty — first real alerts fire within 3 seconds
    sidebarOpen: true,
    lastUpdated: new Date(),

    aiResults: {
      leak:          { isLeak: false, rollingMean: 0, consecutiveHigh: 0 },
      maintenance:   { state: 0, label: 'healthy' },
      ph:            { contaminated: false, deviation: 0, rollingMean: 0 },
      panel:         { needsCleaning: false, ratio: null },
      solarForecast: 0,
      panelSoiled:   false,
    },
    setAiResults: (results) => set({ aiResults: results }),

    toggleSidebar:  () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    markAlertRead:  (id) => set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a) })),
    clearAlerts:    () => set({ alerts: [] }),
    refreshSensors: () => set({ sensors: tickSensors(get().sensors, get().pumpOn), lastUpdated: new Date() }),
    pumpOn:   false,
    togglePump: () => set(s => ({ pumpOn: !s.pumpOn })),
  }
})

export default useStore
