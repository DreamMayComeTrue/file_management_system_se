// Manage Lecturers — PIC can add / remove lecturer accounts
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Users, Plus, Trash2, AlertCircle, Info, Mail, User } from 'lucide-react'
import { toast } from 'react-toastify'
import { userService } from '../../services/userService.js'
import Spinner from '../../components/common/Spinner.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'

const DEFAULT_PASSWORD = 'Password123!'

export default function ManageLecturers() {
  const qc = useQueryClient()
  const [showForm, setShowForm]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)   // { id, fullName }

  const { data: lecturers = [], isLoading } = useQuery({
    queryKey: ['lecturers'],
    queryFn:  () => userService.getLecturers().then(r => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMut = useMutation({
    mutationFn: (data) => userService.createLecturer(data),
    onSuccess: (_, variables) => {
      toast.success(
        `Lecturer "${variables.fullName}" added. Temporary password: ${DEFAULT_PASSWORD}`,
        { autoClose: 8000 }
      )
      qc.invalidateQueries(['lecturers'])
      reset()
      setShowForm(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to add lecturer.')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => userService.deleteLecturer(id),
    onSuccess: () => {
      toast.success('Lecturer removed.')
      qc.invalidateQueries(['lecturers'])
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to remove lecturer.')
      setDeleteTarget(null)
    },
  })

  async function onSubmit(data) {
    await createMut.mutateAsync(data)
  }

  if (isLoading) return <Spinner center size="lg" />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} /> Manage Lecturers
          </h1>

        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={15} /> Add Lecturer
        </button>
      </div>

      {/* Add Lecturer Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title"><Plus size={15} /> New Lecturer Account</span>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <Info size={15} style={{ flexShrink: 0 }} />
              The lecturer's temporary password will be <strong>{DEFAULT_PASSWORD}</strong>. Ask them to change it after first login.
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label form-label-required">Full Name</label>
                  <div className="input-wrap">
                    <span className="input-icon"><User size={15} /></span>
                    <input
                      type="text"
                      className={`form-input has-icon${errors.fullName ? ' error' : ''}`}
                      placeholder="e.g. Ahmad bin Ali"
                      {...register('fullName', { required: 'Full name is required' })}
                    />
                  </div>
                  {errors.fullName && <span className="form-error"><AlertCircle size={12} />{errors.fullName.message}</span>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label form-label-required">UTM Email</label>
                  <div className="input-wrap">
                    <span className="input-icon"><Mail size={15} /></span>
                    <input
                      type="email"
                      className={`form-input has-icon${errors.email ? ' error' : ''}`}
                      placeholder="lecturer@utm.my"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                      })}
                    />
                  </div>
                  {errors.email && <span className="form-error"><AlertCircle size={12} />{errors.email.message}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); reset() }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <><Spinner size="sm" /> Adding…</> : 'Add Lecturer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lecturers List */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Users size={15} /> Lecturers ({lecturers.length})</span>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {lecturers.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
              No lecturers added yet. Click "Add Lecturer" to get started.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', width: 52, flexShrink: 0 }}></th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((l, idx) => (
                  <tr
                    key={l.id}
                    style={{
                      borderBottom: idx < lecturers.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#3a3000',
                          color: '#c9a227',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {l.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span>{l.fullName}</span>
                          {l.role === 'PIC' && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(212,175,55,0.15)', color: '#D4AF37', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 700, border: '1px solid rgba(212,175,55,0.3)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>PIC</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{l.email}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap', width: 52 }}>
                      {l.role !== 'PIC' && (
                        <button
                          className="btn btn-icon"
                          title="Remove lecturer"
                          style={{ color: 'var(--color-incomplete)' }}
                          onClick={() => setDeleteTarget({ id: l.id, fullName: l.fullName })}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        title="Remove Lecturer"
        message={`Remove "${deleteTarget?.fullName}" from the system? This will NOT delete their uploaded files, but they will no longer be able to log in.`}
        confirmLabel="Remove"
        loading={deleteMut.isPending}
      />
    </div>
  )
}
