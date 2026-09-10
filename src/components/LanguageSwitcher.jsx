import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, setLanguage, getAnswerLanguage, setAnswerLanguage } from '../i18n/index.js'
import { xrClient } from '../lib/xrClient'

// UI language picker (6 full bundles) + world browser (198 countries).
// Students whose home language has no UI bundle keep translated-tutor
// answers in it: chrome follows the UI language, answers follow the answer
// language. Persisted separately (kev_language / kev_answer_language).
export default function LanguageSwitcher({ compact }) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [countries, setCountries] = useState([])
  const [countryCode, setCountryCode] = useState('')
  const [countryLangs, setCountryLangs] = useState([])
  const [answerLang, setAnswerLang] = useState(() => getAnswerLanguage())
  const [worldError, setWorldError] = useState(false)

  useEffect(() => {
    if (!expanded || countries.length > 0 || worldError) return
    let cancelled = false
    xrClient
      .worldLanguages()
      .then((data) => {
        if (!cancelled) setCountries(data.countries || [])
      })
      .catch(() => {
        if (!cancelled) setWorldError(true)
      })
    return () => {
      cancelled = true
    }
  }, [expanded, countries.length, worldError])

  const pickCountry = async (code) => {
    setCountryCode(code)
    if (!code) {
      setCountryLangs([])
      return
    }
    try {
      const data = await xrClient.worldLanguages(code)
      const langs = data.languages || []
      setCountryLangs(langs)
      // Prefer a UI-bundled language for chrome; answer follows the pick.
      const uiMatch = langs.find((l) => SUPPORTED_LANGUAGES.some((s) => s.code === l.code))
      if (uiMatch) {
        await setLanguage(uiMatch.code)
        setAnswerLanguage(null)
        setAnswerLang(uiMatch.code)
      } else if (langs.length > 0) {
        setAnswerLanguage(langs[0].code)
        setAnswerLang(langs[0].code)
      }
    } catch {
      /* keep current selection */
    }
  }

  const pickAnswerLanguage = (code) => {
    if (!code || code === i18n.language) {
      setAnswerLanguage(null)
      setAnswerLang(i18n.language)
    } else {
      setAnswerLanguage(code)
      setAnswerLang(code)
    }
  }

  const answerDiffers = answerLang && answerLang !== i18n.language
  const answerName = countryLangs.find((l) => l.code === answerLang)?.native || answerLang

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} title={t('nav.language')}>
        <span aria-hidden="true">🌍</span>
        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {t('nav.language')}
        </span>
        <select
          value={i18n.language}
          onChange={(e) => {
            setLanguage(e.target.value)
            setAnswerLanguage(null)
            setAnswerLang(e.target.value)
          }}
          aria-label={t('nav.language')}
          style={{
            font: 'inherit',
            fontSize: compact ? '0.8rem' : '0.85rem',
            padding: '0.3rem 0.4rem',
            borderRadius: 6,
            border: '1px solid #e2d8bd',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            maxWidth: compact ? 110 : undefined,
          }}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {compact ? l.code.toUpperCase() : l.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title="198 countries · tutor answers in your home language"
        style={{ font: 'inherit', fontSize: '0.8rem', background: 'transparent', border: '1px solid #e2d8bd', borderRadius: 6, padding: '0.3rem 0.5rem', cursor: 'pointer', color: 'inherit' }}
      >
        198 🌍
      </button>
      {expanded && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          {worldError || countries.length === 0 ? (
            <small style={{ opacity: 0.7 }}>{worldError ? 'offline' : '…'}</small>
          ) : (
            <>
              <select
                value={countryCode}
                onChange={(e) => pickCountry(e.target.value)}
                aria-label="Country"
                style={{ font: 'inherit', fontSize: '0.8rem', padding: '0.3rem 0.4rem', borderRadius: 6, border: '1px solid #e2d8bd', background: 'transparent', color: 'inherit', cursor: 'pointer', maxWidth: 150 }}
              >
                <option value="">Country…</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              {countryLangs.length > 0 && (
                <select
                  value={answerDiffers ? answerLang : ''}
                  onChange={(e) => pickAnswerLanguage(e.target.value)}
                  aria-label="Answer language"
                  style={{ font: 'inherit', fontSize: '0.8rem', padding: '0.3rem 0.4rem', borderRadius: 6, border: '1px solid #e2d8bd', background: 'transparent', color: 'inherit', cursor: 'pointer', maxWidth: 150 }}
                >
                  <option value="">Answers: {i18n.language.toUpperCase()}</option>
                  {countryLangs.map((l) => (
                    <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
                  ))}
                </select>
              )}
            </>
          )}
        </span>
      )}
      {answerDiffers && (
        <small style={{ opacity: 0.75 }} title="UI stays translated; tutor answers follow your home language">
          answers: {answerName}
        </small>
      )}
    </span>
  )
}
