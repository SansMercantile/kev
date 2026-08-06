import React from 'react'
import { Link } from 'react-router-dom'
import HeroIllustration from '../components/HeroIllustration'
import { portalStats } from '../lib/data'

export default function Landing() {
  return (
    <main id="main" role="main" aria-label="KEV main content">
      <section className="kev-hero">
        <div className="kev-hero-content">
          <div className="kev-hero-copy">
            <div className="kev-eyebrow">872+ specialist tutors, 14 subjects</div>
            <h1 className="kev-hero-title">A curriculum library with <strong>real</strong> tutors behind every page.</h1>
            <p>
              KEV pairs a central curriculum library covering 185+ subjects with hundreds of
              specialist AI tutors, each one purpose-built for a subject, grade level, and role
              - from elementary arithmetic to university-level music theory - and backed by
              Claude on Amazon Bedrock.
            </p>

            <div className="kev-hero-actions">
              <Link to="/portal" className="kev-btn kev-btn-primary">
                Open the Portal
              </Link>
              <Link to="/integration" className="kev-btn kev-btn-secondary">
                Explore Integration
              </Link>
            </div>
          </div>

          <HeroIllustration className="kev-hero-decor" />
          <div className="kev-hero-panel">
            <h3>What's actually running</h3>
            <p>
              A live tutor catalog, a virtual campus with VR/AR classrooms, and a shared
              curriculum library - all callable over a stateless API, so any tutor can be
              reached on demand without holding session state between requests.
            </p>
            <div className="kev-hero-mini">
              {portalStats.slice(0, 2).map((stat) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="mini-dot" style={{ background: stat.accent }} aria-hidden="true" />
                  <div>
                    <strong style={{ display: 'block' }}>{stat.value}</strong>
                    <small style={{ color: 'rgba(255,255,255,0.92)' }}>{stat.label}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
