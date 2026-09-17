import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAgentsAvailable, getMultiAgentsCatalog } from '../lib/api'
import { xrClient } from '../lib/xrClient'
import SurfaceLinks from '../components/SurfaceLinks'

function roleOf(agent) {
  const role = agent.role
  return typeof role === 'string' ? role : role?.value || role?.name || 'tutor'
}

export default function Agents() {
  const { t } = useTranslation()
  const [registry, setRegistry] = useState([])
  const [catalog, setCatalog] = useState({ count: 0, agents: [] })
  const [catalogFull, setCatalogFull] = useState([])
  const [faculty, setFaculty] = useState([])
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getAgentsAvailable().catch(() => ({ agents: [] })),
      getMultiAgentsCatalog().catch(() => ({ count: 0, agents: [] })),
      xrClient.tutors().catch(() => ({ tutors: [] })),
    ])
      .then(([reg, cat, fac]) => {
        if (cancelled) return
        setRegistry(reg.agents || [])
        setCatalog({ count: cat.count || 0, agents: (cat.agents || []).slice(0, 60) })
        setCatalogFull(cat.agents || [])
        setFaculty(fac.tutors || [])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subjects = useMemo(() => {
    const names = new Set([
      ...registry.map((a) => a.subject).filter(Boolean),
      ...catalogFull.map((a) => a.subject).filter(Boolean),
    ])
    return [...names].sort()
  }, [registry, catalogFull])

  const q = query.toLowerCase().trim()
  const matchesQuery = (text) => !q || String(text || '').toLowerCase().includes(q)
  const visibleRegistry = registry.filter(
    (a) => (!subjectFilter || a.subject === subjectFilter) && (matchesQuery(a.agent_id) || matchesQuery(a.specialization) || matchesQuery(a.subject))
  )
  const visibleCatalog = catalogFull
    .filter(
      (a) =>
        (!subjectFilter || a.subject === subjectFilter) &&
        (matchesQuery(a.tutor_id) || matchesQuery(a.specialization) || matchesQuery(a.subject))
    )
    .slice(0, 60)

  const roleCounts = useMemo(() => {
    const counts = {}
    registry.forEach((a) => {
      const role = roleOf(a).toLowerCase()
      counts[role] = (counts[role] || 0) + 1
    })
    return counts
  }, [registry])

  return (
    <main className="kev-section">
      <section id="agents" className="kev-section" aria-label="Agents Overview">
        <h2 className="kev-section-title">Agents Overview</h2>
        <p className="kev-section-copy">
          {loading
            ? 'Loading the live tutoring network...'
            : `${registry.length} registry tutors · ${catalog.count} specialist agents · ${faculty.length} XR faculty — all live from the backend.`}
        </p>
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}

        {!loading && !error && (
          <>
            <div className="kev-grid kev-grid-3">
              <div className="kev-card">
                <strong>Registry tutors</strong>
                <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
                  {registry.length} tutors, teachers, mentors, experts and invigilators
                  {Object.keys(roleCounts).length > 0 && ` (${Object.entries(roleCounts).map(([r, n]) => `${n} ${r}`).join(' · ')})`}.
                </p>
              </div>
              <div className="kev-card">
                <strong>Specialist agents</strong>
                <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
                  {catalog.count} per-subject implementations under <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 6 }}>multi_agents/</code>,
                  each callable statelessly via Bedrock.
                </p>
              </div>
              <div className="kev-card">
                <strong>XR faculty</strong>
                <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
                  {faculty.length} resident mentors inside the XR Academy labs, answering live over WebSocket-era chat and Socratic Q&amp;A.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tutors, specializations..."
                aria-label="Search agents"
                style={{ flex: '2 1 220px', padding: '0.55rem 0.7rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit', background: '#fff' }}
              />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                aria-label="Filter by subject"
                style={{ flex: '1 1 160px', padding: '0.55rem 0.7rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit', background: '#fff' }}
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {faculty.length > 0 && (
              <section style={{ marginTop: '2rem' }} aria-label="XR faculty">
                <h3 className="kev-section-title" style={{ fontSize: '1.2rem' }}>XR faculty</h3>
                <div className="kev-grid kev-grid-2" style={{ marginTop: '1rem' }}>
                  {faculty.map((t) => (
                    <div key={t.id} className="kev-card">
                      <strong>{t.name}</strong>
                      <p className="kev-card-text">{t.title}</p>
                      <small style={{ color: '#64748b' }}>
                        {t.location} · ★ {t.rating} · {(t.specialties || []).slice(0, 3).join(' · ')}
                      </small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {visibleRegistry.length > 0 && (
              <section style={{ marginTop: '2rem' }} aria-label="Registry tutors">
                <h3 className="kev-section-title" style={{ fontSize: '1.2rem' }}>Registry tutors ({visibleRegistry.length}{subjectFilter || q ? ' shown' : ''})</h3>
                <div className="kev-grid kev-grid-3" style={{ marginTop: '1rem' }}>
                  {visibleRegistry.slice(0, 12).map((a) => (
                    <div key={a.agent_id || a.id} className="kev-card">
                      <strong style={{ fontSize: '0.9rem' }}>{a.specialization || a.agent_id}</strong>
                      <p className="kev-card-text">{a.subject} · {roleOf(a)}</p>
                      <small style={{ color: '#64748b' }}>{(a.education_levels || []).join(', ')}</small>
                    </div>
                  ))}
                </div>
                {visibleRegistry.length > 12 && (
                  <p className="kev-card-text" style={{ marginTop: '0.75rem' }}>…and {visibleRegistry.length - 12} more — refine the search to narrow down.</p>
                )}
              </section>
            )}

            {visibleCatalog.length > 0 && (
              <section style={{ marginTop: '2rem' }} aria-label="Specialist agents">
                <h3 className="kev-section-title" style={{ fontSize: '1.2rem' }}>Specialist agents (showing {visibleCatalog.length} of {catalog.count})</h3>
                <div className="kev-grid kev-grid-3" style={{ marginTop: '1rem' }}>
                  {visibleCatalog.slice(0, 12).map((a) => (
                    <div key={a.tutor_id} className="kev-card">
                      <strong style={{ fontSize: '0.9rem' }}>{a.specialization}</strong>
                      <p className="kev-card-text">{a.subject} · {a.tutor_type}</p>
                      <small style={{ color: '#64748b' }}>{(a.education_levels || []).join(', ')}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <SurfaceLinks
          title={t('surface.continueInKev')}
          links={[
            { to: '/xr-academy', label: t('nav.xrAcademy'), text: 'Live Socratic tutors inside every 3D lab.' },
            { to: '/anatomy', label: t('nav.immersiveLab'), text: 'Inspect a structure, then ask its faculty tutor about it.' },
            { to: '/curriculum', label: t('nav.curriculum'), text: 'See which subjects each tutor covers.' },
          ]}
        />
      </section>
    </main>
  )
}
