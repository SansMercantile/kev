import React from 'react'
import { useTranslation } from 'react-i18next'

// Cross-surface navigation cards. Plain anchors + inline styles (no theme
// dependency) so the component works on kev-themed pages, Tailwind pages,
// and inside the XR Academy alike. This is what keeps KEV's many surfaces
// (campus map, VR, immersive labs, XR Academy, curriculum, tutors) linked
// instead of siloed.
export default function SurfaceLinks({ title, links }) {
  const { t } = useTranslation()
  const heading = title || t('surface.continueInKev')
  if (!links || links.length === 0) return null
  return (
    <section aria-label={heading} style={{ marginTop: '2rem', borderTop: '1px solid #e2d8bd', paddingTop: '1.25rem' }}>
      <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem', color: 'inherit' }}>{heading}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
        {links.map((link) => (
          <a
            key={link.to}
            href={link.to}
            style={{
              display: 'block',
              border: '1px solid #e2d8bd',
              borderRadius: 8,
              padding: '0.75rem 0.9rem',
              textDecoration: 'none',
              color: 'inherit',
              background: 'rgba(255,255,255,0.6)',
            }}
          >
            <strong style={{ display: 'block', fontSize: '0.92rem' }}>{link.label}</strong>
            {link.text && <span style={{ display: 'block', fontSize: '0.82rem', opacity: 0.75, marginTop: '0.2rem' }}>{link.text}</span>}
          </a>
        ))}
      </div>
    </section>
  )
}
