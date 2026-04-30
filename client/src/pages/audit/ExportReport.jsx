// UC-15 — Export Progress Report
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Filter, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { dashboardService } from '../../services/dashboardService.js'
import api from '../../services/api.js'
import Spinner from '../../components/common/Spinner.jsx'

export default function ExportReport() {
  const [format, setFormat]       = useState('csv')
  const [subjectId, setSubjectId] = useState('')
  const [from, setFrom]           = useState('')
  const [to, setTo]               = useState('')
  const [exporting, setExporting] = useState(false)

  /* Load subjects list for filter */
  const { data: subjects = [] } = useQuery({
    queryKey: ['allSubjectsBasic'],
    queryFn:  () =>
      api.get('/subjects').then(r => r.data),
  })

  async function handleExport() {
    setExporting(true)
    try {
      const params = { format }
      if (subjectId) params.subjectId = subjectId
      if (from)      params.from      = from
      if (to)        params.to        = to

      const res = await dashboardService.exportReport(params)

      const ext       = format === 'csv' ? 'csv' : 'json'
      const mimeType  = format === 'csv' ? 'text/csv' : 'application/json'
      const blob      = new Blob([res.data], { type: mimeType })
      const url       = URL.createObjectURL(blob)
      const a         = document.createElement('a')
      a.href          = url
      a.download      = `fms-report-${new Date().toISOString().split('T')[0]}.${ext}`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Report downloaded.')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={22} />
          Export Report
        </h1>
        <p className="page-subtitle">Generate and download submission progress reports.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><Filter size={15} /> Report Parameters</span>
        </div>
        <div className="card-body">
          {/* Subject filter */}
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select
              className="form-input"
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
            >
              <option value="">All subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
            <p className="form-hint">Leave blank to export all subjects.</p>
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">From date</label>
              <input
                type="date"
                className="form-input"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To date</label>
              <input
                type="date"
                className="form-input"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* Format */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Export Format</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['csv', 'json'].map(f => (
                <label
                  key={f}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    border: `1.5px solid ${format === f ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: format === f ? 'rgba(139,26,26,0.05)' : 'var(--color-surface)',
                    fontWeight: format === f ? 600 : 400,
                    fontSize: '0.875rem',
                    color: format === f ? 'var(--color-primary)' : 'var(--color-text)',
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    style={{ display: 'none' }}
                  />
                  {format === f && <CheckCircle size={14} />}
                  {f.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting
              ? <><Spinner size="sm" /> Generating…</>
              : <><Download size={15} /> Export Report</>}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info" style={{ marginTop: '1rem' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Report includes:</strong> subject code, section number, subfolder completion status,
          deadline, overdue flag, and file count per subfolder.
        </div>
      </div>
    </div>
  )
}
