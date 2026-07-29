import React from 'react'

export default function Agents() {
  return (
    <main className="kev-section">
      <section id="agents" className="kev-section" aria-label="Agents Overview">
        <h2 className="kev-section-title">Agents Overview</h2>
        <p className="kev-section-copy">
          KEV runs a large multi-agent tutoring network spanning core curriculum, immersive
          environments, and policy tooling. Agents include Tutors, Teachers, Mentors,
          Experts, and Invigilators across primary through professional subjects.
        </p>

        <div className="kev-grid kev-grid-3">
          <div className="kev-card">
            <strong>Coverage</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              185+ standalone subjects across K-12, university, and professional learning.
            </p>
          </div>

          <div className="kev-card">
            <strong>Agent Types</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              Tutors, Teachers, Mentors, Experts, Invigilators — each role supports different
              pedagogical scenarios.
            </p>
          </div>

          <div className="kev-card">
            <strong>Implementations</strong>
            <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
              1,000+ agent implementations and counting — modular, namespaced under
              <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 6 }}>multi_agents/</code>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
