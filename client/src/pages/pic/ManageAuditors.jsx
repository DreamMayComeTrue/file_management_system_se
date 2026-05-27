// Manage Auditors — PIC can add / remove audit (auditor) accounts
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ShieldCheck, Plus, Trash2, AlertCircle, Info, Mail, User } from 'lucide-react'
import { toast } from 'react-toastify'
import { userService } from '../../services/userService.js'
import Spinner from '../../components/common/Spinner.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'

const DEFAULT_PASSWORD = 'Password123!'

export default function ManageAuditors() {
  const qc = useQueryClient()
  const [showForm, setShowForm]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)   // { id, fullName }

  const { data: auditors = [], isLoading } = useQuery({
    queryKey: ['auditors'],
    queryFn:  () => userService.getAuditors().then(r => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMut = useMutation({
    mutationFn: (data) => userService.createAuditor(data),
    onSuccess: (_, variables) => {
      toast.success(
        `Auditor "${variables.fullName}" added. Temporary password: ${DEFAULT_PASSWORD}`,
        { autoClose: 8000 }
      )
      qc.invalidateQueries(['auditors'])
      reset()
      setShowForm(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to add auditor.')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => userService.deleteAuditor(id),
    onSuccess: () => {
      toast.success('Auditor removed.')
      qc.invalidateQueries(['auditors'])
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to remove auditor.')
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
            <ShieldCheck size={22} /> Manage Auditors
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={15} /> Add Auditor
        </button>
      </div>

      {/* Add Auditor Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title"><Plus size={15} /> New Auditor Account</span>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <Info size={15} style={{ flexShrink: 0 }} />
              The auditor's temporary password will be <strong>{DEFAULT_PASSWORD}</strong>. Ask them to change it after first login.
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
                      placeholder="e.g. Dr. Siti binti Ahmad"
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
                      placeholder="auditor@utm.my"
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
                  {isSubmitting ? <><Spinner size="sm" /> Adding…</> : 'Add Auditor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auditors List */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><ShieldCheck size={15} /> Auditors ({auditors.length})</span>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {auditors.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
              No auditors added yet. Click "Add Auditor" to get started.
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
                {auditors.map((a, idx) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: idx < auditors.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#3a0010',
                          color: '#e8839b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {a.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span>{a.fullName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{a.email}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap', width: 52 }}>
                      <button
                        className="btn btn-icon"
                        title="Remove auditor"
                        style={{ color: 'var(--color-incomplete)' }}
                        onClick={() => setDeleteTarget({ id: a.id, fullName: a.fullName })}
                      >
                        <Trash2 size={15} />
                      </button>
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
        title="Remove Auditor"
        message={`Remove "${deleteTarget?.fullName}" from the system? They will no longer be able to log in.`}
        confirmLabel="Remove"
        loading={deleteMut.isPending}
      />
    </div>
  )
}
