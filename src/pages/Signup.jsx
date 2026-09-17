import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authSignup, authConfirm, authResendCode } from '../lib/api'
import { saveNativeSession } from '../lib/nativeAuth'

function friendlyError(err) {
  const message = String(err?.message || err)
  const match = message.match(/"detail"\s*:\s*"([^"]+)"/) || message.match(/detail[^A-Za-z]*(.+)$/)
  // FastAPI serializes {"detail": "..."} - surface just the message.
  try {
    const payload = JSON.parse(message.slice(message.indexOf('{')))
    if (payload.detail) return payload.detail
  } catch {
    /* fall through */
  }
  if (match) return match[1]
  return 'Something went wrong. Please try again.'
}

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState('details') // details | confirm
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const submitDetails = async (e) => {
    e.preventDefault()
    setWorking(true)
    setError(null)
    try {
      const result = await authSignup(email, password, name)
      if (result.confirmed) {
        setNotice('Account created and confirmed - signing you in...')
      } else {
        setNotice(`We emailed a 6-digit code to ${email}. Enter it below.`)
        setStage('confirm')
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setWorking(false)
    }
  }

  const submitCode = async (e) => {
    e.preventDefault()
    setWorking(true)
    setError(null)
    try {
      await authConfirm(email, code)
      // Auto sign-in after confirmation for a smooth first run.
      const { authLogin } = await import('../lib/api')
      const tokens = await authLogin(email, password)
      saveNativeSession({ ...tokens, user: { email, name }, remember: true })
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setWorking(false)
    }
  }

  const resend = async () => {
    setWorking(true)
    setError(null)
    try {
      await authResendCode(email)
      setNotice(`A fresh code is on its way to ${email}.`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setWorking(false)
    }
  }

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label="Create account" style={{ maxWidth: 560 }}>
        <div className="kev-pill">Accounts</div>
        <h2 className="kev-section-title" style={{ marginTop: '1rem' }}>Create your KEV account</h2>
        <p className="kev-section-copy">
          One account for labs, tutors, campus chat, and billing. We only ask for what learning needs.
        </p>

        {error && <p style={{ color: '#dc2626' }} role="alert">{error}</p>}
        {notice && <p style={{ color: '#16a34a' }} role="status">{notice}</p>}

        {stage === 'details' ? (
          <form onSubmit={submitDetails} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email"
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
                autoComplete="new-password" minLength={10}
                placeholder="10+ characters, upper, lower and numbers"
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <button className="kev-btn kev-btn-primary" type="submit" disabled={working}>
              {working ? 'Creating...' : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Confirmation code
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" required
                placeholder="6-digit code"
                style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
            </label>
            <button className="kev-btn kev-btn-primary" type="submit" disabled={working}>
              {working ? 'Confirming...' : 'Confirm email'}
            </button>
            <button className="kev-btn kev-btn-secondary" type="button" onClick={resend} disabled={working}>
              Resend code
            </button>
          </form>
        )}

        <p className="kev-card-text" style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}
