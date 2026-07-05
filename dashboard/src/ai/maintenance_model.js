/**
 * @file maintenance_model.js
 * @description In-browser Random Forest predictive maintenance detector.
 *
 * ## What it does
 * Classifies the current pump operating state into one of three health levels:
 *   - **0 — Healthy**: normal operation, no action needed
 *   - **1 — Warning**: degraded efficiency or rising current; schedule inspection
 *   - **2 — Critical**: imminent failure risk; stop pump / alert operator
 *
 * ## Algorithm
 * Random Forest — 15 decision trees trained on pump telemetry data.
 * Each tree votes for a health class (0 / 1 / 2). The class with the
 * most votes is returned (plurality voting).
 *
 * ## Features fed to each tree
 * | Feature               | Description                                                  |
 * |-----------------------|--------------------------------------------------------------|
 * | currentavg            | Motor current draw this tick (A)                             |
 * | flowavg               | Water flow rate this tick (L/min)                            |
 * | tempavg               | Pump housing temperature (°C)                                |
 * | efficiency            | currentavg / max(flowavg, 0.5) — current-per-litre ratio     |
 * | rollingslopecurrent   | Linear trend of motor current over last MAINT_WINDOW ticks   |
 * | rollingslopeefficiency| Linear trend of efficiency over last MAINT_WINDOW ticks      |
 *
 * **Key intuition**: a rising `rollingslopeefficiency` (the pump needs more
 * current to move the same water) combined with high temperature is the
 * earliest indicator of bearing wear or impeller damage.
 *
 * ## Usage
 * ```js
 * import { makeMaintenanceDetector } from './maintenance_model'
 * const detect = makeMaintenanceDetector()           // create once
 * const { state, label } = detect(current, flow, temp)
 * // state: 0 | 1 | 2    label: 'healthy' | 'warning' | 'critical'
 * ```
 *
 * @module maintenance_model
 */

/**
 * Compute the least-squares slope of an array of values.
 * Returns 0 for arrays shorter than 2 elements.
 *
 * @param {number[]} vals - Time-ordered array of numeric values.
 * @returns {number} Slope (units per tick).
 */
function slope(vals) {
  if (vals.length < 2) return 0
  const n = vals.length
  const xs = [...Array(n).keys()]
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = vals.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (vals[i] - yMean)
    den += (xs[i] - xMean) ** 2
  }
  return den === 0 ? 0 : num / den
}

// ─── 15 Decision Trees ───────────────────────────────────────────────────────
// Returns 0 (healthy), 1 (warning), or 2 (critical).

