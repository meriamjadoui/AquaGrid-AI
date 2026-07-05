import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Overview from './pages/Overview'
import WaterPage from './pages/WaterPage'
import EnergyPage from './pages/EnergyPage'
import AIPage from './pages/AIPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'
import useAIEngine from './ai/useAIEngine'
import useStore from './store/useStore'

// AIProvider: runs the engine and syncs results to the store
function AIProvider({ children }) {
  const ai = useAIEngine()
  const setAiResults = useStore(s => s.setAiResults)
  useEffect(() => { setAiResults(ai) }, [ai])
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AIProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/water"    element={<WaterPage />} />
            <Route path="/energy"   element={<EnergyPage />} />
            <Route path="/ai"       element={<AIPage />} />
            <Route path="/alerts"   element={<AlertsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </AIProvider>
    </BrowserRouter>
  )
}
