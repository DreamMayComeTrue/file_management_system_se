// FR-10 — View All Subjects and Sections (PIC)
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, BookOpen, AlertTriangle, ChevronRight, Calendar, Settings, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import Spinner from '../../components/common/Spinner.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'

export default function SubjectsAndSections() {
  const navigate = useNavigate()
  const qc       = useQueryClient()

  // { type: 'subject'|'section', id, label }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: subjects = [], isLoading, isError } = useQuery({
    queryKey: ['allSubjects'],
    queryFn:  () => subjectService.getAllSubjects().then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: ({ type, id }) =>
      type === 'subject'
        ? subjectService.deleteSubject(id)
        : subjectService.deleteSection(id),
    onSuccess: (_, { type }) => {
      toast.success(`${type === 'subject' ? 'Subject' : 'Section'} deleted.`)
      qc.invalidateQueries({ queryKey: ['allSubjects'] })
      qc.invalidateQueries({ queryKey: ['programmeDashboard'] })
      qc.invalidateQueries({ queryKey: ['mySubjects'] })
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Delete failed.')
      setDeleteTarget(null)
    },
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
                  {subject.code} : {subject.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Semester {subject.semester} · {subject.academicYear}
                  {subject.lecturerName ? ` · ${subject.lecturerName}` : ''}
                </div>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(`/subjects/${subject.id}/sections/create`)}
                >
                  <Plus size={13} /> Add Section
                </button>
                <button
                  className="btn btn-icon"
                  title="Delete subject"
                  style={{ color: 'var(--color-incomplete)' }}
                  onClick={() => setDeleteTarget({
                    type:  'subject',
                    id:    subject.id,
                    label: `subject "${subject.code} : ${subject.name}" and all its sections`,
                  })}
                >
                  <Trash2 size={15} />
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
                    <button
                      className="btn btn-icon"
                      title="Delete section"
                      style={{ color: 'var(--color-incomplete)' }}
                      onClick={() => setDeleteTarget({
                        type:  'section',
                        id:    sec.id,
                        label: `Section ${sec.sectionNumber} and all its files`,
                      })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget)}
        title={deleteTarget?.type === 'subject' ? 'Delete Subject' : 'Delete Section'}
        message={`Are you sure you want to delete this ${deleteTarget?.label}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
      />
    </div>
  )
}
