// ─── AquaGrid AI — Audit Log Store ────────────────────────────────────────────
// Records every significant event that happens in the system:
//   - Alerts fired (leak, battery, pump, water quality, etc.)
//   - Pump turned ON / OFF
//   - Manual sensor refresh
//   - Settings changes (future)
//
// Each event has: id, timestamp, category, severity, title, detail
import { create } from 'zustand'

export const SEVERITY = {
  critical: { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  warning:  { label: 'Warning',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  info:     { label: 'Info',     color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  ok:       { label: 'Resolved', color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20'},
  action:   { label: 'Action',   color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
}

export const CATEGORY = {
  water:    'Water',
  energy:   'Energy',
  pump:     'Pump',
  system:   'System',
  security: 'Security',
}

const MAX_EVENTS = 500

const useAuditLog = create((set, get) => ({
  events: [],

  // Record a new audit event
  // params: { category, severity, title, detail }
  record: ({ category, severity, title, detail = '' }) => {
    const event = {
      id:        Date.now() + Math.random(),
      timestamp: new Date(),
      category,
      severity,
      title,
      detail,
    }
    set(s => ({
      events: [event, ...s.events].slice(0, MAX_EVENTS)
    }))
  },

  clearLog: () => set({ events: [] }),
}))

export default useAuditLog
