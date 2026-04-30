// UC-04 — Change Password (authenticated)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { authService } from '../../services/authService.js'
import Spinner from '../../components/common/Spinner.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ChangePassword() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showCurrent, setShowCurrent]   = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [apiError, setApiError]         = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    setApiError('')
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      })
      toast.success('Password changed successfully. Please sign in again.')
      reset()
      // Force re-login for security
      setTimeout(() => {
        logout()
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Failed to change password. Check your current password.')
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1 className="page-title">Change Password</h1>
        <p className="page-subtitle">Update your account password. You will be signed out after changing.</p>
      </div>

      <div className="card">
        <div className="card-body">
          {apiError && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />{apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Current password */}
            <div className="form-group">
              <label className="form-label form-label-required">Current password</label>
              <div className="input-wrap">
                <span className="input-icon"><Lock size={15} /></span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className={`form-input has-icon has-icon-right${errors.currentPassword ? ' error' : ''}`}
                  placeholder="Your current password"
                  {...register('currentPassword', { required: 'Current password is required' })}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="form-error"><AlertCircle size={12} />{errors.currentPassword.message}</span>
              )}
            </div>

            <hr className="divider" />

            {/* New password */}
            <div className="form-group">
              <label className="form-label form-label-required">New password</label>
              <div className="input-wrap">
                <span className="input-icon"><Lock size={15} /></span>
                <input
                  type={showNew ? 'text' : 'password'}
                  className={`form-input has-icon has-icon-right${errors.newPassword ? ' error' : ''}`}
                  placeholder="Min. 8 characters"
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'At least 8 characters required' },
                  })}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="form-error"><AlertCircle size={12} />{errors.newPassword.message}</span>
              )}
            </div>

            {/* Confirm */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label form-label-required">Confirm new password</label>
              <div className="input-wrap">
                <span className="input-icon"><Lock size={15} /></span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`form-input has-icon has-icon-right${errors.confirmPassword ? ' error' : ''}`}
                  placeholder="Repeat new password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: v => v === watch('newPassword') || 'Passwords do not match',
                  })}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="form-error"><AlertCircle size={12} />{errors.confirmPassword.message}</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" /> Updating…</> : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
