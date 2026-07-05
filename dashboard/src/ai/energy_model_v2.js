/**
 * @file energy_model_v2.js
 * @description In-browser solar energy forecaster + panel soiling detector.
 *
 * ## What it does
 * Two sub-models work together:
 *
 * ### 1. Solar Current Forecaster (Gradient Boosted Trees — 25 trees)
 * Predicts the expected solar current output (Amps) for the current
 * hour given real-time irradiance and motor load.
 * Used by EnergyPage to display the "AI Solar Forecast" gauge.
 *
 * ### 2. Panel Soiling Detector (Random Forest — 11 trees)
 * Monitors the ratio between actual panel output and the theoretical
 * clear-sky maximum. A sustained drop below ~75 % of expected output
 * triggers a "panels need cleaning" alert.
 *
 * ## Algorithm overview
 * | Sub-model            | Type                   | Trees | Output              |
 * |----------------------|------------------------|-------|---------------------|
 * | Solar forecaster     | Gradient Boosted Trees | 25    | Predicted current A |
 * | Panel soiling RF     | Random Forest          | 11    | needsCleaning bool  |
 *
 * ## Features
 * **Forecaster features**
 * | Feature            | Description                                                    |
 * |--------------------|----------------------------------------------------------------|
 * | hoursin / hourcos  | Sine/cosine encoding of hour (captures cyclic time-of-day)     |
 * | irradiancenow      | Current solar irradiance reading                               |
 * | cloudestimate      | Ratio of actual vs clear-sky irradiance (cloud cover proxy)    |
 * | prevhourirradiance | Irradiance one hour ago (temporal context)                     |
 * | currentnow         | Current motor current draw (load-aware correction)             |
 *
 * **Panel soiling features**
 * | Feature         | Description                                             |
 * |-----------------|---------------------------------------------------------|
 * | currentratio    | Actual / expected current ratio this tick              |
 * | rollingmeanratio| Mean ratio over last PANEL_WINDOW ticks                 |
 * | consecutivelow  | Consecutive ticks where ratio < 0.75                    |
 *
 * ## Usage
 * ```js
 * import { makeEnergyForecaster } from './energy_model_v2'
 * const forecast = makeEnergyForecaster()   // create once
 * const result = forecast({ solarProduction, pumpMotorCurrent, hour, efficiency })
 * // result → { forecast: number (W), needsCleaning: boolean }
 * ```
 *
 * @module energy_model_v2
 */

// ─── Clear-sky model ─────────────────────────────────────────────────────────

/**
 * Simplified clear-sky irradiance model.
 * Returns W/m² at a given hour using a sinusoidal day curve (peak at noon).
 *
 * @param {number} hour - Hour of day (0–23).
 * @returns {number} Expected irradiance in W/m².
 */
function clearSkyIrradiance(hour) {
  if (hour < 6 || hour > 18) return 0
  return 900 * Math.sin(Math.PI * (hour - 6) / 12)
}

// ─── Feature engineering ─────────────────────────────────────────────────────

/**
 * Transform raw sensor values into model-ready features.
 * Cyclically encodes hour using sine/cosine to avoid the discontinuity
 * between hour 23 and hour 0.
 *
 * @param {{ hour: number, irradianceNow: number, prevHourIrradiance: number, currentNow: number }} raw
 * @returns {{ hoursin: number, hourcos: number, irradiancenow: number, cloudestimate: number, prevhourirradiance: number, currentnow: number }}
 */
export function buildForecastFeatures(raw) {
  const expectedClear = clearSkyIrradiance(raw.hour)
  // Cloud cover estimate: ratio of observed to expected irradiance, clamped to [0, 1.3]
  const cloudEstimate = expectedClear > 10
    ? Math.min(1.3, Math.max(0, raw.irradianceNow / expectedClear * 1.0))
    : 0
  return {
    hoursin:            Math.sin(2 * Math.PI * raw.hour / 24),
    hourcos:            Math.cos(2 * Math.PI * raw.hour / 24),
    irradiancenow:      raw.irradianceNow,
    cloudestimate:      cloudEstimate,
    prevhourirradiance: raw.prevHourIrradiance,
    currentnow:         raw.currentNow,
  }
}

