/**
 * @file ph_model.js
 * @description In-browser Random Forest water-quality (pH proxy) detector.
 *
 * ## What it does
 * Estimates water quality by detecting anomalous reservoir-level behaviour.
 * Sudden deviations from the rolling baseline act as a proxy for chemical
 * disturbances (e.g. contamination events or sensor drift) that often
 * correlate with pH swings in real distribution networks.
 *
 * Outputs a quality class:
 *   - **0 — Good**: stable levels, pH likely within safe range
 *   - **1 — Caution**: moderate deviation detected, monitor closely
 *   - **2 — Poor**: persistent anomaly, trigger water-quality alert
 *
 * ## Algorithm
 * Random Forest — 10 decision trees trained on reservoir telemetry.
 * Each tree votes for a class; plurality wins.
 *
 * ## Features fed to each tree
 * | Feature            | Description                                                 |
 * |--------------------|-------------------------------------------------------------|
 * | deviation          | |level - rollingMean| / max(rollingMean, 1) — normalised  |
 * | rollingmeandev     | Mean deviation over the last PH_WINDOW ticks                |
 * | rollingstddev      | Std-dev of deviation over the same window                   |
 * | consecutivedev     | Consecutive ticks where deviation > 0.05                   |
 *
 * ## Usage
 * ```js
 * import { makePHDetector } from './ph_model'
 * const detect = makePHDetector()         // create once
 * const { quality, label } = detect(reservoirLevel)
 * // quality: 0 | 1 | 2    label: 'good' | 'caution' | 'poor'
 * ```
 *
 * @module ph_model
 */

/** Number of ticks in the rolling deviation window. */
const PH_WINDOW = 5

// ─── 10 Decision Trees ───────────────────────────────────────────────────────

function ptree0(f){if(f.deviation<0.04731)return 0;else if(f.consecutivedev<1.5)return 1;else if(f.rollingstddev<0.03112)return 1;else return 2;}
function ptree1(f){if(f.deviation<0.04892)return 0;else if(f.rollingmeandev<0.06124)return 1;else if(f.consecutivedev<2.5)return 1;else return 2;}
function ptree2(f){if(f.consecutivedev<0.5)return 0;else if(f.deviation<0.07442){if(f.consecutivedev<1.5)return 1;else return 1;}else return 2;}
function ptree3(f){if(f.deviation<0.04731)return 0;else if(f.consecutivedev<2.5){if(f.rollingstddev<0.02681)return 1;else return 1;}else return 2;}
function ptree4(f){if(f.deviation<0.04892)return 0;else if(f.rollingmeandev<0.05810)return 1;else return 2;}
function ptree5(f){if(f.consecutivedev<0.5)return 0;else if(f.rollingmeandev<0.06124){if(f.deviation<0.07442)return 1;else return 2;}else return 2;}
function ptree6(f){if(f.deviation<0.05012)return 0;else if(f.consecutivedev<1.5)return 1;else if(f.rollingstddev<0.02917)return 2;else return 2;}
function ptree7(f){if(f.rollingmeandev<0.04122)return 0;else if(f.consecutivedev<2.5)return 1;else return 2;}
function ptree8(f){if(f.deviation<0.04731)return 0;else if(f.consecutivedev<1.5){if(f.rollingmeandev<0.05810)return 1;else return 1;}else return 2;}
function ptree9(f){if(f.consecutivedev<0.5)return 0;else if(f.rollingstddev<0.03249){if(f.consecutivedev<2.5)return 1;else return 2;}else return 2;}

// ─── Ensemble voting ─────────────────────────────────────────────────────────

/**
 * Run all 10 trees and return the plurality class.
 *
 * @param {{
 *   deviation: number,
 *   rollingmeandev: number,
 *   rollingstddev: number,
 *   consecutivedev: number
 * }} f - Pre-engineered feature object.
 * @returns {0|1|2} Water quality class.
 */
export function predictPH(f) {
  const votes  = [ptree0,ptree1,ptree2,ptree3,ptree4,ptree5,ptree6,ptree7,ptree8,ptree9].map(t => t(f))
  const counts = [0, 0, 0]
  votes.forEach(v => counts[v]++)
  return counts.indexOf(Math.max(...counts)) // 0=good, 1=caution, 2=poor
}

// ─── Stateful detector factory ───────────────────────────────────────────────

/**
 * Create a stateful water-quality detector that maintains its own rolling window.
 *
 * @returns {(reservoirLevel: number) => { quality: 0|1|2, label: string, deviation: number }}
 *   Detection function. Call on every sensor tick.
 *
 * @example
 * const detect = makePHDetector()
 * const { quality, label } = detect(reservoirLevel)
 * // label: 'good' | 'caution' | 'poor'
 */
export function makePHDetector() {
  /** @type {number[]} Recent reservoir level values. */
  let levelBuffer = []
  /** @type {number[]} Recent deviation values. */
  let devBuffer   = []

  return function detect(reservoirLevel) {
    // Update level window
    levelBuffer.push(reservoirLevel)
    if (levelBuffer.length > PH_WINDOW) levelBuffer.shift()

    const rollingMean = levelBuffer.reduce((a, b) => a + b, 0) / levelBuffer.length
    const deviation   = Math.abs(reservoirLevel - rollingMean) / Math.max(rollingMean, 1)

    // Update deviation window
    devBuffer.push(deviation)
    if (devBuffer.length > PH_WINDOW) devBuffer.shift()

    const rollingMeanDev = devBuffer.reduce((a, b) => a + b, 0) / devBuffer.length
    const rollingStdDev  = Math.sqrt(
      devBuffer.reduce((a, b) => a + (b - rollingMeanDev) ** 2, 0) / devBuffer.length
    )

    // Consecutive ticks above deviation threshold
    let consecutiveDev = 0
    for (let i = devBuffer.length - 1; i >= 0; i--) {
      if (devBuffer[i] > 0.05) consecutiveDev++; else break
    }
    consecutiveDev = Math.min(consecutiveDev, PH_WINDOW)

    const quality = predictPH({
      deviation,
      rollingmeandev: rollingMeanDev,
      rollingstddev:  rollingStdDev,
      consecutivedev: consecutiveDev,
    })

    return { quality, label: ['good', 'caution', 'poor'][quality], deviation }
  }
}
