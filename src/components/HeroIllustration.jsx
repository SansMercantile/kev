import React from 'react'

// A real signature illustration tied to the KEV mark itself (open book,
// gold ribbon bookmark) - not a generic gradient blob + dashboard card.
export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 420" width="100%" height="100%" role="img" aria-label="An open book with a gold ribbon bookmark, representing KEV's curriculum library">
      <defs>
        <linearGradient id="kev-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf8" />
          <stop offset="100%" stopColor="#f2e9d6" />
        </linearGradient>
        <linearGradient id="kev-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2c874" />
          <stop offset="100%" stopColor="#c9a227" />
        </linearGradient>
      </defs>

      {/* stacked subject "pages" fanning out behind the open book */}
      <g opacity="0.5">
        <rect x="70" y="60" width="130" height="170" rx="4" fill="#8a3324" transform="rotate(-14 135 145)" />
        <rect x="220" y="55" width="130" height="170" rx="4" fill="#3c4a68" transform="rotate(11 285 140)" />
      </g>

      {/* the open book */}
      <g>
        <path d="M60 320 L205 300 L205 130 L60 148 Z" fill="url(#kev-page)" stroke="#e2d8bd" strokeWidth="1.5" />
        <path d="M350 320 L205 300 L205 130 L350 148 Z" fill="url(#kev-page)" stroke="#e2d8bd" strokeWidth="1.5" />
        <path d="M60 148 L205 130 L350 148 L205 168 Z" fill="#0b1830" opacity="0.06" />

        {/* text lines on each page, standing in for curriculum content */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={`l-${i}`} x={82} y={172 + i * 24} width={100 - i * 6} height="4" rx="2" fill="#c9bfa0" />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={`r-${i}`} x={222} y={172 + i * 24} width={100 - i * 6} height="4" rx="2" fill="#c9bfa0" />
        ))}
      </g>

      {/* gold ribbon bookmark, threading down through the spine */}
      <path d="M195 92 L215 92 L215 250 L205 236 L195 250 Z" fill="url(#kev-ribbon)" />

      {/* small maroon tree emblem, echoing the KEV mark */}
      <circle cx="205" cy="112" r="9" fill="#8a3324" />
    </svg>
  )
}
