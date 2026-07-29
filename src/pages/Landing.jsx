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
            <div className="kev-eyebrow">Next‑gen learning platform</div>
            <h1 className="kev-hero-title">A next‑generation curriculum, AI tutors, and game-based pedagogy for scale.</h1>
            <p>
              KEV combines a modular curriculum library with adaptive AI tutors, immersive game-based learning,
              real‑time analytics, and governance controls to enable institutional‑grade, personalized learning at scale.
            </p>

            <div className="kev-hero-actions">
              <a
                className="kev-btn kev-btn-primary"
                href={import.meta.env.VITE_PLATFORM_URL ?? 'http://localhost:3002'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Launch KEV Platform
              </a>
              <Link to="/integration" className="kev-btn kev-btn-secondary">
                Explore Integration
              </Link>
            </div>
          </div>

          <HeroIllustration className="kev-hero-decor" />
          <div className="kev-hero-panel">
            <h3>Live KEV Environment</h3>
            <p>
              Active learning engines, policy orchestration, and real-time curriculum optimization
              working together to serve students, educators, and institutional governance.
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
