/**
 * mockData.js — Physics-Based ESP32 Sensor Simulator
 * =====================================================
 * Replaces static random snapshots with a physics-based live stream.
 * Sensors drift smoothly over time and react to each other,
 * mimicking real ESP32 field behavior:
 *   - Solar output follows a sine curve across daylight hours
 *   - Battery charges when solar > pump draw, drains otherwise
 *   - Reservoir drains when pump is on, refills slowly when idle
 *   - Pump temperature rises under load, cools when idle
 *   - Pump health degrades slowly when overheated
 *   - Flow rate correlates with pump state
 *
 * In production, replace these functions with Firebase RTDB listeners
 * or MQTT subscriptions that deliver real ESP32 readings.
 */

const rnd   = (min, max, dp = 1) => +( Math.random() * (max - min) + min ).toFixed(dp)
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const drift = (current, min, max, step) =>
  clamp(current + (Math.random() - 0.5) * 2 * step, min, max)

/**
 * generateSensorData()
 * Produces the initial sensor snapshot when the app first loads.
 * Values are seeded in realistic mid-range bands so the dashboard
 * starts in a "normal operating" state.
 *
 * @returns {Object} Initial sensor state object
 */
export function generateSensorData() {
  const h = new Date().getHours()
  const solarPeak = h >= 7 && h <= 19
    ? Math.max(0, 95 * Math.sin(Math.PI * (h - 7) / 12))
    : 0

  return {
    reservoirLevel:   rnd(60, 85),      // % full (HC-SR04 ultrasonic)
    flowRate:         rnd(7, 13),        // L/min (YF-S201 flow sensor)
    totalConsumed:    rnd(180, 260),     // L today (accumulated since midnight)
    leakRisk:         rnd(5, 20),        // % risk score (derived from flow vs reservoir delta)
    solarProduction:  +(solarPeak + rnd(-5, 5)).toFixed(1), // W (INA219 on panel circuit)
    batteryCharge:    rnd(55, 85),      // % state of charge
    batteryVoltage:   rnd(12.0, 13.0),  // V (INA219)
    pumpPower:        rnd(35, 65),      // W = motorCurrent × batteryVoltage
    pumpTemp:         rnd(44, 60),      // °C (DS18B20 on motor housing)
    pumpHealthScore:  rnd(78, 95),      // % health score (derived from temp + current trends)
    pumpMotorCurrent: rnd(2.2, 4.2),    // A (INA219 on pump circuit)
    wifiRssi:         rnd(-68, -48, 0), // dBm (ESP32 WiFi stack)
    uptime:           rnd(24, 200, 0),  // hours since last reboot
  }
}

/**
 * tickSensors(prev, pumpOn)
 * Called every TICK_MS (3 seconds) by the Zustand store interval.
 * Returns a new sensor state that drifts naturally from the previous one.
 * All physics relationships are modelled:
 *   - Solar drives battery charge (net power = solar − pump draw)
 *   - Pump state affects reservoir drain rate and motor temperature
 *   - Pump health slowly degrades when temperature exceeds 70°C
 *   - Leak risk spikes stochastically (3% chance per tick) to simulate anomalies
 *
 * @param {Object}  prev    Previous sensor state (from useStore)
 * @param {boolean} pumpOn  Whether the pump relay is currently active
 * @returns {Object} Next sensor state
 */
