import React, { useState } from 'react'
import { Wifi, Bell, Database, Shield, ChevronRight } from 'lucide-react'
import useStore from '../store/useStore'

export default function SettingsPage() {
  const { sensors } = useStore()
  const [refreshRate, setRefreshRate] = useState(10)
  const [notifications, setNotifications] = useState(true)
  const [firebaseUrl, setFirebaseUrl] = useState('https://aquagrid-ai-default-rtdb.firebaseio.com')

  const sectionTitle = (Icon, label) => (
    <div className="flex items-center gap-2.5 mb-2">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-dim)' }}>
        <Icon size={16} style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
      </div>
      <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{label}</h3>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Settings</h2>
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>System configuration and connectivity</p>
      </div>

      {/* Connectivity */}
      <div className="card space-y-5">
        {sectionTitle(Wifi, 'Connectivity')}
        <div>
          <label className="block text-xs mb-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Firebase Realtime DB URL</label>
          <input
            value={firebaseUrl}
            onChange={e => setFirebaseUrl(e.target.value)}
            className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all duration-200 font-medium"
            style={{
              background: 'var(--color-surface-bg)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
            }}
          />
        </div>
        <div className="flex items-center justify-between p-3" style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>ESP32 WiFi Signal</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {sensors.wifiRssi} dBm — {sensors.wifiRssi > -65 ? 'Strong' : 'Weak'} signal
            </p>
          </div>
          <span className={sensors.wifiRssi > -65 ? 'badge-ok' : 'badge-warn'}>
            {sensors.wifiRssi > -65 ? 'Strong' : 'Weak'}
          </span>
        </div>
        <div className="flex items-center justify-between p-3" style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Device Uptime</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>{sensors.uptime} hours since last restart</p>
          </div>
          <span className="badge-ok">Online</span>
        </div>
      </div>

      {/* Data refresh */}
      <div className="card space-y-5">
        {sectionTitle(Database, 'Data Settings')}
        <div>
          <label className="block text-xs mb-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Auto-refresh interval: <span style={{ color: 'var(--color-primary)' }}>{refreshRate}s</span>
          </label>
          <input
            type="range" min="5" max="60" step="5"
            value={refreshRate}
            onChange={e => setRefreshRate(+e.target.value)}
            className="w-full"
            style={{ accentColor: 'var(--color-primary)' }}
          />
        </div>
        <div className="flex items-center justify-between p-3" style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Data Protocol</p>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>MQTT over WiFi → Firebase</p>
          </div>
          <span className="badge-ok">Active</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-4">
        {sectionTitle(Bell, 'Notifications')}
        {[
          { label: 'Reservoir alerts (overflow / empty)', key: 'reservoir' },
          { label: 'Leak detection alerts',              key: 'leak' },
          { label: 'Battery low warnings',              key: 'battery' },
          { label: 'Pump fault notifications',          key: 'pump' },
        ].map(item => (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 transition-all duration-200"
            style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</p>
            <button
              onClick={() => setNotifications(n => !n)}
              className="relative w-11 h-6 transition-colors duration-200"
              style={{
                borderRadius: 'var(--radius-pill)',
                background: notifications
                  ? 'var(--color-primary)'
                  : 'var(--color-surface-border)',
              }}
              aria-label={`Toggle ${item.label}`}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                style={{
                  transform: notifications ? 'translateX(20px)' : 'translateX(0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Hardware info */}
      <div className="card">
        {sectionTitle(Shield, 'Hardware Info')}
        <div className="grid grid-cols-1 gap-2 mt-4">
          {[
            { k: 'Controller',   v: 'ESP32 (Dual-core 240MHz)' },
            { k: 'Flow Sensor',  v: 'YF-S201' },
            { k: 'Level Sensor', v: 'HC-SR04 (waterproof)' },
            { k: 'Power Monitor',v: 'INA219' },
            { k: 'Temp Sensor',  v: 'DS18B20' },
            { k: 'Firmware',     v: 'AquaGrid v0.1.0' },
          ].map(({ k, v }) => (
            <div
              key={k}
              className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs group transition-all duration-200"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>{k}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold" style={{ color: 'var(--color-text)' }}>{v}</span>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--color-text-faint)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
