import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCurriculumRecommendations, getCurriculumSubjects } from '../lib/api'
import { heroFeatures } from '../lib/data'
import { xrClient } from '../lib/xrClient'
import TutorAskPanel from '../components/TutorAskPanel'
import SurfaceLinks from '../components/SurfaceLinks'

export default function Curriculum() {
  const { t } = useTranslation()
  const [catalog, setCatalog] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [completedInput, setCompletedInput] = useState('math_101')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [levels, setLevels] = useState([])
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Every curriculum subject mapped to its faculty tutor (GET /xr/subjects
  // merges the live engine, so newly added subjects appear automatically).
  const [subjectTutors, setSubjectTutors] = useState({})
  const [askSubjectId, setAskSubjectId] = useState('')

  const loadRecommendations = async (completedIds) => {
    // NOTE: /curriculum/recommendations/{completed} returns id strings;
    // resolve them against the full catalog for display.
    const [result, catalogData] = await Promise.all([
      getCurriculumRecommendations(completedIds),
      getCurriculumSubjects(),
    ])
    const byId = {}
    ;(catalogData.subjects || []).forEach((s) => {
      byId[s.id] = s
    })
    setCatalog(catalogData.subjects || [])
    const ids = result.recommended_subjects || []
    setRecommendations(ids.map((id) => byId[id] || { id, name: id, description: 'Recommended subject content' }))
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([loadRecommendations(['math_101']), xrClient.levels().catch(() => ({ levels: [] })), xrClient.tracks().catch(() => ({ tracks: [] })), xrClient.subjects().catch(() => ({}))])
      .then(([, levelsData, tracksData, subjectsData]) => {
        if (cancelled) return
        setLevels(levelsData.levels || [])
        setTracks(tracksData.tracks || [])
        const byId = {}
        ;(subjectsData.curriculumSubjects || []).forEach((s) => {
          byId[s.id] = s
        })
        setSubjectTutors(byId)
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

  const refreshRecommendations = (e) => {
    e?.preventDefault()
    const ids = completedInput.split(',').map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) return
    setLoading(true)
    loadRecommendations(ids)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const q = catalogQuery.toLowerCase().trim()
  const visibleCatalog = useMemo(
    () =>
      catalog.filter(
        (s) =>
          !q ||
          s.name?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.id?.toLowerCase().includes(q)
      ),
    [catalog, q]
  )

  return (
    <main className="kev-section">
      <section id="curriculum" className="kev-section" aria-label="Core capabilities">
        <h2 className="kev-section-title">{t('curriculum.title')}</h2>
        <p className="kev-section-copy">
          {catalog.length > 0
            ? t('curriculum.subtitleLive', { count: catalog.length })
            : t('curriculum.subtitleStatic')}
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

        <section className="kev-section" style={{ marginTop: '2rem' }} aria-label={t('curriculum.recTitle')}>
          <h3 className="kev-section-title">{t('curriculum.recTitle')}</h3>
          <form onSubmit={refreshRecommendations} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
            <input
              value={completedInput}
              onChange={(e) => setCompletedInput(e.target.value)}
              placeholder={t('curriculum.completedPlaceholder')}
              aria-label={t('curriculum.completedPlaceholder')}
              style={{ flex: '2 1 260px', padding: '0.55rem 0.7rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit', background: '#fff' }}
            />
            <button className="kev-btn kev-btn-primary" type="submit">{t('curriculum.updateRecs')}</button>
          </form>
          {loading && <p>{t('curriculum.loadingRecs')}</p>}
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          {!loading && !error && (
            <div className="kev-grid kev-grid-2">
              {recommendations.length > 0 ? (
                recommendations.map((subject) => (
                  <div key={subject.id || subject.name} className="kev-card">
                    <strong>{subject.name}</strong>
                    <p className="kev-card-text">{subject.description || t('curriculum.noRecs')}</p>
                    <small style={{ color: '#64748b' }}>{t('curriculum.dependencies', { deps: subject.dependencies?.join(', ') || t('curriculum.noDeps') })}</small>
                    {subjectTutors[subject.id] && (
                      <small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                        {t('curriculum.tutorLine', { name: subjectTutors[subject.id].tutor?.name })}
                        {subjectTutors[subject.id].immersive ? ` · ${t('curriculum.labReady', { lab: subjectTutors[subject.id].immersiveLabId })}` : ''}
                      </small>
                    )}
                  </div>
                ))
              ) : (
                <div className="kev-card">
                  <p className="kev-card-text">{t('curriculum.noRecs')}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="kev-section" style={{ marginTop: '2rem' }} aria-label={t('curriculum.catalogTitle')}>
          <h3 className="kev-section-title">{t('curriculum.catalogTitle')} ({visibleCatalog.length}{q ? ` of ${catalog.length}` : ''})</h3>
          <input
            value={catalogQuery}
            onChange={(e) => setCatalogQuery(e.target.value)}
            placeholder={t('curriculum.catalogSearch')}
            aria-label={t('curriculum.catalogSearch')}
            style={{ width: '100%', maxWidth: 480, padding: '0.55rem 0.7rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit', background: '#fff', margin: '1rem 0' }}
          />
          <div className="kev-grid kev-grid-3">
            {visibleCatalog.map((subject) => (
              <div key={subject.id} className="kev-card">
                <strong style={{ fontSize: '0.92rem' }}>{subject.name}</strong>
                <p className="kev-card-text">{subject.description}</p>
                <small style={{ color: '#64748b', display: 'block' }}>
                  <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 5 }}>{subject.id}</code>
                  {' '}· {t('curriculum.complexity', { score: subject.complexity_score ?? '—' })} · {(subject.credits ?? 1) === 1 ? t('curriculum.credits', { count: subject.credits ?? 1 }) : t('curriculum.creditsPlural', { count: subject.credits ?? 1 })}
                </small>
                {subject.dependencies?.length > 0 && (
                  <small style={{ color: '#b45309', display: 'block', marginTop: '0.2rem' }}>{t('curriculum.needs', { deps: subject.dependencies.join(', ') })}</small>
                )}
              </div>
            ))}
          </div>
        </section>

        {levels.length > 0 && (
          <section className="kev-section" style={{ marginTop: '2rem' }} aria-label={t('curriculum.levelsTitle')}>
            <h3 className="kev-section-title">{t('curriculum.levelsTitle')}</h3>
            <p className="kev-section-copy">{t('curriculum.levelsSubtitle')}</p>
            <div className="kev-grid kev-grid-3" style={{ marginTop: '1rem' }}>
              {levels.map((level) => (
                <div key={level.id} className="kev-card">
                  <strong>{level.label}</strong>
                  <p className="kev-card-text">{level.focus}</p>
                  <small style={{ color: '#64748b' }}>{level.grades}</small>
                </div>
              ))}
            </div>
          </section>
        )}

        {tracks.length > 0 && (
          <section className="kev-section" style={{ marginTop: '2rem' }} aria-label={t('curriculum.tracksTitle')}>
            <h3 className="kev-section-title">{t('curriculum.tracksTitle')}</h3>
            <div className="kev-grid kev-grid-2" style={{ marginTop: '1rem' }}>
              {tracks.map((track) => (
                <div key={track.id} className="kev-card">
                  <strong>{track.title}</strong>
                  <p className="kev-card-text">{track.overview}</p>
                  <small style={{ color: '#64748b', display: 'block' }}>
                    {t('curriculum.trackMeta', { modules: track.modulesCount, hours: track.estimatedHours, floor: track.floor, prereqs: track.prerequisites })}
                  </small>
                  <p className="kev-card-text" style={{ marginTop: '0.5rem' }}>
                    <a href="/xr-academy">{t('curriculum.openInXr')}</a> · <a href="/anatomy">{t('curriculum.previewInLab')}</a>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="kev-section" style={{ marginTop: '2rem' }} aria-label={t('curriculum.askTitle')}>
          <h3 className="kev-section-title">{t('curriculum.askTitle')}</h3>
          <p className="kev-section-copy">
            {t('curriculum.askSubtitle')}
          </p>
          {Object.keys(subjectTutors).length > 0 ? (
            <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 720 }}>
              <select
                value={askSubjectId}
                onChange={(e) => setAskSubjectId(e.target.value)}
                aria-label={t('curriculum.chooseSubject')}
                style={{ padding: '0.55rem 0.7rem', borderRadius: 8, border: '1px solid #e2d8bd', font: 'inherit', background: '#fff' }}
              >
                <option value="">{t('curriculum.chooseSubject')}</option>
                {Object.values(subjectTutors).map((s) => (
                  <option key={s.id} value={s.id}>
                    {t('curriculum.subjectOption', { name: s.name, tutor: s.tutor?.name || 'KEV tutor', lab: s.immersive ? t('curriculum.subjectOptionLab') : '' })}
                  </option>
                ))}
              </select>
              {askSubjectId && subjectTutors[askSubjectId] && (
                <div className="kev-card">
                  <TutorAskPanel
                    key={askSubjectId}
                    tutorId={subjectTutors[askSubjectId].tutorId}
                    tutorName={subjectTutors[askSubjectId].tutor?.name}
                    subjectLabel={subjectTutors[askSubjectId].name}
                  />
                  {subjectTutors[askSubjectId].immersive && (
                    <p className="kev-card-text" style={{ marginTop: '0.75rem' }}>
                      <a href="/xr-academy">{t('curriculum.practiceIn', { lab: subjectTutors[askSubjectId].immersiveLabId })}</a>
                      {' '}· <a href="/anatomy">{t('curriculum.exploreIn')}</a>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="kev-card-text">{t('curriculum.loadingIndex')}</p>
          )}
        </section>

        <SurfaceLinks
          title={t('surface.continueInKev')}
          links={[
            { to: '/xr-academy', label: t('nav.xrAcademy'), text: 'Chemistry, astrophysics, biology & optics simulations with AI tutors.' },
            { to: '/anatomy', label: t('nav.immersiveLab'), text: 'Dissect anatomy, plant, bridge, vehicle & earth systems.' },
            { to: '/agents', label: t('nav.agents'), text: 'Faculty mentors for every subject.' },
          ]}
        />
      </section>
    </main>
  )
}
