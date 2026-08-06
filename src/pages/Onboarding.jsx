import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { submitOnboardingApplication } from '../lib/api'

const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '', nationality: '',
  country_of_residence: '', email: '', phone: '', current_grade: '',
}

export default function Onboarding() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0()
  const [form, setForm] = useState(EMPTY_FORM)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const application = await submitOnboardingApplication(form)
      setResult(application)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return null

  if (!isAuthenticated) {
    return (
      <main className="kev-section">
        <section className="kev-section">
          <h2 className="kev-section-title">Student Onboarding</h2>
          <p className="kev-section-copy">Sign in first to start an admission application.</p>
          <button className="kev-btn kev-btn-primary" onClick={() => loginWithRedirect()}>
            Sign in to continue
          </button>
        </section>
      </main>
    )
  }

  if (result) {
    return (
      <main className="kev-section">
        <section className="kev-section kev-card" style={{ maxWidth: 520 }}>
          <h2 className="kev-section-title">Application submitted</h2>
          <p>Student ID: <strong>{result.student_id}</strong></p>
          <p>Verification status: <strong>{result.verification_status}</strong></p>
          <p className="kev-section-copy">{result.message}</p>
        </section>
      </main>
    )
  }

  const field = (label, key, type = 'text', required = true) => (
    <label style={{ display: 'grid', gap: '0.3rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={update(key)}
        required={required}
        style={{ padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
      />
    </label>
  )

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label="Student Onboarding">
        <h2 className="kev-section-title">Student Onboarding</h2>
        <p className="kev-section-copy">
          Signed in as {user?.email || user?.name}. Admission is subject to age validation
          for your country of residence.
        </p>

        <form onSubmit={handleSubmit} className="kev-card" style={{ maxWidth: 560, display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {field('First name', 'first_name')}
            {field('Last name', 'last_name')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {field('Date of birth', 'date_of_birth', 'date')}
            {field('Nationality (ISO code, e.g. US)', 'nationality')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {field('Country of residence', 'country_of_residence', 'text', false)}
            {field('Current grade', 'current_grade', 'text', false)}
          </div>
          {field('Email', 'email', 'email')}
          {field('Phone', 'phone', 'tel', false)}

          <button type="submit" className="kev-btn kev-btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        </form>
      </section>
    </main>
  )
}
