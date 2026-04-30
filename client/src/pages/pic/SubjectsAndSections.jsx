// FR-10 — View All Subjects and Sections (PIC)
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, BookOpen, AlertTriangle, ChevronRight, Calendar, Settings } from 'lucide-react'
import { subjectService } from '../../services/subjectService.js'
import Spinner from '../../components/common/Spinner.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

export default function SubjectsAndSections() {
  const navigate = useNavigate()

  const { data: subjects = [], isLoading, isError } = useQuery({
    queryKey: ['allSubjects'],
    queryFn:  () => subjectService.getAllSubjects().then(r => r.data),
  })

  if (isLoading) return <Spinner center size="lg" />
  if (isError)   return (
    <div className="page-container">
      <div className="alert alert-error"><AlertTriangle size={16} /> Failed to load subjects.</div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderKanban size={22} />
            Subjects &amp; Sections
          </h1>
          <p className="page-subtitle">Manage all subjects, sections, and deadlines.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/subjects/create')}>
          <Plus size={15} /> Create Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No subjects yet"
            description="Get started by creating your first subject."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/subjects/create')}>
                <Plus size={15} /> Create Subject
              </button>
            }
          />
        </div>
      ) : (
        subjects.map(subject => (
          <div key={subject.id} className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <BookOpen size={16} />
                  {subject.code} — {subject.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {subject.programme} · Semester {subject.semester} · {subject.academicYear}
                </div>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(`/subjects/${subject.id}/sections/create`)}
                >
                  <Plus size={13} /> Add Section
                </button>
              </div>
            </div>

            {!subject.sections?.length ? (
              <div className="card-body">
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No sections yet.{' '}
                  <span
                    style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                    onClick={() => navigate(`/subjects/${subject.id}/sections/create`)}
                  >
                    Create one →
                  </span>
                </p>
              </div>
            ) : (
              subject.sections.map(sec => (
                <div
                  key={sec.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.5rem',
                    borderTop: '1px solid var(--color-border)',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Section {sec.sectionNumber}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <Calendar size={12} />
                      {sec.deadline
                        ? `Deadline: ${new Date(sec.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : 'No deadline set'}
                      {sec.lecturers?.length ? (
                        <>
                          <span>·</span>
                          <span>{sec.lecturers.join(', ')}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/set-deadline/${sec.id}`)}
                      title="Set / extend deadline"
                    >
                      <Calendar size={13} /> Deadline
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => navigate(`/subjects/${subject.id}/sections/${sec.id}`)}
                      title="View section detail"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => navigate(`/subjects/${subject.id}/sections/${sec.id}`)}
                      title="Open section"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  )
}
