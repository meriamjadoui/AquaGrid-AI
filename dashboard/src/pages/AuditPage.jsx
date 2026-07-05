import React, { useState, useMemo } from 'react'
import { ClipboardList, Filter, Download, Trash2, ChevronDown } from 'lucide-react'
import useAuditLog, { SEVERITY, CATEGORY } from '../store/useAuditLog'
import useStore from '../store/useStore'

const ALL = 'All'

function fmt(date) {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function downloadCSV(events) {
  const header = 'Timestamp,Category,Severity,Title,Detail\n'
  const rows = events.map(e =>
    [
      fmt(e.timestamp),
      e.category,
      SEVERITY[e.severity]?.label ?? e.severity,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${(e.detail ?? '').replace(/"/g, '""')}"`,
    ].join(',')
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `aquagrid-audit-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}

// KPI card colour config — theme-aware via inline style
const KPI_COLORS = [
  { label: 'Total Events',    key: 'total',    light: '#1a202c', dark: '#e2e8f0'  },
  { label: 'Critical Events', key: 'critical', light: '#dc2626', dark: '#f87171'  },
  { label: 'Warnings',        key: 'warning',  light: '#d97706', dark: '#fbbf24'  },
  { label: 'Actions Taken',   key: 'action',   light: '#7c3aed', dark: '#a78bfa'  },
]

export default function AuditPage() {
  const { events, clearLog } = useAuditLog()
  const theme = useStore(s => s.theme)
  const isDark = theme === 'dark'

  const [filterCategory, setFilterCategory] = useState(ALL)
  const [filterSeverity, setFilterSeverity] = useState(ALL)
  const [search,         setSearch]         = useState('')
  const [page,           setPage]           = useState(1)
  const PER_PAGE = 20

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filterCategory !== ALL && e.category !== filterCategory) return false
      if (filterSeverity !== ALL && e.severity !== filterSeverity) return false
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
          !e.detail.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [events, filterCategory, filterSeverity, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const setFilter  = (fn, val) => { fn(val); setPage(1) }

  const counts = useMemo(() => ({
    total:    events.length,
    critical: events.filter(e => e.severity === 'critical').length,
    warning:  events.filter(e => e.severity === 'warning').length,
    action:   events.filter(e => e.severity === 'action').length,
  }), [events])

  // Reusable theme-aware colour shortcuts
  const text        = 'var(--color-text)'
  const textMuted   = 'var(--color-text-muted)'
  const textFaint   = 'var(--color-text-faint)'
  const surfaceBg   = 'var(--color-surface-bg)'
  const surfaceBorder = 'var(--color-surface-border)'
  const surfaceHover  = 'var(--color-surface-hover)'
  const surfaceOffset = 'var(--color-surface-offset)'

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardList size={22} className="text-primary-500" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: text }}>Audit Log</h2>
            <p className="text-sm mt-0.5" style={{ color: textMuted }}>
              Complete history of system events, alerts and actions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(filtered)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'rgba(1,105,111,0.12)',
              color: isDark ? '#2fb4b8' : '#01696f',
              border: '1px solid rgba(1,105,111,0.25)',
            }}
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={clearLog}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: isDark ? '#f87171' : '#dc2626',
              border: '1px solid rgba(239,68,68,0.20)',
            }}
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPI_COLORS.map(k => (
          <div key={k.label} className="card text-center py-4">
            <p
              className="text-2xl font-bold data-value"
              style={{ color: isDark ? k.dark : k.light }}
            >
              {counts[k.key]}
            </p>
            <p className="text-xs mt-1" style={{ color: textMuted }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={14} style={{ color: textFaint }} className="shrink-0" />

          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setFilter(setSearch, e.target.value)}
            className="flex-1 min-w-[160px] rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors"
            style={{
              background: surfaceBg,
              border: `1px solid ${surfaceBorder}`,
              color: text,
            }}
          />

          {/* Category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilter(setFilterCategory, e.target.value)}
              className="appearance-none rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none cursor-pointer"
              style={{ background: surfaceBg, border: `1px solid ${surfaceBorder}`, color: text }}
            >
              <option value={ALL}>All Categories</option>
              {Object.values(CATEGORY).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textFaint }} />
          </div>

          {/* Severity */}
          <div className="relative">
            <select
              value={filterSeverity}
              onChange={e => setFilter(setFilterSeverity, e.target.value)}
              className="appearance-none rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none cursor-pointer"
              style={{ background: surfaceBg, border: `1px solid ${surfaceBorder}`, color: text }}
            >
              <option value={ALL}>All Severities</option>
              {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textFaint }} />
          </div>

          <span className="ml-auto text-xs" style={{ color: textFaint }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Event list ── */}
      <div className="card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: textMuted }}>
            <ClipboardList size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No events match your filters</p>
            <p className="text-xs mt-1" style={{ color: textFaint }}>Events are recorded automatically as the system runs</p>
          </div>
        ) : (
          <div>
            {paginated.map((e, idx) => {
              const sev   = SEVERITY[e.severity] ?? SEVERITY.info
              const rowBg = isDark ? sev.rowDark : sev.rowLight
              const isLast = idx === paginated.length - 1

              return (
                <div
                  key={e.id}
                  className="flex gap-4 px-5 py-3 transition-colors"
                  style={{
                    background: rowBg,
                    borderBottom: isLast ? 'none' : `1px solid ${surfaceBorder}`,
                  }}
                  onMouseEnter={ev => ev.currentTarget.style.background = surfaceHover}
                  onMouseLeave={ev => ev.currentTarget.style.background = rowBg}
                >
                  {/* Severity pill */}
                  <div className="shrink-0 pt-0.5">
                    <span
                      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:  sev.pillBg,
                        color:       sev.pillColor,
                        border:      `1px solid ${sev.pillBorder}`,
                      }}
                    >
                      {sev.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: text }}>{e.title}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: surfaceOffset, color: textMuted }}
                      >
                        {e.category}
                      </span>
                    </div>
                    {e.detail && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: textMuted }}>{e.detail}</p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs tabular-nums whitespace-nowrap" style={{ color: textFaint }}>
                      {fmt(e.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: textMuted, border: `1px solid ${surfaceBorder}` }}
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: textFaint }}>{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: textMuted, border: `1px solid ${surfaceBorder}` }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