export function tickSensors(prev, pumpOn = false) {
  const h = new Date().getHours()

  // Solar: sine curve across 7am–7pm with ±8W noise
  const solarPeak = h >= 7 && h <= 19
    ? Math.max(0, 95 * Math.sin(Math.PI * (h - 7) / 12))
    : 0
  const solarProduction = clamp(solarPeak + (Math.random() - 0.5) * 8, 0, 100)

  // Battery: charges from solar surplus, drains under pump load
  const netPower = solarProduction - (pumpOn ? prev.pumpPower : 5)
  const batteryCharge = clamp(
    prev.batteryCharge + netPower * 0.003 + (Math.random() - 0.5) * 0.4,
    10, 100
  )
  // Voltage follows a linear approximation of battery SOC (11.5V empty → 13.2V full)
  const batteryVoltage = clamp(11.5 + batteryCharge * 0.015 + (Math.random() - 0.5) * 0.05, 11.5, 13.2)

  // Reservoir: drains 0.3% per tick when pump is on, refills 0.15% when idle
  const reservoirLevel = clamp(
    prev.reservoirLevel + (pumpOn ? -0.3 : 0.15) + (Math.random() - 0.5) * 0.3,
    5, 100
  )

  // Flow rate: high when pump running (7–14 L/min), near-zero when idle (0.5–3 L/min)
  const flowRate = pumpOn
    ? drift(prev.flowRate, 7, 14, 0.5)
    : drift(prev.flowRate, 0.5, 3, 0.3)

  // Pump temperature: rises 0.4°C/tick when running, cools 0.3°C/tick when idle
  const pumpTemp = clamp(
    prev.pumpTemp + (pumpOn ? 0.4 : -0.3) + (Math.random() - 0.5) * 0.5,
    35, 80
  )

  // Motor current: proportional to pump load
  const pumpMotorCurrent = pumpOn
    ? drift(prev.pumpMotorCurrent, 2.5, 4.8, 0.15)
    : drift(prev.pumpMotorCurrent, 0.1, 0.5, 0.05)

  // Pump power: P = I × V (Ohm's law approximation)
  const pumpPower = +(pumpMotorCurrent * 12).toFixed(1)

  // Health score: degrades when overheated (>70°C), recovers slowly when cool
  const pumpHealthScore = clamp(
    prev.pumpHealthScore + (pumpTemp > 70 ? -0.2 : 0.05) + (Math.random() - 0.5) * 0.1,
    40, 100
  )

  // Leak risk: occasional stochastic spike (3% chance) to simulate pipeline anomaly
  const leakRisk = Math.random() < 0.03
    ? clamp(prev.leakRisk + rnd(8, 20), 0, 95)   // rare spike
    : drift(prev.leakRisk, 3, 30, 1.5)            // normal slow drift

  // Total consumed: accumulates only while pump is running
  const totalConsumed = +(prev.totalConsumed + (pumpOn ? flowRate / 20 : 0)).toFixed(1)

  return {
    reservoirLevel:   +reservoirLevel.toFixed(1),
    flowRate:         +flowRate.toFixed(1),
    totalConsumed,
    leakRisk:         +leakRisk.toFixed(1),
    solarProduction:  +solarProduction.toFixed(1),
    batteryCharge:    +batteryCharge.toFixed(1),
    batteryVoltage:   +batteryVoltage.toFixed(2),
    pumpPower:        +pumpPower.toFixed(1),
    pumpTemp:         +pumpTemp.toFixed(1),
    pumpHealthScore:  +pumpHealthScore.toFixed(1),
    pumpMotorCurrent: +pumpMotorCurrent.toFixed(2),
    wifiRssi:         prev.wifiRssi,         // WiFi signal is stable unless a drop event occurs
    uptime:           prev.uptime + (3 / 3600), // Increments by tick interval in hours
  }
}

/**
 * generateHistoryData(hours)
 * Bootstraps 48 hours of synthetic historical data for the trend charts.
 * Uses the same solar sine curve as tickSensors for consistency.
 * Called once at store initialisation; new ticks append to this array
 * via appendHistory() to maintain a rolling 120-point window.
 *
 * @param {number} hours  Number of historical hours to generate (default: 48)
 * @returns {Array<Object>} Array of history data points
 */
export function generateHistoryData(hours = 48) {
  const now = new Date()
  return Array.from({ length: hours }, (_, i) => {
    const t     = new Date(now.getTime() - (hours - i) * 3600_000)
    const h     = t.getHours()
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

/**
 * appendHistory(history, sensors)
 * Appends the latest sensor tick to the rolling history array.
 * Maintains a maximum of 120 data points (10-minute window at 3-second ticks).
 * Called on every store tick to keep the trend charts up to date.
 *
 * @param {Array}  history  Existing history array from the store
 * @param {Object} sensors  Latest sensor state object
 * @returns {Array} Updated history array (max 120 entries)
 */
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
  const next = [...history, entry]
  return next.length > 120 ? next.slice(-120) : next
}

/**
 * THRESHOLDS
 * Defines the warning and critical boundaries for each monitored sensor.
 * Used by getStatus() to compute traffic-light status badges in the UI.
 * Also referenced by the alert rules in useStore.js.
 */
export const THRESHOLDS = {
  reservoirLevel: { low: 20,  high: 90  }, // % — below 20% is critical, above 90% risks overflow
  batteryCharge:  { low: 25,  high: 95  }, // % — below 25% triggers battery critical alert
  pumpTemp:       { warn: 65, critical: 75 }, // °C — 65 warn, 75 critical, 80 auto-shutdown
  leakRisk:       { warn: 40, critical: 60 }, // % — RF model output; 60%+ treated as confirmed leak
  flowRate:       { low: 2,   high: 18  }, // L/min — below 2 means pump not delivering
}

/**
 * getStatus(key, value)
 * Returns a traffic-light status string for a given sensor and its current value.
 * Used by KpiCard badge props throughout the dashboard.
 *
 * @param {string} key    Sensor key matching a THRESHOLDS entry
 * @param {number} value  Current sensor reading
 * @returns {'ok'|'warn'|'alert'} Status label
 */
export function getStatus(key, value) {
  const t = THRESHOLDS[key]
  if (!t) return 'ok'
  // Pump temp and leak risk: higher = worse
  if (key === 'pumpTemp' || key === 'leakRisk') {
    if (value >= t.critical) return 'alert'
    if (value >= t.warn)     return 'warn'
    return 'ok'
  }
  // Level sensors: lower = worse, too high = overflow warning
  if (value <= t.low)  return 'alert'
  if (value >= t.high) return 'warn'
  return 'ok'
}
