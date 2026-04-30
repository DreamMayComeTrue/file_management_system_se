// UC-01 — Login to System
import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { authService } from '../../services/authService.js'
import Spinner from '../../components/common/Spinner.jsx'
import logo from '../../assets/logo.png'

const ROLE_HOME = {
  Lecturer: '/my-dashboard',
  PIC:      '/programme-dashboard',
  Audit:    '/completion-dashboard',
}

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  // Already logged in — redirect immediately (use <Navigate> not navigate() during render)
  if (user) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/my-dashboard'} replace />
  }

  async function onSubmit(data) {
    setApiError('')
    try {
      const res = await authService.login(data)
      login(res.data.token)
      // Decode role from token to decide home page
      const payload = JSON.parse(atob(res.data.token.split('.')[1]))
      navigate(ROLE_HOME[payload.role] ?? '/my-dashboard', { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Invalid email or password.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <img src={logo} alt="SOF-EA UTM" className="auth-logo-img" />
          <h1 className="auth-title">File Management System</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>

        {/* Error */}
        {apiError && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="form-group">
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

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="form-label form-label-required">Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="input-wrap">
              <span className="input-icon"><Lock size={15} /></span>
              <input
                type={showPw ? 'text' : 'password'}
                className={`form-input has-icon has-icon-right${errors.password ? ' error' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPw(v => !v)}
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <span className="form-error"><AlertCircle size={12} />{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? <><Spinner size="sm" /> Signing in…</> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
