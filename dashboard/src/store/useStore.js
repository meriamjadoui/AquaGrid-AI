import { create } from 'zustand'
import { generateSensorData, generateHistoryData } from '../utils/mockData'

const useStore = create((set, get) => ({
  // Live sensor readings
  sensors: generateSensorData(),
  history: generateHistoryData(48),
  alerts: [
    { id: 1, type: 'warn',  time: '12:43', message: 'Battery level below 30% — consider reducing pump runtime', read: false },
    { id: 2, type: 'ok',    time: '11:20', message: 'Reservoir refill complete — level at 87%', read: true },
    { id: 3, type: 'alert', time: '09:05', message: 'Flow anomaly detected — possible micro-leak (AI confidence: 78%)', read: false },
    { id: 4, type: 'info',  time: '08:00', message: 'Solar peak production window: 10:30 — 14:45 predicted', read: true },
    { id: 5, type: 'warn',  time: 'Yesterday', message: 'Pump temperature elevated to 68°C during afternoon cycle', read: true },
  ],
  sidebarOpen: true,
  lastUpdated: new Date(),

  // AI results (populated by useAIEngine hook)
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
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  markAlertRead: (id) => set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a) })),
  refreshSensors: () => set({ sensors: generateSensorData(), lastUpdated: new Date() }),
  pumpOn: false,
  togglePump: () => set(s => ({ pumpOn: !s.pumpOn })),
}))

export default useStore
