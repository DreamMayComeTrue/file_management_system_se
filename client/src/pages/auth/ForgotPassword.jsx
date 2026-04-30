// UC-02 — Forgot Password
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, AlertCircle, CheckCircle, FolderKanban, ArrowLeft } from 'lucide-react'
import { authService } from '../../services/authService.js'
import Spinner from '../../components/common/Spinner.jsx'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    setApiError('')
    try {
      await authService.forgotPassword(data.email)
      setSent(true)
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <FolderKanban size={26} color="#fff" />
          </div>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">
            {sent
              ? 'Check your inbox for the reset link'
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {sent ? (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              A password reset link has been sent to <strong>{getValues('email')}</strong>. It expires in 1 hour.
            </div>
            <Link to="/login" className="btn btn-secondary btn-full">
              <ArrowLeft size={15} /> Back to Sign in
            </Link>
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
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label form-label-required">Email address</label>
                <div className="input-wrap">
                  <span className="input-icon"><Mail size={15} /></span>
                  <input
                    type="email"
                    className={`form-input has-icon${errors.email ? ' error' : ''}`}
                    placeholder="you@example.com"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                    })}
                  />
                </div>
                {errors.email && (
                  <span className="form-error"><AlertCircle size={12} />{errors.email.message}</span>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner size="sm" /> Sending…</> : 'Send reset link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link
                to="/login"
                style={{ fontSize: '0.875rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <ArrowLeft size={14} /> Back to Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
