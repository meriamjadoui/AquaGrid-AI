/**
 * useAIEngine.js — Central AI Inference Hook
 * ===========================================
 * This React hook is the bridge between live sensor data and the four
 * in-browser AI models. It runs on every sensor tick (every 3 seconds)
 * and pushes fresh AI results into the Zustand store, where they are
 * consumed by:
 *   - Alert rules in useStore.js (e.g. leak_detected, pump_critical)
 *   - AIPage.jsx (live model result cards)
 *   - WaterPage.jsx (Leak Risk KPI, pH Quality KPI)
 *   - EnergyPage.jsx (AI Solar Forecast gauge, Panel Health KPI)
 *
 * No external API calls are made. All inference is synchronous JavaScript.
 *
 * Usage:
 *   Place <AIProvider> as a wrapper around your router in App.jsx.
 *   The hook calls useEffect with sensors as a dependency so it re-runs
 *   on every sensor state update from the Zustand tick interval.
 */

import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { makeLeakDetector }        from './leak_model'
import { makeMaintenanceDetector } from './maintenance_model'
import { makePHDetector }          from './ph_model'
import { makeEnergyForecaster }    from './energy_model_v2'
import { autoencoder }             from './adaptive_anomaly_model'

/**
 * Rolling window helper.
 * Maintains a fixed-size array of the last N values for a given metric.
 * Used to compute rolling means and consecutive-count features for each model.
 *
 * @param {React.MutableRefObject} ref  useRef object holding the ring buffer
 * @param {number} value                New value to append
 * @param {number} size                 Maximum window size
 * @returns {number[]} Current window contents (up to `size` most recent values)
 */
function pushWindow(ref, value, size = 10) {
  ref.current = [...ref.current, value].slice(-size)
  return ref.current
}

/**
 * AIProvider
 * Wrapper component. Mount once at the top of your component tree (in App.jsx).
 * Internally calls useAIEngine() so the inference hook is always active.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AIProvider({ children }) {
  useAIEngine()
  return children
}

/**
 * useAIEngine()
 * The core inference hook. Runs all four models on every sensor update.
 *
 * Feature engineering per model:
 *
 * LEAK DETECTION
 *   lossRatio         = flowRate / max(reservoirLevel, 1)
 *                       High ratio = more water leaving than expected
 *   rollingMean       = mean of last 10 lossRatio values
 *   consecutiveHigh   = ticks in a row where lossRatio > 0.15
 *
 * PREDICTIVE MAINTENANCE
 *   Uses raw: pumpMotorCurrent, flowRate, pumpTemp
 *   Derived:  efficiencyDelta  = current efficiency vs rolling baseline
 *             slope            = direction of recent efficiency trend
 *   Output:   state 0 (healthy) / 1 (warning) / 2 (critical)
 *
 * pH / WATER QUALITY
 *   deviation         = |reservoirLevel - rollingMean| normalised
 *   rollingMean       = mean of last 10 reservoir readings
 *   consecutiveDev    = ticks in a row where deviation > threshold
 *
 * SOLAR ENERGY FORECAST (GBT + soiling RF)
 *   Main GBT (25 trees): solarProduction, pumpMotorCurrent, hour → forecast W
 *   Soiling RF (5 trees): efficiency ratio (actual / theoretical max) → needsCleaning
 */
export function useAIEngine() {
  const sensors      = useStore(s => s.sensors)
  const setAiResults = useStore(s => s.setAiResults)

  // Rolling window buffers (persist across renders via useRef)
  const lossRatioWindow    = useRef([])
  const reservoirWindow    = useRef([])
  const efficiencyWindow   = useRef([])
  const consecutiveLeak    = useRef(0)
  const consecutiveDev     = useRef(0)

  // Instantiate model inference functions once
  const detectLeak        = useRef(makeLeakDetector()).current
  const detectMaintenance = useRef(makeMaintenanceDetector()).current
  const detectPH          = useRef(makePHDetector()).current
  const forecastEnergy    = useRef(makeEnergyForecaster()).current

  useEffect(() => {
    const { flowRate, reservoirLevel, pumpMotorCurrent, pumpTemp, solarProduction } = sensors
    const hour = new Date().getHours()

    // ── Leak Detection features ──────────────────────────────────────────────
    const lossRatio = flowRate / Math.max(reservoirLevel, 1)
    const lossWindow = pushWindow(lossRatioWindow, lossRatio)
    const lossRollingMean = lossWindow.reduce((a, b) => a + b, 0) / lossWindow.length
    consecutiveLeak.current = lossRatio > 0.15
      ? consecutiveLeak.current + 1
      : Math.max(0, consecutiveLeak.current - 1)

    const leak = detectLeak({ lossRatio, rollingMean: lossRollingMean, consecutiveHighLoss: consecutiveLeak.current })

    // ── Predictive Maintenance features ────────────────────────────────────────
    const efficiency = flowRate > 0 ? pumpMotorCurrent / flowRate : 0
    const effWindow  = pushWindow(efficiencyWindow, efficiency)
    const effMean    = effWindow.reduce((a, b) => a + b, 0) / effWindow.length
    const effDelta   = efficiency - effMean
    const slope      = effWindow.length > 1 ? effWindow[effWindow.length - 1] - effWindow[0] : 0

    const maintenance = detectMaintenance({ pumpMotorCurrent, flowRate, pumpTemp, efficiencyDelta: effDelta, slope })

    // ── pH / Water Quality features ───────────────────────────────────────────
    const resWindow   = pushWindow(reservoirWindow, reservoirLevel)
    const resMean     = resWindow.reduce((a, b) => a + b, 0) / resWindow.length
    const deviation   = Math.abs(reservoirLevel - resMean) / Math.max(resMean, 1)
    consecutiveDev.current = deviation > 0.05
      ? consecutiveDev.current + 1
      : Math.max(0, consecutiveDev.current - 1)

    const ph = detectPH({ deviation, rollingMean: deviation, consecutiveDeviation: consecutiveDev.current })

    // ── Solar Energy Forecast features ──────────────────────────────────────────
    const theoreticalMax = hour >= 7 && hour <= 19
      ? Math.max(0, 95 * Math.sin(Math.PI * (hour - 7) / 12))
      : 1
    const panelEfficiencyRatio = solarProduction / Math.max(theoreticalMax, 1)
    const energy = forecastEnergy({ solarProduction, pumpMotorCurrent, hour, efficiency: panelEfficiencyRatio })

    // ── Adaptive Autoencoder Anomaly Detection ───────────────────────────────
    // We run the TensorFlow.js predictions and training asynchronously so we don't block the UI thread.
    const runDeepLearning = async () => {
      let anomalyScore = useStore.getState().aiResults.anomalyScore ?? 0;
      
      if (!autoencoder.isReady && !autoencoder.isTraining) {
        const history = useStore.getState().history;
        if (history.length > 20) {
          // Fire and forget training (runs in background)
          autoencoder.train(history); 
        }
      } else if (autoencoder.isReady && !autoencoder.isTraining) {
        anomalyScore = await autoencoder.predictAnomaly(sensors);
      }

      // Push all results to the Zustand store in a single update
      setAiResults({
        leak,
        maintenance,
        ph,
        solarForecast:  energy?.forecast  ?? 0,
        panel: {
          needsCleaning: energy?.needsCleaning ?? false,
          ratio:         panelEfficiencyRatio,
        },
        anomalyScore,
        autoencoderStatus: autoencoder.isTraining ? 'Training...' : (autoencoder.isReady ? 'Active' : 'Gathering baseline data...'),
      });
    };

    runDeepLearning();
  }, [sensors])
}
