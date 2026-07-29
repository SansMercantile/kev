import React, { useEffect, useState } from 'react'
import { getCurriculumRecommendations } from '../lib/api'
import { heroFeatures } from '../lib/data'

export default function Curriculum() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const result = await getCurriculumRecommendations(['math_101'])
        setRecommendations(result.recommended_subjects || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [])

  return (
    <main className="kev-section">
      <section id="curriculum" className="kev-section" aria-label="Core capabilities">
        <h2 className="kev-section-title">Curriculum Recommendations</h2>
        <p className="kev-section-copy">
          KEV uses completed student progress to recommend the next best subjects and learning experiences.
        </p>

        <div className="kev-grid kev-grid-3">
          {heroFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="kev-card">
                <div className="kev-feature">
                  <div className="kev-feature-icon">
                    <Icon className="animated-icon" width={18} height={18} aria-hidden="true" />
                  </div>
                  <div>
                    <strong>{feature.title}</strong>
                    <p className="kev-card-text">{feature.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <section className="kev-section" style={{ marginTop: '2rem' }}>
          <h3 className="kev-section-title">Recommended Next Subjects</h3>
          {loading && <p>Loading recommendations from the KEV curriculum engine...</p>}
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          {!loading && !error && (
            <div className="kev-grid kev-grid-2">
              {recommendations.length > 0 ? (
                recommendations.map((subject) => (
                  <div key={subject.id || subject.name} className="kev-card">
                    <strong>{subject.name}</strong>
                    <p className="kev-card-text">{subject.description || 'Recommended subject content'}</p>
                    <small style={{ color: '#64748b' }}>Dependencies: {subject.dependencies?.join(', ') || 'None'}</small>
                  </div>
                ))
              ) : (
                <div className="kev-card">
                  <p className="kev-card-text">No recommendations available yet. Add more completed subjects to see future learning steps.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
