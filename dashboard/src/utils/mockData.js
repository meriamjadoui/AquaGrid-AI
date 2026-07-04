// Realistic mock data for AquaGrid AI sensors

export function generateSensorData() {
  const rnd = (min, max, dp = 1) => +( Math.random() * (max - min) + min ).toFixed(dp)

  return {
    // Water
    reservoirLevel:   rnd(55, 90),        // %
    flowRate:         rnd(6, 14),          // L/min
    totalConsumed:    rnd(180, 320),       // L today
    leakRisk:         rnd(5, 35),          // % AI score

    // Energy
    solarProduction:  rnd(20, 95),         // W
    batteryCharge:    rnd(45, 92),         // %
    batteryVoltage:   rnd(11.8, 13.2),     // V
    pumpPower:        rnd(30, 80),         // W

    // Conditions
    pumpTemp:         rnd(42, 68),         // °C
    pumpHealthScore:  rnd(72, 96),         // % AI score
    pumpMotorCurrent: rnd(2.1, 4.8),       // A

    // Meta
    wifiRssi:         rnd(-72, -45, 0),    // dBm
    uptime:           rnd(12, 240, 0),     // hours
  }
}

export function generateHistoryData(hours = 48) {
  const now = new Date()
  return Array.from({ length: hours }, (_, i) => {
    const t = new Date(now.getTime() - (hours - i) * 3600_000)
    const h = t.getHours()
    const solar = h >= 7 && h <= 19
      ? Math.max(0, 95 * Math.sin(Math.PI * (h - 7) / 12) + (Math.random() - 0.5) * 10)
      : 0
    return {
      time:           t.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      label:          i % 6 === 0 ? t.toLocaleDateString('en', { month: 'short', day: 'numeric' }) : t.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      reservoir:      Math.round(60 + 25 * Math.sin(i / 10) + (Math.random() - 0.5) * 5),
      flow:           +(6 + 8 * Math.random()).toFixed(1),
      solar:          +solar.toFixed(1),
      battery:        Math.round(55 + 30 * Math.sin((i + 8) / 12) + (Math.random() - 0.5) * 3),
      pumpPower:      +(solar > 5 ? 40 + 30 * Math.random() : 5 + 10 * Math.random()).toFixed(1),
      leakRisk:       +(5 + 20 * Math.random()).toFixed(1),
    }
  })
}

export const THRESHOLDS = {
  reservoirLevel: { low: 20, high: 90 },
  batteryCharge:  { low: 25, high: 95 },
  pumpTemp:       { warn: 65, critical: 75 },
  leakRisk:       { warn: 40, critical: 60 },
  flowRate:       { low: 2, high: 18 },
}

export function getStatus(key, value) {
  const t = THRESHOLDS[key]
  if (!t) return 'ok'
  if (key === 'pumpTemp') {
    if (value >= t.critical) return 'alert'
    if (value >= t.warn) return 'warn'
    return 'ok'
  }
  if (key === 'leakRisk') {
    if (value >= t.critical) return 'alert'
    if (value >= t.warn) return 'warn'
    return 'ok'
  }
  if (value <= t.low) return 'alert'
  if (value >= t.high) return 'warn'
  return 'ok'
}
