import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authLogin, authForgotPassword, authResetPassword, authResendCode } from '../lib/api'
import { saveNativeSession } from '../lib/nativeAuth'

function friendlyError(err) {
  const message = String(err?.message || err)
  try {
    const payload = JSON.parse(message.slice(message.indexOf('{')))
    if (payload.detail) return payload.detail
  } catch {
    /* fall through */
  }
  return 'Something went wrong. Please try again.'
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [mode, setMode] = useState('login') // login | forgot | reset
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const submitLogin = async (e) => {
    e.preventDefault()
    setWorking(true)
    setError(null)
    try {
      const tokens = await authLogin(email, password)
      saveNativeSession({ ...tokens, remember })
      navigate('/xr-academy', { replace: true })
    } catch (err) {
      const message = friendlyError(err)
      setError(message)
      if (/confirm/i.test(message)) {
        try {
          await authResendCode(email)
        } catch {
          /* code may already be on its way */
        }
        navigate(`/signup?email=${encodeURIComponent(email)}`)
      }
    } finally {
      setWorking(false)
    }
  }

  const submitForgot = async (e) => {
    e.preventDefault()
    setWorking(true)
    setError(null)
    try {
      await authForgotPassword(email)
      setNotice(`If an account exists for ${email}, a reset code is on its way.`)
      setMode('reset')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setWorking(false)
    }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setWorking(true)
    setError(null)
    try {
      await authResetPassword(email, code, newPassword)
      setNotice('Password updated - sign in with the new one.')
      setMode('login')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setWorking(false)
    }
  }

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label="Sign in" style={{ maxWidth: 560 }}>
        <div className="kev-pill">Accounts</div>
        <h2 className="kev-section-title" style={{ marginTop: '1rem' }}>
          {mode === 'login' && 'Welcome back'}
          {mode === 'forgot' && 'Reset your password'}
          {mode === 'reset' && 'Choose a new password'}
        </h2>

        {error && <p style={{ color: '#dc2626' }} role="alert">{error}</p>}
        {notice && <p style={{ color: '#16a34a' }} role="status">{notice}</p>}

        {mode === 'login' && (
          <form onSubmit={submitLogin} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email"
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
                autoComplete="current-password"
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Keep me signed in on this device
            </label>
            <button className="kev-btn kev-btn-primary" type="submit" disabled={working}>
              {working ? 'Signing in...' : 'Sign in'}
            </button>
            <button className="kev-btn kev-btn-secondary" type="button" onClick={() => { setMode('forgot'); setError(null) }}>
              Forgot password?
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={submitForgot} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email"
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <button className="kev-btn kev-btn-primary" type="submit" disabled={working}>
              {working ? 'Sending...' : 'Send reset code'}
            </button>
            <button className="kev-btn kev-btn-secondary" type="button" onClick={() => setMode('login')}>
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={submitReset} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Reset code
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" required
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              New password
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required
                autoComplete="new-password" minLength={10}
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <button className="kev-btn kev-btn-primary" type="submit" disabled={working}>
              {working ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <p className="kev-card-text" style={{ marginTop: '1rem' }}>
          New to KEV? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  )
}
