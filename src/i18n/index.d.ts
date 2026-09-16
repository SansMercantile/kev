/**
 * Type declarations for `src/i18n/index.js`.
 *
 * The i18n bootstrap is plain JavaScript shared with the JS-only parts of the
 * app, but `AILabTutorModal.tsx` and `XRClassroom.tsx` import `getAnswerLanguage`
 * from it. Under `strict` that import resolved to an implicit `any`, so the
 * language a tutor replies in was never actually type-checked at the call site.
 *
 * These declarations describe the module as implemented; no runtime behaviour
 * changes. Keep in step with `index.js`.
 */

import type { i18n as I18nInstance } from 'i18next';

/** A UI language that ships with a bundled translation resource. */
export interface SupportedLanguage {
  /** BCP-47-ish short code used as the i18next language key. */
  code: string;
  /** Human-readable label, in that language's own orthography. */
  label: string;
}

/**
 * The six languages with full UI bundles: English, isiZulu, isiXhosa,
 * Afrikaans, Français and Español.
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[];

/** Active UI language, falling back to browser/query detection. */
export function getCurrentLanguage(): string;

/**
 * Set the UI language. Unknown codes are normalised to `'en'`; the choice is
 * persisted to `localStorage`.
 */
export function setLanguage(code: string): void;

/**
 * Language the AI tutor should answer in.
 *
 * Independent of the UI chrome language: a `?lang=xx` query for a world language
 * that has no UI bundle presets the *answer* language while the interface still
 * falls back to a supported one. Defaults to `getCurrentLanguage()`.
 */
export function getAnswerLanguage(): string;

/**
 * Override the answer language. Passing a falsy value clears the override so it
 * tracks the UI language again.
 */
export function setAnswerLanguage(code: string | null | undefined): void;

/** The configured i18next instance (already bound to `initReactI18next`). */
declare const i18n: I18nInstance;
export default i18n;
