import { create } from 'zustand'
import { generateSensorData, generateHistoryData, tickSensors, appendHistory } from '../utils/mockData'

// Tick interval in milliseconds — simulates how often the ESP32 sends data
const TICK_MS = 3000  // 3 seconds (change to 5000 for slower updates)

const useStore = create((set, get) => {
  // Start the live simulator ticker immediately
  setInterval(() => {
    const { sensors, history, pumpOn } = get()
    const next = tickSensors(sensors, pumpOn)
    set({
      sensors:     next,
      history:     appendHistory(history, next),
      lastUpdated: new Date(),
    })
  }, TICK_MS)

  return {
    // Live sensor readings — seeded with realistic initial values
    sensors:     generateSensorData(),
    history:     generateHistoryData(48),

    alerts: [
      { id: 1, type: 'warn',  time: '12:43', message: 'Battery level below 30% — consider reducing pump runtime',              read: false },
      { id: 2, type: 'ok',    time: '11:20', message: 'Reservoir refill complete — level at 87%',                             read: true  },
      { id: 3, type: 'alert', time: '09:05', message: 'Flow anomaly detected — possible micro-leak (AI confidence: 78%)',    read: false },
      { id: 4, type: 'info',  time: '08:00', message: 'Solar peak production window: 10:30 — 14:45 predicted',               read: true  },
      { id: 5, type: 'warn',  time: 'Yesterday', message: 'Pump temperature elevated to 68°C during afternoon cycle',        read: true  },
    ],

    sidebarOpen: true,
    lastUpdated: new Date(),

    // AI results (populated by useAIEngine hook every tick)
    aiResults: {
      leak:          { isLeak: false, rollingMean: 0, consecutiveHigh: 0 },
      maintenance:   { state: 0, label: 'healthy' },
      ph:            { contaminated: false, deviation: 0, rollingMean: 0 },
      panel:         { needsCleaning: false, ratio: null },
      solarForecast: 0,
      panelSoiled:   false,
    },
    setAiResults: (results) => set({ aiResults: results }),

    // Actions
    toggleSidebar:  () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    markAlertRead:  (id) => set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a) })),
    refreshSensors: () => set({ sensors: tickSensors(get().sensors, get().pumpOn), lastUpdated: new Date() }),
    pumpOn: false,
    togglePump:     () => set(s => ({ pumpOn: !s.pumpOn })),
  }
})

export default useStore
