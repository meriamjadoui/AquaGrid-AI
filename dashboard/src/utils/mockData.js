// ─── AquaGrid AI — ESP32 Sensor Simulator ────────────────────────────────────
// Replaces pure random snapshots with a physics-based live stream.
// Sensors drift smoothly over time, react to each other (solar drives battery,
// pump running raises temp, etc.) — just like a real ESP32 would behave.

const rnd  = (min, max, dp = 1) => +( Math.random() * (max - min) + min ).toFixed(dp)
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const drift = (current, min, max, step) =>
  clamp(current + (Math.random() - 0.5) * 2 * step, min, max)

// ─── Initial state ────────────────────────────────────────────────────────────
export function generateSensorData() {
  const h = new Date().getHours()
  const solarPeak = h >= 7 && h <= 19
    ? Math.max(0, 95 * Math.sin(Math.PI * (h - 7) / 12))
    : 0

  return {
    reservoirLevel:   rnd(60, 85),
    flowRate:         rnd(7, 13),
    totalConsumed:    rnd(180, 260),
    leakRisk:         rnd(5, 20),
    solarProduction:  +(solarPeak + rnd(-5, 5)).toFixed(1),
    batteryCharge:    rnd(55, 85),
    batteryVoltage:   rnd(12.0, 13.0),
    pumpPower:        rnd(35, 65),
    pumpTemp:         rnd(44, 60),
    pumpHealthScore:  rnd(78, 95),
    pumpMotorCurrent: rnd(2.2, 4.2),
    wifiRssi:         rnd(-68, -48, 0),
    uptime:           rnd(24, 200, 0),
  }
}

// ─── Live tick — call this every N seconds ────────────────────────────────────
// Returns a new sensors object that drifts naturally from the previous one.
export function tickSensors(prev, pumpOn = false) {
  const h = new Date().getHours()

  // Solar follows a sine curve across daylight hours with small noise
  const solarPeak = h >= 7 && h <= 19
    ? Math.max(0, 95 * Math.sin(Math.PI * (h - 7) / 12))
    : 0
  const solarProduction = clamp(
    solarPeak + (Math.random() - 0.5) * 8,
    0, 100
  )

  // Battery charges when solar > pump draw, drains otherwise
  const netPower = solarProduction - (pumpOn ? prev.pumpPower : 5)
  const batteryCharge = clamp(
    prev.batteryCharge + netPower * 0.003 + (Math.random() - 0.5) * 0.4,
    10, 100
  )
  const batteryVoltage = clamp(11.5 + batteryCharge * 0.015 + (Math.random() - 0.5) * 0.05, 11.5, 13.2)

  // Reservoir drains when pump is on, refills slowly otherwise
  const reservoirLevel = clamp(
    prev.reservoirLevel + (pumpOn ? -0.3 : 0.15) + (Math.random() - 0.5) * 0.3,
    5, 100
  )

  // Flow rate correlates with pump state
  const flowRate = pumpOn
    ? drift(prev.flowRate, 7, 14, 0.5)
    : drift(prev.flowRate, 0.5, 3, 0.3)

  // Pump temp rises when running, cools when idle
  const pumpTemp = clamp(
    prev.pumpTemp + (pumpOn ? 0.4 : -0.3) + (Math.random() - 0.5) * 0.5,
    35, 80
  )

  // Motor current proportional to pump load
  const pumpMotorCurrent = pumpOn
    ? drift(prev.pumpMotorCurrent, 2.5, 4.8, 0.15)
    : drift(prev.pumpMotorCurrent, 0.1, 0.5, 0.05)

  const pumpPower = +(pumpMotorCurrent * 12).toFixed(1)  // P = I × V

  // Pump health degrades slightly when overheated
  const pumpHealthScore = clamp(
    prev.pumpHealthScore + (pumpTemp > 70 ? -0.2 : 0.05) + (Math.random() - 0.5) * 0.1,
    40, 100
  )

  // Leak risk: spikes occasionally to simulate anomaly, then recovers
  const leakRisk = Math.random() < 0.03
    ? clamp(prev.leakRisk + rnd(8, 20), 0, 95)   // rare spike
    : drift(prev.leakRisk, 3, 30, 1.5)

  // Consumed water increases while pump is on
  const totalConsumed = +(prev.totalConsumed + (pumpOn ? flowRate / 20 : 0)).toFixed(1)

  return {
    reservoirLevel: +reservoirLevel.toFixed(1),
    flowRate:       +flowRate.toFixed(1),
    totalConsumed,
    leakRisk:       +leakRisk.toFixed(1),
    solarProduction: +solarProduction.toFixed(1),
    batteryCharge:  +batteryCharge.toFixed(1),
    batteryVoltage: +batteryVoltage.toFixed(2),
    pumpPower:      +pumpPower.toFixed(1),
    pumpTemp:       +pumpTemp.toFixed(1),
    pumpHealthScore: +pumpHealthScore.toFixed(1),
    pumpMotorCurrent: +pumpMotorCurrent.toFixed(2),
    wifiRssi:       prev.wifiRssi,  // stable unless there's a drop event
    uptime:         prev.uptime + (3 / 3600),  // increments by tick interval
  }
}

