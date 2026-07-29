import React from 'react'
import { portalStats } from '../lib/data'

export default function Platform() {
  return (
    <main className="kev-section">
      <section id="platform" className="kev-section" aria-label="Platform impact metrics">
        <h2 className="kev-section-title">Platform Impact Metrics</h2>
        <p className="kev-section-copy">
          Real KEV metrics show platform scale, student engagement, and tutor effectiveness.
        </p>
        <div className="kev-grid kev-grid-2">
          {portalStats.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="kev-stat-card">
                <div style={{ flex: 1 }}>
                  <strong>{metric.value}</strong>
                  <small>{metric.label}</small>
                </div>
                <div style={{ color: metric.accent }}>
                  <Icon className="animated-icon" width={30} height={30} aria-hidden="true" />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
