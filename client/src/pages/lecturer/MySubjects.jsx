// FR-09 — View Assigned Subjects and navigate to sections
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, AlertTriangle, Calendar } from 'lucide-react'
import { subjectService } from '../../services/subjectService.js'
import Spinner from '../../components/common/Spinner.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

function sectionStatus(sec) {
  if (sec.allComplete)                              return 'complete'
  const now = new Date()
  if (sec.deadline && new Date(sec.deadline) < now) return 'overdue'
  return 'in-progress'
}

export default function MySubjects() {
  const navigate = useNavigate()

  const { data: subjects = [], isLoading, isError } = useQuery({
    queryKey: ['mySubjects'],
    queryFn:  () => subjectService.getMySubjects().then(r => r.data),
  })

  if (isLoading) return <Spinner center size="lg" />
  if (isError)   return (
    <div className="page-container">
      <div className="alert alert-error"><AlertTriangle size={16} /> Failed to load subjects.</div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={22} />
          My Subjects
        </h1>

      </div>

      {subjects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No subjects assigned"
            description="Contact your PIC to be assigned to a subject."
          />
        </div>
      ) : (
        subjects.map(subject => (
          <div key={subject.id} className="card" style={{ marginBottom: '1.25rem' }}>
            {/* Subject header */}
            <div className="card-header">
              <div>
                <div className="card-title">
                  <BookOpen size={16} />
                  {subject.code} — {subject.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Semester {subject.semester} · {subject.academicYear}
                </div>
              </div>
              <span className="badge badge-neutral">{subject.sections?.length ?? 0} section{subject.sections?.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Sections */}
            {!subject.sections?.length ? (
              <div className="card-body">
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No sections available.</p>
              </div>
            ) : (
              subject.sections.map(sec => {
                const st = sectionStatus(sec)
                return (
                  <div
                    key={sec.id}
                    onClick={() => navigate(`/my-subjects/${subject.id}/sections/${sec.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1.5rem',
                      borderTop: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Section {sec.sectionNumber}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <Calendar size={12} />
                        {sec.deadline
                          ? `Deadline: ${new Date(sec.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                          : 'No deadline set'}
                        <span>·</span>
                        <span>
                          <span style={{ color: 'var(--color-complete)', fontWeight: 600 }}>{sec.completed ?? 0}</span>
                          /{sec.total ?? 0} subfolders done
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <StatusBadge status={st} />
                      <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ))
      )}
    </div>
  )
}
