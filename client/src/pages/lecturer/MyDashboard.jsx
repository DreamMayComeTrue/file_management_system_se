// UC-12 — View Own Submission Status (Lecturer/PIC)
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, CheckCircle, XCircle, AlertTriangle, ChevronRight, MessageSquare } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService.js'
import Spinner from '../../components/common/Spinner.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function sectionStatus(section) {
  if (section.allComplete)                                    return 'complete'
  const now = new Date()
  if (section.deadline && new Date(section.deadline) < now)   return 'overdue'
  return 'in-progress'
}

export default function MyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myDashboard'],
    queryFn:  () => dashboardService.getMyDashboard().then(r => r.data),
    staleTime: 30000,          // reuse data for 30s — instant on revisit
    refetchOnWindowFocus: true, // still refresh when the tab regains focus
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LayoutDashboard size={22} />
          My Dashboard
        </h1>

      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Subjects</div>
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
          <div className="stat-label">Overdue</div>
          <div className="stat-value overdue">{totalOverdue}</div>
        </div>
      </div>

      {/* Subject/Section list */}
      {subjects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No subjects assigned"
            description="You haven't been assigned to any subjects yet."
          />
        </div>
      ) : (
        subjects.map(subject => (
          <div key={subject.id} className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <div className="card-title">
                <BookOpen size={17} />
                <span>{subject.code}</span>
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>: {subject.name}</span>
                {subject.othersCommentCount > 0 && (
                  <span
                    title={`${subject.othersCommentCount} note(s) from others (PIC / Audit / co-lecturer)`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      marginLeft: '0.4rem',
                      padding: '0.2rem 0.55rem', borderRadius: '999px',
                      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
                      background: 'rgba(215,41,139,0.15)', color: '#D7298B',
                      border: '1px solid rgba(215,41,139,0.35)',
                    }}
                  >
                    <MessageSquare size={11} />
                    {subject.othersCommentCount} from others
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {subject.programme} · Sem {subject.semester} · {subject.academicYear}
              </span>
            </div>

            {subject.sections?.length === 0 ? (
              <div className="card-body">
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No sections for this subject.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Deadline</th>
                      <th>Subfolders</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.sections?.map(sec => {
                      const st = sectionStatus(sec)
                      return (
                        <tr
                          key={sec.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/my-subjects/${subject.id}/sections/${sec.id}`)}
                        >
                          <td style={{ fontWeight: 600 }}>Section {sec.sectionNumber}</td>
                          <td style={{ color: st === 'overdue' ? 'var(--color-incomplete)' : undefined }}>
                            {sec.deadline
                              ? new Date(sec.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--color-complete)', fontWeight: 600 }}>{sec.completed}</span>
                              <span style={{ color: 'var(--color-text-muted)' }}> / {sec.total}</span>
                            </span>
                          </td>
                          <td><StatusBadge status={st} /></td>
                          <td>
                            <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                          </td>
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