function mtree0(f){if(f.currentavg<2.21087){if(f.currentavg<2.06710){if(f.rollingslopeefficiency<-0.03705)return 1;else if(f.rollingslopeefficiency<-0.02116){if(f.tempavg<44.56876)return 0;else return 1;}else if(f.tempavg<44.73301)return 0;else return 0;}else if(f.tempavg<44.19658){if(f.efficiency<0.44190)return 0;else return 1;}else if(f.flowavg<7.03657){if(f.rollingslopecurrent<0.00348)return 1;else return 0;}else if(f.rollingslopecurrent<0.00410)return 0;else return 0;}else if(f.tempavg<50.12525){if(f.currentavg<2.57624){if(f.efficiency<0.35340)return 1;else return 1;}else if(f.currentavg<2.73260){if(f.rollingslopecurrent<0.04952)return 2;else return 1;}else return 2;}else if(f.currentavg<2.57624)return 2;else return 2;}
function mtree1(f){if(f.currentavg<2.23118){if(f.tempavg<45.62606){if(f.efficiency<0.30608)return 0;else if(f.rollingslopecurrent<0.00132)return 1;else if(f.currentavg<2.08018)return 0;else return 0;}else if(f.currentavg<2.02770)return 1;else return 1;}else if(f.tempavg<50.24890){if(f.tempavg<48.51091){if(f.rollingslopecurrent<0.04836)return 1;else return 2;}else if(f.currentavg<2.57377)return 1;else return 2;}else if(f.flowavg<5.80098)return 2;else if(f.currentavg<2.60570)return 1;else return 2;}
function mtree2(f){if(f.efficiency<0.37249){if(f.currentavg<2.14447){if(f.rollingslopeefficiency<-0.01843)return 0;else if(f.flowavg<6.31426)return 0;else return 0;}else if(f.currentavg<2.28757)return 1;else if(f.flowavg<7.56211)return 1;else return 1;}else if(f.efficiency<0.48731){if(f.currentavg<2.55016){if(f.rollingslopeefficiency<-0.03875)return 2;else return 1;}else if(f.tempavg<50.33182)return 2;else return 2;}else if(f.tempavg<49.98672)return 2;else return 2;}
function mtree3(f){if(f.currentavg<2.21304){if(f.efficiency<0.31162)return 0;else if(f.tempavg<44.19061)return 0;else if(f.efficiency<0.41829)return 0;else return 1;}else if(f.efficiency<0.48936){if(f.tempavg<51.14383)return 1;else if(f.currentavg<2.45279)return 1;else return 2;}else if(f.flowavg<4.01405)return 2;else if(f.tempavg<50.35851)return 2;else return 2;}
function mtree4(f){if(f.tempavg<46.14004){if(f.efficiency<0.32038)return 0;else if(f.rollingslopeefficiency<-0.02112)return 1;else return 0;}else if(f.flowavg<5.04039){if(f.currentavg<2.47222)return 1;else return 2;}else if(f.efficiency<0.46645)return 2;else return 2;}
function mtree5(f){if(f.efficiency<0.37446){if(f.efficiency<0.30576)return 0;else if(f.rollingslopeefficiency<-0.01336)return 1;else return 0;}else if(f.rollingslopeefficiency<-0.02454){if(f.efficiency<0.43759)return 2;else return 2;}else if(f.rollingslopeefficiency<0.03329)return 2;else return 2;}
function mtree6(f){if(f.efficiency<0.37686){if(f.currentavg<2.17405)return 0;else if(f.rollingslopeefficiency<0.00224)return 1;else return 0;}else if(f.efficiency<0.48775)return 1;else return 2;}
function mtree7(f){if(f.tempavg<46.20036){if(f.efficiency<0.33685)return 0;else if(f.currentavg<2.26084)return 0;else return 1;}else if(f.tempavg<50.47901){if(f.currentavg<2.58162)return 1;else return 2;}else return 2;}
function mtree8(f){if(f.tempavg<46.14694){if(f.currentavg<2.14471)return 0;else if(f.currentavg<2.21887)return 0;else return 1;}else if(f.efficiency<0.49428)return 2;else return 2;}
function mtree9(f){if(f.rollingslopeefficiency<-0.01685){if(f.currentavg<2.46312)return 0;else if(f.efficiency<0.51141)return 1;else return 2;}else if(f.efficiency<0.48291)return 1;else return 2;}
function mtree10(f){if(f.rollingslopeefficiency<-0.01425){if(f.currentavg<2.46312)return 0;else return 2;}else if(f.tempavg<46.27946){if(f.efficiency<0.34117)return 0;else return 1;}else return 2;}
function mtree11(f){if(f.efficiency<0.37731){if(f.efficiency<0.31242)return 0;else return 1;}else if(f.efficiency<0.48931)return 1;else return 2;}
function mtree12(f){if(f.rollingslopeefficiency<-0.01491){if(f.flowavg<5.90898)return 2;else return 2;}else if(f.currentavg<2.21316)return 0;else return 2;}
function mtree13(f){if(f.efficiency<0.37966){if(f.currentavg<2.15217)return 0;else return 1;}else if(f.efficiency<0.50139)return 1;else return 2;}
function mtree14(f){if(f.efficiency<0.37686){if(f.efficiency<0.31242)return 0;else return 1;}else if(f.flowavg<4.98009)return 1;else return 2;}

// ─── Ensemble voting ─────────────────────────────────────────────────────────

/**
 * Run all 15 trees and return the plurality class.
 *
 * @param {{
 *   currentavg: number,
 *   flowavg: number,
 *   tempavg: number,
 *   efficiency: number,
 *   rollingslopecurrent: number,
 *   rollingslopeefficiency: number
 * }} f - Pre-engineered feature object.
 * @returns {0|1|2} Pump health class.
 */
export function predictMaintenance(f) {
  const votes  = [mtree0,mtree1,mtree2,mtree3,mtree4,mtree5,mtree6,mtree7,mtree8,mtree9,mtree10,mtree11,mtree12,mtree13,mtree14].map(t => t(f))
  const counts = [0, 0, 0]
  votes.forEach(v => counts[v]++)
  return counts.indexOf(Math.max(...counts)) // 0=healthy, 1=warning, 2=critical
}

// ─── Stateful detector factory ───────────────────────────────────────────────

/** Number of ticks kept in each rolling window. */
const MAINT_WINDOW = 5

/**
 * Create a stateful maintenance detector that tracks its own rolling windows
 * for current and efficiency trends.
 *
 * @returns {(current: number, flow: number, temp: number) => { state: 0|1|2, label: string }}
 *   Detection function. Call on every sensor tick.
 *
 * @example
 * const detect = makeMaintenanceDetector()
 * const { state, label } = detect(pumpMotorCurrent, flowRate, pumpTemp)
 * // label: 'healthy' | 'warning' | 'critical'
 */
export function makeMaintenanceDetector() {
  /** @type {number[]} Recent motor current values. */
  let currents = []
  /** @type {number[]} Recent efficiency (A / (L/min)) values. */
  let effs = []

  return function detect(current, flow, temp) {
    const efficiency = current / Math.max(flow, 0.5)

    // Update rolling windows
    currents.push(current)
    effs.push(efficiency)
    if (currents.length > MAINT_WINDOW) currents.shift()
    if (effs.length > MAINT_WINDOW) effs.shift()

    const state = predictMaintenance({
      currentavg:            current,
      flowavg:               flow,
      tempavg:               temp,
      efficiency,
      rollingslopecurrent:    slope(currents),
      rollingslopeefficiency: slope(effs),
    })

    return { state, label: ['healthy', 'warning', 'critical'][state] }
  }
}
