import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBillingPlans } from '../lib/api'

const CURRENCIES = [
  { id: 'USD', label: 'USD ($)' },
  { id: 'ZAR', label: 'ZAR (R)' },
]

function formatPrice(amount, currency, t) {
  if (amount === -1) return t('pricing.custom')
  if (amount === 0) return t('pricing.free')
  return currency === 'ZAR' ? `R${amount.toLocaleString()}` : `$${amount.toLocaleString()}`
}

export default function Pricing() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState([])
  const [currency, setCurrency] = useState('USD')
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getBillingPlans()
      .then((data) => {
        if (!cancelled) setPlans(data.plans || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const interval = annual ? 'annual' : 'monthly'

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label={t('pricing.pill')} style={{ textAlign: 'center' }}>
        <div className="kev-pill" style={{ margin: '0 auto' }}>{t('pricing.pill')}</div>
        <h2 className="kev-section-title" style={{ marginTop: '1rem' }}>{t('pricing.title')}</h2>
        <p className="kev-section-copy" style={{ margin: '0 auto' }}>
          {t('pricing.subtitle')}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div role="group" aria-label="Currency">
            {CURRENCIES.map((c) => (
              <button
                key={c.id}
                className={`kev-btn${currency === c.id ? ' kev-btn-primary' : ' kev-btn-secondary'}`}
                onClick={() => setCurrency(c.id)}
                style={{ marginRight: '0.5rem' }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Billing interval">
            <button
              className={`kev-btn${!annual ? ' kev-btn-primary' : ' kev-btn-secondary'}`}
              onClick={() => setAnnual(false)}
              style={{ marginRight: '0.5rem' }}
            >
              {t('pricing.monthly')}
            </button>
            <button
              className={`kev-btn${annual ? ' kev-btn-primary' : ' kev-btn-secondary'}`}
              onClick={() => setAnnual(true)}
            >
              {t('pricing.annual')} <span style={{ fontSize: '0.8em' }}>{t('pricing.saveNote')}</span>
            </button>
          </div>
        </div>

        {loading && <p style={{ marginTop: '2rem' }}>{t('pricing.loading')}</p>}
        {error && <p style={{ color: '#dc2626', marginTop: '2rem' }}>{error}</p>}

        {!loading && !error && (
          <div className="kev-grid kev-grid-3" style={{ marginTop: '2rem', textAlign: 'left' }}>
            {plans.map((plan) => {
              const price = plan.prices?.[currency]?.[interval]
              return (
                <div
                  key={plan.id}
                  className="kev-card"
                  style={plan.highlight ? { border: '2px solid #c9a227', boxShadow: '0 8px 30px rgba(201,162,39,0.15)' } : undefined}
                >
                  {plan.highlight && <div className="kev-pill" style={{ marginBottom: '0.75rem' }}>{t('pricing.mostPopular')}</div>}
                  <h3 style={{ margin: '0 0 0.25rem' }}>{plan.name}</h3>
                  <p className="kev-card-text">{plan.tagline}</p>
                  <p style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0.75rem 0 0' }}>
                    {formatPrice(price, currency, t)}
                    {price > 0 && (
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>
                        {' '}{annual ? t('pricing.perYear') : t('pricing.perMonth')}
                      </span>
                    )}
                  </p>
                  {plan.seats > 1 && (
                    <small style={{ color: '#64748b' }}>{t('pricing.seatsUpTo', { count: plan.seats })}</small>
                  )}
                  <ul style={{ paddingLeft: '1.1rem', margin: '1rem 0', display: 'grid', gap: '0.35rem', fontSize: '0.92rem' }}>
                    {(plan.features || []).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  {plan.id === 'enterprise' ? (
                    <a className="kev-btn kev-btn-secondary" href="https://sansmercantile.com/contact" target="_blank" rel="noopener noreferrer">
                      {t('pricing.contactSales')}
                    </a>
                  ) : plan.id === 'free' ? (
                    <a className="kev-btn kev-btn-secondary" href="/xr-academy">{t('pricing.startFree')}</a>
                  ) : (
                    <a className="kev-btn kev-btn-primary" href={`/billing?plan=${plan.id}&interval=${interval}&currency=${currency}`}>
                      {plan.cta}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="kev-grid kev-grid-3" style={{ marginTop: '2.5rem', textAlign: 'left' }}>
          <div className="kev-card">
            <strong>{t('pricing.trialTitle')}</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              {t('pricing.trialBody')}
            </p>
          </div>
          <div className="kev-card">
            <strong>{t('pricing.payTitle')}</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              {t('pricing.payBody')}
            </p>
          </div>
          <div className="kev-card">
            <strong>{t('pricing.cancelTitle')}</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              {t('pricing.cancelBody')}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