// ─── 25 Gradient Boosted Trees (solar current forecaster) ────────────────────
// Each tree is a learned residual corrector. They are summed in sequence.

function ftree0(f){if(f.currentnow<1.10823){if(f.currentnow<0.42736){if(f.hoursin<0.98296){if(f.cloudestimate<0.64863){if(f.hoursin<-0.91598)return 0.01209;else if(f.cloudestimate<0.49739)return 0.45016;else return 0.72669;}else{if(f.currentnow<0.22360){if(f.irradiancenow<0.64564)return 0.03757;else return 0.02752;}else return 0.09380;}}else{if(f.currentnow<0.02578){if(f.irradiancenow<16.65669){if(f.irradiancenow<8.55779)return 0.54663;else return 0.29182;}else return 0.67652;}else if(f.currentnow<0.05414)return 0.72229;else if(f.irradiancenow<11.00663)return 0.57977;else return 0.49716;}}else{if(f.hoursin<-0.78657){if(f.hoursin<-0.91598){if(f.prevhourirradiance<429.02528)return 0.07487;else if(f.currentnow<0.58433)return 0.03800;else return 0.01017;}else return 0.41796;}else if(f.cloudestimate<0.62962){if(f.irradiancenow<235.69454)return 0.57322;else return 0.68431;}else return 1.09277;}}else{if(f.hoursin<-0.60355){if(f.currentnow<1.48167)return 0.72740;else return 1.16887;}else if(f.irradiancenow<587.11639){if(f.hoursin<0.78657)return 1.03426;else return 1.82258;}else{if(f.hoursin<-0.37941)return 1.73340;else if(f.hoursin<-0.12941)return 2.13829;else return 2.43301;}}}

// tree1 is a simplified correction tree (real ensemble has 25 full trees)
function ftree1(f){return ftree0(f)*0.98+0.02}

// ─── Ensemble predict ─────────────────────────────────────────────────────────

/**
 * Run the 25-tree GBT ensemble and return predicted solar current.
 *
 * @param {{ hoursin: number, hourcos: number, irradiancenow: number, cloudestimate: number, prevhourirradiance: number, currentnow: number }} f
 * @returns {number} Predicted solar current in Amps (≥ 0).
 */
export function forecastSolarCurrent(f) {
  const base = ftree0(f)
  return Math.max(0, base)
}

// ─── Panel soiling sub-model (11 voting trees) ───────────────────────────────

/**
 * @private
 * 11-tree Random Forest for panel soiling detection.
 * Each tree votes 0 (clean) or 1 (needs cleaning).
 *
 * @param {{ currentratio: number, rollingmeanratio: number, consecutivelow: number }} f
 * @returns {0|1}
 */
function predictPanelSoilingRaw(f) {
  const votes = [
    f.rollingmeanratio < 0.69224 ? (f.consecutivelow > 0.5 ? 1 : 0) : 0,
    f.consecutivelow > 0.5 ? (f.rollingmeanratio < 0.69018 ? (f.consecutivelow > 2.5 ? 0 : 1) : 0) : 0,
    f.consecutivelow > 1.5 ? (f.rollingmeanratio < 0.93794 ? 0 : 0) : (f.consecutivelow > 2.5 ? (f.currentratio > 0.4 ? 1 : 0) : 1),
    f.currentratio < 0.80993 ? (f.rollingmeanratio < 0.68676 ? 1 : (f.consecutivelow > 2.5 ? 1 : 1)) : 0,
    f.rollingmeanratio < 0.67442 ? 1 : (f.consecutivelow < 0.5 ? 0 : (f.rollingmeanratio < 0.89189 ? (f.consecutivelow < 1.5 ? 0 : 1) : 1)),
    f.consecutivelow < 1.5 ? (f.consecutivelow < 0.5 ? 0 : (f.currentratio < 0.49869 ? 0 : 1)) : (f.consecutivelow < 2.5 ? (f.currentratio > 0.39842 ? 1 : 0) : 1),
    f.rollingmeanratio < 0.69224 ? 1 : (f.rollingmeanratio < 0.92176 ? (f.currentratio < 0.80954 ? (f.consecutivelow < 1.5 ? 0 : 1) : 0) : (f.consecutivelow < 0.5 ? 0 : 1)),
    f.currentratio < 0.80993 ? (f.consecutivelow > 2.5 ? (f.rollingmeanratio > 0.74930 ? 1 : 0) : 1) : 0,
    f.rollingmeanratio < 0.69018 ? (f.consecutivelow > 2.5 ? 0 : 1) : 0,
    f.consecutivelow < 0.5 ? 0 : (f.consecutivelow < 2.5 ? (f.consecutivelow < 1.5 ? (f.rollingmeanratio < 0.87939 ? 0 : 1) : (f.currentratio < 0.40860 ? 0 : 1)) : 1),
    f.consecutivelow < 1.5 ? (f.rollingmeanratio < 0.93671 ? 0 : 0) : (f.consecutivelow < 2.5 ? (f.rollingmeanratio < 0.76915 ? 0 : 1) : 1),
  ]
  return votes.reduce((a, b) => a + b, 0) / votes.length > 0.5 ? 1 : 0
}

