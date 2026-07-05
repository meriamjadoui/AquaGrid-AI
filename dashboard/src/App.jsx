import React, { useEffect, Component } from 'react'
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

// Global error boundary — prevents black screen on runtime errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', padding: '2rem'
        }}>
          <h1 style={{ fontSize: '1.5rem', color: '#f87171', marginBottom: '1rem' }}>
            ⚠ AquaGrid — Runtime Error
          </h1>
          <pre style={{
            background: '#1e293b', padding: '1.5rem', borderRadius: '0.5rem',
            maxWidth: '700px', width: '100%', overflow: 'auto',
            fontSize: '0.8rem', color: '#fca5a5', whiteSpace: 'pre-wrap'
          }}>
            {this.state.error.toString()}
            {this.state.error.stack && '\n\n' + this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: '1.5rem', padding: '0.5rem 1.5rem',
              background: '#0891b2', color: '#fff', border: 'none',
              borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem'
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// AIProvider: runs the engine and syncs results to the store
function AIProvider({ children }) {
  const ai = useAIEngine()
  const setAiResults = useStore(s => s.setAiResults)
  useEffect(() => { setAiResults(ai) }, [ai])
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}
