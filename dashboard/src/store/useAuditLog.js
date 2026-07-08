// AquaWise — Audit Log Store
import { create } from 'zustand'

export const SEVERITY = {
  critical: {
    label:  'Critical',
    // row tint — very subtle, works in both light + dark
    rowDark:  'rgba(239,68,68,0.06)',
    rowLight: 'rgba(239,68,68,0.05)',
    // pill styles use inline style so they're theme-independent
    pillBg:     'rgba(239,68,68,0.12)',
    pillColor:  '#ef4444',
    pillBorder: 'rgba(239,68,68,0.25)',
  },
  warning: {
    label:    'Warning',
    rowDark:  'rgba(245,158,11,0.06)',
    rowLight: 'rgba(245,158,11,0.05)',
    pillBg:     'rgba(245,158,11,0.12)',
    pillColor:  '#d97706',
    pillBorder: 'rgba(245,158,11,0.30)',
  },
  info: {
    label:    'Info',
    rowDark:  'rgba(59,130,246,0.06)',
    rowLight: 'rgba(59,130,246,0.04)',
    pillBg:     'rgba(59,130,246,0.12)',
    pillColor:  '#3b82f6',
    pillBorder: 'rgba(59,130,246,0.25)',
  },
  ok: {
    label:    'Resolved',
    rowDark:  'rgba(16,185,129,0.06)',
    rowLight: 'rgba(16,185,129,0.05)',
    pillBg:     'rgba(16,185,129,0.12)',
    pillColor:  '#10b981',
    pillBorder: 'rgba(16,185,129,0.25)',
  },
  action: {
    label:    'Action',
    rowDark:  'rgba(139,92,246,0.06)',
    rowLight: 'rgba(139,92,246,0.04)',
    pillBg:     'rgba(139,92,246,0.12)',
    pillColor:  '#8b5cf6',
    pillBorder: 'rgba(139,92,246,0.25)',
  },
}

export const CATEGORY = {
  water:    'Water',
  energy:   'Energy',
  pump:     'Pump',
  system:   'System',
  security: 'Security',
}

const MAX_EVENTS = 500

const useAuditLog = create((set) => ({
  events: [],
  record: ({ category, severity, title, detail = '' }) => {
    const event = {
      id:        Date.now() + Math.random(),
      timestamp: new Date(),
      category,
      severity,
      title,
      detail,
    }
    set(s => ({ events: [event, ...s.events].slice(0, MAX_EVENTS) }))
  },
  clearLog: () => set({ events: [] }),
}))

export default useAuditLog
