import React, { useState, useMemo } from 'react'
import { ClipboardList, Filter, Download, Trash2, ChevronDown } from 'lucide-react'
import useAuditLog, { SEVERITY, CATEGORY } from '../store/useAuditLog'

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

export default function AuditPage() {
  const { events, clearLog } = useAuditLog()

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

  // Reset page when filters change
  const setFilter = (fn, val) => { fn(val); setPage(1) }

  // Summary counts
  const counts = useMemo(() => ({
    critical: events.filter(e => e.severity === 'critical').length,
    warning:  events.filter(e => e.severity === 'warning').length,
    action:   events.filter(e => e.severity === 'action').length,
    total:    events.length,
  }), [events])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardList size={22} className="text-primary-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">Audit Log</h2>
            <p className="text-sm text-slate-500 mt-0.5">Complete history of system events, alerts and actions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(filtered)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={clearLog}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',    value: counts.total,    color: 'text-slate-200'   },
          { label: 'Critical Events', value: counts.critical, color: 'text-red-400'     },
          { label: 'Warnings',        value: counts.warning,  color: 'text-amber-400'   },
          { label: 'Actions Taken',   value: counts.action,   color: 'text-purple-400'  },
        ].map(k => (
          <div key={k.label} className="card text-center py-4">
            <p className={`text-2xl font-bold data-value ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={14} className="text-slate-500 shrink-0" />

          {/* Search */}
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setFilter(setSearch, e.target.value)}
            className="flex-1 min-w-[160px] bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500"
          />

          {/* Category filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilter(setFilterCategory, e.target.value)}
              className="appearance-none bg-surface-bg border border-surface-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value={ALL}>All Categories</option>
              {Object.values(CATEGORY).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Severity filter */}
          <div className="relative">
            <select
              value={filterSeverity}
              onChange={e => setFilter(setFilterSeverity, e.target.value)}
              className="appearance-none bg-surface-bg border border-surface-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value={ALL}>All Severities</option>
              {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <span className="ml-auto text-xs text-slate-600">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Event table */}
      <div className="card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <ClipboardList size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No events match your filters</p>
            <p className="text-xs mt-1">Events are recorded automatically as the system runs</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {paginated.map(e => {
              const sev = SEVERITY[e.severity] ?? SEVERITY.info
              return (
                <div key={e.id} className={`flex gap-4 px-5 py-3 hover:bg-surface-hover transition-colors ${sev.bg}`}>
                  {/* Severity pill */}
                  <div className="shrink-0 pt-0.5">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sev.color} ${sev.border} bg-transparent`}>
                      {sev.label}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200">{e.title}</span>
                      <span className="text-xs text-slate-600 bg-surface-offset px-2 py-0.5 rounded-full">{e.category}</span>
                    </div>
                    {e.detail && <p className="text-xs text-slate-500 mt-0.5 truncate">{e.detail}</p>}
                  </div>
                  {/* Timestamp */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmt(e.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-surface-border hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-surface-border hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
