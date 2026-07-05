/**
 * @file leak_model.js
 * @description In-browser Random Forest leak detector for the AquaGrid-AI dashboard.
 *
 * ## What it does
 * Classifies each 3-second sensor tick as "leak" or "no leak" by examining
 * the water loss ratio (how much water is disappearing relative to inflow)
 * and its statistical behaviour over the last 5 ticks.
 *
 * ## Algorithm
 * Random Forest — 11 decision trees trained on synthetic sensor data.
 * Each tree votes 0 (no leak) or 1 (leak). The class with more than 50 %
 * of votes wins. Using multiple trees reduces variance and avoids single-tree
 * over-fitting on noisy sensor streams.
 *
 * ## Features fed to each tree
 * | Feature          | Description                                          |
 * |------------------|------------------------------------------------------|
 * | currentloss      | Current tick's loss ratio  (flowRate / reservoir)    |
 * | rollingmeanloss  | Mean of the last LEAK_WINDOW loss ratios             |
 * | rollingstdloss   | Std-dev of the same window (spread of recent values) |
 * | consecutivehigh  | How many consecutive ticks had lossRatio > 0.15      |
 *
 * ## Usage
 * ```js
 * import { makeLeakDetector } from './leak_model'
 * const detect = makeLeakDetector()          // create once
 * const result = detect(lossRatio)           // call on every tick
 * // result → { isLeak: boolean, rollingMean: number, consecutiveHigh: number }
 * ```
 *
 * @module leak_model
 */

/** Number of ticks kept in the rolling window (≈ 15 s at 3 s/tick). */
const LEAK_WINDOW = 5

// ─── 11 Decision Trees ────────────────────────────────────────────────────────
// Each function implements one binary decision tree produced during training.
// Variable names are lowercase feature names as used in the training pipeline.

function tree0(f){if(f.currentloss<0.27501)return 0;else if(f.rollingmeanloss<0.32994){if(f.currentloss<0.74821)return 1;else return 0;}else if(f.rollingstdloss<0.33956)return 1;else return 0;}
function tree1(f){if(f.currentloss<0.27501)return 0;else if(f.rollingmeanloss<0.31051){if(f.consecutivehigh>1.5)return 1;else return 0;}else if(f.rollingstdloss<0.34679)return 1;else return 0;}
function tree2(f){if(f.consecutivehigh<0.5)return 0;else if(f.consecutivehigh<2.5){if(f.rollingmeanloss<0.31407)return f.rollingstdloss<0.29379?1:0;else return 0;}else return 1;}
function tree3(f){if(f.consecutivehigh<1.5)return f.consecutivehigh<0.5?0:1;else if(f.rollingstdloss<0.29737)return 1;else if(f.consecutivehigh<2.5){if(f.currentloss<0.75425)return f.rollingstdloss<0.33840?1:0;else return 0;}else return 1;}
function tree4(f){if(f.consecutivehigh<0.5)return 0;else if(f.consecutivehigh<2.5){if(f.rollingmeanloss<0.28133)return f.rollingstdloss<0.29081?1:0;else return 0;}else return 1;}
function tree5(f){if(f.consecutivehigh<0.5)return 0;else if(f.currentloss<0.75066){if(f.consecutivehigh>2.5)return f.rollingmeanloss<0.28021?1:0;else return 1;}else return 0;}
function tree6(f){if(f.consecutivehigh<1.5){if(f.currentloss<0.27541)return 0;else if(f.rollingstdloss<0.29316)return 1;else return 0;}else if(f.rollingstdloss<0.34368){if(f.rollingmeanloss<0.32499)return 1;else return 1;}else return 0;}
function tree7(f){if(f.currentloss<0.27523)return 0;else if(f.currentloss<0.75068)return f.consecutivehigh>2.5?1:1;else return 0;}
function tree8(f){if(f.consecutivehigh<0.5)return 0;else if(f.currentloss<0.75066)return 1;else return 0;}
function tree9(f){if(f.currentloss<0.27501)return 0;else if(f.consecutivehigh>2.5)return f.currentloss<0.74821?1:0;else return 1;}
function tree10(f){if(f.currentloss<0.27501)return 0;else if(f.consecutivehigh>2.5)return f.currentloss<0.74996?f.rollingstdloss<0.34322?1:0:0;else return 1;}

// ─── Ensemble voting ─────────────────────────────────────────────────────────

/**
 * Run all 11 trees and return the majority vote.
 *
 * @param {{ currentloss: number, rollingmeanloss: number, rollingstdloss: number, consecutivehigh: number }} f
 *   Pre-engineered feature object.
 * @returns {0|1} 1 = leak detected, 0 = no leak.
 */
export function predictLeak(f) {
  const votes = [tree0,tree1,tree2,tree3,tree4,tree5,tree6,tree7,tree8,tree9,tree10].map(t => t(f))
  const sum = votes.reduce((a, b) => a + b, 0)
  return sum / votes.length > 0.5 ? 1 : 0
}

// ─── Stateful detector factory ───────────────────────────────────────────────

/**
 * Create a stateful leak detector that maintains its own rolling window.
 * Instantiate once per session; call the returned function on every sensor tick.
 *
 * @returns {(lossRatio: number) => { isLeak: boolean, rollingMean: number, consecutiveHigh: number }}
 *   Detection function.
 *
 * @example
 * const detect = makeLeakDetector()
 * // on each tick:
 * const { isLeak, rollingMean, consecutiveHigh } = detect(flowRate / Math.max(reservoirLevel, 1))
 */
export function makeLeakDetector() {
  /** @type {number[]} Sliding window of recent loss-ratio values. */
  let buffer = []

  return function detect(lossRatio) {
    // Maintain a fixed-size window
    buffer.push(lossRatio)
    if (buffer.length > LEAK_WINDOW) buffer.shift()

    const rollingMean = buffer.reduce((a, b) => a + b, 0) / buffer.length
    const rollingStd  = Math.sqrt(
      buffer.reduce((a, b) => a + (b - rollingMean) ** 2, 0) / buffer.length
    )

    // Count how many consecutive tail values are above the "high loss" threshold
    let consecutiveHigh = 0
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i] > 0.15) consecutiveHigh++; else break
    }
    consecutiveHigh = Math.min(consecutiveHigh, LEAK_WINDOW)

    const isLeak = predictLeak({
      currentloss:     lossRatio,
      rollingmeanloss: rollingMean,
      rollingstdloss:  rollingStd,
      consecutivehigh: consecutiveHigh,
    }) === 1

    return { isLeak, rollingMean, consecutiveHigh }
  }
}
