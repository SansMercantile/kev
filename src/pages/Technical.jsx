import React from 'react'

export default function Technical() {
  return (
    <main className="kev-section">
      <section id="technical" className="kev-section" aria-label="Technical snapshot">
        <h2 className="kev-section-title">Technical Snapshot</h2>
        <p className="kev-section-copy">
          Key implementation metrics pulled from the KEV codebase and system reports.
        </p>

        <div className="kev-grid kev-grid-2">
          <div className="kev-card">
            <strong>Codebase Size</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>78,305</span>
              <br />lines of code (repository total)
            </p>
          </div>

          <div className="kev-card">
            <strong>Repository Footprint</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>1,130</span>
              <br />Python files in KEV
            </p>
          </div>

          <div className="kev-card">
            <strong>Agent Coverage</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>1,000+</span>
              <br />multi-agent implementations across 185+ subjects
            </p>
          </div>

          <div className="kev-card">
            <strong>Completion Estimate</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>98%</span>
              <br />system completeness based on assessment reports
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
