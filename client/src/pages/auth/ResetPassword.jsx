// UC-03 — Reset Password (accessed via email link with ?token=...)
import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, FolderKanban } from 'lucide-react'
import { authService } from '../../services/authService.js'
import Spinner from '../../components/common/Spinner.jsx'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const [showPw, setShowPw]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [apiError, setApiError] = useState('')
  const [done, setDone]         = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    setApiError('')
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Reset failed. The link may have expired.')
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="alert alert-error">
            <AlertCircle size={16} /> Invalid or missing reset token.{' '}
            <Link to="/forgot-password" style={{ color: 'var(--color-primary)' }}>Request a new link</Link>.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <FolderKanban size={26} color="#fff" />
          </div>
          <h1 className="auth-title">Set new password</h1>
          <p className="auth-subtitle">Choose a strong password for your account</p>
        </div>

        {done ? (
          <div className="alert alert-success">
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            Password updated! Redirecting you to sign in…
          </div>
        ) : (
          <>
            {apiError && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {apiError}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* New password */}
              <div className="form-group">
                <label className="form-label form-label-required">New password</label>
                <div className="input-wrap">
                  <span className="input-icon"><Lock size={15} /></span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`form-input has-icon has-icon-right${errors.newPassword ? ' error' : ''}`}
                    placeholder="Min. 8 characters"
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'At least 8 characters required' },
                    })}
                  />
                  <button type="button" className="input-icon-right" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <span className="form-error"><AlertCircle size={12} />{errors.newPassword.message}</span>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label form-label-required">Confirm password</label>
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

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner size="sm" /> Updating…</> : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
