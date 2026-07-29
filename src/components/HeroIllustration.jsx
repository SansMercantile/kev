import React from 'react'

export default function HeroIllustration(props) {
  return (
    <svg
      viewBox="0 0 600 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="kevGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="600" height="420" rx="20" fill="url(#kevGrad)" />

      <g transform="translate(40,60)">
        <rect x="12" y="100" width="200" height="120" rx="10" fill="#fff" fillOpacity="0.92" />
        <path d="M28 108h172" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 124h140" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
        <circle cx="380" cy="40" r="48" fill="#60a5fa" fillOpacity="0.08" />
        <path d="M352 34c10 14 30 14 40 0" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
        <polygon points="480,160 492,190 524,190 498,208 510,240 480,220 450,240 462,208 436,190 468,190" fill="#fdba74" fillOpacity="0.08" />
      </g>
    </svg>
  )
}
