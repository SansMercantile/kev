import React from 'react'

export default function Docs() {
  return (
    <main className="kev-section">
      <section id="docs" className="kev-section" aria-label="Documentation and reports">
        <h2 className="kev-section-title">Docs & Reports</h2>
        <p className="kev-section-copy">Primary system documents and deployment notes from the repo.</p>

        <div className="kev-grid kev-grid-3">
          <article className="kev-card">
            <a href="/KEV_DETAILED_ASSESSMENT.md" target="_blank" rel="noreferrer">
              <strong>Detailed Assessment</strong>
            </a>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              System metrics, pass-statement analysis, and implementation recommendations.
            </p>
          </article>

          <article className="kev-card">
            <a href="/KEV_ECOSYSTEM_COMPLETE_SUMMARY.md" target="_blank" rel="noreferrer">
              <strong>Ecosystem Summary</strong>
            </a>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Vision-level summary of KEV’s architecture, VR facilities, and global deployment.
            </p>
          </article>

          <article className="kev-card">
            <a href="/README.md" target="_blank" rel="noreferrer">
              <strong>Developer README</strong>
            </a>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Installation and quick-start instructions for backend and frontend development.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
