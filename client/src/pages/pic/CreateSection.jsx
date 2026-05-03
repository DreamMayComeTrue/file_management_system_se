// UC-06 — Create Section + Auto-Generate Sub-Folders from Template
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FolderKanban, AlertCircle, ArrowLeft, Info } from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import { userService } from '../../services/userService.js'
import Spinner from '../../components/common/Spinner.jsx'

export default function CreateSection() {
  const { subjectId } = useParams()
  const navigate      = useNavigate()
  const qc            = useQueryClient()

  /* Load subject info */
  const { data: subject, isLoading: loadingSubject } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn:  () => subjectService.getSubject(subjectId).then(r => r.data),
  })

  /* Load subfolder template preview */
  const { data: template = [] } = useQuery({
    queryKey: ['subfolderTemplate'],
    queryFn:  () => subjectService.getTemplate().then(r => r.data),
  })

  /* Load lecturers for dropdown */
  const { data: lecturers = [], isLoading: loadingLecturers } = useQuery({
    queryKey: ['lecturers'],
    queryFn:  () => userService.getLecturers().then(r => r.data),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    try {
      await subjectService.createSection(subjectId, {
        sectionNumber: data.sectionNumber,
        lecturerId:    data.lecturerId || null,
      })
      toast.success(`Section ${data.sectionNumber} created with ${template.length} subfolder(s).`)
      await qc.invalidateQueries({ queryKey: ['allSubjects'] })
      await qc.invalidateQueries({ queryKey: ['programmeDashboard'] })
      await qc.invalidateQueries({ queryKey: ['mySubjects'] })
      navigate('/subjects-sections')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create section.')
    }
  }

  if (loadingSubject) return <Spinner center size="lg" />

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/subjects-sections')}>Subjects &amp; Sections</span>
        <span className="breadcrumb-sep">/</span>
        <span>{subject?.code}</span>
        <span className="breadcrumb-sep">/</span>
        <span>Create Section</span>
      </div>

      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderKanban size={22} /> Create Section
        </h1>

      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Section Number */}
            <div className="form-group">
              <label className="form-label form-label-required">Section Number</label>
              <input
                type="text"
                className={`form-input${errors.sectionNumber ? ' error' : ''}`}
                placeholder="e.g. 01, 02, A, B"
                {...register('sectionNumber', {
                  required: 'Section number is required',
                  maxLength: { value: 10, message: 'Max 10 characters' },
                })}
              />
              {errors.sectionNumber && <span className="form-error"><AlertCircle size={12} />{errors.sectionNumber.message}</span>}
              <p className="form-hint">This will identify the section (e.g. 01, 02, A, B).</p>
            </div>

            {/* Assign Lecturer */}
            <div className="form-group">
              <label className="form-label form-label-required">Assign Lecturer</label>
              {loadingLecturers ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  <Spinner size="sm" /> Loading lecturers…
                </div>
              ) : (
                <select
                  className={`form-input${errors.lecturerId ? ' error' : ''}`}
                  {...register('lecturerId', { required: 'Please assign a lecturer to this section' })}
                >
                  <option value="">— Select lecturer —</option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.fullName} ({l.role}) — {l.email}
                    </option>
                  ))}
                </select>
              )}
              {errors.lecturerId && <span className="form-error"><AlertCircle size={12} />{errors.lecturerId.message}</span>}
              <p className="form-hint">Each section can have a different lecturer. Add lecturers first under Manage Lecturers.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/subjects-sections')}>
                <ArrowLeft size={14} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || loadingLecturers}>
                {isSubmitting ? <><Spinner size="sm" /> Creating…</> : 'Create Section'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Template preview */}
      {template.length > 0 && (
        <div className="alert alert-info">
          <Info size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Subfolders that will be auto-created:</strong>
            <ul style={{ marginTop: '0.375rem', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
              {template.map(t => <li key={t.id}>{t.name}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
