// UC-05 — Create Subject
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import Spinner from '../../components/common/Spinner.jsx'

const SEMESTERS = [1, 2]
// Suggested years auto-generated around the current year (current-2 .. current+5)
// — the PIC can also type any custom year in the field.
const NOW_YEAR  = new Date().getFullYear()
const YEARS     = Array.from({ length: 8 }, (_, i) => {
  const y = NOW_YEAR - 2 + i
  return `${y}/${y + 1}`
})

export default function CreateSubject() {
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    try {
      await subjectService.createSubject(data)
      toast.success(`Subject "${data.code}" created.`)
      await qc.invalidateQueries({ queryKey: ['allSubjects'] })
      await qc.invalidateQueries({ queryKey: ['programmeDashboard'] })
      await qc.invalidateQueries({ queryKey: ['mySubjects'] })
      navigate('/subjects-sections')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create subject.')
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 'min(96%, 1800px)' }}>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/subjects-sections')}>Subjects &amp; Sections</span>
        <span className="breadcrumb-sep">/</span>
        <span>Create Subject</span>
      </div>

      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={22} /> Create Subject
        </h1>

      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Subject Code */}
            <div className="form-group">
              <label className="form-label form-label-required">Subject Code</label>
              <input
                type="text"
                className={`form-input${errors.code ? ' error' : ''}`}
                placeholder="e.g. SECJ3203"
                {...register('code', {
                  required: 'Subject code is required',
                  pattern: { value: /^[A-Z]{4}\d{4}$/, message: 'Format: 4 letters + 4 digits (e.g. SECJ3203)' },
                })}
              />
              {errors.code && <span className="form-error"><AlertCircle size={12} />{errors.code.message}</span>}
            </div>

            {/* Subject Name */}
            <div className="form-group">
              <label className="form-label form-label-required">Subject Name</label>
              <input
                type="text"
                className={`form-input${errors.name ? ' error' : ''}`}
                placeholder="e.g. Software Engineering"
                {...register('name', { required: 'Subject name is required' })}
              />
              {errors.name && <span className="form-error"><AlertCircle size={12} />{errors.name.message}</span>}
            </div>

            {/* Semester + Academic Year side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label form-label-required">Semester</label>
                <select
                  className={`form-input${errors.semester ? ' error' : ''}`}
                  {...register('semester', { required: 'Semester is required' })}
                >
                  <option value="">Select…</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
                {errors.semester && <span className="form-error"><AlertCircle size={12} />{errors.semester.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Academic Year</label>
                <input
                  type="text"
                  list="academicYearOptions"
                  className={`form-input${errors.academicYear ? ' error' : ''}`}
                  placeholder="Select or type, e.g. 2025/2026"
                  {...register('academicYear', {
                    required: 'Academic year is required',
                    pattern: {
                      value: /^\d{4}\/\d{4}$/,
                      message: 'Format: YYYY/YYYY (e.g. 2025/2026)',
                    },
                    validate: (v) => {
                      const m = /^(\d{4})\/(\d{4})$/.exec(v || '')
                      if (!m) return true   // format handled by pattern
                      return Number(m[2]) === Number(m[1]) + 1
                        || 'The two years must be consecutive (e.g. 2025/2026)'
                    },
                  })}
                />
                <datalist id="academicYearOptions">
                  {YEARS.map(y => <option key={y} value={y} />)}
                </datalist>
                {errors.academicYear && <span className="form-error"><AlertCircle size={12} />{errors.academicYear.message}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/subjects-sections')}>
                <ArrowLeft size={14} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner size="sm" /> Creating…</> : 'Create Subject'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
