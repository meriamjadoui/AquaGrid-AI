// useAIEngine.js
// React hook that wires all 4 AI models to the live sensor stream from useStore.
// Call this once at app level; results are written back into the store via aiResults.

import { useEffect, useRef, useState } from 'react'
import { makeLeakDetector } from './leak_model'
import { makeMaintenanceDetector } from './maintenance_model'
import { makeWaterQualityDetector } from './ph_model'
import { makePanelHealthDetector, buildForecastFeatures, forecastSolarCurrent } from './energy_model_v2'
import useStore from '../store/useStore'

export default function useAIEngine() {
  const sensors = useStore(s => s.sensors)

  // Persistent detectors across renders
  const leakDetector   = useRef(makeLeakDetector())
  const maintDetector  = useRef(makeMaintenanceDetector())
  const phDetector     = useRef(makeWaterQualityDetector())
  const panelDetector  = useRef(makePanelHealthDetector())
  const prevIrradiance = useRef(sensors.solarProduction)

  const [ai, setAi] = useState({
    leak:        { isLeak: false, rollingMean: 0, consecutiveHigh: 0 },
    maintenance: { state: 0, label: 'healthy' },
    ph:          { contaminated: false, deviation: 0, rollingMean: 0 },
    panel:       { needsCleaning: false, ratio: null },
    solarForecast: sensors.solarProduction,
    panelSoiled: false,
  })

  useEffect(() => {
    // --- Leak detection ---
    // lossRatio: how much water is "lost" relative to inflow
    // Derived from flow vs reservoir delta (reservoir decreases when pump is off)
    const reservoirDelta = 0 // in live system: current - previous reading
    const lossRatio = sensors.flowRate > 0
      ? Math.min(1, Math.max(0, (sensors.flowRate - reservoirDelta) / sensors.flowRate))
      : 0
    const leakResult = leakDetector.current(lossRatio)

    // --- Maintenance detection (per pump session) ---
    const maintResult = maintDetector.current(
      sensors.pumpMotorCurrent,
      sensors.flowRate,
      sensors.pumpTemp
    )

    // --- pH / water quality ---
    // phReading simulated from reservoir quality (ideal ~7.2)
    const phReading = 7.2 + (sensors.reservoirLevel - 70) * 0.01
    const phResult = phDetector.current(phReading)

    // --- Panel health ---
    const hour = new Date().getHours()
    const panelResult = panelDetector.current(
      sensors.solarProduction,
      hour,
      sensors.pumpMotorCurrent
    )

    // --- Solar forecast ---
    const forecastFeatures = buildForecastFeatures({
      hour,
      irradianceNow: sensors.solarProduction * 5, // W → rough lux proxy
      prevHourIrradiance: prevIrradiance.current * 5,
      currentNow: sensors.pumpMotorCurrent,
    })
    const solarForecast = forecastSolarCurrent(forecastFeatures) * 20 // scale back to W
    prevIrradiance.current = sensors.solarProduction

    setAi({
      leak:        leakResult,
      maintenance: maintResult,
      ph:          phResult,
      panel:       panelResult,
      solarForecast: Math.min(120, Math.max(0, solarForecast)),
      panelSoiled: panelResult.needsCleaning,
    })
  }, [sensors])

  return ai
}