// ─── History bootstrap ────────────────────────────────────────────────────────
export function generateHistoryData(hours = 48) {
  const now = new Date()
  return Array.from({ length: hours }, (_, i) => {
    const t   = new Date(now.getTime() - (hours - i) * 3600_000)
    const h   = t.getHours()
    const solar = h >= 7 && h <= 19
      ? Math.max(0, 95 * Math.sin(Math.PI * (h - 7) / 12) + (Math.random() - 0.5) * 8)
      : 0
    return {
      time:      t.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      label:     i % 6 === 0
        ? t.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        : t.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      reservoir: Math.round(60 + 25 * Math.sin(i / 10) + (Math.random() - 0.5) * 5),
      flow:      +(6 + 8 * Math.random()).toFixed(1),
      solar:     +solar.toFixed(1),
      battery:   Math.round(55 + 30 * Math.sin((i + 8) / 12) + (Math.random() - 0.5) * 3),
      pumpPower: +(solar > 5 ? 40 + 30 * Math.random() : 5 + 10 * Math.random()).toFixed(1),
      leakRisk:  +(5 + 20 * Math.random()).toFixed(1),
    }
  })
}

// ─── Append a live tick to the history ring buffer ───────────────────────────
export function appendHistory(history, sensors) {
  const now   = new Date()
  const entry = {
    time:      now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    label:     now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    reservoir: +sensors.reservoirLevel.toFixed(1),
    flow:      +sensors.flowRate.toFixed(1),
    solar:     +sensors.solarProduction.toFixed(1),
    battery:   +sensors.batteryCharge.toFixed(1),
    pumpPower: +sensors.pumpPower.toFixed(1),
    leakRisk:  +sensors.leakRisk.toFixed(1),
  }
  // Keep last 120 points (10-minute rolling window at 5s ticks)
  const next = [...history, entry]
  return next.length > 120 ? next.slice(-120) : next
}

// ─── Thresholds + status helpers ─────────────────────────────────────────────
export const THRESHOLDS = {
  reservoirLevel: { low: 20,  high: 90 },
  batteryCharge:  { low: 25,  high: 95 },
  pumpTemp:       { warn: 65, critical: 75 },
  leakRisk:       { warn: 40, critical: 60 },
  flowRate:       { low: 2,   high: 18 },
}

export function getStatus(key, value) {
  const t = THRESHOLDS[key]
  if (!t) return 'ok'
  if (key === 'pumpTemp' || key === 'leakRisk') {
    if (value >= t.critical) return 'alert'
    if (value >= t.warn)     return 'warn'
    return 'ok'
  }
  if (value <= t.low)  return 'alert'
  if (value >= t.high) return 'warn'
  return 'ok'
}
