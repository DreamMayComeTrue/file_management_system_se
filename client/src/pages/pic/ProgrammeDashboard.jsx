// UC-14 — View Progress Dashboard (PIC)
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BarChart2, BookOpen, AlertTriangle, ChevronRight, Calendar } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService.js'
import Spinner from '../../components/common/Spinner.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

function sectionStatus(sec) {
  if (!sec.deadline) return 'in-progress'
  const now = new Date()
  const dl  = new Date(sec.deadline)
  if (sec.allComplete)      return 'complete'
  if (dl < now)             return 'overdue'
  return 'incomplete'
}

export default function ProgrammeDashboard() {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['programmeDashboard'],
    queryFn:  () => dashboardService.getProgrammeDashboard().then(r => r.data),
  })

  if (isLoading) return <Spinner center size="lg" />
  if (isError)   return (
    <div className="page-container">
      <div className="alert alert-error"><AlertTriangle size={16} /> Failed to load dashboard.</div>
    </div>
  )

  const subjects = data?.subjects ?? []
  const totalSections  = subjects.reduce((s, sub) => s + (sub.sections?.length ?? 0), 0)
  const totalComplete  = subjects.reduce((s, sub) => s + (sub.sections?.filter(sec => sec.allComplete)?.length ?? 0), 0)
  const totalOverdue   = subjects.reduce((s, sub) => s + (sub.sections?.filter(sec => sectionStatus(sec) === 'overdue')?.length ?? 0), 0)
  const totalIncomplete = totalSections - totalComplete

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={22} />
          Programme Dashboard
        </h1>
        <p className="page-subtitle">Overview of all subjects and section submission statuses.</p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Subjects</div>
          <div className="stat-value primary">{subjects.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Sections</div>
          <div className="stat-value">{totalSections}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fully Complete</div>
          <div className="stat-value complete">{totalComplete}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Incomplete</div>
          <div className="stat-value incomplete">{totalIncomplete}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value overdue">{totalOverdue}</div>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No subjects found"
            description="Create subjects and sections to start tracking submissions."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/subjects/create')}>
                Create Subject
              </button>
            }
          />
        </div>
      ) : (
        subjects.map(subject => (
          <div key={subject.id} className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <div className="card-title">
                <BookOpen size={16} />
                {subject.code} — {subject.name}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {subject.programme} · Sem {subject.semester} · {subject.academicYear}
              </span>
            </div>

            {!subject.sections?.length ? (
              <div className="card-body">
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No sections created yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Lecturer(s)</th>
                      <th>Deadline</th>
                      <th>Subfolders Done</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.sections.map(sec => {
                      const st = sectionStatus(sec)
                      return (
                        <tr
                          key={sec.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/subjects/${subject.id}/sections/${sec.id}`)}
                        >
                          <td style={{ fontWeight: 600 }}>Section {sec.sectionNumber}</td>
                          <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            {sec.lecturers?.join(', ') || '—'}
                          </td>
                          <td>
                            {sec.deadline
                              ? <span style={{ color: st === 'overdue' ? 'var(--color-incomplete)' : undefined }}>
                                  {new Date(sec.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--color-complete)', fontWeight: 600 }}>{sec.completed ?? 0}</span>
                              <span style={{ color: 'var(--color-text-muted)' }}> / {sec.total ?? 0}</span>
                            </span>
                          </td>
                          <td><StatusBadge status={st} /></td>
                          <td><ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
