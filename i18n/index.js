import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zu from './locales/zu.json'
import xh from './locales/xh.json'
import af from './locales/af.json'
import fr from './locales/fr.json'
import es from './locales/es.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zu', label: 'isiZulu' },
  { code: 'xh', label: 'isiXhosa' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
]

const STORAGE_KEY = 'kev_language'
const ANSWER_KEY = 'kev_answer_language'

function queryLang() {
  try {
    const code = new URLSearchParams(window.location.search).get('lang')
    return code ? code.toLowerCase() : null
  } catch {
    return null
  }
}

function detectLanguage() {
  // Shared constellation semantics: ?lang override, then saved choice,
  // then browser language, then English.
  const override = queryLang()
  if (override && SUPPORTED_LANGUAGES.some((l) => l.code === override)) return override
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    /* storage unavailable */
  }
  const browser = typeof navigator !== 'undefined' ? (navigator.language || '').slice(0, 2).toLowerCase() : ''
  if (SUPPORTED_LANGUAGES.some((l) => l.code === browser)) return browser
  return 'en'
}

export function getCurrentLanguage() {
  return i18n.language || detectLanguage()
}

export function setLanguage(code) {
  const normalized = SUPPORTED_LANGUAGES.some((l) => l.code === code) ? code : 'en'
  try {
    localStorage.setItem(STORAGE_KEY, normalized)
  } catch {
    /* storage unavailable */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized
    document.documentElement.dir = 'ltr' // all 6 UI bundles are LTR; answer text uses dir="auto"
  }
  return i18n.changeLanguage(normalized)
}

// -- Answer language: the language tutors reply in ---------------------------
// Defaults to the UI language. Students in any of the 198 catalogued
// countries can additionally pick a home language with no UI bundle — chrome
// stays in the UI language while answers follow the home language.
export function getAnswerLanguage() {
  try {
    const override = localStorage.getItem(ANSWER_KEY)
    if (override) return override
  } catch {
    /* storage unavailable */
  }
  return getCurrentLanguage()
}

export function setAnswerLanguage(code) {
  try {
    if (!code) localStorage.removeItem(ANSWER_KEY)
    else localStorage.setItem(ANSWER_KEY, code)
  } catch {
    /* storage unavailable */
  }
}

if (!i18n.isInitialized) {
  const initial = detectLanguage()
  if (typeof document !== 'undefined') {
    document.documentElement.lang = initial
    document.documentElement.dir = 'ltr'
  }
  // ?lang=xx for a world language without a UI bundle presets the answer
  // language (tutor replies) while chrome falls back per detectLanguage().
  try {
    const override = new URLSearchParams(window.location.search).get('lang')
    if (override && !SUPPORTED_LANGUAGES.some((l) => l.code === override.toLowerCase())) {
      localStorage.setItem(ANSWER_KEY, override.toLowerCase())
    }
  } catch {
    /* storage unavailable */
  }
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      zu: { translation: zu },
      xh: { translation: xh },
      af: { translation: af },
      fr: { translation: fr },
      es: { translation: es },
    },
    lng: initial,
    fallbackLng: 'en',
    returnEmptyString: false,
    interpolation: { escapeValue: false },
  })
}

export default i18n
