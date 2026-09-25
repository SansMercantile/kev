import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HeroIllustration from '../components/HeroIllustration'
import { getCurriculumSubjects, getMultiAgentsCatalog } from '../lib/api'
import { xrClient } from '../lib/xrClient'
import RoleLogin from '../components/RoleLogin'
import { getRole, ROLES } from '../lib/roleSession'

export default function Landing() {
  const navigate = useNavigate()
  const role = getRole()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getCurriculumSubjects().catch(() => null),
      getMultiAgentsCatalog().catch(() => null),
      xrClient.tracks().catch(() => null),
      xrClient.levels().catch(() => null),
    ])
      .then(([subjects, catalog, tracks, levels]) => {
        if (cancelled) return
        setStats({
          subjects: subjects?.subjects?.length || 0,
          tutors: catalog?.count || 0,
          tracks: tracks?.tracks?.length || 0,
          levels: levels?.levels?.length || 0,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const eyebrow = stats
    ? `${stats.tutors}+ specialist tutors, ${stats.subjects} live subjects`
    : 'Specialist tutors, live subjects'

  return (
    <main id="main" role="main" aria-label="KEV main content">
      <section className="kev-hero">
        <div className="kev-hero-content">
          <div className="kev-hero-copy">
            <div className="kev-eyebrow">{eyebrow}</div>
            <h1 className="kev-hero-title">A curriculum library with <strong>real</strong> tutors behind every page.</h1>
            <p>
              KEV pairs a central curriculum library of live, dependency-mapped subjects with hundreds of
              specialist AI tutors, each one purpose-built for a subject, grade level, and role
              - from elementary arithmetic to university-level music theory.
            </p>

            <div className="kev-hero-actions">
              <Link to="/xr-academy" className="kev-btn kev-btn-primary">
                Enter the XR Academy
              </Link>
              <Link to="/pricing" className="kev-btn kev-btn-secondary">
                See pricing
              </Link>
            </div>
          </div>

          <HeroIllustration className="kev-hero-decor" />
          <div className="kev-hero-panel">
            <h3>What&apos;s actually running</h3>
            <p>
              A live tutor catalog, a virtual campus with VR/AR classrooms, and a shared
              curriculum library - all callable over a stateless API, so any tutor can be
              reached on demand without holding session state between requests.
            </p>
            <div className="kev-hero-mini">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="mini-dot" style={{ background: '#2563eb' }} aria-hidden="true" />
                <div>
                  <strong style={{ display: 'block' }}>{stats ? `${stats.tutors}+` : '…'}</strong>
                  <small style={{ color: 'rgba(255,255,255,0.92)' }}>Specialist tutors</small>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="mini-dot" style={{ background: '#10b981' }} aria-hidden="true" />
                <div>
                  <strong style={{ display: 'block' }}>{stats ? stats.subjects : '…'}</strong>
                  <small style={{ color: 'rgba(255,255,255,0.92)' }}>Live subjects</small>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="mini-dot" style={{ background: '#f59e0b' }} aria-hidden="true" />
                <div>
                  <strong style={{ display: 'block' }}>{stats ? stats.tracks : '…'}</strong>
                  <small style={{ color: 'rgba(255,255,255,0.92)' }}>XR lab tracks</small>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="mini-dot" style={{ background: '#8b5cf6' }} aria-hidden="true" />
                <div>
                  <strong style={{ display: 'block' }}>{stats ? stats.levels : '…'}</strong>
                  <small style={{ color: 'rgba(255,255,255,0.92)' }}>Study levels</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="kev-section" aria-label="What KEV includes">
        <h2 className="kev-section-title">Everything a student needs, in one campus</h2>
        <p className="kev-section-copy">
          Six surfaces, one account. Progress, tutors, and study levels follow the learner everywhere.
        </p>
        <div className="kev-grid kev-grid-3" style={{ marginTop: '1.5rem' }}>
          <div className="kev-card">
            <strong>XR Academy labs</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Chemistry, astrophysics, biology, and optics simulations with live Socratic tutors and a lab notebook.
            </p>
            <p style={{ marginTop: '0.75rem' }}><Link to="/xr-academy">Open the labs →</Link></p>
          </div>
          <div className="kev-card">
            <strong>Immersive 3D models</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Dissect anatomy, plant, bridge, vehicle, and earth systems — search 3,400+ structures, isolate, explode.
            </p>
            <p style={{ marginTop: '0.75rem' }}><Link to="/anatomy">Explore models →</Link></p>
          </div>
          <div className="kev-card">
            <strong>Tutors for every subject</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Faculty mentors plus hundreds of specialist agents, answering in six UI languages and 90+ home languages.
            </p>
            <p style={{ marginTop: '0.75rem' }}><Link to="/agents">Meet the tutors →</Link></p>
          </div>
          <div className="kev-card">
            <strong>Live campus + VR</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Bookable virtual-school rooms, a walkable 3D campus, and enclosed VR classrooms with real-time presence.
            </p>
            <p style={{ marginTop: '0.75rem' }}><Link to="/campus-map">See the campus →</Link></p>
          </div>
          <div className="kev-card">
            <strong>Curriculum that adapts</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Dependency-mapped subjects, per-student study paths, and five study levels from elementary to professional.
            </p>
            <p style={{ marginTop: '0.75rem' }}><Link to="/curriculum">Browse curriculum →</Link></p>
          </div>
          <div className="kev-card">
            <strong>Offline-first</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Labs, notebook, library packs, and cached campus keep working with no internet. Messages queue and sync.
            </p>
            <p style={{ marginTop: '0.75rem' }}><Link to="/platform">How it works →</Link></p>
          </div>
        </div>
      </section>

      {role ? (
        <section className="kev-section" aria-label="Continue to your school">
          <h2 className="kev-section-title">Continue as {role}</h2>
          <p className="kev-section-copy">
            {role === ROLES.TEACHER
              ? 'Open the teaching studio for live lessons, the blackboard and your markbook.'
              : 'Head into the campus to attend live lessons with your cohort.'}
          </p>
          <div className="kev-hero-actions">
            <Link to={role === ROLES.TEACHER ? '/teacher' : '/xr-academy'} className="kev-btn kev-btn-primary">
              {role === ROLES.TEACHER ? 'Open teaching studio' : 'Enter the campus'}
            </Link>
          </div>
        </section>
      ) : (
        <RoleLogin
          onSignedIn={() => navigate(getRole() === ROLES.TEACHER ? '/teacher' : '/xr-academy')}
        />
      )}

      <section className="kev-section" aria-label="Get started">
        <h2 className="kev-section-title">Start free, upgrade when ready</h2>
        <p className="kev-section-copy">
          Explorer tier is free forever with metered AI tutoring. Pro, Family, School, and Enterprise unlock more.
        </p>
        <div className="kev-hero-actions" style={{ marginTop: '1rem' }}>
          <Link to="/portal" className="kev-btn kev-btn-primary">
            Open the Portal
          </Link>
          <Link to="/pricing" className="kev-btn kev-btn-secondary">
            Compare plans
          </Link>
        </div>
      </section>
    </main>
  )
}
