# KEV — XR Online School & Virtual Labs (frontend)

Public frontend for KEV: immersive 3D science labs, XR campus, curriculum,
tutors UI, billing portal, and account surfaces. Built with React 18, Vite 5,
Tailwind, Three.js, and react-i18next (6 UI languages + 90+ home languages
for tutor answers).

Live: https://kev.sansmercantile.com (auto-deploys from `main` via Vercel).

## Develop

```bash
npm install
npm run dev        # platform mode (:3002)
npm run dev:site   # site mode (:3003)
npm run build      # site production build (what Vercel runs)
npm run build:app  # platform production build
```

Quality gates: `npm run gates` (typecheck, i18n parity + glossary, atlas
integrity, attribution, API drift, campus-scene verification).

## Backend

The API (FastAPI on AWS ECS/Fargate + Bedrock tutors) lives in the private
constellation monorepo and is **not** part of this public repo. Locally the
dev server proxies `/api` to `http://localhost:8000`
(`VITE_API_BASE_URL` override supported). No backend secrets belong here —
never commit `.env` files or keys.

## License

MIT License — except third-party model data under `public/models`
(see `docs/ATTRIBUTION-human-atlas.md`, `docs/ATTRIBUTION-model-x.md`).
