// UC-16 — View Audit Log (shared by PIC + Audit role)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, Filter, AlertTriangle, Upload, Trash2, RefreshCw } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService.js'
import Spinner from '../../components/common/Spinner.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

const ACTION_ICONS = {
  UPLOAD:  { icon: Upload,    cls: 'badge-in-progress', label: 'Upload' },
  DELETE:  { icon: Trash2,    cls: 'badge-incomplete',  label: 'Delete' },
  RESTORE: { icon: RefreshCw, cls: 'badge-complete',    label: 'Restore' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const PER_PAGE = 10

export default function AuditLog() {
  const [filters, setFilters] = useState({ action: '', from: '', to: '' })
  const [applied, setApplied] = useState({})
  const [page, setPage]       = useState(1)

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['auditLog', applied],
    queryFn:  () => dashboardService.getAuditLog(applied).then(r => r.data),
  })

  function applyFilters() {
    setApplied({ ...filters })
    setPage(1)
  }
  function clearFilters() {
    setFilters({ action: '', from: '', to: '' })
    setApplied({})
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const pageRows   = data.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={22} />
          Audit Log
        </h1>

      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <span className="card-title"><Filter size={15} /> Filters</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label className="form-label">Action</label>
            <select
              className="form-input"
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            >
              <option value="">All actions</option>
              <option value="UPLOAD">Upload</option>
              <option value="DELETE">Delete</option>
              <option value="RESTORE">Restore</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label className="form-label">From</label>
            <input
              type="date"
              className="form-input"
              value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-input"
              value={filters.to}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
            <button className="btn btn-secondary" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner center size="lg" />
      ) : isError ? (
        <div className="alert alert-error"><AlertTriangle size={16} /> Failed to load audit log.</div>
      ) : data.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Clock}
            title="No records found"
            description="No audit events match the current filters."
          />
        </div>
      ) : (
        <>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Action</th>
                <th>File</th>
                <th>Subfolder</th>
                <th>Section</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const ac = ACTION_ICONS[row.action] ?? {}
                const Icon = ac.icon
                return (
                  <tr key={i}>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(row.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${ac.cls ?? 'badge-neutral'}`} style={{ gap: '0.3rem' }}>
                        {Icon && <Icon size={11} />}
                        {ac.label ?? row.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.fileName ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {row.subfolderName ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {row.sectionLabel ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {row.performedByName ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.length > PER_PAGE && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Showing {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, data.length)} of {data.length}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', minWidth: 90, textAlign: 'center' }}>
                Page {safePage} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
