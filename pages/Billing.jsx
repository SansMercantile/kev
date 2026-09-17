import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getBillingPlans,
  getBillingSubscription,
  getBillingUsage,
  getBillingInvoices,
  billingCheckout,
  billingChangePlan,
  billingCancel,
} from '../lib/api'
import SurfaceLinks from '../components/SurfaceLinks'

function useQuery() {
  return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
}

export default function Billing() {
  const { t } = useTranslation()
  const query = useQuery()
  const [plans, setPlans] = useState([])
  const [providers, setProviders] = useState({ mock: true, mockAllowed: true })
  const [subscription, setSubscription] = useState(null)
  const [plan, setPlan] = useState(null)
  const [usage, setUsage] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(query.get('plan') || 'pro')
  const [interval, setInterval] = useState(query.get('interval') || 'monthly')
  const [currency, setCurrency] = useState(query.get('currency') || 'USD')
  const [provider, setProvider] = useState('auto')
  const [email, setEmail] = useState('')
  const [coupon, setCoupon] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(
    query.get('checkout') === 'success' ? 'Payment completed — your subscription is active.' : null
  )

  const refresh = useCallback(async () => {
    const [plansData, subData, usageData, invoicesData] = await Promise.all([
      getBillingPlans(),
      getBillingSubscription(),
      getBillingUsage(),
      getBillingInvoices(),
    ])
    setPlans(plansData.plans || [])
    setProviders(plansData.providers || { mock: true })
    setSubscription(subData.subscription || null)
    setPlan(subData.plan || null)
    setUsage(usageData.usage || null)
    setInvoices(invoicesData.invoices || [])
  }, [])

  useEffect(() => {
    let cancelled = false
    refresh()
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refresh])

  const handleCheckout = async (e) => {
    e.preventDefault()
    setWorking(true)
    setError(null)
    setNotice(null)
    try {
      const result = await billingCheckout({
        plan_id: selectedPlan,
        interval,
        currency,
        provider,
        email,
        coupon,
      })
      if (result.checkout_url) {
        window.location.href = result.checkout_url
        return
      }
      setNotice(
        result.subscription?.status === 'trialing'
          ? 'Trial started — enjoy full access. No charge until the trial ends.'
          : 'Subscription active — enjoy full access.'
      )
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  const handleChangePlan = async (planId) => {
    setWorking(true)
    setError(null)
    try {
      await billingChangePlan({ plan_id: planId, interval, currency })
      setNotice(`Plan changed to ${planId}.`)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel at the end of the current period? You keep access until then.')) return
    setWorking(true)
    setError(null)
    try {
      await billingCancel()
      setNotice('Cancelled — access continues until the paid period ends.')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  const activeSub = subscription && ['active', 'trialing'].includes(subscription.status) ? subscription : null

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label="Billing">
        <div className="kev-pill">Billing</div>
        <h2 className="kev-section-title" style={{ marginTop: '1rem' }}>Subscription & usage</h2>

        {loading && <p>Loading billing details...</p>}
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        {notice && <p style={{ color: '#16a34a' }}>{notice}</p>}

        {!loading && (
          <>
            <div className="kev-grid kev-grid-3" style={{ marginTop: '1.5rem' }}>
              <div className="kev-card">
                <strong>Current plan</strong>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.5rem 0 0' }}>
                  {plan?.name || 'Explorer'}
                </p>
                <p className="kev-card-text">
                  {activeSub
                    ? `${activeSub.status === 'trialing' ? 'Trial' : 'Active'} · ${activeSub.interval} · ${activeSub.currency} ${activeSub.amount}`
                    : 'Free tier'}
                  {activeSub?.cancel_at_period_end && ' · cancels at period end'}
                </p>
                {activeSub && (
                  <button className="kev-btn kev-btn-secondary" onClick={handleCancel} disabled={working} style={{ marginTop: '0.75rem' }}>
                    Cancel subscription
                  </button>
                )}
              </div>

              <div className="kev-card">
                <strong>AI tutor usage</strong>
                {usage ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    {Object.entries(usage.features || {})
                      .filter(([, f]) => f.unit)
                      .map(([key, f]) => (
                        <div key={key} style={{ marginBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>{f.label}</span>
                            <span>{f.limit === -1 ? `${f.used} used · unlimited` : `${f.used} / ${f.limit} ${f.unit}`}</span>
                          </div>
                          {f.limit > 0 && (
                            <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', marginTop: '0.25rem' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, Math.round((f.used / f.limit) * 100))}%`,
                                  height: '100%',
                                  borderRadius: 4,
                                  background: f.remaining === 0 ? '#dc2626' : '#c9a227',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    <small style={{ color: '#64748b' }}>Resets monthly · Plan: {usage.plan_id}</small>
                  </div>
                ) : (
                  <p className="kev-card-text">Usage unavailable.</p>
                )}
              </div>

              <div className="kev-card">
                <strong>Change plan</strong>
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {plans.filter((p) => p.id !== 'free' && p.id !== 'enterprise').map((p) => (
                    <button
                      key={p.id}
                      className="kev-btn kev-btn-secondary"
                      disabled={working || activeSub?.plan_id === p.id}
                      onClick={() => (activeSub ? handleChangePlan(p.id) : setSelectedPlan(p.id))}
                    >
                      {p.name}{activeSub?.plan_id === p.id ? ' (current)' : ''}
                    </button>
                  ))}
                </div>
                <p className="kev-card-text" style={{ marginTop: '0.75rem' }}>
                  <a href="/pricing">Compare all plans</a>
                </p>
              </div>
            </div>

            <section style={{ marginTop: '2rem' }} aria-label="Checkout">
              <h3 className="kev-section-title" style={{ fontSize: '1.2rem' }}>
                {activeSub ? 'Start a new checkout' : 'Subscribe or start trial'}
              </h3>
              <form onSubmit={handleCheckout} style={{ display: 'grid', gap: '0.75rem', maxWidth: 560, marginTop: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.25rem' }}>
                  Plan
                  <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }}>
                    {plans.filter((p) => p.id !== 'free' && p.id !== 'enterprise').map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'grid', gap: '0.25rem', flex: '1 1 140px' }}>
                    Interval
                    <select value={interval} onChange={(e) => setInterval(e.target.value)} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }}>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual (save ~17%)</option>
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '0.25rem', flex: '1 1 140px' }}>
                    Currency
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }}>
                      <option value="USD">USD — card (Stripe)</option>
                      <option value="ZAR">ZAR — PayFast</option>
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '0.25rem', flex: '1 1 140px' }}>
                    Provider
                    <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }}>
                      <option value="auto">Automatic</option>
                      <option value="stripe" disabled={!providers.stripe}>Stripe{providers.stripe ? '' : ' (not configured)'}</option>
                      <option value="payfast" disabled={!providers.payfast}>PayFast{providers.payfast ? '' : ' (not configured)'}</option>
                      {providers.mockAllowed && <option value="mock">Test mode</option>}
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'grid', gap: '0.25rem', flex: '2 1 200px' }}>
                    Email for receipts
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.25rem', flex: '1 1 140px' }}>
                    Coupon (optional)
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="EDU50" style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit' }} />
                  </label>
                </div>
                <button className="kev-btn kev-btn-primary" type="submit" disabled={working}>
                  {working ? 'Processing...' : 'Subscribe'}
                </button>
                {!providers.stripe && !providers.payfast && (
                  <small style={{ color: '#64748b' }}>
                    {providers.mockAllowed
                      ? 'Live providers are not configured on this deployment — checkout runs in test mode.'
                      : 'Online payments are not enabled on this deployment yet — contact sales to subscribe.'}
                  </small>
                )}
              </form>
            </section>

            <section style={{ marginTop: '2rem' }} aria-label="Invoices">
              <h3 className="kev-section-title" style={{ fontSize: '1.2rem' }}>Invoices ({invoices.length})</h3>
              {invoices.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                  {invoices.map((inv) => (
                    <div key={inv.id} className="kev-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <strong>{inv.lines?.[0]?.description || inv.plan_id}</strong>
                        <p className="kev-card-text">{inv.created_at?.slice(0, 10)} · {inv.provider}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong>{inv.currency} {inv.amount}</strong>
                        <p className="kev-card-text">{inv.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="kev-card-text">No invoices yet — they appear here after checkout.</p>
              )}
            </section>
          </>
        )}

        <SurfaceLinks
          title={t('surface.continueInKev')}
          links={[
            { to: '/pricing', label: t('nav.pricing'), text: 'Free, Pro, Family, School, Enterprise.' },
            { to: '/xr-academy', label: t('nav.xrAcademy'), text: 'Your subscription unlocks tutors and labs.' },
            { to: '/curriculum', label: t('nav.curriculum'), text: 'Study paths for every level.' },
          ]}
        />
      </section>
    </main>
  )
}
