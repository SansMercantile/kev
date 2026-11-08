import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, setLanguage, getAnswerLanguage, setAnswerLanguage } from '../i18n/index.js'
import { xrClient } from '../lib/xrClient'

// ---------------------------------------------------------------- geo detect
// Best-effort, privacy-light country detection for the flag chip: the
// browser's own region (Intl locale, then navigator.languages, then timezone)
// mapped to an ISO country code. No IP geolocation call, nothing leaves the
// device. Falls back to '' (globe) when it can't tell.
const LOCALE_COUNTRY = {
  'en-US': 'US', 'en-GB': 'GB', 'en-ZA': 'ZA', 'en-AU': 'AU', 'en-CA': 'CA',
  'en-IE': 'IE', 'en-NG': 'NG', 'en-KE': 'KE', 'en-IN': 'IN', 'en-NZ': 'NZ',
  'en-GH': 'GH', 'en-ZW': 'ZW', 'en-BW': 'BW', 'en-NA': 'NA', 'en-ZM': 'ZM',
  'af-ZA': 'ZA', 'zu-ZA': 'ZA', 'xh-ZA': 'ZA', 'st-ZA': 'ZA', 'tn-ZA': 'ZA', 'tn-BW': 'BW',
  'fr-FR': 'FR', 'fr-CA': 'CA', 'fr-BE': 'BE', 'fr-CH': 'CH', 'fr-SN': 'SN', 'fr-CI': 'CI',
  'es-ES': 'ES', 'es-MX': 'MX', 'es-AR': 'AR', 'es-CO': 'CO', 'es-CL': 'CL', 'es-PE': 'PE',
  'pt-BR': 'BR', 'pt-PT': 'PT', 'de-DE': 'DE', 'it-IT': 'IT', 'nl-NL': 'NL',
  'sw-KE': 'KE', 'sw-TZ': 'TZ', 'am-ET': 'ET', 'ar-EG': 'EG', 'ar-SA': 'SA',
}
const TIMEZONE_COUNTRY = {
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
  'Africa/Accra': 'GH', 'Africa/Harare': 'ZW', 'Africa/Gaborone': 'BW',
  'Africa/Windhoek': 'NA', 'Africa/Lusaka': 'ZM', 'Africa/Cairo': 'EG',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO', 'America/Santiago': 'CL', 'America/Lima': 'PE',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ', 'Asia/Kolkata': 'IN',
}
const COUNTRY_NAMES = {
  ZA: 'South Africa', US: 'United States', GB: 'United Kingdom', CA: 'Canada',
  AU: 'Australia', NZ: 'New Zealand', IE: 'Ireland', NG: 'Nigeria', KE: 'Kenya',
  GH: 'Ghana', ZW: 'Zimbabwe', BW: 'Botswana', NA: 'Namibia', ZM: 'Zambia',
  IN: 'India', FR: 'France', ES: 'Spain', MX: 'Mexico', AR: 'Argentina', CO: 'Colombia',
  CL: 'Chile', PE: 'Peru', BR: 'Brazil', PT: 'Portugal', DE: 'Germany', IT: 'Italy',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', SN: 'Senegal', CI: "Côte d'Ivoire",
  EG: 'Egypt', SA: 'Saudi Arabia', ET: 'Ethiopia', TZ: 'Tanzania',
}

/** Countries we ship an SVG flag for (public/flags/<code>.svg, from the
 * flag-icons set). The flag chip shows the real SVG image so it renders on
 * every OS (Windows doesn't render regional-indicator flag emoji). */
const FLAG_CODES = new Set([
  'ZA', 'US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'NG', 'KE', 'GH', 'ZW', 'BW',
  'NA', 'ZM', 'IN', 'FR', 'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'BR', 'PT',
  'DE', 'IT', 'NL', 'BE', 'CH', 'SN', 'CI', 'EG', 'SA', 'ET', 'TZ',
])

function CountryFlag({ code, size = 18 }) {
  if (!code || !FLAG_CODES.has(code)) return null
  return (
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={COUNTRY_NAMES[code] || code}
      width={size}
      height={Math.round(size * 0.75)}
      style={{ display: 'block', borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }}
    />
  )
}

function detectCountry() {
  try {
    const candidates = []
    const loc = Intl.DateTimeFormat().resolvedOptions().locale
    if (loc) candidates.push(loc)
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages)
    else if (navigator.language) candidates.push(navigator.language)
    for (const c of candidates) {
      if (!c) continue
      if (LOCALE_COUNTRY[c]) return LOCALE_COUNTRY[c]
      const region = c.split('-')[1]
      if (region && /^[A-Z]{2}$/.test(region)) return region
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && TIMEZONE_COUNTRY[tz]) return TIMEZONE_COUNTRY[tz]
  } catch { /* detection is best-effort */ }
  return ''
}

// UI language picker (6 full bundles) + world browser (198 countries).
// Students whose home language has no UI bundle keep translated-tutor
// answers in it: chrome follows the UI language, answers follow the answer
// language. Persisted separately (kev_language / kev_answer_language).
export default function LanguageSwitcher({ compact }) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [countries, setCountries] = useState([])
  const [countryCode, setCountryCode] = useState(() => detectCountry())
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
            color: '#ffffff',
            cursor: 'pointer',
            maxWidth: compact ? 110 : undefined,
          }}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} style={{ color: '#20242b' }}>
              {compact ? l.code.toUpperCase() : l.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={
          countryCode && COUNTRY_NAMES[countryCode]
            ? `${COUNTRY_NAMES[countryCode]} · 198 countries · tutor answers in your home language`
            : '198 countries · tutor answers in your home language'
        }
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 30, minHeight: 26, font: 'inherit', fontSize: '0.75rem', lineHeight: 1, background: 'transparent', border: '1px solid #e2d8bd', borderRadius: 6, padding: '0.25rem 0.4rem', cursor: 'pointer', color: '#ffffff', fontWeight: 600 }}
      >
        {FLAG_CODES.has(countryCode) ? <CountryFlag code={countryCode} /> : (countryCode || '198')}
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
