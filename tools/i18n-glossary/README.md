# i18n Glossary Gate (T4)

Complements `npm run i18n:check` (raw key parity) by checking **WHAT** is
translated, per the roadmap's "glossary check per discipline":

1. Discipline-critical key groups (`xr.*`, `viewer.*`, `subjects.*`,
   `studyLevels.*`, `tutor.*`) exist and are non-empty in **every locale**
   (af, en, es, fr, xh, zu).
2. `glossary.json` - curated keys that must exist everywhere and must **not**
   still hold the English value in non-English locales (safeguarding- and
   discipline-facing strings; `requireTranslation: true`).
3. Reports per-locale translation coverage (% of values differing from
   English) as information.

## Run

```bash
node tools/i18n-glossary/check.cjs          # or: npm run i18n:glossary
node tools/i18n-glossary/check.cjs --json
```

Extend `glossary.json` per discipline as packs land. Exit `1` on violations.
