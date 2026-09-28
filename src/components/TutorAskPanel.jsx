import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { xrClient } from '../lib/xrClient'
import { setAuthToken } from '../lib/api'
import { useOptionalAuth } from '../lib/useOptionalAuth'
import { getStudyLevelId, studyLevelLabel } from '../xr/lib/studyLevel'
import { getTierId } from '../xr/lib/studyTier'
import { getAnswerLanguage } from '../i18n/index.js'

const safeHref = (url, fallback) => {
  if (!url || typeof url !== 'string') return fallback
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href
    }
    return fallback
  } catch {
    return fallback
  }
}

// Shared "ask a faculty tutor about what you're inspecting" panel for every
// surface (Immersive Lab, Human Atlas, Curriculum subjects). Signed-in users
// get a live level-aware Bedrock answer; signed-out users get a sign-in
// prompt (the endpoints require auth because every call spends Bedrock money).
//
// Props: tutorId (faculty endpoint) or omit for the generic lab tutor;
// studentLevel defaults to the shared study-level selector; tier defaults to
// the shared science-tier selector (adaptive register/math formality - M5 of
// docs/KEV_TOOLS_ROADMAP.md, so dr-vance and dr-ward answer at the tier the
// student picked).
export default function TutorAskPanel({ tutorId, tutorName, subjectLabel, partName, simulationState, studentLevel, tier }) {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useOptionalAuth()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [answerDemo, setAnswerDemo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [paywalled, setPaywalled] = useState(null)
  const level = studentLevel || getStudyLevelId()
  const tierId = tier || getTierId()

  if (!isAuthenticated) {
    return (
      <div style={{ borderTop: '1px solid #23415e', paddingTop: '1rem', display: 'grid', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1rem', margin: 0 }}>{tutorName ? t('tutor.askNamed', { name: tutorName }) : t('tutor.askGeneric')}</h2>
        <p style={{ color: '#b9c8d9', fontSize: '0.85rem', margin: 0 }}>
          {t('tutor.signInPrompt', { target: partName || subjectLabel || '' })}
        </p>
        {loginWithRedirect && (
          <button className="kev-btn" onClick={() => loginWithRedirect()}>{t('tutor.signInToAsk')}</button>
        )}
      </div>
    )
  }

  const ask = async (text) => {
    const q = (text || question).trim()
    if (!q || loading) return
    setLoading(true)
    setError(null)
    setPaywalled(null)
    try {
      if (getAccessTokenSilently) {
        try {
          setAuthToken(await getAccessTokenSilently())
        } catch {
          /* fall through with the synced token */
        }
      }
      const data = tutorId
        ? await xrClient.askTutor({
            tutorId,
            question: q,
            facilityContext: `Curriculum study: ${subjectLabel || 'general'}${partName ? ` — inspecting "${partName}"` : ''}`,
            studentLevel: level,
            tier: tierId,
            language: getAnswerLanguage(),
          })
        : await xrClient.askLabTutor({
            question: q,
            currentLab: subjectLabel,
            context: `Immersive 3D viewer (${subjectLabel}) — inspecting "${partName || 'the model'}".`,
            simulationState: simulationState || {},
            studentLevel: level,
            tier: tierId,
            language: getAnswerLanguage(),
          })
      setAnswer(data.answer)
      setAnswerDemo(Boolean(data.isDemoGuidance))
      setQuestion('')
    } catch (err) {
      // 402 carries the upgrade payload from the billing API.
      if (err?.status === 402 && err?.detail) {
        setPaywalled(err.detail)
      } else {
        setError(t('tutor.unavailable'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ borderTop: '1px solid #23415e', paddingTop: '1rem', display: 'grid', gap: '0.5rem' }}>
      <h2 style={{ fontSize: '1rem', margin: 0 }}>
        {tutorName ? t('tutor.askNamed', { name: tutorName }) : t('tutor.askGeneric')}{' '}
        <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#8fa3b8' }}>{t('tutor.levelChip', { label: studyLevelLabel(level) })}</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask()
        }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('tutor.questionPlaceholder', { target: partName || subjectLabel || '' })}
          aria-label={t('tutor.askGeneric')}
          style={{ flex: 1, background: '#07111f', border: '1px solid #23415e', borderRadius: 6, color: '#f8fafc', padding: '0.5rem 0.65rem', fontSize: '0.85rem' }}
        />
        <button className="kev-btn" type="submit" disabled={loading || !question.trim()}>
          {loading ? t('tutor.asking') : t('tutor.ask')}
        </button>
      </form>
      {error && <p style={{ color: '#f0b35b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
      {paywalled && (
        <div style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid #c9a227', borderRadius: 6, padding: '0.65rem', fontSize: '0.85rem', color: '#dbe7f3', display: 'grid', gap: '0.5rem' }}>
          <strong>{paywalled.message || 'Monthly tutor quota exhausted.'}</strong>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a className="kev-btn" href={safeHref(paywalled.upgrade_url, '/pricing')}>See plans</a>
            <a className="kev-btn" href={safeHref(paywalled.billing_url, '/billing')}>Billing</a>
          </div>
        </div>
      )}
      {answer && (
        <div dir="auto" aria-live="polite" style={{ background: '#07111f', border: '1px solid #23415e', borderRadius: 6, padding: '0.65rem', fontSize: '0.85rem', lineHeight: 1.55, color: '#dbe7f3', whiteSpace: 'pre-line', maxHeight: 220, overflowY: 'auto' }}>
          {answerDemo && (
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)', fontFamily: 'monospace' }} title="Static offline guidance — reconnect for a live tutor answer">
                OFFLINE GUIDANCE
              </span>
            </div>
          )}
          {answer}
        </div>
      )}
    </div>
  )
}
