import React, { useState } from 'react'
import { Settings, Wifi, Bell, Database, Shield } from 'lucide-react'
import useStore from '../store/useStore'

export default function SettingsPage() {
  const { sensors } = useStore()
  const [refreshRate, setRefreshRate] = useState(10)
  const [notifications, setNotifications] = useState(true)
  const [firebaseUrl, setFirebaseUrl] = useState('https://aquagrid-ai-default-rtdb.firebaseio.com')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">System configuration and connectivity</p>
      </div>

      {/* Connectivity */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Wifi size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-200">Connectivity</h3>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Firebase Realtime DB URL</label>
          <input
            value={firebaseUrl}
            onChange={e => setFirebaseUrl(e.target.value)}
            className="w-full bg-surface-bg border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">ESP32 WiFi Signal</p>
            <p className="text-xs text-slate-500 mt-0.5">{sensors.wifiRssi} dBm — {sensors.wifiRssi > -65 ? 'Strong' : 'Weak'} signal</p>
          </div>
          <span className={sensors.wifiRssi > -65 ? 'badge-ok' : 'badge-warn'}>
            {sensors.wifiRssi > -65 ? 'Strong' : 'Weak'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Device Uptime</p>
            <p className="text-xs text-slate-500 mt-0.5">{sensors.uptime} hours since last restart</p>
          </div>
          <span className="badge-ok">Online</span>
        </div>
      </div>

      {/* Data refresh */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Database size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-200">Data Settings</h3>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Auto-refresh interval: <span className="text-primary-400">{refreshRate}s</span></label>
          <input
            type="range" min="5" max="60" step="5"
            value={refreshRate}
            onChange={e => setRefreshRate(+e.target.value)}
            className="w-full accent-primary-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Data Protocol</p>
            <p className="text-xs text-slate-500">MQTT over WiFi → Firebase</p>
          </div>
          <span className="badge-ok">Active</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
        </div>
        {[
          { label: 'Reservoir alerts (overflow / empty)', key: 'reservoir' },
          { label: 'Leak detection alerts', key: 'leak' },
          { label: 'Battery low warnings', key: 'battery' },
          { label: 'Pump fault notifications', key: 'pump' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <p className="text-sm text-slate-300">{item.label}</p>
            <button
              onClick={() => setNotifications(n => !n)}
              className={`relative w-10 h-5 rounded-full transition-colors ${ notifications ? 'bg-primary-500' : 'bg-surface-border' }`}
              aria-label={`Toggle ${item.label}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${ notifications ? 'translate-x-5' : 'translate-x-0' }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Hardware info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-200">Hardware Info</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { k: 'Controller', v: 'ESP32 (Dual-core 240MHz)' },
            { k: 'Flow Sensor', v: 'YF-S201' },
            { k: 'Level Sensor', v: 'HC-SR04 (waterproof)' },
            { k: 'Power Monitor', v: 'INA219' },
            { k: 'Temp Sensor', v: 'DS18B20' },
            { k: 'Firmware', v: 'AquaGrid v0.1.0' },
          ].map(({ k, v }) => (
            <div key={k} className="flex justify-between gap-2 py-1.5 border-b border-surface-border last:border-0">
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-300 font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
