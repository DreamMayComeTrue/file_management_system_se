// UC-05 — Create Subject
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { BookOpen, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import Spinner from '../../components/common/Spinner.jsx'

const PROGRAMMES = ['SECP', 'SECV', 'SECJ', 'SECI', 'SECB', 'SEAT', 'SEWB']
const SEMESTERS  = [1, 2]
const YEARS      = Array.from({ length: 6 }, (_, i) => `${2023 + i}/${2024 + i}`)

export default function CreateSubject() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    try {
      await subjectService.createSubject(data)
      toast.success(`Subject "${data.code}" created.`)
      navigate('/subjects-sections')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create subject.')
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/subjects-sections')}>Subjects &amp; Sections</span>
        <span className="breadcrumb-sep">/</span>
        <span>Create Subject</span>
      </div>

      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={22} /> Create Subject
        </h1>
        <p className="page-subtitle">Add a new subject to the system.</p>
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

            {/* Programme */}
            <div className="form-group">
              <label className="form-label form-label-required">Programme</label>
              <select
                className={`form-input${errors.programme ? ' error' : ''}`}
                {...register('programme', { required: 'Programme is required' })}
              >
                <option value="">— Select programme —</option>
                {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.programme && <span className="form-error"><AlertCircle size={12} />{errors.programme.message}</span>}
            </div>

            {/* Semester + Academic Year side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label form-label-required">Semester</label>
                <select
                  className={`form-input${errors.semester ? ' error' : ''}`}
                  {...register('semester', { required: 'Semester is required' })}
                >
                  <option value="">— Select —</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
                {errors.semester && <span className="form-error"><AlertCircle size={12} />{errors.semester.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Academic Year</label>
                <select
                  className={`form-input${errors.academicYear ? ' error' : ''}`}
                  {...register('academicYear', { required: 'Academic year is required' })}
                >
                  <option value="">— Select —</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
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
