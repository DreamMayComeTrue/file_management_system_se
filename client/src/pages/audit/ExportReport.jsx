// UC-15 — Export Progress Report (formatted .xlsx)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Filter, AlertTriangle } from 'lucide-react'
import { toast } from 'react-toastify'
import { dashboardService } from '../../services/dashboardService.js'
import api from '../../services/api.js'
import Spinner from '../../components/common/Spinner.jsx'

export default function ExportReport() {
  const [subjectId, setSubjectId] = useState('')
  const [exporting, setExporting] = useState(false)

  /* Load subjects list for the filter */
  const { data: subjects = [] } = useQuery({
    queryKey: ['allSubjectsBasic'],
    queryFn:  () => api.get('/subjects').then(r => r.data),
  })

  async function handleExport() {
    setExporting(true)
    try {
      const params = {}
      if (subjectId) params.subjectId = subjectId

      const res = await dashboardService.exportReport(params)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      // Style 2 (specific subject) -> "<code> Section Report.xlsx"
      // Style 1 (all subjects)     -> "Completion Report <date>.xlsx"
      const subj = subjects.find(s => String(s.id) === String(subjectId))
      const fileName = subj
        ? `${String(subj.code).replace(/[^A-Za-z0-9 _-]/g, '').trim()} Section Report.xlsx`
        : `Completion Report ${new Date().toISOString().split('T')[0]}.xlsx`

      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Report downloaded.')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  const selectedSubject = subjects.find(s => String(s.id) === String(subjectId))

  return (
    <div className="page-container" style={{ maxWidth: 'min(96%, 1800px)' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={22} />
          Export Report
        </h1>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><Filter size={15} /> Report Parameters</span>
        </div>
        <div className="card-body">
          {/* Subject filter — All subjects = overview style */}
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select
              className="form-input"
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
            >
              <option value="">All subjects (overview)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} : {s.name}</option>
              ))}
            </select>
            <p className="form-hint">
              Leave as <strong>All subjects</strong> to export the full programme overview.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting
              ? <><Spinner size="sm" /> Generating…</>
              : <><Download size={15} /> Export Report (.xlsx)</>}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info" style={{ marginTop: '1rem' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Excel report includes:</strong> one row per section — subject code, subject name,
          section, lecturer name &amp; email, deadline, a ✓/✗ column for every subfolder
          (checklist item), and an overall completion status. The auditor name and generation
          date appear above the table.
          {selectedSubject && (
            <> <br /><strong>Current scope:</strong> {selectedSubject.code} : {selectedSubject.name}.</>
          )}
        </div>
      </div>
    </div>
  )
}
