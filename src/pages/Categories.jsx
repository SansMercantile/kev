import React from 'react'
import { categoryBlocks } from '../lib/data'
import { CheckIcon, StarIcon } from '../lib/icons'

export default function Categories() {
  return (
    <main className="kev-section">
      <section id="categories" className="kev-section" aria-label="Specialized learning domains">
        <h2 className="kev-section-title">Specialized KEV Learning Domains</h2>
        <p className="kev-section-copy">
          KEV is structured as six focused education domains, each backed by a set of intelligent
          tutors and subject-specific agents.
        </p>

        <div className="kev-grid kev-grid-3">
          {categoryBlocks.map((category) => (
            <article key={category.id} className="kev-card kev-category-card">
              <div className="kev-category-icon" style={{ background: category.color }}>
                <StarIcon className="animated-icon" width={20} height={20} aria-hidden="true" />
              </div>
              <h3 className="kev-card-title">{category.title}</h3>
              <p className="kev-card-text">{category.subtitle}</p>
              <p className="kev-card-text" style={{ marginTop: '1rem', fontWeight: 700 }}>
                {category.stats}
              </p>
              <div style={{ marginTop: '1rem' }}>
                {category.features.map((feature) => (
                  <div key={feature} className="kev-feature" style={{ marginBottom: '0.75rem' }}>
                    <div className="kev-feature-icon">
                      <CheckIcon className="animated-check" width={16} height={16} aria-label="Check" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