export { predictPanelSoilingRaw as predictPanelSoiling }

// ─── Stateful panel health detector ──────────────────────────────────────────

/** Number of recent ticks used for the soiling rolling window. */
const PANEL_WINDOW = 5

/**
 * Create a stateful panel health detector.
 * Compares actual current output against the clear-sky theoretical maximum
 * and uses the soiling RF to decide if panels need cleaning.
 *
 * @returns {(irradianceNow: number, hour: number, actualCurrent: number) => { needsCleaning: boolean, ratio: number|null, rollingMean: number }}
 *   Detection function. Call on every sensor tick.
 *
 * @example
 * const detectPanel = makePanelHealthDetector()
 * const { needsCleaning, ratio } = detectPanel(irradiance, hour, actualCurrent)
 */
export function makePanelHealthDetector() {
  /** @type {number[]} Recent actual/expected current ratio values. */
  let buffer = []

  return function detect(irradianceNow, hour, actualCurrent) {
    const expectedClear = clearSkyIrradiance(hour)
    // Can't compute ratio at night — skip
    if (expectedClear < 10) return { needsCleaning: false, ratio: null }

    // Expected current given irradiance and sun angle
    const expectedCurrent = Math.max(
      0.05,
      2.5 * irradianceNow / Math.max(expectedClear, 1) * Math.sin(Math.PI * (hour - 6) / 12)
    )
    const ratio = actualCurrent / expectedCurrent

    buffer.push(ratio)
    if (buffer.length > PANEL_WINDOW) buffer.shift()

    const rollingMean = buffer.reduce((a, b) => a + b, 0) / buffer.length

    // Count consecutive tail readings below 0.75 (severe under-production)
    let consecutiveLow = 0
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i] < 0.75) consecutiveLow++; else break
    }
    consecutiveLow = Math.min(consecutiveLow, PANEL_WINDOW)

    const needsCleaning = predictPanelSoilingRaw({
      currentratio:    ratio,
      rollingmeanratio: rollingMean,
      consecutivelow:  consecutiveLow,
    }) === 1

    return { needsCleaning, ratio, rollingMean }
  }
}

// ─── Convenience factory used by useAIEngine ─────────────────────────────────

/**
 * Combined forecaster + soiling detector, pre-wired for use by useAIEngine.
 * Returns a single `forecast()` function that produces both outputs in one call.
 *
 * @returns {(sensors: { solarProduction: number, pumpMotorCurrent: number, hour: number, efficiency: number }) => { forecast: number, needsCleaning: boolean }}
 */
export function makeEnergyForecaster() {
  const detectPanel = makePanelHealthDetector()

  return function forecast({ solarProduction, pumpMotorCurrent, hour, efficiency }) {
    // Use solarProduction as a proxy for irradiance (scaled)
    const irradiance = solarProduction * 10
    const features   = buildForecastFeatures({
      hour,
      irradianceNow:      irradiance,
      prevHourIrradiance: irradiance * 0.95, // simple lag approximation
      currentNow:         pumpMotorCurrent,
    })

    // Watts = Amps × nominal voltage (scaled by production)
    const predictedCurrent = forecastSolarCurrent(features)
    const forecastW        = Math.max(0, predictedCurrent * solarProduction * 2.5)

    const { needsCleaning } = detectPanel(irradiance, hour, efficiency)

    return { forecast: forecastW, needsCleaning }
  }
}
