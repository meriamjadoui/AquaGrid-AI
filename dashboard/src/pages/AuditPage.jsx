import React, { useState, useMemo } from 'react'
import { ClipboardList, Filter, Download, Trash2, ChevronDown, ArrowUpRight } from 'lucide-react'
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

const KPI_COLORS = [
  { label: 'Total Events',    key: 'total',    color: '#4F7DF3' },
  { label: 'Critical Events', key: 'critical', color: '#EF4444' },
  { label: 'Warnings',        key: 'warning',  color: '#F59E0B' },
  { label: 'Actions Taken',   key: 'action',   color: '#8B5CF6' },
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

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-dim)' }}>
            <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Audit Log</h2>
            <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Complete history of system events, alerts and actions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(filtered)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-all duration-200"
            style={{
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-primary-dim)',
              color: 'var(--color-primary)',
              border: '1px solid transparent',
            }}
          >
            <Download size={13} strokeWidth={2} /> Export CSV
          </button>
          <button
            onClick={clearLog}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-all duration-200"
            style={{
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(239,68,68,0.08)',
              color: '#EF4444',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <Trash2 size={13} strokeWidth={2} /> Clear
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_COLORS.map(k => (
          <div key={k.label} className="card text-center py-5">
            <p className="text-2xl font-extrabold data-value" style={{ color: k.color }}>
              {counts[k.key]}
            </p>
            <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-hover)' }}>
            <Filter size={14} style={{ color: 'var(--color-text-faint)' }} />
          </div>

          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setFilter(setSearch, e.target.value)}
            className="flex-1 min-w-[160px] px-4 py-2 text-sm focus:outline-none transition-all duration-200 font-medium"
            style={{
              background: 'var(--color-surface-bg)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-text)',
            }}
          />

          {/* Category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilter(setFilterCategory, e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 text-sm focus:outline-none cursor-pointer font-medium"
              style={{
                background: 'var(--color-surface-bg)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--color-text)',
              }}
            >
              <option value={ALL}>All Categories</option>
              {Object.values(CATEGORY).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-faint)' }} />
          </div>

          {/* Severity */}
          <div className="relative">
            <select
              value={filterSeverity}
              onChange={e => setFilter(setFilterSeverity, e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 text-sm focus:outline-none cursor-pointer font-medium"
              style={{
                background: 'var(--color-surface-bg)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--color-text)',
              }}
            >
              <option value={ALL}>All Severities</option>
              {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-faint)' }} />
          </div>

          <span className="ml-auto text-xs font-semibold" style={{ color: 'var(--color-text-faint)' }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Event list ── */}
      <div className="card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--color-text-muted)' }}>
            <ClipboardList size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No events match your filters</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>Events are recorded automatically as the system runs</p>
          </div>
        ) : (
          <div>
            {paginated.map((e, idx) => {
              const sev   = SEVERITY[e.severity] ?? SEVERITY.info
              const isLast = idx === paginated.length - 1

              return (
                <div
                  key={e.id}
                  className="flex gap-4 px-5 py-3.5 transition-all duration-200 group"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--color-surface-border)',
                  }}
                  onMouseEnter={ev => ev.currentTarget.style.background = 'var(--color-surface-hover)'}
                  onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                >
                  {/* Severity pill */}
                  <div className="shrink-0 pt-0.5">
                    <span
                      className="inline-block text-[10px] font-bold px-3 py-1"
                      style={{
                        borderRadius: 'var(--radius-pill)',
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
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{e.title}</span>
                      <span
                        className="text-xs px-2.5 py-0.5 font-semibold"
                        style={{
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--color-surface-hover)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {e.category}
                      </span>
                    </div>
                    {e.detail && (
                      <p className="text-xs mt-0.5 truncate font-medium" style={{ color: 'var(--color-text-muted)' }}>{e.detail}</p>
                    )}
                  </div>

                  {/* Timestamp + arrow */}
                  <div className="shrink-0 text-right flex items-center gap-2">
                    <p className="text-xs tabular-nums whitespace-nowrap font-medium" style={{ color: 'var(--color-text-faint)' }}>
                      {fmt(e.timestamp)}
                    </p>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-faint)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            Previous
          </button>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-faint)' }}>{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
