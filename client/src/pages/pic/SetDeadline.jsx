// UC-13 — Set and Extend Submission Deadline
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Calendar, AlertCircle, ArrowLeft, Info, AlertTriangle } from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import api from '../../services/api.js'
import Spinner from '../../components/common/Spinner.jsx'

export default function SetDeadline() {
  const { sectionId } = useParams()
  const navigate      = useNavigate()
  const qc            = useQueryClient()

  /* We need section info — fetch via a dedicated section-only endpoint if available,
     or derive from the dashboard data. For now we use a section query if defined.
     If getSectionById doesn't exist, the backend should expose GET /sections/:sectionId */
  const { data: section, isLoading } = useQuery({
    queryKey: ['sectionById', sectionId],
    queryFn:  () => api.get(`/sections/${sectionId}`).then(r => r.data),
  })

  const hasExistingDeadline = !!section?.deadline
  const isExtension = hasExistingDeadline

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const newDeadline = watch('deadline')

  async function onSubmit(data) {
    try {
      await subjectService.setDeadline(sectionId, {
        deadline: data.deadline,
        reason:   data.reason || undefined,
      })
      toast.success(isExtension ? 'Deadline extended.' : 'Deadline set.')
      await qc.invalidateQueries({ queryKey: ['allSubjects'] })
      await qc.invalidateQueries({ queryKey: ['programmeDashboard'] })
      await qc.invalidateQueries({ queryKey: ['sectionById', sectionId] })
      navigate('/subjects-sections')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to set deadline.')
    }
  }

  if (isLoading) return <Spinner center size="lg" />

  const existingDl = section?.deadline ? new Date(section.deadline) : null
  const todayStr   = new Date().toISOString().split('T')[0]

  return (
    <div className="page-container" style={{ maxWidth: 'min(96%, 1800px)' }}>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/subjects-sections')}>Subjects &amp; Sections</span>
        <span className="breadcrumb-sep">/</span>
        <span>{isExtension ? 'Extend Deadline' : 'Set Deadline'}</span>
      </div>

      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={22} />
          {isExtension ? 'Extend Deadline' : 'Set Deadline'}
        </h1>

      </div>

      {/* Existing deadline notice */}
      {existingDl && (
        <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          Current deadline: <strong>
            {existingDl.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </strong>. A reason is required to extend it.
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* New deadline */}
            <div className="form-group">
              <label className="form-label form-label-required">
                {isExtension ? 'New Deadline' : 'Deadline'}
              </label>
              <div className="input-wrap">
                <span className="input-icon"><Calendar size={15} /></span>
                <input
                  type="date"
                  className={`form-input has-icon${errors.deadline ? ' error' : ''}`}
                  min={todayStr}
                  {...register('deadline', {
                    required: 'Deadline date is required',
                    validate: v => {
                      if (isExtension && existingDl && new Date(v) <= existingDl) {
                        return 'New deadline must be later than the current deadline'
                      }
                      return true
                    },
                  })}
                />
              </div>
              {errors.deadline && <span className="form-error"><AlertCircle size={12} />{errors.deadline.message}</span>}
            </div>

            {/* Reason — required for extension */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className={`form-label${isExtension ? ' form-label-required' : ''}`}>
                Reason {!isExtension && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>}
              </label>
              <textarea
                className={`form-input${errors.reason ? ' error' : ''}`}
                placeholder={isExtension ? 'State the reason for extension…' : 'Optional note…'}
                rows={3}
                {...register('reason', {
                  required: isExtension ? 'Reason is required when extending a deadline' : false,
                })}
              />
              {errors.reason && <span className="form-error"><AlertCircle size={12} />{errors.reason.message}</span>}
              <p className="form-hint">
                {isExtension
                  ? 'This will be recorded in the deadline log.'
                  : 'Leave blank if not needed.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/subjects-sections')}>
                <ArrowLeft size={14} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner size="sm" /> Saving…</> : isExtension ? 'Extend Deadline' : 'Set Deadline'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
